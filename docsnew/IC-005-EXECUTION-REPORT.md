# IC-005 — Admin booking actions and pending UX: execution report

- Ngày: 2026-10-13.
- Baseline: `683e6d327fdbe74bafd06ed6efe09dd10745af47`, checkpoint local IC-004 đã tách riêng trước ticket này.
- Nhánh: `codex/admin-booking-actions`.
- Phạm vi: IC-005 theo [08-ADMIN-MODULES.md](08-ADMIN-MODULES.md), [16-ISSUE-BACKLOG.md](16-ISSUE-BACKLOG.md), Prompt C trong [17-AGENT-EXECUTION-PROMPTS.md](17-AGENT-EXECUTION-PROMPTS.md). Dùng policy backend từ IC-002/003/004.
- Trạng thái: triển khai và kiểm tra local; lưu thành commit riêng trước IC-006, chưa push hoặc deploy staging/production.

## Findings

1. **Reproduced:** modal của lịch đã hủy, hoàn thành, không tham dự hoặc hết hạn vẫn chứa Confirm/Complete/NoShow/Cancel. Một số nút chỉ disabled, không có giải thích phù hợp với trạng thái.
2. **Observed / covered by regressions:** Confirm/Complete đóng chi tiết ngay khi gọi `mutate`, trước phản hồi API; lỗi chỉ có toast. Cancel không hiện lỗi trong hộp xác nhận và không cập nhật chi tiết bằng kết quả trả về.
3. **Reproduced:** tải detail thất bại vẫn cho xử lý bản ghi cũ lấy từ list; lỗi tải list hiện như hàng chờ rỗng.
4. **Reproduced:** chưa có hàng chờ pending mặc định. Sau khi xử lý làm row rời hàng chờ, đóng modal không trả focus về một control còn tồn tại.
5. **Reproduced:** deadline có thể trôi qua trong lúc hộp xác nhận mở mà callback vẫn gửi request dựa trên điều kiện từ lần render trước.
6. **Reproduced:** lỗi expiry trả bằng tiếng Anh; chưa phân biệt mentor hủy với quản trị viên hủy qua `cancelledBy=SYSTEM`. Timeline chưa phản ánh lần cập nhật kết quả không tham dự.

## Decision

Giữ nguyên API và policy backend; UI dùng bảng hành động theo trạng thái, deadline và metadata outcome của server. Backend vẫn là nơi quyết định permission và xử lý race cuối cùng.

| Trạng thái | Hành động admin |
|---|---|
| `REQUESTED`, còn hạn, buổi tư vấn chưa bắt đầu | Xác nhận, hủy |
| `REQUESTED` đã hết hạn | Chỉ xem |
| `CONFIRMED`, chưa đủ điều kiện review kết quả | Hủy; giải thích khi nào có thể ghi kết quả |
| `CONFIRMED`, server báo cần review và endAt đã qua | Hoàn thành, không tham dự, hủy |
| Đã hủy / `COMPLETED` / `NO_SHOW` | Chỉ xem |

Admin hủy lịch `CONFIRMED` đã hết giờ vẫn được giữ vì backend hiện cho phép. Ticket này không bổ sung restriction nghiệp vụ mới. Xác nhận và hoàn thành có bước xem hệ quả; hủy/không tham dự yêu cầu lý do/căn cứ 3–500 ký tự như UI hiện hành, trim trước khi gửi.

Một mutation dùng chung quản lý cả bốn thao tác, với mutex ref chặn gửi lặp ngay trong cùng lượt event. Detail và nội dung review vẫn được giữ khi API lỗi. Success ghi cache/chi tiết từ phản hồi API và hiển thị xác nhận trong modal; không dựa vào toast để báo kết quả. List/detail được làm mới sau phản hồi để cập nhật state/permission.

## Changes

