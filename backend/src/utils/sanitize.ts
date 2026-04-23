/**
 * @file sanitize.ts - Các hàm làm sạch dữ liệu đầu vào từ người dùng.
 *
 * File này chịu trách nhiệm:
 * - Loại bỏ ký tự điều khiển (control characters) có thể gây lỗi hiển thị hoặc bảo mật.
 * - Chuẩn hóa khoảng trắng cho text một dòng (single-line).
 * - Xử lý riêng cho rich text (giữ ngắt dòng hợp lệ).
 * - Chuẩn hóa email (lowercase + trim).
 * - Hỗ trợ nullable/optional cho các field không bắt buộc.
 */

/** Regex khớp các ký tự điều khiển ASCII (U+0000 đến U+001F và U+007F). */
// no-control-regex bị tắt cục bộ vì sanitizer này chủ đích lọc control char ở biên input.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;

/** Loại bỏ toàn bộ ký tự điều khiển khỏi chuỗi. */
const stripControlCharacters = (value: string): string => value.replace(CONTROL_CHARACTERS, '');

/**
 * Làm sạch text một dòng: loại bỏ ký tự điều khiển, gộp khoảng trắng thừa, trim.
 * Dùng cho: tên, tiêu đề, slug, v.v.
 */
export function sanitizeSingleLineText(value: string): string;
export function sanitizeSingleLineText<T>(value: T): T;
export function sanitizeSingleLineText<T>(value: T): T | string {
  if (typeof value !== 'string') return value;

  return stripControlCharacters(value)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Làm sạch và chuẩn hóa email: single-line clean + lowercase.
 * Dùng cho: field email khi đăng ký, đăng nhập, tìm kiếm.
 */
export function sanitizeEmailAddress(value: string): string;
export function sanitizeEmailAddress<T>(value: T): T;
export function sanitizeEmailAddress<T>(value: T): T | string {
  if (typeof value !== 'string') return value;

  return sanitizeSingleLineText(value).toLowerCase();
}

/**
 * Làm sạch rich text: loại bỏ ký tự điều khiển, chuẩn hóa line ending (\r\n → \n), trim.
 * Giữ nguyên ngắt dòng hợp lệ. Dùng cho: nội dung bài viết, bio, mô tả.
 */
export function sanitizeRichText(value: string): string;
export function sanitizeRichText<T>(value: T): T;
export function sanitizeRichText<T>(value: T): T | string {
  if (typeof value !== 'string') return value;

  return stripControlCharacters(value)
    .replace(/\r\n/g, '\n')
    .trim();
}

/**
 * Sanitize single-line text cho field nullable.
 * Trả về null nếu kết quả rỗng, giữ undefined nếu input undefined.
 */
export const sanitizeNullableSingleLineText = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const sanitized = sanitizeSingleLineText(value);
  return sanitized ? sanitized : null;
};

/**
 * Sanitize rich text cho field nullable.
 * Trả về null nếu kết quả rỗng, giữ undefined nếu input undefined.
 */
export const sanitizeNullableRichText = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const sanitized = sanitizeRichText(value);
  return sanitized ? sanitized : null;
};

/**
 * Sanitize URL tùy chọn (nullable).
 * Loại bỏ khoảng trắng thừa, trả null nếu rỗng.
 */
export const sanitizeOptionalUrl = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const sanitized = sanitizeSingleLineText(value);
  return sanitized ? sanitized : null;
};
