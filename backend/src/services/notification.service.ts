import type { BookingRequestType, BookingStatus, NotificationType, Prisma } from '@prisma/client';

import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';
import { emitNotificationCreated, emitNotificationUpdated, type SerializedNotification } from '../socket/notification.events.js';
import type { ListNotificationsQuery } from '../validators/notification.validator.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const BOOKING_REMINDER_MINUTE = 30;
const BOOKING_REMINDER_WINDOW_MINUTE = 1;

const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  body: true,
  dataJson: true,
  dedupeKey: true,
  readAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSelect;

const reminderBookingSelect = {
  id: true,
  mentorId: true,
  studentUserId: true,
  startAt: true,
  endAt: true,
  durationMinute: true,
  status: true,
  requestType: true,
  mentor: {
    select: {
      userId: true,
      name: true,
    },
  },
  student: {
    select: {
      id: true,
      fullName: true,
    },
  },
} satisfies Prisma.MentorBookingSelect;

type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;
type ReminderBookingRecord = Prisma.MentorBookingGetPayload<{ select: typeof reminderBookingSelect }>;
type NotificationClient = typeof prisma | Prisma.TransactionClient;

export type BookingNotificationSource = {
  bookingId: bigint;
  mentorUserId: bigint | null;
  mentorName: string;
  studentUserId: bigint;
  studentName: string;
  startAt: Date;
  endAt: Date;
  durationMinute: number;
  status: BookingStatus;
  requestType: BookingRequestType;
  cancelReason?: string | null;
};

type NotificationCreateInput = {
  userId: bigint;
  type: NotificationType;
  title: string;
  body: string;
  data: Prisma.InputJsonValue;
  dedupeKey?: string | null;
};

type BookingNotificationTarget = {
  userId: bigint;
  type: NotificationType;
  title: string;
  body: string;
  data: Prisma.InputJsonValue;
  dedupeKey: string;
};

const toPositiveInteger = (value: unknown, fallback: number) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : fallback;
};

const normalizePagination = (query: ListNotificationsQuery) => ({
  page: toPositiveInteger(query.page, DEFAULT_PAGE),
  limit: toPositiveInteger(query.limit, DEFAULT_LIMIT),
});

const formatBookingDateTime = (startAt: Date, endAt: Date) => {
  const date = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(startAt);

  const startTime = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(startAt);

  const endTime = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(endAt);

  return `${date}, ${startTime} - ${endTime}`;
};

const serializeNotification = (notification: NotificationRecord): SerializedNotification => ({
  id: String(notification.id),
  userId: String(notification.userId),
  type: notification.type,
  title: notification.title,
  body: notification.body,
  data: notification.dataJson,
  dedupeKey: notification.dedupeKey,
  readAt: notification.readAt,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
  isRead: notification.readAt !== null,
});

const isPrismaUniqueConstraintError = (error: unknown) => (
  typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002'
);

const createNotificationRecord = async (input: NotificationCreateInput, client: NotificationClient = prisma) => {
  if (input.dedupeKey) {
    const existing = await client.notification.findUnique({
      where: { dedupeKey: input.dedupeKey },
      select: notificationSelect,
    });

    if (existing) {
      return serializeNotification(existing);
    }
  }

  try {
    const notification = await client.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        dataJson: input.data,
        dedupeKey: input.dedupeKey ?? null,
      },
      select: notificationSelect,
    });

    const serialized = serializeNotification(notification);
    emitNotificationCreated(serialized);
    return serialized;
  } catch (error) {
    if (input.dedupeKey && isPrismaUniqueConstraintError(error)) {
      const existing = await client.notification.findUnique({
        where: { dedupeKey: input.dedupeKey },
        select: notificationSelect,
      });

      if (existing) {
        return serializeNotification(existing);
      }
    }

    throw error;
  }
};

const buildBookingNotificationData = (
  booking: BookingNotificationSource,
  extra: Record<string, unknown> = {},
): Prisma.InputJsonValue => ({
  bookingId: String(booking.bookingId),
  mentorUserId: booking.mentorUserId ? String(booking.mentorUserId) : null,
  mentorName: booking.mentorName,
  studentUserId: String(booking.studentUserId),
  studentName: booking.studentName,
  startAt: booking.startAt.toISOString(),
  endAt: booking.endAt.toISOString(),
  durationMinute: booking.durationMinute,
  status: booking.status,
  requestType: booking.requestType,
  cancelReason: booking.cancelReason ?? null,
  ...extra,
});

