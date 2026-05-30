# IT Compass Business Flow Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the current IT Compass flow into a coherent business journey with explicit gates, booking lifecycle clarity, actionable assessment output, meaningful chat/follow-up, and cleaner mentor/admin boundaries.

**Architecture:** Keep the current route shell and Prisma model family, but harden the weakest links in the business chain first: profile gate, assessment handoff, booking lifecycle, then chat/notifications, then mentor/admin ops, then dead-end cleanup. Each phase should make one business transition unambiguous and testable before moving to the next.

**Tech Stack:** React + Vite + TypeScript + React Router + React Query + Socket.IO client, Node.js + Express + TypeScript + Prisma + Zod + Redis.

---

### Task 1: Lock onboarding and profile completion gates

**Files:**
- Modify: `frontend/src/components/auth/ProtectedRoute.tsx`
- Modify: `frontend/src/contexts/AuthContext.tsx`
- Modify: `frontend/src/pages/ProfilePage.tsx`
- Modify: `frontend/src/lib/userApi.ts`
- Modify: `frontend/src/lib/authQueryKeys.ts`
- Modify: `backend/src/controllers/user.controller.ts`
- Modify: `backend/src/services/user.service.ts`
- Modify: `backend/src/routes/user.routes.ts`
- Modify: `backend/prisma/schema.prisma`
- Test: `backend/src/services/user.service.test.ts`
- Test: `frontend/src/components/auth/ProtectedRoute.test.tsx`

- [ ] **Step 1: Write the failing guard test**

Assert that an authenticated user with an incomplete profile is redirected to profile completion instead of `/bookings`, `/messages`, or recommendation actions.

- [ ] **Step 2: Write the failing backend test**

Assert that the user profile response includes a derived completion flag and the minimum required fields for downstream gating.

- [ ] **Step 3: Implement the minimal profile-completion signal**

Expose a single completion flag from the backend user payload and use it in the auth context to gate protected routes.

- [ ] **Step 4: Make the UI explain the block**

Show one clear message on the profile page: either the account is ready or one required profile step is still missing.

- [ ] **Step 5: Verify the gate end-to-end**

Run:

```bash
npm run -C backend typecheck
npm run -C frontend build
```

Expected: both pass, and the protected route test confirms incomplete users cannot slip into later flow screens.

---

### Task 2: Strengthen assessment → recommendation → booking bridge

**Files:**
- Modify: `frontend/src/pages/assessment/ResultPage.tsx`
- Modify: `frontend/src/pages/assessment/TestPage.tsx`
- Modify: `frontend/src/pages/assessment/QuizPage.tsx`
- Modify: `frontend/src/lib/assessmentApi.ts`
- Modify: `frontend/src/lib/assessmentQueryKeys.ts`
- Modify: `frontend/src/lib/quizScoring.ts`
- Modify: `backend/src/controllers/assessment.controller.ts`
- Modify: `backend/src/services/assessment.service.ts`
- Modify: `backend/src/services/assessment.results.ts`
- Modify: `backend/src/services/assessment.scoring.ts`
- Modify: `backend/src/services/assessment.catalog.ts`
- Modify: `backend/src/routes/assessment.routes.ts`
- Modify: `backend/prisma/schema.prisma`
- Test: `backend/src/services/assessment.results.test.ts`
- Test: `frontend/src/pages/assessment/ResultPage.test.tsx`

- [ ] **Step 1: Write the failing result-page test**

Assert that the result page always shows: matched majors, matched mentors, and one next action CTA.

- [ ] **Step 2: Write the failing recommendation-test**

Assert that weak matches still return a soft recommendation set instead of an empty result.

- [ ] **Step 3: Implement result-page actionability**

Ensure result payloads carry one explicit next-step target, not just a score bucket.

- [ ] **Step 4: Preserve attempt history as the canonical record**

Keep the latest attempt visible in history while still allowing older attempts to remain queryable.

- [ ] **Step 5: Verify the bridge**

Run:

```bash
npm run -C backend typecheck
npm run -C frontend build
```

Expected: result-page test passes and a low-confidence result still routes to a useful follow-up action.

---

### Task 3: Finish the booking lifecycle as a state machine

