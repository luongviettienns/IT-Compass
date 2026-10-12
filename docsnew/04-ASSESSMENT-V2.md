# 04 — Assessment V2: better questions, explainable scoring, validation (P1)

## 1. Current state

Files: `backend/src/services/assessment.questions.ts`, `assessment.constants.ts`, `assessment.scoring.ts`, `assessment.catalog.ts`, `assessment.service.ts`, `assessment.results.ts`, `backend/src/types/assessment.ts`, `frontend/src/pages/assessment/{TestPage,QuizPage,ResultPage}.tsx`.

Observed: 24 Holland questions (4 per RIASEC) + 5 IT situations = **29 total**; current public marketing references 30 in places. Some questions presuppose technical experience (setup server, new programming language, debugging); these disadvantage newcomers. Situational options sometimes combine multiple behaviors or imply one socially undesirable choice. Scoring uses hand-crafted Holland career affinity weights, special action bonuses, and `matchPercent = 55 + 45 × score / bestScore`; the best item therefore always shows 100%, **not a calibrated probability**.

## 2. Objective & target users

- Measure **expressed interest in concrete activities**, not existing programming knowledge or perceived competence.
- Keep RIASEC interest measure conceptually separate from scenario preferences, actual game behavior, academic preferences, external constraints and mentor advice.
- Do not present result as diagnosis, academic admission advice or certainty about career fit.
- UI: plain Vietnamese, examples accessible to grade-12 students/first-year students, accessible Likert options, no answer 'correct'.

## 3. Instrument architecture

### Core survey
- **Proposed 30 items**: 5 activity statements per R/I/A/S/E/C, response scale 1–5 from `Rất không thích` to `Rất thích` with accessible neutral choice; review against validated instruments rather than assuming equivalence.
- Separate **4–6 workplace scenarios** for first-stage discovery, not summed into RIASEC unless there is validated weighting evidence. Option `Chưa rõ / muốn thử` allowed without penalty.
- Separate **2–3 optional context items**: prior exposure, current goal, confidence of familiarity. Do not sum context into interest score.
- Goal <8–10 minutes for full experience is a design hypothesis; measure pilot times and adjust. Quick discovery mode may use smaller set but must visibly be 'sơ bộ'.

### Sample item bank (draft, not yet validated)

| Group | Draft activity statement |
|---|---|
| R | Tôi muốn thử lắp các bộ phận để xem một thiết bị hoạt động ra sao. |
| R | Tôi thích làm thử từng bước để biết vì sao một món đồ không hoạt động. |
| R | Tôi muốn tự điều chỉnh các bộ phận trong một mô hình để mô hình chạy được. |
| R | Khi thấy một máy bị trục trặc, tôi muốn quan sát và kiểm tra trực tiếp. |
| R | Tôi thích những công việc nhìn thấy được kết quả sau khi thao tác. |
| I | Khi một ứng dụng bị chậm, tôi muốn tìm hiểu nguyên nhân. |
| I | Tôi thích so sánh những cách giải khác nhau để xem cách nào hợp lý. |
| I | Tôi muốn tìm quy luật ẩn trong các con số hoặc hiện tượng. |
| I | Tôi thích thử một giả thuyết để biết nó đúng hay sai. |
| I | Tôi muốn tìm hiểu vì sao một công cụ hoạt động như vậy. |
| A | Tôi thích nghĩ ra cách trình bày thông tin khiến người khác dễ hiểu hơn. |
| A | Tôi muốn thử thiết kế lại một màn hình ứng dụng cho thuận tiện. |
| A | Tôi thích tạo hình ảnh, câu chuyện hoặc bố cục mới cho một ý tưởng. |
| A | Tôi có hứng thú chọn cách phối màu, biểu tượng và hình minh họa. |
| A | Tôi muốn thử nhiều cách thể hiện khác nhau cho cùng một nội dung. |
| S | Tôi thích hướng dẫn bạn bè dùng một công cụ mà họ chưa quen. |
| S | Tôi có hứng thú lắng nghe người khác mô tả một khó khăn họ gặp phải. |
| S | Tôi thích cùng người khác trao đổi để giải quyết một vấn đề. |
| S | Tôi muốn thiết kế hướng dẫn để người mới làm quen nhanh hơn. |
| S | Tôi thích hỏi người dùng cảm thấy thế nào khi dùng một sản phẩm. |
| E | Tôi có hứng thú lên kế hoạch cho nhóm thực hiện một ý tưởng. |
| E | Tôi thích trình bày để thuyết phục mọi người thử một giải pháp. |
| E | Tôi muốn chọn việc ưu tiên khi nguồn lực có hạn. |
| E | Tôi thích tổ chức hoạt động để nhiều người cùng đạt mục tiêu. |
| E | Tôi muốn tìm hiểu xem một ý tưởng có hữu ích cho khách hàng không. |
| C | Tôi thích kiểm tra thông tin để phát hiện phần thiếu hoặc sai. |
| C | Tôi có hứng thú sắp xếp dữ liệu rõ ràng để dễ tra cứu. |
| C | Tôi thích làm theo quy trình có các bước và tiêu chí kiểm tra cụ thể. |
| C | Tôi muốn so sánh danh sách yêu cầu với kết quả để xem đã đủ chưa. |
| C | Tôi thích ghi lại thay đổi để người khác dễ theo dõi. |

