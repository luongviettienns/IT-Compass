# 08 — Admin modules: detailed UX & business operations remediation (P0–P2)

## 1. All modules: foundation rules

Files: `frontend/src/pages/admin/*`, `frontend/src/components/admin/*`, `frontend/src/components/layout/AdminSidebar.tsx`.

- Standard states: `loading`, `error`, `empty`, `ready`, `mutating`, `partial-failure`.
- Table UX: visible search and filter labels, current filter summary, result count, URL-persisted pagination/filter if useful, accessible sort, responsive horizontal scrolling or compact cards, purposeful bulk action.
- Mutations: confirm destructive, show affected count/records, stay in dialog until API success, disable duplicate, inline error without lost context, toast only supplemental.
- Forms: proper label `htmlFor`, validation next to field, no lost unsaved changes, autofocus/focus trap/focus return, Escape handling, accessible confirmation and status.
- Copy: consistent Vietnamese; domain status labels in single source (`bookingStatusLabels`, `mentorStatusLabels`, `auditActionLabels`).
- Strict role/permission validation server-side; frontend disabled controls are not security barriers.

## 2. Admin users — `AdminUsersPage.tsx`, `AdminUserEditModal.tsx`

**Observed:** search/filter, page-based checkbox selection, bulk status change/session revoke, audit reason, role edit. Icon gear used for edit details. `getStatusActionCopy` maps target state to user-facing text; verify nuances.

Changes:
1. Use explicit pencil icon/button text `Chỉnh sửa`; gear reserved for settings.
2. Clarify statuses: ACTIVE/ SUSPENDED / BLOCKED; show descriptions and effects on sessions. If backend supports unblock vs unsuspend differences, reflect exactly.
3. Select-all semantics: always say `Đã chọn X tài khoản trong trang này` vs `X trong toàn bộ kết quả`. Clear or reconcile selection on filter/page changes.
4. Protect admin self-lockout, last admin and permission escalation; test backend guard; explain errors.
5. During bulk mutation show queued/completed/failed counts, partial success and retry only failures.
6. Role change warning explaining access consequences; verify attached Mentor profile and downstream dashboard.
7. Account details show verification status and session revoke as distinct actions.

Acceptance: selection scope unambiguous; unauthorized or dangerous action blocked; filters work after back nav; error never mistaken as empty.

## 3. Mentors — `AdminMentorsPage.tsx`, `AdminMentorFormModal.tsx`

**Observed:** create/edit mentor with many fields and status/verify; list filters only `all`, `ACTIVE`, `PAUSED` while verification is shown per row; record has separate verified boolean.

Changes:
1. Add verification filter `Chưa xác thực/Đã xác thực` distinct from active filter.
2. Create **approval work queue** with evidence fields/checklist, review decision and optional rationale; prevent `verified=true` by untrusted mentor request.
3. Split form into identity, expertise, service, approval sections; auto-generate slug with optional advanced override + uniqueness validation.
4. Preview public profile before publishing; clear visibility and fee display.
5. Avoid ambiguous `Đã xác thực` when staff did not verify substantive credentials; define checklist.
6. Feedback on mutation success and persistence; maintain sort/filter after action.
7. Search by name/email/expertise if backend supports; don't claim unsupported filters.

Acceptance: operator can approve valid mentor with reason and evidence; rejected/unverified profile not advertised as verified; agent cannot invent verified badge.

## 4. CMS — `AdminBlogsPage.tsx`, `AdminBlogFormModal.tsx`

**Observed:** 3-step modal `content`, `publishing`, `seo`; slug check, Markdown preview, image upload, draft/published/scheduled, bulk actions. `handleClose` simply clears error and closes; unsubmitted edits may be lost.

**Recommended:** convert full article editor to dedicated route `/admin/blogs/new` / `/admin/blogs/:id/edit` (long-form content better in full page); keep existing modal for short preview or MVP with dirty-state guard if route migration too risky.

Mandatory changes:
1. `isDirty`: detect draft changes, confirm before close/browser navigation/route change, support server draft save or autosave with version conflict policy.
2. Toolbar buttons have labels/hints for non-Markdown users; tooltips are not only help source.
3. Slug auto-generated, duplicate prevention; safe change after publish with redirect/canonical decision.
4. Content validation and preview match public renderer; check image alt text, external links, unsafe URLs and broken image handling.
5. Publishing statuses clear: Draft, Scheduled, Published, Deleted; scheduled timezone visible, valid future time; action preview.
6. Prevent accidental overwrite when editing concurrently; use version/updatedAt optimistic concurrency if multiple admins.
7. SEO metadata length hints, preview snippet, indexing instructions; no unsupported guarantees.
8. Filter by author/status/date, preview article, restore deleted in explicit reversible period.

