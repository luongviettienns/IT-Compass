# IC-008 — Correct public marketing claims: execution report

- Ngày: 2026-10-13; baseline `17344f2` (IC-007 checkpoint local).
- Nhánh: `codex/public-marketing-claims`; lưu IC-008 thành commit riêng trước IC-009, chưa push/deploy.
- Phạm vi: [06 — Marketing truth table](06-PUBLIC-UX-MARKETING.md#5-marketing-truth-table), IC-008 trong [16 — Backlog](16-ISSUE-BACKLOG.md), quy tắc từng ticket trong [17 — Prompts](17-AGENT-EXECUTION-PROMPTS.md).

## Findings

- Landing nói #1, 500+ học sinh, 4.8/5, 20+ mentor, 50+ bài viết, 30 câu/15 phút và hàng trăm bạn trẻ mà không có nguồn dữ liệu/bằng chứng tương ứng trong flow này. Thẻ mentor gán cứng 5.0 sao.
- Catalog/API hiện tại trả **29 câu**, `estimatedMinutes: 3`; đây là thời gian cấu hình tham khảo, chưa phải thời gian được đo/kiểm chứng trên người dùng.
- Copy dùng “Holland khoa học”, “tiêu chuẩn vàng”, “Hồ sơ năng lực”; Result hiển thị confidence và `matchPercent%` như mức khớp nghề. Code thực tế tính bằng quy tắc, không có calibration xác suất/psychometric validation trong workstream này.
- Backend fallback gọi “Hồ sơ đa năng”, nhưng có thể xảy ra do điểm thấp hoặc các nhóm chưa phân biệt. Review xác nhận nhãn này vẫn suy diễn năng lực nếu UI giữ nguyên.
- Mobile QA tìm tràn ngang 409px trên viewport 390px do animation dịch ngang của section Steps hiện hành.

## Decision

- Giữ style/layout/route hiện hành, thay nội dung theo khả năng đang có: khám phá sở thích, tìm hiểu công việc, gợi ý tham khảo và trao đổi mentor.
- Bỏ số liệu/đánh giá không có nguồn. Landing và Test lấy count/time của template đang dùng; thời gian được gọi rõ là **tham khảo**, không cam kết hoàn thành trong 3 phút. Khi API lỗi/loading/metadata không hợp lệ, không tự thay bằng số bịa.
- Mentor hiển thị `reviewCount` API thay cho 5.0 sao. Số hướng nghề lấy từ danh sách; Test không tính `Fallback` là một nghề.
- Result giữ giá trị chấm điểm V1 nhưng hiển thị **điểm gợi ý /100**, giải thích quy tắc và giới hạn; bỏ confidence khỏi UI. Biểu đồ Holland giải thích phần trăm tương đối với nhóm điểm cao nhất, không phải tỷ lệ năng lực.
- Không hiển thị lời khẳng định năng lực từ summary snapshot trong các trang Test/Result. Fallback dùng “Chưa có hướng nổi bật”, kèm hướng tiếp tục khám phá.
- Không thay thuật toán, API, version, câu hỏi, policy đăng nhập hay dữ liệu đã lưu. Scientific validation / Assessment V2 / scoring interpretation sâu hơn thuộc IC-011/012.

## Changes

- `LandingPage.tsx`: hero và CTA `/test`/`/majors`, features/steps/final CTA/meta, gỡ social proof tự gán, rating mentor đúng nguồn; lấy số hướng từ `CAREER_PATHS.length`. Wrapper `main` với `overflow-x-clip` xử lý tràn ngang khi animation chạy.
- **New** `AssessmentFacts.tsx`: dùng shared query key của template, kiểm tra count/time hợp lệ và hỗ trợ template Test đã tải; không thêm endpoint hoặc dependency.
- `TestPage.tsx`: metadata nhất quán với Landing, nhóm nghề loại Fallback, copy tham khảo và preview Fallback trung tính.
- `ResultPage.tsx`: title/heading/Fallback/copy/score và Holland explanation; mentor/ngành học là thông tin để tìm hiểu, không hứa tự cập nhật khi chức năng đó chưa có.
- `QuizPage.tsx`, `Footer.tsx`, `index.html`: nội dung đăng nhập/SEO/footer nhất quán, bỏ hàm ý kết quả đánh giá chính thức/khoa học.
- **New** 3 metadata tests cho hành vi dữ liệu thay đổi/không tải được/không hợp lệ. Không viết test chỉ lặp chuỗi copy của thay đổi tĩnh; dùng source audit và browser QA cho phần đó.
- Không đổi backend source, migrations, dependencies/lockfile hoặc scoring/storage; dist/progress có sẵn ngoài ticket được giữ riêng.

## Tests

| Kiểm tra | Kết quả / bằng chứng |
| --- | --- |
| Fail-before | Metadata component chưa tồn tại trước triển khai; [red metadata](evidence/IC-008-red-metadata.txt). Các copy sai được xác nhận trực tiếp tại baseline/source |
| Frontend tests | **36/36 PASS**, gồm 3 mới + 33 regressions; [checks](evidence/IC-008-frontend-checks.txt) |
| Metadata behavior | API 29/3 → cache template 42/8 cập nhật UI; pending/error/invalid không tạo số giả |
| Lint/typecheck/typecheck tests/build | Đều exit 0; cùng log checks trên |
| Backend checkpoint | 84/84 unit PASS trước khi lưu IC-007 / bắt đầu IC-008; không có sửa backend trong ticket này |
| Guest browser | Landing → Test cho 29 câu/thời gian tham khảo 3 phút → mở Quiz câu 1/29 khi chưa đăng nhập |
| Result browser | Tài khoản tổng hợp đọc attempt tạo bằng service/scorer thật; hiển thị /100 và giới hạn; Fallback thật có heading/meta/preview trung tính; [UI states](evidence/IC-008-browser-ui.txt) |
| DB preservation | Summary, raw scores và answers của attempt gốc giữ nguyên; DB vẫn lưu title fallback cũ nhưng UI dùng nhãn trung tính; [DB verification](evidence/IC-008-db-verification.json), [initial fixture](evidence/IC-008-browser-data.json), [fallback fixture](evidence/IC-008-fallback-data.json) |
| Mentor card | DB fixture reviewCount=0, browser hiển thị 0 đánh giá và không gán 5.0 sao |
| Mobile/keyboard | 390×844: hết tràn ngang, hai CTA nằm trong viewport; [layout assertions](evidence/IC-008-mobile-layout.json). Tab từ primary CTA đến secondary CTA đúng |
| Review | Fallback finding đã sửa; review cuối không còn actionable findings. Reviewer không rerun suites/browser |
| Diff check | PASS source/index/report; không stage thay đổi ngoài ticket |

Ảnh QA với dữ liệu tổng hợp, không phải số liệu sản phẩm thực:

- [Landing desktop](evidence/IC-008-landing-desktop.jpg), [Landing mobile](evidence/IC-008-landing-mobile.jpg).
- [Test metadata mobile](evidence/IC-008-test-mobile.jpg), [Test Fallback preview](evidence/IC-008-test-fallback.jpg).
- [Result scores](evidence/IC-008-result-scores.jpg), [Result Fallback](evidence/IC-008-result-fallback.jpg).
- Số đánh giá mentor được đối chiếu trong [UI states](evidence/IC-008-browser-ui.txt) và DB verification ở trên.

DB browser riêng `itcompass_ic008_browser_test` có một học viên, một mentor, một bài viết và ba attempts tổng hợp. Một probe trả lời thấp nhưng chọn toàn bộ option đầu tiên vẫn không tạo Fallback do bonus tình huống; giữ probe đó và dùng scorer chọn bộ đáp án thực sự tạo Fallback, không sửa dữ liệu/thuật toán để ép kết quả. Không kết nối DB ứng dụng chính.

**NOT TESTED:** production/staging số người dùng/đánh giá thực; kiểm chứng thời gian làm bài; psychometric validation; CI remote; full 29-answer browser submission/draft-login-resume; full reduced-motion/accessibility/performance audit; toàn bộ public/Profile/admin copy ngoài scope; SEO indexing hoặc conversion lift. Không rerun MySQL booking integration cho ticket frontend copy này. Build vẫn có warning Browserslist/chunk size hiện hành.

## Risks

- Số metadata phụ thuộc API/cấu hình active template. Không coi estimatedMinutes là bằng chứng thời gian hoàn thành thực tế.
- V1 API/storage vẫn giữ `matchPercent`, `confidence`, summary cũ để tương thích; các consumer khác/Profile và các nhãn lịch sử cần đánh giá tiếp trong IC-012. Không tuyên bố toàn bộ sản phẩm đã được kiểm chứng khoa học.
- Mismatch gợi ý ngành theo slug/title và logic primary result so với ranking hiện hành chưa được thay đổi; UI chỉ ghi đúng giới hạn và empty state, không hứa kết quả chưa có.
- Policy mentor verification hiện hành chưa được định nghĩa lại. Thay đổi này chỉ bỏ rating tự gán và phản ánh trường API đã có.
- Rollout: frontend build tương thích API hiện tại, không migration/env/dependency mới; QA staging trước deploy theo quy trình dự án.
- Rollback: revert các file frontend/report về baseline `17344f2`; dữ liệu không cần rollback nhưng copy sai sẽ quay lại, nên ưu tiên fix forward.
- Tab/server/MySQL test được dọn sau QA, service MySQL80 chính giữ nguyên. Không gửi email, deploy, hoặc push main.

## Next recommended ticket

**IC-009 — Admin loading/empty/error/success states:** xử lý API lỗi bị hiển thị thành số 0 hoặc danh sách trống; dùng retry và error state rõ ràng, từng module theo phạm vi review được.
