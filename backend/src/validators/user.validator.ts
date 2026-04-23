import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(150).optional(),
    avatarUrl: z.string().url().or(z.string().regex(/^\/uploads\//)).nullable().optional(),
    coverImageUrl: z.string().url().or(z.string().regex(/^\/uploads\//)).nullable().optional(),
    phoneNumber: z.string().trim().max(30).nullable().optional(),
    location: z.string().trim().max(120).nullable().optional(),
    birthYear: z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
    province: z.string().trim().max(120).nullable().optional(),
    schoolOrCompany: z.string().trim().max(191).nullable().optional(),
    department: z.string().trim().max(191).nullable().optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
    githubUrl: z.string().trim().max(500).nullable().optional(),
    linkedinUrl: z.string().trim().max(500).nullable().optional(),
    jobTitle: z.string().trim().max(150).nullable().optional(),
  }),
});
