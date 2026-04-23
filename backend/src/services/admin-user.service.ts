import { type UserRole, type UserStatus, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { toBigIntId } from '../utils/ids.js';
import { serializeUser } from '../utils/serializeUser.js';
import { revokeAllSessionsForUser } from './auth-session.service.js';

type AdminAuditAction =
  | 'UPDATE_ACCOUNT'
  | 'UPDATE_PROFILE'
  | 'UPDATE_STATUS'
  | 'UPDATE_ROLE'
  | 'REVOKE_SESSIONS'
  | 'BULK_UPDATE_STATUS'
  | 'BULK_REVOKE_SESSIONS';

type BulkResultInput = {
  userId: string | bigint;
  success: boolean;
  code?: number;
  message?: string;
  user?: unknown;
  revokedCount?: number;
};

const ADMIN_AUDIT_ACTIONS: Record<AdminAuditAction, AdminAuditAction> = {
  UPDATE_ACCOUNT: 'UPDATE_ACCOUNT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  UPDATE_STATUS: 'UPDATE_STATUS',
  UPDATE_ROLE: 'UPDATE_ROLE',
  REVOKE_SESSIONS: 'REVOKE_SESSIONS',
  BULK_UPDATE_STATUS: 'BULK_UPDATE_STATUS',
  BULK_REVOKE_SESSIONS: 'BULK_REVOKE_SESSIONS',
};

const ADMIN_SAFE_INCLUDE = {
  profile: true,
  mentorProfile: {
    select: {
      id: true,
    },
  },
} as const;

const AUDIT_LOG_INCLUDE = {
  actorUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
    },
  },
  targetUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
    },
  },
} as const;

const normalizePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const buildDateRange = (createdFrom?: string, createdTo?: string): Prisma.DateTimeFilter | undefined => {
  if (!createdFrom && !createdTo) return undefined;

  const range: Record<string, Date> = {};
  if (createdFrom) range.gte = new Date(createdFrom);
  if (createdTo) range.lte = new Date(createdTo);
  return range;
};

const buildUserOrderBy = ({ sortBy = 'createdAt', sortOrder = 'desc' }: Record<string, unknown>) => {
  if (sortBy === 'fullName' || sortBy === 'email') {
    return [{ [String(sortBy)]: sortOrder }, { createdAt: 'desc' }] as Prisma.UserOrderByWithRelationInput[];
  }

  return [{ [String(sortBy)]: sortOrder }, { fullName: 'asc' }] as Prisma.UserOrderByWithRelationInput[];
};

const buildAuditOrderBy = () => [{ createdAt: 'desc' }, { id: 'desc' }] as Prisma.UserAdminAuditLogOrderByWithRelationInput[];

type AdminSafeUser = Prisma.UserGetPayload<{ include: typeof ADMIN_SAFE_INCLUDE }>;

const normalizeAuditUser = (user: Record<string, unknown>) => ({
  id: String(user.id),
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  status: user.status,
});

const normalizeAuditLog = (log: Record<string, unknown> & { actorUser: Record<string, unknown>; targetUser: Record<string, unknown> }) => ({
  id: String(log.id),
  action: log.action,
  reason: log.reason,
  before: log.beforeJson,
  after: log.afterJson,
  createdAt: log.createdAt,
  actorUser: normalizeAuditUser(log.actorUser),
  targetUser: normalizeAuditUser(log.targetUser),
});

const serializeAdminUser = (user: AdminSafeUser, extra: Record<string, unknown> = {}) => {
  const serialized = serializeUser(user);

  return {
    ...serialized,
    emailVerified: Boolean(user.emailVerifiedAt),
    hasProfile: Boolean(user.profile),
    ...(extra.activeSessionCount !== undefined ? { activeSessionCount: extra.activeSessionCount } : {}),
    ...(extra.lastSessionAt !== undefined ? { lastSessionAt: extra.lastSessionAt } : {}),
    ...Object.fromEntries(
      Object.entries(extra).filter(([key]) => key !== 'activeSessionCount' && key !== 'lastSessionAt'),
    ),
  };
};