**Files:**
- Modify: `frontend/src/pages/StudentBookingsPage.tsx`
- Modify: `frontend/src/pages/mentor/MentorBookingsPage.tsx`
- Modify: `frontend/src/components/mentor/BookingDialog.tsx`
- Modify: `frontend/src/components/mentor/BookingCancelDialog.tsx`
- Modify: `frontend/src/components/mentor/BookingStatusBadge.tsx`
- Modify: `frontend/src/components/shared/RealtimeBookingListener.tsx`
- Modify: `frontend/src/lib/bookingApi.ts`
- Modify: `frontend/src/lib/bookingQueryKeys.ts`
- Modify: `backend/src/controllers/booking.controller.ts`
- Modify: `backend/src/services/booking.service.ts`
- Modify: `backend/src/validators/booking.validator.ts`
- Modify: `backend/src/routes/booking.routes.ts`
- Modify: `backend/src/socket/booking.events.ts`
- Modify: `backend/src/tasks/scheduled.tasks.ts`
- Modify: `backend/prisma/schema.prisma`
- Test: `backend/src/services/booking.service.test.ts`
- Test: `frontend/src/pages/StudentBookingsPage.test.tsx`

- [ ] **Step 1: Write the failing lifecycle test**

Assert that the booking status transitions are valid only in this order:
`REQUESTED → CONFIRMED → COMPLETED`
and cancellation/no-show can only happen from allowed states.

- [ ] **Step 2: Add the missing booking rules**

Add explicit handling for reschedule-by-cancel-and-rebook behavior if true reschedule is not implemented yet, and make that behavior visible in UI copy.

- [ ] **Step 3: Implement clearer booking state labels**

Map backend status values to one stable UI badge vocabulary so student and mentor see the same lifecycle language.

- [ ] **Step 4: Make realtime updates re-sync lists**

After confirm/cancel/complete/no-show, invalidate both student and mentor booking queries and reflect the change without refresh.

- [ ] **Step 5: Verify the booking core**

Run:

```bash
npm run -C backend typecheck
npm run -C frontend build
```

Expected: booking service tests pass and booking list UI reflects lifecycle changes immediately.

---

### Task 4: Build the chat and follow-up loop around booking

**Files:**
- Modify: `frontend/src/pages/MessagesPage.tsx`
- Modify: `frontend/src/pages/mentor/MentorPage.tsx`
- Modify: `frontend/src/components/chat/ConversationList.tsx`
- Modify: `frontend/src/components/chat/ChatThread.tsx`
- Modify: `frontend/src/components/chat/MessageComposer.tsx`
- Modify: `frontend/src/components/chat/MessageBubble.tsx`
- Modify: `frontend/src/lib/conversationApi.ts`
- Modify: `frontend/src/lib/conversationQueryKeys.ts`
- Modify: `frontend/src/lib/chatSocket.ts`
- Modify: `frontend/src/components/shared/RealtimeNotificationListener.tsx`
- Modify: `backend/src/controllers/conversation.controller.ts`
- Modify: `backend/src/services/conversation.service.ts`
- Modify: `backend/src/validators/conversation.validator.ts`
- Modify: `backend/src/routes/conversation.routes.ts`
- Modify: `backend/src/socket/chat.handlers.ts`
- Modify: `backend/src/socket/notification.events.ts`
- Modify: `backend/src/services/notification.service.ts`
- Modify: `backend/src/routes/notification.routes.ts`
- Modify: `backend/prisma/schema.prisma`
- Test: `backend/src/services/conversation.service.test.ts`
- Test: `frontend/src/pages/MessagesPage.test.tsx`

- [ ] **Step 1: Write the failing chat-context test**

Assert that a conversation always displays whether it is tied to an active booking, a completed booking, or a pre-booking inquiry state.

- [ ] **Step 2: Write the failing notification test**

Assert that booking and message events create a notification record and can be marked read.

- [ ] **Step 3: Implement a visible follow-up path**

After booking confirmation/completion, surface one next action: reply, ask a follow-up question, or schedule again.

- [ ] **Step 4: Make chat entry points business-driven**

Route users into chat from booking and mentor detail context instead of presenting chat as a disconnected inbox.

- [ ] **Step 5: Verify the loop**

Run:

```bash
npm run -C backend typecheck
npm run -C frontend build
```

Expected: chat tests pass and the messages screen always explains why the conversation exists.

---

### Task 5: Separate mentor operations from admin oversight

