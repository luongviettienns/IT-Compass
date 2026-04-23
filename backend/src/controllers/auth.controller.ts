/**
 * @file auth.controller.ts - Controller xử lý các endpoint xác thực người dùng.
 *
 * File này chịu trách nhiệm:
 * - Đăng ký tài khoản mới (register).
 * - Đăng nhập (login) và trả access token + refresh token cookie.
 * - Refresh phiên làm việc (rotate refresh token).
 * - Đăng xuất đơn phiên (logout) và toàn bộ phiên (logoutAll).
 * - Lấy thông tin user hiện tại (/me).
 * - Xác minh email và đặt lại mật khẩu.
 *
 * Controller chỉ làm 3 việc: đọc request → gọi service → đồng bộ refresh token qua cookie.
 * Không chứa logic nghiệp vụ – toàn bộ logic nằm trong auth.service.ts.
 */

import type { Request, Response } from 'express';

import * as authService from '../services/auth.service.js';
import { serializeUser } from '../utils/serializeUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuthenticatedUser } from '../utils/requireUser.js';
import type { ForgotPasswordBody, LoginBody, RegisterBody, ResetPasswordBody, TokenOnlyBody } from '../validators/auth.validator.js';
import { clearRefreshCookie, getRefreshTokenFromRequest, setRefreshCookie } from './auth.cookies.js';

// Gom metadata của request ở controller để service chỉ nhận dữ liệu cần thiết, không phụ thuộc trực tiếp vào Express.
const getRequestMeta = (req: Request) => ({
  userAgent: req.get('user-agent') || null,
  ipAddress: req.ip || null,
});

// Controller auth chủ yếu làm 3 việc: đọc request, gọi service, rồi đồng bộ refresh token qua cookie.
export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as RegisterBody;
  const authResult = await authService.register({
    ...body,
    ...getRequestMeta(req),
  });

  setRefreshCookie(res, authResult.refreshToken, authResult.refreshTokenExpiresAt);

  return res.status(201).json({
    user: authResult.user,
    accessToken: authResult.accessToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LoginBody;
  const authResult = await authService.login({
    ...body,
    ...getRequestMeta(req),
  });

  setRefreshCookie(res, authResult.refreshToken, authResult.refreshTokenExpiresAt);

  return res.status(200).json({
    user: authResult.user,
    accessToken: authResult.accessToken,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  // Thiếu refresh cookie không phải lỗi server; client chỉ cần hiểu là phiên hiện tại không còn hợp lệ.
  if (!refreshToken) {
    clearRefreshCookie(res);
    return res.status(200).json({
      accessToken: null,
      user: null,
    });
  }

  const authResult = await authService.refresh({
    refreshToken,
    ...getRequestMeta(req),
  });

  // Refresh token được rotate sau mỗi lần thành công để phía client luôn giữ phiên mới nhất.
  setRefreshCookie(res, authResult.refreshToken, authResult.refreshTokenExpiresAt);

  return res.status(200).json({
    accessToken: authResult.accessToken,
    user: authResult.user,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  await authService.logout({ refreshToken });
  clearRefreshCookie(res);

  return res.status(200).json({ message: 'Logged out successfully' });
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthenticatedUser(req);
  await authService.logoutAll({ userId: user.id });
  clearRefreshCookie(res);

  return res.status(200).json({ message: 'Logged out from all sessions' });
});

// /me là payload bootstrap chính của frontend sau login/refresh nên luôn trả user đã normalize theo auth contract.
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthenticatedUser(req);
  const profile = await authService.me({ userId: user.id });
  return res.status(200).json({ user: profile });
});

export const verifyEmailRequest = asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthenticatedUser(req);
  const result = await authService.requestVerifyEmail({ userId: user.id });
  return res.status(200).json(result);
});

export const verifyEmailConfirm = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as TokenOnlyBody;
  const result = await authService.confirmVerifyEmail({ token: body.token });
  return res.status(200).json(result);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ForgotPasswordBody;
  const result = await authService.forgotPassword({ email: body.email });
  return res.status(200).json(result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ResetPasswordBody;
  const result = await authService.resetPassword({
    token: body.token,
    newPassword: body.newPassword,
  });

  clearRefreshCookie(res);
  return res.status(200).json(result);
});

export const adminOnlyProbe = asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthenticatedUser(req);

  return res.status(200).json({
    message: 'Admin endpoint access granted',
    user: serializeUser(user),
  });
});