const createAuditLog = async ({
  actorUserId,
  targetUserId,
  action,
  reason,
  before,
  after,
}: {
  actorUserId: bigint;
  targetUserId: bigint;
  action: AdminAuditAction;
  reason?: string;
  before?: unknown;
  after?: unknown;
}) =>
  prisma.userAdminAuditLog.create({
    data: {
      actorUserId,
      targetUserId,
      action,
      reason,
      beforeJson: (before ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      afterJson: (after ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });

const getAdminUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id: toBigIntId(id, 'user id') },
    include: ADMIN_SAFE_INCLUDE,
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return user;
};

const getProtectedAdminUserId = async () => {
  // Chính sách hiện tại khóa tài khoản admin duy nhất để dashboard quản trị không tự cắt đường vào hệ thống.
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
    orderBy: { id: 'asc' },
  });

  if (admins.length !== 1) {
    throw new HttpError(409, 'Expected exactly one admin account in the system');
  }

  return admins[0].id;
};

const ensureTargetIsNotProtectedAdmin = async (targetUserId: bigint) => {
  const protectedAdminId = await getProtectedAdminUserId();
  if (protectedAdminId === targetUserId) {
    throw new HttpError(403, 'Cannot modify the only admin account');
  }
};

const buildUserWhere = ({
  search,
  role,
  status,
  emailVerified,
  hasProfile,
  createdFrom,
  createdTo,
}: Record<string, unknown>) => {
  const trimmedSearch = typeof search === 'string' ? search.trim() : undefined;
  const createdAt = buildDateRange(createdFrom as string | undefined, createdTo as string | undefined);

  return {
    ...(role !== 'all' ? { role } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(emailVerified === 'true'
      ? { emailVerifiedAt: { not: null } }
      : emailVerified === 'false'
        ? { emailVerifiedAt: null }
        : {}),
    ...(hasProfile === 'true'
      ? { profile: { isNot: null } }
      : hasProfile === 'false'
        ? { profile: { is: null } }
        : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { fullName: { contains: trimmedSearch } },
            { email: { contains: trimmedSearch } },
            { profile: { is: { phoneNumber: { contains: trimmedSearch } } } },
          ],
        }
      : {}),
  } as Prisma.UserWhereInput;
};

const snapshotUser = (user: AdminSafeUser) => ({
  id: String(user.id),
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  status: user.status,
  emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
  profile: user.profile
    ? {
        avatarUrl: user.profile.avatarUrl,
        coverImageUrl: user.profile.coverImageUrl,
        phoneNumber: user.profile.phoneNumber,
        location: user.profile.location,
        birthYear: user.profile.birthYear,
        gender: user.profile.gender,
        province: user.profile.province,
        schoolOrCompany: user.profile.schoolOrCompany,
        department: user.profile.department,
        bio: user.profile.bio,
        githubUrl: user.profile.githubUrl,
        linkedinUrl: user.profile.linkedinUrl,
        jobTitle: user.profile.jobTitle,
      }
    : null,
});

const mapBulkResult = ({ userId, success, code, message, user, revokedCount }: BulkResultInput) => ({
  userId: String(userId),
  success,
  ...(code ? { code } : {}),
  ...(message ? { message } : {}),
  ...(user ? { user } : {}),
  ...(revokedCount !== undefined ? { revokedCount } : {}),
});

