import { Router } from 'express';

import * as blogController from '../controllers/blog.controller.js';
import { requireActiveUser, requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  adminBlogStatsSchema,
  adminListBlogAuditLogsSchema,
  adminListPostsSchema,
  adminSlugCheckSchema,
  bulkDeleteBlogPostsSchema,
  bulkPublishBlogPostsSchema,
  bulkRestoreBlogPostsSchema,
  createBlogPostSchema,
  deleteBlogPostSchema,
  getBlogPostByIdSchema,
  previewBlogPostSchema,
  publishBlogPostSchema,
  restoreBlogPostSchema,
  scheduleBlogPostSchema,
  updateBlogStatusSchema,
  updateBlogPostSchema,
} from '../validators/blog.validator.js';

const adminBlogRoutes = Router();

adminBlogRoutes.use(requireAuth, requireActiveUser, requireRole('ADMIN'));

adminBlogRoutes.get('/blogs/stats', validate(adminBlogStatsSchema), blogController.adminBlogStats);
adminBlogRoutes.get('/blogs/audit-logs', validate(adminListBlogAuditLogsSchema), blogController.adminListBlogAuditLogs);
adminBlogRoutes.get('/blogs/slug-check', validate(adminSlugCheckSchema), blogController.adminCheckSlug);
adminBlogRoutes.get('/blogs', validate(adminListPostsSchema), blogController.adminListPosts);
adminBlogRoutes.get('/blogs/:id', validate(getBlogPostByIdSchema), blogController.adminGetPostById);
adminBlogRoutes.post('/blogs', validate(createBlogPostSchema), blogController.createBlogPost);
adminBlogRoutes.patch('/blogs/:id', validate(updateBlogPostSchema), blogController.updateBlogPost);
adminBlogRoutes.patch('/blogs/:id/status', validate(updateBlogStatusSchema), blogController.updateBlogPostStatus);
adminBlogRoutes.post('/blogs/:id/publish', validate(publishBlogPostSchema), blogController.publishBlogPost);
adminBlogRoutes.post('/blogs/:id/schedule', validate(scheduleBlogPostSchema), blogController.scheduleBlogPost);
adminBlogRoutes.delete('/blogs/:id', validate(deleteBlogPostSchema), blogController.deleteBlogPost);
adminBlogRoutes.post('/blogs/:id/restore', validate(restoreBlogPostSchema), blogController.restoreBlogPost);
adminBlogRoutes.get('/blogs/:id/preview', validate(previewBlogPostSchema), blogController.previewBlogPost);
adminBlogRoutes.post('/blogs/bulk-delete', validate(bulkDeleteBlogPostsSchema), blogController.bulkDeleteBlogPosts);
adminBlogRoutes.post('/blogs/bulk-restore', validate(bulkRestoreBlogPostsSchema), blogController.bulkRestoreBlogPosts);
adminBlogRoutes.post('/blogs/bulk-publish', validate(bulkPublishBlogPostsSchema), blogController.bulkPublishBlogPosts);

export default adminBlogRoutes;
