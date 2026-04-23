/**
 * @file admin-mentor.controller.ts - Controller quản trị mentor (admin only).
 *
 * File này chịu trách nhiệm:
 * - Liệt kê mentor (có lọc, phân trang, thống kê).
 * - Xem chi tiết mentor theo ID.
 * - Tạo mới mentor profile.
 * - Cập nhật thông tin mentor.
 * - Cặp nhật trạng thái mentor (ACTIVE/PAUSED).
 * - Cập nhật trạng thái xác thực mentor (isVerified).
 */
import { asyncHandler } from '../utils/asyncHandler.js';
import * as adminMentorService from '../services/admin-mentor.service.js';
export const adminListMentors = asyncHandler(async (req, res) => {
    const result = await adminMentorService.adminListMentors(req.query);
    return res.status(200).json(result);
});
export const adminGetMentorById = asyncHandler(async (req, res) => {
    const mentor = await adminMentorService.adminGetMentorById({ id: String(req.params.id) });
    return res.status(200).json({ mentor });
});
export const adminCreateMentor = asyncHandler(async (req, res) => {
    const mentor = await adminMentorService.adminCreateMentor(req.body);
    return res.status(201).json({ mentor });
});
export const adminUpdateMentor = asyncHandler(async (req, res) => {
    const mentor = await adminMentorService.adminUpdateMentor({
        id: String(req.params.id),
        ...req.body,
    });
    return res.status(200).json({ mentor });
});
export const adminUpdateMentorStatus = asyncHandler(async (req, res) => {
    const mentor = await adminMentorService.adminUpdateMentorStatus({
        id: String(req.params.id),
        status: req.body.status,
    });
    return res.status(200).json({ mentor });
});
export const adminUpdateMentorVerification = asyncHandler(async (req, res) => {
    const mentor = await adminMentorService.adminUpdateMentorVerification({
        id: String(req.params.id),
        isVerified: Boolean(req.body.isVerified),
    });
    return res.status(200).json({ mentor });
});
