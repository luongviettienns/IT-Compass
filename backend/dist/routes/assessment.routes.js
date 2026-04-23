import { Router } from 'express';
import * as assessmentController from '../controllers/assessment.controller.js';
import { requireActiveUser, requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { getAdminAssessmentStatsSchema, getAssessmentAttemptByIdSchema, getAssessmentHistorySchema, getCurrentAssessmentTemplateSchema, getLatestAssessmentAttemptSchema, submitAssessmentAttemptSchema, } from '../validators/assessment.validator.js';
const assessmentRoutes = Router();
const adminAssessmentRoutes = Router();
// Template được public, còn submit/history phải khóa phiên vì toàn bộ kết quả assessment đều gắn với hồ sơ cá nhân.
assessmentRoutes.get('/templates/current', validate(getCurrentAssessmentTemplateSchema), assessmentController.getCurrentTemplate);
assessmentRoutes.post('/attempts', requireAuth, requireActiveUser, validate(submitAssessmentAttemptSchema), assessmentController.submitAttempt);
assessmentRoutes.get('/me/latest', requireAuth, requireActiveUser, validate(getLatestAssessmentAttemptSchema), assessmentController.getLatestAttempt);
assessmentRoutes.get('/me/history', requireAuth, requireActiveUser, validate(getAssessmentHistorySchema), assessmentController.getAttemptHistory);
assessmentRoutes.get('/me/:attemptId', requireAuth, requireActiveUser, validate(getAssessmentAttemptByIdSchema), assessmentController.getAttemptById);
// Thống kê assessment quản trị tách nhánh riêng để policy admin không chen vào flow làm quiz của user.
adminAssessmentRoutes.use(requireAuth, requireActiveUser, requireRole('ADMIN'));
adminAssessmentRoutes.get('/assessments/stats', validate(getAdminAssessmentStatsSchema), assessmentController.getAdminAssessmentStats);
export { assessmentRoutes, adminAssessmentRoutes };
