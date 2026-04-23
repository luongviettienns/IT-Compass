import { z } from 'zod';
const nonPastDate = z.string().datetime().refine((value) => new Date(value) > new Date(), {
    message: 'scheduledAt must be in the future',
});
const idParam = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});
const slugParam = z.object({
    params: z.object({
        slug: z.string().min(2),
    }),
});
const basePostSchema = z.object({
    title: z.string().trim().min(5).max(220),
    excerpt: z.string().trim().max(500).optional(),
    content: z.string().trim().min(50),
    tag: z.string().trim().max(100).optional(),
    coverImageUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
    readTimeText: z.string().trim().max(50).optional(),
    isFeatured: z.boolean().optional().default(false),
    metaTitle: z.string().trim().max(220).optional(),
    metaDescription: z.string().trim().max(320).optional(),
    canonicalUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
    ogImageUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
    noIndex: z.boolean().optional().default(false),
    keywords: z.string().trim().max(500).optional(),
});
export const createBlogPostSchema = z.object({
    body: basePostSchema.extend({
        status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']).optional().default('DRAFT'),
        scheduledAt: nonPastDate.optional(),
    }),
});
export const updateBlogPostSchema = z.object({
    ...idParam.shape,
    body: basePostSchema
        .partial()
        .extend({
        status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']).optional(),
        scheduledAt: nonPastDate.optional(),
    })
        .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});
export const adminListPostsSchema = z.object({
    query: z.object({
        status: z.enum(['all', 'draft', 'scheduled', 'published', 'deleted']).optional().default('all'),
        search: z.string().optional(),
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        sortBy: z.enum(['updatedAt', 'createdAt', 'publishedAt', 'title']).optional().default('updatedAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
export const adminBlogStatsSchema = z.object({
    query: z.object({}).optional().default({}),
});
export const updateBlogStatusSchema = z.object({
    ...idParam.shape,
    body: z
        .object({
        status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']),
        scheduledAt: nonPastDate.optional(),
    })
        .superRefine((value, ctx) => {
        if (value.status === 'SCHEDULED' && !value.scheduledAt) {
            ctx.addIssue({
                code: 'custom',
                path: ['scheduledAt'],
                message: 'scheduledAt is required when status is SCHEDULED',
            });
        }
    }),
});
export const adminSlugCheckSchema = z.object({
    query: z
        .object({
        title: z.string().trim().min(1).optional(),
        slug: z.string().trim().min(1).optional(),
        excludeId: z.string().regex(/^\d+$/).optional(),
    })
        .superRefine((value, ctx) => {
        if (!value.title && !value.slug) {
            ctx.addIssue({
                code: 'custom',
                path: ['title'],
                message: 'title or slug is required',
            });
        }
    }),
});
const bulkIdsSchema = z.object({
    body: z.object({
        ids: z.array(z.string().regex(/^\d+$/)).min(1).max(100),
    }),
});
export const bulkDeleteBlogPostsSchema = bulkIdsSchema;
export const bulkRestoreBlogPostsSchema = bulkIdsSchema;
export const bulkPublishBlogPostsSchema = bulkIdsSchema;
export const adminListCommentsSchema = z.object({
    query: z.object({
        status: z.enum(['all', 'visible', 'hidden', 'deleted']).optional().default('all'),
        search: z.string().optional(),
        postId: z.string().regex(/^\d+$/).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        page: z.coerce.number().int().min(1).optional().default(1),
    }),
});
export const scheduleBlogPostSchema = z.object({
    ...idParam.shape,
    body: z.object({
        scheduledAt: nonPastDate,
    }),
});
export const publishBlogPostSchema = z.object({
    ...idParam.shape,
    body: z.object({}).optional().default({}),
});
export const getBlogPostByIdSchema = idParam;
export const getBlogPostBySlugSchema = slugParam;
export const previewBlogPostSchema = idParam;
export const restoreBlogPostSchema = idParam;
export const deleteBlogPostSchema = idParam;
export const createCommentSchema = z.object({
    ...slugParam.shape,
    body: z.object({
        content: z.string().trim().min(2).max(2000),
        guestName: z.string().trim().min(2).max(120).optional(),
    }),
});
export const listCommentsSchema = z.object({
    ...slugParam.shape,
});
export const moderateCommentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        status: z.enum(['VISIBLE', 'HIDDEN']),
    }),
});
export const deleteCommentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});
export const adminListBlogAuditLogsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        actorUserId: z.string().regex(/^\d+$/).optional(),
        action: z
            .enum([
            'CREATE_POST',
            'UPDATE_POST',
            'UPDATE_POST_STATUS',
            'PUBLISH_POST',
            'SCHEDULE_POST',
            'DELETE_POST',
            'RESTORE_POST',
            'MODERATE_COMMENT',
            'DELETE_COMMENT',
        ])
            .optional(),
        targetType: z.enum(['BLOG_POST', 'BLOG_COMMENT']).optional(),
        targetId: z.string().min(1).max(191).optional(),
    }),
});
