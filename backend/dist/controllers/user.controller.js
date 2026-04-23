/**
 * @file user.controller.ts - Controller xử lý các endpoint liên quan đến user profile.
 *
 * File này chịu trách nhiệm:
 * - updateProfile: Cho phép user tự cập nhật thông tin cá nhân (tên, avatar, bio, ...).
 * - getRecommendedMentors: Lấy danh sách mentor gợi ý dựa trên kết quả đánh giá của user.
 */
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuthenticatedUser } from '../utils/requireUser.js';
import * as userService from '../services/user.service.js';
import * as mentorService from '../services/mentor.service.js';
/** Cập nhật thông tin profile của user đang đăng nhập. */
export const updateProfile = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const updatedUser = await userService.updateProfile({
        userId: user.id,
        data: req.body,
    });
    return res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser,
    });
});
export const getRecommendedMentors = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    // Gợi ý mentor bám theo latest assessment của chính user nên controller chỉ chuyển limit, không nhận thêm filter nhạy cảm từ client.
    const result = await mentorService.getRecommendedMentors({
        userId: user.id,
        limit: req.query.limit,
    });
    return res.status(200).json(result);
});