const buildBookingNotificationTargets = (
  booking: BookingNotificationSource,
  type: NotificationType,
): BookingNotificationTarget[] => {
  const timeLabel = formatBookingDateTime(booking.startAt, booking.endAt);
  const requestTypeLabel = booking.requestType === 'CUSTOM_TIME'
    ? 'đề xuất khung giờ riêng'
    : 'đặt lịch theo khung giờ có sẵn';
  const cancelReasonLabel = booking.cancelReason ? ` Lý do: ${booking.cancelReason}.` : '';
  const data = buildBookingNotificationData(booking, {
    notificationType: type,
    ...(type === 'BOOKING_REMINDER' ? { reminderMinutes: BOOKING_REMINDER_MINUTE } : {}),
  });

  const pushTarget = (
    targets: BookingNotificationTarget[],
    userId: bigint | null,
    title: string,
    body: string,
    dedupeSuffix: string,
  ) => {
    if (!userId) return;

    targets.push({
      userId,
      type,
      title,
      body,
      data,
      dedupeKey: `booking:${String(booking.bookingId)}:${dedupeSuffix}:${String(userId)}`,
    });
  };

  const targets: BookingNotificationTarget[] = [];

  switch (type) {
    case 'BOOKING_REQUESTED':
      pushTarget(
        targets,
        booking.mentorUserId,
        'Yêu cầu tư vấn mới',
        `${booking.studentName} đã ${requestTypeLabel} vào ${timeLabel}.`,
        'requested',
      );
      break;
    case 'BOOKING_CONFIRMED':
      pushTarget(
        targets,
        booking.studentUserId,
        'Lịch tư vấn đã được xác nhận',
        `Mentor ${booking.mentorName} đã xác nhận lịch tư vấn vào ${timeLabel}. Bạn có thể mở chat ngay bây giờ.`,
        'confirmed',
      );
      break;
    case 'BOOKING_CANCELLED_BY_STUDENT':
      pushTarget(
        targets,
        booking.mentorUserId,
        'Học viên đã hủy lịch',
        `${booking.studentName} đã hủy lịch tư vấn vào ${timeLabel}.${cancelReasonLabel}`,
        'cancelled-by-student',
      );
      break;
    case 'BOOKING_CANCELLED_BY_MENTOR':
      pushTarget(
        targets,
        booking.studentUserId,
        'Mentor đã hủy lịch',
        `Mentor ${booking.mentorName} đã hủy lịch tư vấn vào ${timeLabel}.${cancelReasonLabel}`,
        'cancelled-by-mentor',
      );
      break;
    case 'BOOKING_COMPLETED':
      pushTarget(
        targets,
        booking.mentorUserId,
        'Buổi tư vấn đã hoàn thành',
        `Buổi tư vấn với ${booking.studentName} vào ${timeLabel} đã được đánh dấu hoàn thành.`,
        'completed',
      );
      pushTarget(
        targets,
        booking.studentUserId,
        'Buổi tư vấn đã hoàn thành',
        `Buổi tư vấn với mentor ${booking.mentorName} vào ${timeLabel} đã được đánh dấu hoàn thành.`,
        'completed',
      );
      break;
    case 'BOOKING_NO_SHOW':
      pushTarget(
        targets,
        booking.mentorUserId,
        'Lịch tư vấn bị đánh dấu không tham dự',
        `Buổi tư vấn với ${booking.studentName} vào ${timeLabel} đã được đánh dấu không tham dự.`,
        'no-show',
      );
      pushTarget(
        targets,
        booking.studentUserId,
        'Lịch tư vấn bị đánh dấu không tham dự',
        `Buổi tư vấn với mentor ${booking.mentorName} vào ${timeLabel} đã được đánh dấu không tham dự.`,
        'no-show',
      );
      break;
    case 'BOOKING_REMINDER':
      pushTarget(
        targets,
        booking.mentorUserId,
        'Sắp đến giờ tư vấn',
        `Buổi tư vấn vào ${timeLabel} sẽ bắt đầu sau 30 phút.`,
        'reminder-30m',
      );
      pushTarget(
        targets,
        booking.studentUserId,
        'Sắp đến giờ tư vấn',
        `Buổi tư vấn vào ${timeLabel} sẽ bắt đầu sau 30 phút.`,
        'reminder-30m',
      );
      break;
    default:
      break;
  }

  return targets;
};

const dispatchBookingNotifications = async (booking: BookingNotificationSource, type: NotificationType) => {
  const targets = buildBookingNotificationTargets(booking, type);
  if (targets.length === 0) return;

  const results = await Promise.allSettled(targets.map((target) => createNotificationRecord(target)));
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

  if (failures.length > 0) {
    logger.error('Some booking notifications failed to persist', {
      type,
      bookingId: String(booking.bookingId),
      failureCount: failures.length,
    });
  }
};

