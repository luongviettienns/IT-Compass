import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import type { Prisma } from '@prisma/client';
import path from 'node:path';
import { requireTestDatabaseUrl } from '../../scripts/test-database-url.mjs';

vi.mock('../../src/db/prisma.js', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const { requireTestDatabaseUrl } = await import('../../scripts/test-database-url.mjs');
  return { prisma: new PrismaClient({ datasources: { db: { url: requireTestDatabaseUrl() } } }) };
});
vi.mock('../../src/socket/booking.events.js', () => ({ emitBookingUpdated: vi.fn() }));
vi.mock('../../src/socket/notification.events.js', () => ({ emitNotificationCreated: vi.fn(), emitNotificationUpdated: vi.fn() }));
vi.mock('../../src/utils/logger.js', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

import { prisma } from '../../src/db/prisma.js';
import {
  adminCancelBooking, adminConfirmBooking, cancelStudentBooking,
  confirmMentorBooking, createBooking,
  getPublicAvailability, adminGetBookingDetail, adminListBookings, updateMentorBookingSettings, expireOverdueBookingRequests,
} from '../../src/services/booking.service.js';
import { emitBookingUpdated } from '../../src/socket/booking.events.js';
import { publicMentorBookingRoutes } from '../../src/routes/booking.routes.js';
import { generateAccessToken } from '../../src/utils/tokens.js';
import { HttpError } from '../../src/utils/httpError.js';
import { startScheduler, stopScheduler } from '../../src/tasks/scheduler.js';

const app = express();
app.use(express.json());
app.use('/api/mentors', publicMentorBookingRoutes);
app.use((error: HttpError, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(error);
  res.status(error.statusCode ?? 500).json(error.toResponseBody());
});
const server = createServer(app);
let apiOrigin: string;
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a test HTTP port');
  apiOrigin = `http://127.0.0.1:${address.port}`;
});

const mentorId = 101n;
const mentorUserId = 1001n;
const studentId = 1n;
const date = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
const slotDate = new Date(`${date}T10:00:00+07:00`);
const input = { date, startTime: '10:00', durationMinute: 60, requestType: 'CUSTOM_TIME' as const, note: null };
const request = (userId = studentId, key?: string, changes: Partial<typeof input> = {}) => createBooking({
  userId, slug: 'test-mentor-101', input: { ...input, ...changes }, ...(key ? { idempotencyKey: key } : {}),
});

const executeDdl = (sql: string) => execFileSync(process.execPath, [
  path.resolve('node_modules/prisma/build/index.js'), 'db', 'execute', '--stdin', '--url', requireTestDatabaseUrl(),
], { input: sql });

