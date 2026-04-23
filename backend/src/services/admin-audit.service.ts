import { Prisma } from '@prisma/client';

import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { toBigIntId } from '../utils/ids.js';

const ADMIN_AUDIT_ACTION_TO_DB = {
  CREATE_POST: 'tao_bai_viet',
  UPDATE_POST: 'cap_nhat_bai_viet',
  UPDATE_POST_STATUS: 'cap_nhat_trang_thai_bai_viet',
  PUBLISH_POST: 'xuat_ban_bai_viet',
  SCHEDULE_POST: 'len_lich_bai_viet',
  DELETE_POST: 'xoa_bai_viet',
  RESTORE_POST: 'khoi_phuc_bai_viet',
  MODERATE_COMMENT: 'kiem_duyet_binh_luan',
  DELETE_COMMENT: 'xoa_binh_luan',
};

const ADMIN_AUDIT_ACTION_FROM_DB = Object.fromEntries(
  Object.entries(ADMIN_AUDIT_ACTION_TO_DB).map(([appValue, dbValue]) => [dbValue, appValue]),
);

const USER_ROLE_FROM_DB = {
  hoc_vien: 'STUDENT',
  mentor: 'MENTOR',
  quan_tri: 'ADMIN',
};

const USER_STATUS_FROM_DB = {
  hoat_dong: 'ACTIVE',
  tam_khoa: 'SUSPENDED',
  khoa: 'BLOCKED',
};

const normalizePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const mapActionToDb = (action: string): string => {
  const mapped = ADMIN_AUDIT_ACTION_TO_DB[action as keyof typeof ADMIN_AUDIT_ACTION_TO_DB];

  if (!mapped) {
    throw new HttpError(400, 'Invalid admin audit action', undefined, 'AUDIT_INVALID_ACTION');
  }

  return mapped;
};

const parseJsonValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
};

const buildWhereSql = ({ actorUserId, action, targetType, targetId }: Record<string, unknown>) => {
  const conditions: Prisma.Sql[] = [];

  if (actorUserId) {
    conditions.push(Prisma.sql`a.nguoi_thuc_hien_id = ${toBigIntId(actorUserId as string, 'actor user id')}`);
  }

  if (action) {
    conditions.push(Prisma.sql`a.hanh_dong = ${mapActionToDb(action as string)}`);
  }

  if (targetType) {
    conditions.push(Prisma.sql`a.loai_doi_tuong = ${targetType as string}`);
  }

  if (targetId) {
    conditions.push(Prisma.sql`a.doi_tuong_id = ${String(targetId)}`);
  }

  if (conditions.length === 0) {
    return Prisma.empty;
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
};

const normalizeAuditLog = (log: Record<string, unknown>) => ({
  id: String(log.id),
  action: ADMIN_AUDIT_ACTION_FROM_DB[log.action as string] || log.action,
  targetType: log.targetType,
  targetId: log.targetId,
  reason: log.reason,
  metadata: parseJsonValue(log.metadataJson),
  createdAt: log.createdAt,
  actorUser: log.actorUserId
    ? {
        id: String(log.actorUserId),
        fullName: log.actorFullName,
        email: log.actorEmail,
        role: USER_ROLE_FROM_DB[log.actorRole as keyof typeof USER_ROLE_FROM_DB] || log.actorRole,
        status: USER_STATUS_FROM_DB[log.actorStatus as keyof typeof USER_STATUS_FROM_DB] || log.actorStatus,
      }
    : null,
});

export const createAdminAuditLog = async ({
  actorUserId,
  action,
  targetType,
  targetId,
  reason,
  metadata,
}: {
  actorUserId: bigint | string;
  action: string;
  targetType: string;
  targetId?: bigint | string | null;
  reason?: string | null;
  metadata?: unknown;
}) => {
  await prisma.$executeRaw`
    INSERT INTO nhat_ky_quan_tri (
      nguoi_thuc_hien_id,
      hanh_dong,
      loai_doi_tuong,
      doi_tuong_id,
      ly_do,
      du_lieu_json
    )
    VALUES (
      ${toBigIntId(actorUserId, 'actor user id')},
      ${mapActionToDb(action)},
      ${targetType},
      ${targetId ? String(targetId) : null},
      ${reason || null},
      ${metadata ? JSON.stringify(metadata) : null}
    )
  `;
};

export const listAdminAuditLogs = async ({ page = 1, limit = 20, actorUserId, action, targetType, targetId }: Record<string, unknown>) => {
  const parsedPage = normalizePositiveInt(page, 1);
  const parsedLimit = Math.min(normalizePositiveInt(limit, 20), 100);
  const offset = (parsedPage - 1) * parsedLimit;
  const whereSql = buildWhereSql({ actorUserId, action, targetType, targetId });

  const [countRows, logs] = await Promise.all([
    prisma.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
      SELECT COUNT(*) AS total
      FROM nhat_ky_quan_tri a
      ${whereSql}
    `),
    prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT
        a.id AS id,
        a.hanh_dong AS action,
        a.loai_doi_tuong AS targetType,
        a.doi_tuong_id AS targetId,
        a.ly_do AS reason,
        a.du_lieu_json AS metadataJson,
        a.tao_luc AS createdAt,
        u.id AS actorUserId,
        u.ho_ten AS actorFullName,
        u.email AS actorEmail,
        u.vai_tro AS actorRole,
        u.trang_thai AS actorStatus
      FROM nhat_ky_quan_tri a
      INNER JOIN nguoi_dung u ON u.id = a.nguoi_thuc_hien_id
      ${whereSql}
      ORDER BY a.tao_luc DESC, a.id DESC
      LIMIT ${parsedLimit}
      OFFSET ${offset}
    `),
  ]);

  const total = Number(countRows[0]?.total || 0);

  return {
    logs: logs.map(normalizeAuditLog),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
    },
  };
};
