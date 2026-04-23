/**
 * @file blogApi.ts - API client cho module blog (công khai + quản trị).
 *
 * File này chịu trách nhiệm:
 * - Định nghĩa types cho BlogPost, BlogComment, pagination, admin stats.
 * - API công khai: liệt kê bài viết, xem chi tiết theo slug, bình luận.
 * - API quản trị (admin): CRUD bài viết, xuất bản/lên lịch, xóa mềm/khôi phục,
 *   thao tác hàng loạt, kiểm tra slug, kiểm duyệt bình luận, upload ảnh.
 */

import { apiRequest, apiUploadRequest } from './authApi';

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tag: string | null;
  coverImageUrl: string | null;
  readTimeText: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  noIndex: boolean;
  keywords: string | null;
  views: number;
  likes: number;
  publishedAt: string | null;
  scheduledAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  author: {
    id: string;
    fullName: string;
  } | null;
};

export type BlogComment = {
  id: string;
  content: string;
  status: 'VISIBLE' | 'HIDDEN';
  guestName: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  user: { id: string; fullName: string } | null;
  post?: { id: string; title: string; slug: string; status: string } | null;
};

export type CommentPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PostPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminBlogStats = {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  deleted: number;
  totalComments: number;
  hiddenComments: number;
};

export type AdminBlogAuditAction =
  | 'CREATE_POST'
  | 'UPDATE_POST'
  | 'UPDATE_POST_STATUS'
  | 'PUBLISH_POST'
  | 'SCHEDULE_POST'
  | 'DELETE_POST'
  | 'RESTORE_POST'
  | 'MODERATE_COMMENT'
  | 'DELETE_COMMENT';

export type AdminBlogAuditLog = {
  id: string;
  action: AdminBlogAuditAction | string;
  targetType: 'BLOG_POST' | 'BLOG_COMMENT' | string;
  targetId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | string | null;
  createdAt: string;
  actorUser: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
  } | null;
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> =>
  apiRequest<T>(path, options);

