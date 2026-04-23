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

/** Interface mô tả toàn bộ cấu hình auth của ứng dụng. */
export interface AuthConfig {
  /** Secret key dùng để ký JWT access token. */
  accessTokenSecret: string;
  /** Thời gian sống của access token (ví dụ: '15m'). */
  accessTokenTtl: string;
  /** Số ngày tồn tại của refresh token. */
  refreshTokenTtlDays: number;
  /** Số giờ tồn tại của token xác minh email. */
  emailVerificationTokenTtlHours: number;
  /** Số phút tồn tại của token đặt lại mật khẩu. */
  passwordResetTokenTtlMinutes: number;
  /** Cho phép expose token thô trong response (chỉ dùng khi debug dev). */
  debugExposeTokens: boolean;
  /** Tên cookie chứa refresh token. */
  refreshTokenCookieName: string;
  /** Cookie có yêu cầu HTTPS không (bật ở production). */
  cookieSecure: boolean;
  /** Domain của cookie (nếu cần cross-subdomain). */
  cookieDomain?: string;
  /** URL frontend để tạo link trong email (verify, reset password). */
  frontendUrl: string;
  /** Danh sách origin được phép gọi API (CORS whitelist). */
  allowedOrigins: string[];
  /** Các regex pattern cho phép origin dev local mà không cần đăng ký cụ thể. */
  localDevOriginPatterns: RegExp[];
}

/** Regex pattern cho phép localhost và 127.0.0.1 trên bất kỳ port 4-5 chữ số nào. */
const localDevOriginPatterns: RegExp[] = [
  /^http:\/\/localhost:\d{4,5}$/,
  /^http:\/\/127\.0\.0\.1:\d{4,5}$/,
];

/** Object cấu hình auth tập trung, được sử dụng bởi middleware, service và controller. */
export const authConfig: AuthConfig = {
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
