# 09 — Mentor portal and student journey UX (P1–P2)

## 1. Source map

Frontend:
- `frontend/src/pages/mentor/MentorPage.tsx` (portal), `MentorOverview.tsx`, `MentorBookingsPage.tsx`, `MentorAvailabilityPage.tsx`, `MentorProfileEdit.tsx`
- `frontend/src/components/layout/MentorSidebar.tsx`
- `frontend/src/pages/ProfilePage.tsx`, `StudentBookingsPage.tsx`, `MessagesPage.tsx`
- `frontend/src/components/mentor/BookingDialog.tsx`, `frontend/src/pages/MentorPage.tsx`, `MentorDetailPage.tsx`

Backend: mentor/booking/conversation/notifications routes+services; see `03-BOOKING-BUSINESS-FLOWS.md`.

## 2. Mentor portal findings

- Existing overview has profile completion checklist; useful, keep it.
- Booking manager supports pending/confirmed/completed/cancel; schedule manager lets mentor set weekly blocks and numerical booking settings.
- Availability UI labels `Buffer trước/sau` are developer language, not plain language. Numeric form complexity can surprise inexperienced mentors.
- Portal sidebar has `Tổng quan, Lịch tư vấn, Tin nhắn, Khung giờ, Hồ sơ, Xem trước`; meaningful baseline.
- `Avatar URL`, `slug`, `Fresher/Middle/Architect` labels might confuse novices.

## 3. Recommended mentor dashboard

Prioritize **today's work**:
1. `Cuộc hẹn sắp tới` (start time with timezone, learner initial info, meeting method).
2. `Yêu cầu cần xác nhận` with clear response deadline.
3. `Hồ sơ cần bổ sung` check list.
4. `Tin nhắn cần phản hồi` if supported and privacy-safe.
5. Stats/profile views after operational tasks.

If no bookings, explain how to set available times and preview public card instead of only `0 appointments`.

## 4. Booking settings UI redesign

Recommended language mapping:
- `Buffer trước` → `Thời gian chuẩn bị trước buổi tư vấn` (minutes).
- `Buffer sau` → `Thời gian nghỉ sau buổi tư vấn`.
- `Booking notice hour` → `Người học phải đặt trước ít nhất`.
- `Maximum advance days` → `Cho phép đặt trước tối đa`.
- `Auto confirm` → `Tự động xác nhận lịch hợp lệ` (only if backend actually supports).
- `CUSTOM_TIME` → `Đề xuất khung giờ khác`; `AVAILABILITY_SLOT` → `Chọn giờ mentor đang rảnh`.

Use sensible defaults, inline examples, summary below: `Học viên có thể đặt 30–90 phút, trước ít nhất 24 giờ, nghỉ 15 phút giữa các buổi` (numbers **computed** from current values, not fixed). Validate cross-field rules client+server.

Add optional visual weekly calendar overview; preserve form edit for exact times. For recurring exclusions (holidays, exam week) add `AvailabilityException` if clearly in scope.

## 5. Mentor profile editing

- Auto-generate slug from display name, optional `Chỉnh sửa đường dẫn` advanced field.
- Avatar upload/image crop instead of raw URL when upload backend supports authenticated secure image pipeline.
- Fields grouped: public identity, expertise, ways to help, service details, verification details.
- Public preview shows exactly what a student sees (rates, headline, expertise, verified badge), no hidden personal info.
- Dirty-state guard and save confirmation; clear errors beside fields, do not wipe inputs on API error.

## 6. Student dashboard redesign

Current profile contains personal info, assessment summaries/history and mentor suggestions. Redesign above fold into actionable `Hành trình khám phá`:

```text
[Tiếp tục nơi bạn dừng lại]
[Bạn đang tìm hiểu: các hướng IT quan tâm]
[Khám phá tiếp: mission / nghề / mentor — kèm lý do]
[Điều bạn đã học: test results và thử nghiệm đã hoàn thành]
[Hồ sơ cá nhân / quyền riêng tư / lịch tư vấn]
```

Critical: avoid mixing a RIASEC interest score with mission performance into a hidden 'talent level'. User can override interests and explore any path.

### Guest-to-account flow
- Guest gets first value (e.g. quick sample feedback or approved summary), then optional account to save persistent journey; if backend does not support guest preview safely, prioritize a limited static demonstration and explain.
- Persist quiz draft by instrument version and expiration; no raw PII in localStorage; assess threat model.
- Redirect back to intended action after auth; preserve valid state; don’t re-run quiz unnecessarily.

### Results UI
- Above fold: `Điều bạn quan tâm`, 2–3 exploration directions, why suggested, `Bạn có thể thử tiếp`.
- Chart: RIASEC scores labeled interest, not `100% fit` career probabilities.
- `Mức độ chắc chắn` only if supported by validated measurement; otherwise use `Cần thêm trải nghiệm`.
- Distinguish majors (university studies) from job roles (career tracks) and explain prerequisites as opportunities to learn.

## 7. Student booking journey

1. Discover verified mentor and expertise fit.
2. See upfront fee/disclosure, format (online/offline), booking eligibility, available times and timezone.
3. Select slot or propose custom time, read cancel policy, confirm.
4. Pending screen shows expiration + how to cancel/modify.
5. Confirmed screen shows meeting link/instructions and contact help (not disclosed to unrelated users).
6. Day-of reminder and support if cannot attend.
7. Post-session outcome, optional feedback, recommended next step.

For optional payment models see `03-BOOKING-BUSINESS-FLOWS.md`.

## 8. Acceptance

- [ ] Mentor completes onboarding (profile+availability) without needing to know technical terms.
- [ ] Dashboard highlights pending actions and the next appointment.
- [ ] Saving availability validates overlaps and preserves work on error.
- [ ] Student knows time zone, fee policy, meeting method and current status.
- [ ] Assessment results don't claim predetermined suitability; user receives next action.
- [ ] All forms keyboard accessible, mobile readable, safe against lost edits.
