import { type BlogPostStatus, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { toBigIntId } from '../utils/ids.js';
import { slugify } from '../utils/slug.js';
import { createAdminAuditLog } from './admin-audit.service.js';
import {
  sanitizeNullableSingleLineText,
  sanitizeOptionalUrl,
  sanitizeRichText,
  sanitizeSingleLineText,
} from '../utils/sanitize.js';
import { blogPostSummarySelect, includeAuthor, toBlogDto } from './blog.mapper.js';
import { resolvePublishFields, toStatusFilter } from './blog.lifecycle.js';

const ensureUniqueSlug = async (title: string, excludeId?: string | bigint) => {
  const baseSlug = slugify(title) || `post-${Date.now()}`;
  const excludedId = excludeId ? toBigIntId(excludeId, 'exclude id') : null;
  let candidate = baseSlug;
  let index = 1;

  while (true) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || (excludedId && existing.id === excludedId)) return candidate;
    candidate = `${baseSlug}-${index}`;
    index += 1;
  }
};

const createWithSlugRetry = async <T>(builder: () => Promise<T>): Promise<T> => {
  const MAX_ATTEMPTS = 4;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    try {
      return await builder();
    } catch (error: unknown) {
      // Kiểm tra slug trước khi ghi vẫn có thể thua race condition nếu hai admin submit gần như cùng lúc.
      const conflict = (error as { code?: string })?.code === 'P2002';
      attempts += 1;
      if (!conflict || attempts >= MAX_ATTEMPTS) throw error;
    }
  }

  throw new HttpError(500, 'Could not create slug');
};

const getPostByIdOrThrow = async (id: string | bigint, include: Prisma.BlogPostInclude = includeAuthor) => {
  const post = await prisma.blogPost.findUnique({
    where: { id: toBigIntId(id, 'blog post id') },
    include,
  });
  if (!post) throw new HttpError(404, 'Blog post not found');
  return post;
};

const getPostBySlugOrThrow = async (slug: string, publicOnly = true) => {
  // Public lookup chỉ trả bài đã publish thực sự để preview admin và trang public không vô tình dùng chung một contract lẫn lộn.
  const where = (publicOnly
    ? {
        slug,
        status: 'PUBLISHED',
        deletedAt: null,
        publishedAt: { lte: new Date() },
      }
    : { slug }) as Prisma.BlogPostWhereInput;
  const post = await prisma.blogPost.findFirst({
    where,
    include: includeAuthor,
  });
  if (!post) throw new HttpError(404, 'Blog post not found');
  return post;
};

const getPostByIdOrNull = async (id: string | bigint, include: Prisma.BlogPostInclude = includeAuthor) =>
  prisma.blogPost.findUnique({
    where: { id: toBigIntId(id, 'blog post id') },
    include,
  });

const getSlugCandidate = ({ title, slug }: { title?: string; slug?: string }) => {
  const source = slug?.trim() || title?.trim();
  if (!source) {
    throw new HttpError(400, 'title or slug is required');
  }

  const candidate = slugify(source);
  if (!candidate) {
    throw new HttpError(400, 'Could not generate a valid slug');
  }

  return candidate;
};

const buildPostSortOrder = ({ sortBy = 'updatedAt', sortOrder = 'desc' }: { sortBy?: string; sortOrder?: string }) => {
  if (sortBy === 'title') {
    return [{ title: sortOrder }, { updatedAt: 'desc' }] as Prisma.BlogPostOrderByWithRelationInput[];
  }

  return [{ [sortBy]: sortOrder }, { updatedAt: 'desc' }] as Prisma.BlogPostOrderByWithRelationInput[];
};

const coercePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

type BlogPostMutationInput = Record<string, unknown> & {
  title?: string;
  excerpt?: string | null;
  content?: string;
  tag?: string | null;
  coverImageUrl?: string | null;
  readTimeText?: string | null;
  status?: BlogPostStatus;
  scheduledAt?: string | null;
  isFeatured?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogImageUrl?: string | null;
  noIndex?: boolean;
  keywords?: string | null;
};