export const adminListUsers = async (input: Record<string, unknown>) => {
  const page = normalizePositiveInt(input.page, 1);
  const limit = normalizePositiveInt(input.limit, 20);
  const where = buildUserWhere(input);

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: ADMIN_SAFE_INCLUDE,
      orderBy: buildUserOrderBy(input),
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const pagedUserIds = users.map((user) => user.id);
  // Active session count chỉ tính trên trang hiện tại để admin list vẫn nhẹ, còn detail mới đọc sâu thêm lastSessionAt.
  const activeSessionsByUserId = pagedUserIds.length
    ? await prisma.authSession.groupBy({
        by: ['userId'],
        where: {
          userId: { in: pagedUserIds },
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        _count: {
          userId: true,
        },
      })
    : [];

  const activeSessionMap = new Map(activeSessionsByUserId.map((item) => [String(item.userId), item._count.userId]));

  const serializedUsers = users.map((user) =>
    serializeAdminUser(user, {
      activeSessionCount: activeSessionMap.get(String(user.id)) || 0,
    }),
  );

  const [statusCounts, totalVerified, totalWithProfile] = await Promise.all([
    prisma.user.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    }),
    prisma.user.count({ where: { ...where, emailVerifiedAt: { not: null } } }),
    prisma.user.count({ where: { ...where, profile: { isNot: null } } }),
  ]);

  const statusCountMap = new Map(statusCounts.map((item) => [item.status, item._count?.status ?? 0]));

  return {
    users: serializedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    summary: {
      total,
      active: statusCountMap.get('ACTIVE') || 0,
      suspended: statusCountMap.get('SUSPENDED') || 0,
      blocked: statusCountMap.get('BLOCKED') || 0,
      verified: totalVerified,
      withProfile: totalWithProfile,
    },
  };
};

const getActiveSessionCount = async (userId: bigint) =>
  prisma.authSession.count({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

const getLastSessionAt = async (userId: bigint) => {
  const latestSession = await prisma.authSession.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  return latestSession?.createdAt || null;
};

export const adminGetUserStats = async () => {
  const [total, statusCounts, roleCounts, verified, withProfile] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    }),
    prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
    prisma.user.count({ where: { profile: { isNot: null } } }),
  ]);

  const statusCountMap = new Map(statusCounts.map((item) => [item.status, item._count.status]));
  const roleCountMap = new Map(roleCounts.map((item) => [item.role, item._count.role]));

  return {
    total,
    byStatus: {
      active: statusCountMap.get('ACTIVE') || 0,
      suspended: statusCountMap.get('SUSPENDED') || 0,
      blocked: statusCountMap.get('BLOCKED') || 0,
    },
    byRole: {
      student: roleCountMap.get('STUDENT') || 0,
      mentor: roleCountMap.get('MENTOR') || 0,
      admin: roleCountMap.get('ADMIN') || 0,
    },
    verification: {
      verified,
      unverified: total - verified,
    },
    profile: {
      withProfile,
      withoutProfile: total - withProfile,
    },
  };
};

export const adminGetUserById = async ({ id }: { id: string }) => {
  const user = await getAdminUserById(id);
  const [activeSessionCount, lastSessionAt] = await Promise.all([
    getActiveSessionCount(user.id),
    getLastSessionAt(user.id),
  ]);

  return serializeAdminUser(user, { activeSessionCount, lastSessionAt });
};

export const adminUpdateUserAccount = async ({
  id,
  actorId,
  fullName,
  email,
  emailVerified,
  reason,
}: {
  id: string;
  actorId: bigint;
  fullName?: string;
  email?: string;
  emailVerified?: boolean;
  reason?: string;
}) => {
  const targetUserId = toBigIntId(id, 'user id');
  await ensureTargetIsNotProtectedAdmin(targetUserId);

  const existingUser = await getAdminUserById(id);
  const before = snapshotUser(existingUser);

  if (email && email !== existingUser.email) {
    const duplicated = await prisma.user.findUnique({ where: { email } });
    if (duplicated && duplicated.id !== targetUserId) {
      throw new HttpError(409, 'Email is already in use');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      ...(fullName !== undefined ? { fullName } : {}),
      ...(email !== undefined
        ? {
            email,
            emailVerifiedAt:
              email === existingUser.email
                ? emailVerified === undefined
                  ? existingUser.emailVerifiedAt
                  : emailVerified
                    ? existingUser.emailVerifiedAt || new Date()
                    : null
                : emailVerified
                  ? new Date()
                  : null,
          }
        : emailVerified !== undefined
          ? { emailVerifiedAt: emailVerified ? existingUser.emailVerifiedAt || new Date() : null }
          : {}),
    },
    include: ADMIN_SAFE_INCLUDE,
  });

  const [activeSessionCount, lastSessionAt] = await Promise.all([
    getActiveSessionCount(updatedUser.id),
    getLastSessionAt(updatedUser.id),
  ]);

  const after = snapshotUser(updatedUser);

  await createAuditLog({
    actorUserId: toBigIntId(actorId, 'actor id'),
    targetUserId,
    action: ADMIN_AUDIT_ACTIONS.UPDATE_ACCOUNT,
    reason,
    before,
    after,
  });

  return serializeAdminUser(updatedUser, { activeSessionCount, lastSessionAt });
};