describe('booking expiry, business timezone and automatic confirmation', () => {
  it('interprets 10:00 as 03:00 UTC regardless of the host timezone', async () => {
    const booking = await request();
    expect(booking.startAt.toISOString()).toBe(`${date}T03:00:00.000Z`);
    expect(booking).toMatchObject({ date, startTime: '10:00', endTime: '11:00', timezone: 'Asia/Ho_Chi_Minh' });
  });

  it('records a 24-hour response deadline for a distant appointment', async () => {
    const booking = await request();
    const stored = await prisma.mentorBooking.findUniqueOrThrow({ where: { id: BigInt(booking.id) } });
    expect(booking).toMatchObject({ requestExpired: false, expiredAt: null });
    expect(booking).toHaveProperty('responseDueAt', new Date(stored.createdAt.getTime() + 86_400_000));
  });

  it('caps the response deadline at the appointment start', async () => {
    const startAt = new Date(Date.now() + 6 * 3_600_000);
    startAt.setUTCMinutes(0, 0, 0);
    const wall = new Date(startAt.getTime() + 7 * 3_600_000).toISOString();
    const booking = await request(1n, undefined, { date: wall.slice(0, 10), startTime: wall.slice(11, 16) });
    expect(booking).toHaveProperty('responseDueAt', startAt);
  });

  it('honors an enabled automatic-confirm setting and creates chat atomically', async () => {
    await prisma.mentorBookingSetting.create({ data: { mentorId, autoConfirm: true } });
    const bookings = await Promise.all(Array.from({ length: 50 }, () => request(1n, 'auto-confirm-key')));
    expect(new Set(bookings.map((booking) => booking.id)).size).toBe(1);
    expect(bookings[0]).toMatchObject({ status: 'CONFIRMED', responseDueAt: null });
    expect(bookings[0].confirmedAt).toBeInstanceOf(Date);
    expect(await prisma.conversation.count()).toBe(1);
    expect(await prisma.notification.count({ where: { type: 'BOOKING_REQUESTED' } })).toBe(0);
    expect(await prisma.notification.count({ where: { type: 'BOOKING_CONFIRMED' } })).toBe(2);
  });

  it('allows mentors to enable and later disable automatic confirmation', async () => {
    expect(await updateMentorBookingSettings({ userId: mentorUserId, input: { autoConfirm: true } }))
      .toMatchObject({ settings: { autoConfirm: true } });
    expect(await updateMentorBookingSettings({ userId: mentorUserId, input: { autoConfirm: false } }))
      .toMatchObject({ settings: { autoConfirm: false } });
  });

  it('excludes a legacy request older than 24 hours from displayed availability', async () => {
    const legacy = await prisma.mentorBooking.create({ data: {
      mentorId, studentUserId: 1n, startAt: slotDate, endAt: new Date(slotDate.getTime() + 3_600_000),
      durationMinute: 60, createdAt: new Date(Date.now() - 25 * 3_600_000),
    } });
    expect(await adminGetBookingDetail({ bookingId: legacy.id })).toMatchObject({ requestExpired: true });
    const available = await getPublicAvailability({ slug: 'test-mentor-101', date, durationMinute: 60 });
    expect(available.slots.some((slot) => slot.startTime === '10:00')).toBe(true);
  });

  it('refuses to confirm a legacy overdue request before the expiry job runs', async () => {
    const legacy = await prisma.mentorBooking.create({ data: {
      mentorId, studentUserId: 1n, startAt: slotDate, endAt: new Date(slotDate.getTime() + 3_600_000),
      durationMinute: 60, createdAt: new Date(Date.now() - 25 * 3_600_000),
    } });
    await expect(adminConfirmBooking({ bookingId: legacy.id })).rejects
      .toMatchObject({ statusCode: 409, code: 'BOOKING_REQUEST_EXPIRED' });
    expect(await prisma.conversation.count()).toBe(0);
  });

  it('frees a student quota consumed by expired requests without waiting for a job', async () => {
    await prisma.mentorBooking.createMany({ data: Array.from({ length: 5 }, (_, index) => ({
      mentorId: BigInt(102 + index), studentUserId: 1n, startAt: slotDate,
      endAt: new Date(slotDate.getTime() + 3_600_000), durationMinute: 60,
      createdAt: new Date(Date.now() - 25 * 3_600_000),
    })) });
    expect(await request()).toMatchObject({ status: 'REQUESTED' });
  });

  it('counts requests by the current business day rather than the appointment day', async () => {
    for (const startTime of ['10:00', '12:00', '14:00']) await request(1n, undefined, { startTime });
    await expect(request(1n, undefined, { startTime: '16:00' })).rejects
      .toMatchObject({ statusCode: 429, code: 'BOOKING_DAILY_MENTOR_LIMIT_REACHED' });
    expect(await prisma.mentorBooking.count()).toBe(3);
  });

  it('automatically records expiry and notifies both participants at scheduler startup', async () => {
    const legacy = await prisma.mentorBooking.create({ data: {
      mentorId, studentUserId: 1n, startAt: slotDate, endAt: new Date(slotDate.getTime() + 3_600_000),
      durationMinute: 60, createdAt: new Date(Date.now() - 25 * 3_600_000),
    } });
    try {
      startScheduler();
      await vi.waitFor(async () => {
        expect((await prisma.mentorBooking.findUniqueOrThrow({ where: { id: legacy.id } })).expiredAt).toBeInstanceOf(Date);
        expect(await prisma.notification.count()).toBe(2);
      });
      expect(await adminGetBookingDetail({ bookingId: legacy.id })).toMatchObject({ status: 'REQUESTED', requestExpired: true });
      expect((await prisma.notification.findMany()).every((notification) => notification.title.includes('hết hạn'))).toBe(true);
    } finally { stopScheduler(); }
  });

  it('rejects automatic confirmation outside the mentor opened hours', async () => {
    await prisma.mentorBookingSetting.create({ data: { mentorId, autoConfirm: true } });
    await expect(request(1n, undefined, { startTime: '18:00' })).rejects.toMatchObject({ code: 'BOOKING_OUTSIDE_AVAILABILITY' });
    expect(await prisma.mentorBooking.count()).toBe(0);
  });

  it('rejects confirmation at the exact response deadline', async () => {
    const created = await request();
    const due = new Date(Math.floor(Date.now() / 1000) * 1000);
    await prisma.mentorBooking.update({ where: { id: BigInt(created.id) }, data: { responseDueAt: due } });
    await expect(confirmMentorBooking({ userId: mentorUserId, bookingId: BigInt(created.id) })).rejects
      .toMatchObject({ code: 'BOOKING_REQUEST_EXPIRED' });
  });

  it('deduplicates concurrent expiry workers and replays the expired booking', async () => {
    const booking = await request(1n, 'expired-replay');
    const id = BigInt(booking.id);
    await prisma.mentorBooking.update({ where: { id }, data: { responseDueAt: new Date(Date.now() - 1000) } });
    vi.mocked(emitBookingUpdated).mockClear();
    const results = await Promise.all(Array.from({ length: 10 }, () => expireOverdueBookingRequests()));
    expect(results.reduce((sum, result) => sum + result.expired, 0)).toBe(1);
    expect(results.every((result) => result.failed === 0)).toBe(true);
    expect(await prisma.notification.count()).toBe(3); // One request plus two expiry notifications.
    expect(emitBookingUpdated).toHaveBeenCalledTimes(1);
    expect(await request(1n, 'expired-replay')).toMatchObject({ id: booking.id, requestExpired: true });
    expect(await prisma.mentorBooking.count()).toBe(1);
    expect(await expireOverdueBookingRequests()).toEqual({ expired: 0, failed: 0 });
    await expect(cancelStudentBooking({ userId: 1n, bookingId: id, input: {} })).rejects.toMatchObject({ code: 'BOOKING_REQUEST_EXPIRED' });
  });

  it('allows only one replacement among 50 requests for a stale reservation', async () => {
    await prisma.mentorBooking.create({ data: {
      mentorId, studentUserId: 60n, startAt: slotDate, endAt: new Date(slotDate.getTime() + 3_600_000),
      durationMinute: 60, responseDueAt: new Date(Date.now() - 1000),
    } });
    const results = await Promise.allSettled(Array.from({ length: 50 }, (_, index) => request(BigInt(index + 1))));
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await prisma.mentorBooking.count()).toBe(2); // History retained, one new active reservation.
  });

  it('keeps confirmed sessions intact while an expired confirmation races the worker', async () => {
    const stale = await prisma.mentorBooking.create({ data: {
      mentorId, studentUserId: 1n, startAt: slotDate, endAt: new Date(slotDate.getTime() + 3_600_000),
      durationMinute: 60, responseDueAt: new Date(Date.now() - 1000),
    } });
    const confirmed = await prisma.mentorBooking.create({ data: {
      mentorId: 102n, studentUserId: 2n, startAt: new Date(Date.now() - 7_200_000), endAt: new Date(Date.now() - 3_600_000),
      durationMinute: 60, status: 'CONFIRMED', confirmedAt: new Date(Date.now() - 86_400_000),
    } });
    const results = await Promise.allSettled([expireOverdueBookingRequests(), adminConfirmBooking({ bookingId: stale.id })]);
    expect(results[1]).toMatchObject({ status: 'rejected', reason: { code: 'BOOKING_REQUEST_EXPIRED' } });
    expect(await adminGetBookingDetail({ bookingId: confirmed.id })).toMatchObject({ status: 'CONFIRMED', expiredAt: null, outcomeReviewRequired: true });
    expect(await prisma.conversation.count()).toBe(0);
  });

  it('rolls back expiry when its notification cannot be persisted, then safely retries', async () => {
    const stale = await prisma.mentorBooking.create({ data: {
      mentorId, studentUserId: 1n, startAt: slotDate, endAt: new Date(slotDate.getTime() + 3_600_000),
      durationMinute: 60, responseDueAt: new Date(Date.now() - 1000),
    } });
    executeDdl("CREATE TRIGGER ic004_notification_failure BEFORE INSERT ON thong_bao FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'test expiry rollback'");
    try {
      expect(await expireOverdueBookingRequests()).toEqual({ expired: 0, failed: 1 });
      expect((await prisma.mentorBooking.findUniqueOrThrow({ where: { id: stale.id } })).expiredAt).toBeNull();
      expect(await prisma.notification.count()).toBe(0);
    } finally { executeDdl('DROP TRIGGER IF EXISTS ic004_notification_failure'); }
    expect(await expireOverdueBookingRequests()).toEqual({ expired: 1, failed: 0 });
    expect(await prisma.notification.count()).toBe(2);
  });

  it('keeps expired requests in history and removes them from the pending work queue', async () => {
    await prisma.mentorBooking.create({ data: {
      mentorId, studentUserId: 1n, startAt: slotDate, endAt: new Date(slotDate.getTime() + 3_600_000),
      durationMinute: 60, responseDueAt: new Date(Date.now() - 1000),
    } });
    await request(2n, undefined, { startTime: '12:00' });
    const pending = await adminListBookings({ query: { status: 'REQUESTED', page: 1, limit: 20 } });
    expect(pending.bookings).toHaveLength(1);
    expect(pending.bookings[0].startTime).toBe('12:00');
    expect((await adminListBookings({ query: { page: 1, limit: 20 } })).bookings).toHaveLength(2);
  });

  it('checks the deadline again if it passes while confirmation validates overlap', async () => {
    const created = await request();
    const due = new Date(Math.ceil(Date.now() / 1000) * 1000 + 20_000);
    await prisma.mentorBooking.update({ where: { id: BigInt(created.id) }, data: { responseDueAt: due } });
    const transact = prisma.$transaction.bind(prisma);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(due.getTime() - 1000));
    const probe = vi.spyOn(prisma, '$transaction').mockImplementationOnce((async (
      task: (tx: Prisma.TransactionClient) => Promise<unknown>,
      options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel },
    ) => transact(async (tx) => {
      const read = tx.mentorBooking.findMany.bind(tx.mentorBooking);
      const readProbe = vi.spyOn(tx.mentorBooking, 'findMany').mockImplementation((args) => {
        const rows = read(args);
        void rows.then(() => vi.setSystemTime(due)); // Keep the real Prisma query and its promise.
        return rows;
      });
      try { return await task(tx); } finally { readProbe.mockRestore(); }
    }, options)) as typeof prisma.$transaction);
    try {
      await expect(adminConfirmBooking({ bookingId: BigInt(created.id) })).rejects.toMatchObject({ code: 'BOOKING_REQUEST_EXPIRED' });
      expect(await prisma.conversation.count()).toBe(0);
    } finally { probe.mockRestore(); vi.useRealTimers(); }
  });
});

