/**
 * @file appError.ts - Hệ thống xử lý lỗi tập trung cho frontend.
 *
 * File này chịu trách nhiệm:
 * - Định nghĩa AppError class tùy chỉnh (kế thừa Error, thêm status, code, details).
 * - Ánh xạ error code/message từ backend sang tiếng Việt (i18n lỗi).
 * - Phát hiện lỗi session expired (token hết hạn) dạng chuẩn hóa.
 * - Cung cấp helper: getErrorMessage (lấy thông báo lỗi), shouldRetryRequest (quyết định retry),
 *   logError (ghi log trong dev mode).
 * - createAppError: tạo AppError từ HTTP response + payload.
 */

export const AUTH_SESSION_EXPIRED_CODE = 'AUTH_SESSION_EXPIRED';
export const AUTH_SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

const AUTH_SESSION_EXPIRED_SOURCE_CODES = new Set([
  'AUTH_MISSING_ACCESS_TOKEN',
  'AUTH_INVALID_ACCESS_TOKEN',
  'AUTH_UNAUTHORIZED',
  'AUTH_USER_NOT_FOUND',
  'AUTH_INVALID_REFRESH_TOKEN',
]);

const ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  AUTH_SESSION_EXPIRED: AUTH_SESSION_EXPIRED_MESSAGE,
  AUTH_MISSING_ACCESS_TOKEN: AUTH_SESSION_EXPIRED_MESSAGE,
  AUTH_INVALID_ACCESS_TOKEN: AUTH_SESSION_EXPIRED_MESSAGE,
  AUTH_UNAUTHORIZED: AUTH_SESSION_EXPIRED_MESSAGE,
  AUTH_USER_NOT_FOUND: AUTH_SESSION_EXPIRED_MESSAGE,
  AUTH_INVALID_REFRESH_TOKEN: AUTH_SESSION_EXPIRED_MESSAGE,
  AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  AUTH_ACCOUNT_NOT_ACTIVE: 'Tài khoản của bạn chưa được kích hoạt.',
  AUTH_EMAIL_ALREADY_IN_USE: 'Email này đã được sử dụng.',
  AUTH_INVALID_VERIFY_EMAIL_TOKEN: 'Liên kết xác minh email không hợp lệ hoặc đã hết hạn.',
  AUTH_INVALID_RESET_PASSWORD_TOKEN: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
  AUTH_INSUFFICIENT_PERMISSIONS: 'Bạn không có quyền thực hiện thao tác này.',
  AUTH_REGISTER_RATE_LIMITED: 'Bạn đăng ký quá nhiều lần. Vui lòng thử lại sau.',
  AUTH_LOGIN_RATE_LIMITED: 'Bạn đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  AUTH_REFRESH_RATE_LIMITED: 'Hệ thống đang làm mới phiên quá nhiều lần. Vui lòng thử lại sau ít phút.',
  AUTH_PASSWORD_RESET_REQUEST_RATE_LIMITED: 'Bạn yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau.',
  AUTH_PASSWORD_RESET_CONFIRM_RATE_LIMITED: 'Bạn thử đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau.',
  AUTH_VERIFY_EMAIL_REQUEST_RATE_LIMITED: 'Bạn yêu cầu gửi email xác minh quá nhiều lần. Vui lòng thử lại sau.',
  AUTH_VERIFY_EMAIL_CONFIRM_RATE_LIMITED: 'Bạn xác minh email quá nhiều lần. Vui lòng thử lại sau.',
  VALIDATION_FAILED: 'Dữ liệu gửi lên không hợp lệ.',
  UPLOAD_IMAGE_REQUIRED: 'Vui lòng chọn ảnh để tải lên.',
  UPLOAD_INVALID_IMAGE_TYPE: 'Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.',
  BLOG_AUTHOR_NOT_FOUND: 'Không tìm thấy tác giả.',
  BLOG_POST_DELETED: 'Bài viết này đã bị xóa.',
  BLOG_INVALID_SCHEDULE_TIME: 'Thời gian lên lịch phải ở tương lai.',
  BLOG_COMMENT_NOT_FOUND: 'Không tìm thấy bình luận.',
  BLOG_COMMENT_ALREADY_DELETED: 'Bình luận này đã bị xóa.',
  USER_NOT_FOUND: 'Không tìm thấy người dùng.',
  DB_NOT_READY: 'Hệ thống chưa sẵn sàng. Vui lòng thử lại sau.',
  METRICS_FORBIDDEN: 'Bạn không có quyền truy cập tài nguyên này.',
};