export const adminUpdateUserProfile = async ({
  id,
  actorId,
  reason,
  ...profileData
}: {
  id: string;
  actorId: bigint;
  reason?: string;
  [key: string]: unknown;
}) => {
  const targetUserId = toBigIntId(id, 'user id');
  await ensureTargetIsNotProtectedAdmin(targetUserId);

  const existingUser = await getAdminUserById(id);
  const before = snapshotUser(existingUser);

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      profile: existingUser.profile
        ? {
            update: {
              ...(profileData.avatarUrl !== undefined ? { avatarUrl: profileData.avatarUrl } : {}),
              ...(profileData.coverImageUrl !== undefined ? { coverImageUrl: profileData.coverImageUrl } : {}),
              ...(profileData.phoneNumber !== undefined ? { phoneNumber: profileData.phoneNumber } : {}),
              ...(profileData.location !== undefined ? { location: profileData.location } : {}),
              ...(profileData.birthYear !== undefined ? { birthYear: profileData.birthYear } : {}),
              ...(profileData.gender !== undefined ? { gender: profileData.gender } : {}),
              ...(profileData.province !== undefined ? { province: profileData.province } : {}),
              ...(profileData.schoolOrCompany !== undefined ? { schoolOrCompany: profileData.schoolOrCompany } : {}),
              ...(profileData.department !== undefined ? { department: profileData.department } : {}),
              ...(profileData.bio !== undefined ? { bio: profileData.bio } : {}),
              ...(profileData.githubUrl !== undefined ? { githubUrl: profileData.githubUrl } : {}),
              ...(profileData.linkedinUrl !== undefined ? { linkedinUrl: profileData.linkedinUrl } : {}),
              ...(profileData.jobTitle !== undefined ? { jobTitle: profileData.jobTitle } : {}),
            } as Prisma.UserProfileUncheckedUpdateWithoutUserInput,
          }
        : {
            create: {
              ...(profileData.avatarUrl !== undefined ? { avatarUrl: profileData.avatarUrl } : {}),
              ...(profileData.coverImageUrl !== undefined ? { coverImageUrl: profileData.coverImageUrl } : {}),
              ...(profileData.phoneNumber !== undefined ? { phoneNumber: profileData.phoneNumber } : {}),
              ...(profileData.location !== undefined ? { location: profileData.location } : {}),
              ...(profileData.birthYear !== undefined ? { birthYear: profileData.birthYear } : {}),
              ...(profileData.gender !== undefined ? { gender: profileData.gender } : {}),
              ...(profileData.province !== undefined ? { province: profileData.province } : {}),
              ...(profileData.schoolOrCompany !== undefined ? { schoolOrCompany: profileData.schoolOrCompany } : {}),
              ...(profileData.department !== undefined ? { department: profileData.department } : {}),
              ...(profileData.bio !== undefined ? { bio: profileData.bio } : {}),
              ...(profileData.githubUrl !== undefined ? { githubUrl: profileData.githubUrl } : {}),
              ...(profileData.linkedinUrl !== undefined ? { linkedinUrl: profileData.linkedinUrl } : {}),
              ...(profileData.jobTitle !== undefined ? { jobTitle: profileData.jobTitle } : {}),
            } as Prisma.UserProfileUncheckedCreateWithoutUserInput,
          },
    },
    include: ADMIN_SAFE_INCLUDE,
  });

  const [activeSessionCount, lastSessionAt] = await Promise.all([
    getActiveSessionCount(updatedUser.id),
    getLastSessionAt(updatedUser.id),
  ]);

  const after = snapshotUser(updatedUser);

  await createAuditLog({
    actorUserId: toBigIntId(actorId, 'actor id'),
    targetUserId,
    action: ADMIN_AUDIT_ACTIONS.UPDATE_PROFILE,
    reason,
    before,
    after,
  });

  return serializeAdminUser(updatedUser, { activeSessionCount, lastSessionAt });
};