**Các câu này là dự thảo thiết kế**, không phải thang đo Holland đã kiểm định. Cần chuyên gia đánh giá nội dung, pilot, phân tích thống kê, sửa câu trùng ý/câu dễ gây thiên lệch.

## 4. Question-writing rubric

Mỗi item phải:
- Dùng một hoạt động cụ thể, chỉ một ý; không dùng thuật ngữ `runbook`, `deploy`, `IDE`, `ML`, `server config` trừ khi giải thích.
- Không mặc định người làm có năng lực kỹ thuật hoặc điều kiện kinh tế để đã trải nghiệm.
- Không có ngôn từ tự tâng bốc (`tôi xuất sắc`) hoặc hạ thấp lựa chọn (`tôi chẳng thích...`).
- Phân biệt rõ `thích` với `giỏi`, `đã từng` và `muốn học`.
- Có mức trung lập/không biết; cho phép lưu tạm/quay lại; không suy luận thấp năng lực từ 'chưa biết'.
- Đa dạng bối cảnh, tránh quy tất cả nhóm nghề vào một công việc duy nhất.

Review item theo checklist clarity, age-fit, social desirability, group coverage, cognitive load; dùng independent reviewers + pilot feedback.

## 5. Scoring proposal

### Phase A (production baseline)
- RIASEC group score = **mean của 5 câu tương ứng** hoặc sum có chuẩn hóa, cùng thang 1–5.
- Report top group, group profile và meaningful ties, không ép chọn đúng 1 ngành.
- Trình bày `Mức độ bạn thích các hoạt động` và bar chart với đơn vị, **không phải 'độ hợp ngành 100%'**.
- Scenarios = preferences riêng, có giải thích: `Bạn chọn thử ...`; không trộn ngầm vào score RIASEC.
- Career recommendations = editorial mapping có phiên bản, giải thích dấu hiệu và góc cần khám phá thêm; top 2–3 chứ không đóng khung tương lai.
- Không dùng `confidence: high` nếu không có mô hình hiệu chuẩn. Có thể nói `Chưa đủ bằng chứng` khi item missing / tie.

### Phase B (after validation)
- Nếu đạt psychometric checks, xem xét item response/adaptive selection, norm comparisons, CI/uncertainty nhưng không mặc định.
- Cần các chuyên gia tư vấn định hướng, thống kê đo lường và thử nghiệm trên học sinh Việt Nam; không dựa duy nhất vào accuracy ML.

## 6. Implementation architecture

Proposed additive versioning:
```
AssessmentInstrument { id, version, status, schemaJson, publishedAt }
AssessmentAttempt { instrumentVersion, rawAnswers, scores, algorithmVersion, ... }
AssessmentResult { ranking, explanation, evidence, uncertainty, recommendations, ... }
```

Schema may already have `quizVersion`; reuse it. Avoid normalizing individual items into many DB tables unless needed. Historical V1 attempts should remain readable with V1 scoring (`IT_COMPASS_V1`, version `2026.04`). V2 never re-scores V1 silently. Server validates question ID, answer bounds, option membership; frontend draft storage keyed by version; preserve content when auth redirect.

File-level tasks:
1. `assessment.questions.ts`: add V2 catalog module (prefer new file rather than rewriting V1).
2. `assessment.catalog.ts`: selector version and publish status; backend returns explicit version.
3. `assessment.scoring.ts`: keep V1 function for old attempts, create `assessment.v2.scoring.ts` pure function, deterministic tests.
4. `assessment.service.ts`: dispatch by version, persist algorithm version and results, ensure double submit safe.
5. `QuizPage.tsx`: progress, short definitions, state restoration, versioned draft, accessibility labels, no forced account before basic result if approved.
6. `ResultPage.tsx`: plain language, relative group chart, why recommended, next activity, data limitations, privacy.
7. `frontend/src/pages/LandingPage.tsx`: sync actual question count/estimate with deployed version.

## 7. Pilot & validation plan

- Cognitive interviews with target users for unclear words and interpretation.
- Pilot to inspect missingness, straight-lining, median response time, internal consistency and group item behavior (e.g. omega/alpha with caution), item correlations, test-retest on willing participants.
- Check differential functioning / measurement invariance across relevant groups when enough data; **no guarantee until measured**.
- Document mapping expertise review by IT educators/career counselors, avoid treating 'specialist job' as equivalent to university major.
- Separate intended constructs: interest, knowledge, skill, confidence, exposure.

## 8. Acceptance criteria

- [ ] Two personas can answer every question without needing prior programming knowledge during pilot.
- [ ] No questions claim user already mastered skill; no loaded alternatives.
- [ ] 30 V2 core items mapped 5 each RIASEC, plus independently scored scenarios; schema validated.
- [ ] V1 histories still readable and unchanged, V2 cannot be submitted as V1.
- [ ] No 100% career probability claim or unsupported confidence labels.
- [ ] Each result explains evidence, limitations and actionable next step.
- [ ] Unit tests: scoring ties, missing answer, version mismatch, repeats, unknown options, deterministic output.
