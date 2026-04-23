/**
 * @file tokens.ts - Tiện ích tạo và xác minh token (JWT + opaque token).
 *
 * File này chịu trách nhiệm:
 * - Tạo opaque token (random hex) cho refresh token, verify email, reset password.
 * - Hash opaque token bằng SHA-256 trước khi lưu vào database (bảo mật).
 * - Tạo JWT access token ngắn hạn chứa claim tối thiểu (sub, role, status).
 * - Xác minh (verify) JWT access token từ request header.
 *
 * Phân biệt 2 loại token:
 * - Opaque token: chuỗi ngẫu nhiên, server chỉ lưu hash trong DB, client giữ token thô.
 * - JWT access token: chứa claim, tự xác minh được bằng secret, dùng cho xác thực request.
 */

import crypto from 'node:crypto';

import jwt, { type SignOptions } from 'jsonwebtoken';
import type { User } from '@prisma/client';

import { authConfig } from '../config/auth.js';
import type { AccessTokenPayload } from '../types/auth.js';

/**
 * Tạo opaque token ngẫu nhiên (96 ký tự hex).
 * Dùng cho refresh token, verify email token, reset password token.
 * Opaque token dùng cho refresh/verify/reset vì server chỉ cần so hash trong DB, không cần nhét dữ liệu vào token.
 */
export const generateOpaqueToken = (): string => crypto.randomBytes(48).toString('hex');

/**
 * Hash token bằng SHA-256.
 * Chỉ lưu hash trong DB để lộ dữ liệu bảng token/session cũng không làm lộ token thô phía client đang giữ.
 * @param token - Token thô cần hash.
 * @returns Chuỗi hash hex.
 */
export const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Tạo JWT access token cho user đã xác thực.
 * Access token là JWT ngắn hạn, chỉ mang claim tối thiểu cần cho việc xác thực request.
 *
 * @param user - User object (id, role, status).
 * @returns Chuỗi JWT đã ký.
 */
export const generateAccessToken = (user: Pick<User, 'id' | 'role' | 'status'>): string => {
  const options: SignOptions = {
    expiresIn: authConfig.accessTokenTtl as SignOptions['expiresIn'],
    subject: String(user.id),
  };

  return jwt.sign(
    {
      role: user.role,
      status: user.status,
    },
    authConfig.accessTokenSecret,
    options,
  );
};

/**
 * Xác minh và decode JWT access token.
 * @param token - Chuỗi JWT từ client.
 * @returns Payload chứa sub (userId), role, status.
 * @throws Error nếu token không hợp lệ hoặc đã hết hạn.
 */
export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, authConfig.accessTokenSecret) as AccessTokenPayload;
