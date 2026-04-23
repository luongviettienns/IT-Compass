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

const mentorStatusSchema = z.enum(['ACTIVE', 'PAUSED']);
const idParam = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/),
  }),
});

const nullableUploadUrlSchema = z.string().url().or(z.string().regex(/^\/uploads\//)).nullable();

const mentorEditableFields = {
  userId: z.string().regex(/^\d+$/).nullable().optional(),
  name: z.string().trim().min(2).max(150).optional(),
  slug: z.string().trim().min(1).max(180).optional(),
  avatarUrl: nullableUploadUrlSchema.optional(),
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
  reviewCount: z.number().int().min(0).max(1_000_000).optional(),
  isVerified: z.boolean().optional(),
  status: mentorStatusSchema.optional(),
};

export const adminListMentorsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().trim().min(1).max(191).optional(),
    status: z.enum(['all', 'ACTIVE', 'PAUSED']).optional().default('all'),
    level: mentorLevelSchema.optional(),
    isVerified: z.enum(['all', 'true', 'false']).optional().default('all'),
    sortBy: z.enum(['updatedAt', 'createdAt', 'reviewCount', 'yearsOfExperience', 'name']).optional().default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const adminGetMentorByIdSchema = idParam;

export const adminCreateMentorSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(150),
    slug: z.string().trim().min(1).max(180).optional(),
    userId: z.string().regex(/^\d+$/).nullable().optional(),
    avatarUrl: nullableUploadUrlSchema.optional(),
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
    reviewCount: z.number().int().min(0).max(1_000_000).optional().default(0),
    isVerified: z.boolean().optional().default(false),
    status: mentorStatusSchema.optional().default('ACTIVE'),
  }),
});

export const adminUpdateMentorSchema = z.object({
  ...idParam.shape,
  body: z
    // PATCH mentor quản trị không cho body rỗng để UI không tạo request save vô nghĩa nhưng vẫn kích hoạt audit.
    .object(mentorEditableFields)
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one mentor field is required',
    }),
});

export const adminUpdateMentorStatusSchema = z.object({
  ...idParam.shape,
  body: z.object({
    status: mentorStatusSchema,
  }),
});

export const adminUpdateMentorVerificationSchema = z.object({
  ...idParam.shape,
  body: z.object({
    isVerified: z.boolean(),
  }),
});
