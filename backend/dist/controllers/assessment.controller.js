/**
 * @file assessment.controller.ts - Controller xử lý endpoint đánh giá nghề nghiệp (career quiz).
 *
 * File này chịu trách nhiệm:
 * - getCurrentTemplate: Trả template quiz hiện tại (câu hỏi Holland + tình huống).
 * - submitAttempt: Nhận câu trả lời, chấm điểm và lưu kết quả đánh giá.
 * - getLatestAttempt: Lấy kết quả đánh giá mới nhất của user.
 * - getAttemptHistory: Lấy lịch sử các lần làm quiz (có phân trang).
 * - getAttemptById: Xem chi tiết một lần đánh giá cụ thể.
 * - getAdminAssessmentStats: Thống kê đánh giá cho admin dashboard.
 */
import * as assessmentService from '../services/assessment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
const requireAuthenticatedUser = (req) => {
    if (!req.user) {
        throw new HttpError(401, 'Unauthorized', undefined, 'AUTH_UNAUTHORIZED');
    }
    return req.user;
};
export const getCurrentTemplate = asyncHandler(async (_req, res) => {
    const template = await assessmentService.getCurrentTemplate();
    return res.status(200).json({ template });
});
export const submitAttempt = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const body = req.body;
    // Controller chỉ chuyển raw answers + userId; phần chấm điểm và chuẩn hóa kết quả được giữ ở service để client không quyết định outcome.
    const attempt = await assessmentService.submitAttempt({
        userId: user.id,
        startedAt: body.startedAt,
        hollandAnswers: body.hollandAnswers,
        situationalAnswers: body.situationalAnswers,
    });
    return res.status(201).json({ attempt });
});
export const getLatestAttempt = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const attempt = await assessmentService.getLatestAttempt({ userId: user.id });
    return res.status(200).json({ attempt });
});
export const getAttemptHistory = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const query = req.query;
    const result = await assessmentService.getAttemptHistory({
        userId: user.id,
        page: query.page,
        limit: query.limit,
    });
    return res.status(200).json(result);
});
export const getAttemptById = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const params = req.params;
    // attemptId luôn bị scope theo user hiện tại để không thể đọc lịch sử của tài khoản khác chỉ bằng cách đổi URL.
    const attempt = await assessmentService.getAttemptById({
        userId: user.id,
        attemptId: params.attemptId,
    });
    return res.status(200).json({ attempt });
});
export const getAdminAssessmentStats = asyncHandler(async (_req, res) => {
    const stats = await assessmentService.getAdminAssessmentStats();
    return res.status(200).json({ stats });
});
