import { Prisma } from '@prisma/client';
import { setTimeout as delay } from 'node:timers/promises';

import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';

const isRetryableConflict = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError
  && (error.code === 'P2034' || (error.code === 'P2010' && ['1213', '1205'].includes(String(error.meta?.code))));

export const withBookingTransaction = async <T>(
  resource: { studentUserId: bigint; mentorId: bigint },
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        // One lock order for every booking writer. Student serialization also
        // protects the active quota and request keys across mentor calendars.
        const students = await tx.$queryRaw<Array<{ id: bigint }>>`
          SELECT id FROM nguoi_dung WHERE id = ${resource.studentUserId} FOR UPDATE`;
        if (!students.length) throw new HttpError(404, 'Student not found', undefined, 'AUTH_USER_NOT_FOUND');
        const mentors = await tx.$queryRaw<Array<{ id: bigint }>>`
          SELECT id FROM mentor WHERE id = ${resource.mentorId} FOR UPDATE`;
        if (!mentors.length) throw new HttpError(404, 'Mentor not found', undefined, 'MENTOR_NOT_FOUND');
        return operation(tx);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 10_000, timeout: 15_000 });
    } catch (error) {
      if (isRetryableConflict(error)) {
        if (attempt >= 2) throw new HttpError(503, 'Booking is busy; retry the same request', undefined, 'BOOKING_BUSY');
        await delay(25 * 2 ** attempt);
        continue;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new HttpError(409, 'Booking state changed; reload before retrying', undefined, 'BOOKING_STATE_CHANGED');
      }
      throw error;
    }
  }
};
