import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { requireTestDatabaseUrl } from '../../scripts/test-database-url.mjs';
import app from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { hashPassword } from '../../src/utils/password.js';
import { generateAccessToken, hashToken } from '../../src/utils/tokens.js';
import { createEmailVerificationToken, createPasswordResetToken } from '../../src/services/auth-token.service.js';

// Config validates TEST_DATABASE_URL before loading app; recheck the effective URL.
requireTestDatabaseUrl(process.env.DATABASE_URL);
const server = createServer(app);
const password = 'IC010-test-password!';
let origin: string;
let passwordHash: string;
let users: Record<'student' | 'other' | 'mentor' | 'admin', User>;
let createdIds: bigint[] = [];
let mentorIds: bigint[] = [];
type Body = { code?: string; message?: string; accessToken?: string | null; token?: string;
  user?: { id: string; role: string; emailVerifiedAt: string | null; passwordHash?: string } | null };

async function request(route: string, options: { method?: string; body?: object; token?: string; cookie?: string } = {}) {
  const response = await fetch(`${origin}/api${route}`, {
    method: options.method ?? 'GET',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.cookie ? { Cookie: options.cookie } : {}) },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  return { status: response.status, body: await response.json() as Body,
    cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '',
    cookieHeader: response.headers.get('set-cookie') ?? '' };
}
const login = (user = users.student, secret = password) => request('/auth/login', {
  method: 'POST', body: { email: user.email, password: secret },
});
const bearer = (user: User) => generateAccessToken(user);

