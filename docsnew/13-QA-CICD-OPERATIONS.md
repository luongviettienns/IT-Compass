# 13 — Test automation, CI/CD, monitoring and release operations (P0)

## 1. Baseline

On inspected `main` tree, no `frontend/src/**/*.test.*`, `backend/src/**/*.test.*` or `.github/workflows/*` were found; package scripts must be rechecked from HEAD. Treat this as absence of visible suite, not proof of zero private testing elsewhere.

Frontend: React/Vite/TypeScript. Backend: Express/Prisma/MySQL/Redis/Socket.IO. Many business flows depend on role permissions, status transitions, transactions and async services.

## 2. Recommended test stack

- Frontend unit/components: **Vitest + React Testing Library + user-event**, MSW if API mocking benefits. Match Vite/React installed versions.
- Backend pure business unit: Vitest (or existing team test runner if already present); Prisma integration against isolated MySQL test DB.
- API integration: Supertest with real Express app and disposable DB; fake mail provider and controllable clock.
- End-to-end: Playwright, multi-role fixtures, staging-like frontend/backend/database, visual snapshots for critical states.
- Security: dependency audit, secret scanning, Zod invalid payload tests, basic authorization matrix and rate-limit tests.
- Concurrency: specifically parallel slot creation/confirm, idempotency, transaction lock/deadlock recovery.

Avoid unit tests that only assert mocks called; verify business invariants and user-observable outcomes.

## 3. Test organization

Suggested:
```
backend/tests/unit/assessment-v1.spec.ts
backend/tests/unit/assessment-v2.spec.ts
backend/tests/unit/booking-state-machine.spec.ts
backend/tests/integration/auth-lifecycle.spec.ts
backend/tests/integration/booking-concurrency.spec.ts
backend/tests/integration/permission-matrix.spec.ts
backend/tests/integration/notification-idempotence.spec.ts
frontend/src/**/__tests__/*.test.tsx
frontend/e2e/guest-first-value.spec.ts
frontend/e2e/student-booking.spec.ts
frontend/e2e/mentor-availability.spec.ts
frontend/e2e/admin-moderation.spec.ts
frontend/e2e/admin-booking-errors.spec.ts
```

Seed synthetic users `student`, `mentorVerified`, `mentorUnverified`, `admin`, `suspended`; synthetic articles/bookings, no real PII.

## 4. Must-have regression scenarios

| Test suite | Scenarios |
|---|---|
| Auth | registration, email verify, resend, expired/reset/reused token, cookie refresh, logout, role revoke |
| Booking | overlap same mentor, concurrent create, cancel/confirm race, no-show decision, expiry, time zones |
| Assessment | V1 unchanged, V2 version mismatch, unknown item, tie scores, no fake probability, guest draft resume |
| Admin | role permission, bulk selection scope, action confirmation, API error doesn't appear as zero |
| CMS | unsaved change guard, draft publish preview, sanitize unsafe link/image, soft-delete wording |
| Mentor | schedule block overlap and settings validation, save failure doesn't lose edits |
| Missions | start→complete→debrief, keyboard alternative, duplicate completion, corrupted resume state |
| Socket | unauthorized room access, blocked user, reconnect and duplicate events |

## 5. GitHub Actions CI (recommended)

Create `.github/workflows/ci.yml` after defining scripts. Jobs:

1. Detect front/backend changes; cache npm installs.
2. Frontend install lockfile → `lint` → `typecheck` → `test` → `build`.
3. Backend install lockfile → `lint` → `typecheck` → `test:unit` → `build`.
4. Spin disposable MySQL + Redis service for integration tests; apply Prisma migrations; run tests with isolated DB.
5. Dependency/secret scan and migration sanity checks; artifacts test results.
6. E2E on PR or dedicated preview environment with synthetic fixtures.
7. Require checks before protected merge; secrets in CI scoped with least privilege.

**Note:** commands above are **target scripts**. Agent must confirm actual scripts exist and implement their package.json wiring; do not assert these commands already pass.

## 6. Monitoring & production ops

- Request ID propagation (Express → service → logger), structured error logs, no token/raw student answers.
- Unhandled exception, API 5xx, error ratio, latency p95/p99 by critical route, DB/Redis connectivity, job health and email queue failures.
- Cron/scheduler: one leader/worker in multi-instance deployment, idempotent claim and overlap-safe execution; Vercel/serverless suitability must be assessed against Socket.IO + long-running scheduler before deployment design.
- Alerts with owner, threshold and runbook; no giant dashboards without action.
- Backups: documented frequency, encrypted storage, restore rehearsals and recovery objectives selected with owner.
- Rollback: migration expand/contract discipline, canary/feature flags for new scoring and game engine; preserve older API contracts.

## 7. Performance testing

- Lighthouse mobile+desktop for public pages (LCP, CLS, INP where measurable) with build, device and connection info.
- API load test with realistic traffic for assessment submit, booking slot list/create, mentor filtering, admin lists and Socket.IO.
- Track slow DB queries, N+1 issues, caching policy, image storage/CDN; never invent speed values.
- Stress concurrency correctness independently of latency throughput; output proof of zero overlap under tested conditions.

## 8. Release gates

### Gate P0 stability
- Unit/integration baseline passes, auth lifecycle works, booking state invariants hold, admin action errors handled.
- No unreviewed high-severity issue in scope; rollback plan exists.

### Gate beta
- Usability runs with target personas, accessibility critical paths pass, runtime alerts wired, backup/restore verified, privacy pages accurate, real onboarding end-to-end.

### Gate production scale
- Load/soak tests documented; backup restore drills, secrets rotation plan, alert playbooks, conversion/product metrics validated.

## 9. Acceptance criteria

- [ ] CI runs on PR and fails for failing business invariants.
- [ ] Integration tests use isolated DB, not developer/prod DB.
- [ ] E2E captures public, student, mentor and admin flows.
- [ ] Agent supplies command output, errors and test coverage limitations.
- [ ] Auth/booking/assessment migrations documented and rollback tested.
- [ ] No production deployment without explicit approval.
