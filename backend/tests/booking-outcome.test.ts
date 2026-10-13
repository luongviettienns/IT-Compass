import { Prisma } from '@prisma/client';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const doubles = vi.hoisted(() => ({
  prisma: {
    mentorBooking: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
    mentor: { upsert: vi.fn(), findFirst: vi.fn() },
    mentorBookingSetting: { findUnique: vi.fn() },
    authSession: { deleteMany: vi.fn() },
    emailVerificationToken: { deleteMany: vi.fn() },
    passwordResetToken: { deleteMany: vi.fn() },
    blogPost: { findMany: vi.fn() },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
  logger: { info: vi.fn(), error: vi.fn() },
  notifications: {
    notifyBookingCancelledByMentor: vi.fn(),
    notifyBookingCancelledByStudent: vi.fn(),
    notifyBookingCompleted: vi.fn(),
    notifyBookingConfirmed: vi.fn(),
    notifyBookingNoShow: vi.fn(),
    notifyBookingRequested: vi.fn(),
    sendBookingReminderNotifications: vi.fn(),
    persistBookingNotifications: vi.fn(),
    publishBookingNotifications: vi.fn(),
  },
}));

// Only replace external persistence/transport. Scheduling, serialization,
// validation, and state-transition decisions remain the real production code.
vi.mock('../src/db/prisma.js', () => ({ prisma: doubles.prisma }));
vi.mock('../src/utils/logger.js', () => ({ logger: doubles.logger }));
vi.mock('../src/services/notification.service.js', () => doubles.notifications);
vi.mock('../src/services/conversation.service.js', () => ({ ensureConversationForConfirmedBooking: vi.fn() }));
vi.mock('../src/socket/booking.events.js', () => ({ emitBookingUpdated: vi.fn() }));

import {
  adminCompleteBooking,
  adminGetBookingDetail,
  adminMarkNoShowBooking,
  completeMentorBooking,
  createBooking,
  createBookingReview,
} from '../src/services/booking.service.js';
import { startScheduler, stopScheduler } from '../src/tasks/scheduler.js';
import { adminMarkNoShowBooking as noShowController } from '../src/controllers/booking.controller.js';
import { validate } from '../src/middlewares/validate.middleware.js';
import { adminMarkNoShowBookingSchema } from '../src/validators/booking.validator.js';
import { HttpError } from '../src/utils/httpError.js';

const makeBooking = () => ({
  id: 1n, mentorId: 10n, studentUserId: 20n,
  startAt: new Date('2026-10-12T08:00:00Z'),
  endAt: new Date('2026-10-12T09:00:00Z'),
  durationMinute: 60,
  status: 'CONFIRMED' as Prisma.MentorBookingGetPayload<object>['status'],
  requestType: 'AVAILABILITY_SLOT' as const,
  requestKeyHash: null,
  requestPayloadHash: null,
  timezone: 'Asia/Ho_Chi_Minh', responseDueAt: null, expiredAt: null,
  note: null, cancelReason: null, cancelledBy: null, cancelledAt: null,
  confirmedAt: new Date('2026-10-11T08:00:00Z'),
  completedAt: null as Date | null,
  createdAt: new Date('2026-10-11T08:00:00Z'),
  updatedAt: new Date('2026-10-11T08:00:00Z'),
  mentor: {
    id: 10n, userId: 30n, slug: 'test-mentor', name: 'Test Mentor',
    avatarUrl: null, title: null, bio: null, level: null, expertiseArea: null,
    yearsOfExperience: null, hourlyRate: null, currentSchool: null,
    currentCompany: null, currentJobTitle: null, consultationLang: null,
    reviewCount: 0, isVerified: true,
  },
  student: { id: 20n, fullName: 'Test Student', email: 'student@example.test', profile: null },
  review: null,
});

let savedBooking = makeBooking();
const reviewedOutcome = { bookingId: 1n, actorUserId: 99n, reason: 'Mentor confirmed the student did not attend.' };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-12T10:00:00Z'));
  savedBooking = makeBooking();
  doubles.prisma.$queryRaw.mockResolvedValue([{ id: 1n }]);
  doubles.notifications.persistBookingNotifications.mockResolvedValue([]);
  doubles.prisma.mentorBooking.findFirst.mockImplementation(async ({ where }: { where: { mentorId?: bigint; studentUserId?: bigint } }) => (
    (where.mentorId && where.mentorId !== savedBooking.mentorId)
    || (where.studentUserId && where.studentUserId !== savedBooking.studentUserId)
      ? null : { ...savedBooking }
  ));
  doubles.prisma.mentorBooking.findMany.mockImplementation(async () => savedBooking.status === 'CONFIRMED' ? [{ ...savedBooking }] : []);
  doubles.prisma.mentorBooking.update.mockImplementation(async ({ where, data }: {
    where: { status?: string };
    data: Partial<typeof savedBooking>;
  }) => {
    if (where.status && savedBooking.status !== where.status) {
      throw new Prisma.PrismaClientKnownRequestError('State changed', { code: 'P2025', clientVersion: '6.19.3' });
    }
    savedBooking = { ...savedBooking, ...data };
    return { ...savedBooking };
  });
  doubles.prisma.$transaction.mockImplementation(async (task: (tx: typeof doubles.prisma) => Promise<unknown>) => task(doubles.prisma));
  doubles.prisma.user.findUnique.mockResolvedValue({ fullName: 'Test Mentor' });
  doubles.prisma.mentor.upsert.mockResolvedValue({ id: 10n, userId: 30n, status: 'ACTIVE' });
  for (const model of [doubles.prisma.authSession, doubles.prisma.emailVerificationToken, doubles.prisma.passwordResetToken]) {
    model.deleteMany.mockResolvedValue({ count: 0 });
  }
  doubles.prisma.blogPost.findMany.mockResolvedValue([]);
  doubles.notifications.sendBookingReminderNotifications.mockResolvedValue({ bookings: 0 });
});

