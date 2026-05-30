---
name: student-quiz-deep-ui-test-design
description: Design spec for deep student quiz UI testing with Playwright and Chrome DevTools, using a newly created student account and backend consistency checks.
metadata:
  type: project
---

# Student Quiz Deep UI Test Design

## Context

The repository already has a student assessment flow:

- `/test` → quiz landing
- `/test/quiz` → quiz taking flow
- `/test/result` → submitted result view
- backend assessment endpoints provide template loading, submission, latest attempt, and history

The current gap is not missing business logic alone — it is lack of deep end-to-end verification across the real UI, real backend, and browser behavior. This work adds a test-first validation path that uses both Playwright and Chrome DevTools MCP so we can catch frontend, backend, and browser regressions together.

## Goal

Validate the student quiz flow end to end with a newly created student account, using real browser interaction and network inspection, and fix any defects found so the UI and backend stay consistent.

## Scope

In scope:

- create a fresh student account for test runs
- log in as that student
- navigate the quiz flow in the UI
- answer quiz questions and submit
- verify the result screen matches backend state
- inspect browser console/network behavior for hidden failures
- fix discovered UI/backend mismatches
- re-test the full flow after fixes

Out of scope:

- redesigning unrelated pages
- mocking the quiz flow away from real backend requests
- adding generic test coverage unrelated to the student quiz journey

## Test strategy

Use **Playwright** for interactive UI actions and assertions, and **Chrome DevTools MCP** for deeper inspection:

- Playwright: page navigation, form input, clicks, wait conditions, screenshot checkpoints
- Chrome DevTools: console errors, network request/response inspection, Lighthouse/a11y snapshots where useful

This combination gives both user-level fidelity and debugging depth.

## Assumptions

- A student account can be created through the existing auth/signup flow or a backend-supported creation path.
- The quiz flow is available in the current data set without additional manual admin setup.
- The app can be run locally in both frontend and backend processes during testing.

## Validation flow

1. Create a fresh student account.
2. Sign in as that student.
3. Open the quiz landing page.
4. Enter the quiz flow.
5. Answer the full questionnaire.
6. Submit the attempt.
7. Verify the result page loads and reflects the submitted data.
8. Use Chrome DevTools to confirm no console errors and that the submit/result network responses match the UI state.
9. Re-run the flow after any fix until the happy path is stable.

## Success criteria

The work is successful when:

- a brand-new student can complete the quiz without manual intervention
- result data matches the backend response
- browser console stays clean during the happy path
- request/response data agrees with what the UI renders
- any defects found during testing are fixed and re-verified

## Risk areas to watch

- auth/session setup breaking the new student flow
- draft/resume logic causing stale quiz state
- submit payload differing from backend expectations
- result page falling back incorrectly when the latest attempt is missing
- hidden client-side errors not visible without browser console inspection

## Deliverables

- a documented implementation plan for the test workflow
- the executed browser test flow
- any code fixes needed to make the flow pass
- verification evidence after fixes
