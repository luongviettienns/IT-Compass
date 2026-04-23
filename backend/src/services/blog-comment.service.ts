import { type BlogCommentStatus, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { toBigIntId } from '../utils/ids.js';
import { sanitizeRichText, sanitizeSingleLineText } from '../utils/sanitize.js';
import { createAdminAuditLog } from './admin-audit.service.js';
import { includeCommentAdminRelations, includeCommentUser, toCommentDto } from './blog.mapper.js';
import { blogPostLookup } from './blog-post.service.js';

export const listCommentsBySlug = async ({ slug, includeHidden = false }: { slug: string; includeHidden?: boolean }) => {
  // Comment public bám theo contract bài viết public; comment của bài chưa publish không được lộ chỉ vì biết slug.
  const post = await blogPostLookup.getPostBySlugOrThrow(slug, true);
  const comments = await prisma.blogComment.findMany({
    where: {
      postId: post.id,
      deletedAt: null,
      ...(includeHidden ? {} : { status: 'VISIBLE' }),
    } satisfies Prisma.BlogCommentWhereInput,
    include: includeCommentUser,
    orderBy: { createdAt: 'desc' },
  });
  return comments.map(toCommentDto);
};

export const createComment = async ({
  slug,
  userId,
  guestName,
  content,
}: {
  slug: string;
  userId: bigint | null;
  guestName?: string;
  content: string;
}) => {
  const post = await blogPostLookup.getPostBySlugOrThrow(slug, true);
  const created = await prisma.blogComment.create({
    data: {
      postId: post.id,
      userId: userId || null,
      guestName: userId ? null : sanitizeSingleLineText(guestName || 'Khach'),
      content: sanitizeRichText(content),
    },
    include: includeCommentUser,
  });
  return toCommentDto(created);
};

export const adminListComments = async ({
  status = 'all',
  search,
  postId,
  page = 1,
  limit = 20,
}: {
  status?: 'all' | 'deleted' | Lowercase<BlogCommentStatus>;
  search?: string;
  postId?: string;
  page?: number;
  limit?: number;
}) => {
  const normalizedStatus = status === 'visible' ? 'VISIBLE' : status === 'hidden' ? 'HIDDEN' : undefined;
  const trimmedSearch = search?.trim();
  // deleted là lifecycle riêng nên được tách khỏi filter status thường để admin vẫn xem lại lịch sử moderation sau soft delete.
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 20;
  const where = {
    ...(status === 'deleted'
      ? { deletedAt: { not: null } }
      : {
          deletedAt: null,
          ...(status === 'all' ? {} : { status: normalizedStatus }),
        }),
    ...(postId ? { postId: toBigIntId(postId, 'post id') } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { content: { contains: trimmedSearch } },
            { guestName: { contains: trimmedSearch } },
            { user: { fullName: { contains: trimmedSearch } } },
            { post: { title: { contains: trimmedSearch } } },
          ],
        }
      : {}),
  } satisfies Prisma.BlogCommentWhereInput;

  const [total, comments] = await Promise.all([
    prisma.blogComment.count({ where }),
    prisma.blogComment.findMany({
      where,
      include: includeCommentAdminRelations,
      orderBy: { createdAt: 'desc' },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),
  ]);

  return {
    comments: comments.map(toCommentDto),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
    },
  };
};

export const moderateComment = async ({ id, actorId, status }: { id: string; actorId: bigint; status: BlogCommentStatus }) => {
  const commentId = toBigIntId(id, 'comment id');
  const existing = await prisma.blogComment.findUnique({
    where: { id: commentId },
    select: { id: true, status: true, postId: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Comment not found', undefined, 'BLOG_COMMENT_NOT_FOUND');
  }

  const updated = await prisma.blogComment.update({
    where: { id: commentId },
    // Moderation chỉ đổi status, không xóa comment, để admin còn audit được chuỗi quyết định ẩn/hiện.
    data: { status },
    include: includeCommentAdminRelations,
  });

  await createAdminAuditLog({
    actorUserId: actorId,
    action: 'MODERATE_COMMENT',
    targetType: 'BLOG_COMMENT',
    targetId: updated.id,
    metadata: {
      commentId: String(updated.id),
      postId: String(updated.postId),
      previousStatus: existing.status,
      nextStatus: updated.status,
    },
  });

  return toCommentDto(updated);
};

export const deleteComment = async ({ id, actorId }: { id: string; actorId: bigint }) => {
  const commentId = toBigIntId(id, 'comment id');
  const existing = await prisma.blogComment.findUnique({
    where: { id: commentId },
    select: { id: true, postId: true, deletedAt: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Comment not found', undefined, 'BLOG_COMMENT_NOT_FOUND');
  }

  if (existing.deletedAt) {
    throw new HttpError(400, 'Comment already deleted', undefined, 'BLOG_COMMENT_ALREADY_DELETED');
  }

  await prisma.blogComment.update({
    where: { id: commentId },
    data: { deletedAt: new Date(), deletedBy: toBigIntId(actorId, 'actor id') },
  });

  await createAdminAuditLog({
    actorUserId: actorId,
    action: 'DELETE_COMMENT',
    targetType: 'BLOG_COMMENT',
    targetId: existing.id,
    metadata: {
      commentId: String(existing.id),
      postId: String(existing.postId),
    },
  });
};
