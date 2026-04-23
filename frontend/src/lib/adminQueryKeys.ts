/**
 * @file adminQueryKeys.ts - Định nghĩa React Query cache keys cho module admin.
 * Tập trung quản lý cache keys cho tất cả admin queries (users, blogs, mentors, audit logs, ...).
 */

export const adminQueryKeys = {
  blogStats: ['adminStats', 'blogs'] as const,
  assessmentStats: ['adminStats', 'assessments'] as const,
  userStats: ['adminStats', 'users'] as const,
  usersRoot: ['adminUsers'] as const,
  commentsRoot: ['adminComments'] as const,
  postsRoot: ['adminBlogs'] as const,
  mentorsRoot: ['adminMentors'] as const,
  auditLogsRoot: ['adminAuditLogs'] as const,
  blogAuditLogsRoot: ['adminBlogAuditLogs'] as const,
  comments: (query: Record<string, unknown>) => ['adminComments', query] as const,
  posts: (query: Record<string, unknown>) => ['adminBlogs', query] as const,
  users: (query: Record<string, unknown>) => ['adminUsers', query] as const,
  mentors: (query: Record<string, unknown>) => ['adminMentors', query] as const,
  auditLogs: (query: Record<string, unknown>) => ['adminAuditLogs', query] as const,
  blogAuditLogs: (query: Record<string, unknown>) => ['adminBlogAuditLogs', query] as const,
  user: (id: string) => ['adminUser', id] as const,
  mentor: (id: string) => ['adminMentor', id] as const,
  userAuditLogs: (id: string, query: Record<string, unknown>) => ['adminUserAuditLogs', id, query] as const,
  post: (id: string) => ['adminBlog', id] as const,
  postPreview: (id: string) => ['adminBlogPreview', id] as const,
}
