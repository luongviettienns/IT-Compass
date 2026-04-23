/**
 * @file ids.ts - Tiện ích chuyển đổi ID sang BigInt an toàn.
 *
 * Database dùng BigInt cho primary key. File này cung cấp hàm helper
 * để parse ID từ request params/body sang BigInt, tự động throw HttpError 400
 * nếu giá trị không hợp lệ.
 */
import { HttpError } from './httpError.js';
/**
 * Chuyển đổi giá trị sang BigInt an toàn.
 * Throw HttpError 400 nếu giá trị không thể chuyển đổi.
 *
 * @param value - Giá trị cần chuyển (string, number, hoặc bigint).
 * @param label - Tên field để hiển thị trong error message (mặc định: 'id').
 * @returns Giá trị BigInt.
 */
export const toBigIntId = (value, label = 'id') => {
    try {
        return BigInt(value);
    }
    catch {
        throw new HttpError(400, `Invalid ${label}`);
    }
};