export const adminUpdateUserStatus = async ({
  id,
  actorId,
  status,
  reason,
}: {
  id: string;
  actorId: bigint;
  status: UserStatus;
  reason?: string;
}) => {
  const targetUserId = toBigIntId(id, 'user id');
  await ensureTargetIsNotProtectedAdmin(targetUserId);

  const existingUser = await getAdminUserById(id);
  const before = snapshotUser(existingUser);

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { status },
    include: ADMIN_SAFE_INCLUDE,
  });

  let revokedCount = 0;
  // Suspend/block phải revoke toàn bộ phiên đang hoạt động ngay để policy trạng thái có hiệu lực tức thời.
  if (status === 'SUSPENDED' || status === 'BLOCKED') {
    const revokeResult = await revokeAllSessionsForUser(targetUserId);
    revokedCount = revokeResult.count;
  }

  const [activeSessionCount, lastSessionAt] = await Promise.all([
    getActiveSessionCount(updatedUser.id),
    getLastSessionAt(updatedUser.id),
  ]);

  const after = {
    ...snapshotUser(updatedUser),
    activeSessionCount,
    lastSessionAt: lastSessionAt ? lastSessionAt.toISOString() : null,
    revokedSessionCount: revokedCount,
  };

  await createAuditLog({
    actorUserId: toBigIntId(actorId, 'actor id'),
    targetUserId,
    action: ADMIN_AUDIT_ACTIONS.UPDATE_STATUS,
    reason,
    before,
    after,
  });

  return serializeAdminUser(updatedUser, { activeSessionCount, lastSessionAt });
};

export const adminUpdateUserRole = async ({
  id,
  actorId,
  role,
  reason,
}: {
  id: string;
  actorId: bigint;
  role: Extract<UserRole, 'STUDENT' | 'MENTOR'>;
  reason?: string;
}) => {
  const targetUserId = toBigIntId(id, 'user id');
  await ensureTargetIsNotProtectedAdmin(targetUserId);

  const existingUser = await getAdminUserById(id);
  const before = snapshotUser(existingUser);

  if (existingUser.role === role) {
    throw new HttpError(400, 'User already has this role');
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role },
    include: ADMIN_SAFE_INCLUDE,
  });

  const after = snapshotUser(updatedUser);

  await createAuditLog({
    actorUserId: toBigIntId(actorId, 'actor id'),
    targetUserId,
    action: ADMIN_AUDIT_ACTIONS.UPDATE_ROLE,
    reason,
    before,
    after,
  });

  const [activeSessionCount, lastSessionAt] = await Promise.all([
    getActiveSessionCount(updatedUser.id),
    getLastSessionAt(updatedUser.id),
  ]);

  return serializeAdminUser(updatedUser, { activeSessionCount, lastSessionAt });
};

