/**
 * @file App.tsx - Routing gốc ứng dụng IT Compass.
 *
 * Phân nhóm route:
 * - Công khai: /, /blog, /test, /mentors, /majors, /about, /auth/*
 * - Auth required: /profile
 * - Admin: /admin/*
 * - Mentor: /mentor/dashboard
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { ScrollToTop } from './components/shared/ScrollToTop';
import { SmoothScroll } from './components/shared/SmoothScroll';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Loader } from './components/ui/Loader';

// ── Lazy-loaded pages ────────────────────────────────────────────────────────
const LandingPage = lazy(() => import('./pages/LandingPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const MentorPage = lazy(() => import('./pages/MentorPage'));
const MentorDetailPage = lazy(() => import('./pages/MentorDetailPage'));
const MajorsPage = lazy(() => import('./pages/MajorsPage'));
const MajorDetailPage = lazy(() => import('./pages/MajorDetailPage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const TestPage = lazy(() => import('./pages/assessment/TestPage'));
const QuizPage = lazy(() => import('./pages/assessment/QuizPage'));
const ResultPage = lazy(() => import('./pages/assessment/ResultPage'));
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const MentorDashboard = lazy(() => import('./pages/mentor/MentorDashboard'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader size="lg" />
    </div>
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const isQuiz = pathname === '/test/quiz';

  // Quiz page: no header/footer for focused experience
  if (isQuiz) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/test/quiz" element={<QuizPage />} />
        </Routes>
      </Suspense>
    );
  }

  // Admin: no student header/footer/bottom nav
  if (isAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<ProtectedRoute requireRoles={['ADMIN']} />}>
            <Route path="/admin/*" element={<AdminPage />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  // Student layout: header + content + footer + bottom nav
  const isAuth = pathname.startsWith('/auth') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');
  const showLayout = !isAdmin && !isQuiz && !isAuth;

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-background font-sans pb-16 md:pb-0">
        {showLayout && <Header />}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/mentors" element={<MentorPage />} />
            <Route path="/mentors/:slug" element={<MentorDetailPage />} />
            <Route path="/majors" element={<MajorsPage />} />
            <Route path="/majors/:slug" element={<MajorDetailPage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/test/result" element={<ResultPage />} />
            <Route path="/about" element={<AboutUsPage />} />

            {/* Auth pages */}
            <Route path="/auth/login" element={<AuthPage />} />
            <Route path="/auth/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected: any logged-in user */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Protected: mentor */}
            <Route element={<ProtectedRoute requireRoles={['MENTOR']} />}>
              <Route path="/mentor/dashboard" element={<MentorDashboard />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        {showLayout && <Footer />}
        {showLayout && <BottomNav />}
      </div>
    </SmoothScroll>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AppShell />
    </>
  );
}
