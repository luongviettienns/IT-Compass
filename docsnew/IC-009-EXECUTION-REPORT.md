# IC-009 — Admin loading, error, empty and ready states: execution report

- Ngày: 2026-10-13; baseline `6a7c5f4` (checkpoint IC-008 local).
- Nhánh: `codex/admin-query-states`; checkpoint commit cục bộ trước IC-010 ngày 2026-10-14; chưa push/deploy. Kiểm tra lại 47/47 frontend tests và typecheck tests PASS trước checkpoint.
- Phạm vi: IC-009 trong [16 — Backlog](16-ISSUE-BACKLOG.md), read-state requirements của [07 — Dashboard](07-ADMIN-DASHBOARD.md#4-dataapi-integration) / [08 — Foundation](08-ADMIN-MODULES.md#1-all-modules-foundation-rules), quy tắc từng ticket của [17 — Prompts](17-AGENT-EXECUTION-PROMPTS.md).

## Findings

- Dashboard dùng fallback 0 cho các metric khi query lỗi và đợi mọi query cùng tải trước khi hiển thị phần thành công.
- Users/Mentors thiếu error/retry riêng; header/summary có thể hiển thị số 0. Dòng cache vẫn có thể hiện sau background refresh lỗi.
- Assessments ghép loading stats/list, dùng fallback 0/0% và cho lỗi danh sách xuất hiện như empty. Stats thiếu field cũng có thể thành các số 0 hợp lệ giả.
- Bookings đã có error handling từ IC-005, nhưng chưa dùng read boundary chung; cached list/pagination và export cần được bảo vệ khi đọc không thành công.
- Review tìm thấy regression trong cách khóa export ban đầu: gate `isOpen` theo query readiness làm cửa sổ biến mất/mở lại và reset lựa chọn. Đã thay bằng giữ cửa sổ, unknown counts, error/reload và khóa submit.

## Decision

- Loading không phải empty; lỗi API/dữ liệu thiếu không phải 0. Chỉ response thành công, đủ cấu trúc cần dùng mới được hiển thị table/summary/empty và xuất dữ liệu.
- Query boundaries độc lập để lỗi một nguồn không che phần đã tải thành công. Stats/list Assessments được tách riêng.
- Trong lúc background refresh còn có dữ liệu hợp lệ, hiển thị trạng thái “Đang cập nhật”; khi refresh thất bại, ẩn các rows/pagination không còn đáng tin để tránh thao tác từ table cache.
- Retry giữ search/filter/page. Không đổi nghiệp vụ, quyền, API hoặc schema.
- Export giữ CSV/XLSX, phạm vi/cột/tên file qua lỗi/phục hồi; nguồn chưa sẵn sàng được báo rõ, counts là “—”, khóa nút xuất và có reload ngay trong cửa sổ.

## Changes

- **New** `AdminQueryBoundary.tsx`: loading/status, contextual error/alert, retry disabled lúc fetch, refresh indicator; không render children khi query lỗi hoặc nguồn chưa đủ dữ liệu.
- `AdminDashboard.tsx`: mỗi KPI/breakdown/trend dùng query riêng, gỡ global loading gate, unknown values không biến thành 0.
- `AdminUsersPage.tsx`: response readiness, unknown header total, list boundary, ẩn cached rows sau lỗi và khóa mở export khi không có nguồn.
- `AdminMentorsPage.tsx`: summary/list boundary chung, kiểm tra array/pagination/numeric summary; lỗi không biến thành 4 số 0.
- `AdminAssessmentsPage.tsx`: stats/list readiness và boundaries độc lập, phân biệt missing stats với 0%, giữ filters/page và bảo vệ export.
- `AdminBookingsPage.tsx`: dùng boundary chung cho list; giữ detail/action modal ngoài boundary và policy IC-005; export dùng nguồn hợp lệ.
- `AdminExportModal.tsx`: thêm optional `dataUnavailable`/`isReloading`/`onReload`, error/reload/unknown counts/submit guard; các consumer khác giữ default hiện hành. Thêm aria-pressed cho lựa chọn format.
- **New** 11 regression cases `admin-query-states.test.tsx`. Không thêm dependency, đổi backend source, migration hoặc lockfile. Dist/progress ngoài ticket được giữ riêng.

## Tests

| Kiểm tra | Kết quả / bằng chứng |
| --- | --- |
| Fail-before | 6 failed / 1 passed trước sửa; [red states](evidence/IC-009-red-states.txt). 2 cases thiếu payload failed; [red incomplete](evidence/IC-009-red-incomplete.txt). Export regression failed trước correction; [red export](evidence/IC-009-red-export.txt) |
| Frontend regressions | **47/47 PASS**, 36 trước + 11 mới; [checks](evidence/IC-009-frontend-checks.txt) |
| Specific coverage | Partial dashboard error vs successful zero; Users filter/search retry; failed page 2 stays page 2; cache rows hidden on failed refresh; Mentor malformed/error; stats/list independent; missing stats not 0%; export choices retained through error/recovery |
| Booking regression | 23 cases của IC-002/004/005 PASS, nằm trong tổng 47; không double count |
| Lint/typecheck/typecheck tests/build | Đều exit 0, cùng checks log |
| Real browser/API faults | Proxy local gây GET 500 cho stats/list, giữ backend/DB/auth thật; Dashboard partial errors và true zeros, Assessments stats error/list empty hợp lệ, Users failure → retry giữ query/filter, Mentor true-empty; [UI states](evidence/IC-009-browser-ui.txt), [injected paths](evidence/IC-009-injected-requests.txt) |
| Export browser | Poll Bookings thật làm nguồn unavailable trong khi cửa sổ vẫn mở; CSV/tên file được giữ, submit khóa, counts unknown. Reload sau khi nguồn phục hồi giữ lựa chọn; [error proof](evidence/IC-009-export-error-proof.json), [recovery proof](evidence/IC-009-export-recovery-proof.json) |
| DB scope | Schema test riêng, 2 users tổng hợp và counts Mentor/Attempt/Booking/Post thật đều 0; [DB counts](evidence/IC-009-browser-db.json). Không mutation nghiệp vụ trong QA |
| Mobile smoke | Dashboard error/retry trên 390×844, scrollWidth=390; [layout](evidence/IC-009-mobile-layout.json). Không thay thế full responsive/accessibility audit |
| Review | Export finding đã sửa; review cuối không còn actionable findings. Reviewer không rerun suites/browser |
| Diff check | PASS source/report; chỉ stage ticket tại checkpoint tiếp theo |

Ảnh QA local:

- [Dashboard partial error](evidence/IC-009-dashboard-partial-error.jpg).
- [Dashboard mobile error](evidence/IC-009-dashboard-mobile-error.jpg).
- [Assessments stats error / list empty hợp lệ](evidence/IC-009-assessment-partial-error.jpg).
- [Users lỗi](evidence/IC-009-users-error.jpg), [Users sau retry](evidence/IC-009-users-recovered.jpg).
- [Mentors empty success](evidence/IC-009-mentors-empty-success.jpg).
- [Export nguồn unavailable](evidence/IC-009-export-unavailable.jpg).

Môi trường riêng: frontend 54020, fault proxy 54019, backend 54018, DB `itcompass_ic009_browser_test` trên MySQL test 54160. Dùng cookie `ic009_refresh_test` riêng để không ghi đè cookie app hiện hành. Backend/API không bị sửa để gây lỗi; fault helper chỉ nằm trong `.git` và trả 500 ở các GET path được chọn.

Một lượt kiểm tra export bị hot reload do chỉnh whitespace lúc cửa sổ đang mở, khiến effect reset config; bỏ lượt đó và chạy lại với source cố định. Không sửa product để phục vụ test. QA export không bấm tạo/tải file thật.

**NOT TESTED:** CI remote, staging/production, download XLSX/CSV end-to-end, toàn bộ mutation/partial bulk failure, full accessibility/reduced-motion/keyboard audit, performance, module CMS/comments/audit/settings ngoài scope. Không rerun backend/MySQL booking suite vì không có thay đổi backend. Browser proof thể hiện tình huống local tổng hợp, không phải số liệu sản phẩm thật.

## Risks

- Readiness kiểm tra các field cần dùng, không thay thế runtime schema validation toàn API.
- Hide-on-error ưu tiên không trình bày cache như dữ liệu hiện tại; trong khi refresh đang chạy vẫn giữ snapshot hợp lệ với indicator cập nhật. Không đổi authority server hoặc policy mutation.
- Header search inert, dashboard inbox/new KPI definitions, localization rộng hơn và bulk-selection policy vẫn thuộc ticket khác (IC-013/014 và workstreams liên quan).
- Existing export data/format/scopes không redesign; correction chỉ bảo vệ nguồn và giữ lựa chọn khi read failure. Các consumer ngoài scope không được tuyên bố đã xử lý mọi query error.
- Rollout: frontend build tương thích backend hiện hành, không migration/env/dependency mới. QA staging trước deploy theo quy trình dự án.
- Rollback: revert các frontend files về `6a7c5f4`; dữ liệu không cần rollback, nhưng fallback gây hiểu nhầm sẽ quay lại nên ưu tiên fix forward.
- QA dùng tab/ports/schema riêng, không main DB; dọn process/cookie/tab test sau khi kiểm tra, giữ MySQL80 service chính.

## Next recommended ticket

**IC-010 — CI + critical automated tests:** nền lint/types/build/booking test đã có từ IC-002/003; đối chiếu gap hiện tại rồi bổ sung automation cho các flow auth/role/admin/browser còn thiếu, không tạo lại nền đã có.