beforeEach(async () => {
  // The module factory refuses every non-local/non-test database before any write.
  await prisma.notification.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.mentorBooking.deleteMany();
  await prisma.mentorBookingSetting.deleteMany();
  await prisma.mentorAvailability.deleteMany();
  await prisma.mentor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.createMany({ data: [
    ...Array.from({ length: 60 }, (_, index) => ({
      id: BigInt(index + 1), fullName: `Test Student ${index + 1}`,
      email: `student-${index + 1}@ic003.example.test`, passwordHash: 'test-only', role: 'STUDENT' as const,
    })),
    ...Array.from({ length: 12 }, (_, index) => ({
      id: BigInt(1001 + index), fullName: `Test Mentor ${index + 1}`,
      email: `mentor-${index + 1}@ic003.example.test`, passwordHash: 'test-only', role: 'MENTOR' as const,
    })),
  ] });
  await prisma.mentor.createMany({ data: Array.from({ length: 12 }, (_, index) => ({
    id: BigInt(101 + index), userId: BigInt(1001 + index), name: `Test Mentor ${index + 1}`,
    slug: `test-mentor-${101 + index}`, status: 'ACTIVE' as const,
  })) });
  await prisma.mentorAvailability.create({ data: { mentorId, weekday: new Date(`${date}T00:00:00Z`).getUTCDay(), startMinute: 600, endMinute: 1020, isActive: true } });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await prisma.$disconnect();
});

