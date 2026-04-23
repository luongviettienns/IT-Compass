import type { EmailVerificationToken, PasswordResetToken, Prisma } from '@prisma/client';

import { prisma } from '../db/prisma.js';
import { authConfig } from '../config/auth.js';
import { generateOpaqueToken, hashToken } from '../utils/tokens.js';

const getTokenExpiryDate = (durationMs: number): Date => {
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + durationMs);
  return expiresAt;
};

const getEmailVerificationExpiryDate = (): Date =>
  getTokenExpiryDate(authConfig.emailVerificationTokenTtlHours * 60 * 60 * 1000);

const getPasswordResetExpiryDate = (): Date =>
  getTokenExpiryDate(authConfig.passwordResetTokenTtlMinutes * 60 * 1000);

// Token xác thực chỉ hợp lệ khi hash khớp, chưa bị dùng và vẫn còn trong thời hạn.
const buildActiveVerificationWhere = (token: string): Prisma.EmailVerificationTokenWhereInput => ({
  tokenHash: hashToken(token),
  usedAt: null,
  expiresAt: { gt: new Date() },
});

// Reset token cũng là token một lần dùng nên điều kiện active tương tự verify email.
const buildActiveResetWhere = (token: string): Prisma.PasswordResetTokenWhereInput => ({
  tokenHash: hashToken(token),
  usedAt: null,
  expiresAt: { gt: new Date() },
});

const buildUsedTokenData = () => ({
  usedAt: new Date(),
});

export const createEmailVerificationToken = async (userId: bigint): Promise<string> => {
  // Plain token chỉ xuất hiện đúng lúc tạo để gửi mail; phía DB chỉ giữ hash nhằm giảm blast radius nếu dữ liệu bị lộ.
  const token = generateOpaqueToken();

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: getEmailVerificationExpiryDate(),
    },
  });

  return token;
};

export const findActiveEmailVerificationToken = async (token: string) =>
  prisma.emailVerificationToken.findFirst({
    where: buildActiveVerificationWhere(token),
  });

// Dùng transaction để token và trạng thái verified của user luôn cập nhật cùng nhau.
export const markEmailVerificationUsedAndVerifyUser = async (verification: EmailVerificationToken) =>
  prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: verification.id },
      data: buildUsedTokenData(),
    }),
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

export const createPasswordResetToken = async (userId: bigint): Promise<string> => {
  const token = generateOpaqueToken();

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: getPasswordResetExpiryDate(),
    },
  });

  return token;
};

export const findActivePasswordResetToken = async (token: string) =>
  prisma.passwordResetToken.findFirst({
    where: buildActiveResetWhere(token),
  });

export const consumeResetTokenAndUpdatePassword = async ({
  resetToken,
  passwordHash,
}: {
  resetToken: PasswordResetToken;
  passwordHash: string;
}) =>
  prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: buildUsedTokenData(),
    }),
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    // Đổi mật khẩu phải vô hiệu hóa toàn bộ session cũ để token refresh đang lưu trên thiết bị khác không còn dùng được.
    prisma.authSession.updateMany({
      where: {
        userId: resetToken.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    }),
  ]);
