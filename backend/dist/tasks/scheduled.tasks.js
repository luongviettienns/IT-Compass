/**
 * @file scheduled.tasks.ts - Các tác vụ nền được chạy định kỳ bởi scheduler.
 *
 * File này chứa logic nghiệp vụ thực tế của các tác vụ nền:
 * - purgeExpiredAuthData: Dọn dẹp session, token xác minh email, token reset password đã hết hạn.
 * - publishScheduledPosts: Tự động xuất bản bài viết blog đã đến giờ lên lịch.
 *
 * Mỗi hàm đều idempotent và safe to retry.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
/**
 * Dọn dẹp dữ liệu auth đã hết hạn hoặc đã sử dụng.
 * Được gọi định kỳ (mỗi 1 giờ) bởi scheduler.
 *
 * Xóa:
 * - AuthSession: hết hạn hoặc đã bị revoke.
 * - EmailVerificationToken: hết hạn hoặc đã sử dụng.
 * - PasswordResetToken: hết hạn hoặc đã sử dụng.
 *
 * @returns Số lượng bản ghi đã xóa theo từng loại.
 */
export const purgeExpiredAuthData = async () => {
    const now = new Date();
    const [sessions, emailTokens, resetTokens] = await Promise.all([
        prisma.authSession.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: now } },
                    { revokedAt: { not: null } },
                ],
            },
        }),
        prisma.emailVerificationToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: now } },
                    { usedAt: { not: null } },
                ],
            },
        }),
        prisma.passwordResetToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: now } },
                    { usedAt: { not: null } },
                ],
            },
        }),
    ]);
    const total = sessions.count + emailTokens.count + resetTokens.count;
    if (total > 0) {
        logger.info('Purged expired auth data', {
            sessions: sessions.count,
            emailTokens: emailTokens.count,
            resetTokens: resetTokens.count,
        });
    }
    return { sessions: sessions.count, emailTokens: emailTokens.count, resetTokens: resetTokens.count };
};
/**
 * Tự động xuất bản bài viết blog có scheduledAt đã đến.
 * Được gọi định kỳ (mỗi 2 phút) bởi scheduler.
 *
 * Quy trình:
 * 1. Tìm tất cả bài viết status = SCHEDULED và scheduledAt <= now.
 * 2. Cập nhật hàng loạt: status → PUBLISHED, publishedAt = now, scheduledAt = null.
 * 3. Ghi log danh sách bài viết đã xuất bản.
 *
 * @returns Số lượng bài viết đã xuất bản.
 */
export const publishScheduledPosts = async () => {
    const now = new Date();
    const overduePosts = await prisma.blogPost.findMany({
        where: {
            status: 'SCHEDULED',
            scheduledAt: { lte: now },
            deletedAt: null,
        },
        select: { id: true, title: true, scheduledAt: true },
    });
    if (overduePosts.length === 0)
        return { published: 0 };
    const result = await prisma.blogPost.updateMany({
        where: {
            id: { in: overduePosts.map((post) => post.id) },
            status: 'SCHEDULED',
            deletedAt: null,
        },
        data: {
            status: 'PUBLISHED',
            publishedAt: now,
            scheduledAt: null,
        },
    });
    if (result.count > 0) {
        logger.info('Auto-published scheduled posts', {
            count: result.count,
            posts: overduePosts.map((post) => ({ id: String(post.id), title: post.title })),
        });
    }
    return { published: result.count };
};
