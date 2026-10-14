# IC-010 — CI và critical automated tests: execution report

- Ngày: 2026-10-14; baseline `840e0e4` (checkpoint IC-009 cục bộ).
- Nhánh: `codex/critical-test-ci`; IC-010 chưa commit/push/deploy.
- Phạm vi: [IC-010 backlog](16-ISSUE-BACKLOG.md), [13 — QA/CI](13-QA-CICD-OPERATIONS.md), quy trình từng ticket và format báo cáo của [17 — Prompts](17-AGENT-EXECUTION-PROMPTS.md). [Kế hoạch](IC-010-IMPLEMENTATION-PLAN.md).

## Findings

- Baseline đã có Vitest/RTL, lint/types/build trong CI, 84 backend unit + 39 MySQL booking integration + 47 frontend tests. Không cần dựng lại nền CI hoặc thay transport HTTP hiện có.
- Chưa có integration cho auth/session/route permission và chưa có Playwright chạy ba vai trò. Các browser smoke trước đây là bằng chứng thủ công, không tự động chạy trên PR.
- Email delivery adapter vẫn thuộc IC-001. Kiểm thử verify/reset lần này tạo token trong service thật rồi gọi HTTP endpoint thật; không chứng minh việc nhận email.

## Decision

- Giữ Node fetch + Express thật cho API integration thay vì thêm Supertest để thay một transport tương đương. Prisma và MySQL thật, không mock auth hay quyền trong suite mới.
- Bổ sung 21 auth/permission cases, 6 DB guard cases và 4 Chromium E2E. Không đổi UI, API, schema/migration hoặc auth business logic.
- E2E dùng production frontend build/preview, backend source/server/socket/scheduler thật, tài khoản `example.test`, schema riêng `itcompass_ic010_e2e_test`, ports `54321`/`54322` và cookie riêng. Cấu hình từ chối reuse server; guard DB chạy trước seed và app import.
- CI có job E2E MySQL riêng; quyền workflow vẫn `contents: read`; actions pin SHA. Upload failure artefacts giữ 3 ngày. Traces có thể chứa mật khẩu/token tổng hợp, không dùng suite với dữ liệu thật.

## Changes

- `backend/tests/integration/auth-permissions.test.ts`: đăng ký/password hash/cookie scope, credential failure generic, invalid payload, refresh rotation/sequential replay/expiry, logout/logout-all, verify/reset hash/expiry/replay, reset revoke sessions, forgot response không debug token, missing/invalid/expired JWT, role matrix, DB role/status thay đổi và student/mentor booking ownership. Kiểm tra side effects của thao tác trái quyền không phát sinh.
- `backend/vitest.integration.config.ts`: debug token tắt, cookie riêng và local HTTP cookie trong tests; suite mới tự vào job integration hiện có trên UTC và Asia/Ho_Chi_Minh.
- `backend/scripts/e2e-database-url.*`, `seed-e2e.mjs`, `serve-e2e.mjs`, `verify-e2e.mjs`: schema guard cụ thể, seed chỉ reset IDs tổng hợp của suite, khởi động server với config test, hậu kiểm DB độc lập. Không đọc credentials production để chọn DB test; guard `TEST_DATABASE_URL` là bắt buộc.
- `frontend/playwright.config.ts`, `e2e/critical-roles.spec.ts`, `tsconfig.e2e.json`: guest redirect; student hủy lịch và reload; mentor lưu báo trước và reload rồi thử admin route; admin xác nhận qua detail/action modal rồi reload/read lại trạng thái. Mỗi test có browser context riêng; một worker, không fixed sleep/retry che lỗi.
- Package scripts/lockfile: pin `@playwright/test` **1.64.0** (3 packages mới), browser/typecheck/server/verifier commands. Không thêm runtime dependency.
- `.github/workflows/ci.yml`: typecheck E2E; integration auth+booking; job Chromium E2E + MySQL + DB verifier + failure artefacts. Ignore generated reports/traces trong Git/ESLint.
- Giữ các thay đổi `backend/dist` và `PROJECT_PROGRESS.md` có sẵn ngoài phạm vi ticket; không stage hoặc restore chúng.

## Tests

| Kiểm tra local | Kết quả | Bằng chứng |
|---|---|---|
| Backend lint/types/test types/unit/build | PASS, **90/90** unit | [Backend checks](evidence/IC-010-backend-checks.txt) |
| Frontend lint/types/test types/E2E types/component/build | PASS, **47/47** | [Frontend checks](evidence/IC-010-frontend-checks.txt) |
| MySQL HTTP auth/permissions + booking, host UTC | PASS, **60/60** (21 + 39) | [UTC integration](evidence/IC-010-integration-utc.txt) |
| Cùng suite, host Asia/Ho_Chi_Minh | PASS, **60/60** | [Vietnam integration](evidence/IC-010-integration-vn.txt) |
| Chromium guest/student/mentor/admin | PASS, **4/4**, không retry | [E2E](evidence/IC-010-e2e-checks.txt) |
| DB sau E2E | PASS: hủy/reason, notice=3, CONFIRMED, 1 chat, 1 thông báo xác nhận tới student và 1 thông báo hủy tới mentor | [DB assertions](evidence/IC-010-e2e-db.txt) |
| Regression sensitivity | Tạm vô hiệu hóa role guard → **5 failures**; khôi phục nguyên byte, final suite PASS | [Role mutation](evidence/IC-010-role-mutation.txt) |
| Registration sensitivity | Hash nhầm password khi register → HTTP login assertion FAIL; khôi phục source và suite PASS | [Registration mutation](evidence/IC-010-registration-mutation.txt) |
| Negative startup | Backend wrapper và Playwright config cùng từ chối schema không phải test trước startup/seed | [Negative guard](evidence/IC-010-negative-startup.txt) |
| YAML parsing/CI wiring | PASS (kiểm tra cấu trúc/config; không phải GitHub runner) | [CI config](evidence/IC-010-ci-config.txt) |

