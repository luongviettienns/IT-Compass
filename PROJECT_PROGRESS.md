# Project Progress Tracking

## Trạng thái dự án
- **Ngày khởi tạo:** 2026-10-12
- **Kho lưu trữ:** https://github.com/luongviettienns/IT-Compass

---

## Nhật ký tiến độ

### Phase 0: Khởi tạo & Thiết lập
- [x] Clone mã nguồn dự án IT-Compass vào thư mục làm việc (`c:/Users/ASUS/Desktop/ITCompass`)
- [x] Cấu hình xác thực GitHub Personal Access Token cho Git remote
- [x] Khởi tạo cơ sở dữ liệu `it_compass_vi` (MySQL port 3306), đồng bộ schema Prisma và migration `0009_booking_idempotency`
- [x] **IC-002:** Booking attendance review & outcome verification
- [x] **IC-003:** Booking concurrency and idempotence (xử lý race condition, idempotency key, transaction lock với MySQL, 62/62 tests PASS)
- [x] **IC-004:** Booking expiry / Vietnam timezone / automatic confirmation
- [x] **IC-005:** Admin Booking status-aware actions and pending UX
- [x] **IC-006:** Align comment deletion copy with retained records
- [x] **IC-007:** Security proxy, metrics and verified upload boundaries
- [x] **IC-008:** Public marketing claims replacement with live facts
- [x] **IC-009:** Admin query states & export choices preservation
- [x] **IC-010:** Critical CI automated tests & Playwright E2E verification
- [x] Đồng bộ các commits IC-002 -> IC-010 vào nhánh main và push lên remote origin
