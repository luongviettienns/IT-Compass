# ITCompass Test Strategy & Coverage Review

> Lưu ý: repo hiện tại không có test runner, không có `test` script trong `backend/package.json` hoặc `frontend/package.json`, và không có test file do dự án sở hữu. Vì vậy, đánh giá dưới đây xem coverage hiện tại là **0% thực thi tự động** cho code application.

## 1) Tổng quan

### Kết luận ngắn
- **Không có bộ test tự động của dự án**: chưa thấy `vitest`, `jest`, `playwright`, `testing-library`, `supertest`, hay bất kỳ script chạy test nào trong package.json.
- **Test pyramid chưa tồn tại**: hiện trạng là manual-only, không có unit/integration/E2E theo nghĩa có thể chạy trong CI.
- **Các luồng rủi ro cao nhất đang thiếu coverage**: auth/session, rate limiting, metrics protection, scheduler/background jobs, blog/mentor query performance, và các helper frontend xử lý lỗi/sanitization.

### Coverage map hiện tại
- **Backend unit tests**: không có
- **Backend integration tests**: không có
- **Frontend unit/component tests**: không có
- **E2E tests**: không có

### Các vùng code đáng ưu tiên đưa vào test đầu tiên
- Backend auth/session: `backend/src/services/auth.service.ts`, `backend/src/config/env.ts`, `backend/src/validators/auth.validator.ts`
- Backend security middleware: `backend/src/middlewares/rate-limit.middleware.ts`, `backend/src/app.ts`
- Backend scheduler/background work: `backend/src/tasks/scheduler.ts`, `backend/src/tasks/scheduled.tasks.ts`
- Backend performance-sensitive query paths: `backend/src/services/blog-post.service.ts`, `backend/src/services/mentor.service.ts`, `backend/src/services/assessment.service.ts`
- Frontend helpers/sanitizers: `frontend/src/lib/appError.ts`, `frontend/src/lib/authApi.ts`, `frontend/src/lib/userDisplay.ts`, `frontend/src/components/blog/BlogContentRenderer.tsx`

## 2) Test pyramid assessment

### Hiện trạng
- **Unit**: 0
- **Integration**: 0
- **E2E**: 0

### Đánh giá
Test pyramid chưa hình thành. Điều này làm cho:
- lỗi logic nhỏ dễ lọt vào production,
- response contract/API drift không được phát hiện,
- các luồng security/performance quan trọng chỉ được kiểm tra thủ công,
- refactor trở nên rủi ro vì không có safety net.

### Mục tiêu khuyến nghị
Khi bắt đầu xây test suite, nên đi theo tỷ lệ xấp xỉ:
- **60–70% unit tests**: helper, validator, sanitization, state machine, pure functions
- **20–30% integration tests**: API endpoints, DB-backed services, middleware, scheduler tasks
- **10% E2E tests**: flow người dùng quan trọng nhất (auth, booking, reset password, admin publish)

## 3) Findings

---

### Finding 1 — Critical
**Không có test runner và không có test suite do dự án sở hữu.**

**What is untested / poorly tested**
- Toàn bộ backend và frontend đều thiếu automated coverage.
- Không có script `test`, không có cấu hình runner, không có fixture/shared setup, không có CI gate để chặn regressions.
- Các test file trong `node_modules` không liên quan đến codebase và không tạo ra coverage cho ứng dụng.

**Why this matters**
- Không thể phát hiện regressions một cách lặp lại.
- Không có nền tảng để kiểm tra security/performance paths.
- Mọi thay đổi đều phụ thuộc vào manual QA.

**Recommendation**
1. Thêm `vitest` cho unit/integration tests, `supertest` cho HTTP API, và `@testing-library/react` cho frontend component tests.
2. Tạo test scripts ở cả backend và frontend.
3. Thiết lập shared setup: mock env, test DB riêng, clean-up hooks, fake timers.
4. Chạy test trong CI trước build/deploy.

**Example test code**
```ts
// backend/tests/smoke/app.smoke.test.ts
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../src/app.js';

describe('app smoke test', () => {
  it('serves health endpoint', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});
```

---

### Finding 2 — High
**Auth/session flows chưa có integration tests cho các nhánh thành công, thất bại, và token exposure.**

**What is untested / poorly tested**
- `backend/src/services/auth.service.ts`:
  - register / login / refresh / logout / logoutAll / me
  - forgot-password / reset-password / verify-email
  - debug token behavior qua `authConfig.debugExposeTokens`
- `backend/src/config/env.ts`:
  - production safety checks cho JWT secret, cookie secure, frontend URL
