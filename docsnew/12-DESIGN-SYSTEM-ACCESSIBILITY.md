# 12 — Shared design system, accessibility and UX writing (P1)

## 1. Keep what's working

Current stack includes Tailwind, Lucide icons, Motion, custom UI components, skeletons, toasts and responsive shells. **Do not replace** everything with a new UI kit. Centralize the tokens and missing accessibility behavior so all public/admin/mentor routes share predictable interactions.

## 2. Component contract

Create/refine shared components (`frontend/src/components/ui/*`):

| Component | Required behavior |
|---|---|
| Button | states default/hover/focus/disabled/loading; aria-label if icon only; no layout shift |
| Input/Select/Textarea | `id`, associated label, help text, inline error, `aria-invalid`, `aria-describedby`, input mode |
| Dialog | focus trap, Escape, restore focus, overlay click policy, dirty-state safeguard, pending status |
| Alert/Toast | aria-live appropriate, not sole carrier of critical errors |
| Table | caption, header `scope`, sort semantics, row actions labeled, responsive behavior |
| StatusBadge | color+text+icon; status map reuse, never color alone |
| EmptyState | cause, next action, no blame; differentiated from API failure |
| Skeleton | stable dimensions, doesn't hide failure forever |
| Stepper/Progress | current step, total, accessible textual progress |
| Tabs | selected state, keyboard navigation, valid semantics |
| Chart | summary and screen-reader-friendly table alternative |

## 3. Visual hierarchy

- Public: one dominant primary CTA per context, secondary actions visibly lower priority.
- Admin: action queues and table rows optimized for scanning; compact but readable. Avoid frequent `text-[10px]` for critical labels; aim ~14px body/minor labels where possible.
- Mentor: predictable primary action, large time/date, clear request state.
- Spacing scale tokens (e.g. 4/8/12/16/24/32), radius 8/12/16/24; use existing palette, don't proliferate arbitrary gradients.
- Color tokens for primary, surface, success, caution, error; at least contrast compliant in tested themes; don't use badges for every heading.

## 4. Motion standards

- `prefers-reduced-motion`: disable parallax, float/orb and nonessential transforms; preserve essential state changes without motion.
- Motion duration designed around action; no animated dashboard counters on every filter change.
- For admin loading: low motion, focus stable; no hover scale on destructive action that distracts.
- CLS: images and chart containers reserve sizes; avoid delayed decorative elements changing layout.

## 5. Mobile first

- Test 320, 375, 430, 768, 1024 and desktop layouts; avoid fixed-width modals causing horizontal overflow.
- Data tables: optional compact rows/cards for core actions, or accessible horizontal scroll with visual cue.
- Bottom navigation safe area padding, correct active state for nested route.
- Tap targets target approximately 44×44 CSS pixels when feasible; avoid icon-only 16px tappable area.
- Keyboard + touch alternatives for drag/drop games.

## 6. Language glossary

| Avoid | Prefer |
|---|---|
| Assessment | Bài định hướng / Lượt làm bài |
| Booking | Lịch tư vấn / Yêu cầu đặt lịch |
| No-show | Không tham dự (sau xác minh) |
| Buffer trước/sau | Thời gian chuẩn bị / nghỉ giữa các buổi |
| Actor User ID | Người thực hiện (ID trong chi tiết) |
| Target ID | Đối tượng liên quan |
| Article preview | Xem trước bài viết |
| Export | Xuất dữ liệu |
| Active / Paused | Hoạt động / Tạm dừng |
| Career fit 100% | Hướng nghề đáng khám phá / mức quan tâm |

All destructive descriptions must match backend semantics (e.g. soft vs permanent delete). Never use role status incorrectly.

## 7. Accessibility audit checklist

- [ ] Page landmarks (`header`, `nav`, `main`, `footer`); one H1 per route.
- [ ] Color contrast audited, including muted text and gradients.
- [ ] Every interactive icon button has accessible name.
- [ ] Inputs tied to labels; errors tied via `aria-describedby`.
- [ ] Dialog focus trap + restore focus, keyboard Esc, appropriately labeled title.
- [ ] Keyboard skip link, visible focus order; zero keyboard traps except intended dialog focus trap.
- [ ] Chart has text summary/data equivalent; no information by color alone.
- [ ] Meaningful imagery alt text, decorative images `aria-hidden`, uploaded article image alt text.
- [ ] Respect reduced motion; no forced time limits in mission/test.
- [ ] No invisible controls pretending to work; no disabled feature advertised as launched.

## 8. QA tooling (recommendation)

- axe-core automated tests (Playwright/React test suite), supplemented by manual keyboard and screen-reader checks.
- Lighthouse performance/accessibility in staging; report actual measured environment and dates.
- Snapshots/screenshot regression on critical routes, test with seeded dummy data.

## 9. Definition of done

All new/changed components meet this specification, old screens migrate incrementally, no global visual regression or broken navigation.
