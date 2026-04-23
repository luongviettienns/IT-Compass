/**
 * @file mentorApi.ts - API client cho module mentor (công khai + tự quản).
 *
 * File này chịu trách nhiệm:
 * - Định nghĩa types cho mentor (PublicMentor, MentorProfile, dashboard stats, ...).
 * - API công khai: liệt kê mentor (lọc, phân trang), xem chi tiết theo slug.
 * - API tự quản (self-service): xem/cập nhật profile cá nhân, xem dashboard.
 * - API gợi ý: lấy mentor phù hợp dựa trên kết quả đánh giá nghề nghiệp.
 * - Helper: getMentorHeadline (tạo headline hiển thị), formatMentorHourlyRate.
 */

import { apiRequest } from './authApi';

export type MentorLevel =
  | 'STUDENT'
  | 'FRESHER'
  | 'JUNIOR'
  | 'MIDDLE'
  | 'SENIOR'
  | 'LEAD'
  | 'ARCHITECT'
  | 'MANAGER';

export type MentorStatus = 'ACTIVE' | 'PAUSED';
export type MentorSortOrder = 'asc' | 'desc';
export type MentorListSortBy = 'reviewCount' | 'yearsOfExperience' | 'updatedAt' | 'createdAt' | 'hourlyRate' | 'name';

export type PublicMentor = {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
  title: string | null;
  bio: string | null;
  level: MentorLevel | null;
  expertiseArea: string | null;
  expertise: string[];
  yearsOfExperience: number | null;
  hourlyRate: number | null;
  currentSchool: string | null;
  currentCompany: string | null;
  currentJobTitle: string | null;
  consultationLang: string | null;
  reviewCount: number;
  isVerified: boolean;
};

export type MentorProfile = PublicMentor & {
  status: MentorStatus;
  createdAt: string;
  updatedAt: string;
};

export type MentorDashboardStats = {
  profileCompletion: number;
  isVerified: boolean;
  status: MentorStatus;
  reviewCount: number;
};

export type MentorDashboardResponse = {
  stats: MentorDashboardStats;
  mentor: MentorProfile;
};

export type MentorRecommendationResponse = {
  source: 'assessment' | 'none';
  matchedExpertise: string[];
  mentors: PublicMentor[];
};

export type MentorListParams = {
  page?: number;
  limit?: number;
  search?: string;
  expertiseArea?: string;
  level?: MentorLevel;
  isVerified?: boolean;
  minYearsOfExperience?: number;
  maxHourlyRate?: number;
  consultationLang?: string;
  sortBy?: MentorListSortBy;
  sortOrder?: MentorSortOrder;
};

// Payload updateProfile bám theo self-service contract backend, không mang các field admin-only như status hay isVerified.
export type UpdateMentorProfileInput = {
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
};

const DEFAULT_MENTOR_TITLE = 'Mentor IT';

const buildQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const request = async <T>(path: string, options: RequestInit = {}, fallbackMessage = 'Yêu cầu không thành công') =>
  apiRequest<T>(path, options, { fallbackMessage });

export const getMentorHeadline = (mentor: Pick<PublicMentor, 'title' | 'currentJobTitle' | 'currentCompany' | 'currentSchool'>) => {
  if (mentor.title) return mentor.title;
  if (mentor.currentJobTitle && mentor.currentCompany) return `${mentor.currentJobTitle} @ ${mentor.currentCompany}`;
  return mentor.currentJobTitle || mentor.currentCompany || mentor.currentSchool || DEFAULT_MENTOR_TITLE;
};

export const formatMentorHourlyRate = (hourlyRate: number | null) =>
  hourlyRate ? `${hourlyRate.toLocaleString('vi-VN')}đ` : 'Liên hệ';

export const mentorApi = {
  list: (params: MentorListParams = {}) => {
    const query = buildQueryString({
      page: params.page,
      limit: params.limit,
      search: params.search,
      expertiseArea: params.expertiseArea,
      level: params.level,
      isVerified: params.isVerified,
      minYearsOfExperience: params.minYearsOfExperience,
      maxHourlyRate: params.maxHourlyRate,
      consultationLang: params.consultationLang,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    return request<{
      mentors: PublicMentor[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/mentors${query}`, {}, 'Không thể tải danh sách mentor');
  },

  getBySlug: (slug: string) =>
    request<{ mentor: PublicMentor }>(`/mentors/${slug}`, {}, 'Không thể tải chi tiết mentor'),

  getRecommended: (limit?: number) => {
    const query = buildQueryString({ limit });
    return request<MentorRecommendationResponse>(
      `/users/me/recommended-mentors${query}`,
      {},
      'Không thể tải danh sách mentor gợi ý',
    );
  },

  getProfile: () => request<{ mentor: MentorProfile }>('/mentor/profile', {}, 'Không thể tải hồ sơ mentor'),

  updateProfile: (input: UpdateMentorProfileInput) =>
    request<{ message: string; mentor: MentorProfile }>(
      '/mentor/profile',
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
      'Không thể cập nhật hồ sơ mentor',
    ),

  getDashboard: () =>
    request<MentorDashboardResponse>('/mentor/dashboard', {}, 'Không thể tải bảng điều khiển mentor'),
};
