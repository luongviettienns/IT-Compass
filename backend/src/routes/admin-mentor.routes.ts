import { Router } from 'express';

import * as adminMentorController from '../controllers/admin-mentor.controller.js';
import { requireActiveUser, requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  adminCreateMentorSchema,
  adminGetMentorByIdSchema,
  adminListMentorsSchema,
  adminUpdateMentorSchema,
  adminUpdateMentorStatusSchema,
  adminUpdateMentorVerificationSchema,
} from '../validators/admin-mentor.validator.js';

const adminMentorRoutes = Router();

adminMentorRoutes.use(requireAuth, requireActiveUser, requireRole('ADMIN'));
adminMentorRoutes.get('/mentors', validate(adminListMentorsSchema), adminMentorController.adminListMentors);
adminMentorRoutes.get('/mentors/:id', validate(adminGetMentorByIdSchema), adminMentorController.adminGetMentorById);
adminMentorRoutes.post('/mentors', validate(adminCreateMentorSchema), adminMentorController.adminCreateMentor);
adminMentorRoutes.patch('/mentors/:id', validate(adminUpdateMentorSchema), adminMentorController.adminUpdateMentor);
adminMentorRoutes.patch('/mentors/:id/status', validate(adminUpdateMentorStatusSchema), adminMentorController.adminUpdateMentorStatus);
adminMentorRoutes.patch('/mentors/:id/verification', validate(adminUpdateMentorVerificationSchema), adminMentorController.adminUpdateMentorVerification);

export default adminMentorRoutes;