const sanitizePostInput = (input: BlogPostMutationInput): BlogPostMutationInput => ({
  ...input,
  ...(input.title !== undefined ? { title: sanitizeSingleLineText(input.title) } : {}),
  ...(input.excerpt !== undefined ? { excerpt: sanitizeNullableSingleLineText(input.excerpt) } : {}),
  ...(input.content !== undefined ? { content: sanitizeRichText(input.content) } : {}),
  ...(input.tag !== undefined ? { tag: sanitizeNullableSingleLineText(input.tag) } : {}),
  ...(input.coverImageUrl !== undefined ? { coverImageUrl: sanitizeOptionalUrl(input.coverImageUrl) } : {}),
  ...(input.readTimeText !== undefined ? { readTimeText: sanitizeNullableSingleLineText(input.readTimeText) } : {}),
  ...(input.metaTitle !== undefined ? { metaTitle: sanitizeNullableSingleLineText(input.metaTitle) } : {}),
  ...(input.metaDescription !== undefined ? { metaDescription: sanitizeNullableSingleLineText(input.metaDescription) } : {}),
  ...(input.canonicalUrl !== undefined ? { canonicalUrl: sanitizeOptionalUrl(input.canonicalUrl) } : {}),
  ...(input.ogImageUrl !== undefined ? { ogImageUrl: sanitizeOptionalUrl(input.ogImageUrl) } : {}),
  ...(input.keywords !== undefined ? { keywords: sanitizeNullableSingleLineText(input.keywords) } : {}),
});

export const listPublishedPosts = async ({
  page = 1,
  limit = 50,
}: {
  page?: number;
  limit?: number;
} = {}) => {
  const parsedPage = Math.max(1, Math.floor(Number(page) || 1));
  const parsedLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 50)));

  const where = {
    status: 'PUBLISHED' as const,
    deletedAt: null,
    publishedAt: { lte: new Date() },
  };

  const [total, posts] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      select: blogPostSummarySelect,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),
  ]);

  return {
    posts: posts.map(toBlogDto),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
    },
  };
};

export const getPublishedPostBySlug = async ({ slug }: { slug: string }) => {
  const post = await getPostBySlugOrThrow(slug, true);
  return toBlogDto(post);
};

export const adminListPosts = async ({
  status,
  search,
  page = 1,
  limit = 20,
  sortBy = 'updatedAt',
  sortOrder = 'desc',
}: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const parsedPage = coercePositiveInt(page, 1);
  const parsedLimit = coercePositiveInt(limit, 20);
  // Admin list dùng cùng lifecycle filter helper với stats/action để mọi màn hình đọc cùng một định nghĩa draft/scheduled/published/deleted.
  const where = {
    ...toStatusFilter(status),
    ...(search
      ? {
          OR: [{ title: { contains: search } }, { excerpt: { contains: search } }, { content: { contains: search } }],
        }
      : {}),
  } as Prisma.BlogPostWhereInput;

  const [total, posts] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      select: blogPostSummarySelect,
      orderBy: buildPostSortOrder({ sortBy, sortOrder }),
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),
  ]);

  return {
    posts: posts.map(toBlogDto),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
    },
  };
};

export const adminBlogStats = async () => {
  const [postStatusCounts, deleted, commentStatusCounts] = await Promise.all([
    prisma.blogPost.groupBy({
      by: ['status'],
      where: { deletedAt: null } satisfies Prisma.BlogPostWhereInput,
      _count: { status: true },
    }),
    prisma.blogPost.count({ where: { deletedAt: { not: null } } satisfies Prisma.BlogPostWhereInput }),
    prisma.blogComment.groupBy({
      by: ['status'],
      where: { deletedAt: null } satisfies Prisma.BlogPostWhereInput,
      _count: { status: true },
    }),
  ]);

  const postStatusMap = new Map(postStatusCounts.map((item) => [item.status, item._count.status]));
  const commentStatusMap = new Map(commentStatusCounts.map((item) => [item.status, item._count.status]));
  const published = postStatusMap.get('PUBLISHED') || 0;
  const draft = postStatusMap.get('DRAFT') || 0;
  const scheduled = postStatusMap.get('SCHEDULED') || 0;
  const hiddenComments = commentStatusMap.get('HIDDEN') || 0;
  const totalComments = Array.from(commentStatusMap.values()).reduce((sum, count) => sum + count, 0);

  return {
    total: published + draft + scheduled,
    published,
    draft,
    scheduled,
    deleted,
    totalComments,
    hiddenComments,
  };
};

