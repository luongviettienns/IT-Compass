# IC-006 — Correct deceptive deletion copy: execution report

- Ngày: 2026-10-13.
- Baseline: `591b625`, checkpoint local IC-005 đã tách riêng trước ticket này.
- Nhánh: `codex/comment-deletion-copy`.
- Phạm vi: IC-006 theo [08 — Comments](08-ADMIN-MODULES.md#5-comments--adminblogcommentsmodaltsx-blog-commentservicets), [16 — Backlog](16-ISSUE-BACKLOG.md) và Prompt E trong [17 — Execution prompts](17-AGENT-EXECUTION-PROMPTS.md). Chỉ sửa ticket này.
- Trạng thái: triển khai và kiểm tra local; lưu thành commit riêng trước IC-007, chưa push/deploy.

## Findings

- UI nói “Xóa vĩnh viễn” / “không thể khôi phục”, trong khi `deleteComment` giữ nội dung, ghi `deletedAt`/`deletedBy`, loại bình luận khỏi API công khai và cho quản trị viên xem bằng bộ lọc `deleted`.
- Không có route/chức năng khôi phục bình luận. Khôi phục bài viết là một chức năng riêng, không áp dụng cho bình luận.
- Audit hiện ghi `DELETE_COMMENT`, lưu DB dưới mã `xoa_binh_luan`; bảng/export hiển thị mã kỹ thuật.
- Test tái hiện: API xóa thất bại giữ hộp mở nhưng thiếu lỗi inline; người dùng chỉ nhận toast.

## Decision

- Dùng “Xóa bình luận”, giải thích bình luận chuyển vào mục “Đã xóa”, không còn công khai, vẫn xem lại được, ghi thời điểm/người xóa và **hiện chưa có chức năng khôi phục**.
- Hiển thị audit bằng “Chuyển bình luận vào mục Đã xóa”; giữ nguyên mã action trong API/DB và giá trị gửi khi lọc.
- Không thêm hard delete, restore, migration hoặc thay đổi backend/contract. Policy khôi phục nếu cần là ticket riêng.

## Changes

- `AdminBlogCommentsModal.tsx`: sửa tooltip/aria-label/xác nhận/badge/bộ lọc, toast thành công mô tả đúng kết quả; báo lỗi ngay trong hộp xác nhận và cho thử lại. Xóa lỗi cũ khi mở/đóng/thử lại. Giữ cơ chế pending và thêm guard cho handler.
- `AdminAuditLogsPage.tsx`: nhãn `DELETE_COMMENT` nhất quán ở bộ lọc, bảng và dữ liệu export. Các action khác giữ cách hiển thị hiện hành.
- `tests/admin-comment-deletion.test.tsx`: kiểm tra lỗi inline → retry thành công → xem lại trong mục đã xóa; pending chặn nút, Escape và gửi lặp.
- Không thay đổi dependency/lockfile/backend/dist. Các thay đổi dist và `PROJECT_PROGRESS.md` có sẵn được giữ riêng.

## Tests

| Kiểm tra | Kết quả / bằng chứng |
| --- | --- |
| Fail-before | 1 failed / 1 passed, lỗi đúng ở missing inline alert; [red log](evidence/IC-006-red-ui.txt) |
| Frontend regressions | **31/31 PASS**, gồm 2 test IC-006 và 29 test trước; [test output](evidence/IC-006-frontend-tests.txt) |
| Lint, typecheck, typecheck tests, production build | Tất cả exit 0; [checks](evidence/IC-006-frontend-checks.txt) |
| Browser → API → MySQL | PASS trên schema riêng `itcompass_ic006_browser_test`, một tài khoản/post/comment tổng hợp; [DB assertions](evidence/IC-006-browser-db.json), [UI state](evidence/IC-006-browser-ui.txt) |
| Backend semantics thật | Sau click xóa, bản ghi/nội dung còn nguyên, `deletedAt` có giá trị, `deletedBy=993003`, API công khai trả 0 bình luận, đúng 1 audit với actor/target đúng |
| Desktop/mobile QA | Xác nhận 1280×720 và 390×844; mobile dialog nằm trong viewport: left 16, right 374.4, top 276.8, bottom 567.2; ảnh bên dưới |
| Review | Reviewer chỉ đọc diff: không có actionable findings; không tự nhận đã rerun tests |
| Diff check | PASS cho source/test và report |

Ảnh QA local với dữ liệu tổng hợp:

- [Xác nhận xóa](evidence/IC-006-delete-confirm.jpg).
- [Xác nhận mobile](evidence/IC-006-confirm-mobile.jpg).
- [Xem lại trong Đã xóa](evidence/IC-006-deleted-list.jpg).
- [Audit đúng action/actor/target](evidence/IC-006-audit.jpg).

Browser lỗi/pending được kiểm tra bằng test UI với promise/API doubles; browser smoke dùng backend và MySQL thật cho happy path. Lúc click bộ lọc ngay trong animation đóng hộp, click chưa đổi bộ lọc; kiểm tra lại trạng thái và chọn sau khi hộp đã đóng cho kết quả đúng, không sửa CSS vì thao tác kiểm thử này.

**NOT TESTED:** CI remote, staging/production, browser automation chạy trong CI, export tải file end-to-end, full accessibility audit và toàn bộ module admin. Không rerun booking integration suite ở ticket chỉ sửa frontend này. Build vẫn có warning Browserslist/chunk size hiện hành.

## Risks

- Chưa có khôi phục bình luận: UI nói rõ hạn chế này, không hứa chức năng chưa có.
- Giữ policy/backend hiện hành: race giữa moderation/deletion và atomicity của audit chưa được thay đổi trong IC-006.
- Query loading/error/fake-zero và localization rộng hơn thuộc IC-009/014; không kết luận toàn bộ admin đã đạt QA.
- Rollout: frontend thay đổi tương thích API hiện tại, không cần migration. Chạy QA staging rồi triển khai theo quy trình của dự án.
- Rollback: revert hai file frontend về baseline `591b625`; dữ liệu không cần rollback, nhưng nội dung xóa sai sẽ quay lại nên ưu tiên fix forward.
- DB/schema fixture chỉ nằm trong MySQL test riêng; không kết nối/migrate DB ứng dụng chính. Server/tab test được dọn sau QA, MySQL80 service chính giữ nguyên.

## Next recommended ticket

**IC-007 — Lock down proxy/rate-limit/metrics/upload** theo thứ tự backlog: kiểm tra thực tế trusted proxy, metrics access và nội dung upload; viết test tái hiện trước khi sửa. Tiếp tục từng ticket riêng; IC-009/013/014 sẽ xử lý các phần admin còn lại theo Prompt E.
