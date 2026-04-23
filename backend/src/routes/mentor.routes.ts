import { Router } from 'express';

import * as mentorController from '../controllers/mentor.controller.js';
import { requireActiveUser, requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  getMentorBySlugSchema,
  listMentorsSchema,
  mentorProfileSchema,
  updateMentorProfileSchema,
} from '../validators/mentor.validator.js';

const publicMentorRoutes = Router();
const mentorRoutes = Router();

// Public routes phục vụ khám phá mentor và chỉ dùng contract công khai đã được serialize sẵn.
publicMentorRoutes.get('/', validate(listMentorsSchema), mentorController.listMentors);
publicMentorRoutes.get('/:slug', validate(getMentorBySlugSchema), mentorController.getMentorBySlug);

// Self-service mentor bị khóa role MENTOR để dashboard/profile không trở thành API chỉnh sửa chéo vai trò.
mentorRoutes.use(requireAuth, requireActiveUser, requireRole('MENTOR'));
mentorRoutes.get('/profile', validate(mentorProfileSchema), mentorController.getMentorProfile);
mentorRoutes.patch('/profile', validate(updateMentorProfileSchema), mentorController.updateMentorProfile);
mentorRoutes.get('/dashboard', validate(mentorProfileSchema), mentorController.getMentorDashboard);

export { publicMentorRoutes, mentorRoutes };
