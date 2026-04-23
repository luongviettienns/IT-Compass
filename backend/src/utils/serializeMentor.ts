/**
 * @file serializeMentor.ts - Chuyển đổi mentor từ database sang DTO cho API response.
 *
 * File này chịu trách nhiệm:
 * - Định nghĩa Prisma select fields cho public và admin mentor query.
 * - Serialize mentor data:
 *   + Public: chỉ expose thông tin công khai (không lộ userId, status).
 *   + Admin: mở rộng từ public, thêm userId, status, lifecycle dates, linked user info.
 * - Parse expertiseArea string thành mảng string[] để frontend render chip list.
 */

import type { MentorLevel, MentorStatus, Prisma, User } from '@prisma/client';

// ── Types ────────────────────────────────────────────────────────────────────

/** DTO mentor công khai – dùng cho trang danh sách mentor, chi tiết mentor. */
export type SerializedPublicMentor = {
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

/** DTO mentor quản trị – mở rộng từ public, thêm thông tin quản lý. */
export type SerializedAdminMentor = SerializedPublicMentor & {
  userId: string | null;
  status: MentorStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: User['role'];
    status: User['status'];
  } | null;
};

// ── Prisma select ────────────────────────────────────────────────────────────

/** Prisma select cho query mentor công khai (tối thiểu field cần thiết). */
export const publicMentorSelect = {
  id: true,
  slug: true,
  name: true,
  avatarUrl: true,
  title: true,
  bio: true,
  level: true,
  expertiseArea: true,
  yearsOfExperience: true,
  hourlyRate: true,
  currentSchool: true,
  currentCompany: true,
  currentJobTitle: true,
  consultationLang: true,
  reviewCount: true,
  isVerified: true,
} satisfies Prisma.MentorSelect;

/** Prisma select cho query mentor quản trị (thêm user relation, status, lifecycle dates). */
export const adminMentorSelect = {
  ...publicMentorSelect,
  userId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
    },
  },
} satisfies Prisma.MentorSelect;

/** Kiểu Prisma payload tương ứng với publicMentorSelect. */
export type PublicMentorRecord = Prisma.MentorGetPayload<{ select: typeof publicMentorSelect }>;
/** Kiểu Prisma payload tương ứng với adminMentorSelect. */
export type AdminMentorRecord = Prisma.MentorGetPayload<{ select: typeof adminMentorSelect }>;

// ── Serialize functions ──────────────────────────────────────────────────────

/**
 * Parse expertiseArea string thành mảng string[].
 * Frontend đang render nhiều chip chuyên môn, nên tạm derive mảng từ chuỗi hiện tại thay vì đổi schema sớm.
 * @param expertiseArea - Chuỗi chuyên môn phân cách bằng dấu phẩy.
 * @returns Mảng string các lĩnh vực chuyên môn.
 */
export const parseMentorExpertiseArea = (expertiseArea: string | null | undefined): string[] => {
  if (!expertiseArea) return [];

  return expertiseArea
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

/**
 * Serialize mentor cho API public.
 * Public serializer cố ý không lộ userId/status để API public và self/admin có thể chia sẻ cùng base contract an toàn.
 */
export const serializePublicMentor = (mentor: PublicMentorRecord): SerializedPublicMentor => ({
  id: String(mentor.id),
  slug: mentor.slug,
  name: mentor.name,
  avatarUrl: mentor.avatarUrl,
  title: mentor.title,
  bio: mentor.bio,
  level: mentor.level,
  expertiseArea: mentor.expertiseArea,
  expertise: parseMentorExpertiseArea(mentor.expertiseArea),
  yearsOfExperience: mentor.yearsOfExperience,
  hourlyRate: mentor.hourlyRate,
  currentSchool: mentor.currentSchool,
  currentCompany: mentor.currentCompany,
  currentJobTitle: mentor.currentJobTitle,
  consultationLang: mentor.consultationLang,
  reviewCount: mentor.reviewCount,
  isVerified: mentor.isVerified,
});

/**
 * Serialize mentor cho API quản trị.
 * Admin serializer mở rộng từ public contract để UI quản trị có thêm user link và lifecycle fields mà không phải map lại từ đầu.
 */
export const serializeAdminMentor = (mentor: AdminMentorRecord): SerializedAdminMentor => ({
  ...serializePublicMentor(mentor),
  userId: mentor.userId ? String(mentor.userId) : null,
  status: mentor.status,
  createdAt: mentor.createdAt,
  updatedAt: mentor.updatedAt,
  user: mentor.user
    ? {
        id: String(mentor.user.id),
        fullName: mentor.user.fullName,
        email: mentor.user.email,
        role: mentor.user.role,
        status: mentor.user.status,
      }
    : null,
});
