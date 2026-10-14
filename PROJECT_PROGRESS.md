# Project Progress Tracking

## Trạng thái dự án
- **Ngày khởi tạo:** 2026-10-12
- **Cập nhật lần cuối:** 2026-10-14
- **Kho lưu trữ:** https://github.com/luongviettienns/IT-Compass
- **Nhánh hiện tại:** `main` (đồng bộ với `origin/main` tại commit `a47283b`)

---

## Tổng quan tiến độ theo Phase

| Phase | Nhóm nhiệm vụ | Tổng số IC | Đã hoàn thành | Chưa làm | Trạng thái |
|---|---|---|---|---|---|
| **Phase 0** | Khởi tạo môi trường & Baseline | 0 | 0 | 0 | **Hoàn thành** |
| **Phase 1 (P0)** | Tính đúng đắn nghiệp vụ, bảo mật & độ tin cậy | 10 | 9 (IC-002 -> IC-010) | 1 (IC-001) | **Đang hoàn thiện (90%)** |
| **Phase 2 (P1)** | Trải nghiệm người dùng, Admin & Đánh giá V2 | 9 (IC-011 -> IC-019) | 0 | 9 | **Chờ thực hiện (Backlog)** |
| **Phase 3 (P2)** | Khám phá nghề nghiệp, Game MVP & Marketing V2 | 7 (IC-020 -> IC-026) | 0 | 7 | **Chờ thực hiện (Backlog)** |
| **Phase 4 (P3)** | Cá nhân hóa dựa trên dữ liệu & Thử nghiệm ML | 3 (IC-027 -> IC-029) | 0 | 3 | **Chờ thực hiện (Backlog)** |

---

## Chi tiết các IC Tickets

### Phase 1: P0 — Business correctness, data integrity & security

- [ ] **IC-001:** Authentication: real verification / reset email adapter (phụ thuộc IC-010 CI foundation — hiện đã sẵn sàng thực hiện)
- [x] **IC-002:** Booking attendance review & outcome verification (bỏ auto NO_SHOW)
- [x] **IC-003:** Booking concurrency & idempotency (khóa transaction MySQL, xử lý race condition, 62/62 tests PASS)
- [x] **IC-004:** Booking expiry, Vietnam timezone & automatic confirmation
- [x] **IC-005:** Admin Booking status-aware actions & pending UX
- [x] **IC-006:** Align comment deletion copy with retained records (sửa bản sao xóa nhầm soft delete)
- [x] **IC-007:** Security boundaries (proxy tin cậy, private metrics, upload admission an toàn)
- [x] **IC-008:** Public marketing claims replacement with live facts & neutral indicators
- [x] **IC-009:** Admin query states (loading/error/empty/retry cho 5 trang admin, chống fake số liệu)
- [x] **IC-010:** Critical CI automated tests & Playwright E2E verification
- [x] **Đồng bộ:** Đã merge và push chuỗi commits IC-002 -> IC-010 lên `origin/main`

---

### Phase 2: P1 — Product correctness, admin clarity & assessment quality

- [ ] **IC-011:** Assessment V2 question bank and versioning (30 câu RIASEC, tách biệt câu hỏi tình huống)
- [ ] **IC-012:** Honest scoring & result UI (bỏ 100% ngành phù hợp giả định, hiển thị độ bất định)
- [ ] **IC-013:** CMS unsaved changes safety (cảnh báo khi thoát modal blog khi chưa lưu)
- [ ] **IC-014:** Admin header and terminology (bỏ input tìm kiếm giả, chuẩn hóa thuật ngữ)
- [ ] **IC-015:** Admin action inbox dashboard (hàng đợi công việc, duyệt mentor, moderation)
- [ ] **IC-016:** Mentor approval & form grouping (quy trình duyệt mentor minh bạch)
- [ ] **IC-017:** Mentor scheduling language & student booking transparency
- [🔄] **IC-018:** Accessibility/design system baseline (đang triển khai theo [IC-018-IMPLEMENTATION-PLAN.md](docsnew/IC-018-IMPLEMENTATION-PLAN.md))
- [ ] **IC-019:** Privacy and user data lifecycle (chính sách dữ liệu, xóa/xuất tài khoản)

---

### Phase 3: P2 — Marketing, discovery, instrumentation & game MVP

- [ ] **IC-020:** Marketing landing V2 / first value
- [ ] **IC-021:** First-party analytics and funnels (tracking an toàn không lưu câu trả lời RIASEC)
- [ ] **IC-022:** Student exploration dashboard (hồ sơ định hướng nghề nghiệp cho học sinh)
- [ ] **IC-023:** Mission engine and UX Rescue scenario
- [ ] **IC-024:** Server Crisis scenario
- [ ] **IC-025:** Cyber Detective scenario
- [ ] **IC-026:** CMS SEO + operations refinement

---

### Phase 4: P3 — ML validation & personalization

- [ ] **IC-027:** Deterministic exploration recommender (gợi ý nhiệm vụ tiếp theo dựa trên quy tắc)
- [ ] **IC-028:** ML dataset governance and offline evaluation
- [ ] **IC-029:** Optional ML shadow experiment (thử nghiệm shadow mode khi có phê duyệt)