export const blogApi = {
  listPublished: () => request<{ posts: BlogPost[] }>('/blogs'),
  getBySlug: (slug: string) => request<{ post: BlogPost }>(`/blogs/${slug}`),
  listComments: (slug: string) => request<{ comments: BlogComment[] }>(`/blogs/${slug}/comments`),
  createComment: (slug: string, input: { content: string; guestName?: string }) =>
    request<{ comment: BlogComment }>(`/blogs/${slug}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  create: (input: {
    title: string;
    excerpt?: string;
    content: string;
    tag?: string;
    coverImageUrl?: string;
    readTimeText?: string;
    isFeatured?: boolean;
    status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
    scheduledAt?: string;
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImageUrl?: string;
    noIndex?: boolean;
    keywords?: string;
  }) =>
    request<{ post: BlogPost }>('/blogs', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  adminCreate: (input: {
    title: string;
    content: string;
    slug?: string;
    excerpt?: string;
    tag?: string;
    coverImageUrl?: string;
    readTimeText?: string;
    isFeatured?: boolean;
    status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
    scheduledAt?: string;
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImageUrl?: string;
    noIndex?: boolean;
    keywords?: string;
  }) =>
    request<{ post: BlogPost }>('/admin/blogs', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  adminList: (query?: {
    status?: 'all' | 'draft' | 'scheduled' | 'published' | 'deleted';
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'updatedAt' | 'createdAt' | 'publishedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
  }) => {
    // Query params ở admin blog bám sát lifecycle filter backend để tab list, bulk action và stats nói cùng một ngôn ngữ trạng thái.
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.search) params.set('search', query.search);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.sortBy) params.set('sortBy', query.sortBy);
    if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
    return request<{ posts: BlogPost[]; pagination: PostPagination }>(
      `/admin/blogs${params.toString() ? `?${params}` : ''}`,
    );
  },
  adminStats: () => request<{ stats: AdminBlogStats }>('/admin/blogs/stats'),
  adminListAuditLogs: (query?: {
    page?: number;
    limit?: number;
    actorUserId?: string;
    action?: AdminBlogAuditAction;
    targetType?: 'BLOG_POST' | 'BLOG_COMMENT';
    targetId?: string;
  }) => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.actorUserId) params.set('actorUserId', query.actorUserId);
    if (query?.action) params.set('action', query.action);
    if (query?.targetType) params.set('targetType', query.targetType);
    if (query?.targetId) params.set('targetId', query.targetId);
    return request<{ logs: AdminBlogAuditLog[]; pagination: PostPagination }>(
      `/admin/blogs/audit-logs${params.toString() ? `?${params}` : ''}`,
    );
  },
  adminGetById: (id: string) => request<{ post: BlogPost }>(`/admin/blogs/${id}`),
  adminUpdate: (
    id: string,
    input: Partial<{
      title: string;
      excerpt: string;
      content: string;
      tag: string;
      coverImageUrl: string;
      readTimeText: string;
      isFeatured: boolean;
      status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
      scheduledAt: string;
      metaTitle: string;
      metaDescription: string;
      canonicalUrl: string;
      ogImageUrl: string;
      noIndex: boolean;
      keywords: string;
    }>,
  ) =>
    request<{ post: BlogPost }>(`/admin/blogs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  adminPublish: (id: string) =>
    request<{ post: BlogPost }>(`/admin/blogs/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  adminSchedule: (id: string, scheduledAt: string) =>
    request<{ post: BlogPost }>(`/admin/blogs/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduledAt }),
    }),
  adminDelete: (id: string) =>
    request<{ message: string }>(`/admin/blogs/${id}`, {
      method: 'DELETE',
    }),
  adminRestore: (id: string) =>
    request<{ post: BlogPost }>(`/admin/blogs/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  adminPreview: (id: string) => request<{ post: BlogPost }>(`/admin/blogs/${id}/preview`),
  adminUpdateStatus: (id: string, input: { status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'; scheduledAt?: string }) =>
    request<{ post: BlogPost }>(`/admin/blogs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  adminCheckSlug: (query: { title?: string; slug?: string; excludeId?: string }) => {
    const params = new URLSearchParams();
    if (query.title) params.set('title', query.title);
    if (query.slug) params.set('slug', query.slug);
    if (query.excludeId) params.set('excludeId', query.excludeId);
    return request<{ slug: string; isAvailable: boolean; isConflicted: boolean }>(
      `/admin/blogs/slug-check?${params.toString()}`,
    );
  },
  adminBulkDelete: (ids: string[]) =>
    request<{ successCount: number; failureCount: number; results: Array<{ id: string; ok: boolean }> }>(
      '/admin/blogs/bulk-delete',
      {
        method: 'POST',
        body: JSON.stringify({ ids }),
      },
    ),
  adminBulkRestore: (ids: string[]) =>
    request<{ successCount: number; failureCount: number; results: Array<{ id: string; ok: boolean }> }>(
      '/admin/blogs/bulk-restore',
      {
        method: 'POST',
        body: JSON.stringify({ ids }),
      },
    ),
  adminBulkPublish: (ids: string[]) =>
    request<{ successCount: number; failureCount: number; results: Array<{ id: string; ok: boolean }> }>(
      '/admin/blogs/bulk-publish',
      {
        method: 'POST',
        body: JSON.stringify({ ids }),
      },
    ),
  adminModerateComment: (id: string, status: 'VISIBLE' | 'HIDDEN') =>
    request<{ comment: BlogComment }>(`/admin/comments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  adminDeleteComment: (id: string) =>
    request<{ message: string }>(`/admin/comments/${id}`, {
      method: 'DELETE',
    }),

  adminListComments: (query?: {
    status?: 'all' | 'visible' | 'hidden' | 'deleted';
    search?: string;
    postId?: string;
    page?: number;
    limit?: number;
  }) => {
    // Comment admin list dùng query builder thẳng theo filter moderation/deleted để UI có thể tái tạo đúng snapshot kiểm duyệt hiện tại.
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.search) params.set('search', query.search);
    if (query?.postId) params.set('postId', query.postId);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    return request<{ comments: BlogComment[]; pagination: CommentPagination }>(
      `/admin/comments${params.toString() ? `?${params}` : ''}`,
    );
  },
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiUploadRequest<{ url: string; filename: string }>('/uploads/images', formData, {
      method: 'POST',
    }, {
      fallbackMessage: 'Tải ảnh thất bại',
    });
  },
};
