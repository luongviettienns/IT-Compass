/**
 * @file mentorQueryKeys.ts - Định nghĩa React Query cache keys cho module mentor.
 * Tập trung quản lý cache keys để đảm bảo nhất quán khi invalidate/set/remove query data.
 */

export const mentorQueryKeys = {
  all: ['mentors'] as const,
  lists: () => ['mentors', 'list'] as const,
  list: (paramsKey: string) => ['mentors', 'list', paramsKey] as const,
  detail: (slug: string) => ['mentors', 'detail', slug] as const,
  recommended: (limit: number) => ['mentors', 'recommended', limit] as const,
  profile: ['mentors', 'profile'] as const,
  dashboard: ['mentors', 'dashboard'] as const,
};
