/**
 * @file server.ts - Điểm khởi động chính của backend server.
 *
 * File này chịu trách nhiệm:
 * - Khởi tạo Express server trên port được cấu hình.
 * - Kích hoạt bộ lập lịch tác vụ nền (scheduler) khi server sẵn sàng.
 * - Xử lý tắt server một cách an toàn (graceful shutdown) khi nhận tín hiệu SIGINT/SIGTERM,
 *   đảm bảo đóng kết nối database và dừng các tác vụ nền trước khi thoát.
 */
import app from './app.js';
import { prisma } from './db/prisma.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startScheduler, stopScheduler } from './tasks/scheduler.js';
/** Khởi tạo HTTP server và bắt đầu lắng nghe kết nối trên port cấu hình. */
const server = app.listen(env.port, () => {
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
const shutdown = async (signal) => {
    logger.warn('Received shutdown signal', { signal });
    stopScheduler();
    server.close(async () => {
        await prisma.$disconnect();
        logger.info('Backend server stopped gracefully', { signal });
        process.exit(0);
    });
};
process.on('SIGINT', () => {
    void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});
