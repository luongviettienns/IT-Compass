/**
 * @file auth.cookies.ts - Helper quản lý refresh token cookie.
 *
 * File này chịu trách nhiệm:
 * - Tạo cookie options chuẩn cho refresh token (httpOnly, sameSite, secure, path).
 * - Set/clear refresh token cookie trên response.
 * - Đọc refresh token từ request cookies.
 *
 * Refresh token chỉ nằm trong cookie httpOnly và bị giới hạn ở path /api/auth
 * để giảm phạm vi bị gửi kèm theo request không liên quan.
 */
import { authConfig } from '../config/auth.js';
// Refresh token chỉ nằm trong cookie httpOnly và bị giới hạn ở path auth để giảm phạm vi bị gửi kèm theo request không liên quan.
const buildCookieOptions = (expiresAt) => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: authConfig.cookieSecure,
    domain: authConfig.cookieDomain,
    path: '/api/auth',
    expires: expiresAt,
});
export const setRefreshCookie = (res, refreshToken, expiresAt) => {
    res.cookie(authConfig.refreshTokenCookieName, refreshToken, buildCookieOptions(expiresAt));
};
export const clearRefreshCookie = (res) => {
    // Khi xóa cookie phải giữ cùng scope/path với lúc set để browser xóa đúng bản ghi cũ.
    res.clearCookie(authConfig.refreshTokenCookieName, {
        ...buildCookieOptions(new Date(0)),
        expires: undefined,
        maxAge: 0,
    });
};
// Đọc token qua helper chung để controller không phụ thuộc trực tiếp vào tên cookie cấu hình.
export const getRefreshTokenFromRequest = (req) => req.cookies?.[authConfig.refreshTokenCookieName] || null;
