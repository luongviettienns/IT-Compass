# Phase 4A: Framework, Language, and Build Best Practices Review

## Executive Summary

Codebase nhìn chung đã dùng stack hiện đại (React 19, Express 5, TypeScript strict, Vite), nhưng vẫn còn một số chỗ chưa theo idiom mới của framework và có thể gây rủi ro về build/config hoặc làm code khó mở rộng. Các điểm nổi bật nhất là cấu hình Vite/TypeScript path alias chưa nhất quán, router React đang tự phân nhánh theo `pathname`, và các màn hình form/auth vẫn dùng state thủ công thay vì chuẩn hoá theo `react-hook-form` + Zod / mutation hooks.

## Findings

### Medium — `vite.config.ts` dùng `__dirname` trong file ESM

- **File:** `frontend/vite.config.ts:1-12`
- **Current pattern:**
  - File đang là ESM (`type: "module"`) nhưng lại dùng `__dirname` trực tiếp để resolve alias.
  - Trong môi trường ESM chuẩn của Node, `__dirname` không tồn tại; cách này phụ thuộc vào cách Vite/Node transpile và rất dễ lỗi khi đổi runner hoặc nâng cấp tooling.
- **Recommended pattern:**
  - Dùng `import.meta.url` + `fileURLToPath()` để resolve path trong ESM.
  - Đây là cách hiện đại, tương thích tốt với Vite + NodeNext.
- **Fix recommendation:**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

---

### Medium — TypeScript path alias được khai báo nhưng thiếu `baseUrl`

- **File:** `frontend/tsconfig.app.json:26-28` and `frontend/tsconfig.json:7-11`
- **Current pattern:**
  - `paths` được khai báo trong `tsconfig.app.json`, nhưng không có `baseUrl`.
  - `tsconfig.json` gốc cũng chỉ giữ `paths` mà không xác định root resolution rõ ràng.
- **Recommended pattern:**
  - Nếu đã dùng alias `@/*`, hãy khai báo `baseUrl` rõ ràng và giữ alias nhất quán giữa TypeScript và Vite.
  - Nếu không thật sự cần alias ở nhiều nơi, bỏ `paths` để giảm cấu hình chồng chéo.
- **Fix recommendation:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- **Why this matters:**
  - Giúp IDE, `tsc`, và Vite resolve module theo cùng một nguồn sự thật.
  - Tránh các lỗi kiểu “works in editor, fails in build”.

---

### Medium — Router layout đang phân nhánh thủ công theo `pathname`

- **File:** `frontend/src/App.tsx:50-137`
- **Current pattern:**
  - `AppShell` tự kiểm tra `pathname` để quyết định render admin / mentor / quiz / public shell.
  - Layout, guard và route table bị trộn trong cùng một component.
- **Recommended pattern:**
  - Dùng nested routes hoặc route config object để khai báo layout theo route tree.
  - Cách này hợp với idiom của React Router hiện đại hơn: route hierarchy rõ ràng, guard đặt gần route cần bảo vệ, dễ thêm `errorElement` / loader / action sau này.