export const adminCheckSlug = async ({ title, slug, excludeId }: { title?: string; slug?: string; excludeId?: string }) => {
  const candidate = getSlugCandidate({ title, slug });
  const existing = await prisma.blogPost.findUnique({
    where: { slug: candidate },
    select: { id: true },
  });
  const excludedId = excludeId ? toBigIntId(excludeId, 'exclude id') : null;
  const isConflicted = existing && (!excludedId || existing.id !== excludedId);

  return {
    slug: candidate,
    isAvailable: !isConflicted,
    isConflicted: Boolean(isConflicted),
  };
};

export const adminGetPostById = async ({ id }: { id: string }) => {
  const post = await getPostByIdOrThrow(id);
  return toBlogDto(post);
};

export const createBlogPost = async ({ authorId, ...input }: { authorId: bigint } & BlogPostMutationInput) => {
  const user = await prisma.user.findUnique({ where: { id: authorId } });
  if (!user) {
    throw new HttpError(404, 'Author not found', undefined, 'BLOG_AUTHOR_NOT_FOUND');
  }

  const sanitizedInput = sanitizePostInput(input);

  const created = await createWithSlugRetry(async () => {
    const slug = await ensureUniqueSlug(String(sanitizedInput.title), undefined);
    // Create và update đều đi qua lifecycle helper để published/scheduled fields luôn thay đổi theo cùng một policy.
    const lifecycle = resolvePublishFields({
      status: sanitizedInput.status || 'DRAFT',
      scheduledAt: sanitizedInput.scheduledAt,
      actorId: authorId,
    });
    return prisma.blogPost.create({
      data: {
        authorId,
        title: sanitizedInput.title,
        slug,
        excerpt: sanitizedInput.excerpt,
        content: sanitizedInput.content,
        tag: sanitizedInput.tag,
        coverImageUrl: sanitizedInput.coverImageUrl,
        readTimeText: sanitizedInput.readTimeText,
        isFeatured: sanitizedInput.isFeatured || false,
        metaTitle: sanitizedInput.metaTitle,
        metaDescription: sanitizedInput.metaDescription,
        canonicalUrl: sanitizedInput.canonicalUrl,
        ogImageUrl: sanitizedInput.ogImageUrl,
        noIndex: sanitizedInput.noIndex || false,
        keywords: sanitizedInput.keywords,
        ...lifecycle,
      } as Prisma.BlogPostUncheckedCreateInput,
      include: includeAuthor,
    });
  });

  await createAdminAuditLog({
    actorUserId: authorId,
    action: 'CREATE_POST',
    targetType: 'BLOG_POST',
    targetId: created.id,
    metadata: {
      postId: String(created.id),
      title: created.title,
      status: created.status,
    },
  });

  return toBlogDto(created);
};

