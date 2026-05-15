# Phase 2: Security & Performance Review

## Security Findings

**Summary:** 2 High, 3 Medium

### High
- **Debug token exposure can leak password reset / email verification tokens** (`backend/src/config/env.ts:151-159`, `backend/src/services/auth.service.ts:47-49, 220-255`). If enabled in production, the forgot-password and verify-email flows can return raw tokens in JSON.
- **Rate limiting trusts a client-controlled IP header** (`backend/src/app.ts:64-69`, `backend/src/middlewares/rate-limit.middleware.ts:33-39, 171-177, 198-215, 234-251`). `X-Forwarded-For` can be rotated to shard brute-force attempts into fresh buckets.

### Medium
- **Redis rate limiting fails open to per-process memory** (`backend/src/middlewares/rate-limit.middleware.ts:137-177`, `backend/src/config/redis.ts:25-58`). Protection weakens across instances when Redis is unavailable.
- **Internal metrics are publicly readable when `METRICS_TOKEN` is unset** (`backend/src/app.ts:130-139`, `backend/src/config/env.ts:157-159`).
- **Baseline security headers are missing** (`backend/src/app.ts:63-69`). No Helmet-style hardening is installed.

## Performance Findings

**Summary:** 3 High, 3 Medium

### High
- **Blog feed and admin listing are not indexed for their real query shapes** (`backend/src/services/blog-post.service.ts:145-180, 188-224`, `backend/prisma/schema.prisma:182-216`). Queries will degrade into filesorts/scans as data grows.
- **Mentor recommendations scan the full mentor table in application memory** (`backend/src/services/mentor.service.ts:220-277, 295-332`, `backend/prisma/schema.prisma:271-300`). Latency grows linearly with mentor count.
- **Background jobs duplicate work per instance, and bulk admin actions fan out unbounded DB calls** (`backend/src/tasks/scheduler.ts:31-75`, `backend/src/tasks/scheduled.tasks.ts:103-138`, `backend/src/services/blog-post.service.ts:570-588`). This can saturate the pool and double-run jobs in scaled deployments.

### Medium
- **Assessment dashboard statistics aggregate the full table each time** (`backend/src/services/assessment.service.ts:181-219`, `backend/prisma/schema.prisma:474-495`). Dashboard latency will rise with data volume.
- **Auth/session bootstrap does extra DB round-trips and loads more than needed** (`backend/src/services/auth.service.ts:52-91, 197-217`). Login/refresh/me paths do unnecessary I/O.
- **In-memory rate-limit fallback can grow without bound** (`backend/src/middlewares/rate-limit.middleware.ts:31-47, 73-124, 163-190`). It can also diverge across instances.

## Critical Issues for Phase 3 Context

- Security-critical paths need tests for debug token exposure, rate limiting, metrics protection, and auth/session failure handling.
- Performance-sensitive paths need coverage for blog listing/search, mentor recommendation selection, bulk admin actions, and scheduler idempotency.
- Documentation should reflect the operational requirement for Redis / tokens / proxy trust assumptions where applicable.
