/**
 * @file redis.ts - Quản lý kết nối Redis client cho rate limiting.
 *
 * File này chịu trách nhiệm:
 * - Tạo và quản lý kết nối Redis client dạng lazy singleton.
 * - Nếu Redis không được cấu hình hoặc kết nối thất bại, trả về null để
 *   rate limiter tự động fallback sang memory store.
 * - Ghi log trạng thái kết nối để dễ debug.
 */

import { createClient } from 'redis';

import { env } from './env.js';
import { logger } from '../utils/logger.js';

type AppRedisClient = ReturnType<typeof createClient>;

/** Promise được cache để đảm bảo chỉ tạo một kết nối Redis duy nhất. */
let redisClientPromise: Promise<AppRedisClient | null> | undefined;

/**
 * Tạo kết nối Redis client mới.
 * Trả về null nếu Redis URL không được cấu hình hoặc kết nối thất bại.
 */
const createRedisClient = async (): Promise<AppRedisClient | null> => {
  if (!env.rateLimitUseRedis || !env.redisUrl) {
    return null;
  }

  const client = createClient({
    url: env.redisUrl,
  });

  client.on('error', (error) => {
    logger.warn('Redis client error', {
      error,
      feature: 'rate-limit',
    });
  });

  try {
    await client.connect();
    logger.info('Redis client connected', {
      feature: 'rate-limit',
    });
    return client;
  } catch (error) {
    logger.warn('Redis client connection failed, falling back to memory store', {
      error,
      feature: 'rate-limit',
    });
    try {
      await client.disconnect();
    } catch {
      // ignore disconnect errors when initial connect fails
    }
    return null;
  }
};

/**
 * Lấy Redis client (lazy singleton).
 * Lần gọi đầu tiên sẽ tạo kết nối, các lần sau trả về cùng một promise.
 * @returns Redis client hoặc null nếu không khả dụng.
 */
export const getRedisClient = async (): Promise<AppRedisClient | null> => {
  if (!redisClientPromise) {
    redisClientPromise = createRedisClient();
  }

  return redisClientPromise;
};
