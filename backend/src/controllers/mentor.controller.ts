/**
 * @file mentor.controller.ts - Controller xử lý endpoint liên quan đến mentor.
 *
 * File này chịu trách nhiệm:
 * - API công khai: liệt kê mentor (có lọc/sắp xếp/phân trang), xem chi tiết theo slug.
 * - API mentor tự quản: xem/cập nhật profile cá nhân, xem dashboard thống kê.
 * - API gợi ý: lấy danh sách mentor phù hợp dựa trên kết quả đánh giá nghề nghiệp của user.
 */

import type { Request, Response } from 'express';

import * as mentorService from '../services/mentor.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuthenticatedUser } from '../utils/requireUser.js';

const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
// Query params từ Express đi vào như string nên controller normalize sớm trước khi giao cho service filter/sort.
const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};
const asBoolean = (value: unknown): boolean | undefined => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
};

export const listMentors = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, unknown>;
  const result = await mentorService.listMentors({
    page: asNumber(query.page),
    limit: asNumber(query.limit),
    search: asString(query.search),
    expertiseArea: asString(query.expertiseArea),
    level: asString(query.level) as mentorService.MentorLevelFilter | undefined,
    isVerified: asBoolean(query.isVerified),
    minYearsOfExperience: asNumber(query.minYearsOfExperience),
    maxHourlyRate: asNumber(query.maxHourlyRate),
    consultationLang: asString(query.consultationLang),
    sortBy: asString(query.sortBy) as mentorService.MentorListSortBy | undefined,
    sortOrder: asString(query.sortOrder) as mentorService.SortOrder | undefined,
  });

  return res.status(200).json(result);
});

export const getMentorBySlug = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await mentorService.getMentorBySlug({
    slug: String(req.params.slug),
  });

  return res.status(200).json({ mentor });
});

export const getRecommendedMentors = asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthenticatedUser(req);
  const query = req.query as Record<string, unknown>;
  const result = await mentorService.getRecommendedMentors({
    userId: user.id,
    limit: query.limit as number | undefined,
  });

  return res.status(200).json(result);
});

export const getMentorProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthenticatedUser(req);
  const mentor = await mentorService.getMentorProfile({ userId: user.id });
  return res.status(200).json({ mentor });
});

export const updateMentorProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthenticatedUser(req);
  const mentor = await mentorService.updateMentorProfile({
    userId: user.id,
    data: req.body as Record<string, unknown>,
  });

  return res.status(200).json({
    message: 'Mentor profile updated successfully',
    mentor,
  });
});

export const getMentorDashboard = asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthenticatedUser(req);
  const result = await mentorService.getMentorDashboard({ userId: user.id });
  return res.status(200).json(result);
});
