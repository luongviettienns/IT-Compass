import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';
import { publicMentorSelect, serializePublicMentor } from '../utils/serializeMentor.js';
import { sanitizeNullableRichText, sanitizeNullableSingleLineText } from '../utils/sanitize.js';
import { ensureConversationForConfirmedBooking } from './conversation.service.js';
import { withBookingTransaction } from './booking-transaction.js';
import { BOOKING_TIMEZONE, REQUEST_RESPONSE_WINDOW_HOUR, formatDate, formatTime, parseDateBoundary, parseLocalDateTime, getResponseDueAt, isRequestExpired } from './booking-time.js';
import { emitBookingUpdated } from '../socket/booking.events.js';
import { notifyBookingCompleted, notifyBookingNoShow, persistBookingNotifications, publishBookingNotifications, } from './notification.service.js';
const DURATION_STEP_MINUTE = 30;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_ACTIVE_BOOKINGS_PER_STUDENT = 5;
const MAX_DAILY_REQUESTS_PER_STUDENT_MENTOR = 3;
const ACTIVE_BOOKING_STATUSES = ['REQUESTED', 'CONFIRMED'];
const CANCELLABLE_STATUSES = ['REQUESTED', 'CONFIRMED'];
const bookingSettingSelect = {
    minDurationMinute: true,
    maxDurationMinute: true,
    defaultDurationMinute: true,
    durationStepMinute: true,
    bookingNoticeHour: true,
    maxAdvanceDay: true,
    bufferBeforeMinute: true,
    bufferAfterMinute: true,
    autoConfirm: true,
};
const DEFAULT_BOOKING_SETTING = {
    minDurationMinute: 30,
    maxDurationMinute: 120,
    defaultDurationMinute: 60,
    durationStepMinute: DURATION_STEP_MINUTE,
    bookingNoticeHour: 2,
    maxAdvanceDay: 30,
    bufferBeforeMinute: 0,
    bufferAfterMinute: 0,
    autoConfirm: false,
};
const bookingSelect = {
    id: true,
    mentorId: true,
    studentUserId: true,
    startAt: true,
    endAt: true,
    durationMinute: true,
    status: true,
    requestType: true,
    requestKeyHash: true,
    requestPayloadHash: true,
    timezone: true,
    responseDueAt: true,
    expiredAt: true,
    note: true,
    cancelReason: true,
    cancelledBy: true,
    cancelledAt: true,
    confirmedAt: true,
    completedAt: true,
    createdAt: true,
    updatedAt: true,
    mentor: {
        select: {
            ...publicMentorSelect,
            userId: true,
        },
    },
    student: {
        select: {
            id: true,
            fullName: true,
            email: true,
            profile: {
                select: {
                    avatarUrl: true,
                },
            },
        },
    },
    review: {
        select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
        },
    },
};
const pad2 = (value) => String(value).padStart(2, '0');
const minuteToTime = (minute) => `${pad2(Math.floor(minute / 60))}:${pad2(minute % 60)}`;
const parseTimeToMinute = (value) => {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
};
const pendingRequestWhere = (now = new Date()) => ({
    status: 'REQUESTED', expiredAt: null, startAt: { gt: now }, OR: [
        { responseDueAt: { gt: now } },
        { responseDueAt: null, createdAt: { gt: new Date(now.getTime() - REQUEST_RESPONSE_WINDOW_HOUR * 3_600_000) } },
    ],
});
const activeBookingWhere = (now = new Date()) => ({
    status: { in: ACTIVE_BOOKING_STATUSES },
    OR: [{ status: 'CONFIRMED' }, pendingRequestWhere(now)],
});
const toPositiveInteger = (value, fallback) => {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : fallback;
};
const normalizePagination = (query) => ({
    page: toPositiveInteger(query.page, DEFAULT_PAGE),
    limit: toPositiveInteger(query.limit, DEFAULT_LIMIT),
});
const serializeSetting = (setting) => ({
    minDurationMinute: setting.minDurationMinute,
    maxDurationMinute: setting.maxDurationMinute,
    defaultDurationMinute: setting.defaultDurationMinute,
    durationStepMinute: setting.durationStepMinute,
    bookingNoticeHour: setting.bookingNoticeHour,
    maxAdvanceDay: setting.maxAdvanceDay,
    bufferBeforeMinute: setting.bufferBeforeMinute,
    bufferAfterMinute: setting.bufferAfterMinute,
    autoConfirm: setting.autoConfirm,
    timezone: BOOKING_TIMEZONE,
    responseWindowHour: REQUEST_RESPONSE_WINDOW_HOUR,
});
const buildDurationOptions = (setting) => {
    const options = [];
    for (let duration = setting.minDurationMinute; duration <= setting.maxDurationMinute; duration += DURATION_STEP_MINUTE) {
        options.push(duration);
    }
    return options;
};
const serializeBooking = (booking) => ({
    id: String(booking.id),
    status: booking.status,
    outcomeReviewRequired: booking.status === 'CONFIRMED' && booking.endAt.getTime() <= Date.now(),
    timezone: booking.timezone,
    responseDueAt: booking.status === 'REQUESTED' ? getResponseDueAt(booking) : booking.responseDueAt,
    expiredAt: booking.expiredAt,
    requestExpired: isRequestExpired(booking),
    requestType: booking.requestType,
    date: formatDate(booking.startAt),
    startTime: formatTime(booking.startAt),
    endTime: formatTime(booking.endAt),
    startAt: booking.startAt,
    endAt: booking.endAt,
    durationMinute: booking.durationMinute,
    note: booking.note,
    cancelReason: booking.cancelReason,
    cancelledBy: booking.cancelledBy,
    cancelledAt: booking.cancelledAt,
    confirmedAt: booking.confirmedAt,
    completedAt: booking.completedAt,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    mentor: serializePublicMentor(booking.mentor),
    student: {
        id: String(booking.student.id),
        fullName: booking.student.fullName,
        email: booking.student.email,
        avatarUrl: booking.student.profile?.avatarUrl ?? null,
    },
    review: booking.review
        ? {
            id: String(booking.review.id),
            rating: booking.review.rating,
            comment: booking.review.comment,
            createdAt: booking.review.createdAt,
            updatedAt: booking.review.updatedAt,
        }
        : null,
});
const notifyBookingUpdated = (booking) => {
    emitBookingUpdated({
        studentUserId: booking.studentUserId,
        mentorUserId: booking.mentor.userId,
        booking: serializeBooking(booking),
    });
};
const toBookingNotificationSource = (booking) => ({
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
    cancelReason: booking.cancelReason,
    cancelledBy: booking.cancelledBy,
    responseDueAt: booking.status === 'REQUESTED' ? getResponseDueAt(booking) : booking.responseDueAt,
    expiredAt: booking.expiredAt,
});
const sendBookingNotificationSafely = async (notificationTask, context) => {
    try {
        await notificationTask();
    }
    catch (error) {
        logger.error('Failed to dispatch booking notification', {
            ...context,
            error,
        });
    }
};
const logBookingTransition = ({ booking, actorUserId, actorType, action, fromStatus, toStatus, reason, }) => {
    logger.info('Booking state transition', {
        auditType: 'booking_state_transition',
        action,
        actorType,
        actorUserId: actorUserId ? String(actorUserId) : null,
        bookingId: String(booking.id),
        mentorId: String(booking.mentorId),
        studentUserId: String(booking.studentUserId),
        fromStatus,
        toStatus,
        reason: reason || null,
    });
};
const serializeAvailabilityBlock = (block) => ({
    id: String(block.id),
    weekday: block.weekday,
    startTime: minuteToTime(block.startMinute),
    endTime: minuteToTime(block.endMinute),
    isActive: block.isActive,
});
const getBookingSettingOrDefault = async (mentorId, tx = prisma) => {
    const setting = await tx.mentorBookingSetting.findUnique({
        where: { mentorId },
        select: bookingSettingSelect,
    });
    return setting ?? DEFAULT_BOOKING_SETTING;
};
const getSelfMentor = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true },
    });
    if (!user) {
        throw new HttpError(404, 'User not found', undefined, 'AUTH_USER_NOT_FOUND');
    }
    return prisma.mentor.upsert({
        where: { userId },
        update: {},
        create: {
            userId,
            name: user.fullName,
            slug: `mentor-${String(userId)}`,
        },
        select: {
            id: true,
            userId: true,
            status: true,
        },
    });
};
const getPublicMentorForBooking = async (slug, options = {}) => {
    const tx = options.tx ?? prisma;
    const mentor = await tx.mentor.findFirst({
        where: {
            slug,
            ...(options.mentorId ? { id: options.mentorId } : {}),
            ...(options.activeOnly === false ? {} : { status: 'ACTIVE' }),
        },
        select: {
            ...publicMentorSelect,
            userId: true,
        },
    });
    if (!mentor) {
        throw new HttpError(404, 'Mentor not found', undefined, 'MENTOR_NOT_FOUND');
    }
    return mentor;
};
const assertDurationAllowed = (durationMinute, setting) => {
    if (durationMinute % DURATION_STEP_MINUTE !== 0) {
        throw new HttpError(400, 'Duration must be a multiple of 30 minutes', undefined, 'BOOKING_INVALID_DURATION_STEP');
    }
    if (durationMinute < setting.minDurationMinute || durationMinute > setting.maxDurationMinute) {
        throw new HttpError(400, 'Duration is outside mentor booking settings', undefined, 'BOOKING_DURATION_OUT_OF_RANGE');
    }
};
const assertBookingWindowAllowed = (startAt, setting) => {
    const now = new Date();
    const earliestStartAt = new Date(now.getTime() + setting.bookingNoticeHour * 60 * 60_000);
    const latestStartAt = new Date(now.getTime() + setting.maxAdvanceDay * 86_400_000);
    if (startAt < earliestStartAt) {
        throw new HttpError(400, 'Booking is too soon for this mentor notice policy', undefined, 'BOOKING_NOTICE_TOO_SHORT');
    }
    if (startAt > latestStartAt) {
        throw new HttpError(400, 'Booking date is too far in advance', undefined, 'BOOKING_TOO_FAR_IN_ADVANCE');
    }
};
const assertWithinAvailability = async ({ mentorId, weekday, startMinute, endMinute, }, tx = prisma) => {
    const block = await tx.mentorAvailability.findFirst({
        where: {
            mentorId,
            weekday,
            isActive: true,
            startMinute: { lte: startMinute },
            endMinute: { gte: endMinute },
        },
        select: { id: true },
    });
    if (!block) {
        throw new HttpError(400, 'Selected time is outside mentor availability', undefined, 'BOOKING_OUTSIDE_AVAILABILITY');
    }
};
const isOverlapping = ({ startAt, endAt, existingStartAt, existingEndAt, setting, }) => {
    const blockedStartAt = new Date(existingStartAt.getTime() - setting.bufferBeforeMinute * 60_000);
    const blockedEndAt = new Date(existingEndAt.getTime() + setting.bufferAfterMinute * 60_000);
    const candidateStartAt = new Date(startAt.getTime() - setting.bufferBeforeMinute * 60_000);
    const candidateEndAt = new Date(endAt.getTime() + setting.bufferAfterMinute * 60_000);
    return candidateStartAt < blockedEndAt && candidateEndAt > blockedStartAt;
};
const findOverlappingBooking = async (tx, { mentorId, startAt, endAt, setting, excludeBookingId, }) => {
    const padding = (setting.bufferBeforeMinute + setting.bufferAfterMinute) * 60_000;
    const queryStartAt = new Date(startAt.getTime() - padding);
    const queryEndAt = new Date(endAt.getTime() + padding);
    const bookings = await tx.mentorBooking.findMany({
        where: {
            mentorId,
            ...activeBookingWhere(),
            ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
            startAt: { lt: queryEndAt },
            endAt: { gt: queryStartAt },
        },
        select: {
            id: true,
            startAt: true,
            endAt: true,
        },
    });
    return bookings.find((booking) => isOverlapping({
        startAt,
        endAt,
        existingStartAt: booking.startAt,
        existingEndAt: booking.endAt,
        setting,
    }));
};
const assertNoOverlap = async (tx, input) => {
    const overlappingBooking = await findOverlappingBooking(tx, input);
    if (overlappingBooking) {
        throw new HttpError(409, 'Selected time overlaps another booking', undefined, 'BOOKING_TIME_CONFLICT');
    }
};
const assertBookingAbuseLimits = async (tx, { studentUserId, mentorId, }) => {
    const now = new Date();
    const dayStartAt = parseDateBoundary(formatDate(now), 'start');
    const dayEndAt = parseDateBoundary(formatDate(now), 'end');
    const [activeBookingCount, dailyMentorRequestCount] = await Promise.all([
        tx.mentorBooking.count({
            where: {
                studentUserId,
                ...activeBookingWhere(now),
                // Ended sessions awaiting an attendance decision are historical, not
                // future reservations consuming the student's active-booking quota.
                endAt: { gt: now },
            },
        }),
        tx.mentorBooking.count({
            where: {
                studentUserId,
                mentorId,
                createdAt: {
                    gte: dayStartAt,
                    lt: dayEndAt,
                },
            },
        }),
    ]);
    if (activeBookingCount >= MAX_ACTIVE_BOOKINGS_PER_STUDENT) {
        throw new HttpError(429, 'Student has too many active bookings', undefined, 'BOOKING_ACTIVE_LIMIT_REACHED');
    }
    if (dailyMentorRequestCount >= MAX_DAILY_REQUESTS_PER_STUDENT_MENTOR) {
        throw new HttpError(429, 'Student has too many booking requests for this mentor today', undefined, 'BOOKING_DAILY_MENTOR_LIMIT_REACHED');
    }
};
const buildBookingWhere = ({ status, search, from, to, }) => {
    const searchTerms = [];
    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
        if (/^\d+$/.test(normalizedSearch)) {
            searchTerms.push({ id: BigInt(normalizedSearch) });
        }
        if (normalizedSearch === 'AVAILABILITY_SLOT' || normalizedSearch === 'CUSTOM_TIME') {
            searchTerms.push({ requestType: normalizedSearch });
        }
        searchTerms.push({ note: { contains: normalizedSearch } }, { cancelReason: { contains: normalizedSearch } }, { mentor: { name: { contains: normalizedSearch } } }, { mentor: { slug: { contains: normalizedSearch } } }, { student: { fullName: { contains: normalizedSearch } } }, { student: { email: { contains: normalizedSearch } } });
    }
    return {
        ...(status ? { status } : {}),
        ...(status === 'REQUESTED' ? { AND: [activeBookingWhere()] } : {}),
        ...(searchTerms.length ? { OR: searchTerms } : {}),
        ...(from || to
            ? {
                startAt: {
                    ...(from ? { gte: parseDateBoundary(from, 'start') } : {}),
                    ...(to ? { lt: parseDateBoundary(to, 'end') } : {}),
                },
            }
            : {}),
    };
};
const listBookings = async ({ where, page, limit }) => {
    const [total, bookings] = await Promise.all([
        prisma.mentorBooking.count({ where }),
        prisma.mentorBooking.findMany({
            where,
            select: bookingSelect,
            orderBy: [{ startAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);
    return {
        bookings: bookings.map(serializeBooking),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
};
const collectAllBookings = async (where) => {
    const bookings = await prisma.mentorBooking.findMany({
        where,
        select: bookingSelect,
        orderBy: [{ startAt: 'desc' }, { id: 'desc' }],
    });
    return bookings.map(serializeBooking);
};
const validateSetting = (setting) => {
    const durationFields = [setting.minDurationMinute, setting.maxDurationMinute, setting.defaultDurationMinute];
    if (durationFields.some((value) => value % DURATION_STEP_MINUTE !== 0)) {
        throw new HttpError(400, 'Booking durations must use 30-minute steps', undefined, 'BOOKING_SETTING_INVALID_STEP');
    }
    if (setting.minDurationMinute > setting.maxDurationMinute) {
        throw new HttpError(400, 'Minimum duration must be less than or equal to maximum duration', undefined, 'BOOKING_SETTING_INVALID_RANGE');
    }
    if (setting.defaultDurationMinute < setting.minDurationMinute ||
        setting.defaultDurationMinute > setting.maxDurationMinute) {
        throw new HttpError(400, 'Default duration must be within min/max duration', undefined, 'BOOKING_SETTING_INVALID_DEFAULT');
    }
};
const validateAvailabilityBlocks = (blocks) => {
    const activeBlocksByWeekday = new Map();
    blocks.forEach((block) => {
        const startMinute = parseTimeToMinute(block.startTime);
        const endMinute = parseTimeToMinute(block.endTime);
        if (startMinute >= endMinute) {
            throw new HttpError(400, 'Availability start time must be before end time', undefined, 'AVAILABILITY_INVALID_RANGE');
        }
        if (!block.isActive)
            return;
        const weekdayBlocks = activeBlocksByWeekday.get(block.weekday) ?? [];
        weekdayBlocks.push({ startMinute, endMinute });
        activeBlocksByWeekday.set(block.weekday, weekdayBlocks);
    });
    activeBlocksByWeekday.forEach((weekdayBlocks) => {
        const sortedBlocks = weekdayBlocks.sort((a, b) => a.startMinute - b.startMinute);
        for (let index = 1; index < sortedBlocks.length; index += 1) {
            const previousBlock = sortedBlocks[index - 1];
            const currentBlock = sortedBlocks[index];
            if (currentBlock.startMinute < previousBlock.endMinute) {
                throw new HttpError(400, 'Availability blocks must not overlap', undefined, 'AVAILABILITY_BLOCKS_OVERLAP');
            }
        }
    });
};
const getBookingDetailOrThrow = async (where, tx = prisma) => {
    const booking = await tx.mentorBooking.findFirst({
        where,
        select: bookingSelect,
    });
    if (!booking) {
        throw new HttpError(404, 'Booking not found', undefined, 'BOOKING_NOT_FOUND');
    }
    return booking;
};
export const expireOverdueBookingRequests = async () => {
    const now = new Date();
    const dueWhere = {
        status: 'REQUESTED', expiredAt: null,
        OR: [
            { responseDueAt: { lte: now } },
            { startAt: { lte: now } },
            { responseDueAt: null, createdAt: { lte: new Date(now.getTime() - 24 * 3_600_000) } },
        ],
    };
    const candidates = await prisma.mentorBooking.findMany({
        where: dueWhere, select: { id: true, studentUserId: true, mentorId: true },
        orderBy: [{ responseDueAt: 'asc' }, { id: 'asc' }], take: 100,
    });
    let expired = 0;
    let failed = 0;
    for (const identity of candidates) {
        try {
            const result = await withBookingTransaction(identity, async (tx) => {
                const current = await getBookingDetailOrThrow({ id: identity.id }, tx);
                const checkedAt = new Date();
                if (current.expiredAt || !isRequestExpired(current, checkedAt))
                    return null;
                const booking = await tx.mentorBooking.update({
                    where: { id: current.id, status: 'REQUESTED', expiredAt: null },
                    data: { expiredAt: checkedAt, responseDueAt: getResponseDueAt(current) }, select: bookingSelect,
                });
                const notifications = await persistBookingNotifications(tx, toBookingNotificationSource(booking), 'BOOKING_CANCELLED_BY_MENTOR');
                return { booking, notifications };
            });
            if (!result)
                continue;
            expired++;
            logBookingTransition({ booking: result.booking, actorUserId: null, actorType: 'SYSTEM', action: 'EXPIRE',
                fromStatus: 'REQUESTED', toStatus: 'REQUESTED', reason: 'Response deadline passed' });
            notifyBookingUpdated(result.booking);
            publishBookingNotifications(result.notifications);
        }
        catch (error) {
            failed++;
            logger.error('Failed to expire booking request', { bookingId: String(identity.id), error });
        }
    }
    return { expired, failed };
};
export const getPublicBookingConfig = async ({ slug }) => {
    const mentor = await getPublicMentorForBooking(slug);
    const setting = await getBookingSettingOrDefault(mentor.id);
    return {
        mentor: serializePublicMentor(mentor),
        settings: serializeSetting(setting),
        durationOptions: buildDurationOptions(setting),
    };
};
export const getPublicAvailability = async ({ slug, date, durationMinute, }) => {
    const mentor = await getPublicMentorForBooking(slug);
    const setting = await getBookingSettingOrDefault(mentor.id);
    assertDurationAllowed(durationMinute, setting);
    const parsedDate = parseLocalDateTime({ date, startTime: '00:00', durationMinute });
    const dayStartAt = new Date(parsedDate.startAt);
    const dayEndAt = parseDateBoundary(date, 'end');
    const [blocks, bookings] = await Promise.all([
        prisma.mentorAvailability.findMany({
            where: {
                mentorId: mentor.id,
                weekday: parsedDate.weekday,
                isActive: true,
            },
            orderBy: [{ startMinute: 'asc' }, { id: 'asc' }],
            select: {
                startMinute: true,
                endMinute: true,
            },
        }),
        prisma.mentorBooking.findMany({
            where: {
                mentorId: mentor.id,
                ...activeBookingWhere(),
                startAt: { lt: new Date(dayEndAt.getTime() + (setting.bufferBeforeMinute + setting.bufferAfterMinute) * 60_000) },
                endAt: { gt: new Date(dayStartAt.getTime() - (setting.bufferBeforeMinute + setting.bufferAfterMinute) * 60_000) },
            },
            select: {
                startAt: true,
                endAt: true,
            },
        }),
    ]);
    const slots = blocks.flatMap((block) => {
        const blockSlots = [];
        for (let startMinute = block.startMinute; startMinute + durationMinute <= block.endMinute; startMinute += DURATION_STEP_MINUTE) {
            const startAt = new Date(dayStartAt.getTime() + startMinute * 60_000);
            const endAt = new Date(startAt.getTime() + durationMinute * 60_000);
            const withinPolicy = (() => {
                try {
                    assertBookingWindowAllowed(startAt, setting);
                    return true;
                }
                catch {
                    return false;
                }
            })();
            const hasConflict = bookings.some((booking) => isOverlapping({
                startAt,
                endAt,
                existingStartAt: booking.startAt,
                existingEndAt: booking.endAt,
                setting,
            }));
            if (withinPolicy && !hasConflict) {
                blockSlots.push({
                    date,
                    startTime: minuteToTime(startMinute),
                    endTime: minuteToTime(startMinute + durationMinute),
                    startAt,
                    endAt,
                    durationMinute,
                });
            }
        }
        return blockSlots;
    });
    return {
        mentor: serializePublicMentor(mentor),
        settings: serializeSetting(setting),
        date,
        durationMinute,
        slots,
    };
};
export const createBooking = async ({ userId, slug, input, idempotencyKey, }) => {
    if (idempotencyKey !== undefined && !/^[A-Za-z0-9._:-]{1,128}$/.test(idempotencyKey)) {
        throw new HttpError(400, 'Invalid Idempotency-Key', undefined, 'BOOKING_INVALID_IDEMPOTENCY_KEY');
    }
    const hash = (value) => createHash('sha256').update(value).digest('hex');
    const requestKeyHash = idempotencyKey ? hash(idempotencyKey) : null;
    const requestType = input.requestType ?? 'AVAILABILITY_SLOT';
    const note = sanitizeNullableRichText(input.note) ?? null;
    const requestPayloadHash = requestKeyHash ? hash(JSON.stringify({
        slug, date: input.date, startTime: input.startTime,
        durationMinute: input.durationMinute, requestType, note,
    })) : null;
    const findReplay = async (tx) => {
        if (!requestKeyHash)
            return null;
        const existing = await tx.mentorBooking.findUnique({
            where: { studentUserId_requestKeyHash: { studentUserId: userId, requestKeyHash } },
            select: bookingSelect,
        });
        if (existing && existing.requestPayloadHash !== requestPayloadHash) {
            throw new HttpError(409, 'Idempotency-Key was used for a different request', undefined, 'BOOKING_IDEMPOTENCY_CONFLICT');
        }
        return existing;
    };
    // Replays remain valid after cancellation, mentor pause or policy changes.
    const replay = await findReplay(prisma);
    if (replay)
        return serializeBooking(replay);
    // Resolve the lock identity without eligibility: the original request may
    // commit and the mentor may pause after the optimistic replay read above.
    const mentor = await getPublicMentorForBooking(slug, { activeOnly: false });
    const result = await withBookingTransaction({ studentUserId: userId, mentorId: mentor.id }, async (tx) => {
        const concurrentReplay = await findReplay(tx);
        if (concurrentReplay)
            return { booking: concurrentReplay, changed: false, notifications: [] };
        const currentMentor = await getPublicMentorForBooking(slug, { tx, mentorId: mentor.id });
        if (currentMentor.userId === userId) {
            throw new HttpError(400, 'Mentor cannot book their own schedule', undefined, 'BOOKING_SELF_NOT_ALLOWED');
        }
        const setting = await getBookingSettingOrDefault(mentor.id, tx);
        assertDurationAllowed(input.durationMinute, setting);
        const parsedDateTime = parseLocalDateTime(input);
        assertBookingWindowAllowed(parsedDateTime.startAt, setting);
        if (requestType === 'AVAILABILITY_SLOT' || setting.autoConfirm) {
            await assertWithinAvailability({ mentorId: mentor.id, ...parsedDateTime }, tx);
        }
        await assertBookingAbuseLimits(tx, {
            studentUserId: userId,
            mentorId: mentor.id,
        });
        await assertNoOverlap(tx, { mentorId: mentor.id, ...parsedDateTime, setting });
        const createdAt = new Date(Math.floor(Date.now() / 1000) * 1000);
        const booking = await tx.mentorBooking.create({
            data: {
                mentorId: mentor.id,
                studentUserId: userId,
                startAt: parsedDateTime.startAt,
                endAt: parsedDateTime.endAt,
                durationMinute: input.durationMinute,
                status: setting.autoConfirm ? 'CONFIRMED' : 'REQUESTED',
                timezone: BOOKING_TIMEZONE,
                createdAt,
                confirmedAt: setting.autoConfirm ? createdAt : null,
                responseDueAt: setting.autoConfirm ? null : getResponseDueAt({ ...parsedDateTime, createdAt, responseDueAt: null }),
                requestType,
                note,
                requestKeyHash,
                requestPayloadHash,
            },
            select: bookingSelect,
        });
        if (setting.autoConfirm)
            await ensureConversationForConfirmedBooking(tx, booking);
        const notifications = await persistBookingNotifications(tx, { ...toBookingNotificationSource(booking), autoConfirmed: setting.autoConfirm }, setting.autoConfirm ? 'BOOKING_CONFIRMED' : 'BOOKING_REQUESTED');
        return { booking, changed: true, notifications };
    });
    const { booking } = result;
    if (!result.changed)
        return serializeBooking(booking);
    logBookingTransition({
        booking,
        actorUserId: userId,
        actorType: 'STUDENT',
        action: 'CREATE',
        fromStatus: null,
        toStatus: booking.status,
    });
    notifyBookingUpdated(booking);
    publishBookingNotifications(result.notifications);
    return serializeBooking(booking);
};
export const listStudentBookings = async ({ userId, query, }) => {
    const { page, limit } = normalizePagination(query);
    const where = {
        ...buildBookingWhere(query),
        studentUserId: userId,
    };
    return listBookings({ where, page, limit });
};
export const exportStudentBookings = async ({ userId, query, }) => {
    const where = {
        ...buildBookingWhere(query),
        studentUserId: userId,
    };
    return collectAllBookings(where);
};
export const getStudentBookingDetail = async ({ userId, bookingId }) => {
    const booking = await getBookingDetailOrThrow({
        id: bookingId,
        studentUserId: userId,
    });
    return serializeBooking(booking);
};
const cancelBooking = async ({ where, actorUserId, actorType, cancelledBy, reason }) => {
    const identity = await getBookingDetailOrThrow(where);
    const targetStatus = cancelledBy === 'STUDENT' ? 'CANCELLED_BY_STUDENT' : 'CANCELLED_BY_MENTOR';
    const result = await withBookingTransaction(identity, async (tx) => {
        const currentBooking = await getBookingDetailOrThrow(where, tx);
        if (currentBooking.status === targetStatus && currentBooking.cancelledBy === cancelledBy) {
            return { booking: currentBooking, changed: false, fromStatus: currentBooking.status, notifications: [] };
        }
        if (!CANCELLABLE_STATUSES.includes(currentBooking.status)) {
            throw new HttpError(400, 'Booking cannot be cancelled in current status', undefined, 'BOOKING_CANNOT_CANCEL');
        }
        if (isRequestExpired(currentBooking)) {
            throw new HttpError(409, 'Booking request has expired', undefined, 'BOOKING_REQUEST_EXPIRED');
        }
        const cancelledAt = new Date();
        const booking = await tx.mentorBooking.update({
            where: { id: currentBooking.id, status: currentBooking.status,
                ...(currentBooking.status === 'REQUESTED' ? { AND: [pendingRequestWhere(cancelledAt)] } : {}) },
            data: {
                status: targetStatus,
                cancelReason: sanitizeNullableSingleLineText(reason) ?? null,
                cancelledBy, cancelledAt,
            },
            select: bookingSelect,
        });
        const type = cancelledBy === 'STUDENT' ? 'BOOKING_CANCELLED_BY_STUDENT' : 'BOOKING_CANCELLED_BY_MENTOR';
        const notifications = await persistBookingNotifications(tx, toBookingNotificationSource(booking), type);
        return { booking, changed: true, fromStatus: currentBooking.status, notifications };
    });
    if (result.changed) {
        logBookingTransition({ booking: result.booking, actorUserId, actorType, action: 'CANCEL',
            fromStatus: result.fromStatus, toStatus: result.booking.status, reason: result.booking.cancelReason });
        notifyBookingUpdated(result.booking);
        publishBookingNotifications(result.notifications);
    }
    return serializeBooking(result.booking);
};
export const cancelStudentBooking = ({ userId, bookingId, input }) => cancelBooking({
    where: { id: bookingId, studentUserId: userId }, actorUserId: userId,
    actorType: 'STUDENT', cancelledBy: 'STUDENT', reason: input.reason,
});
export const getMentorAvailability = async ({ userId }) => {
    const mentor = await getSelfMentor(userId);
    const blocks = await prisma.mentorAvailability.findMany({
        where: { mentorId: mentor.id },
        orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }, { id: 'asc' }],
        select: {
            id: true,
            weekday: true,
            startMinute: true,
            endMinute: true,
            isActive: true,
        },
    });
    return {
        blocks: blocks.map(serializeAvailabilityBlock),
    };
};
export const updateMentorAvailability = async ({ userId, input, }) => {
    validateAvailabilityBlocks(input.blocks);
    const mentor = await getSelfMentor(userId);
    const blocks = await prisma.$transaction(async (tx) => {
        await tx.mentorAvailability.deleteMany({ where: { mentorId: mentor.id } });
        if (input.blocks.length) {
            await tx.mentorAvailability.createMany({
                data: input.blocks.map((block) => ({
                    mentorId: mentor.id,
                    weekday: block.weekday,
                    startMinute: parseTimeToMinute(block.startTime),
                    endMinute: parseTimeToMinute(block.endTime),
                    isActive: block.isActive,
                })),
            });
        }
        return tx.mentorAvailability.findMany({
            where: { mentorId: mentor.id },
            orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }, { id: 'asc' }],
            select: {
                id: true,
                weekday: true,
                startMinute: true,
                endMinute: true,
                isActive: true,
            },
        });
    });
    return {
        blocks: blocks.map(serializeAvailabilityBlock),
    };
};
export const getMentorBookingSettings = async ({ userId }) => {
    const mentor = await getSelfMentor(userId);
    const setting = await prisma.mentorBookingSetting.upsert({
        where: { mentorId: mentor.id },
        update: {},
        create: {
            mentorId: mentor.id,
            ...DEFAULT_BOOKING_SETTING,
        },
        select: bookingSettingSelect,
    });
    return {
        settings: serializeSetting(setting),
        durationOptions: buildDurationOptions(setting),
    };
};
export const updateMentorBookingSettings = async ({ userId, input, }) => {
    const mentor = await getSelfMentor(userId);
    const currentSetting = await getBookingSettingOrDefault(mentor.id);
    const nextSetting = {
        ...currentSetting,
        ...input,
        durationStepMinute: DURATION_STEP_MINUTE,
    };
    validateSetting(nextSetting);
    const setting = await prisma.mentorBookingSetting.upsert({
        where: { mentorId: mentor.id },
        update: input,
        create: {
            mentorId: mentor.id,
            ...nextSetting,
        },
        select: bookingSettingSelect,
    });
    return {
        settings: serializeSetting(setting),
        durationOptions: buildDurationOptions(setting),
    };
};
export const listMentorBookings = async ({ userId, query, }) => {
    const mentor = await getSelfMentor(userId);
    const { page, limit } = normalizePagination(query);
    const where = {
        ...buildBookingWhere(query),
        mentorId: mentor.id,
    };
    return listBookings({ where, page, limit });
};
export const exportMentorBookings = async ({ userId, query, }) => {
    const mentor = await getSelfMentor(userId);
    const where = {
        ...buildBookingWhere(query),
        mentorId: mentor.id,
    };
    return collectAllBookings(where);
};
export const adminListBookings = async ({ query }) => {
    const { page, limit } = normalizePagination(query);
    return listBookings({ where: buildBookingWhere(query), page, limit });
};
export const adminExportBookings = async ({ query }) => collectAllBookings(buildBookingWhere(query));
export const adminGetBookingDetail = async ({ bookingId }) => serializeBooking(await getBookingDetailOrThrow({ id: bookingId }));
const confirmBooking = async ({ where, actorUserId, actorType }) => {
    const identity = await getBookingDetailOrThrow(where);
    const result = await withBookingTransaction(identity, async (tx) => {
        const currentBooking = await getBookingDetailOrThrow(where, tx);
        if (currentBooking.status === 'CONFIRMED') {
            await ensureConversationForConfirmedBooking(tx, currentBooking);
            return { booking: currentBooking, changed: false, notifications: [] };
        }
        if (currentBooking.status !== 'REQUESTED') {
            throw new HttpError(400, 'Only requested bookings can be confirmed', undefined, 'BOOKING_CANNOT_CONFIRM');
        }
        if (isRequestExpired(currentBooking)) {
            throw new HttpError(409, 'Booking request has expired', undefined, 'BOOKING_REQUEST_EXPIRED');
        }
        const setting = await getBookingSettingOrDefault(currentBooking.mentorId, tx);
        await assertNoOverlap(tx, {
            mentorId: currentBooking.mentorId, startAt: currentBooking.startAt,
            endAt: currentBooking.endAt, setting, excludeBookingId: currentBooking.id,
        });
        const confirmedAt = new Date();
        if (isRequestExpired(currentBooking, confirmedAt)) {
            throw new HttpError(409, 'Booking request has expired', undefined, 'BOOKING_REQUEST_EXPIRED');
        }
        const booking = await tx.mentorBooking.update({
            where: { id: currentBooking.id, status: 'REQUESTED', AND: [pendingRequestWhere(confirmedAt)] },
            data: { status: 'CONFIRMED', confirmedAt },
            select: bookingSelect,
        });
        await ensureConversationForConfirmedBooking(tx, booking);
        const notifications = await persistBookingNotifications(tx, toBookingNotificationSource(booking), 'BOOKING_CONFIRMED');
        return { booking, changed: true, notifications };
    });
    if (result.changed) {
        logBookingTransition({ booking: result.booking, actorUserId, actorType, action: 'CONFIRM',
            fromStatus: 'REQUESTED', toStatus: result.booking.status });
        notifyBookingUpdated(result.booking);
        publishBookingNotifications(result.notifications);
    }
    return serializeBooking(result.booking);
};
export const adminConfirmBooking = ({ bookingId, actorUserId = null }) => confirmBooking({ where: { id: bookingId }, actorUserId, actorType: actorUserId ? 'ADMIN' : 'SYSTEM' });
// Guard the write as well as the initial read: a concurrent reviewer must not
// overwrite attendance that another participant has already acknowledged.
const saveConfirmedBookingOutcome = async (bookingId, status) => {
    const now = new Date();
    try {
        return await prisma.mentorBooking.update({
            where: { id: bookingId, status: 'CONFIRMED', endAt: { lte: now } },
            data: { status, ...(status === 'COMPLETED' ? { completedAt: now } : {}) },
            select: bookingSelect,
        });
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new HttpError(409, 'Booking outcome changed; reload before reviewing it again', undefined, 'BOOKING_OUTCOME_CHANGED');
        }
        throw error;
    }
};
export const adminCompleteBooking = async ({ bookingId, actorUserId }) => {
    const currentBooking = await getBookingDetailOrThrow({ id: bookingId });
    if (currentBooking.status !== 'CONFIRMED') {
        throw new HttpError(400, 'Only confirmed bookings can be completed', undefined, 'BOOKING_CANNOT_COMPLETE');
    }
    if (currentBooking.endAt > new Date()) {
        throw new HttpError(400, 'Booking can only be completed after the session ends', undefined, 'BOOKING_CANNOT_COMPLETE_EARLY');
    }
    const booking = await saveConfirmedBookingOutcome(bookingId, 'COMPLETED');
    logBookingTransition({
        booking,
        actorUserId,
        actorType: 'ADMIN',
        action: 'COMPLETE',
        fromStatus: 'CONFIRMED',
        toStatus: booking.status,
    });
    notifyBookingUpdated(booking);
    return serializeBooking(booking);
};
export const adminMarkNoShowBooking = async ({ bookingId, actorUserId, reason }) => {
    const currentBooking = await getBookingDetailOrThrow({ id: bookingId });
    if (currentBooking.status !== 'CONFIRMED') {
        throw new HttpError(400, 'Only confirmed bookings can be marked no-show', undefined, 'BOOKING_CANNOT_NO_SHOW');
    }
    if (currentBooking.endAt > new Date()) {
        throw new HttpError(400, 'Attendance can only be reviewed after the session ends', undefined, 'BOOKING_CANNOT_NO_SHOW_EARLY');
    }
    const reviewReason = sanitizeNullableSingleLineText(reason);
    if (!reviewReason || reviewReason.length < 3 || reviewReason.length > 500) {
        throw new HttpError(400, 'A review reason of 3 to 500 characters is required', undefined, 'BOOKING_OUTCOME_REASON_REQUIRED');
    }
    const booking = await saveConfirmedBookingOutcome(bookingId, 'NO_SHOW');
    logBookingTransition({
        booking,
        actorUserId,
        actorType: 'ADMIN',
        action: 'NO_SHOW',
        fromStatus: 'CONFIRMED',
        toStatus: booking.status,
        reason: reviewReason,
    });
    notifyBookingUpdated(booking);
    await sendBookingNotificationSafely(() => notifyBookingNoShow(toBookingNotificationSource(booking)), {
        bookingId: booking.id,
        event: 'BOOKING_NO_SHOW',
    });
    return serializeBooking(booking);
};
export const adminCancelBooking = ({ bookingId, reason, actorUserId = null }) => cancelBooking({
    where: { id: bookingId }, actorUserId, actorType: actorUserId ? 'ADMIN' : 'SYSTEM', cancelledBy: 'SYSTEM', reason,
});
export const getMentorBookingDetail = async ({ userId, bookingId }) => {
    const mentor = await getSelfMentor(userId);
    const booking = await getBookingDetailOrThrow({
        id: bookingId,
        mentorId: mentor.id,
    });
    return serializeBooking(booking);
};
export const confirmMentorBooking = async ({ userId, bookingId }) => {
    const mentor = await getSelfMentor(userId);
    return confirmBooking({ where: { id: bookingId, mentorId: mentor.id }, actorUserId: userId, actorType: 'MENTOR' });
};
export const cancelMentorBooking = async ({ userId, bookingId, input }) => {
    const mentor = await getSelfMentor(userId);
    return cancelBooking({ where: { id: bookingId, mentorId: mentor.id }, actorUserId: userId,
        actorType: 'MENTOR', cancelledBy: 'MENTOR', reason: input.reason });
};
export const createBookingReview = async ({ userId, bookingId, input, }) => {
    const booking = await getBookingDetailOrThrow({
        id: bookingId,
        studentUserId: userId,
    });
    if (booking.status !== 'COMPLETED') {
        throw new HttpError(400, 'Only completed bookings can be reviewed', undefined, 'BOOKING_REVIEW_INVALID_STATUS');
    }
    const review = await prisma.$transaction(async (tx) => {
        const existingReview = await tx.bookingReview.findUnique({
            where: { bookingId },
            select: { id: true },
        });
        if (existingReview) {
            throw new HttpError(409, 'Booking review already exists', undefined, 'BOOKING_REVIEW_ALREADY_EXISTS');
        }
        const createdReview = await tx.bookingReview.create({
            data: {
                bookingId: booking.id,
                mentorId: booking.mentorId,
                studentUserId: booking.studentUserId,
                rating: input.rating,
                comment: sanitizeNullableRichText(input.comment ?? null) ?? null,
            },
            select: {
                id: true,
                bookingId: true,
                mentorId: true,
                studentUserId: true,
                rating: true,
                comment: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        await tx.mentor.update({
            where: { id: booking.mentorId },
            data: { reviewCount: { increment: 1 } },
        });
        return createdReview;
    });
    return {
        id: String(review.id),
        bookingId: String(review.bookingId),
        mentorId: String(review.mentorId),
        studentUserId: String(review.studentUserId),
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
    };
};
export const completeMentorBooking = async ({ userId, bookingId }) => {
    const mentor = await getSelfMentor(userId);
    const currentBooking = await getBookingDetailOrThrow({
        id: bookingId,
        mentorId: mentor.id,
    });
    if (currentBooking.status !== 'CONFIRMED') {
        throw new HttpError(400, 'Only confirmed bookings can be completed', undefined, 'BOOKING_CANNOT_COMPLETE');
    }
    if (currentBooking.endAt > new Date()) {
        throw new HttpError(400, 'Booking can only be completed after the session ends', undefined, 'BOOKING_CANNOT_COMPLETE_EARLY');
    }
    const booking = await saveConfirmedBookingOutcome(bookingId, 'COMPLETED');
    logBookingTransition({
        booking,
        actorUserId: userId,
        actorType: 'MENTOR',
        action: 'COMPLETE',
        fromStatus: currentBooking.status,
        toStatus: booking.status,
    });
    notifyBookingUpdated(booking);
    await sendBookingNotificationSafely(() => notifyBookingCompleted(toBookingNotificationSource(booking)), {
        bookingId: booking.id,
        event: 'BOOKING_COMPLETED',
    });
    return serializeBooking(booking);
};