Acceptance: 20-minute unsaved edit cannot disappear silently; Draft→Preview→Publish→Public display correct; publishing error preserves draft.

## 5. Comments — `AdminBlogCommentsModal.tsx`, `blog-comment.service.ts`

**Observed semantic mismatch:** UI says `Xóa vĩnh viễn`, but backend `deleteComment` sets `deletedAt`, `deletedBy` (soft delete).

Changes:
- Rename to `Xóa bình luận` / `Chuyển vào mục đã xóa`, state clearly whether restore is offered.
- If hard delete is a true requirement, separate privileged workflow with audited policy and authorization; NOT default.
- Add report reason / spam / harassment grouping if product needs moderation. Allow inspect context (post link, previous comments, actor).
- Protect against accidental deletion with confirmation that matches actual semantics; keep pagination/filters after action.

Acceptance: copy exactly matches backend deletion; audit log available; recovery policy clear.

## 6. Bookings — `AdminBookingsPage.tsx`

**Observed:** modal shows all action buttons for selected record regardless `detail.status`; Confirm/Complete/NoShow call `mutate()` and close immediately, before API finishes; labels `Booking`, `No-show`, `Prev/Next` untranslated.

Changes:
- State-based `availableActions(status, actor, time)`, backed by backend transition policy. Disabled action must explain why.
- Confirm and no-show consequences: confirmation with role/reason where appropriate.
- Keep modal open pending API; success updates detail, display persistent confirmation, fail inline and allow retry.
- Show timeline, expiry, confirmedAt, attendance evidence, timezone, cancellation history and notification status if backend supports.
- Search/filter statuses with consistent Vietnamese; default queue `Cần xử lý` for pending.
- Backend state fixes: `03-BOOKING-BUSINESS-FLOWS.md` first.

Acceptance: cancelled/completed record never exposes Confirm, Complete, NoShow; API failure doesn't close modal; time zone explicit.

## 7. Assessment admin — `AdminAssessmentsPage.tsx`

**Observed:** raw statuses `SUBMITTED`, `DRAFT`; columns `User`, `Result`, `Submitted`, `Duration`, `Traits`; charts distribution and 6-month trend.

Changes:
- Translate UI; show question/algorithm version, survey start/completion funnel, time spent, abandoned stage, unclear question feedback.
- Distinguish version V1 vs V2; never compare score distributions directly without measurement equivalence.
- Analytics grouped/aggregated by default; limit raw answers to approved data stewardship use.
- Add filter `Instrument version`, `Completion status`, `Cohort` only if actually stored and permitted.
- Download raw results guarded, audited and minimized; no third-party exposure.

Acceptance: dashboard usable by product owner, no technical codes without labels, version-aware stats, privacy guard.

## 8. Audit logs — `AdminAuditLogsPage.tsx`

**Observed:** filters use `Actor user ID`, `Target user ID`, `Target ID` in technical form; useful for engineers but hard for operations.

Changes:
- Human-readable summary `Ai đã làm gì, với đối tượng nào, khi nào, vì sao`.
- Search by actor/target name with permission controls; technical IDs under `Chi tiết kỹ thuật`.
- Exact timestamp with timezone, before/after changes masked for PII; export includes actor/action/target/reason.
- Avoid claiming comprehensive log if it only covers users/blogs; scope appropriately.

Acceptance: new staff understands a log without memorizing enum names; technical details still available.

## 9. Settings — `AdminSettingsPage.tsx`

**Observed:** page explicitly says backend has no admin settings API; all setting cards disabled.

**Recommended MVP:** hide from production sidebar unless there is at least one usable setting, or transform into read-only `Tình trạng hệ thống` with verified backend health data. Do not show inactive controls as features.

If implementing settings later: provider configuration (server-side only, secrets hidden), email templates, security policies controlled by approvals, audit every change, rollback config.

## 10. User-facing issue priority

| Issue ID | Severity | Confirmed UI fact |
|---|---|---|
| ADM-001 | P0 | booking detail buttons independent of status; modal closes before mutation success |
| ADM-002 | P0 | comments UI says hard delete; backend performs soft delete |
| ADM-003 | P1 | admin header search input inert |
| ADM-004 | P1 | admin settings are placeholder |
| ADM-005 | P1 | metrics show zero when query missing/failed |
| ADM-006 | P1 | content editor lacks explicit unsaved-change guard |
| ADM-007 | P1 | admin technical vocabulary mixed; label sizes often tiny |
| ADM-008 | P2 | action inbox, KPI funnel, friendly audit, approval queue |

All ticket IDs cross-reference `16-ISSUE-BACKLOG.md`.