describe('real MySQL booking concurrency', () => {
  it('allows exactly one of 50 independent requests for the same mentor time', async () => {
    const results = await Promise.allSettled(Array.from({ length: 50 }, (_, index) => request(BigInt(index + 1))));
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    for (const result of results) {
      if (result.status === 'rejected') expect(result.reason).toMatchObject({ statusCode: 409, code: 'BOOKING_TIME_CONFLICT' });
    }
    expect(await prisma.mentorBooking.count({ where: { status: { in: ['REQUESTED', 'CONFIRMED'] } } })).toBe(1);
    expect(await prisma.notification.count({ where: { type: 'BOOKING_REQUESTED' } })).toBe(1);
  });

  it('keeps adjacent times bookable when no buffer is configured', async () => {
    const results = await Promise.all([request(1n), request(2n, undefined, { startTime: '11:00' })]);
    expect(new Set(results.map((booking) => booking.id)).size).toBe(2);
  });

  it('honors the mentor buffer when requests arrive together', async () => {
    await prisma.mentorBookingSetting.create({ data: { mentorId, bufferAfterMinute: 15 } });
    const results = await Promise.allSettled([request(1n), request(2n, undefined, { startTime: '11:00' })]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  });

  it('checks the new session buffer when an earlier time is booked after a later time', async () => {
    await prisma.mentorBookingSetting.create({ data: { mentorId, bufferAfterMinute: 15 } });
    await request(1n, undefined, { startTime: '11:00' });
    await expect(request(2n)).rejects.toMatchObject({ statusCode: 409, code: 'BOOKING_TIME_CONFLICT' });
    expect(await prisma.mentorBooking.count()).toBe(1);
  });

  it('reserves both preparation and recovery time between sessions', async () => {
    await prisma.mentorBookingSetting.create({ data: { mentorId, bufferBeforeMinute: 15, bufferAfterMinute: 15 } });
    await request(1n);
    await expect(request(2n, undefined, { startTime: '11:15' })).rejects.toMatchObject({ code: 'BOOKING_TIME_CONFLICT' });
    expect(await request(2n, undefined, { startTime: '11:30' })).toMatchObject({ status: 'REQUESTED' });
  });

  it('uses the same buffered conflict rule when displaying available slots', async () => {
    await prisma.mentorBookingSetting.create({ data: { mentorId, bufferBeforeMinute: 15, bufferAfterMinute: 30 } });
    await request(1n);
    const result = await getPublicAvailability({ slug: 'test-mentor-101', date, durationMinute: 60 });
    expect(result.slots.some((slot) => slot.startTime === '11:30')).toBe(false);
    expect(result.slots.some((slot) => slot.startTime === '12:00')).toBe(true);
  });

  it('returns one booking and one notification for 50 concurrent retries with one key', async () => {
    const results = await Promise.all(Array.from({ length: 50 }, () => request(1n, 'retry-create-1')));
    expect(new Set(results.map((booking) => booking.id)).size).toBe(1);
    expect(await prisma.mentorBooking.count()).toBe(1);
    expect(await prisma.notification.count({ where: { type: 'BOOKING_REQUESTED' } })).toBe(1);
    expect(emitBookingUpdated).toHaveBeenCalledTimes(1);
  });

  it('rejects reusing a key for a different request', async () => {
    await request(1n, 'changed-payload-1');
    await expect(request(1n, 'changed-payload-1', { startTime: '12:00' }))
      .rejects.toMatchObject({ statusCode: 409, code: 'BOOKING_IDEMPOTENCY_CONFLICT' });
    expect(await prisma.mentorBooking.count()).toBe(1);
  });

  it('scopes request keys to the student and treats different key casing independently', async () => {
    const first = await request(1n, 'Shared-Key');
    const otherStudent = await request(2n, 'Shared-Key', { startTime: '12:00' });
    const differentKey = await request(1n, 'shared-key', { startTime: '14:00' });
    expect(new Set([first.id, otherStudent.id, differentKey.id]).size).toBe(3);
    expect(await request(1n, 'Shared-Key')).toMatchObject({ id: first.id, student: { id: '1' } });
  });

  it('replays a cancelled booking without rechecking new availability policy', async () => {
    const created = await request(1n, 'cancel-replay-1');
    await cancelStudentBooking({ userId: 1n, bookingId: BigInt(created.id), input: { reason: 'Test cancellation' } });
    await prisma.mentor.update({ where: { id: mentorId }, data: { status: 'PAUSED' } });
    expect(await request(1n, 'cancel-replay-1')).toMatchObject({ id: created.id, status: 'CANCELLED_BY_STUDENT' });
    expect(await prisma.mentorBooking.count()).toBe(1);
  });

  it('replays a committed request if the mentor pauses during the optimistic lookup commit gap', async () => {
    const nativeFindUnique = prisma.mentorBooking.findUnique.bind(prisma.mentorBooking);
    let originalReceipt: Awaited<ReturnType<typeof createBooking>> | undefined;
    // Both reads and the intervening commit use MySQL. Only their timing is
    // controlled, so the first observer returns its real pre-commit snapshot.
    const observeCommitGap = async (args: Parameters<typeof nativeFindUnique>[0]) => {
      const snapshot = await nativeFindUnique(args);
      originalReceipt = await request(1n, 'commit-gap-key');
      await prisma.mentor.update({ where: { id: mentorId }, data: { status: 'PAUSED' } });
      return snapshot;
    };
    const observation = vi.spyOn(prisma.mentorBooking, 'findUnique')
      .mockImplementationOnce(observeCommitGap as unknown as typeof prisma.mentorBooking.findUnique);
    try {
      const replay = await request(1n, 'commit-gap-key');
      expect(originalReceipt?.id).toMatch(/^\d+$/);
      expect(replay.id).toBe(originalReceipt?.id);
      expect(await prisma.mentorBooking.count()).toBe(1);
      expect(await prisma.notification.count({ where: { type: 'BOOKING_REQUESTED' } })).toBe(1);
    } finally {
      observation.mockRestore();
    }
  });

  it('serializes mentor/admin confirmations and emits each transition only once', async () => {
    const created = await request();
    vi.mocked(emitBookingUpdated).mockClear();
    const bookingId = BigInt(created.id);
    const results = await Promise.all(Array.from({ length: 50 }, (_, index) => index % 2
      ? adminConfirmBooking({ bookingId })
      : confirmMentorBooking({ userId: mentorUserId, bookingId })));
    expect(results.every((booking) => booking.status === 'CONFIRMED')).toBe(true);
    expect(await prisma.conversation.count()).toBe(1);
    expect(await prisma.notification.count({ where: { type: 'BOOKING_CONFIRMED' } })).toBe(1);
    expect(emitBookingUpdated).toHaveBeenCalledTimes(1);
  });

  it('refuses admin confirmation of overlapping historical requests', async () => {
    await request(1n);
    const candidate = await prisma.mentorBooking.create({ data: {
      mentorId, studentUserId: 2n, startAt: slotDate, endAt: new Date(slotDate.getTime() + 60 * 60_000),
      durationMinute: 60, status: 'REQUESTED', requestType: 'CUSTOM_TIME',
    } });
    await expect(adminConfirmBooking({ bookingId: candidate.id }))
      .rejects.toMatchObject({ statusCode: 409, code: 'BOOKING_TIME_CONFLICT' });
    expect((await prisma.mentorBooking.findUniqueOrThrow({ where: { id: candidate.id } })).status).toBe('REQUESTED');
  });

  it('never resurrects a cancelled booking under simultaneous confirmations/cancellations', async () => {
    const created = await request();
    const bookingId = BigInt(created.id);
    await Promise.allSettled(Array.from({ length: 50 }, (_, index) => index % 2
      ? adminConfirmBooking({ bookingId })
      : adminCancelBooking({ bookingId, reason: 'Concurrency test cancellation' })));
    expect((await prisma.mentorBooking.findUniqueOrThrow({ where: { id: bookingId } })).status).toBe('CANCELLED_BY_MENTOR');
  });

  it('attributes an admin cancellation correctly and does not repeat its notification', async () => {
    const created = await request();
    const bookingId = BigInt(created.id);
    await adminCancelBooking({ bookingId, reason: 'Test admin review' });
    await adminCancelBooking({ bookingId, reason: 'Test retry' });
    const notifications = await prisma.notification.findMany({ where: { type: 'BOOKING_CANCELLED_BY_MENTOR' } });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toContain('Quản trị viên');
    expect(notifications[0].body).toContain('Quản trị viên');
  });

  it('uses neutral confirmation wording when an admin approves a booking', async () => {
    const created = await request();
    await adminConfirmBooking({ bookingId: BigInt(created.id) });
    const notification = await prisma.notification.findFirstOrThrow({ where: { type: 'BOOKING_CONFIRMED' } });
    expect(notification.body).toContain('đã được xác nhận');
  });

  it('enforces the student quota across different mentor calendars', async () => {
    const results = await Promise.allSettled(Array.from({ length: 12 }, (_, index) => createBooking({
      userId: 1n, slug: `test-mentor-${101 + index}`, input,
    })));
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(5);
    expect(await prisma.mentorBooking.count()).toBe(5);
  });

  it('rolls back the booking when durable notification storage fails', async () => {
    executeDdl("CREATE TRIGGER ic003_reject_notification BEFORE INSERT ON thong_bao FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'IC003 test notification failure';");
    try {
      await expect(request(1n, 'atomic-notification-1')).rejects.toBeTruthy();
      expect(await prisma.mentorBooking.count()).toBe(0);
    } finally {
      executeDdl('DROP TRIGGER ic003_reject_notification;');
    }
    expect(await request(1n, 'atomic-notification-1')).toMatchObject({ status: 'REQUESTED' });
    expect(await prisma.notification.count({ where: { type: 'BOOKING_REQUESTED' } })).toBe(1);
  });
});

describe('real booking HTTP route, auth and MySQL', () => {
  const sendRequest = async (key: string, token?: string) => {
    const response = await fetch(`${apiOrigin}/api/mentors/test-mentor-101/bookings`, {
      method: 'POST', headers: {
        'Content-Type': 'application/json', 'Idempotency-Key': key,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }, body: JSON.stringify(input),
    });
    return { status: response.status, body: await response.json() as { code?: string; booking?: { id: string; [field: string]: unknown } } };
  };

  it('forwards the idempotency header through the registered route and never exposes private hashes', async () => {
    const token = generateAccessToken({ id: 50n, role: 'STUDENT', status: 'ACTIVE' });
    const first = await sendRequest('http-retry-key', token);
    const retry = await sendRequest('http-retry-key', token);
    expect(first.status).toBe(201);
    expect(retry.status).toBe(201);
    expect(first.body.booking?.id).toMatch(/^\d+$/);
    expect(retry.body.booking?.id).toBe(first.body.booking?.id);
    expect(first.body.booking).not.toHaveProperty('requestKeyHash');
    expect(first.body.booking).not.toHaveProperty('requestPayloadHash');
    expect(await prisma.mentorBooking.count()).toBe(1);
    expect(await prisma.notification.count({ where: { type: 'BOOKING_REQUESTED' } })).toBe(1);
  });

  it('rejects a malformed header before saving a booking', async () => {
    const token = generateAccessToken({ id: 50n, role: 'STUDENT', status: 'ACTIVE' });
    expect(await sendRequest('invalid key with spaces', token)).toMatchObject({ status: 400, body: { code: 'VALIDATION_FAILED' } });
    expect(await prisma.mentorBooking.count()).toBe(0);
  });

  it('keeps authentication and role authorization in force', async () => {
    expect((await sendRequest('anonymous-key')).status).toBe(401);
    const token = generateAccessToken({ id: mentorUserId, role: 'MENTOR', status: 'ACTIVE' });
    expect((await sendRequest('mentor-key', token)).status).toBe(403);
    expect(await prisma.mentorBooking.count()).toBe(0);
  });
});
