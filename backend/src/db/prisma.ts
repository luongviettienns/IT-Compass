/**
 * @file prisma.ts - Khởi tạo và quản lý Prisma Client (ORM kết nối database).
 *
 * File này chịu trách nhiệm:
 * - Tạo một instance duy nhất (singleton) của PrismaClient cho toàn bộ ứng dụng.
 * - Trong môi trường development, lưu instance vào globalThis để tránh tạo nhiều
 *   kết nối database khi hot-reload.
 * - Trong production, luôn tạo mới instance để đảm bảo tính ổn định.
 */

import { PrismaClient } from '@prisma/client';

import { env } from '../config/env.js';

interface GlobalForPrisma {
  prisma?: PrismaClient;
}

// Reuse a single Prisma client in development so hot-reload does not open many connections.
const globalForPrisma = globalThis as typeof globalThis & GlobalForPrisma;

/** Prisma Client singleton – dùng chung cho tất cả service/controller trong ứng dụng. */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: env.databaseUrl,
    },
  },
});

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}