- Thêm [adminBookingPolicy.ts](../frontend/src/lib/adminBookingPolicy.ts) làm nguồn duy nhất cho action eligibility và nội dung xác nhận/kết quả.
- Tách [AdminBookingDetailModal.tsx](../frontend/src/components/admin/AdminBookingDetailModal.tsx) từ modal inline: có role/label, Escape, focus trap/return, scroll lock, inert khi review dialog nằm trên, reload và trạng thái loading/error/success. Khi opener đã rời hàng chờ, focus trở lại bộ lọc.
- [AdminBookingsPage.tsx](../frontend/src/pages/admin/AdminBookingsPage.tsx) dùng một mutation và khóa pending chung. Không đóng/đổi record khi đang xử lý; không cho ghi từ detail stale, thất bại hoặc đang refetch.
- Kiểm tra eligibility lại tại thời điểm mở/gửi review; nếu deadline vừa qua thì giữ dialog, hiện lỗi và refresh, không gửi mutation lỗi thời.
- Default filter là hàng chờ `REQUESTED` còn hạn của IC-004. Filter/search/page hiện có được giữ sau mutation; API result vẫn nằm trong modal khi row rời queue.
- Lỗi list khác với empty state, có reload; lỗi detail giữ bản ghi để tham khảo nhưng khóa action cho đến khi tải được dữ liệu mới.
- Timeline dùng timestamp API: tạo, xác nhận, expiry, hủy, hoàn thành. `NO_SHOW` hiển thị “Cập nhật kết quả không tham dự” theo `updatedAt`, không giả định đó là timestamp audit riêng.
- Giữ zone/deadline và lịch sử hủy/lý do. Xác nhận và hoàn thành nêu rõ hệ quả; no-show giữ yêu cầu căn cứ đã kiểm tra.
- Việt hóa các nhãn, loại yêu cầu, pagination và export trong module. Dùng chung status label; `SYSTEM` được ghi là quản trị viên hủy trên admin/student/mentor và export. Actor chưa biết được mô tả là mentor hoặc quản trị viên.
- Thêm mapping tiếng Việt cho expiry/state-conflict/outcome-conflict/busy/invalid outcome-time errors.
- Shared `AdminActionDialog` thêm prop tùy chọn khóa riêng nút gửi khi action không còn hợp lệ; default của các consumer khác giữ nguyên.
- Không sửa backend source, Prisma schema, routes hoặc dependency/lockfile. Không tạo migration mới.

## Tests

Môi trường: Windows, Node `24.19.0`, npm `11.17.0`, MySQL `8.0.46`. Dùng dữ liệu tổng hợp và instance/schema riêng.

| Kiểm tra local | Kết quả |
|---|---|
| Frontend full suite, UTC | **29/29 PASS** |
| Frontend full suite, Asia/Ho_Chi_Minh | **29/29 PASS** |
| Frontend lint / source typecheck / test typecheck / build | PASS |
| Backend unit regression | **40/40 PASS** |
| MySQL integration regression, UTC | **39/39 PASS** |
| Diff whitespace check | PASS |

**108 test riêng biệt PASS**; lần chạy lại ở timezone khác không cộng vào số test riêng biệt. Backend source/schema không thay đổi trong IC-005, nên không lặp lại generate/migration/build đã kiểm tra ở IC-004.

- 12 regression UI đầu chạy thất bại trước sửa; các regression expiry error, list/error/focus, deadline trôi qua trong dialog và no-show timeline cũng chạy red → green.
- 18 test mới kiểm tra terminal/expired read-only, action hợp lệ, detail read failure, cancel retry giữ reason, confirm/complete failure, pending/duplicate/close guards, inline success, default queue, conflict refresh, focus fallback và fresh deadline check.
- Năm test outcome IC-002 được giữ và điều chỉnh theo chủ đích mới: action không hợp lệ bị ẩn; tên modal được Việt hóa. Polling và no-show input/error/pending vẫn được kiểm chứng.
- Review độc lập cuối không còn actionable finding; reviewer không chạy lại suite hoặc browser smoke.

### Browser → API → MySQL → UI

Đã chạy frontend/backend thật với auth/JWT/session/socket, backend TZ=UTC và schema `itcompass_ic005_browser_test`:

