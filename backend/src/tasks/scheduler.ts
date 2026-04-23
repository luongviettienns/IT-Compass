/**
 * @file scheduler.ts - Bộ lập lịch chạy các tác vụ nền theo chu kỳ.
 *
 * File này chịu trách nhiệm:
 * - Đăng ký danh sách các tác vụ (job) cần chạy định kỳ.
 * - Chạy mỗi job ngay khi server khởi động, sau đó lặp lại theo khoảng thời gian cấu hình.
 * - Bắt và ghi log lỗi nếu job thất bại (không ảnh hưởng tới server).
 * - Dừng toàn bộ job khi server shutdown.
 *
 * Các tác vụ hiện tại:
 * - purge-expired-auth-data: Dọn dẹp session/token hết hạn (mỗi 1 giờ).
 * - publish-scheduled-posts: Tự động xuất bản bài viết đã lên lịch (mỗi 2 phút).
 */

import { logger } from '../utils/logger.js';
import { purgeExpiredAuthData, publishScheduledPosts } from './scheduled.tasks.js';

/** Cấu hình cho một tác vụ nền được lập lịch. */
interface ScheduledJob {
  /** Tên job (dùng trong log). */
  name: string;
  /** Khoảng thời gian giữa các lần chạy (milliseconds). */
  intervalMs: number;
  /** Hàm async thực thi tác vụ. */
  task: () => Promise<unknown>;
  /** Handle của setInterval (để có thể hủy khi shutdown). */
  timer?: ReturnType<typeof setInterval>;
}

/** Danh sách tác vụ nền cần lập lịch. */
const jobs: ScheduledJob[] = [
  {
    name: 'purge-expired-auth-data',
    intervalMs: 60 * 60 * 1000, // mỗi 1 giờ
    task: purgeExpiredAuthData,
  },
  {
    name: 'publish-scheduled-posts',
    intervalMs: 2 * 60 * 1000, // mỗi 2 phút
    task: publishScheduledPosts,
  },
];

/**
 * Thực thi một job đơn lẻ và bắt lỗi nếu thất bại.
 * Lỗi chỉ được ghi log, không throw ra ngoài.
 */
const runJob = async (job: ScheduledJob) => {
  try {
    await job.task();
  } catch (error) {
    logger.error(`Scheduled task failed: ${job.name}`, { error });
  }
};

/**
 * Khởi động bộ lập lịch: chạy tất cả job ngay lập tức, sau đó đặt interval lặp lại.
 * Được gọi từ server.ts khi server đã listen thành công.
 */
export const startScheduler = () => {
  for (const job of jobs) {
    // Run immediately on startup, then repeat on interval.
    void runJob(job);
    job.timer = setInterval(() => void runJob(job), job.intervalMs);

    logger.info(`Scheduled task registered: ${job.name}`, {
      intervalMs: job.intervalMs,
    });
  }
};

/**
 * Dừng toàn bộ tác vụ nền.
 * Được gọi khi server nhận tín hiệu shutdown (SIGINT/SIGTERM).
 */
export const stopScheduler = () => {
  for (const job of jobs) {
    if (job.timer) {
      clearInterval(job.timer);
      job.timer = undefined;
    }
  }

  logger.info('All scheduled tasks stopped');
};
