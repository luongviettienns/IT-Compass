/**
 * @file authQueryKeys.ts - Định nghĩa React Query cache keys cho module auth.
 * Tập trung quản lý cache keys để đảm bảo nhất quán khi invalidate/set/remove query data.
 */

export const authQueryKeys = {
  all: ['auth'] as const,
  me: ['auth', 'me'] as const,
  forgotPassword: ['auth', 'forgot-password'] as const,
  resetPassword: ['auth', 'reset-password'] as const,
}
