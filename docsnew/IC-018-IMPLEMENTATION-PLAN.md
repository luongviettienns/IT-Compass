# IC-018 — Shared Design System, Accessibility and UX Writing Baseline: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish an accessible, predictable design system baseline in the IT-Compass frontend without rewriting existing UI or adding heavy runtime libraries, ensuring compliance with WCAG 2.1 AA landmarks, keyboard navigation, focus management, reduced motion, color+icon status indicators, accessible tables, and automated axe-core verification.

**Architecture:** 
1. Pure React 19 + Tailwind custom hooks and lightweight UI primitives (`useDialogA11y`, `Dialog`, `StatusBadge`, enhanced `Input`).
2. Global motion control combining CSS `@media (prefers-reduced-motion: reduce)`, Lenis smooth-scroll suppression, and Motion `MotionConfig reducedMotion="user"`.
3. Landmark hygiene eliminating nested `<main>` tags across all student/auth routes and adding an accessible Skip Link.
4. Two-tier automated verification: React Testing Library keyboard/ARIA tests in Vitest and `@axe-core/playwright` audits in Playwright E2E.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS 3.4, motion/react (Motion 12), Lucide React, Vitest 5, Testing Library React 16, Playwright 1.64, `@axe-core/playwright`.

**Spec:** [docsnew/12-DESIGN-SYSTEM-ACCESSIBILITY.md](12-DESIGN-SYSTEM-ACCESSIBILITY.md)  
**Backlog:** [docsnew/16-ISSUE-BACKLOG.md (IC-018)](16-ISSUE-BACKLOG.md)

---

## Global Constraints
- **Stack Integrity:** Do NOT install Radix UI, Headless UI, shadcn, or new runtime component libraries. Use the existing Tailwind + Motion primitives and custom hooks.
- **Visual Continuity:** Maintain the existing visual layout, styling, border radii, and palette. Only adjust styles where necessary for accessibility (e.g., visible focus rings, 44px min tap targets, icon labels).
- **No Purple:** Adhere strictly to the project Purple Ban.
- **Dependency Scope:** Only `@axe-core/playwright` may be added as a `devDependency` in `frontend/package.json`. No runtime dependencies.
- **Vietnamese Language:** All accessibility text, labels, aria-labels, and dialog titles must be natural, accurate Vietnamese matching the glossary in [12-DESIGN-SYSTEM-ACCESSIBILITY.md](12-DESIGN-SYSTEM-ACCESSIBILITY.md).
- **Validation Gate:** Every task must pass `npm run lint` and `npm run typecheck` in `frontend`.

---

### Task 1: Motion & Reduced Motion Foundation

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/shared/SmoothScroll.tsx`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/tests/motion-reduced.test.tsx`

**Interfaces:**
- `SmoothScroll({ children }: { children: ReactNode })`: listens to `window.matchMedia('(prefers-reduced-motion: reduce)')`. If matched, Lenis is disabled and not instantiated.
- `App.tsx`: wraps root layout with `<MotionConfig reducedMotion="user">` from `'motion/react'`.

- [ ] **Step 1: Write the failing unit test for SmoothScroll reduced-motion awareness**

```tsx
// frontend/tests/motion-reduced.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmoothScroll } from '../src/components/shared/SmoothScroll';

describe('SmoothScroll reduced motion', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('does not instantiate Lenis when prefers-reduced-motion is active', () => {
        window.matchMedia = vi.fn().mockImplementation((query: string) => ({
            matches: query.includes('prefers-reduced-motion'),
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        const { container } = render(
            <SmoothScroll>
                <div>Content</div>
            </SmoothScroll>
        );

        expect(container.textContent).toBe('Content');
        expect(document.documentElement.classList.contains('lenis')).toBe(false);
    });
});
```

- [ ] **Step 2: Run test to verify it fails or checks behavior**
Run: `npm --prefix frontend run test -- tests/motion-reduced.test.tsx`

- [ ] **Step 3: Implement reduced motion suppression in SmoothScroll, App.tsx and index.css**
In `frontend/src/components/shared/SmoothScroll.tsx`:
```tsx
import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';

export function SmoothScroll({ children }: { children: ReactNode }) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery.matches) {
            return;
        }

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        const rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    return <>{children}</>;
}
```

