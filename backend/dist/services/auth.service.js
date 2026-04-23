import { prisma } from '../db/prisma.js';
import { authConfig } from '../config/auth.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateAccessToken } from '../utils/tokens.js';
import { serializeUser } from '../utils/serializeUser.js';
import { HttpError } from '../utils/httpError.js';
import { sanitizeEmailAddress, sanitizeSingleLineText } from '../utils/sanitize.js';
import { createSession, findActiveSessionByRefreshToken, revokeAllSessionsForUser, revokeSessionById, revokeSessionByRefreshToken, } from './auth-session.service.js';
import { consumeResetTokenAndUpdatePassword, createEmailVerificationToken, createPasswordResetToken, findActiveEmailVerificationToken, findActivePasswordResetToken, markEmailVerificationUsedAndVerifyUser, } from './auth-token.service.js';
import { getAssessmentSummaryForUser } from './assessment.service.js';
const FORGOT_PASSWORD_RESPONSE = {
    message: 'If the email exists, a reset token has been generated',
};
// Chỉ expose token ở môi trường debug để tiện test thủ công; production không nên trả token ra response.
const withOptionalDebugToken = (token) => authConfig.debugExposeTokens && token ? { token } : {};
// Gom logic cấp access token + refresh session vào một chỗ để register/login/refresh luôn trả cùng format.
const createAuthResponse = async ({ userId, accessTokenUser, userAgent, ipAddress, }) => {
    const accessToken = generateAccessToken(accessTokenUser);
    const { refreshToken, expiresAt } = await createSession({
        userId,
        userAgent,
        ipAddress,
    });
    const serializedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
    });
    if (!serializedUser) {
        throw new HttpError(404, 'User not found', undefined, 'AUTH_USER_NOT_FOUND');
    }
    return {
        accessToken,
        refreshToken,
        refreshTokenExpiresAt: expiresAt,
        user: serializeUser(serializedUser),
    };
};
const findUserByEmail = (email) => prisma.user.findUnique({
    where: { email },
});
const assertActiveUser = (user) => {
    if (user.status !== 'ACTIVE') {
        throw new HttpError(403, 'Account is not active', undefined, 'AUTH_ACCOUNT_NOT_ACTIVE');
    }
};
export const register = async ({ fullName, email, password, role, userAgent, ipAddress }) => {
    // Chuẩn hóa input trước khi chạm DB để tránh lệch dữ liệu vì casing, khoảng trắng hoặc ký tự thừa.
    const sanitizedFullName = sanitizeSingleLineText(fullName);
    const normalizedEmail = sanitizeEmailAddress(email);
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
        throw new HttpError(409, 'Email is already in use', undefined, 'AUTH_EMAIL_ALREADY_IN_USE');
    }
    const passwordHash = await hashPassword(password);
    // Tạo profile rỗng ngay từ đầu để các flow đọc hồ sơ về sau không phải xử lý case thiếu profile.
    const createdUser = await prisma.user.create({
        data: {
            fullName: sanitizedFullName,
            email: normalizedEmail,
            passwordHash,
            role,
            profile: {
                create: {},
            },
        },
    });
    await createEmailVerificationToken(createdUser.id);
    return createAuthResponse({
        userId: createdUser.id,
        accessTokenUser: createdUser,
        userAgent,
        ipAddress,
    });
};
export const login = async ({ email, password, userAgent, ipAddress }) => {
    const normalizedEmail = sanitizeEmailAddress(email);
    const user = await findUserByEmail(normalizedEmail);
    // Gộp lỗi email và password để tránh lộ việc email nào thực sự tồn tại trong hệ thống.
    if (!user) {
        throw new HttpError(401, 'Invalid email or password', undefined, 'AUTH_INVALID_CREDENTIALS');
    }
    assertActiveUser(user);
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new HttpError(401, 'Invalid email or password', undefined, 'AUTH_INVALID_CREDENTIALS');
    }
    return createAuthResponse({
        userId: user.id,
        accessTokenUser: user,
        userAgent,
        ipAddress,
    });
};
export const refresh = async ({ refreshToken, userAgent, ipAddress }) => {
    const existingSession = await findActiveSessionByRefreshToken(refreshToken);
    if (!existingSession || !existingSession.user) {
        throw new HttpError(401, 'Invalid refresh token', undefined, 'AUTH_INVALID_REFRESH_TOKEN');
    }
    assertActiveUser(existingSession.user);
    // Refresh token chỉ được dùng một lần để giảm khả năng replay nếu token cũ bị lộ.
    await revokeSessionById(existingSession.id);
    return createAuthResponse({
        userId: existingSession.user.id,
        accessTokenUser: existingSession.user,
        userAgent,
        ipAddress,
    });
};
export const logout = async ({ refreshToken }) => {
    if (!refreshToken) {
        return;
    }
    await revokeSessionByRefreshToken(refreshToken);
};
// logoutAll áp chính sách revoke toàn bộ thiết bị để frontend không phải tự phân biệt phiên hiện tại hay phiên khác.
export const logoutAll = async ({ userId }) => {
    await revokeAllSessionsForUser(userId);
};
export const me = async ({ userId }) => {
    // Endpoint me trả thêm assessment summary để frontend có đủ dữ liệu hồ sơ ngay sau khi xác thực.
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            profile: true,
        },
    });
    if (!user) {
        throw new HttpError(404, 'User not found', undefined, 'AUTH_USER_NOT_FOUND');
    }
    const assessment = await getAssessmentSummaryForUser({ userId });
    return {
        ...serializeUser(user),
        assessment,
    };
};
export const requestVerifyEmail = async ({ userId }) => {
    const token = await createEmailVerificationToken(userId);
    return {
        message: 'Verification token created',
        ...withOptionalDebugToken(token),
    };
};
export const confirmVerifyEmail = async ({ token }) => {
    const verification = await findActiveEmailVerificationToken(token);
    if (!verification) {
        throw new HttpError(400, 'Invalid or expired verification token', undefined, 'AUTH_INVALID_VERIFY_EMAIL_TOKEN');
    }
    await markEmailVerificationUsedAndVerifyUser(verification);
    return { message: 'Email verified successfully' };
};
export const forgotPassword = async ({ email }) => {
    const normalizedEmail = sanitizeEmailAddress(email);
    const user = await findUserByEmail(normalizedEmail);
    // Luôn trả về cùng một message để không lộ email nào đang tồn tại hay trạng thái xác thực của tài khoản.
    if (!user || !user.emailVerifiedAt) {
        return FORGOT_PASSWORD_RESPONSE;
    }
    const token = await createPasswordResetToken(user.id);
    return {
        ...FORGOT_PASSWORD_RESPONSE,
        ...withOptionalDebugToken(token),
    };
};
export const resetPassword = async ({ token, newPassword }) => {
    // Reset password chỉ thành công với token còn active; phần revoke toàn bộ session cũ diễn ra ở auth-token service.
    const resetToken = await findActivePasswordResetToken(token);
    if (!resetToken) {
        throw new HttpError(400, 'Invalid or expired reset token', undefined, 'AUTH_INVALID_RESET_PASSWORD_TOKEN');
    }
    const passwordHash = await hashPassword(newPassword);
    await consumeResetTokenAndUpdatePassword({ resetToken, passwordHash });
    return { message: 'Password reset successful' };
};
