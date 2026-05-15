/**
 * @file server.ts - Điểm khởi động chính của backend server.
 *
 * File này chịu trách nhiệm:
 * - Khởi tạo Express server trên port được cấu hình.
 * - Kích hoạt bộ lập lịch tác vụ nền (scheduler) khi server sẵn sàng.
 * - Xử lý tắt server một cách an toàn (graceful shutdown) khi nhận tín hiệu SIGINT/SIGTERM,
 *   đảm bảo đóng kết nối database và dừng các tác vụ nền trước khi thoát.
 */

import { createServer } from 'node:http';

import app from './app.js';
import { prisma } from './db/prisma.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startScheduler, stopScheduler } from './tasks/scheduler.js';
import { initializeSocketServer } from './socket/index.js';

/** Khởi tạo HTTP server để Express và Socket.IO dùng chung một port. */
const server = createServer(app);
const io = initializeSocketServer(server);

server.listen(env.port, () => {
  logger.info('Backend server is running', {
    port: env.port,
    environment: env.nodeEnv,
    frontendUrl: env.frontendUrl,
  });

  startScheduler();
});

/**
 * Thực hiện graceful shutdown khi nhận tín hiệu từ hệ điều hành.
 * Quy trình: dừng scheduler → đóng HTTP server → ngắt kết nối Prisma → thoát process.
 * @param signal - Tín hiệu nhận được (SIGINT hoặc SIGTERM).
 */
const shutdown = async (signal: NodeJS.Signals) => {
  logger.warn('Received shutdown signal', { signal });
  stopScheduler();

  io.close(() => {
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Backend server stopped gracefully', { signal });
      process.exit(0);
    });
  });
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