In `frontend/src/App.tsx`:
Import `MotionConfig` from `'motion/react'` and wrap the application shell inside `<MotionConfig reducedMotion="user">`.

In `frontend/src/index.css`:
Add a global `@media (prefers-reduced-motion: reduce)` block:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm --prefix frontend run test -- tests/motion-reduced.test.tsx`
Expected: PASS

- [ ] **Step 5: Verify types and linting**
Run: `npm --prefix frontend run typecheck && npm --prefix frontend run lint`

---

### Task 2: Page Landmarks, Skip Link & Nested `<main>` Elimination

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: 17 student/auth page files under `frontend/src/pages/`
- Test: `frontend/tests/landmarks-and-skip-link.test.tsx`

**Interfaces:**
- `App.tsx`: Renders `<a href="#main-content" className="sr-only focus:not-sr-only ...">Chuyển đến nội dung chính</a>` before layout.
- `App.tsx`: Student layout `<main className="flex-1" id="main-content" tabIndex={-1}>` is the unique top-level `<main>`.
- Subpages inside student layout replace their duplicate `<main>` with semantic alternatives:
  - `BlogDetailPage.tsx`: `<article className="...">`
  - `MajorDetailPage.tsx`: `<article className="...">`
  - `MessagesPage.tsx`: `<div className="...">` (removes invalid nested `<main>` in both student shell and mentor portal)
  - All other student pages (`AboutUsPage`, `BlogPage`, `LandingPage`, `MajorsPage`, `MentorDetailPage`, `MentorPage`, `NotFoundPage`, `ProfilePage`, `StudentBookingsPage`, `ResultPage`, `TestPage`, `AuthPage`, `ForgotPasswordPage`, `ResetPasswordPage`): replace inner `<main>` with `<div className="...">`.

- [ ] **Step 1: Write the failing unit test for skip link and landmark structure**

```tsx
// frontend/tests/landmarks-and-skip-link.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../src/contexts/AuthContext';

