import type { MentorLevel, Prisma } from '@prisma/client';

import type { AssessmentSummary } from '../types/assessment.js';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import {
  publicMentorSelect,
  serializePublicMentor,
  parseMentorExpertiseArea,
} from '../utils/serializeMentor.js';
import {
  sanitizeNullableRichText,
  sanitizeNullableSingleLineText,
  sanitizeOptionalUrl,
  sanitizeSingleLineText,
} from '../utils/sanitize.js';
import { slugify } from '../utils/slug.js';
import { getLatestAttempt } from './assessment.service.js';

export type MentorLevelFilter = MentorLevel;
export type SortOrder = 'asc' | 'desc';
export type MentorListSortBy =
  | 'reviewCount'
  | 'yearsOfExperience'
  | 'updatedAt'
  | 'createdAt'
  | 'hourlyRate'
  | 'name';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const DEFAULT_RECOMMENDED_LIMIT = 4;

const mentorSelfSelect = {
  ...publicMentorSelect,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MentorSelect;

type MentorSelfRecord = Prisma.MentorGetPayload<{ select: typeof mentorSelfSelect }>;

const MENTOR_BASE_WHERE = {
  status: 'ACTIVE',
} satisfies Prisma.MentorWhereInput;

const normalizePositiveInt = (value: number | undefined, fallback: number) => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) return fallback;
  return value;
};

const normalizeSearchTerm = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = sanitizeSingleLineText(value);
  return normalized || undefined;
};

const normalizeSlug = (value: string) => {
  const normalized = sanitizeSingleLineText(value);
  if (!normalized) {
    throw new HttpError(400, 'Slug is required', undefined, 'VALIDATION_FAILED');
  }

  return normalized;
};

const normalizeKeyword = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = sanitizeSingleLineText(value).toLowerCase();
  return normalized || undefined;
};

const normalizeSelfSlug = (value: string | undefined) => {
  if (!value) return undefined;
  const slug = slugify(sanitizeSingleLineText(value));
  if (!slug) {
    throw new HttpError(400, 'Could not generate a valid slug');
  }
  return slug;
};

const buildProfileCompletion = (mentor: MentorSelfRecord) => {
  // Dashboard dùng completion như tín hiệu UX nên chỉ tính các field công khai thật sự ảnh hưởng tới chất lượng hồ sơ.
  const checkpoints = [
    mentor.name,
    mentor.slug,
    mentor.avatarUrl,
    mentor.title,
    mentor.bio,
    mentor.level,
    mentor.expertiseArea,
    mentor.yearsOfExperience,
    mentor.currentCompany,
    mentor.currentJobTitle,
    mentor.consultationLang,
  ];

  const completed = checkpoints.filter(Boolean).length;
  return Math.round((completed / checkpoints.length) * 100);
};

const normalizeExpertiseKeywords = (items: string[]) =>
  items
    .map((item) => normalizeKeyword(item))
    .filter((item): item is string => Boolean(item));

const buildMentorOrderBy = (sortBy: MentorListSortBy, sortOrder: SortOrder): Prisma.MentorOrderByWithRelationInput[] => {
  if (sortBy === 'name') {
    return [{ name: sortOrder }, { reviewCount: 'desc' }, { id: 'desc' }];
  }

  return [{ [sortBy]: sortOrder }, { reviewCount: 'desc' }, { id: 'desc' }] as Prisma.MentorOrderByWithRelationInput[];
};

const buildMentorWhere = ({
  search,
  expertiseArea,
  level,
  isVerified,
  minYearsOfExperience,
  maxHourlyRate,
  consultationLang,
}: {
  search?: string;
  expertiseArea?: string;
  level?: MentorLevelFilter;
  isVerified?: boolean;
  minYearsOfExperience?: number;
  maxHourlyRate?: number;
  consultationLang?: string;
}): Prisma.MentorWhereInput => {
  const normalizedSearch = normalizeSearchTerm(search);
  const normalizedExpertiseArea = normalizeKeyword(expertiseArea);
  const normalizedConsultationLang = normalizeKeyword(consultationLang);

  return {
    ...MENTOR_BASE_WHERE,
    ...(level ? { level } : {}),
    ...(isVerified !== undefined ? { isVerified } : {}),
    ...(typeof minYearsOfExperience === 'number'
      ? { yearsOfExperience: { gte: minYearsOfExperience } }
      : {}),
    ...(typeof maxHourlyRate === 'number'
      ? { hourlyRate: { lte: maxHourlyRate } }
      : {}),
    ...(normalizedExpertiseArea
      ? { expertiseArea: { contains: normalizedExpertiseArea } }
      : {}),
    ...(normalizedConsultationLang
      ? { consultationLang: { contains: normalizedConsultationLang } }
      : {}),
    ...(normalizedSearch
      ? {
          OR: [
            { name: { contains: normalizedSearch } },
            { title: { contains: normalizedSearch } },
            { bio: { contains: normalizedSearch } },
            { expertiseArea: { contains: normalizedSearch } },
            { currentCompany: { contains: normalizedSearch } },
            { currentSchool: { contains: normalizedSearch } },
          ],
        }
      : {}),
  };
};

