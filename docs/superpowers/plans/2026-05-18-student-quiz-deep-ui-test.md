# Student Quiz Deep UI Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate the student quiz flow end to end with a freshly created student account, real browser interaction, and backend consistency checks, then fix any defects the flow reveals.

**Architecture:** Use Playwright for the user journey and Chrome DevTools MCP for deep inspection. The test path stays close to the real app: create a student, log in, complete `/test/quiz`, submit, and verify `/test/result` plus the backend response. Any mismatch uncovered during the run gets fixed in the app code first, then re-verified by replaying the same flow.

**Tech Stack:** React + Vite frontend, Express backend, Playwright MCP, Chrome DevTools MCP, existing auth/assessment API, TypeScript.

---

### Task 1: Find the student creation path

**Files:**
- Modify: `frontend/src/lib/authApi.ts:294-355`
- Modify: `backend/src/routes/auth.routes.ts` or the existing auth controller/service files that already own register/login
- Test: no new test file yet; use manual API verification during implementation

- [ ] **Step 1: Inspect the auth/register contract**

Confirm whether the existing register endpoint already creates a usable `STUDENT` account and returns a valid session for quiz access.

- [ ] **Step 2: Add the minimal support needed for a fresh student**

If the existing register flow defaults to a non-student role or blocks quiz access, change it so the test can create a `STUDENT` account with:

```ts
{
  fullName: 'Quiz Student',
  email: 'quiz-student+<unique>@example.com',
  password: 'QuizStudent123!'
}
```

- [ ] **Step 3: Verify the account can reach authenticated quiz pages**

Run the backend and confirm the created user can load `/api/auth/me` and `/api/assessments/templates/current` with a real session.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/authApi.ts backend/src/routes/auth.routes.ts backend/src/controllers backend/src/services
git commit -m "test: enable fresh student quiz setup"
```

### Task 2: Add a repeatable quiz smoke helper

**Files:**
- Create: `frontend/src/lib/quizTestHarness.ts`
- Modify: `frontend/src/pages/assessment/QuizPage.tsx:91-546`
- Modify: `frontend/src/pages/assessment/ResultPage.tsx`
- Test: `frontend/src/lib/quizTestHarness.ts`

- [ ] **Step 1: Write a small helper for deterministic quiz setup**

Create a helper that can generate a unique student email and persist the account/session metadata needed for the test run.

```ts
export const createQuizTestStudentEmail = () => `quiz-student+${Date.now()}@example.com`;
```

- [ ] **Step 2: Add a manual-reset hook for stuck quiz state**

Expose a tiny helper that clears any stale draft/pending result state before a fresh run, so the test can start from a clean slate.

```ts
export const resetQuizTestState = () => {
  clearQuizDraft();
  clearPendingQuizResult();
};
```

- [ ] **Step 3: Keep the quiz/result pages aligned with the same state contract**

If the result page needs a small guard or fallback to reflect the submitted attempt more reliably, wire it to the same `assessmentApi.getLatestAttempt()` shape already used by `QuizPage`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/quizTestHarness.ts frontend/src/pages/assessment/QuizPage.tsx frontend/src/pages/assessment/ResultPage.tsx
git commit -m "test: add quiz smoke harness"
```

### Task 3: Write the deep UI flow test

**Files:**
- Create: `tests/e2e/student-quiz.spec.ts`
- Modify: `package.json` or the frontend/backend test scripts if needed to run the E2E file cleanly

- [ ] **Step 1: Write the failing happy-path test**

The test should:
1. create a fresh student,
2. log in,
3. open `/test/quiz`,
4. answer every question,
5. submit,
6. assert the result page shows the submitted result,
7. assert no console errors occurred.

- [ ] **Step 2: Add backend consistency checks**

Inspect the submit response and latest-attempt response to ensure they match the visible result page state.

- [ ] **Step 3: Add one recovery-path check**

Reload the quiz page mid-flow and verify draft restoration does not corrupt the answer set.

- [ ] **Step 4: Run the test and confirm it fails for the right reason**

Run the new E2E test against the local app and capture the first real mismatch.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/student-quiz.spec.ts package.json
git commit -m "test: cover student quiz end to end"
```

### Task 4: Run browser-level verification with Playwright + Chrome DevTools

**Files:**
- No code changes expected unless a defect is found
- Test: the running app in the browser and the new E2E spec

- [ ] **Step 1: Start frontend and backend locally**

Run the app with the real backend and frontend processes, then open the quiz flow in Playwright.

- [ ] **Step 2: Inspect network and console in Chrome DevTools**

Check the submit request, the latest-attempt response, and the browser console for warnings/errors.

- [ ] **Step 3: Verify the full student flow**

Confirm the following in the real UI:
- fresh account creation works
- quiz page loads
- answer selection works
- next/back navigation works
- submit succeeds
- result page reflects backend data

- [ ] **Step 4: Capture any defect as a code task**

If the flow breaks, isolate the failing layer and fix it before re-running the same sequence.

### Task 5: Fix any issues uncovered by the test run

**Files:**
- Modify the specific frontend/backend file implicated by the failing browser or API step
- Test: rerun the same Playwright + DevTools flow

- [ ] **Step 1: Patch the root cause only**

If the failure is UI state, fix the page/component. If it is API shape or auth/session, fix the backend contract. Avoid broad refactors.

- [ ] **Step 2: Re-run the exact failing step**

Use the same student account and the same browser path until the failure disappears.

- [ ] **Step 3: Re-run the full happy path**

Complete signup/login → quiz → submit → result → backend verification again.

- [ ] **Step 4: Commit**

```bash
git add <fixed files>
git commit -m "fix: keep student quiz flow consistent"
```

### Task 6: Final verification pass

**Files:**
- No code changes expected
- Test: full Playwright run + Chrome DevTools inspection

- [ ] **Step 1: Run the full student quiz flow one last time**

Create a fresh student, complete the quiz, submit, and confirm the result page plus backend state are aligned.

- [ ] **Step 2: Check for silent failures**

Verify:
- no console errors
- no failed network calls in the happy path
- no stale draft corruption after reload
- no mismatch between submitted answers and result output

- [ ] **Step 3: Mark the work done only if all checks pass**

Do not claim completion until the browser flow and backend verification both succeed.
