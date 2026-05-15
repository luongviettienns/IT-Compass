# 04B. DevOps Review — ITCompass

## Scope reviewed

Evidence used for this review:
- `C:/Users/TK/Desktop/DoAn3/.full-review/00-scope.md`
- `C:/Users/TK/Desktop/DoAn3/.full-review/01-quality-architecture.md`
- `C:/Users/TK/Desktop/DoAn3/.full-review/02-security-performance.md`
- `C:/Users/TK/Desktop/DoAn3/.full-review/03-testing-documentation.md`
- `C:/Users/TK/Desktop/DoAn3/backend/package.json`
- `C:/Users/TK/Desktop/DoAn3/frontend/package.json`
- `C:/Users/TK/Desktop/DoAn3/backend/.env.example`
- `C:/Users/TK/Desktop/DoAn3/backend/.gitignore`
- `C:/Users/TK/Desktop/DoAn3/frontend/.gitignore`
- Repository scan for `.github/workflows`, Dockerfiles, compose files, and infra directories

## Overall assessment

The repository is not yet operating with a mature DevOps baseline. The codebase has local build scripts, but there is no visible repo-level CI/CD workflow, no infrastructure-as-code, no documented deployment strategy, and no operational safety net for incidents. This is especially risky because prior phases already identified production-impacting issues around the in-process scheduler, debug token exposure, metrics access, and the lack of automated tests.

## Findings

### 1) CI/CD pipeline is missing at the repository level

- **Severity:** Critical
- **Operational risk assessment:**
  - There are `build`, `lint`, and `typecheck` scripts in the package manifests, but no visible GitHub Actions/workflow files, no test runner, and no automated security scanning gates.
  - Releases therefore depend on manual execution, which increases the chance of shipping broken builds, regressions, or unsafe config changes.
  - Because the project already lacks automated tests, a manual pipeline also means no meaningful quality gate before deployment.
- **Specific improvement recommendation:**
  - Add a repo-level CI workflow that runs, at minimum, `lint`, `typecheck`, backend `build`, frontend `build`, Prisma validation, and the automated test suite once it exists.
  - Add dependency and secret scanning in CI.
  - Fail the pipeline on missing environment variables, build errors, and security-policy violations.

### 2) Deployment strategy is not progressive or rollback-safe

- **Severity:** High
- **Operational risk assessment:**
  - No blue-green, canary, or similar staged rollout mechanism is visible in the repo.
  - There is also no explicit rollback automation or health-check-driven promotion flow.
  - This matters because the backend scheduler runs in-process; if multiple instances are started during a rollout, background work can duplicate immediately.
- **Specific improvement recommendation:**
  - Introduce staged promotion with health checks and automatic rollback on failed smoke tests.
  - Separate background jobs from request-serving processes, or guard them with a distributed lock/worker model before enabling horizontal scaling.
  - Document the rollback path for backend, frontend, and database changes as part of the release process.

### 3) Infrastructure is not managed as code

- **Severity:** High
- **Operational risk assessment:**
  - No Terraform, Pulumi, Docker, Compose, Kubernetes, or platform IaC files were present in the repository scan.
  - That means environment provisioning, runtime config, and operational topology are likely manual or externalized without versioned review.
  - Manual infra changes increase drift, make outages harder to reproduce, and weaken change control.
- **Specific improvement recommendation:**
  - Version infrastructure and platform configuration in the repo or a linked IaC repository.
  - Require PR review for infra changes and treat them like application code.
  - Capture runtime dependencies explicitly: database, Redis, metrics protection, secrets, deployment targets, and scaling model.

### 4) Monitoring and observability are not production-hardened

- **Severity:** High
- **Operational risk assessment:**
  - The codebase exposes an internal metrics endpoint, and the environment template shows `METRICS_TOKEN` as optional/empty by default.
  - There is no evidence of alerting rules, dashboards, centralized log shipping, or incident-oriented telemetry.
  - In practice this creates two problems: unauthorized access to metrics if the token is omitted, and slow detection when auth, rate-limit, scheduler, or DB issues happen.
- **Specific improvement recommendation:**
  - Make metrics protection mandatory in production and fail closed when the token is missing.
  - Emit structured application logs with consistent request/trace identifiers.
  - Add dashboards and alerts for auth failures, rate-limit spikes, scheduler errors, Redis outages, and 5xx rates.
  - Define log retention and a centralized log destination so incidents can be reconstructed quickly.

### 5) Incident response is not operationalized

- **Severity:** Medium
- **Operational risk assessment:**
  - There are no visible runbooks, escalation notes, on-call expectations, or rollback playbooks in the repo.
  - This raises mean time to recovery because the team must rediscover procedures during an incident.
  - It is especially risky for known failure modes such as debug token leakage, metrics exposure, Redis outage, and duplicated scheduled jobs.
- **Specific improvement recommendation:**
  - Create short runbooks for the highest-risk incidents: auth token exposure, metrics exposure, Redis failure, scheduler duplication, and deployment rollback.
  - Define who is paged, what signals trigger escalation, and what the first three mitigation steps are.
  - Include a clear “stop the bleeding” checklist and a post-incident follow-up template.

### 6) Environment management uses unsafe defaults and lacks strict separation

- **Severity:** High
- **Operational risk assessment:**
  - `backend/.env.example` includes production-sensitive flags with unsafe defaults such as `AUTH_DEBUG_EXPOSE_TOKENS=true`, `COOKIE_SECURE=false`, `METRICS_TOKEN=` empty, and `RATE_LIMIT_USE_REDIS=false`.
  - This makes it easy for a copied config to accidentally weaken auth, cookie protection, observability access, or rate limiting in production.
  - The repo also does not show a secret manager integration or environment-specific config layering.
- **Specific improvement recommendation:**
  - Split environment templates by stage, or add explicit validation that forbids debug and insecure defaults in production.
  - Require secrets to come from a secret manager or deployment platform, not committed templates.
  - Enforce strong startup validation so production cannot boot with insecure combinations.
  - Keep dev, staging, and prod parity for services, but not for secrets or debug toggles.

## Priority actions

1. Add CI workflows with build, lint, typecheck, Prisma validation, test execution, and security scanning.
2. Move background jobs out of the request process or add distributed locking before scaling.
3. Harden production config by making metrics/auth/rate-limit safety checks fail closed.
4. Codify deployment rollback and incident runbooks.
5. Introduce IaC so runtime config is reviewed and reproducible.

## Bottom line

The project is currently functional for local development, but it is not yet safe for reliable multi-instance production operations. The biggest operational gaps are the missing CI/CD gate, the absence of progressive deployment and rollback controls, unsafe environment defaults, and the lack of observability/runbooks to recover quickly when something fails.