- `backend/src/validators/auth.validator.ts`:
  - boundary conditions cho email/password/token

**Gaps**
- Không có test xác nhận `AUTH_DEBUG_EXPOSE_TOKENS=false` thì response không có `token`.
- Không có test đảm bảo refresh token rotation/revocation là one-time-use.
- Không có test cho error contract của login/refresh/reset password.
- Không có test cho production env guard.

**Recommendation**
1. Viết integration tests cho `/api/auth/*` với DB test riêng.
2. Mock/spy service để xác nhận debug token không bao giờ leak ngoài mode debug.
3. Thêm tests cho token rotation: refresh xong token cũ phải fail.
4. Test env bootstrap bằng `vi.stubEnv` hoặc process env snapshot/restore.

**Example test code**
```ts
import { describe, it, expect, vi } from 'vitest';
import { forgotPassword } from '../../src/services/auth.service.js';

vi.mock('../../src/config/auth.js', () => ({
  authConfig: { debugExposeTokens: false },
}));

describe('forgotPassword', () => {
  it('never exposes reset token when debug flag is off', async () => {
    const result = await forgotPassword({ email: 'verified@example.com' });

    expect(result).toEqual({
      message: 'If the email exists, a reset token has been generated',
    });
    expect(result).not.toHaveProperty('token');
  });
});
```

---

### Finding 3 — High
**Security-critical middleware and endpoint protections lack tests: rate limiting, trust proxy handling, and metrics protection.**

**What is untested / poorly tested**
- `backend/src/middlewares/rate-limit.middleware.ts`:
  - client IP selection from `X-Forwarded-For`
  - Redis fallback to memory
  - request key generation for auth, password reset, verify email, booking, comment, uploads
- `backend/src/app.ts`:
  - `/api/metrics` behavior with/without `METRICS_TOKEN`
  - 404/error shapes, malformed JSON, multer error mapping

**Gaps**
- No regression test proving that `X-Forwarded-For` can’t be abused to shard brute-force attempts.
- No test that Redis outage doesn’t silently weaken protection.
- No test for metrics endpoint access control.
- No test for malformed JSON and upload errors returning the documented code/message.

**Recommendation**
1. Add middleware integration tests with request headers and explicit IP buckets.
2. Add a metrics endpoint test for missing/invalid token vs valid token.
3. Add a test for Redis unavailable path to document fallback behavior.
4. Add tests for global error handler responses.

**Example test code**
```ts
import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import app from '../../src/app.js';
import * as redis from '../../src/config/redis.js';

describe('rate limiter', () => {
  it('keys by forwarded IP and blocks after max requests', async () => {
    vi.spyOn(redis, 'getRedisClient').mockResolvedValue(null);

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '1.2.3.4')
        .send({ email: 'demo@example.com', password: 'wrong-pass' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '1.2.3.4')
      .send({ email: 'demo@example.com', password: 'wrong-pass' });

    expect(res.status).toBe(429);
    expect(res.headers).toHaveProperty('retry-after');
  });
});
```

---

### Finding 4 — High
**Scheduler và background jobs chưa có tests cho idempotency, boot-time execution, hoặc concurrency.**

**What is untested / poorly tested**
- `backend/src/tasks/scheduler.ts`:
  - job chạy ngay khi startup
  - mỗi job được setInterval độc lập
  - stopScheduler cleanup
- `backend/src/tasks/scheduled.tasks.ts`:
  - purge auth data
  - publish scheduled posts
  - mark no-show bookings
  - send booking reminders

**Gaps**
- Không có test xác nhận scheduler không chạy chồng khi gọi start/stop nhiều lần.
- Không có test cho idempotent updateMany/deleteMany behavior khi job được chạy lặp lại.
- Không có test kiểm tra concurrent invocation không tạo duplicate side effects.

**Recommendation**
1. Dùng fake timers để kiểm tra startup + interval scheduling.
2. Spy vào task functions để đảm bảo `startScheduler()` chỉ đăng ký đúng số job và `stopScheduler()` clear hết timer.
3. Với từng task DB-backed, chạy cùng input 2 lần và assert kết quả lần 2 là 0 thay đổi.
4. Thêm regression test cho “run immediately on startup” để tránh đổi hành vi vô tình.

**Example test code**
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startScheduler, stopScheduler } from '../../src/tasks/scheduler.js';
import * as tasks from '../../src/tasks/scheduled.tasks.js';

