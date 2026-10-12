# 10 — Mission engine & three career simulation games (P2)

## 1. Core idea

Make IT Compass a **career simulation platform** rather than a quiz-only website. Missions are educational, 4–8 minutes for first play, with real task analogies and **no prior coding requirement**. Players should discover what work feels like; mission scores must not be passed off as intrinsic aptitude.

## 2. MVP ordering

1. `UX Rescue` — fastest to build/test as visual reorder, highest accessibility for beginners.
2. `Server Crisis` — dramatic signature simulation, emphasizes incident reasoning rather than actual server commands.
3. `Cyber Detective` — useful digital safety literacy, evidence-based reasoning, balanced choices.

Later: Data Mystery, Train Your AI, Bug Hunter, Network Detective, Startup Architect, Robot Commander, etc. Do not implement 15 missions before testing first three.

## 3. Proposed file architecture

```
frontend/src/pages/explore/ExplorePage.tsx
frontend/src/pages/explore/MissionPage.tsx
frontend/src/pages/explore/ExplorationProfilePage.tsx
frontend/src/features/missions/engine/types.ts
frontend/src/features/missions/engine/reducer.ts
frontend/src/features/missions/scenarios/ux-rescue-v1.ts
frontend/src/features/missions/scenarios/server-crisis-v1.ts
frontend/src/features/missions/scenarios/cyber-detective-v1.ts
frontend/src/features/missions/components/MissionFrame.tsx
frontend/src/features/missions/components/MissionDebrief.tsx
frontend/src/features/missions/components/MissionProgress.tsx
frontend/src/lib/explorationApi.ts
backend/src/routes/mission.routes.ts
backend/src/controllers/mission.controller.ts
backend/src/services/mission.service.ts
backend/src/validators/mission.validator.ts
```

Routes `/explore`, `/explore/:slug`, `/explore/profile` (auth only for persisted profile). Add public link only when there is a working mission.

## 4. Scenario contract

```ts
type MissionDefinition = {
  id: string; version: string; title: string; estimatedMinutes: number;
  careerPaths: string[]; prerequisite: 'NONE' | 'INTRO';
  introduction: { context: string; goal: string; rules: string[] };
  steps: Array<{
    id: string;
    prompt: string;
    interaction: 'CHOICE' | 'REORDER' | 'CONNECT' | 'FILTER' | 'INSPECT';
    assets?: Record<string, string>;
    options: Array<{ id: string; label: string; consequences: string[] }>;
    validOutcomes: string[];
    hint?: string;
  }>;
  debrief: {
    learningOutcomes: string[];
    careerContext: string;
    nextMissionIds: string[];
  };
};
```

Agent should refine types but keep engine **content-driven, deterministic and versioned**; do not add per-game one-off architecture. Separate consequence/feedback logic from UI components.

## 5. UX Rescue: detailed MVP scenario

**Premise:** A canteen preorder app has customers abandoning checkout; learner acts as a UX designer.

Steps:
1. Read 2 short user complaints; highlight pain points (small confirm button, unclear costs, confusing navigation).
2. Inspect current 3-screen mockup; label what is hard to understand.
3. Drag/reorder 4 UI elements for a checkout card; keyboard alternative buttons `Move up/down` mandatory.
4. Choose a design fix (bigger CTA, clear cost summary, better labels) and see simulated usability feedback.
5. Debrief: distinguish aesthetics from usability; user research and iterative testing; do not equate click speed with UX ability.

Successful learning: can explain at least one user problem and a reason for redesign.

## 6. Server Crisis: signature scenario

**Premise:** Ticket booking site shows failed checkout after a voucher update. Learner is on incident team.

Steps:
1. Choose which dashboard to inspect (traffic vs error rate vs conversion).
2. Observe simulated error spike after new release; inspect short accessible log excerpts, glossary for unfamiliar terms.
3. Choose diagnosis, communicate impact and choose safe recovery (rollback/disable voucher feature vs random restart).
4. View resulting status and explain tradeoff. Reward structured investigation and safe communication, not 'heroic fast guessing'.
5. Debrief: backend, operations, reliability, collaboration, on-call tradeoffs and well-being; production incidents involve teams, not solo games.

Branching outcomes: safe containment + verification; partial mitigation; ineffective action → recovery opportunity; always constructive feedback.

## 7. Cyber Detective: scenario

**Premise:** School club receives suspicious scholarship email requesting credentials.

Steps:
1. Inspect sender/domain, link text vs target, urgency and attachments. Keep domain fictional/non-real.
2. Categorize evidence as weak/strong, decide what to verify before clicking.
3. Choose safe handling: official contact, report suspicious message, protect account.
4. Explain phishing signs without teaching offensive exploitation; allow retry.
5. Debrief: privacy, verification, Security Analyst responsibilities, ethics.

## 8. State/data model

- `MissionDefinition` version published/archived; content can initially live in typed TS files, server retains version IDs for result integrity.
- `MissionAttempt` with userId nullable, scenarioId, scenarioVersion, status STARTED/COMPLETED/ABANDONED, stepStates compact JSON, startedAt, completedAt.
- `MissionFeedback` optional interest, clarity, difficulty self-report; separate from raw step scoring.
- For anonymous play, keep non-sensitive progress locally with expiration and no pseudo-identity across devices; save to account only with user action.
- Server verifies scenario IDs/outcome schema and enforces auth for persisted profiles. Avoid letting client submit arbitrary 'fit score'.

## 9. Event schema

`mission_started`, `mission_step_completed`, `mission_hint_used`, `mission_completed`, `mission_abandoned` (if known), `mission_feedback_submitted`, `career_path_viewed_after_mission`. Include scenarioVersion, stepId, anonymous session consent-safe ID, duration bucket; avoid keystroke-level sensitive telemetry.

## 10. Accessibility + mobile

- Every drag-and-drop interaction has click/tap/keyboard alternative.
- 44px-ish minimum targets as practical goal, visible focus, skip motion, colorblind-safe evidence markers.
- No countdown pressure by default; text glossary, captioned sounds and mute toggle.
- Persist current step locally; show pause/resume, easy restart and explanation of choices.

## 11. Debrief design

Not `Bạn thuộc ngành UX 98%`. Instead:
- `Bạn vừa thử`: work type/tasks.
- `Bạn đã quan sát`: choices/evidence from attempt.
- `Bạn cảm thấy thế nào?`: interest (self-reported) and difficulty.
- `Trong nghề thật`: what practitioners do beyond a simplified mission.
- `Thử tiếp`: another mission, relevant major, beginner guide or mentor.

## 12. Acceptance

- [ ] Three games playable start→finish in guest mode, mobile + desktop, keyboard alternative.
- [ ] Engine versioned; changes to current scenario do not corrupt old attempts.
- [ ] Consequences deterministic and educational; choices receive reasoned feedback.
- [ ] No unearned 'career suitability' percentages or pressure streaks.
- [ ] User can play any available scenario, view debrief and optionally save results.
- [ ] Frontend engine test, one E2E each scenario, resume+error cases and performance audit.
- [ ] Mission content reviewed by subject-matter expert to avoid misleading workplace stereotypes.
