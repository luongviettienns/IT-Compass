import { PrismaClient } from '@prisma/client';
import assert from 'node:assert/strict';
import { requireE2EDatabaseUrl } from './e2e-database-url.mjs';

const db = new PrismaClient({ datasources: { db: { url: requireE2EDatabaseUrl() } } });
try {
  const cancelled = await db.mentorBooking.findUniqueOrThrow({ where: { id: 910201n } });
  assert.equal(cancelled.status, 'CANCELLED_BY_STUDENT');
  assert.equal(cancelled.cancelReason, 'IC010 thay đổi thời gian học');
  const confirmed = await db.mentorBooking.findUniqueOrThrow({ where: { id: 910202n } });
  assert.equal(confirmed.status, 'CONFIRMED');
  assert.ok(confirmed.confirmedAt);
  assert.equal(await db.conversation.count({ where: { bookingId: confirmed.id } }), 1);
  // Manual confirmation notifies the student; cancellation notifies the mentor.
  // Auto-confirm's two-recipient policy is covered by booking integration tests.
  assert.equal(await db.notification.count({ where: { type: 'BOOKING_CONFIRMED', userId: 910004n } }), 1);
  assert.equal(await db.notification.count({ where: { type: 'BOOKING_CANCELLED_BY_STUDENT', userId: 910002n } }), 1);
  assert.equal((await db.mentorBookingSetting.findUniqueOrThrow({ where: { mentorId: 910101n } })).bookingNoticeHour, 3);
  console.log('E2E DB verification PASS: student cancellation/reason; mentor notice=3; admin confirmation, one chat, one student confirmation notification and one mentor cancellation notification.');
} finally { await db.$disconnect(); }
