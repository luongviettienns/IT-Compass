/**
 * @file adminUserApi.ts - API client quản trị người dùng (admin only).
 *
 * File này chịu trách nhiệm:
 * - Định nghĩa types cho AdminUser, AdminUserStats, AdminAuditLog, pagination, ...
 * - Cung cấp adminUserApi object với các endpoint:
 *   + listUsers / getUserStats / getUserById: liệt kê, thống kê, xem chi tiết user.
 *   + updateAccount / updateProfile / updateStatus / updateRole: cập nhật tài khoản.
 *   + revokeSessions: thu hồi toàn bộ phiên đăng nhập.
 *   + bulkUpdateStatus / bulkRevokeSessions: thao tác hàng loạt.
 *   + listAuditLogs / listUserAuditLogs: xem lịch sử thao tác quản trị.
 */

import { apiRequest } from './authApi';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
export type UserRole = 'STUDENT' | 'MENTOR' | 'ADMIN';
export type AuditAction =
  | 'UPDATE_ACCOUNT'
  | 'UPDATE_PROFILE'
  | 'UPDATE_STATUS'
  | 'UPDATE_ROLE'
  | 'REVOKE_SESSIONS'
  | 'BULK_UPDATE_STATUS'
  | 'BULK_REVOKE_SESSIONS';

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  hasProfile: boolean;
  activeSessionCount?: number;
  lastSessionAt?: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: {
    avatarUrl: string | null;
    coverImageUrl: string | null;
    phoneNumber: string | null;
    location: string | null;
    birthYear: number | null;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
    province: string | null;
    schoolOrCompany: string | null;
    department: string | null;
    bio: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    jobTitle: string | null;
  } | null;
};

export type AdminUserStats = {
  total: number;
  byStatus: {
    active: number;
    suspended: number;
    blocked: number;
  };
  byRole: {
    student: number;
    mentor: number;
    admin: number;
  };
  verification: {
    verified: number;
    unverified: number;
  };
  profile: {
    withProfile: number;
    withoutProfile: number;
  };
};

export type AuditLogUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export type AdminAuditLog = {
  id: string;
  action: AuditAction;
  reason: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
  actorUser: AuditLogUser;
  targetUser: AuditLogUser;
};

export type UserPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UserListSummary = {
  total: number;
  active: number;
  suspended: number;
  blocked: number;
  verified: number;
  withProfile: number;
};

// ── Request helper ───────────────────────────────────────────────────────────

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> =>
  apiRequest<T>(path, options);

// ── Query builder ────────────────────────────────────────────────────────────

const toParams = (query: Record<string, unknown>): string => {
  // Query builder giữ toàn bộ list/bulk/audit dùng chung một cách encode filter để cache key và request URL ổn định.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : '';
};

// ── API ──────────────────────────────────────────────────────────────────────

export const adminUserApi = {
  // ── List & Stats ───────────────────────────────────────────────────────────
  listUsers: (query?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'all' | UserRole;
    status?: 'all' | UserStatus;
    emailVerified?: 'all' | 'true' | 'false';
    hasProfile?: 'all' | 'true' | 'false';
    sortBy?: 'createdAt' | 'updatedAt' | 'fullName' | 'email';
    sortOrder?: 'asc' | 'desc';
    createdFrom?: string;
    createdTo?: string;
  }) =>
    request<{
      users: AdminUser[];
      pagination: UserPagination;
      summary: UserListSummary;
    }>(`/admin/users${toParams(query || {})}`),

  getUserStats: () =>
    request<{ stats: AdminUserStats }>('/admin/users/stats'),

  getUserById: (id: string) =>
    request<{ user: AdminUser }>(`/admin/users/${id}`),

  // ── Update operations ──────────────────────────────────────────────────────
  updateAccount: (
    id: string,
    data: {
      fullName?: string;
      email?: string;
      emailVerified?: boolean;
      reason: string;
    },
  ) =>
    request<{ user: AdminUser }>(`/admin/users/${id}/account`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateProfile: (
    id: string,
    data: {
      reason: string;
      avatarUrl?: string | null;
      coverImageUrl?: string | null;
      phoneNumber?: string | null;
      location?: string | null;
      birthYear?: number | null;
      gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
      province?: string | null;
      schoolOrCompany?: string | null;
      department?: string | null;
      bio?: string | null;
      githubUrl?: string | null;
      linkedinUrl?: string | null;
      jobTitle?: string | null;
    },
  ) =>
    request<{ user: AdminUser }>(`/admin/users/${id}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateStatus: (
    id: string,
    data: { status: UserStatus; reason: string },
  ) =>
    request<{ user: AdminUser }>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateRole: (
    id: string,
    data: { role: 'STUDENT' | 'MENTOR'; reason: string },
  ) =>
    request<{ user: AdminUser }>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  revokeSessions: (id: string, data: { reason: string }) =>
    request<{ revokedCount: number }>(`/admin/users/${id}/revoke-sessions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Bulk operations ────────────────────────────────────────────────────────
  bulkUpdateStatus: (data: {
    userIds: string[];
    status: UserStatus;
    reason: string;
  }) =>
    request<{
      successCount: number;
      failureCount: number;
      results: Array<{ userId: string; success: boolean; code?: number; message?: string }>;
    }>('/admin/users/bulk-status', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkRevokeSessions: (data: { userIds: string[]; reason: string }) =>
    request<{
      successCount: number;
      failureCount: number;
      results: Array<{ userId: string; success: boolean; revokedCount?: number }>;
    }>('/admin/users/bulk-revoke-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  listAuditLogs: (query?: {
    page?: number;
    limit?: number;
    actorUserId?: string;
    targetUserId?: string;
    action?: AuditAction;
    createdFrom?: string;
    createdTo?: string;
  }) =>
    request<{
      logs: AdminAuditLog[];
      pagination: UserPagination;
    }>(`/admin/users/audit-logs${toParams(query || {})}`),

  listUserAuditLogs: (
    id: string,
    query?: {
      page?: number;
      limit?: number;
      action?: AuditAction;
      createdFrom?: string;
      createdTo?: string;
    },
  ) =>
    request<{
      logs: AdminAuditLog[];
      pagination: UserPagination;
    }>(`/admin/users/${id}/audit-logs${toParams(query || {})}`),
};
