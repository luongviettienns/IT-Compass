# IT COMPASS — UPGRADE MASTER PLAN

> Bộ yêu cầu và kế hoạch thực thi để coding agent nâng cấp IT Compass **trên mã nguồn hiện tại**.
>
> Repo: https://github.com/luongviettienns/IT-Compass  
> Baseline đã đối chiếu: `main` tại commit `4167a14e446beed1b42caf5ff69d12bcd9f77d1b` (2026-05-30).  
> Soạn: 2026-10-12. **Agent bắt buộc kiểm tra lại HEAD và diff trước khi thực hiện**.

## 1. Tóm tắt quyết định kỹ thuật và sản phẩm

**Giải pháp tối ưu:** `Stabilize → Validate → Convert → Engage → Learn`.

1. **Không viết lại toàn bộ.** Giữ React 19 + TypeScript + Vite + Tailwind + Motion + TanStack Query; Express 5 + TypeScript + Prisma + MySQL + Redis + Socket.IO. Giữ các routes/API đang chạy; thực hiện migration có tương thích ngược.
2. **An toàn và độ kín nghiệp vụ đi trước animation/game/ML.** Sửa xác minh email và reset mật khẩu, job và state machine booking, bộ test, CI, audit logging; không tuyên bố chức năng chưa triển khai là đã hoàn chỉnh.
3. **Assessment V2 là mô hình sở thích + trải nghiệm, không phải 'AI chấm ngành chính xác'.** Bản V1 không được ghi đè. Bỏ ý nghĩa xác suất sai lệch của `% khớp`; thận trọng với các nhãn confidence.
4. **Trang chủ chuyển từ liệt kê tính năng sang cung cấp giá trị ngay.** Hero nói đúng vấn đề người dùng; không dựng social proof giả; chưa được quảng bá mini-game như đã có khi vẫn chưa triển khai.
5. **Admin chuyển từ dashboard số liệu sang work queue.** Hành động chỉ xuất hiện khi hợp lệ; không đóng modal trước mutation success; các màn phải có Loading / Error / Empty / Success.
6. **Mini-game tích hợp như một feature độc lập** sau khi P0/P1 đã xong. Ưu tiên UX Rescue → Server Crisis → Cyber Detective, dùng chung mission engine, lưu event có kiểm soát.
7. **ML chỉ triển khai khi có dữ liệu và nhãn độc lập.** ML V1 tập trung gợi ý hoạt động tiếp theo, không dự đoán chắc chắn ngành nghề hay năng lực tương lai.

## 2. Mục lục theo phạm vi

| Thứ tự | File | Người phụ trách chính | Mức ưu tiên |
|---|---|---|---|
| 00 | [00-AGENT-RULES.md](00-AGENT-RULES.md) | Tech Lead / Agent | Bắt buộc |
| 01 | [01-PRODUCT-VISION.md](01-PRODUCT-VISION.md) | PM / UX | P1 |
| 02 | [02-AUTH-SECURITY-PRIVACY.md](02-AUTH-SECURITY-PRIVACY.md) | Backend / Security | P0 |
| 03 | [03-BOOKING-BUSINESS-FLOWS.md](03-BOOKING-BUSINESS-FLOWS.md) | Backend / BA | P0 |
| 04 | [04-ASSESSMENT-V2.md](04-ASSESSMENT-V2.md) | Product / Assessment | P1 |
| 05 | [05-ML-RECOMMENDATION.md](05-ML-RECOMMENDATION.md) | Data / ML | P3 |
| 06 | [06-PUBLIC-UX-MARKETING.md](06-PUBLIC-UX-MARKETING.md) | UX / Frontend | P1–P2 |
| 07 | [07-ADMIN-DASHBOARD.md](07-ADMIN-DASHBOARD.md) | Frontend / Operations | P1 |
| 08 | [08-ADMIN-MODULES.md](08-ADMIN-MODULES.md) | Frontend / BA | P0–P2 |
| 09 | [09-MENTOR-STUDENT-UX.md](09-MENTOR-STUDENT-UX.md) | Frontend / Product | P1–P2 |
| 10 | [10-MISSION-ENGINE-GAMES.md](10-MISSION-ENGINE-GAMES.md) | Fullstack / Game UX | P2 |
| 11 | [11-ANALYTICS-GROWTH.md](11-ANALYTICS-GROWTH.md) | Analytics / Growth | P1–P2 |
| 12 | [12-DESIGN-SYSTEM-ACCESSIBILITY.md](12-DESIGN-SYSTEM-ACCESSIBILITY.md) | UI/UX / QA | P1 |
| 13 | [13-QA-CICD-OPERATIONS.md](13-QA-CICD-OPERATIONS.md) | QA / DevOps | P0 |
| 14 | [14-END-TO-END-FLOW-MATRIX.md](14-END-TO-END-FLOW-MATRIX.md) | QA / BA | P0–P2 |
| 15 | [15-DELIVERY-ROADMAP.md](15-DELIVERY-ROADMAP.md) | Tech Lead / PM | Bắt buộc |
| 16 | [16-ISSUE-BACKLOG.md](16-ISSUE-BACKLOG.md) | Agent / Maintainer | Bắt buộc |
| 17 | [17-AGENT-EXECUTION-PROMPTS.md](17-AGENT-EXECUTION-PROMPTS.md) | Operator | Bắt buộc |
| 18 | [18-BEST-SOLUTION-ARCHITECTURE.md](18-BEST-SOLUTION-ARCHITECTURE.md) | Architecture / Owner | Quyết định |