const asAssessmentSummary = (value: unknown): AssessmentSummary | null => {
  if (!value || typeof value !== 'object') return null;
  const summary = value as Partial<AssessmentSummary>;
  if (!Array.isArray(summary.suggestedMentorExpertise)) return null;
  return summary as AssessmentSummary;
};

const hasMatchedExpertise = (expertiseKeywords: string[], expertiseArea: string | null) => {
  if (!expertiseKeywords.length || !expertiseArea) return false;

  const mentorKeywords = normalizeExpertiseKeywords(parseMentorExpertiseArea(expertiseArea));
  if (!mentorKeywords.length) {
    const rawKeyword = normalizeKeyword(expertiseArea);
    return rawKeyword ? expertiseKeywords.includes(rawKeyword) : false;
  }

  return mentorKeywords.some((keyword) => expertiseKeywords.includes(keyword));
};

const getSelfMentorByUserId = async (userId: bigint) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true },
  });

  if (!user) {
    throw new HttpError(404, 'User not found', undefined, 'AUTH_USER_NOT_FOUND');
  }

  // Mentor mới đăng ký chưa có row riêng, nên self-service sẽ tự tạo hồ sơ tối thiểu để dashboard/profile dùng được ngay.
  return prisma.mentor.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      name: user.fullName,
      slug: `mentor-${String(userId)}`,
    },
    select: mentorSelfSelect,
  });
};

const ensureSelfSlugUnique = async (slug: string, excludeUserId: bigint) => {
  const existing = await prisma.mentor.findUnique({
    where: { slug },
    select: { userId: true },
  });

  if (existing && existing.userId !== excludeUserId) {
    throw new HttpError(409, 'Slug is already in use');
  }
};

export const listMentors = async ({
  page,
  limit,
  search,
  expertiseArea,
  level,
  isVerified,
  minYearsOfExperience,
  maxHourlyRate,
  consultationLang,
  sortBy = 'reviewCount',
  sortOrder = 'desc',
}: {
  page?: number;
  limit?: number;
  search?: string;
  expertiseArea?: string;
  level?: MentorLevelFilter;
  isVerified?: boolean;
  minYearsOfExperience?: number;
  maxHourlyRate?: number;
  consultationLang?: string;
  sortBy?: MentorListSortBy;
  sortOrder?: SortOrder;
}) => {
  const normalizedPage = normalizePositiveInt(page, DEFAULT_PAGE);
  const normalizedLimit = normalizePositiveInt(limit, DEFAULT_LIMIT);
  const where = buildMentorWhere({
    search,
    expertiseArea,
    level,
    isVerified,
    minYearsOfExperience,
    maxHourlyRate,
    consultationLang,
  });

  const [total, mentors] = await Promise.all([
    prisma.mentor.count({ where }),
    prisma.mentor.findMany({
      where,
      select: publicMentorSelect,
      orderBy: buildMentorOrderBy(sortBy, sortOrder),
      skip: (normalizedPage - 1) * normalizedLimit,
      take: normalizedLimit,
    }),
  ]);

  return {
    mentors: mentors.map(serializePublicMentor),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / normalizedLimit)),
    },
  };
};

export const getMentorBySlug = async ({ slug }: { slug: string }) => {
  const mentor = await prisma.mentor.findFirst({
    where: {
      ...MENTOR_BASE_WHERE,
      slug: normalizeSlug(slug),
    },
    select: publicMentorSelect,
  });

  if (!mentor) {
    throw new HttpError(404, 'Mentor not found');
  }

  return serializePublicMentor(mentor);
};

export const getRecommendedMentors = async ({
  userId,
  limit,
}: {
  userId: bigint;
  limit?: number;
}) => {
  const normalizedLimit = normalizePositiveInt(limit, DEFAULT_RECOMMENDED_LIMIT);
  const latestAttempt = await getLatestAttempt({ userId });
  const summary = asAssessmentSummary(latestAttempt?.summary);
  const matchedExpertise = summary?.suggestedMentorExpertise ?? [];
  const expertiseKeywords = normalizeExpertiseKeywords(matchedExpertise);

  if (!expertiseKeywords.length) {
    return {
      source: latestAttempt ? 'assessment' : 'none',
      matchedExpertise: [],
      mentors: [],
    } as const;
  }

  const candidateMentors = await prisma.mentor.findMany({
    where: MENTOR_BASE_WHERE,
    select: publicMentorSelect,
    orderBy: [{ isVerified: 'desc' }, { reviewCount: 'desc' }, { yearsOfExperience: 'desc' }, { id: 'desc' }],
  });

  const mentors = candidateMentors
    .filter((mentor) => hasMatchedExpertise(expertiseKeywords, mentor.expertiseArea))
    .slice(0, normalizedLimit)
    .map(serializePublicMentor);

  return {
    source: 'assessment' as const,
    matchedExpertise,
    mentors,
  };
};

