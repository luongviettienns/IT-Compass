# Tech Stack

## Frontend

### Framework

**Lựa chọn:** React 19.2 + Vite 8

**Lý do:**
Frontend hiện dùng React, React Router, React Query và lazy loading. Vite đang là dev server và build tool chính.

### State Management

**Lựa chọn:** TanStack React Query + React Context

**Lý do:**
React Query đang xử lý server state, cache và retry. `AuthContext` giữ trạng thái phiên đăng nhập, người dùng và các hành động auth.

### Styling

**Lựa chọn:** Tailwind CSS 3.4 + CSS variables + utility helpers

**Lý do:**
`src/index.css` và `tailwind.config.js` cho thấy hệ thống theme dựa trên HSL variables, cùng các utility như `clsx` và `tailwind-merge`.

### Thư viện frontend bổ sung

| Thư viện | Mục đích | Phiên bản |
| --- | --- | --- |
| `react-router-dom` | Routing | 7.13.2 |
| `@tanstack/react-query` | Fetch/cache server state | 5.99.1 |
| `react-helmet-async` | SEO/meta tags | 3.0.0 |
| `sonner` | Toast notification | 2.0.7 |
| `motion` | Animation | 12.38.0 |
| `recharts` | Biểu đồ | 3.8.1 |
| `socket.io-client` | Realtime client | 4.8.3 |
| `react-hook-form` + `zod` | Form và validation | 7.72.1 + 4.3.6 |

## Backend

### Language

**Lựa chọn:** TypeScript trên Node.js

**Lý do:**
Backend compile từ `src` sang `dist`, dùng `NodeNext`, `strict` mode và TypeScript làm ngôn ngữ chính.

### Framework

**Lựa chọn:** Express 5.1

**Lý do:**
`backend/src/app.ts` mount toàn bộ route trên Express, kèm middleware, CORS, error handler và health check.

### Database

#### Primary Database

**Lựa chọn:** MySQL + Prisma 6.7

**Lý do:**
`schema.prisma` map sang các bảng legacy MySQL, đồng thời giữ type-safe access cho toàn bộ domain.

### Thư viện backend bổ sung

| Thư viện | Mục đích | Phiên bản |
| --- | --- | --- |
| `@prisma/client` | ORM client | 6.7.0 |
| `jsonwebtoken` | JWT access token | 9.0.3 |
| `bcryptjs` | Hash mật khẩu | 3.0.3 |
| `socket.io` | Realtime chat/notification | 4.8.3 |
| `multer` | Upload file | 2.1.1 |
| `cookie-parser` | Refresh cookie | 1.4.7 |
| `redis` | Rate limiting tùy chọn | 5.12.1 |
| `zod` | Validate input | 4.3.6 |

## Hạ tầng

### Hosting

**Trạng thái:** Chưa chốt trong repo

**Hiện trạng local/dev:**
- Frontend chạy trên `5173`
- Backend chạy trên `5000`

**Dịch vụ đang dùng:**
- Express API server
- Socket.IO trên cùng HTTP server
- Redis tùy chọn cho rate limiting production

### CI/CD

**Trạng thái:** Chưa khai báo trong repo

**Pipeline gợi ý theo code hiện có:**
1. lint
2. typecheck / build
3. validate Prisma
4. smoke test / browser pass nếu thay đổi UI

### Monitoring

**APM:** Chưa khai báo
**Logging:** logger nội bộ + metrics endpoint
**Alerting:** Chưa khai báo

### Hạ tầng bổ sung

| Dịch vụ | Mục đích | Nơi chạy |
| --- | --- | --- |
| Socket.IO | Realtime chat và notification | Backend app server |
| Prisma migrations | Quản lý schema | Backend repo |
| Redis | Rate limiting khi cần | External/optional |

## Công cụ phát triển

### Package manager

**Lựa chọn:** npm

### Kiểm thử và xác minh

| Loại | Công cụ hiện tại | Mục tiêu |
| --- | --- | --- |
| Unit | Chưa có test runner | Thêm theo track khi bắt đầu tính năng mới |
| Integration | Chưa có test runner | Kiểm tra luồng quan trọng |
| E2E | Chưa có test runner | Browser pass cho luồng UI quan trọng |

### Linting & type safety

**Linter:** ESLint 9 flat config
**Formatter:** Chưa có formatter riêng trong repo
**Type check:** TypeScript strict mode
**Prisma check:** `prisma validate`

### Công cụ bổ sung

| Công cụ | Mục đích |
| --- | --- |
| `tsx` | Chạy backend dev | 
| `vite` | Frontend dev/build |
| `prisma` | Schema, generate và validate |
| `socket.io` | Realtime |

## Quyết định kiến trúc

### 1. Tách frontend và backend thành hai package

**Ngày:** 2026-05-04
**Trạng thái:** Approved

**Bối cảnh:**
Repo hiện có hai app riêng biệt với vòng đời build và dev khác nhau.

**Quyết định:**
Giữ `frontend/` và `backend/` tách biệt, mỗi bên có script, config và build pipeline riêng.

**Hệ quả:**
- Rõ boundary hơn.
- Dễ tối ưu từng app.
- Cần đồng bộ contract ở ranh giới API.

---

### 2. Access token trong memory + refresh token qua cookie

**Ngày:** 2026-05-04
**Trạng thái:** Approved

**Bối cảnh:**
`authApi.ts` và `auth.service.ts` cho thấy luồng auth dùng memory access token và refresh cookie.

**Quyết định:**
Giữ access token trong memory, refresh token qua cookie an toàn hơn.

**Hệ quả:**
- Giảm bề mặt lộ token.
- Cần bootstrap refresh khi app load.
- Frontend phải xử lý session expired rõ ràng.

---

### 3. MySQL legacy schema map qua Prisma

**Ngày:** 2026-05-04
**Trạng thái:** Approved

**Bối cảnh:**
`schema.prisma` map nhiều bảng/enum tiếng Việt sang model TypeScript rõ nghĩa.

**Quyết định:**
Dùng Prisma map vào schema MySQL hiện có thay vì rewrite DB.

**Hệ quả:**
- Giữ được dữ liệu và naming legacy.
- Có type safety trong app.
- Cần cẩn thận khi thay đổi schema.

## Ma trận tương thích phiên bản

| Thành phần | Min | Max | Ghi chú |
| --- | --- | --- | --- |
| React | 19.2 | 19.x | Theo frontend hiện tại |
| TypeScript | 5.9 | 5.x | Strict mode cả hai package |
| Vite | 8.0.1 | 8.x | Dev/build frontend |
| Express | 5.1.0 | 5.x | API backend |
| Prisma | 6.7.0 | 6.x | ORM backend |
| Node.js | Không pin trong repo | Không pin trong repo | Dùng runtime Node hiện tại của môi trường dev |