export const updateBlogPost = async ({ id, actorId, ...input }: { id: string; actorId: bigint } & BlogPostMutationInput) => {
  const existing = await getPostByIdOrThrow(id);
  if (existing.deletedAt) throw new HttpError(400, 'Cannot edit a deleted post', undefined, 'BLOG_POST_DELETED');

  const sanitizedInput = sanitizePostInput(input);
  const nextStatus = (sanitizedInput.status as string | undefined) || existing.status;
  // Khi PATCH, status hiện tại vẫn là nguồn fallback để update metadata mà không làm mất publish schedule cũ ngoài ý muốn.
  const lifecycle = resolvePublishFields({
    status: nextStatus,
    scheduledAt:
      sanitizedInput.scheduledAt || (nextStatus === 'SCHEDULED' ? existing.scheduledAt?.toISOString() : undefined),
    actorId: toBigIntId(actorId, 'actor id'),
  });

  const nextData = {
    ...(sanitizedInput.title ? { title: sanitizedInput.title } : {}),
    ...(sanitizedInput.title ? { slug: await ensureUniqueSlug(String(sanitizedInput.title), existing.id) } : {}),
    ...(sanitizedInput.excerpt !== undefined ? { excerpt: sanitizedInput.excerpt } : {}),
    ...(sanitizedInput.content !== undefined ? { content: sanitizedInput.content } : {}),
    ...(sanitizedInput.tag !== undefined ? { tag: sanitizedInput.tag } : {}),
    ...(sanitizedInput.coverImageUrl !== undefined ? { coverImageUrl: sanitizedInput.coverImageUrl } : {}),
    ...(sanitizedInput.readTimeText !== undefined ? { readTimeText: sanitizedInput.readTimeText } : {}),
    ...(sanitizedInput.isFeatured !== undefined ? { isFeatured: sanitizedInput.isFeatured } : {}),
    ...(sanitizedInput.metaTitle !== undefined ? { metaTitle: sanitizedInput.metaTitle } : {}),
    ...(sanitizedInput.metaDescription !== undefined ? { metaDescription: sanitizedInput.metaDescription } : {}),
    ...(sanitizedInput.canonicalUrl !== undefined ? { canonicalUrl: sanitizedInput.canonicalUrl } : {}),
    ...(sanitizedInput.ogImageUrl !== undefined ? { ogImageUrl: sanitizedInput.ogImageUrl } : {}),
    ...(sanitizedInput.noIndex !== undefined ? { noIndex: sanitizedInput.noIndex } : {}),
    ...(sanitizedInput.keywords !== undefined ? { keywords: sanitizedInput.keywords } : {}),
    ...lifecycle,
  } as Prisma.BlogPostUncheckedUpdateInput;

  const updated = await prisma.blogPost.update({
    where: { id: toBigIntId(id, 'blog post id') },
    data: nextData,
    include: includeAuthor,
  });

  await createAdminAuditLog({
    actorUserId: actorId,
    action: 'UPDATE_POST',
    targetType: 'BLOG_POST',
    targetId: updated.id,
    metadata: {
      postId: String(updated.id),
      title: updated.title,
      status: updated.status,
    },
  });

  return toBlogDto(updated);
};

export const updateBlogPostStatus = async ({
  id,
  actorId,
  status,
  scheduledAt,
}: {
  id: string;
  actorId: bigint;
  status: BlogPostStatus;
  scheduledAt?: string;
}) => {
  const existing = await getPostByIdOrThrow(id);
  if (existing.deletedAt) throw new HttpError(400, 'Cannot change status of a deleted post', undefined, 'BLOG_POST_DELETED');

  const lifecycle = resolvePublishFields({
    status,
    scheduledAt,
    actorId: toBigIntId(actorId, 'actor id'),
  });

  const updated = await prisma.blogPost.update({
    where: { id: toBigIntId(id, 'blog post id') },
    data: lifecycle as Prisma.BlogPostUncheckedUpdateInput,
    include: includeAuthor,
  });

  await createAdminAuditLog({
    actorUserId: actorId,
    action: 'UPDATE_POST_STATUS',
    targetType: 'BLOG_POST',
    targetId: updated.id,
    metadata: {
      postId: String(updated.id),
      status: updated.status,
      scheduledAt: updated.scheduledAt,
    },
  });

  return toBlogDto(updated);
};

export const publishBlogPost = async ({ id, actorId }: { id: string; actorId: bigint }) => {
  const existing = await getPostByIdOrThrow(id);
  if (existing.deletedAt) {
    throw new HttpError(400, 'Cannot publish a deleted post', undefined, 'BLOG_POST_DELETED');
  }

  const updated = await prisma.blogPost.update({
    where: { id: toBigIntId(id, 'blog post id') },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: actorId,
      scheduledAt: null,
      deletedAt: null,
      deletedBy: null,
    } satisfies Prisma.BlogPostUncheckedUpdateInput,
    include: includeAuthor,
  });

  await createAdminAuditLog({
    actorUserId: actorId,
    action: 'PUBLISH_POST',
    targetType: 'BLOG_POST',
    targetId: updated.id,
    metadata: {
      postId: String(updated.id),
      status: updated.status,
      publishedAt: updated.publishedAt,
    },
  });

  return toBlogDto(updated);
};

