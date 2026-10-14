# IC-010 — CI và kiểm thử luồng quan trọng

- Ngày 2026-10-14; baseline `840e0e4`; nhánh `codex/critical-test-ci`.
- Theo backlog IC-010, tài liệu 13 và quy trình một ticket của file 17.

## Phạm vi đã chốt

Giữ Vitest/RTL, CI checks và 39 booking integration cases hiện có. Bổ sung HTTP integration qua Express thật + MySQL riêng: đăng ký/đăng nhập, refresh cookie rotation/replay/expiry, logout/logout-all, verify/reset token sequential replay/expiry, trạng thái tài khoản, role cập nhật từ DB và booking ownership. Dùng Node fetch hiện có, không thêm Supertest chỉ để thay thế transport tương đương.

Thêm Playwright Chromium với server thật, tài khoản tổng hợp và schema riêng `itcompass_ic010_e2e_test`: student hủy yêu cầu của mình; mentor lưu cài đặt và đọc lại; admin xác nhận yêu cầu và đọc lại; guest bị chuyển tới login. Không gửi email thật. Không đổi nghiệp vụ auth trong ticket nền kiểm thử; nếu phát hiện lỗi ngoài phạm vi, ghi rõ giới hạn và ticket cần sửa.

## Các bước

1. Viết integration auth/permission cases; kiểm tra với MySQL riêng. Test hiện trạng không bắt buộc red nếu chức năng đã đúng; phải chứng minh bắt được regression bằng mutation tạm có kiểm soát.
2. Pin Playwright, config/server/seed có guard fail-closed trước mọi kết nối hay mutation. Không tái dùng server đang chạy, không đọc `.env` để chọn DB test. Fixtures chỉ xóa/cập nhật ID tổng hợp của mình.
3. Viết E2E ba vai trò + guest; kiểm tra browser → API → dữ liệu đọc lại. Không sleep cố định.
4. CI mở rộng integration auth, thêm job MySQL + Chromium, typecheck E2E, giữ workflow read-only permissions; artefact lỗi riêng, hạn lưu ngắn và chỉ dữ liệu tổng hợp.
5. Chạy lint/types/tests/build; review độc lập; ghi evidence/report/README. CI GitHub chỉ ghi PASS khi thực sự đã chạy; không push/deploy tự động.

## Rollback và giới hạn

Rollback chỉ các test/scripts/config/lockfile của IC-010. Không migration mới, không thay UI hay scoring. Chưa bao phủ tất cả matrix trong tài liệu 13: email delivery thuộc IC-001, race token concurrency, Socket rooms, mọi CMS/assessment/mission path và mọi trình duyệt là công việc tiếp theo, không khẳng định readiness toàn hệ thống.
