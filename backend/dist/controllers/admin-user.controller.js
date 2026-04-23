/**
 * @file admin-user.controller.ts - Controller quản trị người dùng (admin only).
 *
 * File này chịu trách nhiệm:
 * - Liệt kê và tìm kiếm user (có lọc theo role, status, phân trang).
 * - Xem chi tiết user, thống kê tổng quan user.
 * - Cập nhật tài khoản (tên, email, xác minh email).
 * - Cập nhật profile, thay đổi trạng thái (ACTIVE/SUSPENDED/BLOCKED), thay đổi role.
 * - Thu hồi toàn bộ session của user.
 * - Thao tác hàng loạt: bulk update status, bulk revoke sessions.
 * - Xem audit log (lịch sử thao tác quản trị).
 */
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import * as adminUserService from '../services/admin-user.service.js';
const asString = (value) => (typeof value === 'string' ? value : undefined);
const asBoolean = (value) => (typeof value === 'boolean' ? value : undefined);
const asNullableString = (value) => typeof value === 'string' ? value : value === null ? null : undefined;
const asNullableNumber = (value) => typeof value === 'number' ? value : value === null ? null : undefined;
const asGender = (value) => value === 'MALE' || value === 'FEMALE' || value === 'OTHER' ? value : value === null ? null : undefined;
const requireAuthenticatedUser = (req) => {
    if (!req.user) {
        throw new HttpError(401, 'Unauthorized', undefined, 'AUTH_UNAUTHORIZED');
    }
    return req.user;
};
export const adminListUsers = asyncHandler(async (req, res) => {
    const result = await adminUserService.adminListUsers(req.query);
    return res.status(200).json(result);
});
export const adminGetUserStats = asyncHandler(async (_req, res) => {
    const stats = await adminUserService.adminGetUserStats();
    return res.status(200).json({ stats });
});
export const adminGetUserById = asyncHandler(async (req, res) => {
    const user = await adminUserService.adminGetUserById({ id: String(req.params.id) });
    return res.status(200).json({ user });
});
export const adminUpdateUserAccount = asyncHandler(async (req, res) => {
    const actor = requireAuthenticatedUser(req);
    const body = req.body;
    // Mọi mutation quản trị đều truyền actorId xuống service để audit log và policy protected-admin dùng cùng nguồn actor thật.
    const user = await adminUserService.adminUpdateUserAccount({
        id: String(req.params.id),
        actorId: actor.id,
        fullName: asString(body.fullName),
        email: asString(body.email),
        emailVerified: asBoolean(body.emailVerified),
        reason: asString(body.reason),
    });
    return res.status(200).json({ user });
});
export const adminUpdateUserProfile = asyncHandler(async (req, res) => {
    const actor = requireAuthenticatedUser(req);
    const body = req.body;
    const user = await adminUserService.adminUpdateUserProfile({
        id: String(req.params.id),
        actorId: actor.id,
        avatarUrl: asNullableString(body.avatarUrl),
        coverImageUrl: asNullableString(body.coverImageUrl),
        phoneNumber: asNullableString(body.phoneNumber),
        location: asNullableString(body.location),
        birthYear: asNullableNumber(body.birthYear),
        gender: asGender(body.gender),
        province: asNullableString(body.province),
        schoolOrCompany: asNullableString(body.schoolOrCompany),
        department: asNullableString(body.department),
        bio: asNullableString(body.bio),
        githubUrl: asNullableString(body.githubUrl),
        linkedinUrl: asNullableString(body.linkedinUrl),
        jobTitle: asNullableString(body.jobTitle),
        reason: asString(body.reason),
    });
    return res.status(200).json({ user });
});
export const adminUpdateUserStatus = asyncHandler(async (req, res) => {
    const actor = requireAuthenticatedUser(req);
    const body = req.body;
    const user = await adminUserService.adminUpdateUserStatus({
        id: String(req.params.id),
        actorId: actor.id,
        status: body.status,
        reason: body.reason,
    });
    return res.status(200).json({ user });
});
export const adminUpdateUserRole = asyncHandler(async (req, res) => {
    const actor = requireAuthenticatedUser(req);
    const body = req.body;
    const user = await adminUserService.adminUpdateUserRole({
        id: String(req.params.id),
        actorId: actor.id,
        role: body.role,
        reason: body.reason,
    });
    return res.status(200).json({ user });
});
export const adminRevokeUserSessions = asyncHandler(async (req, res) => {
    const actor = requireAuthenticatedUser(req);
    const body = req.body;
    const result = await adminUserService.adminRevokeUserSessions({
        id: String(req.params.id),
        actorId: actor.id,
        reason: asString(body.reason),
    });
    return res.status(200).json(result);
});
export const adminBulkUpdateStatus = asyncHandler(async (req, res) => {
    const actor = requireAuthenticatedUser(req);
    const body = req.body;
    const result = await adminUserService.adminBulkUpdateStatus({
        actorId: actor.id,
        userIds: body.userIds,
        status: body.status,
        reason: body.reason,
    });
    return res.status(200).json(result);
});
export const adminBulkRevokeSessions = asyncHandler(async (req, res) => {
    const actor = requireAuthenticatedUser(req);
    const body = req.body;
    const result = await adminUserService.adminBulkRevokeSessions({
        actorId: actor.id,
        userIds: body.userIds,
        reason: body.reason,
    });
    return res.status(200).json(result);
});
export const adminListAuditLogs = asyncHandler(async (req, res) => {
    const result = await adminUserService.adminListAuditLogs(req.query);
    return res.status(200).json(result);
});
export const adminListUserAuditLogs = asyncHandler(async (req, res) => {
    const result = await adminUserService.adminListUserAuditLogs({
        id: String(req.params.id),
        ...req.query,
    });
    return res.status(200).json(result);
});
