# IC-002 — Booking outcome review: execution report

- Ngày: 2026-10-12.
- Baseline SHA: `4167a14e446beed1b42caf5ff69d12bcd9f77d1b`.
- Nhánh: `codex/booking-outcome-review`.
- Phạm vi: lát cắt IC-002 được người dùng chấp thuận, kèm nền test/CI tối thiểu của IC-010. Tham khảo Prompt C trong [17-AGENT-EXECUTION-PROMPTS.md](17-AGENT-EXECUTION-PROMPTS.md) và [03-BOOKING-BUSINESS-FLOWS.md](03-BOOKING-BUSINESS-FLOWS.md).
- Trạng thái: đã sửa và kiểm tra tại máy local; chưa chạy CI trên GitHub hoặc triển khai staging/production.

## Findings

1. **OBSERVED / reproduced:** scheduler tự đổi lịch `CONFIRMED` đã kết thúc quá 15 phút thành `NO_SHOW`, không có bằng chứng tham dự. Test chạy scheduler nhận `NO_SHOW` thay vì `CONFIRMED` trước khi sửa.
2. **OBSERVED / reproduced:** admin có thể ghi `NO_SHOW` hoặc `COMPLETED` trước giờ kết thúc; thao tác `NO_SHOW` không yêu cầu căn cứ và được ghi log như `SYSTEM`.
3. **Regression risk / reproduced:** giữ lịch đã kết thúc ở `CONFIRMED` làm chúng tiếp tục chiếm hạn mức 5 lịch đang hoạt động. Test tạo lịch mới với 5 buổi cũ chờ kết quả bị HTTP 429 trước khi sửa bộ đếm.
4. **Regression risk / reproduced:** cờ chờ kết quả được tính khi trả API, nên dữ liệu đã tải trước giờ kết thúc cần được làm mới. Test trang chi tiết đang mở không nhận nhãn mới trước khi thêm polling.
5. **Baseline tooling:** frontend `npm ci` thất bại do lockfile thiếu dependency tùy chọn; backend lint có hai lỗi tại regex chứa ký tự điều khiển trong `sanitize.ts`.

## Decision

Giữ nguyên enum, bảng và lịch sử booking. API thêm `outcomeReviewRequired`, tính bằng `status === CONFIRMED && endAt <= thời gian server`. Lịch chờ xác nhận vẫn có status `CONFIRMED`; giao diện hiển thị “Chờ xác nhận kết quả”. Đây là metadata suy ra, không phải một trạng thái DB mới.

So với thêm enum `AWAITING_OUTCOME`, cách này tránh migration và giữ các consumer hiện tại đọc được status. Không cần background job để thay đổi dữ liệu: thời gian chỉ thay đổi việc cần xem xét, không kết luận có/vắng mặt. Các trang booking tải lại dữ liệu mỗi 60 giây khi đang được sử dụng, giữ thời gian backend làm nguồn quyết định.

Luồng kết quả:

| Điều kiện / hành động | Kết quả |
|---|---|
| Lịch chưa hết giờ | Giữ `CONFIRMED`, chưa cho ghi nhận kết quả |
| Lịch hết giờ, chưa được xác nhận | `CONFIRMED` + `outcomeReviewRequired=true` |
| Mentor hoặc admin xác nhận đã tư vấn | `COMPLETED`, có `completedAt` |
| Admin xác nhận không tham dự và nhập căn cứ | `NO_SHOW`, ghi actor và lý do trong log |
| Trạng thái thay đổi sau lần đọc đầu | Từ chối cập nhật kết quả với HTTP 409 |

## Changes

- Bỏ job và hàm tự động đánh dấu `NO_SHOW` trong scheduler/service.
- Thêm metadata chờ xác nhận vào API và sự kiện booking; hiển thị cùng nhãn trên trang học viên, mentor, admin và dữ liệu xuất của admin.
- Giữ luồng mentor xác nhận hoàn thành, chat và quy tắc chỉ được đánh giá sau `COMPLETED`.
- Chặn admin hoàn thành/ghi không tham dự trước giờ kết thúc. Ghi kết quả bằng cập nhật có điều kiện `id + CONFIRMED + endAt <= now`.
- `PATCH /api/admin/bookings/:bookingId/no-show` yêu cầu JSON `{ "reason": "..." }`, 3–500 ký tự sau trim. Actor lấy từ người dùng đã xác thực, không lấy từ body.
- Ghi log chuyển trạng thái với actor `ADMIN`, user ID, trạng thái trước/sau và căn cứ. Tái sử dụng structured logging hiện tại; không thêm bảng audit.
- Dialog ghi không tham dự yêu cầu xác nhận, giữ nội dung và lỗi khi request thất bại, chặn đóng/gửi lặp trong lúc pending; bổ sung label, focus trap và focus restore cho dialog dùng chung.
- Lịch đã kết thúc không chiếm hạn mức đặt lịch đang hoạt động; lịch đang diễn ra/tương lai vẫn được tính. Không tự đổi trạng thái của lịch `REQUESTED` cũ.
- Thêm Vitest, test service/HTTP với persistence giả lập và test UI bằng React Testing Library; typecheck cả test.
- Thêm `.github/workflows/ci.yml`: cài sạch, lint, typecheck source/test, test, build cho backend/frontend. Actions được pin theo SHA; quyền `contents: read`.
- Đồng bộ lockfile frontend; sửa cách biểu diễn regex để lint qua và giữ nguyên việc loại bỏ ký tự điều khiển. Giữ bảy file backend `dist` tương ứng với source đã sửa; loại các thay đổi build không liên quan khỏi diff.

