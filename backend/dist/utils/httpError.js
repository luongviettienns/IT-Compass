/**
 * @file httpError.ts - Class lỗi HTTP tùy chỉnh dùng cho toàn bộ ứng dụng.
 *
 * File này chịu trách nhiệm:
 * - Định nghĩa HttpError class kế thừa Error với statusCode, error code và details.
 * - Ánh xạ status code phổ biến sang error code mặc định (400 → BAD_REQUEST, 404 → NOT_FOUND, ...).
 * - Cung cấp phương thức toResponseBody() để serialize lỗi thành JSON response chuẩn.
 * - Export helper isHttpError() để kiểm tra kiểu lỗi trong global error handler.
 */
/** Ánh xạ mặc định từ HTTP status code sang error code. */
const DEFAULT_ERROR_CODES = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_SERVER_ERROR',
};
/**
 * Class lỗi HTTP tùy chỉnh cho ứng dụng.
 * Mỗi khi cần trả lỗi, throw new HttpError(statusCode, message) để global error handler xử lý.
 *
 * @example
 * ```ts
 * throw new HttpError(404, 'User not found', undefined, 'USER_NOT_FOUND');
 * ```
 */
export class HttpError extends Error {
    /** HTTP status code (400, 401, 403, 404, 500, ...). */
    statusCode;
    /** Chi tiết bổ sung (ví dụ: danh sách field lỗi). */
    details;
    /** Mã lỗi dạng string để client xử lý logic (ví dụ: 'AUTH_UNAUTHORIZED'). */
    code;
    constructor(statusCode, message, details, code) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.details = details;
        this.code = code || DEFAULT_ERROR_CODES[statusCode] || 'REQUEST_FAILED';
    }
    /**
     * Serialize lỗi thành object JSON chuẩn để trả về cho client.
     * @param requestId - ID của request (để client/log truy vết).
     */
    toResponseBody(requestId) {
        return {
            message: this.message,
            code: this.code,
            details: this.details,
            requestId,
        };
    }
}
/**
 * Type guard kiểm tra xem một error có phải là HttpError không.
 * Dùng trong global error handler để phân biệt lỗi nghiệp vụ và lỗi hệ thống.
 */
export const isHttpError = (error) => error instanceof HttpError;
