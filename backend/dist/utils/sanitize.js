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
const stripControlCharacters = (value) => value.replace(CONTROL_CHARACTERS, '');
export function sanitizeSingleLineText(value) {
    if (typeof value !== 'string')
        return value;
    return stripControlCharacters(value)
        .replace(/\s+/g, ' ')
        .trim();
}
export function sanitizeEmailAddress(value) {
    if (typeof value !== 'string')
        return value;
    return sanitizeSingleLineText(value).toLowerCase();
}
export function sanitizeRichText(value) {
    if (typeof value !== 'string')
        return value;
    return stripControlCharacters(value)
        .replace(/\r\n/g, '\n')
        .trim();
}
/**
 * Sanitize single-line text cho field nullable.
 * Trả về null nếu kết quả rỗng, giữ undefined nếu input undefined.
 */
export const sanitizeNullableSingleLineText = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    const sanitized = sanitizeSingleLineText(value);
    return sanitized ? sanitized : null;
};
/**
 * Sanitize rich text cho field nullable.
 * Trả về null nếu kết quả rỗng, giữ undefined nếu input undefined.
 */
export const sanitizeNullableRichText = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    const sanitized = sanitizeRichText(value);
    return sanitized ? sanitized : null;
};
/**
 * Sanitize URL tùy chọn (nullable).
 * Loại bỏ khoảng trắng thừa, trả null nếu rỗng.
 */
export const sanitizeOptionalUrl = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    const sanitized = sanitizeSingleLineText(value);
    return sanitized ? sanitized : null;
};
