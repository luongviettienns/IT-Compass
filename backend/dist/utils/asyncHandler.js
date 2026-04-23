/**
 * @file asyncHandler.ts - Wrapper bắt lỗi async cho Express route handler.
 *
 * Express không tự bắt lỗi từ async handler, dẫn đến unhandled rejection.
 * asyncHandler bọc handler async và forward lỗi vào next() để global error handler xử lý.
 *
 * @example
 * ```ts
 * export const getUser = asyncHandler(async (req, res) => {
 *   const user = await userService.getById(req.params.id);
 *   return res.json({ user });
 * });
 * ```
 */
/**
 * Bọc một async route handler để tự động chuyển lỗi reject vào next().
 * Giúp controller không cần try-catch thủ công cho mỗi endpoint.
 *
 * @param handler - Async route handler function.
 * @returns Express RequestHandler có xử lý lỗi.
 */
export const asyncHandler = (handler) => {
    return (req, res, next) => {
        void Promise.resolve(handler(req, res, next)).catch(next);
    };
};
