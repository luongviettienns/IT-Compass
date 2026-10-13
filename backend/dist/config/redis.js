/**
 * @file redis.ts - Quản lý kết nối Redis client cho rate limiting.
 *
 * File này chịu trách nhiệm:
 * - Tạo và quản lý kết nối Redis client dạng lazy singleton.
 * - Khi bật Redis, lỗi kết nối trả null để limiter từ chối request (503).
 * - Ghi log trạng thái kết nối để dễ debug.
 */
import { createClient } from 'redis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
/** Promise được cache để đảm bảo chỉ tạo một kết nối Redis duy nhất. */
let redisClientPromise;
let retryAfter = 0;
/**
 * Tạo kết nối Redis client mới.
 * Trả về null nếu Redis URL không được cấu hình hoặc kết nối thất bại.
 */
const createRedisClient = async () => {
    if (!env.rateLimitUseRedis || !env.redisUrl) {
        return null;
    }
    const client = createClient({
        url: env.redisUrl,
        disableOfflineQueue: true,
        commandsQueueMaxLength: 128,
        socket: { connectTimeout: 2000, reconnectStrategy: false },
    });
    client.on('error', (error) => {
        logger.warn('Redis client error', {
            error,
            feature: 'rate-limit',
        });
    });
    let timer;
    try {
        // The SDK socket timeout ends at TCP connect; AUTH/CLIENT can still stall.
        await Promise.race([
            client.connect(),
            new Promise((_resolve, reject) => { timer = setTimeout(() => reject(new Error('Redis handshake timeout')), 2000); }),
        ]);
        logger.info('Redis client connected', {
            feature: 'rate-limit',
        });
        return client;
    }
    catch (error) {
        logger.warn('Redis client connection failed; protected requests will be rejected', {
            error,
            feature: 'rate-limit',
        });
        try {
            client.destroy();
        }
        catch {
            // ignore disconnect errors when initial connect fails
        }
        return null;
    }
    finally {
        if (timer)
            clearTimeout(timer);
    }
};
/** A stuck command must not leave a ready connection accepting an endless queue. */
export const invalidateRedisClient = (client) => {
    try {
        client.destroy();
    }
    catch { /* already closed */ }
    redisClientPromise = undefined;
    retryAfter = Date.now() + 5000;
};
/**
 * Lấy Redis client (lazy singleton).
 * Lần gọi đầu tiên sẽ tạo kết nối, các lần sau trả về cùng một promise.
 * @returns Redis client hoặc null nếu không khả dụng.
 */
export const getRedisClient = async () => {
    if (!redisClientPromise) {
        if (Date.now() < retryAfter)
            return null;
        redisClientPromise = createRedisClient();
    }
    const client = await redisClientPromise;
    if (!client?.isReady) {
        // Let a later request attempt recovery instead of caching failure forever.
        redisClientPromise = undefined;
        retryAfter = Date.now() + 5000;
        return null;
    }
    retryAfter = 0;
    return client;
};
