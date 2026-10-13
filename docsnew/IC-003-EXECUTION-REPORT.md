# IC-003 — Booking concurrency and idempotence: execution report

- Ngày: 2026-10-12.
- Baseline SHA: `f5a9409601a5c6abf6303841336f11226da0eb81` (IC-002).
- Nhánh: `codex/booking-concurrency`.
- Phạm vi: IC-003 theo Prompt C trong [17-AGENT-EXECUTION-PROMPTS.md](17-AGENT-EXECUTION-PROMPTS.md), [03-BOOKING-BUSINESS-FLOWS.md](03-BOOKING-BUSINESS-FLOWS.md) và [16-ISSUE-BACKLOG.md](16-ISSUE-BACKLOG.md).
- Trạng thái: triển khai và kiểm tra local; lưu thành commit riêng trước IC-004. Chưa push, chạy CI trên GitHub hoặc deploy staging/production.

## Findings

1. **Reproduced on MySQL:** 50 yêu cầu độc lập đặt cùng slot có thể tạo 12 booking, vì kiểm tra overlap nằm trước thao tác ghi mà không khóa tài nguyên.
2. **Reproduced on MySQL:** gửi lại 50 lần cùng yêu cầu tạo 50 booking; chưa có idempotency key hoặc cơ chế dedup notification theo mutation.
3. **Reproduced on MySQL:** cùng học viên gửi yêu cầu đồng thời đến nhiều mentor vượt hạn mức 5 lịch, tạo được 12 lịch.
4. **Reproduced:** admin xác nhận lịch cũ chồng nhau; thao tác confirm/cancel đồng thời có thể ghi đè trạng thái. Buffer được áp dụng không đối xứng, nên kết quả phụ thuộc thứ tự đặt lịch.
5. **Reproduced:** lỗi ghi notification không rollback booking. Replay bị kiểm tra điều kiện mentor trước khi nhận ra yêu cầu đã commit, nên có thể trả 404 sau khi mentor tạm dừng.
6. **Review findings / reproduced:** khoảng thời gian giữa lần đọc replay đầu và commit cần được kiểm tra lại sau khi khóa; thông báo admin hủy/xác nhận cần diễn đạt đúng người thực hiện. Các regression đã được bổ sung và sửa.

## Decision

Giữ Express, Prisma và MySQL hiện tại. Mỗi create/confirm/cancel chạy trong transaction `READ COMMITTED`, khóa row học viên rồi row mentor bằng `SELECT ... FOR UPDATE`. Khóa học viên bảo vệ hạn mức giữa nhiều mentor; khóa mentor bảo vệ overlap trên cùng lịch. Kiểm tra và cập nhật cùng nằm trong transaction, với cập nhật có điều kiện để không ghi đè trạng thái đã thay đổi.

Chỉ retry các lỗi transaction đã rollback do deadlock/lock timeout (`P2034`, hoặc `P2010` với MySQL 1213/1205), tối đa 3 lần. Khi hết lượt, trả HTTP 503 `BOOKING_BUSY`; lỗi mất trạng thái trả HTTP 409 `BOOKING_STATE_CHANGED`. Không retry lỗi ghi bất kỳ vì có thể tạo tác dụng phụ không an toàn.

| Thao tác | Kết quả |
|---|---|
| Create hợp lệ, không overlap và còn hạn mức | Tạo một `REQUESTED` và notification trong cùng transaction |
| Cùng học viên, cùng key và payload | Trả lại booking đã tạo với trạng thái hiện tại, không ghi thêm |
| Cùng key, payload khác | HTTP 409 |
| Confirm `REQUESTED`, không overlap | `CONFIRMED`, bảo đảm conversation và ghi notification cùng transaction |
| Confirm lại `CONFIRMED` | Trả lại lịch, bảo đảm conversation, không gửi notification lặp |
| Cancel trạng thái cho phép | Ghi trạng thái hủy và notification cùng transaction |
| Cancel lại cùng bên đã hủy | Trả lại lịch, giữ lý do ban đầu, không gửi lặp |
| Confirm lịch đã hủy / trạng thái không còn hợp lệ | Từ chối; không khôi phục lịch đã hủy |

