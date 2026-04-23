/**
 * @file userDisplay.ts - Tiện ích hiển thị thông tin user trên giao diện.
 *
 * File này chịu trách nhiệm:
 * - ROLE_LABEL: ánh xạ role sang nhãn tiếng Việt.
 * - USER_STATUS_LABEL: ánh xạ trạng thái user sang nhãn tiếng Việt.
 * - getRoleBadge: trả label + class cho component badge role.
 * - getUserStatusLabel: trả về nhãn trạng thái để UI không phải render raw enum.
 * - getUserInitials: tạo chữ cái viết tắt từ tên.
 * - getUserShortName: lấy tên ngắn để hiển thị trên UI nhỏ.
 */

import type { UserStatus } from './adminUserApi';
import type { Role } from './authApi';

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: 'HỌC VIÊN',
  MENTOR: 'CỐ VẤN',
  ADMIN: 'QUẢN TRỊ VIÊN',
};

export const ROLE_BADGE_CLASS: Record<Role, string> = {
  STUDENT: 'bg-background text-foreground border-2 border-foreground shadow-[2px_2px_0px_#000]',
  MENTOR: 'bg-primary text-primary-foreground border-2 border-foreground shadow-[2px_2px_0px_#000]',
  ADMIN: 'bg-secondary text-secondary-foreground border-2 border-foreground shadow-[2px_2px_0px_#000]',
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: 'HOẠT ĐỘNG',
  SUSPENDED: 'TẠM NGƯNG',
  BLOCKED: 'BỊ CHẶN',
};

export const getRoleBadge = (role: Role | null | undefined) => {
  if (!role) return null;
  return {
    label: ROLE_LABEL[role],
    color: ROLE_BADGE_CLASS[role],
  };
};

export const getUserStatusLabel = (status: UserStatus | null | undefined) => {
  if (!status) return '';
  return USER_STATUS_LABEL[status];
};

export const getUserInitials = (fullName: string | null | undefined) => {
  if (!fullName) return 'U';

  const initials = fullName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return initials || 'U';
};

export const getUserShortName = (fullName: string | null | undefined) => {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/).pop() || '';
};
