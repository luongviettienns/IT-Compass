# 16 — Executable backlog for coding agents

> Mỗi ticket là một pull request lý tưởng (hoặc nhóm nhỏ nếu phụ thuộc chặt). `P0` business/data/security correctness; `P1` clarity+quality; `P2` discovery differentiation; `P3` ML. Tests and docs included in every ticket.

## P0 — Stop misleading behavior, errors and data integrity

### IC-001 — Authentication: real verification/reset email
**Source:** `backend/src/services/auth.service.ts`, auth controllers/routes, frontend auth pages.  
**Observed:** token issued but no delivery adapter found in inspected baseline; frontend reports an email sent.  
**Implement:** provider interface, templates, outbox/robust delivery, expiring single-use hashed tokens, generic responses, safe origin, resend, session revocation.  
**Acceptance:** complete staging signup→verify/reset via test mailbox; replay/expired/unknown email tests; no secret logs.  
**Depends:** IC-010 CI foundation. **Spec:** `02`.

### IC-002 — Booking attendance lifecycle: remove auto NO_SHOW
**Source:** `booking.service.ts` + scheduler/task + student/mentor/admin UI.  
**Observed:** ended CONFIRMED bookings moved to NO_SHOW after grace time without attendance evidence.  
**Implement:** outcome pending/awaiting review, participant confirmation flow, safe old-state compatibility; audit.  
**Acceptance:** legitimate completed consultation never called no-show solely because mentor forgot a click; expired/ambiguous status clearly explained. **Spec:** `03`.

### IC-003 — Booking concurrency and idempotence
**Source:** booking create/confirm services & Prisma transaction.  
**Risk to reproduce:** concurrent read-before-create overlap.  
**Implement:** DB resource locking/transaction invariant, controlled retries, idempotency key, dedup notifications.  
**Acceptance:** parallel same-slot integration tests prove no overlapping ACTIVE bookings and stable retry responses. **Spec:** `03`.

### IC-004 — Booking expiry/timezone/autoConfirm
**Source:** booking service, settings, job, `BookingDialog.tsx`.  
**Observed:** local Node Date parsing and create `REQUESTED` despite autoConfirm field; stale pending reservation risk.  
**Implement:** explicit TZ, timed expiry, autoConfirm consistent with owner-chosen semantics, UI deadlines/zone.  
**Acceptance:** UTC-host/Asia-Ho_Chi_Minh tests, no stale capacity blocking, autoConfirm matches label. **Spec:** `03`.

### IC-005 — Admin Booking status-aware actions and pending UX
**Source:** `AdminBookingsPage.tsx`.  
**Observed:** all actions always shown; confirm/complete/no-show close dialog before API success.  
**Implement:** action availability policy mapping, mutation wait, inline errors, confirmation & reason for no-show.  
**Acceptance:** invalid actions inaccessible, dialog stays open on failed request; statuses localized; E2E.  
**Depends:** IC-002/004 business states. **Spec:** `08`.

### IC-006 — Correct deceptive deletion copy
**Source:** `AdminBlogCommentsModal.tsx`, `blog-comment.service.ts`.  
**Observed:** 'Xóa vĩnh viễn' but backend uses `deletedAt` soft delete.  
**Implement:** accurate copy, optionally restore policy as separate ticket, update audit wording.  
**Acceptance:** UI/action and backend semantics match; QA screenshot. **Spec:** `08`.

### IC-007 — Lock down proxy/rate-limit/metrics/upload
**Source:** rate-limit middleware, `app.ts`, `config/upload.ts`, metrics route.  
**Implement:** trusted proxy strategy, default-private metrics, headers/CSP, upload content validation; permission checks.  
**Acceptance:** forged XFF doesn't bypass limit; unauthorized metrics rejected; malicious file tests; security review. **Spec:** `02`.

### IC-008 — Correct public marketing claims
**Source:** `LandingPage.tsx`, Test/Result copy.  
**Observed:** #1, fixed 20+/50+/30/15 minutes and 'hundreds' unverified or inconsistent with question catalog.  
**Implement:** remove unsupported claims, derive factual counts when available, no unsupported psychometric claim.  
**Acceptance:** public copy matches production facts and available functionality. **Spec:** `06`.

