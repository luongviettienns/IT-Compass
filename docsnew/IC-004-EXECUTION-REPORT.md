# IC-004 — Booking expiry, timezone and autoConfirm: execution report

- Ngày: 2026-10-13.
- Baseline: `d61f5cb7ad9121e87aab8c955c54930bd610160d`, commit local IC-003 đã tách riêng trước khi bắt đầu.
- Nhánh: `codex/booking-policy`.
- Phạm vi: IC-004 theo [03-BOOKING-BUSINESS-FLOWS.md](03-BOOKING-BUSINESS-FLOWS.md), [16-ISSUE-BACKLOG.md](16-ISSUE-BACKLOG.md), Prompt C trong [17-AGENT-EXECUTION-PROMPTS.md](17-AGENT-EXECUTION-PROMPTS.md).
- Trạng thái: triển khai và kiểm tra local; lưu thành commit riêng trước IC-005. Chưa push hoặc deploy staging/production.

## Findings

1. **Reproduced:** host UTC lưu input `10:00` thành `10:00Z`, thay vì `03:00Z` của lịch Việt Nam. Serialize, date filters, weekday/availability và notification phụ thuộc timezone host.
2. **Reproduced:** yêu cầu cũ hơn 24 giờ còn chiếm slot/hạn mức và được confirm dù quá hạn; chưa có deadline hoặc job expiry.
3. **Reproduced:** bật `autoConfirm` trong DB vẫn tạo `REQUESTED`; cài đặt update còn ép false và validator/UI không cho bật công tắc.
4. **Reproduced:** hạn mức yêu cầu mentor mỗi ngày tính theo ngày hẹn thay vì ngày gửi yêu cầu. Test gửi bốn yêu cầu hôm nay cho một ngày tương lai không bị chặn.
5. **Review / reproduced:** deadline trôi qua trong thời gian confirm đang await kiểm tra overlap vẫn được xác nhận. Test timing probe giữ SQL/transaction thật và đổi đồng hồ sau query đã tái hiện lỗi.
6. **Browser / reproduced:** mobile sticky CTA che footer BookingDialog, click nút tiếp tục không chuyển bước. Sau khi sửa, browser đi hết chọn slot → xác nhận → POST → mở chat.
7. **UI / reproduced:** ngày picker tại `2026-10-12T19:30Z` lấy 12/10 thay vì 13/10 Việt Nam; badge chưa thể hiện expiry và nội dung dialog/mentor còn khẳng định mọi lịch phải chờ xác nhận.

## Decision

Người dùng đã chọn bộ quy tắc sau trong chat:

- Lịch dùng **`Asia/Ho_Chi_Minh` (UTC+07:00)**. MVP hỗ trợ lịch Việt Nam, không cho client tự chọn timezone khác.
- `responseDueAt = min(createdAt + 24 giờ, startAt)` cho lịch chờ xác nhận. Đúng tại deadline thì yêu cầu hết hạn.
- `autoConfirm` mặc định OFF. Khi ON, yêu cầu hợp lệ trong lịch mentor đã mở tạo `CONFIRMED`, timestamp và conversation ngay trong transaction. Cả `CUSTOM_TIME` cũng phải nằm trong availability khi tự xác nhận; OFF vẫn cho đề xuất giờ riêng để mentor xem xét.

### ADR: expiry mapping and compatibility

Giữ các enum/status hiện có. **Expiry là `REQUESTED` với `responseDueAt`, `expiredAt` và `requestExpired`**, giao diện hiển thị “Hết hạn xác nhận”. Không gán expiry thành mentor/học viên hủy hoặc `NO_SHOW`. Cách này giữ lịch sử và tránh thêm enum mà client cũ không hiểu.

Deadline được kiểm tra ngay khi đọc/tính capacity và khi confirm/cancel, không đợi job. Job chỉ ghi dấu expiry và thông báo. Filter `status=REQUESTED` là hàng chờ chưa hết hạn; danh sách không filter vẫn giữ mọi lịch, bao gồm lịch hết hạn. Consumer cần dùng metadata mới để phân biệt expiry với pending.

| Luồng | Kết quả |
|---|---|
| Create, autoConfirm OFF | `REQUESTED`, deadline được lưu, chưa có conversation |
| Create hợp lệ, autoConfirm ON | `CONFIRMED`, `confirmedAt`, conversation và notification cùng transaction |
| Confirm trước deadline | `CONFIRMED`, giữ lịch sử deadline |
| Deadline đạt/trôi qua | `requestExpired=true`, không còn chiếm slot/hạn mức; confirm/cancel trả 409 |
| Job xử lý yêu cầu hết hạn | Ghi `expiredAt`, actor SYSTEM, một notification cho mỗi bên |
| Nhiều job xử lý cùng yêu cầu | Một lần ghi expiry, không gửi lặp |
| Lịch đã `CONFIRMED` hết giờ | Giữ nguyên luồng review IC-002, không tự kết luận tham dự |