Tổng **201 test cases khác nhau** đã PASS; integration chạy lặp trên hai timezone. 19 API cases ban đầu đã PASS trước bổ sung hai cases payload/JWT và mở rộng mentor ownership: [initial API](evidence/IC-010-api-initial.txt). Mutation là bằng chứng fail-before với regression được chủ động tạo; các chức năng auth hiện có không được mô tả là bug khi đã đúng.

E2E lượt đầu 3 PASS/1 FAIL do test dùng sai tên nút xác nhận: [initial E2E](evidence/IC-010-e2e-initial.txt). Lượt tiếp theo phát hiện selector success khớp cả toast và status; đã scope vào status. DB assertion ban đầu nhầm manual confirmation với auto-confirm (đòi hai người nhận); đã đối chiếu service và DB rồi sửa expectation thành policy hiện hành, không sửa nghiệp vụ. Kết quả cuối gồm browser PASS và verifier DB PASS.

MySQL local dùng instance riêng tại port `54160`, đã xác minh datadir test trước sử dụng; schema API `itcompass_ic010_api_test`, E2E schema khác. Không migrate hay sửa business records của DB chính. Playwright quản lý lifecycle server; việc chạy lại seed bắt đầu lại fixture riêng.

Review độc lập phát hiện một P2 trong assertion registration: hash khác plaintext chưa chứng minh password đúng. Đã bổ sung đăng nhập HTTP bằng credentials vừa đăng ký, đúng user ID và gọi `/auth/me` bằng access token trả về; mutation riêng chứng minh bắt được hash sai. Review lại xác nhận finding đã xử lý và không có actionable finding mới. Reviewer kiểm tra source/config/log, không chạy tests; evidence chạy tests là các logs phía trên.

### Chạy lại

Sau `npm ci` cho cả hai workspace và `npm run prisma:generate` tại backend, cung cấp MySQL local dành riêng cho test. URL dưới đây là credentials **chỉ cho CI/test**, không dùng production.

```powershell
# Tại backend; MySQL test đã chạy và schema test đã được tạo.
$env:TEST_DATABASE_URL='mysql://root:ci-test-only@127.0.0.1:3306/itcompass_ic010_api_test?connection_limit=60'
npm run test:prepare-db
npm run test:integration

# Tại frontend; dùng schema riêng khác, để trống ports 54321/54322.
$env:TEST_DATABASE_URL='mysql://root:ci-test-only@127.0.0.1:3306/itcompass_ic010_e2e_test'
npx playwright install chromium
npm run typecheck:e2e
npm run test:e2e
npm --prefix ../backend run test:verify-e2e
```

Linux CI dùng cùng các scripts, env qua workflow và `playwright install --with-deps chromium`. Backend wrapper tự db push/seed trong schema E2E đã có; verifier phải chạy sau **toàn bộ** suite E2E. Chạy một test lọc riêng không đáp ứng các hậu điều kiện của verifier đầy đủ.

## Risks

- **NOT RUN:** GitHub Actions remote/PR branch protection, Linux runner thực tế, staging/production, browser ngoài Chromium, toàn bộ responsive/accessibility/performance matrix. CI YAML parse không chứng minh remote PASS; local chạy trên Windows/Node 24/MySQL 8.
- **NOT TESTED:** gửi/nhận mail thật; token race/concurrent refresh/reset/verify; immediate revocation của access token sau logout/reset; Socket room authorization/reconnect; assessment/CMS/mission E2E. Sequential replay/session và role/status tests không thay thế concurrency/security audit.
- E2E fixtures dùng seed trạng thái REQUESTED để kiểm tra role actions; tạo lịch/concurrency/idempotency/expiry vẫn được kiểm thử bởi 39 booking integration và các RTL regressions, chưa có browser create-booking E2E.
- Dependency audit frontend vẫn báo 25 vulnerabilities khi cài package; ticket này không thực hiện nâng cấp toàn bộ dependencies. Build còn warning chunks/Browserslist; Prisma còn warning config deprecated.
- Fixture suite dành schema riêng và một worker; không chạy integration destructive booking cùng schema E2E. Generated traces/reports được ignore, chỉ failure artefacts tổng hợp có retention ngắn trên CI.
- Rollout: commit/push branch rồi kiểm tra cả job checks/integration/E2E trên PR; chỉ bật required status sau khi remote thực sự PASS. Không deploy cần thiết cho test-only changes.
- Rollback: revert riêng IC-010 test/scripts/config/package lock changes; không migration, không thay API. Giữ test coverage từ IC-002–009.

## Next recommended ticket

**IC-001 — transactional verification/reset email**, dùng nền auth integration và E2E vừa bổ sung. Cần chốt provider/config với owner trước khi gửi email thật; có thể bắt đầu adapter/outbox/template và fake-provider tests. Nếu tiếp tục dòng P1 theo thứ tự, IC-011 cần thiết kế versioning V2 và giữ V1 lịch sử.

Tham khảo triển khai: [Playwright webServer](https://playwright.dev/docs/test-webserver), [CI setup](https://playwright.dev/docs/ci-intro). Các bằng chứng PASS trong report là output local, không suy ra trạng thái triển khai từ tài liệu ngoài.
