# 03B. Documentation Review

## Tổng quan

Tài liệu hiện tại của ITCompass còn phân mảnh và chưa theo kịp implementation. Repo có README riêng cho backend/frontend, nhưng thiếu tài liệu gốc cấp dự án, thiếu API spec chuẩn, thiếu sơ đồ kiến trúc, và không có changelog/migration guide cho các thay đổi có khả năng làm vỡ tích hợp.

## Findings

| Severity | Khu vực | Vấn đề |
|---|---|---|
| High | README / onboarding | Thiếu README cấp repo, thiếu quickstart thống nhất cho full-stack stack |
| High | API documentation | API docs chỉ mô tả một phần nhỏ endpoint, không có schema/example |
| High | Documentation accuracy | README hiện tại có nhiều chi tiết lệch so với code thực tế |
| Medium | Architecture docs | Không có ADR, sơ đồ hệ thống, hay tài liệu component/runtime |
| Medium | Inline docs | Comment về business logic còn rời rạc, thiếu giải thích cho thuật toán cốt lõi |
| Medium | Changelog / migration | Không có changelog hoặc migration guide cho thay đổi breaking |

### 1) Thiếu README cấp repo và guide onboarding thống nhất

**Severity:** High

**What is missing or inaccurate**
- Repo không có README ở thư mục gốc để mô tả bức tranh tổng thể của dự án.
- Tài liệu hiện chỉ nằm rải rác ở `backend/README.md` và `frontend/README.md`, trong khi dự án là full-stack và có nhiều phụ thuộc vận hành hơn một app đơn lẻ.
- Chưa có hướng dẫn thống nhất cho: cài đặt, env vars, MySQL/Prisma setup, chạy backend/frontend song song, seed/migrate database, build/preview production, hoặc các dependency runtime như Redis/Socket.IO.

**Specific recommendation**
- Thêm `C:\Users\TK\Desktop\DoAn3\README.md` ở cấp repo.
- Nội dung nên có: giới thiệu dự án, prereqs, setup end-to-end, biến môi trường, migration/seed, chạy dev, build production, deploy, troubleshooting ngắn.
- Nên có bảng “services required” để chỉ rõ MySQL, Redis, backend, frontend, và cổng mặc định.

---

### 2) API documentation chưa đủ, chưa có schema/example chuẩn

**Severity:** High

**What is missing or inaccurate**
- `backend/README.md` chỉ liệt kê một phần API, chủ yếu blog/auth, nhưng code thực tế còn nhiều nhóm route khác: `/api/users`, `/api/mentor`, `/api/mentors`, `/api/bookings`, `/api/conversations`, `/api/notifications`, `/api/assessments`, và các route admin tương ứng.
- Không có request/response schema, không có ví dụ payload, không có trạng thái lỗi chuẩn hóa, và không có auth matrix (public / authenticated / admin / active user).
- Không có OpenAPI/Swagger/Postman collection trong repo để làm tài liệu hợp đồng API có thể kiểm tra được.

**Specific recommendation**
- Tạo OpenAPI spec hoặc Postman collection cho toàn bộ backend API.
- Mỗi endpoint nên có: purpose, auth requirement, request schema, response schema, error cases, example success/failure.
- Nên nhóm theo domain và ghi rõ route nào là public, authenticated, active-user-only, admin-only.

---

### 3) README hiện tại có nhiều chi tiết lệch với implementation

**Severity:** High

**What is missing or inaccurate**
- `backend/README.md` ghi `src/db/prisma.js`, nhưng code thực tế là `backend/src/db/prisma.ts`.
- `backend/README.md` chỉ liệt kê một số scripts cũ/ít hơn thực tế; trong `backend/package.json` còn có `build`, `lint`, `typecheck`, `db:seed`.
- `frontend/README.md` mô tả cấu trúc và các trang như `Jobs`, `Test`, nhưng repo hiện tại có nhiều page/module khác như `assessment/*`, `admin/*`, `chat/*`, `mentor/*`, `auth/*`; tên và phạm vi mô tả không còn khớp hoàn toàn.
- Một số mô tả công nghệ cũng đã cũ hoặc mơ hồ, ví dụ frontend đang dùng `motion`, `react-helmet-async`, `socket.io-client`, `react-query`, nhưng README chưa phản ánh đầy đủ workflow hiện tại.

