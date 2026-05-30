# Các việc cần bổ sung theo độ ưu tiên

## Phase 1 — Nền tảng ops

### 1) Users
- Làm rõ UX role/status.
- Cảnh báo trước khi khóa/mở/bulk action.
- Export theo filter hiện tại + selected rows.
- Nếu chặn đổi role ADMIN thì phải có thông báo rõ ràng.
- Thống kê + export nên có time filter nếu data lớn.

### 1.1) Users — phần cần sửa thống kê/export
- Bảng user list nếu export thì nên theo filter đang áp dụng.
- Nếu có báo cáo/tổng hợp user, thêm lọc thời gian trước khi export.
- Không nên export full DB mặc định.

### 2) Audit logs
- Thêm export Excel/CSV.
- Thêm drill-down nhanh theo actor / target / action / thời gian.
- Có filter thời gian trước khi export.
- Đây là module bắt buộc phải sửa thống kê/export theo thời gian.

### 2.1) Audit logs — phần cần sửa thống kê/export
- Luôn cho chọn khoảng thời gian trước khi export.
- Nên có preset 7d / 30d / 90d / custom.
- Export mặc định theo range đang lọc.
- Không export toàn bộ log khi không có filter.

## Phase 2 — Core admin flow

### 3) Bookings
- Tạo module admin riêng.
- Danh sách + filter + trạng thái + chi tiết + xử lý.
- Có time filter nếu cần export.
- Thống kê/export nên giới hạn theo thời gian để tránh dữ liệu quá lớn.

### 3.1) Bookings — phần cần sửa thống kê/export
- Nếu có dashboard bookings, thêm lọc ngày/tháng trước khi export.
- Export mặc định theo khoảng thời gian đang xem.
- Có preset thời gian nếu số booking lớn.

### 4) Mentors
- Tách rõ `verify` vs `status`.
- Thêm audit log cho mọi thao tác admin.
- Bổ sung workflow duyệt / xác thực hồ sơ.

### 4.1) Mentors — phần cần sửa thống kê/export
- Nếu có thống kê mentor, export nên theo trạng thái + khoảng thời gian.
- Không nên xuất danh sách đầy đủ nếu dữ liệu lớn mà thiếu filter.

### 4) Mentors
- Tách rõ `verify` vs `status`.
- Thêm audit log cho mọi thao tác admin.
- Bổ sung workflow duyệt / xác thực hồ sơ.

## Phase 3 — Data / insight

### 5) Assessments
- Không chỉ stats.
- Thêm attempt list.
- Filter theo user / thời gian / result.
- Export chỉ theo khoảng thời gian đã lọc.
- Đây là module cần sửa thống kê/export rõ nhất.

### 5.1) Assessments — phần cần sửa thống kê/export
- Có time filter trước export.
- Export theo filter hiện tại + preset thời gian.
- Tránh export toàn bộ attempt/result một lúc nếu không có lọc.

### 6) Dashboard
- Thêm trend theo thời gian.
- Shortcut sang bookings / export / audit.
- Các widget thống kê có export thì phải có time filter.

### 6.1) Dashboard — phần cần sửa thống kê/export
- Các card thống kê nên kèm bộ lọc thời gian.
- Export từ dashboard nên phản ánh đúng range đang chọn.
- Không dùng export full-scope mặc định cho widget tổng hợp.

### 7) Blogs
- Soft delete / restore minh bạch hơn.
- Tách rõ preview và edit.
- Nếu export có thêm time filter.

### 7.1) Blogs — phần cần sửa thống kê/export
- Nếu có báo cáo blog, export theo thời gian tạo/cập nhật.
- Nên lọc trước khi export danh sách lớn.

### 6) Dashboard
- Thêm trend theo thời gian.
- Shortcut sang bookings / export / audit.
- Các widget thống kê có export thì phải có time filter.

## Phase 4 — Content polish

### 7) Blogs
- Soft delete / restore minh bạch hơn.
- Tách rõ preview và edit.
- Nếu export có thêm time filter.

## Ưu tiên kỹ thuật chung

### A) Export framework dùng chung
- Dùng chung cho Users / Mentors / Blogs / Audit logs / Assessments.
- Mặc định export theo filter hiện tại.
- Với trang thống kê, ưu tiên có date range / preset 7d / 30d / 90d / custom.

### B) Audit trail common
- Chuẩn hóa log cho mọi thao tác admin.
- Ưu tiên cho Users, Mentors, Blogs, Bookings.

### C) Chart policy
- Chỉ sửa chart có giá trị nghiệp vụ: dashboard, assessments, bookings, audit, mentor.
- Không sửa chart chỉ để trang trí hoặc count tổng không phục vụ quyết định.
- Chart nào có export thì phải cùng filter với export.

### D) RBAC
- Tách quyền theo vai trò admin con nếu có nhu cầu.
- Không gom hết vào 1 role `ADMIN` nếu cần phân quyền theo module.

## Gợi ý thứ tự triển khai
1. Users + export + time filter
2. Audit logs export + drill-down
3. Bookings admin module
4. Mentors verify/status + audit trail
5. Assessments attempt list + time filter
6. Dashboard trend + shortcuts
7. Blogs polish
