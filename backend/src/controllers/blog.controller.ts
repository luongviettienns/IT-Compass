/**
 * @file blog.controller.ts - Controller xử lý toàn bộ endpoint liên quan đến blog.
 *
 * File này chịu trách nhiệm:
 * - API công khai: liệt kê bài viết đã xuất bản, xem chi tiết theo slug, bình luận.
 * - API quản trị (admin): CRUD bài viết, xuất bản/lên lịch, xóa mềm/khôi phục,
 *   thao tác hàng loạt (bulk delete/restore/publish), kiểm tra slug, kiểm duyệt bình luận.
 * - API audit: xem lịch sử thay đổi blog (audit logs).
 *
 * Controller chỉ parse request và gọi service, không chứa logic nghiệp vụ.
 */

import type { BlogCommentStatus, BlogPostStatus } from '@prisma/client';
import type { Request, Response } from 'express';

import * as blogService from '../services/blog.service.js';
import { listAdminAuditLogs } from '../services/admin-audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuthenticatedUser } from '../utils/requireUser.js';

const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);
const asBlogPostStatus = (value: unknown): BlogPostStatus | undefined =>
  value === 'DRAFT' || value === 'SCHEDULED' || value === 'PUBLISHED' ? value : undefined;
const asCommentListStatus = (value: unknown): 'all' | 'deleted' | 'visible' | 'hidden' | undefined =>
  value === 'all' || value === 'deleted' || value === 'visible' || value === 'hidden' ? value : undefined;
// Controller blog chỉ parse dữ liệu ở biên Express; toàn bộ publish/schedule/delete lifecycle nằm ở service layer.
const asNumber = (value: unknown): number | undefined => (typeof value === 'number' ? value : undefined);

export const listPublishedPosts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, unknown>;
  const result = await blogService.listPublishedPosts({
    page: Number(query.page) || undefined,
    limit: Number(query.limit) || undefined,
  });
  return res.status(200).json(result);
});

export const getPublishedPostBySlug = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.getPublishedPostBySlug({ slug: String(req.params.slug) });
  return res.status(200).json({ post });
});

export const createBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  const body = req.body as Record<string, unknown>;
  const post = await blogService.createBlogPost({
    authorId: actor.id,
    title: asString(body.title),
    excerpt: asString(body.excerpt),
    content: asString(body.content),
    tag: asString(body.tag),
    coverImageUrl: asString(body.coverImageUrl),
    readTimeText: asString(body.readTimeText),
    status: asBlogPostStatus(body.status),
    scheduledAt: asString(body.scheduledAt),
    isFeatured: typeof body.isFeatured === 'boolean' ? body.isFeatured : undefined,
    metaTitle: asString(body.metaTitle),
    metaDescription: asString(body.metaDescription),
    canonicalUrl: asString(body.canonicalUrl),
    ogImageUrl: asString(body.ogImageUrl),
    noIndex: typeof body.noIndex === 'boolean' ? body.noIndex : undefined,
    keywords: asString(body.keywords),
  });
  return res.status(201).json({ post });
});

export const adminListPosts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, unknown>;
  const result = await blogService.adminListPosts({
    status: asString(query.status),
    search: asString(query.search),
    page: asNumber(query.page),
    limit: asNumber(query.limit),
    sortBy: asString(query.sortBy),
    sortOrder: asString(query.sortOrder),
  });
  return res.status(200).json(result);
});

export const adminBlogStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await blogService.adminBlogStats();
  return res.status(200).json({ stats });
});

export const adminListBlogAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const result = await listAdminAuditLogs(req.query as Record<string, unknown>);
  return res.status(200).json(result);
});

export const adminCheckSlug = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, unknown>;
  const result = await blogService.adminCheckSlug({
    title: asString(query.title),
    slug: asString(query.slug),
    excludeId: asString(query.excludeId),
  });
  return res.status(200).json(result);
});

export const adminListComments = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, unknown>;
  const result = await blogService.adminListComments({
    status: asCommentListStatus(query.status),
    search: asString(query.search),
    postId: asString(query.postId),
    page: asNumber(query.page),
    limit: asNumber(query.limit),
  });
  return res.status(200).json(result);
});

