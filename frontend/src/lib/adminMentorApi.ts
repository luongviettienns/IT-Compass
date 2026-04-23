/**
 * @file adminMentorApi.ts - API client quản trị mentor (admin only).
 *
 * File này chịu trách nhiệm:
 * - Định nghĩa types cho AdminMentor (mở rộng từ PublicMentor, thêm info quản lý).
 * - Cung cấp adminMentorApi object với các endpoint:
 *   + listMentors: liệt kê mentor với lọc/phân trang/thống kê.
 *   + getMentorById: xem chi tiết mentor.
 *   + createMentor: tạo mới mentor profile.
 *   + updateMentor: cập nhật thông tin mentor.
 *   + updateMentorStatus: thay đổi trạng thái (ACTIVE/PAUSED).
 *   + updateMentorVerification: thay đổi trạng thái xác thực.
 */

import { apiRequest } from './authApi';
import type { UserRole, UserStatus } from './adminUserApi';
import type { MentorLevel, MentorSortOrder, MentorStatus, PublicMentor } from './mentorApi';

export type AdminMentor = PublicMentor & {
  userId: string | null;
  status: MentorStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  } | null;
};

export type AdminMentorPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminMentorSummary = {
  total: number;
  active: number;
  paused: number;
  verified: number;
};

export type AdminMentorListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | MentorStatus;
  level?: MentorLevel | 'all';
  isVerified?: 'all' | 'true' | 'false';
  sortBy?: 'updatedAt' | 'createdAt' | 'reviewCount' | 'yearsOfExperience' | 'name';
  sortOrder?: MentorSortOrder;
};

export type AdminMentorInput = {
  userId?: string | null;
  name?: string;
  slug?: string;
  avatarUrl?: string | null;
  title?: string | null;
  bio?: string | null;
  level?: MentorLevel | null;
  expertiseArea?: string | null;
  yearsOfExperience?: number | null;
  hourlyRate?: number | null;
  currentSchool?: string | null;
  currentCompany?: string | null;
  currentJobTitle?: string | null;
  consultationLang?: string | null;
  reviewCount?: number;
  isVerified?: boolean;
  status?: MentorStatus;
};

const request = async <T>(path: string, options: RequestInit = {}, fallbackMessage = 'Yêu cầu không thành công') =>
  apiRequest<T>(path, options, { fallbackMessage });

const toParams = (query: Record<string, unknown>) => {
  // Bỏ 'all'/rỗng khỏi query string để frontend không gửi filter giả làm backend phải tự đoán lại mặc định.
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const adminMentorApi = {
  listMentors: (query: AdminMentorListParams = {}) =>
    request<{
      mentors: AdminMentor[];
      pagination: AdminMentorPagination;
      summary: AdminMentorSummary;
    }>(`/admin/mentors${toParams(query)}`, {}, 'Không thể tải danh sách mentor quản trị'),

  getMentorById: (id: string) =>
    request<{ mentor: AdminMentor }>(`/admin/mentors/${id}`, {}, 'Không thể tải chi tiết mentor quản trị'),

  createMentor: (input: AdminMentorInput) =>
    request<{ mentor: AdminMentor }>(
      '/admin/mentors',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      'Không thể tạo mentor mới',
    ),

  updateMentor: (id: string, input: AdminMentorInput) =>
    request<{ mentor: AdminMentor }>(
      `/admin/mentors/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
      'Không thể cập nhật mentor',
    ),

  updateMentorStatus: (id: string, status: MentorStatus) =>
    request<{ mentor: AdminMentor }>(
      `/admin/mentors/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      'Không thể cập nhật trạng thái mentor',
    ),

  updateMentorVerification: (id: string, isVerified: boolean) =>
    request<{ mentor: AdminMentor }>(
      `/admin/mentors/${id}/verification`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isVerified }),
      },
      'Không thể cập nhật xác thực mentor',
    ),
};