export const adminRevokeUserSessions = async ({
  id,
  actorId,
  reason,
}: {
  id: string;
  actorId: bigint;
  reason?: string;
}) => {
  const targetUserId = toBigIntId(id, 'user id');
  await ensureTargetIsNotProtectedAdmin(targetUserId);

  const existingUser = await getAdminUserById(id);
  const before = {
    ...snapshotUser(existingUser),
    activeSessionCount: await prisma.authSession.count({
      where: {
        userId: targetUserId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    }),
  };

  const revokeResult = await revokeAllSessionsForUser(targetUserId);

  await createAuditLog({
    actorUserId: toBigIntId(actorId, 'actor id'),
    targetUserId,
    action: ADMIN_AUDIT_ACTIONS.REVOKE_SESSIONS,
    reason,
    before,
    after: {
      ...before,
      activeSessionCount: 0,
      revokedSessionCount: revokeResult.count,
    },
  });

  return {
    revokedCount: revokeResult.count,
  };
};

export const adminBulkUpdateStatus = async ({
  actorId,
  userIds,
  status,
  reason,
}: {
  actorId: bigint;
  userIds: string[];
  status: UserStatus;
  reason?: string;
}) => {
  const actorBigIntId = toBigIntId(actorId, 'actor id');
  const results: Array<ReturnType<typeof mapBulkResult>> = [];

  // Bulk status chạy từng user độc lập để policy protected-admin hay validate reason chỉ chặn đúng bản ghi lỗi.
  for (const userId of userIds) {
    try {
      const user = await adminUpdateUserStatus({
        id: userId,
        actorId: actorBigIntId,
        status,
        reason,
      });
      results.push(mapBulkResult({ userId, success: true, user }));
    } catch (error) {
      if (error instanceof HttpError) {
        results.push(mapBulkResult({ userId, success: false, code: error.statusCode, message: error.message }));
        continue;
      }
      throw error;
    }
  }

  const successCount = results.filter((item) => item.success).length;
  const failureCount = results.length - successCount;

  return {
    successCount,
    failureCount,
    results,
  };
};

export const adminBulkRevokeSessions = async ({
  actorId,
  userIds,
  reason,
}: {
  actorId: bigint;
  userIds: string[];
  reason?: string;
}) => {
  const actorBigIntId = toBigIntId(actorId, 'actor id');
  const results: Array<ReturnType<typeof mapBulkResult>> = [];

  // Thu hồi session hàng loạt cũng giữ partial success để admin không phải chạy lại cả batch vì một user lỗi.
  for (const userId of userIds) {
    try {
      const result = await adminRevokeUserSessions({
        id: userId,
        actorId: actorBigIntId,
        reason,
      });
      results.push(mapBulkResult({ userId, success: true, revokedCount: result.revokedCount }));
    } catch (error) {
      if (error instanceof HttpError) {
        results.push(mapBulkResult({ userId, success: false, code: error.statusCode, message: error.message }));
        continue;
      }
      throw error;
    }
  }

  const successCount = results.filter((item) => item.success).length;
  const failureCount = results.length - successCount;

  return {
    successCount,
    failureCount,
    results,
  };
};

export const adminListAuditLogs = async ({
  page = 1,
  limit = 20,
  actorUserId,
  targetUserId,
  action,
  createdFrom,
  createdTo,
}: Record<string, unknown>) => {
  const parsedPage = normalizePositiveInt(page, 1);
  const parsedLimit = normalizePositiveInt(limit, 20);
  const createdAt = buildDateRange(createdFrom as string | undefined, createdTo as string | undefined);
  const where = {
    ...(actorUserId ? { actorUserId: toBigIntId(actorUserId as string, 'actor user id') } : {}),
    ...(targetUserId ? { targetUserId: toBigIntId(targetUserId as string, 'target user id') } : {}),
    ...(action ? { action } : {}),
    ...(createdAt ? { createdAt } : {}),
  } as Prisma.UserAdminAuditLogWhereInput;

  const [total, logs] = await Promise.all([
    prisma.userAdminAuditLog.count({ where }),
    prisma.userAdminAuditLog.findMany({
      where,
      include: AUDIT_LOG_INCLUDE,
      orderBy: buildAuditOrderBy(),
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),
  ]);

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

export const adminListUserAuditLogs = async ({
  id,
  page = 1,
  limit = 20,
  action,
  createdFrom,
  createdTo,
}: Record<string, unknown>) => {
  const targetUser = await getAdminUserById(String(id));
  const parsedPage = normalizePositiveInt(page, 1);
  const parsedLimit = normalizePositiveInt(limit, 20);
  const createdAt = buildDateRange(createdFrom as string | undefined, createdTo as string | undefined);
  const where = {
    targetUserId: targetUser.id,
    ...(action ? { action } : {}),
    ...(createdAt ? { createdAt } : {}),
  } as Prisma.UserAdminAuditLogWhereInput;

  const [total, logs] = await Promise.all([
    prisma.userAdminAuditLog.count({ where }),
    prisma.userAdminAuditLog.findMany({
      where,
      include: AUDIT_LOG_INCLUDE,
      orderBy: buildAuditOrderBy(),
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),
  ]);

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
