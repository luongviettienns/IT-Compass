import { z } from 'zod';

const mentorLevelSchema = z.enum([
  'STUDENT',
  'FRESHER',
  'JUNIOR',
  'MIDDLE',
  'SENIOR',
  'LEAD',
  'ARCHITECT',
  'MANAGER',
]);

const listPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
});

export const listMentorsSchema = z.object({
  query: listPaginationSchema.extend({
    search: z.string().trim().min(1).max(191).optional(),
    expertiseArea: z.string().trim().min(1).max(100).optional(),
    level: mentorLevelSchema.optional(),
    isVerified: z.enum(['true', 'false']).optional(),
    minYearsOfExperience: z.coerce.number().int().min(0).max(80).optional(),
    maxHourlyRate: z.coerce.number().int().min(0).max(100_000_000).optional(),
    consultationLang: z.string().trim().min(1).max(100).optional(),
    sortBy: z.enum(['reviewCount', 'yearsOfExperience', 'updatedAt', 'createdAt', 'hourlyRate', 'name']).optional().default('reviewCount'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const getMentorBySlugSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1).max(180),
  }),
});

export const listRecommendedMentorsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(20).optional().default(4),
  }),
});

export const mentorProfileSchema = z.object({
  query: z.object({}).optional().default({}),
});

export const updateMentorProfileSchema = z.object({
  body: z
    // PATCH self-profile phải có ít nhất một field hợp lệ; các field admin-only bị chặn bằng cách không xuất hiện trong schema này.
    .object({
      name: z.string().trim().min(2).max(150).optional(),
      slug: z.string().trim().min(1).max(180).optional(),
      avatarUrl: z.string().url().or(z.string().regex(/^\/uploads\//)).nullable().optional(),
      title: z.string().trim().max(191).nullable().optional(),
      bio: z.string().trim().max(5000).nullable().optional(),
      level: mentorLevelSchema.nullable().optional(),
      expertiseArea: z.string().trim().max(100).nullable().optional(),
      yearsOfExperience: z.number().int().min(0).max(80).nullable().optional(),
      hourlyRate: z.number().int().min(0).max(100_000_000).nullable().optional(),
      currentSchool: z.string().trim().max(191).nullable().optional(),
      currentCompany: z.string().trim().max(191).nullable().optional(),
      currentJobTitle: z.string().trim().max(191).nullable().optional(),
      consultationLang: z.string().trim().max(100).nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one mentor field is required',
    }),
});
