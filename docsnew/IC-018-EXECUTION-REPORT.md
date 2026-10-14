# IC-018 — Shared design system, accessibility and UX writing baseline: execution report

- Ngày: 2026-10-14; baseline `a47283b` (merge IC-010 trên `main`).
- Nhánh: `codex/accessibility-baseline`.
- Phạm vi: [IC-018 backlog](16-ISSUE-BACKLOG.md), [12 — Design system & accessibility](12-DESIGN-SYSTEM-ACCESSIBILITY.md), [Kế hoạch triển khai](IC-018-IMPLEMENTATION-PLAN.md).

---

## Findings

1. **Reduced Motion Foundation:** Trước IC-018, hệ thống animation sử dụng `framer-motion` (`motion/react`) kết hợp smooth scroll Lenis mà không kiểm tra cài đặt `prefers-reduced-motion` của hệ điều hành. Người dùng có nhạy cảm tiền đình hoặc bật giảm chuyển động vẫn gặp hiệu ứng cuộn mượt cưỡng bức và transition dài.
2. **Landmark Hierarchy & Skip Link:** Trang chủ và các layout chưa có Skip to main content link. Đồng thời, `App.tsx` bọc các route học sinh trong `<main id="main-content">`, nhưng bên trong có tới 17 trang con tiếp tục render thẻ `<main>` lồng nhau, vi phạm quy chuẩn HTML5 và WCAG 2.1 AA (Landmark uniqueness).
3. **Modal Dialogs & Overlays:** Toàn bộ modals trong thư mục `components/admin/`, `components/mentor/` và các trang admin quản trị đều tự triển khai overlay thủ công bằng `fixed inset-0`. Thiếu hoàn toàn:
   - Focus trap (phím `Tab`/`Shift+Tab` thoát ra ngoài nền web phía sau).
   - Body scroll lock nhất quán khi mở chồng nhiều modal (stacked overlays).
   - Phím `Escape` để đóng modal an toàn.
   - Cơ chế bảo vệ dữ liệu chưa lưu (dirty-state confirm dialog) khi bấm nhầm ra ngoài backdrop hoặc ấn Escape.
   - Khôi phục tiêu điểm (restore focus) về trigger button khi đóng modal.
4. **Form Controls:** Component `Input` dùng `id` truyền thủ công (thường bị bỏ trống), không liên kết `aria-describedby` với thông báo lỗi, thiếu `aria-invalid` và chưa có `Textarea` chuẩn đồng bộ.
5. **Status Badges & Data Tables:** Một số badge hiển thị trạng thái bằng màu sắc đơn thuần (color-only signal). Các bảng dữ liệu admin (`<table`) thiếu `<caption className="sr-only">`, thiếu thuộc tính `scope="col"` trên thẻ `<th>`, và checkbox chọn dòng thiếu `aria-label`.
6. **Icon-only Buttons:** Nhiều nút chức năng quan trọng (menu, user dropdown, pagination, action icons) chỉ chứa SVG icon của Lucide mà không có `aria-label` hoặc văn bản thay thế, khiến Screen Reader chỉ đọc được "button" vô nghĩa.

---

## Decisions

1. **Zero External Runtime A11y Dependencies:** Không cài đặt các thư viện nặng như Radix UI hay Headless UI để tránh làm phình bundle size và xung đột DOM. Thay vào đó, tự xây dựng custom hook `useDialogA11y` chuẩn React 19 thuần túy ngay trong codebase (`frontend/src/hooks/useDialogA11y.ts`).
2. **Global Reduced Motion System:**
   - Override CSS toàn cục trong `index.css` với `@media (prefers-reduced-motion: reduce)`: ép `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important;`.
   - Vô hiệu hóa thư viện cuộn mượt `Lenis` khi hệ thống phát hiện media query `prefers-reduced-motion: reduce`.
   - Bọc toàn bộ ứng dụng trong `<MotionConfig reducedMotion="user">` của `motion/react`.
3. **Single Main Landmark & Accessible Skip Link:**
   - Bổ sung Skip link ở đầu `App.tsx`: `<a href="#main-content" className="sr-only focus:not-sr-only ...">Chuyển đến nội dung chính</a>`.
   - Chuyển đổi 17 thẻ `<main>` lồng nhau ở các trang con thành `<div className="...">`, bảo đảm chỉ duy nhất một `<main id="main-content">` tồn tại trên toàn bộ cây DOM.
