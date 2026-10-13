import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ $transaction: vi.fn() }));
vi.mock('../src/db/prisma.js', () => ({ prisma: database }));
import { withBookingTransaction } from '../src/services/booking-transaction.js';

const resource = { studentUserId: 1n, mentorId: 101n };
const transactionClient = { $queryRaw: vi.fn().mockResolvedValue([{ id: 1n }]) };

beforeEach(() => {
  database.$transaction.mockReset();
  database.$transaction.mockImplementation(async (work: (tx: typeof transactionClient) => Promise<unknown>) => work(transactionClient));
});

describe('bounded booking transaction recovery', () => {
  it('retries a rolled-back conflict and commits the operation once', async () => {
    database.$transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('Deadlock', { code: 'P2034', clientVersion: '6.19.3' }));
    let committedOperations = 0;
    const result = await withBookingTransaction(resource, async () => { committedOperations++; return 'saved'; });
    expect(result).toBe('saved');
    expect(committedOperations).toBe(1);
    expect(database.$transaction).toHaveBeenCalledTimes(2);
  });

  it.each(['1213', '1205'])('bounds MySQL conflict retries (%s) and returns a retryable response', async (code) => {
    database.$transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Locked', { code: 'P2010', clientVersion: '6.19.3', meta: { code } }));
    await expect(withBookingTransaction(resource, async () => 'saved')).rejects.toMatchObject({ statusCode: 503, code: 'BOOKING_BUSY' });
    expect(database.$transaction).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-retryable persistence error', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Constraint', { code: 'P2002', clientVersion: '6.19.3' });
    database.$transaction.mockRejectedValue(error);
    await expect(withBookingTransaction(resource, async () => 'saved')).rejects.toBe(error);
    expect(database.$transaction).toHaveBeenCalledTimes(1);
  });
});
