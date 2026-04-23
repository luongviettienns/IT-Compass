/**
 * @file userApi.ts - API client cho user profile (tự quản).
 *
 * File này chịu trách nhiệm:
 * - updateProfile: cập nhật thông tin cá nhân (tên, bio, avatar, ...).
 * - uploadImage: upload ảnh đại diện hoặc ảnh bìa.
 */

import { apiRequest, apiUploadRequest, type AuthUser, type UserProfile } from './authApi';

export const userApi = {
  updateProfile: (input: Partial<UserProfile & { fullName: string }>) =>
    apiRequest<{ message: string; user: AuthUser }>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    return apiUploadRequest<{ url: string; filename: string }>('/uploads/images', formData, {
      method: 'POST',
    }, {
      fallbackMessage: 'Tải ảnh thất bại',
    });
  },
};
