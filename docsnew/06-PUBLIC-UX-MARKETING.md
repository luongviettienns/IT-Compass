# 06 — Public UX, marketing conversion, messaging and IA (P1–P2)

## 1. Primary objectives

- First-time visitors should understand **who this is for**, **what they can do now**, **why to trust it**, and **what happens next**.
- Ensure landing hero benefits are specific, honest and match working capabilities.
- Reduce friction around first activity and assessment results; measure funnel.
- Preserve existing brand palette/components and useful animations instead of entire redesign.

## 2. Source & observed issues

- `frontend/src/pages/LandingPage.tsx`: long 7-section landing, hero `Tìm ra con đường CNTT phù hợp với bạn` and main CTA `/test`.
- Landing fixed claims: `#1`, `20+ mentor`, `50+ bài viết`, `30 câu`, `15 phút`, `hàng trăm bạn trẻ`. Current reviewed backend quiz has 29 items, template `estimatedMinutes: 3`. None of the fixed social proofs were independently verified. Update claims to real evidence or remove.
- `frontend/src/components/layout/Header.tsx`, `BottomNav.tsx` prioritize Test, Blog, Mentor, Majors; not task-based discovery journey.
- `frontend/src/pages/assessment/QuizPage.tsx` saves draft and redirects unauthenticated user to sign in before official result; opportunity to reduce first-value friction.
- Existing page uses Motion/parallax, lazy images/content, various hover/fade effects; visual performance/accessibility need real-device tests.

## 3. Recommended information architecture

**Before mission launch:**
```
Trang chủ
  ├── Khám phá ngành IT (/majors)
  ├── Định hướng sở thích (/test)
  ├── Mentor (/mentors)
  ├── Kiến thức (/blog)
  └── Cá nhân (/profile)
```
**After MVP mission launch:**
```
Trang chủ
  ├── Trải nghiệm nghề (/explore)       ← primary
  ├── Khám phá ngành (/majors)
  ├── Bài định hướng (/test)
  ├── Mentor (/mentors)
  └── Hành trình của tôi (/explore/profile)
```
Blog in discovery navigation/footer; retain direct links/SEO. Mobile bottom nav limit to ~4–5 core destinations; test labels with students. Do not ship dead navigation.

## 4. Homepage composition

### Section 1 — Hero: problem → outcome → CTA
- Eyebrow: `Khám phá thế giới CNTT dành cho người mới` (avoid unproven #1).
- H1 now (pre-game): `Chưa biết chọn hướng nào trong CNTT? Bắt đầu từ điều bạn thích.`
- Supporting: `Khám phá công việc, tìm hiểu thiên hướng và nhận gợi ý cho bước tiếp theo. Không cần biết lập trình.`
- Primary CTA now: `Khám phá bản thân` → `/test`, secondary: `Xem các ngành IT` → `/majors`.
- After real playable MVP: primary `Thử một công việc IT` → `/explore`; secondary `Làm bài định hướng` → `/test`.
- Right-side visual: real app screenshot/interactive preview, not a product mockup pretending unavailable features.

### Section 2 — Instant value
- A lightweight 1-step preference scenario or **sample** mission; results are navigation only, not psychological diagnosis.
- Feedback appears within seconds; never force login before first value.

### Section 3 — Trust
- Explain interest measurement is indicative, not deterministic; link method/how it works.
- Show only audited/real numbers: published article count, verified mentor count, real user testimonials with consent; hide blocks without real data.
- Provide privacy and data use links.

### Section 4 — Explore paths
- Each card includes: `Người làm nghề thường làm gì`, `Một việc thử được`, `Kiến thức nhập môn`, `Sự khác nhau giữa chuyên ngành và vai trò nghề`.
- Display friendly local labels; do not assert that DevOps or UI/UX always correspond to an independent university major.

### Section 5 — Next steps
- Concrete journey: `Thử → Ghi nhận sở thích → So sánh → Tìm hiểu → (tùy chọn) Hỏi mentor`.
- Avoid pretending test alone can dictate career selection.

### Section 6 — Educational resources & mentors
- Mentor cards clarify expertise, who they can help, booking method, verified status, fee/disclosure and availability.
- Blog cards use specific questions students search, topic clusters, article date and related job paths.

### Section 7 — Final CTA
- Repeat one primary action; for logged-in users, use continuation/resume CTA instead of start-again.

## 5. Marketing truth table

| Baseline copy | Decision | Proposed alternative |
|---|---|---|
| `Nền tảng #1` | Remove until independently proved | `Nền tảng khám phá hướng đi CNTT` |
| `30 câu`, `15 phút` | Dynamic from active instrument | `Khoảng X câu / Y phút` from backend or no number |
| `20+ mentor`, `50+ bài viết` | Backed by actual public counts only | `Khám phá mentor` / `Đọc hướng dẫn` |
| `Hàng trăm bạn trẻ...` | Remove absent consent/measurement | Explain what user receives, not popularity |
| `Tiêu chuẩn vàng`, `chính xác`, `100% phù hợp` | Avoid unsupported psychometric claims | `Gợi ý tham khảo từ hoạt động và sở thích` |

## 6. Form/first-value conversion

- Guest can start quiz; add **preview summary** after completion where backend policy supports, then invite sign-up for sync and mentor; do not store unsecured PII in guest browser.
- Keep existing `quizDraft` restore; update storage per quizVersion.
- After login, resume original action, don't send user back home.
- Auth modal/page should show value to be saved, not guilt or artificial urgency.
- Confirm first meaningful event analytics with consent rules.

## 7. Interaction & visual design

- Preserve basic palette and typography from current Tailwind tokens; create reusable layouts in `12-DESIGN-SYSTEM-ACCESSIBILITY.md`.
- Use motion to guide attention: hero intro once, section reveal modestly, progress feedback; avoid repeating heavy 3D/parallax on mobile.
- Implement `prefers-reduced-motion` and static fallback, tab/focus visible, accessible contrast.
- Load image/media only when needed, avoid CLS and long JS tasks; evaluate LCP/INP/CLS with Lighthouse & RUM (don't invent scores).
- Add error/empty skeleton flows for mentor/blog cards if backend unavailable.

## 8. SEO/content

- Unique title/meta description per public route, canonical URLs, Open Graph, rich previews for articles if accurate.
- If CSR indexing is weak, evaluate prerender/SSR **only after verifying search visibility**; do not rewrite Vite architecture based on assumption.
- Content strategy: `Ngành X học gì?`, `Một ngày làm nghề Y`, `Sự khác biệt giữa X/Y`, `Người mới thử X`, `Cần biết gì trước khi chọn trường?`.
- Each article leads to relevant career card/mission/test, with editorial review and dates.

## 9. Acceptance criteria

- [ ] First-screen value proposition and two honest CTAs fit phone+desktop.
- [ ] Landing has no unverified stats, unproven position claims or wrong quiz metadata.
- [ ] Hero and nav never point to a nonexistent mission route.
- [ ] Guest gets meaningful first response without account where approved; quiz draft survives auth redirect.
- [ ] Public route transitions, CTA events, form errors, analytics tested.
- [ ] Mobile, reduced motion and keyboard navigation pass QA.
- [ ] A/B experiment designed before claiming conversion lift; no artificial benchmark presented as actual.