Notification inbox được lưu cùng transaction. Socket event chỉ phát sau commit; không thêm queue, microservice hoặc outbox trong ticket này.

## Changes

- Thêm helper transaction dùng chung cho create, mentor/admin confirm và student/mentor/admin cancel. Kiểm tra eligibility, hạn mức, availability và overlap sau khi khóa; admin confirm dùng cùng invariant với mentor.
- Thêm header tùy chọn `Idempotency-Key`: 1–128 ký tự ASCII thuộc `[A-Za-z0-9._:-]`. Hash SHA-256 của key được scope theo học viên; hash payload dùng dữ liệu đã chuẩn hóa. Replay được kiểm tra trước eligibility và kiểm tra lại bên trong transaction, kể cả khi lịch đã hủy hoặc mentor đã tạm dừng.
- Migration `0009_booking_idempotency` thêm hai cột nullable `request_key_hash`, `request_payload_hash` và unique index `(hoc_vien_id, request_key_hash)`. Hash là nội bộ, không xuất trong DTO/API/socket.
- Áp dụng buffer trước/sau cho cả hai khoảng thời gian; mở rộng truy vấn lịch lân cận theo tổng buffer, dùng cùng quy tắc khi kiểm tra availability. Không có buffer thì hai lịch liền nhau vẫn hợp lệ.
- Đưa việc lưu notification vào transaction. Thông báo xác nhận dùng diễn đạt trung lập; admin hủy được ghi đúng là quản trị viên. Actor admin lấy từ session đã xác thực.
- `BookingDialog` giữ cùng UUID cho retry cùng draft sau lỗi mạng; thay payload tạo key mới, thành công xóa key. API client gửi header; toast không giả định replay luôn còn ở `REQUESTED`.
- Thêm integration suite với MySQL thật, test retry UI và test chặn URL database không an toàn. Integration chỉ chạy khi có `TEST_DATABASE_URL` trỏ đến localhost và schema theo mẫu `itcompass_*_test`.
- Thêm script chuẩn bị schema/migration test và CI job MySQL 8.0 riêng. Không thêm dependency hoặc thay lockfile. Đồng bộ sáu file build backend tương ứng; loại thay đổi build không liên quan.

### Compatibility, migration and rollout

- Client cũ không gửi header vẫn dùng được API. Create và replay đều trả HTTP 201 với cùng public DTO; không đổi enum hoặc URL hiện có.
- Migration đã chạy trên schema cũ với hai booking fixture: giữ nguyên dữ liệu và status, để hash NULL, kiểm chứng unique key trong cùng học viên và cho phép cùng key ở học viên khác.
- **Trước rollout backend mới:** áp dụng migration `0009`, regenerate Prisma Client và build. Tạm dừng booking writes trong lúc nâng cấp, cập nhật đồng bộ mọi instance ghi booking; instance cũ hoặc thao tác SQL thủ công không tuân theo khóa này.
- Không xóa hoặc sửa tự động booking lịch sử chồng nhau. Vận hành cần rà soát và xử lý từng trường hợp qua luồng hợp lệ.
- Chưa áp dụng migration vào database ứng dụng hoặc production.

## Tests

Môi trường: Windows, Node `24.19.0`, npm `11.17.0`, MySQL `8.0.46`. MySQL kiểm thử dùng process, port và data directory riêng với dữ liệu tổng hợp. Sau kiểm tra đã xác minh data directory và shutdown đúng instance; dịch vụ `MySQL80` hiện có vẫn chạy.

