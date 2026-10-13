import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { requireTestDatabaseUrl } from './test-database-url.mjs';

const url = requireTestDatabaseUrl();
const cli = path.resolve('node_modules/prisma/build/index.js');
const runPrisma = (args, databaseUrl = url, sql) => execFileSync(process.execPath, [cli, ...args], {
  env: { ...process.env, DATABASE_URL: databaseUrl }, input: sql, stdio: ['pipe', 'pipe', 'pipe'],
});

runPrisma(['db', 'push', '--skip-generate']);
console.log('Integration schema prepared in the guarded test database.');

// Verify the actual ALTER migration against the preceding schema, including
// multiple legacy NULL keys, in a second fresh test database.
const legacySchema = readFileSync('prisma/schema.prisma', 'utf8')
  .replace(/^.*(?:requestKeyHash|requestPayloadHash|responseDueAt|expiredAt|timezone).*\r?\n/gm, '');
const schemaDirectory = mkdtempSync(path.join(os.tmpdir(), 'ITCompass-IC003-schema-'));
const schemaFile = path.join(schemaDirectory, 'schema.prisma');
writeFileSync(schemaFile, legacySchema);
const migrationUrl = new URL(url);
migrationUrl.pathname = `/itcompass_ic003_migration_${randomUUID().replaceAll('-', '').slice(0, 12)}_test`;
// Preserve the original authority, including an explicit empty password used
// by disposable local servers (URL.href would remove its colon).
const migrationDatabaseUrl = url.replace(new URL(url).pathname, migrationUrl.pathname);
requireTestDatabaseUrl(migrationDatabaseUrl);
const adminDatabase = new PrismaClient({ datasources: { db: { url } } });
try {
  // The identifier is generated here and validated by the test-name guard.
  await adminDatabase.$executeRawUnsafe(`CREATE DATABASE \`${migrationUrl.pathname.slice(1)}\``);
} finally {
  await adminDatabase.$disconnect();
}
runPrisma(['db', 'push', '--skip-generate', '--schema', schemaFile], migrationDatabaseUrl);
const database = new PrismaClient({ datasources: { db: { url: migrationDatabaseUrl } } });
try {
  const student = await database.user.create({ data: { fullName: 'Legacy Test Student', email: 'legacy-student@example.test', passwordHash: 'test-only' } });
  const mentor = await database.mentor.create({ data: { name: 'Legacy Test Mentor', slug: 'legacy-test-mentor' } });
  for (const hour of [10, 12]) {
    const startAt = new Date(Date.UTC(2026, 9, 1, hour));
    const endAt = new Date(startAt.getTime() + 3_600_000);
    await database.$executeRaw`INSERT INTO dat_lich_mentor
      (mentor_id, hoc_vien_id, bat_dau_luc, ket_thuc_luc, thoi_luong_phut, ghi_chu, cap_nhat_luc)
      VALUES (${mentor.id}, ${student.id}, ${startAt}, ${endAt}, 60, 'legacy booking', NOW())`;
  }
  await database.$executeRaw`INSERT INTO dat_lich_mentor
    (mentor_id, hoc_vien_id, bat_dau_luc, ket_thuc_luc, thoi_luong_phut, ghi_chu, tao_luc, cap_nhat_luc)
    VALUES (${mentor.id}, ${student.id}, '2099-10-01 03:00:00', '2099-10-01 04:00:00', 60,
      'future legacy request', '2026-10-12 05:00:00', '2026-10-12 05:00:00')`;
  await database.$executeRaw`INSERT INTO dat_lich_mentor
    (mentor_id, hoc_vien_id, bat_dau_luc, ket_thuc_luc, thoi_luong_phut, trang_thai, ghi_chu, cap_nhat_luc)
    VALUES (${mentor.id}, ${student.id}, '2026-10-01 03:00:00', '2026-10-01 04:00:00', 60,
      'da_xac_nhan', 'legacy confirmed session', NOW())`;
  const migration = readFileSync('prisma/migrations/0009_booking_idempotency/migration.sql', 'utf8');
  runPrisma(['db', 'execute', '--stdin', '--url', migrationDatabaseUrl], migrationDatabaseUrl, migration);
  const policyMigration = readFileSync('prisma/migrations/0010_booking_policy/migration.sql', 'utf8');
  runPrisma(['db', 'execute', '--stdin', '--url', migrationDatabaseUrl], migrationDatabaseUrl, policyMigration);
  const bookings = await database.mentorBooking.findMany();
  assert.equal(bookings.length, 4);
  const oldRequests = bookings.filter((booking) => booking.note === 'legacy booking');
  assert.equal(oldRequests.length, 2);
  assert.ok(oldRequests.every((booking) => booking.note === 'legacy booking'
    && booking.status === 'REQUESTED' && booking.requestKeyHash === null && booking.requestPayloadHash === null));
  assert.ok(oldRequests.every((booking) => booking.timezone === 'Asia/Ho_Chi_Minh'
    && booking.expiredAt === null && booking.responseDueAt.getTime() === booking.startAt.getTime()));
  const future = bookings.find((booking) => booking.note === 'future legacy request');
  assert.equal(future.startAt.toISOString(), '2099-10-01T03:00:00.000Z');
  assert.equal(future.responseDueAt.toISOString(), '2026-10-13T05:00:00.000Z');
  const confirmed = bookings.find((booking) => booking.note === 'legacy confirmed session');
  assert.equal(confirmed.status, 'CONFIRMED');
  assert.equal(confirmed.startAt.toISOString(), '2026-10-01T03:00:00.000Z');
  assert.equal(confirmed.responseDueAt, null);
  assert.equal(confirmed.expiredAt, null);
  const requestKeyHash = 'a'.repeat(64);
  await database.mentorBooking.update({ where: { id: oldRequests[0].id }, data: { requestKeyHash } });
  await assert.rejects(database.mentorBooking.update({ where: { id: oldRequests[1].id }, data: { requestKeyHash } }),
    (error) => error.code === 'P2002');
  const otherStudent = await database.user.create({ data: { fullName: 'Other Test Student', email: 'other-legacy@example.test', passwordHash: 'test-only' } });
  await database.mentorBooking.create({ data: {
    mentorId: mentor.id, studentUserId: otherStudent.id, requestKeyHash,
    startAt: new Date('2026-10-01T14:00:00Z'), endAt: new Date('2026-10-01T15:00:00Z'), durationMinute: 60,
  } });
  console.log('0009 migration preserved legacy rows and enforced student-scoped unique request keys.');
  console.log('0010 migration preserved legacy instants/statuses and backfilled the approved response deadline.');
} finally {
  await database.$disconnect();
}