afterEach(() => {
  stopScheduler();
  vi.useRealTimers();
});

describe('unresolved attendance', () => {
  it('never changes attendance to NO_SHOW when the scheduler starts or time passes', async () => {
    startScheduler();
    await vi.advanceTimersByTimeAsync(31 * 60_000);

    expect(savedBooking.status).toBe('CONFIRMED');
    expect(doubles.notifications.notifyBookingNoShow).not.toHaveBeenCalled();
  });

  it('returns an unresolved confirmed session as needing outcome review', async () => {
    const booking = await adminGetBookingDetail({ bookingId: 1n });
    expect(booking).toMatchObject({ status: 'CONFIRMED', outcomeReviewRequired: true });
  });

  it('requires outcome review exactly when the session ends', async () => {
    vi.setSystemTime(savedBooking.endAt);
    expect(await adminGetBookingDetail({ bookingId: 1n })).toMatchObject({ outcomeReviewRequired: true });
  });

  it('does not request outcome review for a future confirmed session', async () => {
    vi.setSystemTime(new Date('2026-10-12T08:59:59Z'));
    expect(await adminGetBookingDetail({ bookingId: 1n })).toMatchObject({ outcomeReviewRequired: false });
  });

  it.each(['REQUESTED', 'COMPLETED', 'NO_SHOW', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_MENTOR'] as const)(
    'preserves historical %s records without requesting outcome review', async (status) => {
      savedBooking.status = status;
      expect(await adminGetBookingDetail({ bookingId: 1n })).toMatchObject({ status, outcomeReviewRequired: false });
    },
  );
});

describe('reviewed NO_SHOW decisions', () => {
  it.each([undefined, '', '  ', 'ab', 'x'.repeat(501)])('requires a meaningful review reason (%j)', async (reason) => {
    await expect(adminMarkNoShowBooking({ ...reviewedOutcome, reason } as typeof reviewedOutcome))
      .rejects.toMatchObject({ statusCode: 400, code: 'BOOKING_OUTCOME_REASON_REQUIRED' });
    expect(savedBooking.status).toBe('CONFIRMED');
  });

  it('rejects absence decisions before the session ends', async () => {
    vi.setSystemTime(new Date('2026-10-12T08:30:00Z'));
    await expect(adminMarkNoShowBooking(reviewedOutcome)).rejects.toMatchObject({ code: 'BOOKING_CANNOT_NO_SHOW_EARLY' });
    expect(savedBooking.status).toBe('CONFIRMED');
  });

  it('records the reviewing admin and reason with the real state transition', async () => {
    const result = await adminMarkNoShowBooking(reviewedOutcome);
    expect(result).toMatchObject({ status: 'NO_SHOW', outcomeReviewRequired: false });
    expect(savedBooking.status).toBe('NO_SHOW');
    expect(doubles.logger.info).toHaveBeenCalledWith('Booking state transition', expect.objectContaining({
      actorUserId: '99', actorType: 'ADMIN', action: 'NO_SHOW',
      fromStatus: 'CONFIRMED', toStatus: 'NO_SHOW', reason: reviewedOutcome.reason,
    }));
    await expect(adminMarkNoShowBooking(reviewedOutcome)).rejects.toMatchObject({ code: 'BOOKING_CANNOT_NO_SHOW' });
  });

  it('cannot overwrite another outcome that is saved after the initial read', async () => {
    doubles.prisma.mentorBooking.update.mockImplementationOnce(async ({ where }: { where: { status?: string } }) => {
      savedBooking.status = 'COMPLETED';
      if (where.status === 'CONFIRMED') {
        throw new Prisma.PrismaClientKnownRequestError('State changed', { code: 'P2025', clientVersion: '6.19.3' });
      }
      savedBooking.status = 'NO_SHOW';
      return savedBooking;
    });
    await expect(adminMarkNoShowBooking(reviewedOutcome)).rejects.toMatchObject({ statusCode: 409, code: 'BOOKING_OUTCOME_CHANGED' });
    expect(savedBooking.status).toBe('COMPLETED');
  });
});

describe('acknowledged attendance', () => {
  it('keeps the mentor completion flow available after the session ended', async () => {
    expect(await completeMentorBooking({ userId: 30n, bookingId: 1n }))
      .toMatchObject({ status: 'COMPLETED', outcomeReviewRequired: false });
    expect(savedBooking.completedAt).toEqual(new Date('2026-10-12T10:00:00Z'));
  });

  it('does not let an admin mark a future session complete', async () => {
    vi.setSystemTime(new Date('2026-10-12T08:30:00Z'));
    await expect(adminCompleteBooking({ bookingId: 1n, actorUserId: 99n }))
      .rejects.toMatchObject({ code: 'BOOKING_CANNOT_COMPLETE_EARLY' });
    expect(savedBooking.status).toBe('CONFIRMED');
  });

  it('does not unlock student reviews while attendance is unresolved', async () => {
    await expect(createBookingReview({ userId: 20n, bookingId: 1n, input: { rating: 5 } }))
      .rejects.toMatchObject({ code: 'BOOKING_REVIEW_INVALID_STATUS' });
  });
});

describe('HTTP attendance review contract with isolated persistence', () => {
  const sendDecision = async (body: unknown) => {
    vi.useRealTimers();
    savedBooking.endAt = new Date(Date.now() - 60_000);
    const app = express();
    app.use(express.json());
    // Authentication is supplied as a fixture here; production guards are
    // unchanged. This exercises the real middleware/controller/service path.
    app.use((req, _res, next) => {
      req.user = {
        id: 99n, fullName: 'Test Admin', email: 'admin@example.test',
        passwordHash: 'test-fixture-only', role: 'ADMIN', status: 'ACTIVE',
        emailVerifiedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
      };
      next();
    });
    app.patch('/bookings/:bookingId/no-show', validate(adminMarkNoShowBookingSchema), noShowController);
    app.use((error: HttpError, _req: Request, res: Response, next: NextFunction) => {
      if (res.headersSent) return next(error);
      res.status(error.statusCode ?? 500).json(error.toResponseBody());
    });
    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Expected a local test port');
      const response = await fetch(`http://127.0.0.1:${address.port}/bookings/1/no-show`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() as Record<string, unknown> };
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  };

  it.each([{}, { reason: ' ' }, { reason: 'x'.repeat(501) }])('rejects an unreviewed payload: %j', async (body) => {
    const response = await sendDecision(body);
    expect(response).toMatchObject({ status: 400, body: { code: 'VALIDATION_FAILED' } });
    expect(savedBooking.status).toBe('CONFIRMED');
  });

  it('uses the authenticated reviewer rather than an actor supplied in the payload', async () => {
    const response = await sendDecision({ reason: '  Mentor confirmed nonattendance.  ', actorUserId: '123' });
    expect(response).toMatchObject({ status: 200, body: { booking: { status: 'NO_SHOW', outcomeReviewRequired: false } } });
    expect(doubles.logger.info).toHaveBeenCalledWith('Booking state transition', expect.objectContaining({
      actorUserId: '99', actorType: 'ADMIN', reason: 'Mentor confirmed nonattendance.',
    }));
  });
});

describe('future-booking capacity', () => {
  const requestNextSession = async (historicalEndAt: Date) => {
    const history = Array.from({ length: 5 }, (_, index) => ({ ...makeBooking(), id: BigInt(index + 1), endAt: historicalEndAt }));
    doubles.prisma.mentor.findFirst.mockResolvedValue(savedBooking.mentor);
    doubles.prisma.mentorBookingSetting.findUnique.mockResolvedValue(null);
    doubles.prisma.mentorBooking.count.mockImplementation(async ({ where }: {
      where: { endAt?: { gt: Date }; createdAt?: object };
    }) => {
      if (where.createdAt) return 0;
      return history.filter((row) => !where.endAt || row.endAt > where.endAt.gt).length;
    });
    // The proposed session is tomorrow; all historical time ranges are earlier.
    doubles.prisma.mentorBooking.findMany.mockResolvedValue([]);
    doubles.prisma.mentorBooking.create.mockImplementation(async ({ data }: { data: Partial<typeof savedBooking> }) => ({ ...makeBooking(), ...data, id: 6n }));
    return createBooking({
      userId: 20n, slug: 'test-mentor',
      input: { date: '2026-10-13', startTime: '15:00', durationMinute: 60, requestType: 'CUSTOM_TIME' },
    });
  };

  it('allows another appointment when five confirmed sessions ended without an outcome', async () => {
    expect(await requestNextSession(new Date('2026-10-12T09:00:00Z'))).toMatchObject({ id: '6', status: 'REQUESTED' });
  });

  it('still enforces the active quota for five future sessions', async () => {
    await expect(requestNextSession(new Date('2026-10-13T09:00:00Z')))
      .rejects.toMatchObject({ statusCode: 429, code: 'BOOKING_ACTIVE_LIMIT_REACHED' });
  });
});