beforeAll(async () => {
  passwordHash = await hashPassword(password);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected local test port');
  origin = `http://127.0.0.1:${address.port}`;
});
beforeEach(async () => {
  createdIds = []; mentorIds = [];
  const suffix = randomUUID();
  const createUser = async (name: string, role: User['role']) => {
    const user = await prisma.user.create({ data: { fullName: `IC010 ${name}`,
      email: `ic010-${name}-${suffix}@example.test`, passwordHash, role,
      emailVerifiedAt: new Date(), profile: { create: {} } } });
    createdIds.push(user.id);
    return user;
  };
  users = { student: await createUser('student', 'STUDENT'), other: await createUser('other', 'STUDENT'),
    mentor: await createUser('mentor', 'MENTOR'), admin: await createUser('admin', 'ADMIN') };
});
afterEach(async () => {
  await prisma.mentor.deleteMany({ where: { id: { in: mentorIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await prisma.$disconnect();
});

describe('real HTTP auth lifecycle on isolated MySQL', () => {
  it('registers a student with a hashed password/token and a scoped HttpOnly refresh cookie', async () => {
    const email = `ic010-register-${randomUUID()}@example.test`;
    const result = await request('/auth/register', { method: 'POST', body: { fullName: 'Test Registration', email, password } });
    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    createdIds.push(stored.id);
    expect(result.status).toBe(201);
    expect(result.body.user).toMatchObject({ role: 'STUDENT', emailVerifiedAt: null });
    expect(result.body.user).not.toHaveProperty('passwordHash');
    expect(stored.passwordHash).not.toBe(password);
    expect(result.cookieHeader).toContain('HttpOnly');
    expect(result.cookieHeader).toContain('Path=/api/auth');
    expect(result.cookieHeader).toContain('SameSite=Lax');
    const raw = result.cookie.slice(result.cookie.indexOf('=') + 1);
    expect(await prisma.authSession.findFirst({ where: { userId: stored.id } })).toMatchObject({ tokenHash: hashToken(raw) });
    expect(await prisma.emailVerificationToken.count({ where: { userId: stored.id } })).toBe(1);
    // Prove registration hashed the submitted password, not merely some value.
    const registeredLogin = await request('/auth/login', { method: 'POST', body: { email, password } });
    expect(registeredLogin.status).toBe(200);
    expect(registeredLogin.body.user?.id).toBe(String(stored.id));
    expect(await request('/auth/me', { token: registeredLogin.body.accessToken! }))
      .toMatchObject({ status: 200, body: { user: { id: String(stored.id) } } });
  });

  it('returns identical credential failures for unknown email and wrong password', async () => {
    const wrong = await login(users.student, 'wrong-password');
    const unknown = await request('/auth/login', { method: 'POST', body: { email: `${randomUUID()}@example.test`, password } });
    expect([wrong.status, unknown.status]).toEqual([401, 401]);
    expect(wrong.body.code).toBe('AUTH_INVALID_CREDENTIALS');
    expect(unknown.body.code).toBe(wrong.body.code);
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it('rejects invalid login input before creating any session', async () => {
    expect((await request('/auth/login', { method: 'POST', body: { email: 'invalid-address', password: 'x' } })).status).toBe(400);
    expect(await prisma.authSession.count({ where: { userId: users.student.id } })).toBe(0);
  });

  it('rotates refresh cookies and rejects sequential replay of the old cookie', async () => {
    const first = await login();
    const next = await request('/auth/refresh', { method: 'POST', cookie: first.cookie });
    expect(next.status).toBe(200);
    expect(next.body.user?.id).toBe(String(users.student.id));
    expect(next.cookie).not.toBe(first.cookie);
    const replay = await request('/auth/refresh', { method: 'POST', cookie: first.cookie });
    expect(replay).toMatchObject({ status: 401, body: { code: 'AUTH_INVALID_REFRESH_TOKEN' } });
    expect((await request('/auth/refresh', { method: 'POST', cookie: next.cookie })).status).toBe(200);
  });

  it('returns anonymous state without a cookie and rejects an expired session', async () => {
    expect(await request('/auth/refresh', { method: 'POST' })).toMatchObject({ status: 200, body: { user: null, accessToken: null } });
    const session = await login();
    await prisma.authSession.updateMany({ where: { userId: users.student.id }, data: { expiresAt: new Date(Date.now() - 60_000) } });
    expect(await request('/auth/refresh', { method: 'POST', cookie: session.cookie }))
      .toMatchObject({ status: 401, body: { code: 'AUTH_INVALID_REFRESH_TOKEN' } });
  });

  it('logout invalidates its cookie and logout-all invalidates every refresh session', async () => {
    const first = await login(); const second = await login();
    expect((await request('/auth/logout', { method: 'POST', cookie: first.cookie })).status).toBe(200);
    expect((await request('/auth/refresh', { method: 'POST', cookie: first.cookie })).status).toBe(401);
    expect((await request('/auth/logout-all', { method: 'POST', token: second.body.accessToken! })).status).toBe(200);
    expect((await request('/auth/refresh', { method: 'POST', cookie: second.cookie })).status).toBe(401);
    expect(await prisma.authSession.count({ where: { userId: users.student.id, revokedAt: null } })).toBe(0);
  });

  it('verifies email once, rejects expired/replayed tokens and stores only hashes', async () => {
    await prisma.user.update({ where: { id: users.student.id }, data: { emailVerifiedAt: null } });
    const token = await createEmailVerificationToken(users.student.id);
    expect(await prisma.emailVerificationToken.findFirst({ where: { userId: users.student.id } })).toMatchObject({ tokenHash: hashToken(token) });
    const confirm = () => request('/auth/verify-email/confirm', { method: 'POST', body: { token } });
    expect((await confirm()).status).toBe(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.student.id } })).emailVerifiedAt).toBeInstanceOf(Date);
    expect(await confirm()).toMatchObject({ status: 400, body: { code: 'AUTH_INVALID_VERIFY_EMAIL_TOKEN' } });
    const expired = await createEmailVerificationToken(users.other.id);
    await prisma.emailVerificationToken.updateMany({ where: { tokenHash: hashToken(expired) }, data: { expiresAt: new Date(Date.now() - 60_000) } });
    expect((await request('/auth/verify-email/confirm', { method: 'POST', body: { token: expired } })).status).toBe(400);
  });

  it('forgot-password responses are generic and expose no debug token', async () => {
    const known = await request('/auth/forgot-password', { method: 'POST', body: { email: users.student.email } });
    const unknown = await request('/auth/forgot-password', { method: 'POST', body: { email: `${randomUUID()}@example.test` } });
    expect(known.status).toBe(200); expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
    expect(known.body).not.toHaveProperty('token');
    expect(await prisma.passwordResetToken.count({ where: { userId: users.student.id } })).toBe(1);
  });

  it('reset changes the password, revokes all refresh sessions and rejects replay/expiry', async () => {
    const first = await login(); const second = await login();
    const token = await createPasswordResetToken(users.student.id);
    const newPassword = 'IC010-new-password!';
    const reset = () => request('/auth/reset-password', { method: 'POST', body: { token, newPassword } });
    expect((await reset()).status).toBe(200);
    expect(await reset()).toMatchObject({ status: 400, body: { code: 'AUTH_INVALID_RESET_PASSWORD_TOKEN' } });
    for (const session of [first, second]) expect((await request('/auth/refresh', { method: 'POST', cookie: session.cookie })).status).toBe(401);
    expect((await login()).status).toBe(401);
    expect((await login(users.student, newPassword)).status).toBe(200);
    const expired = await createPasswordResetToken(users.other.id);
    await prisma.passwordResetToken.updateMany({ where: { tokenHash: hashToken(expired) }, data: { expiresAt: new Date(Date.now() - 60_000) } });
    expect((await request('/auth/reset-password', { method: 'POST', body: { token: expired, newPassword } })).status).toBe(400);
  });
});

describe('real route authorization and booking ownership', () => {
  it('rejects absent and invalid access tokens', async () => {
    expect((await request('/admin/bookings')).status).toBe(401);
    expect((await request('/admin/bookings', { token: 'invalid' })).status).toBe(401);
  });

  it('rejects an expired signed access token', async () => {
    const token = jwt.sign({ sub: String(users.student.id) }, process.env.JWT_ACCESS_SECRET!, { expiresIn: -60 });
    expect(await request('/users/me/bookings', { token }))
      .toMatchObject({ status: 401, body: { code: 'AUTH_INVALID_ACCESS_TOKEN' } });
  });

  it.each([
    ['student', '/admin/bookings', 403], ['mentor', '/admin/bookings', 403], ['admin', '/admin/bookings', 200],
    ['student', '/mentor/bookings', 403], ['admin', '/users/me/bookings', 403], ['student', '/users/me/bookings', 200],
  ] as const)('%s → %s returns %s', async (role, route, status) => {
    expect((await request(route, { token: bearer(users[role]) })).status).toBe(status);
  });

  it('uses the new DB role after an admin token was issued', async () => {
    const token = bearer(users.admin);
    expect((await request('/admin/bookings', { token })).status).toBe(200);
    await prisma.user.update({ where: { id: users.admin.id }, data: { role: 'STUDENT' } });
    expect(await request('/admin/bookings', { token })).toMatchObject({ status: 403, body: { code: 'AUTH_INSUFFICIENT_PERMISSIONS' } });
  });

  it.each(['BLOCKED', 'SUSPENDED'] as const)('revokes active access when account becomes %s', async (status) => {
    const session = await login();
    await prisma.user.update({ where: { id: users.student.id }, data: { status } });
    expect(await request('/users/me/bookings', { token: session.body.accessToken! }))
      .toMatchObject({ status: 403, body: { code: 'AUTH_ACCOUNT_NOT_ACTIVE' } });
    expect((await request('/auth/refresh', { method: 'POST', cookie: session.cookie })).status).toBe(403);
    expect((await login()).status).toBe(403);
  });

  it('prevents another student or mentor reading/mutating a booking by its ID', async () => {
    const mentor = await prisma.mentor.create({ data: { name: 'IC010 Mentor', slug: `ic010-${randomUUID()}`, userId: users.mentor.id, isVerified: true } });
    mentorIds.push(mentor.id);
    const startAt = new Date(Date.now() + 2 * 86_400_000);
    const booking = await prisma.mentorBooking.create({ data: { mentorId: mentor.id, studentUserId: users.student.id,
      startAt, endAt: new Date(startAt.getTime() + 3_600_000), durationMinute: 60,
      responseDueAt: new Date(Date.now() + 86_400_000) } });
    expect((await request(`/users/me/bookings/${booking.id}`, { token: bearer(users.student) })).status).toBe(200);
    expect((await request(`/users/me/bookings/${booking.id}`, { token: bearer(users.other) })).status).toBe(404);
    expect((await request(`/users/me/bookings/${booking.id}/cancel`, { method: 'PATCH', token: bearer(users.other), body: { reason: 'Test unauthorized cancellation' } })).status).toBe(404);
    await prisma.user.update({ where: { id: users.other.id }, data: { role: 'MENTOR' } });
    const otherMentor = await prisma.mentor.create({ data: { name: 'IC010 Other Mentor', slug: `ic010-other-${randomUUID()}`, userId: users.other.id, isVerified: true } });
    mentorIds.push(otherMentor.id);
    expect((await request(`/mentor/bookings/${booking.id}`, { token: bearer(users.mentor) })).status).toBe(200);
    expect((await request(`/mentor/bookings/${booking.id}`, { token: bearer(users.other) })).status).toBe(404);
    expect((await request(`/mentor/bookings/${booking.id}/confirm`, { method: 'PATCH', token: bearer(users.other), body: {} })).status).toBe(404);
    expect((await prisma.mentorBooking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe('REQUESTED');
    expect(await prisma.notification.count({ where: { userId: { in: createdIds } } })).toBe(0);
    expect(await prisma.conversation.count({ where: { bookingId: booking.id } })).toBe(0);
  });
});