export const adminGetPostById = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.adminGetPostById({ id: String(req.params.id) });
  return res.status(200).json({ post });
});

export const updateBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  const body = req.body as Record<string, unknown>;
  const post = await blogService.updateBlogPost({
    id: String(req.params.id),
    actorId: actor.id,
    title: asString(body.title),
    excerpt: asString(body.excerpt),
    content: asString(body.content),
    tag: asString(body.tag),
    coverImageUrl: asString(body.coverImageUrl),
    readTimeText: asString(body.readTimeText),
    status: asBlogPostStatus(body.status),
    scheduledAt: asString(body.scheduledAt),
    isFeatured: typeof body.isFeatured === 'boolean' ? body.isFeatured : undefined,
    metaTitle: asString(body.metaTitle),
    metaDescription: asString(body.metaDescription),
    canonicalUrl: asString(body.canonicalUrl),
    ogImageUrl: asString(body.ogImageUrl),
    noIndex: typeof body.noIndex === 'boolean' ? body.noIndex : undefined,
    keywords: asString(body.keywords),
  });
  return res.status(200).json({ post });
});

export const updateBlogPostStatus = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  const body = req.body as { status: BlogPostStatus; scheduledAt?: string };
  const post = await blogService.updateBlogPostStatus({
    id: String(req.params.id),
    actorId: actor.id,
    status: body.status,
    scheduledAt: body.scheduledAt,
  });
  return res.status(200).json({ post });
});

export const publishBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  const post = await blogService.publishBlogPost({
    id: String(req.params.id),
    actorId: actor.id,
  });
  return res.status(200).json({ post });
});

export const scheduleBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  const body = req.body as { scheduledAt: string };
  const post = await blogService.scheduleBlogPost({
    id: String(req.params.id),
    actorId: actor.id,
    scheduledAt: body.scheduledAt,
  });
  return res.status(200).json({ post });
});

export const deleteBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  await blogService.softDeleteBlogPost({ id: String(req.params.id), actorId: actor.id });
  return res.status(200).json({ message: 'Deleted' });
});

export const restoreBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  const post = await blogService.restoreBlogPost({ id: String(req.params.id), actorId: actor.id });
  return res.status(200).json({ post });
});

export const bulkDeleteBlogPosts = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  const body = req.body as Record<string, unknown>;
  const result = await blogService.bulkDeleteBlogPosts({
    ids: asStringArray(body.ids),
    actorId: actor.id,
  });
  return res.status(200).json(result);
});

export const bulkRestoreBlogPosts = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  const body = req.body as Record<string, unknown>;
  const result = await blogService.bulkRestoreBlogPosts({
    ids: asStringArray(body.ids),
    actorId: actor.id,
  });
  return res.status(200).json(result);
});

export const bulkPublishBlogPosts = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  const body = req.body as Record<string, unknown>;
  const result = await blogService.bulkPublishBlogPosts({
    ids: asStringArray(body.ids),
    actorId: actor.id,
  });
  return res.status(200).json(result);
});

export const previewBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.previewBlogPost({ id: String(req.params.id) });
  return res.status(200).json({ post });
});

export const listCommentsBySlug = asyncHandler(async (req: Request, res: Response) => {
  const comments = await blogService.listCommentsBySlug({ slug: String(req.params.slug) });
  return res.status(200).json({ comments });
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { guestName?: string; content: string };
  // Guest và user đăng nhập dùng cùng handler; service sẽ tự quyết định ưu tiên userId hay guestName theo trạng thái phiên.
  const comment = await blogService.createComment({
    slug: String(req.params.slug),
    userId: req.user?.id || null,
    guestName: body.guestName,
    content: body.content,
  });
  return res.status(201).json({ comment });
});

export const moderateComment = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  const body = req.body as { status: BlogCommentStatus };
  const comment = await blogService.moderateComment({
    id: String(req.params.id),
    actorId: actor.id,
    status: body.status,
  });
  return res.status(200).json({ comment });
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireAuthenticatedUser(req);
  await blogService.deleteComment({
    id: String(req.params.id),
    actorId: actor.id,
  });
  return res.status(200).json({ message: 'Comment deleted' });
});
