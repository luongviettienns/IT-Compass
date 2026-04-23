import { z } from 'zod';
const idParam = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});
const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
const auditActionSchema = z.enum([
    'UPDATE_ACCOUNT',
    'UPDATE_PROFILE',
    'UPDATE_STATUS',
    'UPDATE_ROLE',
    'REVOKE_SESSIONS',
    'BULK_UPDATE_STATUS',
    'BULK_REVOKE_SESSIONS',
]);
const reasonSchema = z.string().trim().min(3).max(500);
const nullableUrlSchema = z
    .string()
    .url()
    .or(z.string().regex(/^\/uploads\//))
    .nullable();
const profileFieldShape = {
    avatarUrl: nullableUrlSchema.optional(),
    coverImageUrl: nullableUrlSchema.optional(),
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
};
const bulkIdsBodySchema = z.object({
    userIds: z.array(z.string().regex(/^\d+$/)).min(1).max(100),
    reason: reasonSchema,
});
export const adminListUsersSchema = z.object({
    query: paginationQuerySchema.extend({
        search: z.string().trim().min(1).max(191).optional(),
        role: z.enum(['all', 'STUDENT', 'MENTOR', 'ADMIN']).optional().default('all'),
        status: z.enum(['all', 'ACTIVE', 'SUSPENDED', 'BLOCKED']).optional().default('all'),
        emailVerified: z.enum(['all', 'true', 'false']).optional().default('all'),
        hasProfile: z.enum(['all', 'true', 'false']).optional().default('all'),
        createdFrom: z.string().datetime().optional(),
        createdTo: z.string().datetime().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'fullName', 'email']).optional().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
export const adminUserStatsSchema = z.object({
    query: z.object({}).optional().default({}),
});
export const adminGetUserByIdSchema = idParam;
export const adminUpdateUserAccountSchema = z.object({
    ...idParam.shape,
    body: z
        .object({
        fullName: z.string().trim().min(2).max(150).optional(),
        email: z.string().trim().email().max(191).optional(),
        emailVerified: z.boolean().optional(),
        reason: reasonSchema,
    })
        .refine(({ fullName, email, emailVerified }) => fullName !== undefined || email !== undefined || emailVerified !== undefined, {
        message: 'At least one account field is required',
    }),
});
export const adminUpdateUserProfileSchema = z.object({
    ...idParam.shape,
    body: z
        .object({
        ...profileFieldShape,
        reason: reasonSchema,
    })
        .refine((value) => Object.keys(value).some((key) => key !== 'reason' && value[key] !== undefined), {
        message: 'At least one profile field is required',
    }),
});
export const adminUpdateUserStatusSchema = z.object({
    ...idParam.shape,
    body: z.object({
        status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED']),
        reason: reasonSchema,
    }),
});
export const adminUpdateUserRoleSchema = z.object({
    ...idParam.shape,
    body: z.object({
        role: z.enum(['STUDENT', 'MENTOR']),
        reason: reasonSchema,
    }),
});
export const adminRevokeUserSessionsSchema = z.object({
    ...idParam.shape,
    body: z.object({
        reason: reasonSchema,
    }),
});
export const adminBulkUpdateStatusSchema = z.object({
    body: bulkIdsBodySchema.extend({
        status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED']),
    }),
});
export const adminBulkRevokeSessionsSchema = z.object({
    body: bulkIdsBodySchema,
});
export const adminListAuditLogsSchema = z.object({
    query: paginationQuerySchema.extend({
        actorUserId: z.string().regex(/^\d+$/).optional(),
        targetUserId: z.string().regex(/^\d+$/).optional(),
        action: auditActionSchema.optional(),
        createdFrom: z.string().datetime().optional(),
        createdTo: z.string().datetime().optional(),
    }),
});
export const adminUserAuditLogsSchema = z.object({
    ...idParam.shape,
    query: paginationQuerySchema.extend({
        action: auditActionSchema.optional(),
        createdFrom: z.string().datetime().optional(),
        createdTo: z.string().datetime().optional(),
    }),
});