const ERROR_MESSAGE_BY_TEXT: Record<string, string> = {
  'Invalid email or password': 'Email hoặc mật khẩu không đúng.',
  'Account is not active': 'Tài khoản của bạn chưa được kích hoạt.',
  'Email is already in use': 'Email này đã được sử dụng.',
  'Invalid refresh token': AUTH_SESSION_EXPIRED_MESSAGE,
  'Invalid or expired verification token': 'Liên kết xác minh email không hợp lệ hoặc đã hết hạn.',
  'Invalid or expired reset token': 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
  'Missing access token': AUTH_SESSION_EXPIRED_MESSAGE,
  'Invalid or expired access token': AUTH_SESSION_EXPIRED_MESSAGE,
  Unauthorized: AUTH_SESSION_EXPIRED_MESSAGE,
  'User not found': 'Không tìm thấy người dùng.',
  'Insufficient permissions': 'Bạn không có quyền thực hiện thao tác này.',
  'Validation failed': 'Dữ liệu gửi lên không hợp lệ.',
  'Too many requests, please try again later.': 'Bạn thao tác quá nhiều. Vui lòng thử lại sau.',
  'Image file is required': 'Vui lòng chọn ảnh để tải lên.',
  'Only JPG, PNG, WEBP, or GIF images are allowed': 'Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.',
  'Database is not ready': 'Hệ thống chưa sẵn sàng. Vui lòng thử lại sau.',
  Forbidden: 'Bạn không có quyền truy cập tài nguyên này.',
  'Blog post not found': 'Không tìm thấy bài viết.',
  'Could not create slug': 'Không thể tạo slug.',
  'Could not generate a valid slug': 'Không thể tạo slug hợp lệ.',
  'title or slug is required': 'Vui lòng nhập tiêu đề hoặc slug.',
  'Comment not found': 'Không tìm thấy bình luận.',
  'Comment already deleted': 'Bình luận này đã bị xóa.',
  'Author not found': 'Không tìm thấy tác giả.',
  'Cannot edit a deleted post': 'Không thể chỉnh sửa bài viết đã xóa.',
  'Cannot change status of a deleted post': 'Không thể đổi trạng thái bài viết đã xóa.',
  'Cannot publish a deleted post': 'Không thể xuất bản bài viết đã xóa.',
  'Cannot schedule a deleted post': 'Không thể lên lịch cho bài viết đã xóa.',
  'scheduledAt must be in the future': 'Thời gian lên lịch phải ở tương lai.',
  'scheduledAt is required when status is SCHEDULED': 'Vui lòng chọn thời gian lên lịch.',
  'Expected exactly one admin account in the system': 'Hệ thống phải có đúng một tài khoản admin.',
  'Cannot modify the only admin account': 'Không thể chỉnh sửa tài khoản admin duy nhất.',
  'User already has this role': 'Người dùng đã có vai trò này.',
  'Assessment attempt not found': 'Không tìm thấy lượt làm bài.',
  'Unable to score assessment': 'Không thể chấm điểm bài đánh giá lúc này.',
  'Upload failed': 'Tải ảnh thất bại.',
  'Request failed': 'Yêu cầu không thành công.',
};

const translateDynamicErrorMessage = (message: string) => {
  if (message.startsWith('Missing answer for ')) {
    return `Thiếu câu trả lời cho ${message.slice('Missing answer for '.length)}.`;
  }

  return message;
};

const translateErrorMessage = (message: string, code?: string) => {
  const normalizedMessage = message.trim();

  if (code && ERROR_MESSAGE_BY_CODE[code]) {
    return ERROR_MESSAGE_BY_CODE[code];
  }

  if (ERROR_MESSAGE_BY_TEXT[normalizedMessage]) {
    return ERROR_MESSAGE_BY_TEXT[normalizedMessage];
  }

  return translateDynamicErrorMessage(normalizedMessage);
};

export class AppError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      details?: unknown;
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.cause = options.cause;
  }
}

type ErrorPayload = {
  message?: string;
  code?: string;
};

const isErrorPayload = (value: unknown): value is ErrorPayload => {
  if (!value || typeof value !== 'object') return false;
  return 'message' in value || 'code' in value;
};

export const createAppError = (
  response: Response,
  payload: unknown,
  fallbackMessage: string,
): AppError => {
  const rawMessage = isErrorPayload(payload) && typeof payload.message === 'string'
    ? payload.message
    : fallbackMessage;
  const code = isErrorPayload(payload) && typeof payload.code === 'string'
    ? payload.code
    : undefined;
  const message = translateErrorMessage(rawMessage, code);

  return new AppError(message, {
    status: response.status,
    code,
    details: payload,
  });
};

export const isSessionExpiredError = (error: unknown): error is AppError =>
  error instanceof AppError && error.code === AUTH_SESSION_EXPIRED_CODE;

export const toSessionExpiredError = (error: unknown): AppError | null => {
  if (isSessionExpiredError(error)) return error;
  if (error instanceof AppError && error.code && AUTH_SESSION_EXPIRED_SOURCE_CODES.has(error.code)) {
    return new AppError(AUTH_SESSION_EXPIRED_MESSAGE, {
      status: 401,
      code: AUTH_SESSION_EXPIRED_CODE,
      details: error.details,
      cause: error,
    });
  }
  return null;
};

export const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError && error.message) {
    return translateErrorMessage(error.message, error.code);
  }
  if (error instanceof Error && error.message) {
    return translateErrorMessage(error.message);
  }
  if (typeof error === 'string' && error.trim()) {
    return translateErrorMessage(error);
  }
  return translateErrorMessage(fallbackMessage);
};

export const shouldRetryRequest = (failureCount: number, error: unknown) => {
  if (failureCount >= 1) return false;
  if (!(error instanceof AppError)) return true;
  if (!error.status) return true;
  if (error.status >= 500 || error.status === 429) return true;
  return false;
};

type LogOptions = {
  scope: string;
  level?: 'error' | 'warn';
  details?: unknown;
};

export const logError = (error: unknown, { scope, level = 'error', details }: LogOptions) => {
  if (!import.meta.env.DEV) return;

  const logger = level === 'warn' ? console.warn : console.error;
  logger(`[${scope}]`, error, details);
};