4. **Robust Dialog Focus Trap & Stacked Scroll Lock:**
   - Quản lý stack đếm số lượng modal đang mở (`openDialogCount`) để khóa/mở cuộn body chính xác ngay cả khi mở modal con từ modal cha.
   - Bắt phím `Tab` tuần hoàn trong phạm vi container dialog.
   - Hỗ trợ `hasUnsavedChanges` với xác nhận tiếng Việt trực quan trước khi đóng; chặn đóng khi tác vụ đang xử lý (`isPending`).
   - Tối ưu `requestCloseRef` để tránh đánh cắp tiêu điểm (focus stealing) khi người dùng đang gõ phím trong form.
5. **Multi-Signal Design & Table Accessibility:**
   - Kết hợp Icon Lucide + Text tiếng Việt + Màu sắc tương phản (Cyan/Blue/Emerald/Rose/Amber) trong `BookingStatusBadge`, tuân thủ nghiêm ngặt **Purple Ban** (cấm dùng màu tím/violet).
   - Chuẩn hóa toàn bộ bảng admin với `caption sr-only`, `scope="col"` cho tiêu đề cột, và `aria-label` cho checkbox hàng.
6. **Vietnamese Accessible Names & Visual Focus Indicators:**
   - Bổ sung `aria-label` bằng tiếng Việt rõ nghĩa cho tất cả các icon-only button (`"Menu điều hướng"`, `"Trang trước"`, `"Xóa"`, `"Chỉnh sửa"`, `"Đóng"`, ...).
   - Thêm lớp `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none` để người dùng bàn phím luôn nhận biết được vị trí tiêu điểm.
7. **Automated WCAG 2.1 AA Audit:**
   - Bổ sung `@axe-core/playwright` và xây dựng suite kiểm thử E2E accessibility (`frontend/e2e/accessibility.spec.ts`) quét tự động các trang trọng yếu (`/`, `/test`, `/blog`, `/mentors`) với tiêu chí WCAG 2.1 AA.

---

## Detailed Changes & Commits

| Commit | Task | Mô tả chi tiết các file thay đổi |
|---|---|---|
| `5604b6f` | **Task 1: Reduced Motion** | `frontend/src/components/layout/SmoothScroll.tsx` (kiểm tra media query hủy Lenis), `frontend/src/App.tsx` (bọc `MotionConfig reducedMotion="user"`), `frontend/src/index.css` (CSS media overrides), `frontend/tests/motion-reduced.test.tsx` (test xác nhận). |
| `b8c738d` | **Task 2: Landmarks & Skip Link** | `frontend/src/App.tsx` (Skip link & `main#main-content`), loại bỏ 17 `<main>` lồng nhau tại: `AssessmentHistoryPage`, `AssessmentsPage`, `BlogDetailPage`, `BlogPage`, `CareersPage`, `CertificatePage`, `HomePage`, `LeaderboardPage`, `LearningRoadmapPage`, `MajorDetailPage`, `MajorsPage`, `MissionsPage`, `PersonalityQuizPage`, `ProfilePage`, `QuizPage`, `StudentDashboardPage`, `UniversityDetailPage`. Bổ sung `frontend/tests/landmarks-and-skip-link.test.tsx`. |
| `16a5b14` | **Task 3: Shared `useDialogA11y` Hook** | Tạo `frontend/src/hooks/useDialogA11y.ts` (quản lý focus trap, body scroll lock, Escape, dirty state check, restore focus), bổ sung unit tests `frontend/tests/use-dialog-a11y.test.tsx`. |
| `f8d6c5c` | **Task 4: Modals & Overlays Migration** | Di chuyển 10 modal và 3 mobile drawer sang `useDialogA11y`: `AdminActionDialog.tsx`, `AdminBlogCommentsModal.tsx`, `AdminBlogFormModal.tsx`, `AdminBookingDetailModal.tsx`, `AdminExportModal.tsx`, `AdminMentorFormModal.tsx`, `AdminUserEditModal.tsx`, `BookingCancelDialog.tsx`, `BookingDialog.tsx`, `ReviewDialog.tsx`, `AdminAuditLogsPage.tsx`, `AdminBlogsPage.tsx`, `AdminSidebar.tsx`, `MentorSidebar.tsx`, `BottomNav.tsx`. Bổ sung `frontend/tests/modals-accessibility.test.tsx`. |
| `4cf5aef` | **Task 5: Form Primitives** | Chuẩn hóa `frontend/src/components/ui/Input.tsx` (dùng `useId()`, `aria-invalid`, `aria-describedby`, `role="alert"` khi có lỗi, hỗ trợ `helperText`), tạo mới `frontend/src/components/ui/Textarea.tsx` đồng bộ. Bổ sung `frontend/tests/input-accessibility.test.tsx`. |
| `5441aa7` | **Task 6: Multi-Signal & Tables** | `frontend/src/components/booking/BookingStatusBadge.tsx` (thêm icon Lucide cho tất cả trạng thái), chuẩn hóa bảng dữ liệu với `caption`, `scope="col"` tại: `AdminAssessmentsPage.tsx`, `AdminBookingsPage.tsx`, `AdminMentorsPage.tsx`, `AdminUsersPage.tsx`. Bổ sung `frontend/tests/status-badge.test.tsx`. |
| `cfb1008` | **Task 7: Icon Buttons & Focus** | Bổ sung `aria-label` tiếng Việt và `focus-visible:ring-2` cho các nút icon-only trong `Header.tsx`, `NotificationBell.tsx`, `AdminSidebar.tsx`, `MentorSidebar.tsx`, `AdminBlogsPage.tsx`. Bổ sung `frontend/tests/icon-buttons.test.tsx`. |
| `83c2c01` | **Task 8: Automated Axe Audit** | Cài đặt `@axe-core/playwright` devDependency trong `frontend/package.json`, tạo kịch bản audit tự động `frontend/e2e/accessibility.spec.ts` quét WCAG 2.1 AA trên các routes công khai. |