## Changes

- Thêm helper lịch Việt Nam độc lập với Node TZ cho parse, serialize, ngày trong tuần và ranh giới ngày. Start/end là UTC instants; advance window dùng số ngày cố định của lịch không DST.
- Migration `0010_booking_policy` thêm timezone, nullable deadline/expiry và index phục vụ job. Backfill deadline cho `REQUESTED` theo policy đã chọn; không đổi instants, status, attendance hoặc key history.
- Create ghi `createdAt` UTC ở độ chính xác giây, deadline/confirmation timestamp và timezone rõ ràng. Tiếp tục dùng khóa học viên → mentor của IC-003.
- Capacity/overlap/availability loại yêu cầu quá hạn, kể cả row cũ chưa có deadline; quota ngày dùng ngày gửi yêu cầu trong timezone Việt Nam.
- Confirm kiểm tra deadline sau khi lấy khóa và sau SQL validation. Guarded confirm/cancel của `REQUESTED` có cả deadline, `expiredAt` và fallback cho legacy row.
- Job chạy lúc startup và mỗi phút, tối đa 100 candidate/lần. Khóa/đọc lại state trước khi ghi expiry; notification nằm trong cùng transaction. Lỗi từng row được ghi log và có thể retry, không làm mất capacity policy.
- Notification expiry tái sử dụng enum notification hiện có (`BOOKING_CANCELLED_BY_MENTOR`) với metadata `expiredAt`, caption hết hạn và dedupe key riêng; không ghi booking là mentor hủy. Auto-confirm thông báo cho cả học viên và mentor. Nội dung giờ có nhãn timezone.
- Public config thêm timezone/response window; booking DTO/socket/export thêm metadata. Hash idempotency tiếp tục được giữ nội bộ. Header/API cũ và enum booking giữ nguyên.
- Validator/API/UI mentor cho bật/tắt autoConfirm bằng boolean. BookingDialog có nội dung đúng cho hai chế độ ở cả hai bước và tính ngày picker theo lịch Việt Nam.
- Student/mentor/admin có nhãn deadline/expiry/zone; chặn thao tác hết hạn. Admin export có timezone/deadline. Các hành vi modal/action khác vẫn thuộc IC-005.
- Đưa BookingDialog vào portal để footer modal nằm trên CTA/mobile navigation. Điều chỉnh vị trí deadline để tên/badge không bị ép và trang 390px không tràn ngang.
- CI chạy MySQL integration dưới cả UTC và `Asia/Ho_Chi_Minh`; bổ sung test nghiệp vụ/calendar/UI và migration fixture. Không thêm dependency/lockfile.

## Tests

Môi trường local: Windows, Node `24.19.0`, npm `11.17.0`, Prisma Client `6.19.3`, MySQL `8.0.46`. Database tự động và database browser dùng schema riêng trên instance MySQL tạm; tất cả tài khoản/dữ liệu tổng hợp.

| Kiểm tra | Kết quả |
|---|---|
| Backend unit / calendar / URL safety | **40/40 PASS** |
| MySQL integration, host UTC | **39/39 PASS** |
| MySQL integration, host Asia/Ho_Chi_Minh | **39/39 PASS** |
| Frontend component tests, UTC và Vietnam | **11/11 PASS ở mỗi TZ** |
| Prisma generate / validate / migration compatibility | PASS |
| Lint, source/test typecheck và build ở hai workspace | PASS |
| Diff check và CI YAML parse/kiểm tra hai TZ | PASS |

**90 test riêng biệt PASS**; việc chạy lại ở timezone khác không được cộng thành test mới.

- Các regression chính chạy red trước sửa: 9 case đầu về timezone/deadline/quota/autoConfirm, startup expiry, auto-confirm ngoài lịch mở, hàng chờ stale, crossing-deadline và UI date/badge/checkbox/copy.
- Giữ đủ 50 concurrent same-slot và same-key tests IC-003; 50 retry auto-confirm tạo một lịch/chat. Mười worker expiry đồng thời chỉ ghi một lần và hai notification.
- Trigger MySQL làm insert notification expiry thất bại chứng minh transaction rollback; retry sau bỏ trigger ghi đúng một lần. Confirm/expiry race không tạo conversation hoặc đổi lịch `CONFIRMED` thành `NO_SHOW`.
- Midnight, invalid calendar days, date-filter boundary, booking kết thúc đúng midnight và vượt ngày được kiểm tra.
- Migration thực chạy từ schema cũ qua `0009` rồi `0010` trên DB mới: giữ hai legacy NULL keys, kiểm chứng unique index; bảo toàn lịch `CONFIRMED`, backfill cả nhánh start-first và creation+24h-first, giữ nguyên UTC instants.
- Review độc lập cuối không còn actionable finding. Backend build được đồng bộ cho các source booking/task/validator mới; các diff build ngoài IC-004 đã có sẵn lúc bắt đầu vẫn được giữ.