### IC-009 — Admin loading/empty/error/success states
**Source:** `AdminDashboard.tsx`, Users/Mentors/Assessments/Bookings pages.  
**Observed:** query fallbacks often mask missing data as 0; several pages don't explicitly handle query error.  
**Implement:** shared query boundary, retry, error messaging, never fake empty count.  
**Acceptance:** injected API 500 shows error not zero; successful 0 shows legitimate empty. **Specs:** `07`, `08`, `12`.

### IC-010 — CI + critical automated tests
**Source:** package configs, `.github/workflows` (not found in baseline), test folders.  
**Implement:** Vitest/RTL/Supertest/Prisma isolated DB/Playwright scaffolding, CI, basic auth+booking tests.  
**Acceptance:** PR CI checks lint/typecheck/build/test; isolated test DB; 1 E2E from each role. **Spec:** `13`.

## P1 — Product correctness, admin clarity and assessment quality

### IC-011 — Assessment V2 question bank and versioning
**Source:** `assessment.questions.ts`, catalog, types, service.  
**Implement:** 30 beginner-friendly core RIASEC questions, separately tracked situations, versioned scores, keep V1 readable, cognitive interviews and expert review.  
**Acceptance:** no assumed technical knowledge; V1 historical data unchanged; version mismatch tests. **Spec:** `04`.

### IC-012 — Honest scoring/result UI
**Source:** `assessment.scoring.ts`, `assessment.constants.ts`, `ResultPage.tsx`.  
**Observed:** best ranking always 100% under fixed normalization.  
**Implement:** explanation-based ranking, explicit uncertainty, non-calibrated score relabeled; no unsupported confidence.  
**Acceptance:** no '100% ngành phù hợp', tie results meaningful; display accessible. **Spec:** `04`.

### IC-013 — CMS unsaved changes safety
**Source:** `AdminBlogFormModal.tsx`.  
**Observed:** close does not check dirty state.  
**Implement:** dirty tracking + confirm, draft persistence, recovery; dedicated editor route if scoped.  
**Acceptance:** edits survive accidental close/refresh per designed policy; save error doesn't wipe content. **Spec:** `08`.

### IC-014 — Admin header and terminology
**Source:** `AdminPage.tsx`, `AdminSidebar.tsx`, common status labels.  
**Observed:** inert header search; mixed EN/VN technical terminology.  
**Implement:** remove fake search or real command palette after API design; central i18n/status labels, proper affordance.  
**Acceptance:** no dead input; main admin labels understandable to nontechnical operator. **Specs:** `07`, `12`.

### IC-015 — Admin action inbox dashboard
**Source:** `AdminDashboard.tsx` plus minimal admin aggregate API if needed.  
**Implement:** booking requests due, mentor approval queue, moderation queue, data/service errors, time range KPIs, guarded links.  
**Acceptance:** every action card links to prefiltered real list; API failure visible; no fake stat. **Spec:** `07`.

### IC-016 — Mentor approval & form grouping
**Source:** AdminMentors, AdminMentorFormModal, mentor services.  
**Implement:** verified vs active filter, evidence/approval workflow, grouped form, slug generated, public preview.  
**Acceptance:** operator can review mentor with checklist; student never sees unverified as verified; actions audited. **Spec:** `08`.

### IC-017 — Mentor scheduling language and student booking transparency
**Source:** MentorAvailabilityPage, BookingDialog, student booking pages.  
**Implement:** replace buffer jargon, timezone/disclosure, deadlines/cancel terms, meeting info, explicit save state.  
**Acceptance:** inexperienced mentor can set a weekly schedule; student can understand fee/meeting/time. **Specs:** `03`, `09`.

### IC-018 — Accessibility/design system baseline
**Source:** `frontend/src/components/ui/*`, dialogs, tables, nav.  
**Implement:** text sizes, aria labels/labels, focus trap, reduced motion, keyboard alternatives, status badges.  
**Acceptance:** axe/keyboard smoke on main routes, no critical inaccessible control in touched pages. **Spec:** `12`.

