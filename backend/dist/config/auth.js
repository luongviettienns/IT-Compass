/**
 * @file auth.ts - Cấu hình xác thực (authentication) tập trung.
 *
 * File này chịu trách nhiệm:
 * - Gom toàn bộ cấu hình liên quan đến auth (JWT, cookie, token TTL, CORS origins)
 *   từ biến môi trường vào một object duy nhất.
 * - Cung cấp interface AuthConfig cho các module khác tham chiếu.
 * - Định nghĩa pattern regex cho phép origin dev local (localhost:*).
 */
import { env } from './env.js';
/** Regex pattern cho phép localhost và 127.0.0.1 trên bất kỳ port 4-5 chữ số nào. */
const localDevOriginPatterns = [
    /^http:\/\/localhost:\d{4,5}$/,
    /^http:\/\/127\.0\.0\.1:\d{4,5}$/,
];
/** Object cấu hình auth tập trung, được sử dụng bởi middleware, service và controller. */
export const authConfig = {
    accessTokenSecret: env.jwtAccessSecret,
    accessTokenTtl: env.accessTokenTtl,
    refreshTokenTtlDays: env.refreshTokenTtlDays,
    emailVerificationTokenTtlHours: env.emailVerificationTokenTtlHours,
    passwordResetTokenTtlMinutes: env.passwordResetTokenTtlMinutes,
    debugExposeTokens: env.authDebugExposeTokens,
    refreshTokenCookieName: env.refreshTokenCookieName,
    cookieSecure: env.cookieSecure,
    cookieDomain: env.cookieDomain,
    frontendUrl: env.frontendUrl,
    allowedOrigins: env.allowedOrigins,
    localDevOriginPatterns,
};
