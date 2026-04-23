/**
 * @file requireUser.ts - Helper đảm bảo request đã có user xác thực.
 *
 * Trong controller, sau khi đi qua requireAuth middleware, req.user đã được gắn.
 * Tuy nhiên TypeScript vẫn thấy req.user là optional. Hàm này vừa assert type
 * vừa throw 401 nếu đã bị bypass (phòng trường hợp gọi nhầm trước khi qua guard).
 */

import type { Request } from 'express';

import { HttpError } from './httpError.js';

/**
 * Asserts that the current request has an authenticated user attached by requireAuth middleware.
 * Use this in controllers to safely access req.user without nullable checks.
 *
 * @param req - Express Request object.
 * @returns User object (non-null).
 * @throws HttpError 401 nếu chưa có user (user chưa đăng nhập).
 */
export const requireAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new HttpError(401, 'Unauthorized', undefined, 'AUTH_UNAUTHORIZED');
  }

  return req.user;
};
