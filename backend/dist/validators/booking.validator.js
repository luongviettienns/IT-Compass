import { z } from 'zod';
const idParamSchema = z.object({
    bookingId: z.string().regex(/^\d+$/, 'Booking id must be a numeric string'),
});
const slugParamSchema = z.object({
    slug: z.string().trim().min(1).max(180),
});
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format');
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm format');
const durationSchema = z.coerce.number().int().min(30).max(240);
const bookingRequestTypeSchema = z.enum(['AVAILABILITY_SLOT', 'CUSTOM_TIME']);
const bookingStatusFilterSchema = z.enum([
    'REQUESTED',
    'CONFIRMED',
    'CANCELLED_BY_STUDENT',
    'CANCELLED_BY_MENTOR',
    'COMPLETED',
    'NO_SHOW',
]);
const availabilityBlockSchema = z.object({
    weekday: z.number().int().min(0).max(6),
    startTime: timeSchema,
    endTime: timeSchema,
    isActive: z.boolean().optional().default(true),
});
const listBookingsQuerySchema = z.object({
    status: bookingStatusFilterSchema.optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
export const getPublicBookingConfigSchema = z.object({
    params: slugParamSchema,
});
export const getPublicAvailabilitySchema = z.object({
    params: slugParamSchema,
    query: z.object({
        date: dateSchema,
        durationMinute: durationSchema.optional().default(60),
    }),
});
export const createBookingSchema = z.object({
    params: slugParamSchema,
    body: z.object({
        date: dateSchema,
        startTime: timeSchema,
        durationMinute: durationSchema,
        requestType: bookingRequestTypeSchema.optional().default('AVAILABILITY_SLOT'),
        note: z.string().trim().max(1000).nullable().optional(),
    }),
});
export const listStudentBookingsSchema = z.object({
    query: listBookingsQuerySchema,
});
export const getBookingDetailSchema = z.object({
    params: idParamSchema,
});
export const cancelStudentBookingSchema = z.object({
    params: idParamSchema,
    body: z.object({
        reason: z.string().trim().max(500).nullable().optional(),
    }).optional().default({}),
});
export const getMentorAvailabilitySchema = z.object({
    query: z.object({}).optional().default({}),
});
export const updateMentorAvailabilitySchema = z.object({
    body: z.object({
        blocks: z.array(availabilityBlockSchema).max(56),
    }),
});
export const getMentorBookingSettingsSchema = z.object({
    query: z.object({}).optional().default({}),
});
export const updateMentorBookingSettingsSchema = z.object({
    body: z.object({
        minDurationMinute: z.number().int().min(30).max(240).optional(),
        maxDurationMinute: z.number().int().min(30).max(240).optional(),
        defaultDurationMinute: z.number().int().min(30).max(240).optional(),
        bookingNoticeHour: z.number().int().min(0).max(168).optional(),
        maxAdvanceDay: z.number().int().min(1).max(180).optional(),
        bufferBeforeMinute: z.number().int().min(0).max(120).optional(),
        bufferAfterMinute: z.number().int().min(0).max(120).optional(),
    }).refine((value) => Object.keys(value).length > 0, {
        message: 'At least one booking setting is required',
    }),
});
export const listMentorBookingsSchema = z.object({
    query: listBookingsQuerySchema,
});
export const mentorBookingActionSchema = z.object({
    params: idParamSchema,
});
export const cancelMentorBookingSchema = z.object({
    params: idParamSchema,
    body: z.object({
        reason: z.string().trim().max(500).nullable().optional(),
    }).optional().default({}),
});
