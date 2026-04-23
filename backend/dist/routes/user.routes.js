import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { requireActiveUser, requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateProfileSchema } from '../validators/user.validator.js';
import { listRecommendedMentorsSchema } from '../validators/mentor.validator.js';
const userRoutes = Router();
// /users chỉ chứa self-service flows nên mọi thao tác đều dựa trên phiên hiện tại thay vì nhận userId từ client.
userRoutes.patch('/profile', requireAuth, requireActiveUser, validate(updateProfileSchema), userController.updateProfile);
userRoutes.get('/me/recommended-mentors', requireAuth, requireActiveUser, validate(listRecommendedMentorsSchema), userController.getRecommendedMentors);
export default userRoutes;
