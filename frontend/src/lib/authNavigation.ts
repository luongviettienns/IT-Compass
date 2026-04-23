/**
 * @file authNavigation.ts - Logic điều hướng sau khi xác thực (login/register).
 *
 * File này chịu trách nhiệm:
 * - Tạo navigation state cho redirect sau auth (giữ intent trong state, không nhét vào URL).
 * - Xác định route mặc định theo role sau khi đăng nhập (mentor → dashboard, student → /).
 * - Xử lý redirect đặc biệt: quay lại trang quiz result sau khi đăng nhập.
 */

import type { AssessmentAttempt } from './assessmentApi';

export type AuthMode = 'login' | 'register';

export type AuthPageState = {
  redirectTo?: string;
  authMode?: AuthMode;
  returnToQuizResult?: boolean;
  savedAttempt?: AssessmentAttempt | null;
  pendingSaveError?: string | null;
};

const QUIZ_RESULT_REDIRECT = '/test/quiz';

// Quiz giữ redirect intent trong navigation state để không phải nhét payload restore vào URL.
export const createQuizAuthState = (authMode: AuthMode): AuthPageState => ({
  redirectTo: QUIZ_RESULT_REDIRECT,
  returnToQuizResult: true,
  authMode,
});

export const toQuizResultState = (
  savedAttempt: AssessmentAttempt | null,
  pendingSaveError: string | null,
): AuthPageState => ({
  returnToQuizResult: true,
  savedAttempt,
  pendingSaveError,
});

const AUTH_ONLY_ROUTES = ['/auth/', '/forgot-password', '/reset-password'] as const;

export const sanitizeRedirectTo = (redirectTo: string | null | undefined) => {
  if (!redirectTo || !redirectTo.startsWith('/') || redirectTo.startsWith('//')) return null;
  if (AUTH_ONLY_ROUTES.some((prefix) => redirectTo === prefix || redirectTo.startsWith(prefix))) {
    return null;
  }
  return redirectTo;
};

export const isQuizRedirect = (redirectTo: string | null | undefined) => redirectTo === QUIZ_RESULT_REDIRECT;

// Mentor đi thẳng dashboard sau auth, còn student/admin quay về shell mặc định rồi điều hướng tiếp theo context trang.
export const getDefaultAuthRoute = (role: 'STUDENT' | 'MENTOR' | 'ADMIN') => (
  role === 'MENTOR' ? '/mentor/dashboard' : '/'
);

export const resolvePostAuthRoute = (
  role: 'STUDENT' | 'MENTOR' | 'ADMIN',
  redirectTo: string | null | undefined,
) => sanitizeRedirectTo(redirectTo) ?? getDefaultAuthRoute(role);
