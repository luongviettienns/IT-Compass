# 05 — ML recommendation: honest data strategy and hybrid AI (P3)

## 1. Decision

**Do not train career-label predictor now.** The current assessment result is calculated from handcrafted heuristic weights and normalized ranking; training ML on those outputs only reproduces old decisions and does NOT validate career fit.

**Best practical use of ML:** recommend the **next learning/exploration activity** (mission, beginner guide, mentor expertise) using feedback gathered with appropriate consent. Keep the validated/transparent Holland interest scoring separate. Start rule-based with explicit reasons.

## 2. Three layers of recommendation

1. **Interest signal:** self-report RIASEC V2, with version, uncertainty and no ability label.
2. **Exploration signal:** user voluntarily tried `missionType`, `stepsCompleted`, chose choices, requested hints, post-activity rating `interest` / `understanding` (do not classify capability from speed).
3. **Context signal:** self-reported familiarity, goals and preferred topics. Do not infer health, gender or other sensitive traits.

Output example:
```json
{
  "recommendations": [
    {
      "type": "MISSION",
      "id": "ux-rescue-intro",
      "reasonCodes": ["EXPRESSED_DESIGN_INTEREST", "NOT_TRIED_YET"],
      "displayReason": "Bạn có hứng thú với hoạt động sắp xếp giao diện. Thử một nhiệm vụ nhỏ để hiểu hơn về công việc này.",
      "isCareerDiagnosis": false
    }
  ],
  "method": "rules-v1",
  "modelVersion": null
}
```

No fake fit probabilities.

## 3. Data model and consent

Suggested minimal tables / fields (adapt Prisma conventions):
- `MissionAttempt`: id, userId nullable (guest anonymous ID rotated), scenarioVersion, status, startedAt, finishedAt.
- `MissionEvent`: eventType, stepId, normalized choice enum, timestamp; optional aggregate instead of raw clickstream.
- `ExplorationFeedback`: userId/attemptId, interest 1–5, clarity 1–5, usefulness 1–5, submittedAt, consentVersion.
- `RecommendationExposure`: recommended items and versions shown, subsequently clicked/completed; limited retention.
- `RecommendationModelRegistry`: modelId, training dataset version, features version, build date, evaluation metrics, status.

Privacy:
- Separate identity from experimentation; aggregate where feasible, collect the least necessary, honor withdrawal/deletion.
- No raw student questionnaire answers in third-party analytics.
- Consent for research / ML is explicitly separate from essential operation and has policy appropriate for minors.

## 4. Baselines before ML

Rule-based candidates:
1. Show intro missions for high-interest clusters but include underexplored alternatives.
2. Avoid recommending only the same field: use exploration diversity.
3. Prefer next mission that is age-appropriate, beginner-friendly and not already done.
4. Return deterministic explanation codes from stored evidence.
5. User can manually browse all paths; recommendation cannot block access.

Measure click-to-completion, post-activity self-reported interest, clarity change, diversity across careers, satisfaction, non-coercion. Metrics are not 'accuracy of career suitability'.

## 5. ML training phases

### Offline research
- Define a **valid label** e.g. user-rated interest after trying an activity, not heuristic outcome.
- Use observed feedback rather than raw time to avoid rewarding slow clicking.
- Train/validation/test split by **user**, and by time for temporal generalization; never split attempts from same user across train/test.
- Compare logistic regression, gradient boosted trees, pairwise ranking, content-based recommendation with rules. Keep simple model if it performs as well as complex.
- Handle cold start, sparse labels, class imbalance, limited data and fairness.
- Report n users, n unique labels, uncertainty intervals, calibration if output probabilities, subgroup failures and failure cases.

### Shadow mode
- Generate recommendations in background for evaluation **without changing UX**.
- Compare against deterministic baseline, include reason codes, monitor latency, errors, distribution shifts.

### Controlled experiment
- Small opt-in feature flag; randomization by user/consented cohort, comparable landing and copy; guardrails for negative user reactions.
- Automatic rollback to rules when service fails, model stale, consent unavailable, or low sample.

## 6. Architecture decision

- Current Express API owns orchestration/auth/DB access.
- Python notebooks / scripts in `ml/` for reproducible training; scikit-learn for starting baseline.
- Persist only versioned model artifacts and non-sensitive metadata in secure storage.
- For first production experiment, in-process inference or a small separate internal Python service **only if deployment complexity is justified**. No LLM training needed.
- LLM may write plain-language explanations from **approved structured facts** and audited prompt template; it must not invent scores, job guarantees or recommendations unsupported by evidence. Fall back to static templates.

## 7. API idea

`GET /api/exploration/recommendations` returns `method`, `version`, `reasons[]`, `items[]`, `generatedAt`, optional `confidenceDescription` (non-numeric, only after calibration), `experimentArm` server-side.

`POST /api/exploration/feedback` validates answer and consent; separate from assessment scoring. Deduplicate retry; rate limit.

## 8. Acceptance and stop conditions

- [ ] Baseline heuristic has versioned reasoning and no unsupported `xx% career fit`.
- [ ] Data provenance, consent, retention and deletion documented.
- [ ] Offline ML beats baseline on **predefined user-centered metrics** with robust holdout; otherwise do not ship.
- [ ] Model has fairness and subgroup failure review, especially new/novice users.
- [ ] Cold start and service outage work without ML (fallback rules).
- [ ] User can understand 'why am I seeing this' and choose any career path.
- [ ] Product owner approves experiment and privacy/legal review before launch.
