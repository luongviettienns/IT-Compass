# 15 — Delivery roadmap, dependencies, release gates and solution choices

## 1. Recommended strategy

**Fix reliability and misleading behavior before scaling audience.** Apply as incremental slices with staged rollout. Feature scope below is a priority blueprint; actual calendar depends on contributors, tests, deployment and approval.

### Phase 0 — Establish baseline (before functional changes)

- Snapshot current HEAD, dependencies, Prisma schema and all API contracts.
- Add initial unit/integration/CI scaffolding; make existing backend/frontend build reproducible.
- Record actual bugs by code reproduction and risk register; test staging with synthetic users.
- Add mechanism for feature flags and protected staging deployment if absent.

Exit: red/green test path proven, safe staging, rollback instructions drafted.

### Phase 1 — P0: Trust and business correctness

- Authentication transactional email, verified reset and security protections.
- Booking state invariants, pending expiry, time zone, no-show outcome semantics, concurrent locking, action UI.
- Fix admin soft-delete misleading copy and mutation-close behavior.
- Correct public claims and route metadata mismatches.
- Implement critical path tests and CI gates; ensure no unsupported legal/quality claims.

Exit: 0 open critical P0 issues in affected flows; all mandatory E2E rows AUTH-*, BKG-* pass; privacy/copy reviewed.

### Phase 2 — P1: UX clarity and product instrumentation

- Admin dashboard task queue, header search fix/removal, error states, CMS unsaved changes, mentor workflow clarifications.
- Assessment V2 instrument design, expert/pilot review, scoring display change, versioned release.
- Public hero/copy, navigation and guest-first-value improvements.
- Product analytics events + conversion funnel and privacy controls.
- Shared design system and accessibility on main routes.

Exit: operator can finish core workflow without training; first-time student understands value and gets first outcome; instrumentation audited.

### Phase 3 — P2: Distinctive career exploration

- Mission engine (data-driven) + UX Rescue → Server Crisis → Cyber Detective.
- Student exploration profile and mentor recommendation bridge; metrics of mission learning, not click addiction.
- UX improvements driven by pilot feedback/analytics; add relevant blog content and beginner roadmaps.

Exit: 3 complete game scenarios, debriefs and keyboard/mobile QA; users can choose next discovery; results versioned.

### Phase 4 — P3: Data-driven personalization

- Collect consented feedback in operational context, not blanket tracking.
- Establish rule-based recommendation baseline; test candidate ML offline with trustworthy labels.
- Shadow and optional A/B mode only if model adds measurable value and privacy review passes.

Exit: model improves predefined user-centered metrics, or ML **does not ship** and rule-based stays.

## 2. Trade-offs and decisions

| Problem | Options | Best default | Why |
|---|---|---|---|
| New frontend style | Full UI rewrite / incremental design system | **Incremental** | preserve tested routes and scope regressions |
| Email | New microservice / backend adapter | **Backend adapter+outbox** | smaller operational complexity, reliable resend |
| Booking overlap | read-then-write / DB serialized resource | **DB resource lock in transaction** | correctness under concurrency |
| NO_SHOW | auto after time / evidence-based | **Evidence-based** | time doesn't show attendance |
| Career scoring | ML trained on old labels / validated interest scores | **Transparent score + evidence** | prevent mislabeled certainty |
| Admin home | more charts / action inbox | **Action inbox first** | optimizes work completion |
| CMS editor | full-screen modal / dedicated page | **Dedicated page for long-form** | navigation, unsaved guard, usability |
| Mission system | one-off React games / shared engine | **Shared versioned engine** | replays, analytics, 3+ scenarios |
| AI prediction | train LLM / recommend next exploration | **Rule baseline, ML later** | lower risk and clearer ground truth |
| Payments | improvise in-app / explicit model decision | **Explicit no-payment MVP** | no fake guarantees or unowned financial liability |

## 3. Ownership model

- **Owner/PM:** acceptance criteria, copy/brand truth, price/payment scope, privacy/legal review, release approval.
- **Tech lead:** architecture, migrations, code ownership, sequencing, PR review.
- **Backend:** auth, scheduling, payment boundary, assessment service, mission persistence.
- **Frontend/UX:** public onboarding, admin/mentor flows, shared components, accessible games.
- **QA/DevOps:** CI, staging, E2E, monitoring, rollback and incident response.
- **Research/assessment advisor:** item bank content and validation claims; no agent may self-certify psychometric validity.

## 4. Readiness scorecard (check, not invented points)

| Gate | Concrete proof |
|---|---|
| Source health | reproducible install/build/typecheck, no blocking CI |
| Security | rate-limit/proxy/metrics tested, auth lifecycle complete |
| Booking | concurrent test and state machine invariant proof |
| Assessment | versioned V1/V2, clear result limitations, pilot findings |
| Accessibility | keyboard audit, axe, reduced motion, responsive checks |
| Product claims | no unknown #1, fake metrics, wrong item count |
| Operations | error monitoring, backup restore check, deployment rollback |
| UX validation | 5+ novice student task observations and admin task walkthroughs; sample size is heuristic, not validation of outcomes |
| Retention | instrumented first value and meaningful return with consent |

## 5. Feature flags & rollout

- `ASSESSMENT_V2_ENABLED`, `GUEST_RESULT_PREVIEW_ENABLED`, `MISSIONS_ENABLED`, `EXPLORATION_RECS_V2`, `ADMIN_DASHBOARD_V2` (naming examples).
- Deploy behind flags, smoke-test staging, enable to internal users, then a small beta cohort; measure errors/activation, revert quickly.
- Never promise implementation date without capacity data.

## 6. Nonfunctional targets

Targets must be **defined with product owner based on environment and baseline**. Measure LCP/INP/CLS, uptime/error rate, recovery time, queue latency, email delivery, booking operation p95. No made-up '99.9% achieved' or user results.
