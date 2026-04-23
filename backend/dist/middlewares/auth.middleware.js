/**
 * @file auth.middleware.ts - Middleware xác thực và phân quyền cho các route.
 *
 * File này chịu trách nhiệm:
 * - Trích xuất và xác minh JWT access token từ Authorization header.
 * - Đọc lại user từ database để đảm bảo dùng trạng thái mới nhất (role, status).
 * - Cung cấp các middleware guard có thể kết hợp: requireAuth, requireActiveUser, requireRole.
 *
 * Luồng xác thực:
 * 1. requireAuth: Xác minh token → đọc user từ DB → gắn vào req.user.
 * 2. requireActiveUser: Kiểm tra user đã có và status = ACTIVE.
 * 3. requireRole: Kiểm tra user có role phù hợp (ADMIN, MENTOR, ...).
 */
import { prisma } from '../db/prisma.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { HttpError } from '../utils/httpError.js';
/**
 * Trích xuất bearer token từ Authorization header.
 * Access token đi qua Authorization header; refresh token được giữ ở cookie và xử lý ở flow riêng.
 * @param authHeader - Giá trị header Authorization (ví dụ: 'Bearer eyJ...').
 * @returns Token string hoặc null nếu không có.
 */
const getBearerToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7).trim();
};
/**
 * Xác minh token và đọc user từ database.
 * JWT chỉ chứng minh token hợp lệ; user vẫn được đọc lại từ DB để lấy trạng thái hiện tại mới nhất.
 * @param authorizationHeader - Giá trị header Authorization.
 * @returns User object từ database.
 * @throws HttpError 401 nếu token thiếu, không hợp lệ, hoặc user không tồn tại.
 */
const getAuthenticatedUser = async (authorizationHeader) => {
    const token = getBearerToken(authorizationHeader);
    if (!token) {
        throw new HttpError(401, 'Missing access token', undefined, 'AUTH_MISSING_ACCESS_TOKEN');
    }
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
        where: { id: BigInt(payload.sub) },
    });
    if (!user) {
        throw new HttpError(401, 'User not found', undefined, 'AUTH_USER_NOT_FOUND');
    }
    return user;
};
/**
 * Middleware yêu cầu request phải có access token hợp lệ.
 * Gắn user object vào req.user nếu xác thực thành công.
 */
export const requireAuth = async (req, _res, next) => {
    try {
        req.user = await getAuthenticatedUser(req.headers.authorization);
        return next();
    }
    catch (error) {
        if (error instanceof HttpError) {
            return next(error);
        }
        return next(new HttpError(401, 'Invalid or expired access token', undefined, 'AUTH_INVALID_ACCESS_TOKEN'));
    }
};
/**
 * Middleware kiểm tra user đã đăng nhập và tài khoản đang ACTIVE.
 * Tách check active khỏi requireAuth để route nào cần token hợp lệ nhưng policy trạng thái riêng vẫn có thể tái sử dụng guard.
 */
export const requireActiveUser = (req, _res, next) => {
    if (!req.user) {
        return next(new HttpError(401, 'Unauthorized', undefined, 'AUTH_UNAUTHORIZED'));
    }
    if (req.user.status !== 'ACTIVE') {
        return next(new HttpError(403, 'Account is not active', undefined, 'AUTH_ACCOUNT_NOT_ACTIVE'));
    }
    return next();
};
/**
 * Tạo middleware kiểm tra role của user.
 * Role guard dựa trên user vừa đọc từ DB nên quyết định quyền luôn bám theo role hiện tại thay vì tin claim cũ trong token.
 * @param allowedRoles - Các role được phép truy cập (ví dụ: 'ADMIN', 'MENTOR').
 * @returns Express middleware function.
 */
export const requireRole = (...allowedRoles) => (req, _res, next) => {
    if (!req.user) {
        return next(new HttpError(401, 'Unauthorized', undefined, 'AUTH_UNAUTHORIZED'));
    }
    if (!allowedRoles.includes(req.user.role)) {
        return next(new HttpError(403, 'Insufficient permissions', undefined, 'AUTH_INSUFFICIENT_PERMISSIONS'));
    }
    return next();
};
/** Middleware tắt cho route chỉ dành cho admin. */
export const requireAdmin = requireRole('ADMIN');