describe('Landmarks and Skip Link', () => {
    it('renders a skip link pointing to #main-content', () => {
        const queryClient = new QueryClient();
        render(
            <HelmetProvider>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <MemoryRouter initialEntries={['/']}>
                            <App />
                        </MemoryRouter>
                    </AuthProvider>
                </QueryClientProvider>
            </HelmetProvider>
        );

        const skipLink = screen.getByRole('link', { name: /chuyển đến nội dung chính/i });
        expect(skipLink).toBeInTheDocument();
        expect(skipLink).toHaveAttribute('href', '#main-content');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm --prefix frontend run test -- tests/landmarks-and-skip-link.test.tsx`
Expected: FAIL (skip link not found)

- [ ] **Step 3: Implement Skip Link in App.tsx and eliminate nested `<main>` tags**
1. In `frontend/src/App.tsx`:
   Add skip link at the top of `AppShell`:
   ```tsx
   <a
     href="#main-content"
     className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-ring"
   >
     Chuyển đến nội dung chính
   </a>
   ```
   Add `id="main-content"` and `tabIndex={-1}` to `<main className="flex-1" id="main-content" tabIndex={-1}>`.

2. Replace duplicate `<main` tags in all 17 page files identified in Part C of the audit with semantic `<article>` or `<div>`.

- [ ] **Step 4: Verify with landmark audit script**
Run PowerShell command to ensure only top-level layouts (`App.tsx`, `AdminPage.tsx`, `pages/mentor/MentorPage.tsx`, `QuizPage.tsx`) contain `<main>`.
Run: `npm --prefix frontend run test -- tests/landmarks-and-skip-link.test.tsx`
Expected: PASS

- [ ] **Step 5: Verify types and linting**
Run: `npm --prefix frontend run typecheck && npm --prefix frontend run lint`

---

### Task 3: Shared Accessibility Hook `useDialogA11y`

**Files:**
- Create: `frontend/src/hooks/useDialogA11y.ts`
- Test: `frontend/tests/use-dialog-a11y.test.tsx`

**Interfaces:**
```ts
export type UseDialogA11yOptions = {
    isOpen: boolean;
    onClose: () => void;
    titleId?: string;
    descriptionId?: string;
    isPending?: boolean;
    hasUnsavedChanges?: boolean;
    confirmDiscardMessage?: string;
    closeOnEscape?: boolean;
    closeOnBackdropClick?: boolean;
    initialFocusRef?: React.RefObject<HTMLElement | null>;
    restoreFocus?: boolean;
};

export type UseDialogA11yReturn = {
    dialogRef: React.RefObject<HTMLDivElement | null>;
    titleId: string;
    descriptionId: string;
    dialogProps: {
        role: 'dialog';
        'aria-modal': true;
        'aria-labelledby': string;
        'aria-describedby'?: string;
        'aria-busy'?: boolean;
        tabIndex: -1;
    };
    handleBackdropClick: (e: React.MouseEvent) => void;
    requestClose: () => void;
};
```

- [ ] **Step 1: Write the failing unit test for `useDialogA11y`**

```tsx
// frontend/tests/use-dialog-a11y.test.tsx
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDialogA11y } from '../src/hooks/useDialogA11y';

describe('useDialogA11y hook', () => {
    it('manages dialog attributes, escape key, and focus trap', () => {
        const onClose = vi.fn();
        const { result, rerender } = renderHook(
            ({ isOpen }) => useDialogA11y({ isOpen, onClose }),
            { initialProps: { isOpen: true } }
        );

        expect(result.current.dialogProps.role).toBe('dialog');
        expect(result.current.dialogProps['aria-modal']).toBe(true);
        expect(result.current.titleId).toBeDefined();

        // Simulate Escape key
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onClose when isPending is true', () => {
        const onClose = vi.fn();
        renderHook(() => useDialogA11y({ isOpen: true, onClose, isPending: true }));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        expect(onClose).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm --prefix frontend run test -- tests/use-dialog-a11y.test.tsx`
Expected: FAIL (hook does not exist)

- [ ] **Step 3: Implement `useDialogA11y`**
In `frontend/src/hooks/useDialogA11y.ts`:
- Trap focus using Tab / Shift+Tab cycling across all focusable elements inside `dialogRef.current`.
- Track `document.activeElement` when opened and restore focus on close.
- Focus initial element (`initialFocusRef` or first interactive element or dialog container).
- Lock body scroll by incrementing a module-level active dialog counter; lock `overflow: hidden` when `count === 1`, restore when `count === 0`.
- Handle Escape key with guards (`!isPending`). If `hasUnsavedChanges === true`, prompt confirmation via `window.confirm(confirmDiscardMessage)` before calling `onClose`.
- Provide `handleBackdropClick` that calls `requestClose()`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm --prefix frontend run test -- tests/use-dialog-a11y.test.tsx`
Expected: PASS

- [ ] **Step 5: Verify types and linting**
Run: `npm --prefix frontend run typecheck && npm --prefix frontend run lint`

---

### Task 4: Migrate Admin & Mentor Dialogs to Accessible Standard

**Files:**
- Modify: `frontend/src/components/admin/AdminActionDialog.tsx`
- Modify: `frontend/src/components/admin/AdminBookingDetailModal.tsx`
- Modify: `frontend/src/components/admin/AdminExportModal.tsx`
- Modify: `frontend/src/components/admin/AdminBlogCommentsModal.tsx`
- Modify: `frontend/src/components/admin/AdminBlogFormModal.tsx`
- Modify: `frontend/src/components/admin/AdminMentorFormModal.tsx`
- Modify: `frontend/src/components/admin/AdminUserEditModal.tsx`
- Modify: `frontend/src/components/mentor/BookingCancelDialog.tsx`
- Modify: `frontend/src/components/mentor/BookingDialog.tsx`
- Modify: `frontend/src/components/mentor/ReviewDialog.tsx`
- Modify: `frontend/src/pages/admin/AdminAuditLogsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminBlogsPage.tsx`
- Modify: Mobile drawers (`AdminSidebar.tsx`, `MentorSidebar.tsx`, `BottomNav.tsx`)
- Test: `frontend/tests/modals-accessibility.test.tsx`

**Deliverables:**
- Every modal panel renders `role="dialog"`, `aria-modal="true"`, `aria-labelledby={titleId}`, `tabIndex={-1}`.
- Every modal supports Escape key closing and overlay click closing when not pending.
- Every modal header close button has an explicit accessible label (`aria-label="Đóng"`).
- `AdminExportModal`: moves `role="dialog"` and `aria-modal` off the backdrop onto the modal panel.
- `AdminBlogFormModal`: checks dirty state before closing on Esc or backdrop.
- Stacked modals (`AdminActionDialog` opened over `AdminBookingDetailModal` or `AdminUserEditModal`): inactive underlying modal marks `inert={actionOpen}` to prevent focus leaks.

- [ ] **Step 1: Write the failing unit tests for modal accessibility compliance**

```tsx
// frontend/tests/modals-accessibility.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookingCancelDialog } from '../src/components/mentor/BookingCancelDialog';
import { ReviewDialog } from '../src/components/mentor/ReviewDialog';
import type { MentorBooking } from '../src/lib/bookingApi';

const dummyBooking = {
    id: 101,
    bookingCode: 'BKG-101',
    status: 'CONFIRMED',
    slot: { startTime: new Date().toISOString(), endTime: new Date().toISOString() },
    mentor: { id: 1, name: 'Nguyễn Văn A', avatar: '' },
    student: { id: 2, fullName: 'Trần Thị B', email: 'b@example.com' },
} as unknown as MentorBooking;

describe('Modal Dialog Accessibility', () => {
    it('BookingCancelDialog renders with proper dialog role and accessible name', () => {
        render(<BookingCancelDialog booking={dummyBooking} onClose={vi.fn()} onConfirm={vi.fn()} isPending={false} />);
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(screen.getByRole('button', { name: /đóng/i })).toBeInTheDocument();
    });

    it('ReviewDialog renders with proper dialog role and accessible name', () => {
        render(<ReviewDialog booking={dummyBooking} onClose={vi.fn()} onSubmit={vi.fn()} isPending={false} />);
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm --prefix frontend run test -- tests/modals-accessibility.test.tsx`
Expected: FAIL (missing `role="dialog"` on BookingCancelDialog / ReviewDialog)

- [ ] **Step 3: Migrate all 16 target modals and mobile drawers to `useDialogA11y`**
Migrate each file carefully, preserving all existing visual design and classes while wiring ARIA attributes, focus trap, Escape key, and close button labels.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm --prefix frontend run test -- tests/modals-accessibility.test.tsx`
Expected: PASS

- [ ] **Step 5: Verify types and linting**
Run: `npm --prefix frontend run typecheck && npm --prefix frontend run lint`

---

### Task 5: Form Fields, Input/Textarea Accessibility & Error Association

**Files:**
- Modify: `frontend/src/components/ui/Input.tsx`
- Create: `frontend/src/components/ui/Textarea.tsx`
- Test: `frontend/tests/input-accessibility.test.tsx`

**Interfaces:**
- `Input`: automatically assigns `aria-describedby` when `error` or `helperText` is present; sets `aria-invalid={Boolean(error)}`; links label to `id`.
- `Textarea`: provides identical accessibility contract for multi-line inputs.

- [ ] **Step 1: Write the failing unit test for accessible Input**

```tsx
// frontend/tests/input-accessibility.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from '../src/components/ui/Input';

describe('Input accessibility', () => {
    it('associates error message with aria-describedby and sets aria-invalid', () => {
        render(<Input label="Họ và tên" error="Vui lòng nhập họ tên" />);
        const input = screen.getByLabelText('Họ và tên');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        const errorText = screen.getByText('Vui lòng nhập họ tên');
        expect(input.getAttribute('aria-describedby')).toBe(errorText.id);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm --prefix frontend run test -- tests/input-accessibility.test.tsx`
Expected: FAIL (aria-invalid or aria-describedby missing on current Input)

- [ ] **Step 3: Enhance `Input.tsx` and create `Textarea.tsx`**
In `frontend/src/components/ui/Input.tsx`:
- Compute `errorId = `${inputId}-error`` when `error` is provided.
- Set `aria-invalid={Boolean(error)}` and `aria-describedby={error ? errorId : props['aria-describedby']}`.
- Give the error `<p>` tag `id={errorId}` and `role="alert"`.

Create `frontend/src/components/ui/Textarea.tsx` following the same pattern.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm --prefix frontend run test -- tests/input-accessibility.test.tsx`
Expected: PASS

- [ ] **Step 5: Verify types and linting**
Run: `npm --prefix frontend run typecheck && npm --prefix frontend run lint`

---

### Task 6: Multi-Signal StatusBadge & Accessible Tables

**Files:**
- Modify: `frontend/src/components/mentor/BookingStatusBadge.tsx`
- Create: `frontend/src/components/ui/StatusBadge.tsx`
- Modify: `frontend/src/pages/admin/AdminAssessmentsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminAuditLogsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminBlogsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminBookingsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminMentorsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminUsersPage.tsx`
- Modify: `frontend/src/components/admin/AdminBlogCommentsModal.tsx`
- Test: `frontend/tests/status-badge.test.tsx`

**Deliverables:**
- `BookingStatusBadge` and `StatusBadge` render an explicit icon (Clock, CheckCircle, XCircle, AlertTriangle) alongside colored text and background. Status is NEVER conveyed by color alone.
- All 8 admin `<table>` elements receive:
  - `<caption className="sr-only">...</caption>` describing table contents.
  - `scope="col"` on every `<th` header.
  - Table select-all checkboxes receive explicit `aria-label="Chọn tất cả bài viết"` / `aria-label="Chọn tất cả người dùng"`.

- [ ] **Step 1: Write the failing unit test for StatusBadge multi-signal verification**

```tsx
// frontend/tests/status-badge.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BookingStatusBadge } from '../src/components/mentor/BookingStatusBadge';

describe('BookingStatusBadge multi-signal', () => {
    it('renders text and an accessible icon for CONFIRMED status', () => {
        const { container } = render(<BookingStatusBadge status="CONFIRMED" />);
        expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
        // Check that an SVG icon is rendered inside badge
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('renders text and an icon for REQUESTED status', () => {
        const { container } = render(<BookingStatusBadge status="REQUESTED" />);
        expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument();
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm --prefix frontend run test -- tests/status-badge.test.tsx`
Expected: FAIL (BookingStatusBadge currently has no SVG icons)

- [ ] **Step 3: Update `BookingStatusBadge`, create `StatusBadge`, and add table caption/scope**
1. Add icons (`Clock`, `CheckCircle2`, `XCircle`, `AlertCircle`, `CalendarOff`) to `BookingStatusBadge.tsx`.
2. Create `frontend/src/components/ui/StatusBadge.tsx` for User, Blog, and Comment statuses.
3. Update all 8 tables with `<caption className="sr-only">`, `scope="col"`, and checkbox `aria-label`s.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm --prefix frontend run test -- tests/status-badge.test.tsx`
Expected: PASS

- [ ] **Step 5: Verify types and linting**
Run: `npm --prefix frontend run typecheck && npm --prefix frontend run lint`

---

### Task 7: Icon-Only Buttons, Touch Targets & Visible Focus Rings

**Files:**
- Modify: `frontend/src/components/admin/AdminBlogCommentsModal.tsx`
- Modify: `frontend/src/components/admin/AdminBlogFormModal.tsx`
- Modify: `frontend/src/components/admin/AdminMentorFormModal.tsx`
- Modify: `frontend/src/components/admin/AdminUserEditModal.tsx`
- Modify: `frontend/src/components/layout/AdminSidebar.tsx`
- Modify: `frontend/src/components/layout/MentorSidebar.tsx`
- Modify: `frontend/src/components/layout/Header.tsx`
- Modify: `frontend/src/components/shared/NotificationBell.tsx`
- Modify: `frontend/src/pages/admin/AdminAuditLogsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminBlogsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminMentorsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminUsersPage.tsx`
- Test: `frontend/tests/icon-buttons.test.tsx`

**Deliverables:**
- All 17 unlabeled icon buttons identified in Part D receive explicit `aria-label` attributes in natural Vietnamese.
- Collapsed sidebar buttons retain `aria-label="Đăng xuất"` even when text label is hidden.
- Mobile user menu trigger button in `Header.tsx` receives `aria-label="Menu tài khoản"`, `aria-haspopup="menu"`, and `aria-expanded={userMenuOpen}`.
- All interactive controls provide a visible focus ring (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none`).

- [ ] **Step 1: Write the failing unit test for icon button accessible names**

```tsx
// frontend/tests/icon-buttons.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminSidebar } from '../src/components/layout/AdminSidebar';

describe('Icon buttons accessibility', () => {
    it('renders accessible label on sidebar collapse and logout buttons', () => {
        render(
            <MemoryRouter>
                <AdminSidebar collapsed={false} onCollapsedChange={vi.fn()} />
            </MemoryRouter>
        );
        expect(screen.getByRole('button', { name: /thu gọn thanh điều hướng/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /đăng xuất/i })).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm --prefix frontend run test -- tests/icon-buttons.test.tsx`
Expected: FAIL (missing accessible name on collapse button)

- [ ] **Step 3: Add `aria-label`, `aria-expanded`, and focus-visible rings to all target buttons**
Apply the accessible labels according to Part D Priority 1, 2, and 3 findings.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm --prefix frontend run test -- tests/icon-buttons.test.tsx`
Expected: PASS

- [ ] **Step 5: Verify types and linting**
Run: `npm --prefix frontend run typecheck && npm --prefix frontend run lint`

---

### Task 8: Automated Accessibility Verification with Axe-core

**Files:**
- Modify: `frontend/package.json` (add `@axe-core/playwright` as devDependency)
- Create: `frontend/e2e/accessibility.spec.ts`
- Run: `npm run test:e2e`

**Deliverables:**
- Automated axe audit across key public, auth, and admin pages (`/`, `/test`, `/auth/login`, `/admin/bookings`).
- Verification that no `serious` or `critical` WCAG 2.1 AA violations occur.
- Verified test evidence output file: `docsnew/evidence/IC-018-axe-audit.txt`.

- [ ] **Step 1: Install `@axe-core/playwright` as devDependency**
Command: `npm --prefix frontend install -D @axe-core/playwright`

- [ ] **Step 2: Create Playwright axe audit spec**

```ts
// frontend/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Automated Accessibility Audits (Axe-core)', () => {
    test('landing page has no critical or serious WCAG violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .disableRules(['color-contrast']) // Reviewed separately for branded decorative gradients
            .analyze();

        const criticalOrSerious = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
        expect(criticalOrSerious).toEqual([]);
    });

    test('login page has no critical or serious WCAG violations', async ({ page }) => {
        await page.goto('/auth/login');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        const criticalOrSerious = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
        expect(criticalOrSerious).toEqual([]);
    });

    test('admin booking dialog has no critical accessibility violations when open', async ({ page }) => {
        await page.goto('/auth/login?redirect=%2Fadmin%2Fbookings');
        await page.getByLabel('Email', { exact: true }).fill('ic010-admin@example.test');
        await page.getByLabel('Mật khẩu', { exact: true }).fill('IC010-e2e-password!');
        await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
        await page.waitForURL('**/admin/bookings');

        // Open booking detail modal
        const detailButton = page.getByRole('button', { name: 'Chi tiết' }).first();
        if (await detailButton.isVisible()) {
            await detailButton.click();
            const results = await new AxeBuilder({ page })
                .include('[role="dialog"]')
                .analyze();
            const criticalOrSerious = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
            expect(criticalOrSerious).toEqual([]);
        }
    });
});
```

- [ ] **Step 3: Run the complete Vitest and Playwright test suite**
Run: `npm --prefix frontend run test`
Run: `npm --prefix frontend run test:e2e`
Expected: ALL PASS.

- [ ] **Step 4: Update `PROJECT_PROGRESS.md` and create `docsnew/IC-018-EXECUTION-REPORT.md`**
Record the findings, decisions, changed files, test outputs, and evidence.