const toReminderBookingNotificationSource = (booking: ReminderBookingRecord): BookingNotificationSource => ({
  bookingId: booking.id,
  mentorUserId: booking.mentor.userId,
  mentorName: booking.mentor.name,
  studentUserId: booking.studentUserId,
  studentName: booking.student.fullName,
  startAt: booking.startAt,
  endAt: booking.endAt,
  durationMinute: booking.durationMinute,
  status: booking.status,
  requestType: booking.requestType,
  cancelReason: null,
});

export const listNotifications = async ({ userId, query }: { userId: bigint; query: ListNotificationsQuery }) => {
  const { page, limit } = normalizePagination(query);
  const where = { userId } satisfies Prisma.NotificationWhereInput;

  const [total, unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.notification.findMany({
      where,
      select: notificationSelect,
      orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    notifications: notifications.map(serializeNotification),
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const getUnreadNotificationCount = async ({ userId }: { userId: bigint }) => {
  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });

  return { unreadCount };
};

export const markNotificationAsRead = async ({ userId, notificationId }: { userId: bigint; notificationId: bigint }) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
    select: notificationSelect,
  });

  if (!notification) {
    throw new HttpError(404, 'Notification not found', undefined, 'NOTIFICATION_NOT_FOUND');
  }

  if (notification.readAt) {
    return serializeNotification(notification);
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      readAt: new Date(),
    },
    select: notificationSelect,
  });

  const serialized = serializeNotification(updatedNotification);
  emitNotificationUpdated(serialized);
  return serialized;
};

export const markAllNotificationsAsRead = async ({ userId }: { userId: bigint }) => {
  const unreadNotifications = await prisma.notification.findMany({
    where: {
      userId,
      readAt: null,
    },
    select: notificationSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  if (unreadNotifications.length === 0) {
    return { updatedCount: 0 };
  }

  const now = new Date();
  const ids = unreadNotifications.map((notification) => notification.id);

  await prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId,
      readAt: null,
    },
    data: {
      readAt: now,
    },
  });

  const refreshedNotifications = await prisma.notification.findMany({
    where: {
      id: { in: ids },
      userId,
    },
    select: notificationSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  for (const notification of refreshedNotifications) {
    emitNotificationUpdated(serializeNotification(notification));
  }

  return { updatedCount: refreshedNotifications.length };
};

export const notifyBookingRequested = async (booking: BookingNotificationSource) => {
  await dispatchBookingNotifications(booking, 'BOOKING_REQUESTED');
};

export const notifyBookingConfirmed = async (booking: BookingNotificationSource) => {
  await dispatchBookingNotifications(booking, 'BOOKING_CONFIRMED');
};

export const notifyBookingCancelledByStudent = async (booking: BookingNotificationSource) => {
  await dispatchBookingNotifications(booking, 'BOOKING_CANCELLED_BY_STUDENT');
};

export const notifyBookingCancelledByMentor = async (booking: BookingNotificationSource) => {
  await dispatchBookingNotifications(booking, 'BOOKING_CANCELLED_BY_MENTOR');
};

export const notifyBookingCompleted = async (booking: BookingNotificationSource) => {
  await dispatchBookingNotifications(booking, 'BOOKING_COMPLETED');
};

export const notifyBookingNoShow = async (booking: BookingNotificationSource) => {
  await dispatchBookingNotifications(booking, 'BOOKING_NO_SHOW');
};

export const sendBookingReminderNotifications = async () => {
  const now = new Date();
  const reminderAt = new Date(now.getTime() + BOOKING_REMINDER_MINUTE * 60_000);
  const windowStart = new Date(reminderAt.getTime() - BOOKING_REMINDER_WINDOW_MINUTE * 60_000);
  const windowEnd = new Date(reminderAt.getTime() + BOOKING_REMINDER_WINDOW_MINUTE * 60_000);

  const reminderBookings = await prisma.mentorBooking.findMany({
    where: {
      status: 'CONFIRMED',
      startAt: {
        gte: windowStart,
        lt: windowEnd,
      },
    },
    select: reminderBookingSelect,
    orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
    take: 100,
  });

  if (reminderBookings.length === 0) {
    return { bookings: 0 };
  }

  await Promise.allSettled(
    reminderBookings.map((booking) => dispatchBookingNotifications(toReminderBookingNotificationSource(booking), 'BOOKING_REMINDER')),
  );

  return { bookings: reminderBookings.length };
};