describe('scheduler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    stopScheduler();
    vi.useRealTimers();
  });

  it('runs each job immediately on startup and registers intervals', async () => {
    const spy = vi.spyOn(tasks, 'publishScheduledPosts').mockResolvedValue({ published: 0 });

    startScheduler();

    expect(spy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
```

---

### Finding 5 — High
**Performance-sensitive query paths chưa có regression tests cho pagination, query shape, và “fast path” behavior.**

**What is untested / poorly tested**
- `backend/src/services/blog-post.service.ts`:
  - `listPublishedPosts`
  - `adminListPosts`
  - `adminBlogStats`
- `backend/src/services/mentor.service.ts`:
  - `listMentors`
  - `getRecommendedMentors`
- `backend/src/services/assessment.service.ts`:
  - `getAdminAssessmentStats`

**Gaps**
- Không có test cho page/limit clamping (1..100) và skip/take correctness.
- Không có test để bảo vệ query shape ở những chỗ cần index-friendly filtering.
- Không có test performance regression cho mentor recommendations scanning behavior.
- Không có test cho bulk stats aggregation trên table lớn.

**Recommendation**
1. Thêm contract tests cho pagination bounds và sort order.
2. Assert `take`/`skip`/`orderBy` đúng trên query layer.
3. Với `getRecommendedMentors`, thêm test cho fast-path “no assessment => không query mentor table”.
4. Thêm one or two load-style tests trong CI nightly (không phải per-PR) cho dataset lớn.

**Example test code**
```ts
import { describe, it, expect, vi } from 'vitest';
import { listPublishedPosts } from '../../src/services/blog-post.service.js';
import { prisma } from '../../src/db/prisma.js';

describe('listPublishedPosts', () => {
  it('caps limit at 100 and normalizes page', async () => {
    const findManySpy = vi.spyOn(prisma.blogPost, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.blogPost, 'count').mockResolvedValue(0 as never);

    await listPublishedPosts({ page: 0, limit: 1000 });

    expect(findManySpy).toHaveBeenCalledWith(expect.objectContaining({
      skip: 0,
      take: 100,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    }));
  });
});
```

---

### Finding 6 — Medium
**Frontend helper logic cho retry/session-expired, error mapping, user display, và blog sanitization chưa có unit tests.**

**What is untested / poorly tested**
- `frontend/src/lib/authApi.ts`:
  - refresh dedup
  - 401 retry flow
  - `apiRequest`/`apiUploadRequest`
- `frontend/src/lib/appError.ts`:
  - error-code mapping
  - session-expired translation
  - `shouldRetryRequest`
- `frontend/src/lib/userDisplay.ts`:
  - initials/short name/role badge
- `frontend/src/components/blog/BlogContentRenderer.tsx`:
  - HTML sanitization
  - unsafe protocol stripping
  - markdown rendering edge cases

**Gaps**
- No tests for token refresh race conditions.
- No tests for mapping backend errors to Vietnamese UI messages.
- No tests that malicious `javascript:`/`data:` links are stripped.
- No tests for empty/whitespace-only names or content.

**Recommendation**
1. Add pure unit tests for the frontend helpers first because they are cheap and stable.
2. Mock `fetch` in authApi tests to validate refresh retry behavior.
3. For BlogContentRenderer, use jsdom + RTL snapshot/DOM assertions against unsafe content.
4. Cover name edge cases: null, empty, whitespace, multi-word, unicode.

**Example test code**
```ts
import { describe, it, expect } from 'vitest';
import { getUserInitials, getUserShortName } from '../../src/lib/userDisplay.js';

describe('userDisplay helpers', () => {
  it('handles empty and multi-word names safely', () => {
    expect(getUserInitials('')).toBe('U');
    expect(getUserInitials('Nguyễn Văn A')).toBe('NG');
    expect(getUserShortName('Nguyễn Văn A')).toBe('A');
  });
});
```

---

### Finding 7 — Medium
**Boundary conditions và malformed input paths chưa được kiểm chứng đầy đủ ở validator / error-handler level.**

**What is untested / poorly tested**
- `backend/src/validators/auth.validator.ts`:
  - min/max for password, email, token, name trim behavior
- `backend/src/app.ts`:
  - malformed JSON
  - multer file-size error
  - generic 404 and 500 response shapes
- `backend/src/services/auth.service.ts`:
  - email normalization, exact status codes, empty/invalid token handling

**Gaps**
- No tests for very long strings, leading/trailing whitespace, and invalid email formats.
- No tests for malformed JSON requests returning the documented error code.
- No tests ensuring token-only endpoints reject short/empty tokens.

**Recommendation**
1. Add table-driven tests for each Zod schema boundary.
2. Add request-level tests for malformed JSON and upload errors.
3. Make sure error responses remain contract-stable (`code`, `message`, `requestId`).

**Example test code**
```ts
import { describe, it, expect } from 'vitest';
import { registerSchema, resetPasswordSchema } from '../../src/validators/auth.validator.js';

describe('auth validators', () => {
  it('rejects invalid boundary values', () => {
    expect(() => registerSchema.parse({ body: {
      fullName: 'A',
      email: 'bad-email',
      password: 'short',
    } })).toThrow();

    expect(() => resetPasswordSchema.parse({ body: {
      token: 'short',
      newPassword: '12345678',
    } })).toThrow();
  });
});
```

---

### Finding 8 — Medium
**Không có E2E coverage cho các user journeys quan trọng, nên test pyramid đang thiếu lớp bảo vệ cuối cùng.**

**What is untested / poorly tested**
- Auth flow end-to-end: register → verify email → login → refresh → logout
- Recovery flow: forgot password → reset password
- Booking/chat flow: mentor booking → conversation open → message send
- Admin flow: publish blog / bulk action / metrics access

**Gaps**
- Có thể unit/integration sau này sẽ cover nhiều logic, nhưng vẫn thiếu kiểm tra người dùng thật trên browser.
- Không có coverage cho routing, auth cookies, CORS, UI states, và network error handling cùng lúc.

**Recommendation**
1. Chỉ chọn 3–5 E2E journeys “có giá trị cao nhất”, không dàn trải.
2. Dùng Playwright cho browser-level checks.
3. Chạy trên test env có DB riêng và seeded fixtures.
4. Ưu tiên flows có security hoặc business impact cao.

**Example test code**
```ts
import { test, expect } from '@playwright/test';

test('user can log in and reach dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173/auth');
  await page.getByLabel('Email').fill('student@example.com');
  await page.getByLabel('Mật khẩu').fill('Password123!');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(page).toHaveURL(/\/profile|\/dashboard/);
});
```

## 4) Đánh giá chất lượng test hiện tại

Vì không có test suite thực thụ, nên chưa thể đánh giá chất lượng assertion/mocks/flakiness của test hiện có. Tuy nhiên, repo hiện tại có 3 vấn đề sẽ ảnh hưởng đến test quality khi bắt đầu viết test:

- **Thiếu isolation mặc định**: chưa có test DB/fixtures/cleanup strategy.
- **Thiếu shared factories**: các entity như user, mentor, blog post, booking sẽ dễ bị copy-paste fixture.
- **Thiếu contract tests**: response shape giữa backend và frontend dễ bị lệch mà không ai phát hiện.

## 5) Maintainability & flakiness risks

### Rủi ro chính
- Mock/patched state sẽ bị lỏng lẻo nếu không có helper chung cho env, DB, timers.
- Background jobs và refresh race-condition sẽ flaky nếu dùng timers thật hoặc shared globals.
- Frontend tests sẽ dễ flaky nếu không tách rõ pure helper tests và DOM tests.

### Khuyến nghị tối thiểu
- Dùng `beforeEach` reset mock + DB transaction/clean-up.
- Tách `tests/helpers/` cho factory/fixture.
- Dùng fake timers cho scheduler và refresh dedup tests.
- Dùng MSW hoặc `vi.stubGlobal('fetch', ...)` cho authApi unit tests.

## 6) Security test gaps

Các điểm cần test ngay:
- debug token exposure (`AUTH_DEBUG_EXPOSE_TOKENS`)
- rate limiting theo IP/token/email
- metrics protection bằng `METRICS_TOKEN`
- malformed JSON và upload error handling
- refresh token rotation / replay prevention

## 7) Performance test gaps

Các điểm cần test ngay:
- blog listing/search pagination & sort order
- mentor recommendation fast-path và query shape
- assessment dashboard stats aggregation
- scheduler idempotency / repeated runs
- bulk admin actions không fan-out quá mức

## 8) Ưu tiên hành động đề xuất

1. **Thiết lập test runner + scripts**
2. **Viết integration tests cho auth/security endpoints**
3. **Viết unit tests cho frontend helpers và validators**
4. **Viết scheduler/background-job regression tests**
5. **Thêm 3–5 E2E flows quan trọng nhất**
6. **Sau đó mới mở rộng sang performance/load tests định kỳ**

## 9) Kết luận

Hiện tại ITCompass gần như **chưa có testing strategy thực thi được**. Điểm yếu lớn nhất không phải là thiếu một vài test lẻ, mà là **thiếu toàn bộ nền tảng test**: runner, scripts, fixtures, isolation, và contract coverage. Nếu cần chọn việc làm đầu tiên, hãy bắt đầu từ auth/security integration tests và các pure unit tests cho helper/validator để tạo safety net sớm nhất.