### Browser → API → MySQL → UI smoke

Đã chạy ứng dụng thật với backend TZ=UTC, auth/JWT/refresh/socket và MySQL schema `itcompass_ic004_browser_test`:

1. Login mentor giả lập → bật checkbox → PATCH cài đặt 200 → DB nhận setting.
2. Login học viên → slot `13:00` Việt Nam → POST thành công → DB `06:00Z`, `CONFIRMED`, một conversation và hai thông báo xác nhận.
3. Từ danh sách học viên mở chat → đúng conversation sẵn sàng nhập tin nhắn; không gửi tin nhắn.
4. Chế độ OFF → đặt `14:00` → `REQUESTED`, deadline đúng `startAt`, UI có nhãn chờ và mốc xác nhận.
5. Legacy request đã expiry vẫn trong lịch sử, không có action confirm/cancel/chat; tổng ba booking, một conversation, năm notification trong fixture browser.
6. Kiểm tra trang ở 390×844 và 1280×800; sửa modal bị CTA che và vị trí deadline. Ở 390px, DOM page width 385px. Console không có error trong luồng đã kiểm tra.

Bằng chứng: [backend checks](evidence/IC-004-backend-checks.txt), [frontend checks](evidence/IC-004-frontend-checks.txt), [browser DB](evidence/IC-004-browser-db.json), [browser UI](evidence/IC-004-browser-ui.txt), [desktop](evidence/IC-004-student-desktop.jpg), [mobile](evidence/IC-004-student-mobile.jpg).

## Risks

- **NOT TESTED:** staging/production, CI trên GitHub, rollout/rollback thực tế, browser E2E đầy đủ mọi vai trò/error state, automated browser suite, axe/screen-reader audit và tải production. Browser smoke local ở trên có phạm vi cụ thể, không thay thế ma trận E2E đầy đủ.
- MVP cố định lịch Việt Nam; multi-timezone/DST chưa hỗ trợ. Chưa cho sửa timezone trên từng mentor. Mở rộng cần resolver IANA/DST và chính sách ambiguity, không đổi hằng offset hiện tại tùy tiện.
- Migration giữ nguyên instants lịch sử. Nếu hệ thống cũ lưu sai vì host TZ khác, cần đối chiếu và reconcile có căn cứ; không tự shift hàng loạt.
- Các setting `autoConfirm=true` cũ sẽ có hiệu lực sau rollout; kiểm tra cấu hình mentor trước khi bật runtime mới.
- Job có thể chậm vì backlog/failure; capacity và permission vẫn theo deadline ngay lập tức, notification/dấu `expiredAt` có thể đến sau. Socket sau commit vẫn best effort; inbox bền vững trong DB.
- UI dùng thời gian trình duyệt để làm mới trạng thái trong lúc đang mở; backend quyết định permission/deadline cuối cùng. Polling hiện tại có thể trễ đến một phút; không dựa vào UI để bảo vệ write.
- Client/runtime cũ không đọc expiry metadata có thể hiểu sai `REQUESTED`; deploy đồng bộ consumer/writer và không để instance cũ ghi booking trong rollout.
- Các cảnh báo dependency từ IC-002, Prisma config deprecated, Browserslist/chunk-size vẫn tồn tại; chưa xử lý trong ticket này.

### Rollout and rollback

1. Tạm dừng booking writes; backup theo quy trình vận hành và kiểm tra cấu hình autoConfirm cũ.
2. Áp dụng `0009` nếu chưa có, rồi `0010`; chạy Prisma generate/build. Không xóa key history hoặc sửa status cũ.
3. Cập nhật đồng bộ backend/frontend và mọi booking writer. Smoke-test UTC persistence, deadline, autoConfirm và job expiry rồi mở lại writes.
4. Nếu rollback runtime về IC-003, giữ các cột/index/deadline/expiry và tạm vô hiệu booking writes: runtime cũ không biết expiry và có thể xác nhận lại lịch đã hết hạn. Không drop cột hoặc tự chuyển expiry thành hủy/no-show.

Chưa deploy hoặc áp dụng migration vào DB ứng dụng hiện có. Tab/browser, dev servers và instance MySQL tạm được dừng sau kiểm tra; dịch vụ MySQL80 hiện có được giữ nguyên.

## Next recommended ticket

**IC-005 — Admin Booking status-aware actions and pending UX:** giới hạn action theo trạng thái, giữ modal/nội dung lỗi đến mutation success, chặn thao tác trùng và hoàn thiện kiểm thử admin E2E theo Prompt C. Nền MySQL/TZ/UI hiện tại hỗ trợ mở rộng ma trận IC-010.
