# 07 — Admin dashboard: from vanity metrics to operations console (P1)

## 1. Observation

`frontend/src/pages/admin/AdminDashboard.tsx` shows overall counts (users, mentors, blogs, assessment attempts), breakdown charts, 6-month assessment trend and quick links. It loads multiple queries and uses fallbacks `... || 0`, which can mask failures as zero. `frontend/src/pages/admin/AdminPage.tsx` has a header search input without onChange/search action. `AdminSettingsPage.tsx` is a coming-soon placeholder.

## 2. Target experience

**Operator asks:** “Việc gì quan trọng phải xử lý hôm nay? Có vấn đề nào làm học sinh/mentor không hoàn thành hành trình? Khi thao tác xong hệ thống xác nhận được chưa?”

Information hierarchy:
1. Action inbox, sorted by urgency/SLA.
2. Platform service health / alerts.
3. Key product funnel indicators by period and version.
4. Trend analytics.
5. Quick links to detailed modules.

## 3. Recommended dashboard wireframe

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ TỔNG QUAN VẬN HÀNH        [Hôm nay | 7 ngày | 30 ngày]    [Cập nhật]     │
├───────────────────────────────────────────────────────────────────────────┤
│ CẦN XỬ LÝ        booking pending | mentor review | comments | errors      │
│ [Lịch chờ xác nhận] [Mentor chưa duyệt] [Bình luận cần xử lý] [Lỗi API]   │
├───────────────────────────────────────────────────────────────────────────┤
│ CHẤT LƯỢNG SẢN PHẨM                                                     │
│ [Truy cập→Bắt đầu] [Hoàn thành Test] [Đặt lịch xác nhận] [Quay lại]     │
├───────────────────────────────────────────────────────────────────────────┤
│ Xu hướng khám phá                     │ Tác vụ gần nhất / nhật ký          │
│ [Line/chart theo khoảng thời gian]   │ [time | actor | action]            │
├───────────────────────────────────────────────────────────────────────────┤
│ TRUY CẬP NHANH: Người dùng | Mentor | Nội dung | Assessment | Audit     │
└───────────────────────────────────────────────────────────────────────────┘
```

## 4. Data/API integration

- Reuse existing users, mentor, blogs, assessment endpoints where possible.
- Add a **single BFF/aggregate admin endpoint** `GET /api/admin/dashboard/overview?from=&to=` only if network waterfalls/permission rules justify it; avoid making 5 redundant backend calls.
- Inbox should count real `REQUESTED` bookings pending, unverified mentors that require review, comments reported/flagged (if existing), not simply all comments. New queue states require separate backend work.
- KPI cards should identify period and definition; use denominator (`completed / started`), not totals alone.
- Empty counts are valid ONLY after successful API. If query fails, show `Không thể tải dữ liệu`, retry, optional cached-stale indicator.
- Link each action card to a pre-filtered list using URL search params; user can return to same filter.
- Poll at suitable cadence or use Socket.IO notifications already present, but avoid live-refresh losing table selection.

## 5. UI components

- `AdminMetricCard`: title, value, period, delta if data supports, onClick, loading/error.
- `AdminActionQueueCard`: item category, count, oldest age/priority (when backend supports), link, empty state.
- `AdminTrendChart`: accessible table alternative, legend, zero data handling, selectable time range.
- `AdminRecentActions`: human-readable action, actor, subject, timestamp, link to audit detail.
- `AdminDashboardSkeleton`, `AdminDashboardError`.

## 6. Global header

Choose ONE:
- **Recommended now:** remove inert `Tìm kiếm nhanh...` and replace with contextual breadcrumb, task count, avatar/help; easy P1 fix.
- Later, if truly needed, build command palette (⌘/Ctrl+K), keyboard navigation, server-backed search across allowed modules, audited PII permissions. Never show fake global search.

## 7. Copy/clarity

- `Tổng quan vận hành` rather than `Dashboard` if targeting nontechnical admin.
- `Lượt làm bài định hướng` not `Assessment` by default, allow technical tag small.
- `Cần phản hồi` separate from `Tổng số`.
- Surface unknown/unavailable with `—` or error, not `0`.

## 8. Acceptance

- [ ] Admin sees actionable task queue and navigates to matching filtered list.
- [ ] API error does not turn into fake zero KPIs.
- [ ] No inert search in header.
- [ ] Every KPI has clear scope/time period/definition and accessible text alternative.
- [ ] Dashboard works with empty DB, backend partially unavailable, small screen and keyboard.
- [ ] Data from protected admin endpoints only; role checks backend enforced.
