import { prisma } from '../db/prisma.js';
import { authConfig } from '../config/auth.js';
import { generateOpaqueToken, hashToken } from '../utils/tokens.js';
const getRefreshExpiryDate = () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + authConfig.refreshTokenTtlDays);
    return expiresAt;
};
// Một session chỉ còn active khi token hash khớp, chưa bị revoke và chưa hết hạn.
const buildActiveSessionWhere = (refreshToken) => ({
    tokenHash: hashToken(refreshToken),
    revokedAt: null,
    expiresAt: { gt: new Date() },
});
// Gom payload revoke vào helper để mọi flow vô hiệu hóa session đều đóng dấu theo cùng một chuẩn.
const buildRevocationData = () => ({
    revokedAt: new Date(),
});
export const createSession = async ({ userId, userAgent, ipAddress }) => {
    const refreshToken = generateOpaqueToken();
    const expiresAt = getRefreshExpiryDate();
    // Chỉ lưu hash để việc lộ bảng session cũng không làm lộ refresh token dạng thô.
    await prisma.authSession.create({
        data: {
            userId,
            tokenHash: hashToken(refreshToken),
            userAgent,
            ipAddress,
            expiresAt,
        },
    });
    return { refreshToken, expiresAt };
};
export const findActiveSessionByRefreshToken = async (refreshToken) => prisma.authSession.findFirst({
    where: buildActiveSessionWhere(refreshToken),
    include: {
        user: true,
    },
});
export const revokeSessionById = async (sessionId) => prisma.authSession.update({
    where: { id: sessionId },
    data: buildRevocationData(),
});
export const revokeSessionByRefreshToken = async (refreshToken) => prisma.authSession.updateMany({
    where: {
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
    },
    data: buildRevocationData(),
});
export const revokeAllSessionsForUser = async (userId) => prisma.authSession.updateMany({
    where: {
        userId,
        revokedAt: null,
    },
    data: buildRevocationData(),
});