export const scheduleBlogPost = async ({
  id,
  actorId,
  scheduledAt,
}: {
  id: string;
  actorId: bigint;
  scheduledAt: string;
}) => {
  const existing = await getPostByIdOrThrow(id);
  if (existing.deletedAt) {
    throw new HttpError(400, 'Cannot schedule a deleted post', undefined, 'BLOG_POST_DELETED');
  }

  const date = new Date(scheduledAt);
  if (date <= new Date()) {
    throw new HttpError(400, 'scheduledAt must be in the future', undefined, 'BLOG_INVALID_SCHEDULE_TIME');
  }
  const updated = await prisma.blogPost.update({
    where: { id: toBigIntId(id, 'blog post id') },
    data: {
      status: 'SCHEDULED',
      scheduledAt: date,
      publishedAt: null,
      publishedBy: null,
    } satisfies Prisma.BlogPostUncheckedUpdateInput,
    include: includeAuthor,
  });

  await createAdminAuditLog({
    actorUserId: actorId,
    action: 'SCHEDULE_POST',
    targetType: 'BLOG_POST',
    targetId: updated.id,
    metadata: {
      postId: String(updated.id),
      status: updated.status,
      scheduledAt: updated.scheduledAt,
    },
  });

  return toBlogDto(updated);
};

export const softDeleteBlogPost = async ({ id, actorId }: { id: string; actorId: bigint }) => {
  const post = await getPostByIdOrThrow(id);
  await prisma.blogPost.update({
    where: { id: toBigIntId(id, 'blog post id') },
    data: {
      deletedAt: new Date(),
      deletedBy: toBigIntId(actorId, 'actor id'),
    },
  });

  await createAdminAuditLog({
    actorUserId: actorId,
    action: 'DELETE_POST',
    targetType: 'BLOG_POST',
    targetId: post.id,
    metadata: {
      postId: String(post.id),
      title: post.title,
    },
  });
};

export const restoreBlogPost = async ({ id, actorId }: { id: string; actorId: bigint }) => {
  const post = await getPostByIdOrThrow(id);
  // Restore không hồi sinh nguyên trạng mọi status cũ; bài đã xóa chỉ quay về published hoặc draft để tránh resurrect lịch hẹn đã lỗi thời.
  const data = {
    deletedAt: null,
    deletedBy: null,
    status: post.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    publishedAt: post.status === 'PUBLISHED' ? post.publishedAt || new Date() : null,
  } satisfies Prisma.BlogPostUncheckedUpdateInput;
  const updated = await prisma.blogPost.update({
    where: { id: toBigIntId(id, 'blog post id') },
    data,
    include: includeAuthor,
  });

  await createAdminAuditLog({
    actorUserId: actorId,
    action: 'RESTORE_POST',
    targetType: 'BLOG_POST',
    targetId: updated.id,
    metadata: {
      postId: String(updated.id),
      title: updated.title,
      status: updated.status,
    },
  });

  return toBlogDto(updated);
};

const runBulkPostAction = async (ids: string[], action: (id: string) => Promise<unknown>) => {
  // Bulk action trả kết quả từng ID để admin UI vừa tổng hợp được summary vừa chỉ ra item nào fail mà không hủy cả lô.
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const post = await action(id);
        return { id, ok: true, post };
      } catch (error) {
        return { id, ok: false, message: error instanceof Error ? error.message : 'Action failed' };
      }
    }),
  );

  return {
    successCount: results.filter((item) => item.ok).length,
    failureCount: results.filter((item) => !item.ok).length,
    results,
  };
};

export const bulkDeleteBlogPosts = async ({ ids, actorId }: { ids: string[]; actorId: bigint }) =>
  runBulkPostAction(ids, async (id) => {
    await softDeleteBlogPost({ id, actorId });
    const post = await getPostByIdOrNull(id);
    return post ? toBlogDto(post) : null;
  });

export const bulkRestoreBlogPosts = async ({ ids, actorId }: { ids: string[]; actorId: bigint }) =>
  runBulkPostAction(ids, async (id) => restoreBlogPost({ id, actorId }));

export const bulkPublishBlogPosts = async ({ ids, actorId }: { ids: string[]; actorId: bigint }) =>
  runBulkPostAction(ids, async (id) => publishBlogPost({ id, actorId }));

export const previewBlogPost = async ({ id }: { id: string }) => {
  const post = await getPostByIdOrThrow(id);
  return toBlogDto(post);
};

export const blogPostLookup = {
  getPostBySlugOrThrow,
};
