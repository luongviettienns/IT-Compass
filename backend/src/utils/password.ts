/**
 * @file password.ts - Tiện ích hash và xác minh mật khẩu bằng bcrypt.
 *
 * File này chịu trách nhiệm:
 * - Hash mật khẩu plain text trước khi lưu vào database.
 * - So sánh mật khẩu plain text với hash đã lưu khi đăng nhập.
 * - Sử dụng bcryptjs với 12 salt rounds (cân bằng giữa bảo mật và hiệu suất).
 */

import bcrypt from 'bcryptjs';

/** Số vòng salt cho bcrypt (12 rounds ≈ 200-300ms trên phần cứng thông thường). */
const SALT_ROUNDS = 12;

/**
 * Hash mật khẩu plain text bằng bcrypt.
 * @param plainTextPassword - Mật khẩu gốc.
 * @returns Chuỗi hash an toàn để lưu vào database.
 */
export const hashPassword = async (plainTextPassword: string): Promise<string> =>
  bcrypt.hash(plainTextPassword, SALT_ROUNDS);

/**
 * Xác minh mật khẩu plain text có khớp với hash đã lưu không.
 * @param plainTextPassword - Mật khẩu người dùng nhập.
 * @param passwordHash - Hash đã lưu trong database.
 * @returns true nếu khớp, false nếu sai.
 */
export const verifyPassword = async (plainTextPassword: string, passwordHash: string): Promise<boolean> =>
  bcrypt.compare(plainTextPassword, passwordHash);
