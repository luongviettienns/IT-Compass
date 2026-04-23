export const includeAuthor = {
    author: {
        select: {
            id: true,
            fullName: true,
        },
    },
};
export const blogPostSummarySelect = {
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    tag: true,
    coverImageUrl: true,
    readTimeText: true,
    status: true,
    isFeatured: true,
    views: true,
    likes: true,
    publishedAt: true,
    scheduledAt: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
    author: {
        select: {
            id: true,
            fullName: true,
        },
    },
};
export const includeCommentUser = {
    user: {
        select: { id: true, fullName: true },
    },
};
export const includeCommentAdminRelations = {
    user: {
        select: { id: true, fullName: true },
    },
    post: {
        select: {
            id: true,
            title: true,
            slug: true,
            status: true,
        },
    },
};
export const toBlogDto = (post) => ({
    // Mapper gom public/admin blog về cùng DTO để frontend chỉ cần phân nhánh theo field có mặt thay vì tự remap từng nơi.
    id: String(post.id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? null,
    content: post.content ?? '',
    tag: post.tag ?? null,
    coverImageUrl: post.coverImageUrl ?? null,
    readTimeText: post.readTimeText ?? null,
    status: post.status,
    isFeatured: post.isFeatured ?? false,
    metaTitle: post.metaTitle ?? null,
    metaDescription: post.metaDescription ?? null,
    canonicalUrl: post.canonicalUrl ?? null,
    ogImageUrl: post.ogImageUrl ?? null,
    noIndex: post.noIndex ?? false,
    keywords: post.keywords ?? null,
    views: post.views ?? 0,
    likes: post.likes ?? 0,
    publishedAt: post.publishedAt ?? null,
    scheduledAt: post.scheduledAt ?? null,
    deletedAt: post.deletedAt ?? null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author
        ? {
            id: String(post.author.id),
            fullName: post.author.fullName,
        }
        : null,
});
export const toCommentDto = (comment) => ({
    // Comment DTO chỉ lộ user/post tối thiểu cần để render và moderation, tránh đẩy cả relation Prisma thô ra API.
    id: String(comment.id),
    content: comment.content,
    status: comment.status,
    guestName: comment.guestName,
    deletedAt: comment.deletedAt,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    user: comment.user
        ? {
            id: String(comment.user.id),
            fullName: comment.user.fullName,
        }
        : null,
    post: comment.post
        ? {
            id: String(comment.post.id),
            title: comment.post.title,
            slug: comment.post.slug,
            status: comment.post.status,
        }
        : null,
});
