import { Router } from 'express';

import adminBlogRoutes from './admin-blog.routes.js';
import adminCommentRoutes from './admin-comment.routes.js';
import publicBlogRoutes from './public-blog.routes.js';

const blogRoutes = publicBlogRoutes;
const adminRoutes = Router();
adminRoutes.use(adminBlogRoutes);
adminRoutes.use('/comments', adminCommentRoutes);

export { blogRoutes, adminRoutes as adminBlogRoutes };