---

## Verification & Test Results

Toàn bộ quy trình kiểm thử đã được chạy tự động và xác minh thực tế:

| Bộ kiểm tra | Lệnh | Kết quả | Ghi chú |
|---|---|---|---|
| **Vitest Component & Unit Tests** | `npm run test` (frontend) | **PASS (15/15 files, 67/67 tests)** | Bao gồm 7 test file a11y chuyên biệt mới bổ sung |
| **TypeScript Typecheck** | `npm run typecheck` (frontend) | **PASS (0 errors)** | `tsc -b --noEmit` hoàn toàn sạch lỗi kiểu |
| **TypeScript E2E Typecheck** | `npm run typecheck:e2e` (frontend) | **PASS (0 errors)** | `tsc -p tsconfig.e2e.json` kiểm tra sạch Playwright specs |
| **ESLint Code Quality** | `npm run lint` (frontend) | **PASS (0 warnings, 0 errors)** | Tuân thủ toàn bộ React 19 hook rules & guidelines |

### Danh sách các file test a11y mới:
1. `tests/motion-reduced.test.tsx`: Xác minh hủy Lenis và cấu hình `MotionConfig` khi `prefers-reduced-motion: reduce`.
2. `tests/landmarks-and-skip-link.test.tsx`: Xác minh Skip to main content link xuất hiện và trỏ đúng `#main-content`.
3. `tests/use-dialog-a11y.test.tsx`: Xác minh focus trap, Escape key, body scroll lock, và phục hồi tiêu điểm.
4. `tests/modals-accessibility.test.tsx`: Xác minh dialog role, ARIA attributes, và hành vi đóng modal.
5. `tests/input-accessibility.test.tsx`: Xác minh `useId()`, `aria-invalid`, `aria-describedby` và `role="alert"` của `Input` và `Textarea`.
6. `tests/status-badge.test.tsx`: Xác minh đa tín hiệu (icon + text) cho status badge, không dựa thuần vào màu sắc.
7. `tests/icon-buttons.test.tsx`: Xác minh các nút icon-only sở hữu accessible name và visible focus rings.

---

## Risks & Operational Notes

- **Browser Animation Testing:** Các môi trường giả lập (jsdom) trong unit tests cần mock `window.matchMedia`. Đã cấu hình mock hoàn chỉnh trong test suite để không phát sinh cảnh báo sai.
- **Stacked Dialog Z-Index:** Khi mở modal xác nhận (dirty state discard confirm) đè lên modal form, `window.confirm` của trình duyệt được sử dụng như giải pháp an toàn mặc định để không bị ảnh hưởng bởi thứ tự z-index của CSS.
- **Rollback Procedure:** Nếu cần đảo ngược, chỉ cần hoàn tác chuỗi commit trên nhánh `codex/accessibility-baseline` (`git revert 5604b6f..83c2c01`). Không có bất kỳ thay đổi nào tác động đến Database schema hay Backend API.

---

## Next Recommended Ticket

**IC-013: CMS unsaved changes safety** hoặc **IC-014: Admin header & terminology**:
- Đã có sẵn nền tảng vững chắc từ `useDialogA11y` với tính năng `hasUnsavedChanges` và dirty check để tích hợp trực tiếp vào Blog/CMS forms.
- Tiếp tục chuỗi nâng cấp Phase 2 (P1) để hoàn thiện trải nghiệm quản trị Admin và học sinh.