1. Login admin giả lập; hàng chờ mặc định chỉ gồm hai request còn hạn.
2. Xác nhận `4001`: API lưu `CONFIRMED` và tạo một conversation; row rời queue nhưng detail vẫn mở, có kết quả và state mới. Đóng detail trả focus về filter.
3. Xác nhận legacy overlap `4003`: backend từ chối 409; dialog hiển thị lỗi tiếng Việt và giữ detail/context. Không báo thành công giả.
4. Hủy `4003` có lý do: DB lưu `CANCELLED_BY_MENTOR` + actor `SYSTEM` và đúng reason; detail hiển thị quản trị viên hủy, không còn action.
5. Hoàn thành `4002` đã hết giờ: API lưu `COMPLETED`/timestamp, detail tiếp tục mở và chỉ đọc.
6. Không tham dự `4008` đã hết giờ: nút gửi disabled khi chưa có căn cứ; nhập căn cứ tổng hợp rồi API lưu `NO_SHOW`, detail có kết quả và cập nhật timeline.
7. Mở history/expiry `4006`: chỉ có đóng/reload, không có action nghiệp vụ. Trạng thái lịch cũ khác được giữ.
8. Kiểm tra ở 1280×800 và 390×844. Modal detail có bounds ngang 12–378px, popup review khoảng 16–374px ở viewport 390px; cả hai nằm trong chiều cao 844px.

Đối chiếu DB xác nhận đủ tám fixture, một conversation, sáu notification và các trạng thái/actor/reason nêu trên. Không gửi chat/email hoặc thông báo ra hệ thống bên ngoài.

Bằng chứng: [frontend checks](evidence/IC-005-frontend-checks.txt), [backend regression](evidence/IC-005-backend-regression.txt), [DB browser](evidence/IC-005-browser-db.json), [xác nhận thành công](evidence/IC-005-confirm-success.jpg), [lỗi 409](evidence/IC-005-confirm-conflict.jpg), [hủy](evidence/IC-005-cancel-success.jpg), [hoàn thành](evidence/IC-005-complete-success.jpg), [không tham dự](evidence/IC-005-no-show-success.jpg), [expiry mobile](evidence/IC-005-expired-mobile.jpg), [review mobile](evidence/IC-005-review-mobile.jpg).

## Risks

- **NOT TESTED:** CI trên GitHub, staging/production, rollout thực tế, automated browser suite, full screen-reader/axe audit và mọi luồng của các module admin khác. Browser smoke local có phạm vi cụ thể như trên.
- Pending/duplicate guards được kiểm chứng bằng promise điều khiển trong component tests. Browser dùng API local thật; chưa mô phỏng mạng production chậm/mất kết nối trong browser.
- Backend contract vẫn quyết định các state/time races và auth. UI refresh không bảo đảm record không bị admin khác đổi ngay sau lần đọc; lỗi server giữ dialog và reload state để xử lý lại.
- Căn cứ no-show và actor outcome tiếp tục được ghi trong application logs theo IC-002; DTO không cung cấp audit/evidence hoặc delivery-status timeline riêng. UI chỉ hiển thị metadata có thật.
- UI clock dùng giờ browser; API dùng server time. Chặn lại tại submit giúp xử lý deadline trôi qua giữa các lần render; không thay thế đồng bộ clock hoặc backend guard.
- Build còn cảnh báo Browserslist/chunk size và một lần plugin timing; backend suite còn Prisma config deprecation. Các dependency findings từ ticket trước chưa được xử lý.

### Compatibility and rollback

Không có migration hoặc API change mới. Backend cần có IC-002/003/004 để cung cấp metadata/guards tương ứng. Rollout frontend theo quy trình hiện tại; chưa deploy trong ticket này.

Nếu rollback frontend về IC-004, giữ backend/migration IC-004: data vẫn tương thích, nhưng modal UX/action visibility cũ quay lại. Tạm hạn chế thao tác admin nếu cần rollback khẩn cấp; không đổi hoặc xóa booking/history để rollback UI.

Giữ nguyên các diff build ngoài phạm vi và `PROJECT_PROGRESS.md` đã tồn tại lúc bắt đầu. Tab và dev servers kiểm thử được đóng, instance MySQL tạm dừng sau xác minh data directory; dịch vụ MySQL80 hiện có không bị thay đổi.

## Next recommended ticket

**IC-006 — Correct deceptive deletion copy:** đối chiếu soft delete của bình luận với lời xác nhận và audit wording; xử lý đúng một ticket tiếp theo. Sau đó IC-007 cho proxy/rate-limit/metrics/upload; mở rộng browser automation và full-role matrix trong IC-010.