## 3. Phân biệt phát hiện và đề xuất

- **OBSERVED:** tồn tại trực tiếp trong nguồn tại baseline, ví dụ header Admin có input không có handler; `AdminSettingsPage` là coming soon; `assessment.questions.ts` có 24 câu RIASEC + 5 tình huống; `assessment.scoring.ts` chuẩn hóa ngành hạng nhất thành `100%`.
- **RISK / VERIFY:** cần reproduction/test hoặc xác minh hạ tầng, ví dụ double booking dưới concurrency, timezone production, hiệu năng Lighthouse, độ chuẩn accessibility, provider email ngoài repo, backup DB ngoài repo.
- **PROPOSED:** chức năng chưa có hoặc thiết kế tương lai, ví dụ mission engine, work queue, ML recommender, integration API gửi email.

Agent **không được** đổi RISK thành 'lỗi đã tái hiện' hoặc PROPOSED thành 'đã có'. Mọi xác nhận triển khai phải dựa trên diff và test.

## 4. Architecture decisions (chốt mặc định)

- **Backend chính:** tiếp tục Express + Prisma. Không thêm microservice nếu không cần. Giao tiếp REST với React; Socket.IO giữ riêng các tính năng realtime.
- **Time:** booking lưu mốc UTC và `IANA timezone` rõ ràng; hiển thị theo timezone mentor/người dùng; mọi quy tắc lịch tính theo timezone kinh doanh, không `new Date(...)` phụ thuộc host TZ.
- **Booking concurrency:** serialize mutation theo mentor/calendar resource trong DB transaction có kiểm chứng; tránh chỉ `findMany` rồi `create`. Test nhiều request đồng thời là bắt buộc.
- **Email:** một provider transactional (SMTP/Resend/Postmark tùy hạ tầng) qua adapter, template versioned, background/outbox delivery, không log reset token.
- **Frontend UI:** dùng design system hiện có, nâng cấp component chung trước khi sửa 9 trang admin; không tái tạo mọi component.
- **Telemetry:** product events versioned, người dùng chưa đồng ý thì tối thiểu hóa tracking; không gửi raw Holland answers cho third-party analytics.
- **ML:** baseline rule-based, dữ liệu được đồng ý + nhãn thực sự, offline evaluation → shadow mode → A/B → rollback.

## 5. Quy trình dùng bộ tài liệu

1. Đọc `00-AGENT-RULES.md`, `15-DELIVERY-ROADMAP.md`, `16-ISSUE-BACKLOG.md`.
2. Kiểm tra HEAD của repository, package scripts, Prisma schema, các route và test hiện hành; liệt kê chỗ lệch giữa tài liệu và repo.
3. Chỉ thực hiện **một workstream / PR** sau mỗi vòng, dùng ID ticket `IC-*`; không một lần sửa toàn bộ.
4. Với mỗi ticket: tái hiện (khi là bug) → test red → sửa ít nhất cần thiết → test green → QA UI & accessibility → cập nhật doc.
5. Chạy lint, typecheck, build, test, review migration và bảo mật; chuẩn bị PR kèm screenshot, steps kiểm thử và cách rollback.
6. Không tự deploy production, gửi email thật, xóa dữ liệu hoặc push `main` nếu chưa có chấp thuận rõ ràng.

