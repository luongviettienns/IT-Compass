# Phase 1: Code Quality & Architecture Review

## Code Quality Findings

**Summary:** 1 High, 7 Medium, 1 Low

### High
- **Scheduled jobs are not safe in multi-instance deployments** (`backend/src/tasks/scheduler.ts:70-75`). Every boot starts the same intervals, so scaled deployments can duplicate reminder/publishing/no-show work.

### Medium
- **Build artifacts are tracked instead of ignored** (`backend/.gitignore:1-11`). `dist/` is not ignored, so source and output can drift.
- **Redis rate limiting silently degrades to memory** (`backend/src/middlewares/rate-limit.middleware.ts:137-177`). This creates inconsistent protection across instances.
- **Auth response creation mixes concerns** (`backend/src/services/auth.service.ts:52-91, 105-137, 156-181`). Token/session creation and user serialization are coupled, with an extra DB read.
- **Auth bootstrap treats non-auth errors as logout** (`frontend/src/contexts/AuthContext.tsx:64-87, 139-145`). Temporary failures are flattened into session expiry.
- **API client assumes every response is JSON** (`frontend/src/lib/authApi.ts:183-203`). Parse failures and non-JSON responses are hidden.
- **Landing page is a monolithic component** (`frontend/src/pages/LandingPage.tsx:82-814`). Too many responsibilities live in one file.
- **Profile page combines too many responsibilities** (`frontend/src/pages/ProfilePage.tsx:115-649`). Form state, uploads, queries, and rendering are tightly coupled.

### Low
- **Error translation tables are duplicated** (`frontend/src/lib/appError.ts:24-119, 81-119`). Two maps will drift over time.

## Architecture Findings

**Summary:** 1 High, 3 Medium, 1 Low

### High
- **In-process scheduler creates duplicate work across scaled instances** (`backend/src/server.ts:24-32`, `backend/src/tasks/scheduler.ts:31-95`). Background jobs run inside each API process, so horizontal scaling duplicates execution.

### Medium
- **API surface is not versioned and naming is inconsistent** (`backend/src/app.ts:74-95`, `backend/src/routes/auth.routes.ts:23-42`). `/api/mentor` and `/api/mentors` coexist without a versioned namespace.
- **Response and error contracts are only partially standardized** (`backend/src/controllers/auth.controller.ts:32-147`, `backend/src/utils/httpError.ts:38-65`, `backend/src/app.ts:144-214`). Error shapes differ between the global 404 handler and `HttpError`.
- **Core domain data is over-serialized into JSON blobs** (`backend/prisma/schema.prisma:474-495`, `backend/prisma/schema.prisma:404-420`). Assessment and notification state are hard to query/index.

### Low
- **Source-of-truth is split between TypeScript and committed build output** (`backend/package.json:6-12`, `backend/dist/**/*.js`). Runtime points at compiled output that is also tracked in repo.

## Critical Issues for Phase 2 Context

- Scheduler jobs can duplicate across instances unless guarded by a distributed lock or worker split.
- Redis rate limiting may silently degrade to in-memory protection.
- Auth bootstrap and API client both hide non-auth failures as generic logout / generic error states.
- Response/error contracts are inconsistent, so frontend behavior depends on endpoint-specific shapes.
- JSON-heavy domain fields in assessment/notification models may block efficient querying and reporting.
