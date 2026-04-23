import { HttpError } from '../utils/httpError.js';

export const toStatusFilter = (status?: string) => {
  // Mọi màn hình admin nên dùng chung mapping lifecycle này để số liệu overview và list không lệch định nghĩa trạng thái.
  if (status === 'draft') return { status: 'DRAFT', deletedAt: null };
  if (status === 'scheduled') return { status: 'SCHEDULED', deletedAt: null };
  if (status === 'published') return { status: 'PUBLISHED', deletedAt: null };
  if (status === 'deleted') return { deletedAt: { not: null } };
  return {};
};

export const resolvePublishFields = ({
  status,
  scheduledAt,
  actorId,
}: {
  status: string;
  scheduledAt?: string | null;
  actorId: bigint;
}) => {
  // Bất kỳ lần publish ngay lập tức nào cũng ghi đè lịch hẹn cũ để trạng thái bài viết chỉ còn một nguồn sự thật.
  if (status === 'PUBLISHED') {
    return {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: actorId,
      scheduledAt: null,
    } as const;
  }

  if (status === 'SCHEDULED') {
    if (!scheduledAt) {
      throw new HttpError(400, 'scheduledAt is required when status is SCHEDULED');
    }
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      throw new HttpError(400, 'scheduledAt must be in the future');
    }
    return {
      status: 'SCHEDULED',
      scheduledAt: scheduledDate,
      publishedAt: null,
      publishedBy: null,
    } as const;
  }

  return {
    status: 'DRAFT',
    scheduledAt: null,
    publishedAt: null,
    publishedBy: null,
  } as const;
};
