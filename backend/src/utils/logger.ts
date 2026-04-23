/**
 * @file logger.ts - Hệ thống logging JSON có cấu trúc cho ứng dụng.
 *
 * File này chịu trách nhiệm:
 * - Cung cấp logger đơn giản với 3 cấp độ: info, warn, error.
 * - Mỗi log entry được ghi dạng JSON có cấu trúc (timestamp, level, message, metadata).
 * - Tự động serialize BigInt và Error object thành JSON-safe format.
 * - Output tới console (stdout/stderr) để dễ dàng tích hợp với log aggregator.
 */

/** Kiểu metadata tùy chỉnh đi kèm mỗi log entry. */
export type LogMetadata = Record<string, unknown>;

/**
 * Custom JSON replacer xử lý các kiểu dữ liệu đặc biệt:
 * - BigInt: chuyển thành string (JSON.stringify không hỗ trợ BigInt mặc định).
 * - Error: trích xuất name, message, stack, code, statusCode.
 */
const replacer = (_key: string, value: unknown) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Error) {
    const error = value as Error & {
      code?: string;
      statusCode?: number;
    };

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  return value;
};

/**
 * Ghi một log entry ra console dạng JSON.
 * @param level - Cấp độ log (info, warn, error).
 * @param message - Nội dung log.
 * @param metadata - Dữ liệu bổ sung (requestId, userId, ...).
 */
const writeLog = (level: 'info' | 'warn' | 'error', message: string, metadata: LogMetadata = {}) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata,
  };

  const serialized = JSON.stringify(payload, replacer);

  if (level === 'error') {
    console.error(serialized);
    return;
  }

  if (level === 'warn') {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
};

/**
 * Logger chính của ứng dụng.
 * Sử dụng: `logger.info('message', { key: value })`.
 */
export const logger = {
  /** Ghi log thông tin chung. */
  info(message: string, metadata?: LogMetadata) {
    writeLog('info', message, metadata);
  },
  /** Ghi log cảnh báo (lỗi không nghiêm trọng, fallback, ...). */
  warn(message: string, metadata?: LogMetadata) {
    writeLog('warn', message, metadata);
  },
  /** Ghi log lỗi nghiêm trọng. */
  error(message: string, metadata?: LogMetadata) {
    writeLog('error', message, metadata);
  },
};
