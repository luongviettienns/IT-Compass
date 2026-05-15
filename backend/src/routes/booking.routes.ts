import { Router } from 'express';

import * as bookingController from '../controllers/booking.controller.js';
import { requireActiveUser, requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { bookingCreateLimiter } from '../middlewares/rate-limit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  cancelMentorBookingSchema,
  cancelStudentBookingSchema,
  createBookingSchema,
  getBookingDetailSchema,
  getMentorAvailabilitySchema,
  getMentorBookingSettingsSchema,
  getPublicAvailabilitySchema,
  getPublicBookingConfigSchema,
  listMentorBookingsSchema,
  listStudentBookingsSchema,
  mentorBookingActionSchema,
  updateMentorAvailabilitySchema,
  updateMentorBookingSettingsSchema,
} from '../validators/booking.validator.js';

const publicMentorBookingRoutes = Router();
const studentBookingRoutes = Router();
const mentorBookingRoutes = Router();

publicMentorBookingRoutes.get(
  '/:slug/booking-config',
  validate(getPublicBookingConfigSchema),
  bookingController.getPublicBookingConfig,
);
publicMentorBookingRoutes.get(
  '/:slug/availability',
  validate(getPublicAvailabilitySchema),
  bookingController.getPublicAvailability,
);
publicMentorBookingRoutes.post(
  '/:slug/bookings',
  requireAuth,
  requireActiveUser,
  requireRole('STUDENT'),
  bookingCreateLimiter,
  validate(createBookingSchema),
  bookingController.createBooking,
);

studentBookingRoutes.use(requireAuth, requireActiveUser, requireRole('STUDENT'));
studentBookingRoutes.get('/me/bookings', validate(listStudentBookingsSchema), bookingController.listStudentBookings);
studentBookingRoutes.get('/me/bookings/:bookingId', validate(getBookingDetailSchema), bookingController.getStudentBookingDetail);
studentBookingRoutes.patch(
  '/me/bookings/:bookingId/cancel',
  validate(cancelStudentBookingSchema),
  bookingController.cancelStudentBooking,
);

mentorBookingRoutes.use(requireAuth, requireActiveUser, requireRole('MENTOR'));
mentorBookingRoutes.get('/availability', validate(getMentorAvailabilitySchema), bookingController.getMentorAvailability);
mentorBookingRoutes.put('/availability', validate(updateMentorAvailabilitySchema), bookingController.updateMentorAvailability);
mentorBookingRoutes.get('/booking-settings', validate(getMentorBookingSettingsSchema), bookingController.getMentorBookingSettings);
mentorBookingRoutes.patch('/booking-settings', validate(updateMentorBookingSettingsSchema), bookingController.updateMentorBookingSettings);
mentorBookingRoutes.get('/bookings', validate(listMentorBookingsSchema), bookingController.listMentorBookings);
mentorBookingRoutes.get('/bookings/:bookingId', validate(getBookingDetailSchema), bookingController.getMentorBookingDetail);
mentorBookingRoutes.patch('/bookings/:bookingId/confirm', validate(mentorBookingActionSchema), bookingController.confirmMentorBooking);
mentorBookingRoutes.patch('/bookings/:bookingId/cancel', validate(cancelMentorBookingSchema), bookingController.cancelMentorBooking);
mentorBookingRoutes.patch('/bookings/:bookingId/complete', validate(mentorBookingActionSchema), bookingController.completeMentorBooking);

export { mentorBookingRoutes, publicMentorBookingRoutes, studentBookingRoutes };