export const getMentorProfile = async ({ userId }: { userId: bigint }) => {
  const mentor = await getSelfMentorByUserId(userId);
  return {
    ...serializePublicMentor(mentor),
    status: mentor.status,
    createdAt: mentor.createdAt,
    updatedAt: mentor.updatedAt,
  };
};

export const updateMentorProfile = async ({
  userId,
  data,
}: {
  userId: bigint;
  data: Record<string, unknown>;
}) => {
  const name = data.name === undefined ? undefined : sanitizeSingleLineText(String(data.name));
  const slug = normalizeSelfSlug(data.slug as string | undefined);
  const nextSlug = slug ?? (name ? normalizeSelfSlug(name) : undefined);

  if (nextSlug) {
    // Self-service dùng upsert theo userId để mentor chưa có row vẫn cập nhật được mà không cần thao tác seed tay.
    await ensureSelfSlugUnique(nextSlug, userId);
  }

  const mentor = await prisma.mentor.upsert({
    where: { userId },
    update: {
      ...(name !== undefined ? { name } : {}),
      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: sanitizeOptionalUrl(data.avatarUrl as string | null | undefined) } : {}),
      ...(data.title !== undefined ? { title: sanitizeNullableSingleLineText(data.title as string | null | undefined) } : {}),
      ...(data.bio !== undefined ? { bio: sanitizeNullableRichText(data.bio as string | null | undefined) } : {}),
      ...(data.level !== undefined ? { level: data.level as MentorLevel | null } : {}),
      ...(data.expertiseArea !== undefined ? { expertiseArea: sanitizeNullableSingleLineText(data.expertiseArea as string | null | undefined) } : {}),
      ...(data.yearsOfExperience !== undefined ? { yearsOfExperience: data.yearsOfExperience as number | null } : {}),
      ...(data.hourlyRate !== undefined ? { hourlyRate: data.hourlyRate as number | null } : {}),
      ...(data.currentSchool !== undefined ? { currentSchool: sanitizeNullableSingleLineText(data.currentSchool as string | null | undefined) } : {}),
      ...(data.currentCompany !== undefined ? { currentCompany: sanitizeNullableSingleLineText(data.currentCompany as string | null | undefined) } : {}),
      ...(data.currentJobTitle !== undefined ? { currentJobTitle: sanitizeNullableSingleLineText(data.currentJobTitle as string | null | undefined) } : {}),
      ...(data.consultationLang !== undefined ? { consultationLang: sanitizeNullableSingleLineText(data.consultationLang as string | null | undefined) } : {}),
    },
    create: {
      userId,
      name: name || 'Mentor',
      slug: nextSlug || `mentor-${String(userId)}`,
      avatarUrl: sanitizeOptionalUrl(data.avatarUrl as string | null | undefined) ?? null,
      title: sanitizeNullableSingleLineText(data.title as string | null | undefined) ?? null,
      bio: sanitizeNullableRichText(data.bio as string | null | undefined) ?? null,
      level: (data.level as MentorLevel | null | undefined) ?? null,
      expertiseArea: sanitizeNullableSingleLineText(data.expertiseArea as string | null | undefined) ?? null,
      yearsOfExperience: (data.yearsOfExperience as number | null | undefined) ?? null,
      hourlyRate: (data.hourlyRate as number | null | undefined) ?? null,
      currentSchool: sanitizeNullableSingleLineText(data.currentSchool as string | null | undefined) ?? null,
      currentCompany: sanitizeNullableSingleLineText(data.currentCompany as string | null | undefined) ?? null,
      currentJobTitle: sanitizeNullableSingleLineText(data.currentJobTitle as string | null | undefined) ?? null,
      consultationLang: sanitizeNullableSingleLineText(data.consultationLang as string | null | undefined) ?? null,
    },
    select: mentorSelfSelect,
  });

  return {
    ...serializePublicMentor(mentor),
    status: mentor.status,
    createdAt: mentor.createdAt,
    updatedAt: mentor.updatedAt,
  };
};

export const getMentorDashboard = async ({ userId }: { userId: bigint }) => {
  const mentor = await getSelfMentorByUserId(userId);

  return {
    stats: {
      profileCompletion: buildProfileCompletion(mentor),
      isVerified: mentor.isVerified,
      status: mentor.status,
      reviewCount: mentor.reviewCount,
    },
    mentor: {
      ...serializePublicMentor(mentor),
      status: mentor.status,
      createdAt: mentor.createdAt,
      updatedAt: mentor.updatedAt,
    },
  };
};
