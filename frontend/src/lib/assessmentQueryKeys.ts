/**
 * @file assessmentQueryKeys.ts - Định nghĩa React Query cache keys cho module đánh giá.
 * Tập trung quản lý cache keys để đảm bảo nhất quán khi invalidate/set/remove query data.
 */

export const assessmentQueryKeys = {
  all: ['assessments'] as const,
  currentTemplate: ['assessments', 'current-template'] as const,
  latestAttempt: ['assessments', 'latest-attempt'] as const,
  history: (page: number, limit: number) => ['assessments', 'history', page, limit] as const,
};