**Specific recommendation**
- Đồng bộ lại README với code thực tế: tên file, scripts, route map, page map, và dependency runtime.
- Nếu một mục đã deprecated, nên xoá hẳn thay vì để mô tả cũ gây hiểu nhầm.
- Nên thêm checklist “docs verified against current branch” để tránh stale docs về sau.

---

### 4) Thiếu architecture documentation ở cấp hệ thống và component

**Severity:** Medium

**What is missing or inaccurate**
- Không thấy ADRs, sơ đồ hệ thống, hay tài liệu component-level cho các phần quan trọng như:
  - auth/session flow,
  - scheduler chạy nền (`backend/src/tasks/scheduler.ts`),
  - Socket.IO lifecycle,
  - rate limiting / proxy trust,
  - quan hệ giữa backend, Prisma, Redis, và frontend.
- Hiện tại kiến trúc chỉ được mô tả bằng comment trong code, chưa đủ để người mới hiểu boundary và lý do thiết kế.

**Specific recommendation**
- Thêm một thư mục tài liệu kiến trúc ngắn gọn, ví dụ `docs/architecture/`.
- Tối thiểu cần có: system overview, runtime diagram, auth flow, background jobs, realtime flow, data ownership.
- Nếu có quyết định quan trọng, ghi ADR ngắn với “context / decision / consequences”.

---

### 5) Inline documentation chưa giải thích đầy đủ business logic cốt lõi

**Severity:** Medium

**What is missing or inaccurate**
- Một số file core đã có comment, nhưng phần mô tả vẫn thiên về “file làm gì” hơn là “vì sao logic này tồn tại”.
- Các module có business logic đáng chú ý như assessment scoring, mentor recommendation, scheduler, auth retry/session handling vẫn thiếu giải thích cho:
  - ý nghĩa threshold,
  - thứ tự ưu tiên,
  - invariants cần giữ,
  - trường hợp fallback,
  - lý do chọn chiến lược hiện tại.
- Frontend cũng có nhiều file lớn, nhưng comment giải thích rationale chưa đồng đều giữa các module.

**Specific recommendation**
- Thêm comment ngắn tại các điểm quyết định thuật toán, không chỉ ở đầu file.
- Với các constant/threshold quan trọng, nên có một block giải thích “nguồn gốc và ý nghĩa” hoặc gom vào một tài liệu logic/business rules riêng.
- Ưu tiên document các flow có thể gây hiểu nhầm khi sửa: scoring, recommendation, refresh/retry, scheduler, admin bulk action.

---

### 6) Không có changelog hoặc migration guide cho thay đổi breaking

**Severity:** Medium

**What is missing or inaccurate**
- Repo không có `CHANGELOG.md`, release notes, hoặc migration guide mô tả các thay đổi ảnh hưởng tới người dùng/dev.
- Với một dự án có thay đổi route, schema Prisma, auth/session behavior, và worker/scheduler, việc thiếu migration notes làm tăng rủi ro khi nâng cấp hoặc onboard môi trường mới.

**Specific recommendation**
- Thêm changelog theo version hoặc theo milestone.
- Với mỗi thay đổi breaking, ghi rõ: endpoint đổi gì, schema đổi gì, cần migrate dữ liệu nào, cần cập nhật env/config nào.
- Nếu chưa muốn duy trì changelog đầy đủ, ít nhất thêm một “upgrade notes” ngắn cho các thay đổi lớn.

## Kết luận ngắn

Tài liệu hiện tại đủ để “chạy sơ bộ” nhưng chưa đủ để vận hành/duy trì dài hạn. Ưu tiên lớn nhất là: 1) tạo README gốc và quickstart thống nhất, 2) chuẩn hoá API docs bằng OpenAPI/Postman, 3) đồng bộ lại các README hiện có với code thực tế.