**Files:**
- Modify: `frontend/src/pages/mentor/MentorOverview.tsx`
- Modify: `frontend/src/pages/mentor/MentorAvailabilityPage.tsx`
- Modify: `frontend/src/pages/mentor/MentorProfileEdit.tsx`
- Modify: `frontend/src/pages/admin/AdminDashboard.tsx`
- Modify: `frontend/src/pages/admin/AdminUsersPage.tsx`
- Modify: `frontend/src/pages/admin/AdminMentorsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminBlogsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminBlogCommentsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminAuditLogsPage.tsx`
- Modify: `frontend/src/components/admin/AdminActionDialog.tsx`
- Modify: `frontend/src/components/admin/AdminUserEditModal.tsx`
- Modify: `frontend/src/components/admin/AdminMentorFormModal.tsx`
- Modify: `frontend/src/components/admin/AdminBlogFormModal.tsx`
- Modify: `backend/src/controllers/admin-user.controller.ts`
- Modify: `backend/src/controllers/admin-mentor.controller.ts`
- Modify: `backend/src/services/admin-user.service.ts`
- Modify: `backend/src/services/admin-mentor.service.ts`
- Modify: `backend/src/services/admin-audit.service.ts`
- Modify: `backend/src/routes/admin-user.routes.ts`
- Modify: `backend/src/routes/admin-mentor.routes.ts`
- Modify: `backend/src/routes/admin-blog.routes.ts`
- Modify: `backend/src/routes/admin-comment.routes.ts`
- Modify: `backend/prisma/schema.prisma`
- Test: `backend/src/services/admin-mentor.service.test.ts`
- Test: `frontend/src/pages/admin/AdminDashboard.test.tsx`

- [ ] **Step 1: Write the failing role-boundary test**

Assert that mentor actions are allowed only in mentor routes and admin actions are allowed only in admin routes.

- [ ] **Step 2: Narrow mentor responsibilities**

Keep mentor screens focused on availability, bookings, profile, and chat; remove any admin-like moderation from mentor surfaces.

- [ ] **Step 3: Keep admin supervisory**

Keep admin screens focused on user lifecycle, mentor lifecycle, blog moderation, and audit.

- [ ] **Step 4: Expose audit for high-impact changes**

Make mentor/profile/admin mutations traceable through audit records or existing admin log surfaces.

- [ ] **Step 5: Verify the boundary**

Run:

```bash
npm run -C backend typecheck
npm run -C frontend build
```

Expected: role-boundary tests pass and the mentor/admin split reads cleanly in the UI.

---

### Task 6: Remove dead ends and add QA/demo readiness

**Files:**
- Modify: `frontend/src/components/ui/Skeleton.tsx`
- Modify: `frontend/src/components/ui/Loader.tsx`
- Modify: `frontend/src/components/ui/EmptyState.tsx`
- Modify: `frontend/src/components/shared/ErrorBoundary.tsx`
- Modify: `frontend/src/pages/NotFoundPage.tsx`
- Modify: `frontend/src/pages/MajorsPage.tsx`
- Modify: `frontend/src/pages/MajorDetailPage.tsx`
- Modify: `frontend/src/pages/BlogPage.tsx`
- Modify: `frontend/src/pages/BlogDetailPage.tsx`
- Modify: `frontend/src/pages/MentorPage.tsx`
- Modify: `frontend/src/pages/MentorDetailPage.tsx`
- Modify: `frontend/src/pages/assessment/ResultPage.tsx`
- Modify: `frontend/src/pages/AboutUsPage.tsx`
- Modify: `frontend/package.json`
- Modify: `backend/package.json`
- Modify: `backend/prisma/seed.ts`
- Modify: `backend/prisma/seed-accounts.md`
- Test: `frontend/src/components/shared/ErrorBoundary.test.tsx`
- Test: `backend/prisma/seed.test.ts`

- [ ] **Step 1: Write the failing dead-end test**

Assert that empty, error, and not-found states always expose a next action instead of a blank panel.

- [ ] **Step 2: Normalize loading and error copy**

Use one consistent vocabulary for loading, no data, retry, and not-found states across the core journey pages.

- [ ] **Step 3: Add demo seed coverage**

Seed at least one student, one mentor, one booking, one assessment attempt, and one published blog post so the full story can be replayed.

- [ ] **Step 4: Add the missing QA scripts if needed**

Ensure frontend and backend can build, typecheck, and run the app reliably from package scripts.

- [ ] **Step 5: Verify the end-to-end story**

Run:

```bash
npm run -C backend typecheck
npm run -C frontend build
```

Expected: the app has no silent dead ends, and the demo path can be replayed with seeded data.

---

### Delivery order

1. Lock onboarding and profile gates.
2. Strengthen assessment → recommendation → booking bridge.
3. Finish booking lifecycle.
4. Build chat and follow-up loop.
5. Separate mentor operations from admin oversight.
6. Remove dead ends and prepare QA/demo readiness.

### Done definition

The upgrade is done when the app supports a continuous student journey from discovery to follow-up, mentor and admin roles have clear responsibilities, and every important page gives the user a visible next step.