### Compatibility and migration

- Không đổi Prisma schema, không cần migration hoặc backfill.
- Metadata mới là trường bổ sung; status và các URL cũ giữ nguyên.
- **Thay đổi hợp đồng có chủ đích:** client cũ gửi `no-show` không có lý do sẽ nhận HTTP 400; cập nhật frontend/backend cùng đợt. Quy tắc bảo vệ thời điểm kết thúc cũng áp dụng cho thao tác hoàn thành của admin.
- Các bản ghi `NO_SHOW` lịch sử giữ nguyên; không tự suy đoán bản ghi nào bị đánh dấu sai.

## Tests

Môi trường: Windows, Node `24.19.0`, npm `11.17.0`. Các bộ test dùng dữ liệu tổng hợp; không kết nối DB hoặc gửi thông báo thật.

| Kiểm tra local | Backend | Frontend |
|---|---|---|
| `npm ci` | PASS | PASS |
| `npm run prisma:generate` | PASS | Không áp dụng |
| `npm run lint` | PASS | PASS |
| `npm run typecheck` | PASS | PASS |
| `npm run typecheck:tests` | PASS | PASS |
| `npm test` | **26/26 PASS** | **5/5 PASS** |
| `npm run build` | PASS khi chạy lại | PASS |

- Trước sửa: 19/20 test backend ban đầu thất bại; 4/4 test UI ban đầu thất bại đúng các hành vi cần sửa. Các regression về hạn mức, polling và nút hoàn thành trước giờ kết thúc cũng được chạy thất bại trước khi sửa.
- HTTP tests đi qua middleware validation, controller và service thật với user/persistence fixture; kiểm tra body không có căn cứ bị từ chối và actor không thể bị giả mạo qua body.
- UI tests kiểm tra nhãn chờ kết quả, dữ liệu được làm mới, thao tác bị chặn trước giờ kết thúc, lỗi giữ nội dung, pending chặn đóng/gửi lặp và kết quả thành công.
- `git diff --check` qua; CI YAML được parse và kiểm tra cấu hình matrix. Review độc lập không còn finding cần sửa trong phạm vi này.
- Lần build backend trong chuỗi kiểm tra sạch gặp TS5033/UNKNOWN khi ghi một số file `dist` trên Windows. Các file không readonly; chạy lại cùng source đã PASS. Nguyên nhân lỗi ghi chưa được xác định. Log giữ cả lần thất bại và lần chạy lại.
- Bằng chứng: [backend checks](evidence/IC-002-backend-checks.txt), [frontend checks](evidence/IC-002-frontend-checks.txt).

## Risks

- **NOT RUN:** MySQL integration/concurrency thật, E2E staging với auth thật, UI desktop/mobile trong trình duyệt, axe/screen-reader audit đầy đủ, CI chạy trên GitHub và rollout/rollback trên môi trường triển khai. Test fixture không thay thế các bằng chứng này.
- IC-010 mới có nền local/CI cho lát cắt này; chưa hoàn tất ma trận E2E cho mọi vai trò hoặc disposable MySQL/Redis suite.
- Audit booking tiếp tục dùng application logs, chưa có lịch sử kết quả lưu trong bảng audit DB. Cần giữ và giới hạn truy cập log theo chính sách vận hành hiện hành.
- Student trao đổi thông tin với mentor qua chat; chưa thêm API xác nhận tham dự từ student hoặc hệ thống giải quyết tranh chấp riêng.
- Create/confirm/cancel concurrency, request expiry và timezone vẫn thuộc IC-003/004. Các thao tác admin khác còn vấn đề về tính hợp lệ và đóng modal trước mutation success, thuộc IC-005.
- `npm ci` báo 14 dependency vulnerabilities ở backend và 25 ở frontend; chưa xử lý/audit ảnh hưởng trong ticket này. Frontend build còn cảnh báo Browserslist cũ và chunk lớn.

### Rollback / operational fallback

Không có migration cần đảo hoặc dữ liệu cần xóa. Nếu luồng review gặp lỗi, tạm vô hiệu thao tác ghi không tham dự, giữ lịch ở `CONFIRMED`, tiếp tục cho mentor xác nhận đã tư vấn. Giữ job tự động `NO_SHOW` bị gỡ để tránh tái tạo lỗi đã xác nhận. Mọi rollback source/runtime phải được build lại và smoke-test trước rollout; chưa diễn tập trên staging.

## Next recommended ticket

**IC-003 — Booking concurrency and idempotence:** kiểm thử trên MySQL tách biệt và serialize create/confirm theo tài nguyên mentor để chứng minh không có lịch chồng nhau. Tiếp theo xử lý IC-004 và hoàn tất IC-005 theo Prompt C. Security/dependency findings cần được đánh giá trong IC-007.
