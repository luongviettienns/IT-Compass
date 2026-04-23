/**
 * @file main.tsx - Điểm khởi động chính của ứng dụng React frontend.
 *
 * File này chịu trách nhiệm:
 * - Cấu hình React Query (QueryClient) với retry logic và error handling toàn cục.
 * - Tích hợp toast notification cho lỗi API (tự động hiển thị toast khi mutation thất bại).
 * - Bọc toàn bộ ứng dụng trong các Provider cần thiết (QueryClientProvider, Toaster, BrowserRouter).
 * - Mount ứng dụng vào DOM root element.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { getErrorMessage, shouldRetryRequest } from './lib/appError'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

/**
 * React Query client với cấu hình mặc định:
 * - Query: retry 1 lần, staleTime 60s, refetchOnWindowFocus = false.
 * - Mutation: không retry, tự động toast lỗi (trừ khi đặt skipGlobalErrorToast = true).
 *
 * Global mutation error handler: hiển thị toast thông báo lỗi tiếng Việt cho mọi mutation thất bại,
 * trừ những mutation đánh dấu skipGlobalErrorToast trong meta (để tự xử lý lỗi riêng).
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryRequest,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

queryClient.setMutationDefaults([], {
  onError: (error, _variables, _context, mutation) => {
    // Cho phép từng mutation chủ động skip toast khi muốn tự xử lý lỗi (ví dụ: form inline error).
    const skipToast = mutation.meta?.skipGlobalErrorToast === true
    if (!skipToast) {
      toast.error(getErrorMessage(error, 'Có lỗi xảy ra'))
    }
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster richColors position="top-center" />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
)
