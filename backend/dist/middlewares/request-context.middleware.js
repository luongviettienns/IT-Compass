/**
 * @file request-context.middleware.ts - Middleware gán context cho mỗi HTTP request.
 *
 * File này chịu trách nhiệm:
 * - Tạo UUID duy nhất (requestId) cho mỗi request để truy vết log và error.
 * - Ghi nhận thời điểm bắt đầu xử lý request (requestStartedAt) để tính thời gian phản hồi.
 * - Trả requestId trong response header 'x-request-id' để client có thể dùng khi báo lỗi.
 */
import crypto from 'node:crypto';
/**
 * Middleware gán requestId và requestStartedAt cho mỗi request đến.
 * requestId được dùng xuyên suốt trong logging, error response và metrics.
 */
export const requestContext = (req, res, next) => {
    const requestId = crypto.randomUUID();
    req.requestId = requestId;
    req.requestStartedAt = process.hrtime.bigint();
    res.setHeader('x-request-id', requestId);
    return next();
};
