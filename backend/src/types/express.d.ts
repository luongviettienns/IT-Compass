/**
 * @file express.d.ts - Mở rộng kiểu Request của Express.
 *
 * File này augment (bổ sung) interface Request của Express với các property tùy chỉnh:
 * - user: User đã xác thực (gắn bởi requireAuth middleware).
 * - requestId: UUID duy nhất cho mỗi request (gắn bởi requestContext middleware).
 * - requestStartedAt: Thời điểm bắt đầu xử lý request (dùng tính metrics).
 */

import type { AuthenticatedUser } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      /** User object đã xác thực, gắn bởi requireAuth middleware. Undefined nếu chưa qua auth. */
      user?: AuthenticatedUser;
      /** UUID duy nhất cho request, dùng trong log và error response. */
      requestId?: string;
      /** Thời điểm bắt đầu xử lý request (high-resolution timer), dùng tính thời gian phản hồi. */
      requestStartedAt?: bigint;
    }
  }
}

export {};
