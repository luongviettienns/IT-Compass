import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';
import { publicMentorSelect, serializePublicMentor } from '../utils/serializeMentor.js';
import { ensureConversationForConfirmedBooking } from './conversation.service.js';
import { emitBookingUpdated } from '../socket/booking.events.js';
import { notifyBookingCancelledByMentor, notifyBookingCancelledByStudent, notifyBookingCompleted, notifyBookingConfirmed, notifyBookingNoShow, notifyBookingRequested, } from './notification.service.js';
import { sanitizeNullableRichText, sanitizeNullableSingleLineText } from '../utils/sanitize.js';
const DURATION_STEP_MINUTE = 30;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_ACTIVE_BOOKINGS_PER_STUDENT = 5;
const MAX_DAILY_REQUESTS_PER_STUDENT_MENTOR = 3;
const NO_SHOW_GRACE_MINUTE = 15;
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
};
const pad2 = (value) => String(value).padStart(2, '0');
const formatDate = (date) => (`${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`);
const formatTime = (date) => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
const minuteToTime = (minute) => `${pad2(Math.floor(minute / 60))}:${pad2(minute % 60)}`;
const parseTimeToMinute = (value) => {
    const [hourPart, minutePart] = value.split(':');
    return Number(hourPart) * 60 + Number(minutePart);
};
const parseLocalDateTime = ({ date, startTime, durationMinute }) => {
    const [yearPart, monthPart, dayPart] = date.split('-');
    const [hourPart, minutePart] = startTime.split(':');
    const year = Number(yearPart);
    const monthIndex = Number(monthPart) - 1;
    const day = Number(dayPart);
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    const startAt = new Date(year, monthIndex, day, hour, minute, 0, 0);
    if (startAt.getFullYear() !== year ||
        startAt.getMonth() !== monthIndex ||
        startAt.getDate() !== day ||
        startAt.getHours() !== hour ||
        startAt.getMinutes() !== minute) {
        throw new HttpError(400, 'Invalid booking date or time', undefined, 'BOOKING_INVALID_DATE_TIME');
    }
    const endAt = new Date(startAt.getTime() + durationMinute * 60_000);
    const startMinute = hour * 60 + minute;
    const endMinute = startMinute + durationMinute;
    if (endMinute > 24 * 60) {
        throw new HttpError(400, 'Booking must end within the selected date', undefined, 'BOOKING_ENDS_NEXT_DAY');
    }
    return {
        startAt,
        endAt,
        weekday: startAt.getDay(),
        startMinute,
        endMinute,
    };
};
const parseDateBoundary = (date, mode) => {
    const [yearPart, monthPart, dayPart] = date.split('-');
    const year = Number(yearPart);
    const monthIndex = Number(monthPart) - 1;
    const day = Number(dayPart);
    const result = new Date(year, monthIndex, day, 0, 0, 0, 0);
    if (result.getFullYear() !== year || result.getMonth() !== monthIndex || result.getDate() !== day) {
        throw new HttpError(400, 'Invalid date filter', undefined, 'BOOKING_INVALID_DATE_FILTER');
    }
    if (mode === 'end') {
        result.setDate(result.getDate() + 1);
    }
    return result;
};
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
const getBookingSettingOrDefault = async (mentorId) => {
    const setting = await prisma.mentorBookingSetting.findUnique({
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
const getPublicMentorForBooking = async (slug) => {
    const mentor = await prisma.mentor.findFirst({
        where: {
            slug,
            status: 'ACTIVE',
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
    const latestStartAt = new Date(now);
    latestStartAt.setDate(latestStartAt.getDate() + setting.maxAdvanceDay);
    if (startAt < earliestStartAt) {
        throw new HttpError(400, 'Booking is too soon for this mentor notice policy', undefined, 'BOOKING_NOTICE_TOO_SHORT');
    }
    if (startAt > latestStartAt) {
        throw new HttpError(400, 'Booking date is too far in advance', undefined, 'BOOKING_TOO_FAR_IN_ADVANCE');
    }
};
const assertWithinAvailability = async ({ mentorId, weekday, startMinute, endMinute, }) => {
    const block = await prisma.mentorAvailability.findFirst({
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
    return startAt < blockedEndAt && endAt > blockedStartAt;
};
const findOverlappingBooking = async (tx, { mentorId, startAt, endAt, setting, excludeBookingId, }) => {
    const queryStartAt = new Date(startAt.getTime() - setting.bufferAfterMinute * 60_000);
    const queryEndAt = new Date(endAt.getTime() + setting.bufferBeforeMinute * 60_000);
    const bookings = await tx.mentorBooking.findMany({
        where: {
            mentorId,
            status: { in: ACTIVE_BOOKING_STATUSES },
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
const assertBookingAbuseLimits = async (tx, { studentUserId, mentorId, startAt, }) => {
    const dayStartAt = new Date(startAt);
    dayStartAt.setHours(0, 0, 0, 0);
    const dayEndAt = new Date(dayStartAt);
    dayEndAt.setDate(dayEndAt.getDate() + 1);
    const [activeBookingCount, dailyMentorRequestCount] = await Promise.all([
        tx.mentorBooking.count({
            where: {
                studentUserId,
                status: { in: ACTIVE_BOOKING_STATUSES },
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
const buildBookingWhere = ({ status, from, to, }) => ({
    ...(status ? { status } : {}),
    ...(from || to
        ? {
            startAt: {
                ...(from ? { gte: parseDateBoundary(from, 'start') } : {}),
                ...(to ? { lt: parseDateBoundary(to, 'end') } : {}),
            },
        }
        : {}),
});
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
    const dayEndAt = new Date(dayStartAt);
    dayEndAt.setDate(dayEndAt.getDate() + 1);
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
                status: { in: ACTIVE_BOOKING_STATUSES },
                startAt: { lt: new Date(dayEndAt.getTime() + setting.bufferBeforeMinute * 60_000) },
                endAt: { gt: new Date(dayStartAt.getTime() - setting.bufferAfterMinute * 60_000) },
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
            const startAt = new Date(dayStartAt);
            startAt.setMinutes(startMinute);
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
export const createBooking = async ({ userId, slug, input, }) => {
    const mentor = await getPublicMentorForBooking(slug);
    if (mentor.userId === userId) {
        throw new HttpError(400, 'Mentor cannot book their own schedule', undefined, 'BOOKING_SELF_NOT_ALLOWED');
    }
    const setting = await getBookingSettingOrDefault(mentor.id);
    const requestType = input.requestType;
    assertDurationAllowed(input.durationMinute, setting);
    const parsedDateTime = parseLocalDateTime(input);
    assertBookingWindowAllowed(parsedDateTime.startAt, setting);
    if (requestType === 'AVAILABILITY_SLOT') {
        await assertWithinAvailability({ mentorId: mentor.id, ...parsedDateTime });
    }
    const booking = await prisma.$transaction(async (tx) => {
        await assertBookingAbuseLimits(tx, {
            studentUserId: userId,
            mentorId: mentor.id,
            startAt: parsedDateTime.startAt,
        });
        await assertNoOverlap(tx, { mentorId: mentor.id, ...parsedDateTime, setting });
        return tx.mentorBooking.create({
            data: {
                mentorId: mentor.id,
                studentUserId: userId,
                startAt: parsedDateTime.startAt,
                endAt: parsedDateTime.endAt,
                durationMinute: input.durationMinute,
                status: 'REQUESTED',
                requestType,
                note: sanitizeNullableRichText(input.note) ?? null,
            },
            select: bookingSelect,
        });
    });
    logBookingTransition({
        booking,
        actorUserId: userId,
        actorType: 'STUDENT',
        action: 'CREATE',
        fromStatus: null,
        toStatus: booking.status,
    });
    notifyBookingUpdated(booking);
    await sendBookingNotificationSafely(() => notifyBookingRequested(toBookingNotificationSource(booking)), {
        bookingId: booking.id,
        event: 'BOOKING_REQUESTED',
    });
    return serializeBooking(booking);
};
export const listStudentBookings = async ({ userId, query, }) => {
    const { page, limit } = normalizePagination(query);
    const where = {
        ...buildBookingWhere(query),
        studentUserId: userId,
    };
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
export const getStudentBookingDetail = async ({ userId, bookingId }) => {
    const booking = await getBookingDetailOrThrow({
        id: bookingId,
        studentUserId: userId,
    });
    return serializeBooking(booking);
};
export const cancelStudentBooking = async ({ userId, bookingId, input, }) => {
    const currentBooking = await getBookingDetailOrThrow({
        id: bookingId,
        studentUserId: userId,
    });
    if (!CANCELLABLE_STATUSES.includes(currentBooking.status)) {
        throw new HttpError(400, 'Booking cannot be cancelled in current status', undefined, 'BOOKING_CANNOT_CANCEL');
    }
    const booking = await prisma.mentorBooking.update({
        where: { id: bookingId },
        data: {
            status: 'CANCELLED_BY_STUDENT',
            cancelReason: sanitizeNullableSingleLineText(input.reason) ?? null,
            cancelledBy: 'STUDENT',
            cancelledAt: new Date(),
        },
        select: bookingSelect,
    });
    logBookingTransition({
        booking,
        actorUserId: userId,
        actorType: 'STUDENT',
        action: 'CANCEL',
        fromStatus: currentBooking.status,
        toStatus: booking.status,
        reason: booking.cancelReason,
    });
    notifyBookingUpdated(booking);
    await sendBookingNotificationSafely(() => notifyBookingCancelledByStudent(toBookingNotificationSource(booking)), {
        bookingId: booking.id,
        event: 'BOOKING_CANCELLED_BY_STUDENT',
    });
    return serializeBooking(booking);
};
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
        autoConfirm: false,
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
    const setting = await getBookingSettingOrDefault(mentor.id);
    const booking = await prisma.$transaction(async (tx) => {
        const currentBooking = await getBookingDetailOrThrow({
            id: bookingId,
            mentorId: mentor.id,
        }, tx);
        if (currentBooking.status !== 'REQUESTED') {
            throw new HttpError(400, 'Only requested bookings can be confirmed', undefined, 'BOOKING_CANNOT_CONFIRM');
        }
        await assertNoOverlap(tx, {
            mentorId: mentor.id,
            startAt: currentBooking.startAt,
            endAt: currentBooking.endAt,
            setting,
            excludeBookingId: currentBooking.id,
        });
        const confirmedBooking = await tx.mentorBooking.update({
            where: { id: bookingId },
            data: {
                status: 'CONFIRMED',
                confirmedAt: new Date(),
            },
            select: bookingSelect,
        });
        await ensureConversationForConfirmedBooking(tx, confirmedBooking);
        return confirmedBooking;
    });
    logBookingTransition({
        booking,
        actorUserId: userId,
        actorType: 'MENTOR',
        action: 'CONFIRM',
        fromStatus: 'REQUESTED',
        toStatus: booking.status,
    });
    notifyBookingUpdated(booking);
    await sendBookingNotificationSafely(() => notifyBookingConfirmed(toBookingNotificationSource(booking)), {
        bookingId: booking.id,
        event: 'BOOKING_CONFIRMED',
    });
    return serializeBooking(booking);
};
export const cancelMentorBooking = async ({ userId, bookingId, input, }) => {
    const mentor = await getSelfMentor(userId);
    const currentBooking = await getBookingDetailOrThrow({
        id: bookingId,
        mentorId: mentor.id,
    });
    if (!CANCELLABLE_STATUSES.includes(currentBooking.status)) {
        throw new HttpError(400, 'Booking cannot be cancelled in current status', undefined, 'BOOKING_CANNOT_CANCEL');
    }
    const booking = await prisma.mentorBooking.update({
        where: { id: bookingId },
        data: {
            status: 'CANCELLED_BY_MENTOR',
            cancelReason: sanitizeNullableSingleLineText(input.reason) ?? null,
            cancelledBy: 'MENTOR',
            cancelledAt: new Date(),
        },
        select: bookingSelect,
    });
    logBookingTransition({
        booking,
        actorUserId: userId,
        actorType: 'MENTOR',
        action: 'CANCEL',
        fromStatus: currentBooking.status,
        toStatus: booking.status,
        reason: booking.cancelReason,
    });
    notifyBookingUpdated(booking);
    await sendBookingNotificationSafely(() => notifyBookingCancelledByMentor(toBookingNotificationSource(booking)), {
        bookingId: booking.id,
        event: 'BOOKING_CANCELLED_BY_MENTOR',
    });
    return serializeBooking(booking);
};
export const markOverdueBookingsAsNoShow = async () => {
    const cutoffAt = new Date(Date.now() - NO_SHOW_GRACE_MINUTE * 60_000);
    const overdueBookings = await prisma.mentorBooking.findMany({
        where: {
            status: 'CONFIRMED',
            endAt: { lt: cutoffAt },
        },
        select: bookingSelect,
        take: 100,
    });
    if (overdueBookings.length === 0)
        return { marked: 0 };
    const updatedBookings = await prisma.$transaction(async (tx) => Promise.all(overdueBookings.map((booking) => tx.mentorBooking.update({
        where: {
            id: booking.id,
            status: 'CONFIRMED',
        },
        data: {
            status: 'NO_SHOW',
        },
        select: bookingSelect,
    }))));
    for (const booking of updatedBookings) {
        logBookingTransition({
            booking,
            actorUserId: null,
            actorType: 'SYSTEM',
            action: 'NO_SHOW',
            fromStatus: 'CONFIRMED',
            toStatus: booking.status,
        });
        notifyBookingUpdated(booking);
        await sendBookingNotificationSafely(() => notifyBookingNoShow(toBookingNotificationSource(booking)), {
            bookingId: booking.id,
            event: 'BOOKING_NO_SHOW',
        });
    }
    return { marked: updatedBookings.length };
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
    const booking = await prisma.mentorBooking.update({
        where: { id: bookingId },
        data: {
            status: 'COMPLETED',
            completedAt: new Date(),
        },
        select: bookingSelect,
    });
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