### IC-019 — Privacy and user data lifecycle
**Source:** auth/profile APIs, public footer/routes, analytics collection plan.  
**Implement:** owner-reviewed privacy/terms, retention, account deletion/export or request flow, consent as needed.  
**Acceptance:** policies match actual backend; data request path functional; no unsupported legal claims. **Spec:** `02`.

## P2 — Marketing, discovery, instrumentation and game MVP

### IC-020 — Marketing landing v2 / first value
**Source:** `LandingPage.tsx`, Header/BottomNav, TestPage.  
**Implement:** outcome-driven hero, truthful CTA, student-first flow, trust section, dynamic proof, responsive/reduced-motion.  
**Acceptance:** first task can start without friction; A/B baseline events available; no dead demo. **Spec:** `06`.

### IC-021 — First-party analytics and funnels
**Source:** new type-safe analytics library + guarded backend/event storage.  
**Implement:** dictionary, consent-safe events, server-confirmed booking signals, dashboard funnel and cohort definitions.  
**Acceptance:** event counts deduped and raw student answers absent. **Spec:** `11`.

### IC-022 — Student exploration dashboard
**Source:** `ProfilePage.tsx`, assessment results, new exploration profile.  
**Implement:** continue next meaningful activity, saved explorations, interest profile, mentor/bookings links, privacy.  
**Acceptance:** next action understandable, no arbitrary talent scores, empty/new user meaningful. **Spec:** `09`.

### IC-023 — Mission engine and UX Rescue
**Source:** new `/explore` routes, mission engine, optional DB.  
**Implement:** engine state/reducer, scenario versioning, guest play, keyboard reorder, debrief and feedback.  
**Acceptance:** one complete accessible mission and E2E; analytics and resume. **Spec:** `10`.

### IC-024 — Server Crisis scenario
**Depends:** IC-023.  
**Implement:** dashboards/log clues, incident hypothesis, safe rollback, consequences, glossary and debrief.  
**Acceptance:** deterministic branching, all options reviewed, retry. **Spec:** `10`.

### IC-025 — Cyber Detective scenario
**Depends:** IC-023.  
**Implement:** simulated phishing evidence board, safe response, non-offensive security education, debrief.  
**Acceptance:** no dangerous real URL, accessible investigation steps and helpful feedback. **Spec:** `10`.

### IC-026 — CMS SEO + operations refinement
**Source:** AdminBlogs/CMS editor, public blog pages.  
**Implement:** dedicated editor, URL/SEO preview, publication status, link from articles to related discovery.  
**Acceptance:** draft→schedule/publish flow reliable, no lost edits, SEO metadata accurate. **Spec:** `08`.

## P3 — ML only after data and validation

### IC-027 — Deterministic exploration recommender
**Depends:** IC-011/012/021/023.  
**Implement:** transparent rule-based next mission recommendations, reason codes and diversity constraints.  
**Acceptance:** deterministic, explained, user override, graceful cold start. **Spec:** `05`.

### IC-028 — ML dataset governance and offline evaluation
**Depends:** IC-021/027, privacy consent.  
**Implement:** labels from post-activity preferences, user/time holdout, baseline comparison and fairness checks.  
**Acceptance:** audited evaluation shows improvement or explicit NO SHIP. **Spec:** `05`.

### IC-029 — Optional ML shadow experiment
**Depends:** IC-028 AND owner approval.  
**Implement:** shadow/flagged inference, monitoring, safe fallback, consent and experiment report.  
**Acceptance:** business/product performance not worse than baseline; rollback immediate. **Spec:** `05`.

## Ticket execution template

```md
# IC-XXX — <Title>
- Severity:
- Type: OBSERVED / RISK / PROPOSED
- Dependencies:
- Baseline SHA:
- UI entry route:
- Backend API / model:
- Reproduction:
- Current / desired behavior:
- Proposed approach (options + why chosen):
- Compatibility / security / privacy:
- Changed files:
- Tests (unit/integration/e2e):
- Acceptance criteria:
- Rollback:
- Evidence (screenshots/logs/test output):
```

Prioritize critical blockers by impact, not only by ID; IC-010 can be implemented alongside early P0 to enable test-first fixes.