- **Fix recommendation:**

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/auth/login', element: <AuthPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/profile', element: <ProfilePage /> },
      { path: '/messages', element: <MessagesPage /> },
    ],
  },
  {
    element: <ProtectedRoute requireRoles={['ADMIN']} />,
    children: [{ path: '/admin/*', element: <AdminPage /> }],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
```

- **Why this matters:**
  - Giảm điều kiện render rải rác.
  - Tránh layout logic bị “cứng” theo `pathname` string.
  - Dễ bảo trì khi route tăng dần.

---

### Medium — Bootstrap auth trong `AuthContext` là state machine thủ công, chưa theo pattern hook/query hiện đại

- **File:** `frontend/src/contexts/AuthContext.tsx:64-97`
- **Current pattern:**
  - `useEffect` tự gọi `authApi.refresh()` khi mount.
  - Dùng `cancelled` flag, `try/catch` trống, và set nhiều cờ state thủ công (`isLoading`, `isInitialized`, `isAuthenticated`).
  - Mọi lỗi refresh đều bị flatten thành “no session”.
- **Recommended pattern:**
  - Tách bootstrap sang custom hook hoặc dùng `useQuery`/`useMutation` để quản lý loading/error state có cấu trúc hơn.
  - Dùng state dạng discriminated union hoặc derived state để giảm số flag phải đồng bộ tay.
- **Fix recommendation:**

```tsx
const bootstrapQuery = useQuery({
  queryKey: ['auth', 'session'],
  queryFn: authApi.refresh,
  retry: false,
  staleTime: Infinity,
})

const authState = useMemo(() => ({
  user: bootstrapQuery.data?.user ?? null,
  isAuthenticated: Boolean(bootstrapQuery.data?.user),
  isLoading: bootstrapQuery.isLoading,
  isInitialized: bootstrapQuery.isFetched,
}), [bootstrapQuery.data, bootstrapQuery.isLoading, bootstrapQuery.isFetched])
```

- **Why this matters:**
  - Trạng thái auth trở nên rõ ràng hơn.
  - Dễ phân biệt “chưa load xong”, “không có session”, và “lỗi mạng/server”.
  - Giảm khả năng UI bị lock ở trạng thái khó đoán.

---

### Medium — Màn `ProfilePage` đang dùng form state thủ công thay vì chuẩn hoá với `react-hook-form` + Zod

- **File:** `frontend/src/pages/ProfilePage.tsx:115-223`
- **Current pattern:**
  - Form state được giữ bằng `useState` với object lớn.
  - Validate thủ công trong component.
  - Upload/save/update được xử lý trực tiếp trong page component.
- **Recommended pattern:**
  - Chuẩn hoá form bằng `react-hook-form` + `@hookform/resolvers/zod` + schema Zod.
  - Tách save/upload thành mutation hooks để component chỉ còn lo render và orchestration.
  - Đây cũng là cơ hội dùng lại các dependency đã có sẵn trong `frontend/package.json`.
- **Fix recommendation:**

```tsx
const profileSchema = z.object({
  fullName: z.string().min(2),
  birthYear: z.coerce.number().int().min(1900).max(new Date().getFullYear()).nullable(),
  phoneNumber: z.string().nullable(),
  // ...other fields
})

type ProfileFormValues = z.infer<typeof profileSchema>

const form = useForm<ProfileFormValues>({
  resolver: zodResolver(profileSchema),
  defaultValues: createFormValues(user),
})

const saveMutation = useMutation({
  mutationFn: userApi.updateProfile,
  onSuccess: async ({ user }) => {
    form.reset(createFormValues(user))
    await refreshUser()
  },
})
```

- **Package management note:**
  - `react-hook-form`, `@hookform/resolvers`, và `zod` đang nằm trong `frontend/package.json` nhưng chưa được dùng trong `src/`. Hoặc chuẩn hoá theo stack này, hoặc gỡ dependency để giảm lockfile/dependency surface không cần thiết.

---

### Low — `LandingPage` đang là một component monolith với nhiều section và helper logic

- **File:** `frontend/src/pages/LandingPage.tsx:49-220` (và phần còn lại của file)
- **Current pattern:**
  - Hero, animation helpers, section variants, và toàn bộ layout marketing nằm chung trong một file rất lớn.
  - File vừa chứa logic scroll/motion, vừa chứa UI content, vừa chứa data mapping.
- **Recommended pattern:**
  - Chia thành các section component nhỏ (`HeroSection`, `FeatureSection`, `StatsSection`, ...).
  - Đưa motion helpers vào hook/module riêng nếu tái sử dụng.
  - Lazy-load các block nặng nếu có animation/chart đặc biệt.
- **Fix recommendation:**

```tsx
function LandingPage() {
  return (
    <main>
      <HeroSection />
      <HowItWorksSection />
      <MentorHighlightsSection />
      <StatsSection />
    </main>
  )
}
```

- **Why this matters:**
  - Giảm độ phức tạp của file.
  - Dễ test và dễ chỉnh từng section.
  - Giữ đúng tinh thần “small, composable React components”.

---

### Low — Backend TypeScript build config còn nới lỏng `allowJs`

- **File:** `backend/tsconfig.json:2-21`
- **Current pattern:**
  - `allowJs: true` nhưng project backend thực tế đang build từ `src/**/*.ts`.
  - Với service TypeScript strict, `allowJs` làm rộng biên chương trình mà không rõ lợi ích.
- **Recommended pattern:**
  - Nếu không có nhu cầu nhập JS vào backend, bỏ `allowJs` để giữ codebase TS-only rõ ràng hơn.
  - Điều này giúp build, lint và refactor an toàn hơn.
- **Fix recommendation:**

```json
{
  "compilerOptions": {
    "allowJs": false,
    "checkJs": false,
    "strict": true
  },
  "include": ["src/**/*.ts"]
}
```

- **Why this matters:**
  - Giảm khả năng vô tình kéo file JS rời rạc vào pipeline build.
  - Giữ ranh giới TypeScript rõ hơn cho backend.

---

## Notes on deprecated APIs

- Không thấy API/framework nào đã rõ ràng deprecated trong các file đã kiểm tra.
- Điểm cần lưu ý hơn là “idiom drift” và build/config correctness: Vite ESM path resolution, TS alias config, router organization, và form/auth orchestration.

## Overall recommendation

Ưu tiên sửa 3 điểm sau trước:

1. Chuẩn hoá `vite.config.ts` và `tsconfig` alias để tránh lỗi build/config.
2. Refactor `App.tsx` sang route tree/layout chuẩn React Router.
3. Standardize form/auth flows bằng hook/query/form library thay vì state thủ công.

Sau đó mới tách dần `LandingPage` và `ProfilePage` thành các component/hook nhỏ hơn để cải thiện maintainability.
