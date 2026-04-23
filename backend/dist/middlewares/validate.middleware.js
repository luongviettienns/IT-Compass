/**
 * @file validate.middleware.ts - Middleware validate request body/query/params bằng Zod.
 *
 * File này chịu trách nhiệm:
 * - Nhận một Zod schema và tạo middleware Express tương ứng.
 * - Validate đồng thời body, query, params của request.
 * - Nếu hợp lệ: ghi đè lại req.body/query/params bằng dữ liệu đã parse (đảm bảo typed).
 * - Nếu không hợp lệ: trả HttpError 400 kèm chi tiết từng field lỗi.
 */
import { HttpError } from '../utils/httpError.js';
/**
 * Tạo middleware validate request theo Zod schema.
 * Parse body, query, params cùng lúc và trả lỗi chi tiết nếu validation thất bại.
 *
 * @param schema - Zod schema mô tả cấu trúc dữ liệu mong đợi.
 * @returns Express middleware function.
 *
 * @example
 * ```ts
 * router.post('/users', validate(createUserSchema), controller.createUser);
 * ```
 */
export const validate = (schema) => (req, _res, next) => {
    const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
    });
    if (!result.success) {
        return next(new HttpError(400, 'Validation failed', result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        })), 'VALIDATION_FAILED'));
    }
    // Ghi đè lại dữ liệu đã được parse và transform để downstream handler nhận đúng kiểu.
    if (result.data.body) {
        req.body = result.data.body;
    }
    if (result.data.query) {
        Object.assign(req.query, result.data.query);
    }
    if (result.data.params) {
        req.params = result.data.params;
    }
    return next();
};
