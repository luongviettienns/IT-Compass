/**
 * @file env.ts - Quản lý biến môi trường (environment variables) của ứng dụng.
 *
 * File này chịu trách nhiệm:
 * - Đọc và parse file .env bằng dotenv.
 * - Validate và normalize các biến môi trường bắt buộc (DATABASE_URL, JWT_ACCESS_SECRET ở production).
 * - Cung cấp object `env` đã typed an toàn cho toàn bộ ứng dụng sử dụng.
 * - Hỗ trợ giá trị mặc định hợp lý cho môi trường development.
 *
 * Các nhóm cấu hình chính:
 * - Server: port, nodeEnv, requestBodyLimit
 * - Database: databaseUrl
 * - Auth: JWT secret, token TTL, cookie, refresh token
 * - CORS: frontendUrl, allowedOrigins
 * - Upload: kích thước file tối đa
 * - Monitoring: metricsToken
 * - Rate limiting: redisUrl, rateLimitUseRedis
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const envFilePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
dotenv.config({ path: envFilePath });
/**
 * Chuẩn hóa giá trị NODE_ENV, trả về 'development' nếu giá trị không hợp lệ.
 * @param value - Giá trị thô từ process.env.NODE_ENV.
 */
const normalizeNodeEnv = (value) => {
    if (value === 'production' || value === 'staging' || value === 'development' || value === 'test') {
        return value;
    }
    return 'development';
};
/**
 * Parse giá trị boolean từ chuỗi environment variable.
 * @param value - Chuỗi cần parse ('true'/'false').
 * @param fallback - Giá trị mặc định nếu value rỗng.
 */
const parseBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === '')
        return fallback;
    return value === 'true';
};
/**
 * Parse giá trị số nguyên dương từ chuỗi environment variable.
 * @param value - Chuỗi cần parse.
 * @param fallback - Giá trị mặc định nếu parse thất bại.
 */
const parseInteger = (value, fallback) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
/**
 * Yêu cầu biến môi trường phải có giá trị (không rỗng), throw error nếu thiếu.
 * @param value - Giá trị biến môi trường.
 * @param label - Tên biến (dùng trong thông báo lỗi).
 */
const requireString = (value, label) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`Missing required environment variable: ${label}`);
    }
    return value.trim();
};
const nodeEnv = normalizeNodeEnv(process.env.NODE_ENV);
const isProduction = nodeEnv === 'production';
const isStaging = nodeEnv === 'staging';
const isDevelopment = !isProduction && !isStaging;
const frontendUrl = process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
const allowedOrigins = [
    frontendUrl,
    ...(process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
];
/** Object chứa toàn bộ biến môi trường đã được validate, typed và sẵn sàng sử dụng. */
const resolvedEnv = {
    nodeEnv,
    isProduction,
    isStaging,
    isDevelopment,
    port: parseInteger(process.env.PORT, 5000),
    databaseUrl: requireString(process.env.DATABASE_URL, 'DATABASE_URL'),
    frontendUrl,
    allowedOrigins: [...new Set(allowedOrigins)],
    // Dev fallback helps local bootstrapping, but production must always provide a real secret.
    jwtAccessSecret: isProduction
        ? requireString(process.env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET')
        : process.env.JWT_ACCESS_SECRET?.trim() || 'dev-access-secret-change-me',
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL?.trim() || '15m',
    refreshTokenTtlDays: parseInteger(process.env.REFRESH_TOKEN_TTL_DAYS, 30),
    emailVerificationTokenTtlHours: parseInteger(process.env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS, 24),
    passwordResetTokenTtlMinutes: parseInteger(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES, 30),
    authDebugExposeTokens: parseBoolean(process.env.AUTH_DEBUG_EXPOSE_TOKENS, isDevelopment),
    refreshTokenCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME?.trim() || 'it_compass_refresh',
    cookieSecure: isProduction ? true : parseBoolean(process.env.COOKIE_SECURE, false),
    cookieDomain: process.env.COOKIE_DOMAIN?.trim() || undefined,
    requestBodyLimit: process.env.REQUEST_BODY_LIMIT?.trim() || '1mb',
    uploadMaxFileSizeMb: parseInteger(process.env.UPLOAD_MAX_FILE_SIZE_MB, 5),
    metricsToken: process.env.METRICS_TOKEN?.trim() || undefined,
    redisUrl: process.env.REDIS_URL?.trim() || undefined,
    rateLimitUseRedis: parseBoolean(process.env.RATE_LIMIT_USE_REDIS, isProduction || isStaging),
};
export const env = resolvedEnv;
