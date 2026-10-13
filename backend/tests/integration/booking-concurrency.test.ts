import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
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
  getPublicAvailability,
} from '../../src/services/booking.service.js';
import { emitBookingUpdated } from '../../src/socket/booking.events.js';
import { publicMentorBookingRoutes } from '../../src/routes/booking.routes.js';
import { generateAccessToken } from '../../src/utils/tokens.js';
import { HttpError } from '../../src/utils/httpError.js';

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
const slotDate = new Date();
slotDate.setDate(slotDate.getDate() + 2);
slotDate.setHours(10, 0, 0, 0);
const date = `${slotDate.getFullYear()}-${String(slotDate.getMonth() + 1).padStart(2, '0')}-${String(slotDate.getDate()).padStart(2, '0')}`;
const input = { date, startTime: '10:00', durationMinute: 60, requestType: 'CUSTOM_TIME' as const, note: null };
const request = (userId = studentId, key?: string, changes: Partial<typeof input> = {}) => createBooking({
  userId, slug: 'test-mentor-101', input: { ...input, ...changes }, ...(key ? { idempotencyKey: key } : {}),
});

const executeDdl = (sql: string) => execFileSync(process.execPath, [
  path.resolve('node_modules/prisma/build/index.js'), 'db', 'execute', '--stdin', '--url', requireTestDatabaseUrl(),
], { input: sql });

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
  await prisma.mentorAvailability.create({ data: { mentorId, weekday: slotDate.getDay(), startMinute: 600, endMinute: 1020, isActive: true } });
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
