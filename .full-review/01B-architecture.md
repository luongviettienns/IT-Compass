# Architecture Review Findings

## Scope
Review based on `C:\Users\TK\Desktop\DoAn3\.full-review\00-scope.md`, focusing on component boundaries, dependency management, API design, data model, design patterns, and architectural consistency.

## Findings

### 1) In-process scheduler creates duplicate work across scaled instances
- **Severity:** High
- **Architectural impact:** High
- **Evidence:** `backend/src/server.ts:24-32`, `backend/src/tasks/scheduler.ts:31-95`
- **Issue:** The backend starts background jobs inside the same HTTP process that serves API traffic. `startScheduler()` registers `setInterval()` jobs for cleanup, publishing, reminders, and no-show processing, and this happens on every application boot. In a horizontally scaled deployment, each instance will run the same jobs independently, which can cause duplicate reminder sends, duplicate state transitions, or conflicting writes.
- **Recommendation:** Move scheduled jobs to a dedicated worker process or introduce distributed locking/leader election before executing each job. If keeping in-process scheduling, make every job idempotent and guard execution with a shared lock (Redis, DB advisory lock, etc.).

### 2) Public API surface is not versioned and endpoint naming is inconsistent
- **Severity:** Medium
- **Architectural impact:** Medium
- **Evidence:** `backend/src/app.ts:74-95`, `backend/src/routes/auth.routes.ts:23-42`
- **Issue:** The API is mounted directly under `/api/...` without a version prefix, and resource naming is not fully consistent (`/api/mentor` and `/api/mentors` both exist, alongside `/api/users`, `/api/bookings`, `/api/conversations`, `/api/admin`). This makes the surface area harder to reason about and increases the risk of breaking clients when endpoints evolve.
- **Recommendation:** Introduce a canonical versioned API namespace such as `/api/v1`, then normalize resource names to a single convention. Prefer one noun per resource family and nest related sub-resources consistently.

### 3) Response and error contracts are only partially standardized
- **Severity:** Medium
- **Architectural impact:** Medium
- **Evidence:** `backend/src/controllers/auth.controller.ts:32-147`, `backend/src/utils/httpError.ts:38-65`, `backend/src/app.ts:144-214`
- **Issue:** Success responses are not shaped consistently across endpoints (`{ user, accessToken }`, `{ message }`, `{ user: profile }`, `{ accessToken: null, user: null }`). Error payloads are also split across different paths: `HttpError.toResponseBody()` includes `details`, but the 404 handler in `app.ts` returns a different object shape without `details`. This increases client-side branching and tightens frontend coupling to endpoint-specific behavior.
- **Recommendation:** Define a single API envelope for all responses, for example `{ data, error, meta, requestId }`, and keep the error shape identical across global handler and route-level failures. Publish DTO types for auth and other core endpoints so frontend consumers can rely on a stable contract.

### 4) Core domain data is over-serialized into JSON blobs
- **Severity:** Medium
- **Architectural impact:** Medium
- **Evidence:** `backend/prisma/schema.prisma:474-495`, `backend/prisma/schema.prisma:404-420`
- **Issue:** The assessment and notification models store substantial business state in JSON columns (`topTraits`, `rawScoresJson`, `answersJson`, `summaryJson`, `dataJson`). That is flexible, but it reduces database-level validation, makes indexing/querying harder, and makes it difficult to build efficient read models for reporting or admin views.
- **Recommendation:** Keep JSON only for truly variable payloads. Extract frequently queried or business-critical fields into first-class columns or dedicated read models, and add schema/version fields for any JSON payload that must evolve over time.

### 5) Source-of-truth is split between TypeScript and committed build output
- **Severity:** Low
- **Architectural impact:** Low
- **Evidence:** `backend/package.json:6-12`, `backend/dist/**/*.js` in the repository scope
- **Issue:** The backend entrypoint points directly at `dist/server.js`, and compiled output is part of the tracked repository surface. This creates a second source of truth alongside `backend/src`, which increases the chance of source/build drift and makes it easier for runtime behavior to lag behind TypeScript changes.
- **Recommendation:** Treat `src` as the only authoring source of truth and keep generated output out of version control unless there is a deployment-specific reason to retain it. If `dist` must remain committed, enforce a strict build verification step so source and output cannot diverge unnoticed.

## Architectural Notes
- The backend composition root is generally clean: `app.ts` handles middleware and route registration, while `server.ts` handles process lifecycle concerns. The main architectural risk is operational, not structural.
- The auth module is reasonably well-factored into controller/service/middleware layers, and the validation/error-handling approach is consistent overall.
- The strongest structural concern is the co-location of HTTP serving and scheduled background work in one runtime process.
