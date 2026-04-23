/**
 * @file blogQueryKeys.ts - Định nghĩa React Query cache keys cho module blog.
 * Tập trung quản lý cache keys để đảm bảo nhất quán khi invalidate/set/remove query data.
 */

export const blogQueryKeys = {
  all: ['blogs'] as const,
  published: ['blogs', 'published'] as const,
  detail: (slug: string) => ['blogs', 'detail', slug] as const,
  comments: (slug: string) => ['blogs', 'comments', slug] as const,
};
