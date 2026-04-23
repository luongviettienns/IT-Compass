/**
 * @file auth.ts - Định nghĩa TypeScript types cho module xác thực (authentication).
 *
 * File này chịu trách nhiệm:
 * - Định nghĩa kiểu AuthenticatedUser gắn vào req.user sau khi xác thực.
 * - Mô tả cấu trúc JWT access token payload (sub, role, status).
 * - Định nghĩa DTO types cho user/profile serialize (trả về client).
 * - Định nghĩa các interface dùng chung cho auth service (RequestMetadata, AuthResponse).
 */

import type { User, UserProfile } from '@prisma/client';

/** User đã xác thực, gắn vào req.user bởi requireAuth middleware. */
export type AuthenticatedUser = User;

/** Cấu trúc payload bên trong JWT access token (sau khi decode). */
export interface AccessTokenPayload {
  /** User ID (dạng string của BigInt). */
  sub: string;
  /** Vai trò hiện tại của user. */
  role: User['role'];
  /** Trạng thái tài khoản. */
  status: User['status'];
  /** Thời điểm token được tạo (Unix timestamp). */
  iat?: number;
  /** Thời điểm token hết hạn (Unix timestamp). */
  exp?: number;
}

/** Kiểu User kèm optional Profile, dùng khi query JOIN trong auth service. */
export type UserWithOptionalProfile = Pick<
  User,
  'id' | 'fullName' | 'email' | 'role' | 'status' | 'emailVerifiedAt' | 'createdAt' | 'updatedAt'
> & {
  profile?: UserProfile | null;
};

/** DTO profile trả về client (chỉ chứa field frontend cần). */
export interface SerializedUserProfile {
  avatarUrl: string | null;
  coverImageUrl: string | null;
  phoneNumber: string | null;
  location: string | null;
  birthYear: number | null;
  gender: string | null;
  province: string | null;
  schoolOrCompany: string | null;
  department: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  jobTitle: string | null;
}

/** DTO user trả về client (ID dạng string, kèm optional profile). */
export interface SerializedUser {
  id: string;
  fullName: string;
  email: string;
  role: User['role'];
  status: User['status'];
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile?: SerializedUserProfile;
}

/** Metadata từ HTTP request (dùng để ghi log audit session). */
export interface RequestMetadata {
  userAgent: string | null;
  ipAddress: string | null;
}

/** Response chuẩn cho login/register/refresh (access token + refresh token + user). */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: SerializedUser;
}