| Kiểm tra local | Kết quả |
|---|---|
| Prisma generate / validate | PASS |
| `npm run test:prepare-db`, migration compatibility / uniqueness | PASS |
| Backend unit + database URL safety | **34/34 PASS** |
| MySQL integration + HTTP/auth/validation | **21/21 PASS** |
| Frontend component tests | **7/7 PASS** |
| Lint, source/test typecheck, build ở backend và frontend | PASS |
| Diff whitespace check và CI YAML validation | PASS |

Tổng cộng **62 test PASS**. Các case quan trọng đã chạy red trước khi sửa:

- 50 yêu cầu độc lập cùng slot: sau sửa chỉ một booking, không có hai lịch active chồng nhau.
- 50 yêu cầu cùng key: cùng booking ID, một bản ghi notification và một event; key khác payload trả 409, scope học viên và phân biệt hoa/thường đúng.
- 50 confirm trộn mentor/admin: một conversation và một notification; confirm/cancel đồng thời không khôi phục lịch đã hủy.
- Hạn mức học viên được giữ khi tạo đồng thời ở nhiều mentor; lịch liền nhau, buffer và availability đúng ở cả hai thứ tự đặt.
- Trigger MySQL làm insert notification thất bại: booking và key rollback; bỏ trigger rồi retry tạo được lịch bình thường.
- Replay sau cancellation/mentor pause và khoảng commit giữa hai lần đọc trả đúng lịch đã lưu.
- HTTP thật qua JWT, role middleware, validator và service: replay header, không lộ hash, header sai 400, thiếu auth 401 và sai role 403.
- UI retry sau mất response giữ nguyên key; sửa draft đổi key. Các test IC-002 vẫn qua.

Review độc lập không còn finding cần sửa trong phạm vi patch cuối. Bằng chứng lệnh và exit code: [backend checks](evidence/IC-003-backend-checks.txt), [frontend checks](evidence/IC-003-frontend-checks.txt).

## Risks

- **NOT TESTED:** E2E đầy đủ trong trình duyệt/staging, responsive/accessibility audit đầy đủ, CI trên GitHub, rollout/rollback thực tế và tải production. HTTP/auth/MySQL đã kiểm tra local; không thay thế các bước này.
- Chưa cưỡng bức deadlock/timeout MySQL thật; phân loại lỗi và giới hạn retry được kiểm tra bằng unit tests. Khóa được kiểm chứng bằng các test đồng thời trên MySQL thật.
- Socket delivery sau commit vẫn best effort; notification inbox đã lưu bền vững. Chưa có outbox để phát lại socket khi process dừng sau commit.
- Key được giữ theo vòng đời booking; frontend chỉ giữ key trong draft đang mount, chưa lưu qua reload/cross-device. Client không gửi key không được bảo vệ khỏi việc retry một yêu cầu có payload khác.
- Request expiry, timezone, autoConfirm và cách xác định ngày cho hạn mức yêu cầu mentor thuộc IC-004. Không tuyên bố toàn bộ booking policy đã hoàn chỉnh. Thay đổi cấu hình/availability đồng thời và SQL thủ công không thuộc các writer được kiểm thử trong ticket này.
- Các modal/action admin khác thuộc IC-005. Các cảnh báo dependency đã ghi ở IC-002 chưa được xử lý; build vẫn cảnh báo Browserslist/chunk size và Prisma config deprecated.

### Rollback / operational fallback

Giữ hai cột nullable và unique index khi rollback code; không xóa lịch sử key hoặc booking. Nếu phải quay về runtime IC-002, tạm vô hiệu booking writes vì runtime cũ có lỗi concurrency đã tái hiện. Build lại, kiểm tra migration/runtime compatibility và smoke-test trước rollout. Chưa diễn tập rollback trên staging.

## Next recommended ticket

**IC-004 — Booking expiry/timezone/autoConfirm:** chốt semantics của autoConfirm và thời hạn `REQUESTED`, dùng timezone rõ ràng cho ngày/availability/hạn mức, kiểm thử UTC-host và `Asia/Ho_Chi_Minh`. Sau đó thực hiện IC-005 theo Prompt C; mở rộng E2E/CI trong IC-010.
