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

import type { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import * as adminMentorService from '../services/admin-mentor.service.js';

export const adminListMentors = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminMentorService.adminListMentors(req.query as Record<string, unknown>);
  return res.status(200).json(result);
});

export const adminGetMentorById = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await adminMentorService.adminGetMentorById({ id: String(req.params.id) });
  return res.status(200).json({ mentor });
});

export const adminCreateMentor = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await adminMentorService.adminCreateMentor(req.body as Record<string, unknown>);
  return res.status(201).json({ mentor });
});

export const adminUpdateMentor = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await adminMentorService.adminUpdateMentor({
    id: String(req.params.id),
    ...(req.body as Record<string, unknown>),
  });

  return res.status(200).json({ mentor });
});

export const adminUpdateMentorStatus = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await adminMentorService.adminUpdateMentorStatus({
    id: String(req.params.id),
    status: (req.body as Record<string, unknown>).status as string,
  });

  return res.status(200).json({ mentor });
});

export const adminUpdateMentorVerification = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await adminMentorService.adminUpdateMentorVerification({
    id: String(req.params.id),
    isVerified: Boolean((req.body as Record<string, unknown>).isVerified),
  });

  return res.status(200).json({ mentor });
});
