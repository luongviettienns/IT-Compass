import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireActiveUser, requireAdmin, requireAuth } from '../middlewares/auth.middleware.js';
import { authLoginLimiter, authRefreshLimiter, authRegisterLimiter, passwordResetConfirmLimiter, passwordResetRequestLimiter, verifyEmailConfirmLimiter, verifyEmailRequestLimiter, } from '../middlewares/rate-limit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, tokenOnlySchema, } from '../validators/auth.validator.js';
const authRoutes = Router();
// Các route public dùng để tạo phiên mới hoặc hoàn tất flow bằng token một lần dùng.
authRoutes.post('/register', authRegisterLimiter, validate(registerSchema), authController.register);
authRoutes.post('/login', authLoginLimiter, validate(loginSchema), authController.login);
authRoutes.post('/refresh', authRefreshLimiter, authController.refresh);
authRoutes.post('/logout', authController.logout);
authRoutes.post('/verify-email/confirm', verifyEmailConfirmLimiter, validate(tokenOnlySchema), authController.verifyEmailConfirm);
authRoutes.post('/forgot-password', passwordResetRequestLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
authRoutes.post('/reset-password', passwordResetConfirmLimiter, validate(resetPasswordSchema), authController.resetPassword);
// Các route này yêu cầu access token hợp lệ và tài khoản còn ACTIVE.
authRoutes.post('/logout-all', requireAuth, requireActiveUser, authController.logoutAll);
authRoutes.get('/me', requireAuth, requireActiveUser, authController.me);
authRoutes.post('/verify-email/request', requireAuth, requireActiveUser, verifyEmailRequestLimiter, authController.verifyEmailRequest);
// Endpoint nhỏ để test nhanh middleware RBAC admin có đang hoạt động đúng hay không.
authRoutes.get('/rbac/admin-probe', requireAuth, requireActiveUser, requireAdmin, authController.adminOnlyProbe);
export default authRoutes;