## 6. Định nghĩa Done chung

- Thỏa acceptance criteria của ticket; mọi trạng thái loading/error/empty/success rõ ràng.
- API hợp đồng tương thích hoặc có migration/deprecation; xử lý permission & concurrency.
- Có unit/integration tests cho nghiệp vụ; Playwright cho luồng người dùng liên quan.
- Không dùng `any`, không hardcode bí mật, không tạo kết quả AI/hứa hẹn độ chính xác không có cơ sở.
- UI đáp ứng desktop/mobile, keyboard navigation và reduced motion.
- Có feature flag cho thay đổi lớn, metrics phù hợp, rollback plan và cập nhật README/changelog.

## 7. Liên kết tham khảo nhanh trong repo

- `frontend/src/App.tsx`, `frontend/src/pages/LandingPage.tsx`
- `frontend/src/pages/admin/*`, `frontend/src/components/admin/*`, `frontend/src/components/layout/*`
- `frontend/src/pages/mentor/*`, `frontend/src/pages/assessment/*`
- `backend/src/services/auth.service.ts`, `backend/src/services/booking.service.ts`
- `backend/src/services/assessment.{questions,constants,scoring,catalog}.ts`
- `backend/prisma/schema.prisma`, `backend/src/middlewares/rate-limit.middleware.ts`

**Không dùng tài liệu này làm lý do thực hiện code blindly**. Agent phải đọc mã thực tế trước mỗi sửa đổi.

## 8. Báo cáo thực hiện tại workspace

- 2026-10-12: [IC-002 — Booking outcome review](IC-002-EXECUTION-REPORT.md), kèm nền test/CI tối thiểu của IC-010. Báo cáo ghi rõ phạm vi đã sửa, bằng chứng local và các kiểm tra chưa chạy; chưa kết luận readiness của toàn hệ thống.
- 2026-10-12: [IC-003 — Booking concurrency and idempotence](IC-003-EXECUTION-REPORT.md), có kiểm thử MySQL thật, migration tương thích lịch cũ, idempotency và notification trong transaction. Báo cáo gồm bằng chứng 62 test local, yêu cầu rollout và các giới hạn chưa kiểm thử.
- 2026-10-13: [IC-004 — Booking expiry, timezone and autoConfirm](IC-004-EXECUTION-REPORT.md), theo policy đã được chốt; có 90 test, MySQL trên hai TZ và browser smoke local. Báo cáo nêu mapping expiry, migration/backfill, ảnh desktop/mobile và rollout/rollback.
- 2026-10-13: [IC-005 — Admin booking actions and pending UX](IC-005-EXECUTION-REPORT.md), có policy action theo trạng thái, modal giữ ngữ cảnh lỗi/pending/success, 108 test và browser smoke cả bốn thao tác trên DB riêng. Không có migration mới.
- 2026-10-13: [IC-006 — Correct deceptive deletion copy](IC-006-EXECUTION-REPORT.md), lời xác nhận và audit đúng với soft delete, lỗi inline/retry, 31 test frontend và browser/API/MySQL smoke trên DB riêng. Không đổi policy hoặc migration.
- 2026-10-13: [IC-007 — Proxy, rate-limit, metrics và verified upload](IC-007-EXECUTION-REPORT.md), default-private metrics, proxy explicit, Redis fail-closed, ảnh được decode/re-encode; 156 test và browser profile smoke trên DB riêng. Có dependency/config/URL rollout, không migration.
- 2026-10-13: [IC-008 — Correct public marketing claims](IC-008-EXECUTION-REPORT.md), bỏ số liệu/rating tự gán, metadata live, giải thích điểm tham khảo/Fallback trung tính; 36 test frontend và QA desktop/mobile/guest/result trên DB riêng. Giữ nguyên V1/API/scoring.
- 2026-10-13: [IC-009 — Admin query states](IC-009-EXECUTION-REPORT.md), loading/error/empty/retry riêng cho năm trang admin, cache/error và export authority được bảo vệ; 47 test frontend và browser 500/recovery trên DB/port riêng. Không đổi API/schema.
- 2026-10-14: [IC-010 — CI và critical automation](IC-010-EXECUTION-REPORT.md), 21 HTTP auth/permission + 6 DB guard cases, 4 Playwright role flows, CI MySQL/Chromium và DB hậu kiểm. 201 cases local PASS; GitHub runner chưa chạy, không đổi nghiệp vụ/API/schema.
