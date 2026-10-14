import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { requireE2EDatabaseUrl } from './e2e-database-url.mjs';

export async function seedE2E() {
  const url = requireE2EDatabaseUrl();
  const cwd = fileURLToPath(new URL('../', import.meta.url));
  execFileSync(process.execPath, [path.join(cwd, 'node_modules/prisma/build/index.js'), 'db', 'push', '--skip-generate'], {
    cwd, env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe',
  });
  const db = new PrismaClient({ datasources: { db: { url } } });
  const ids = [910001n, 910002n, 910003n, 910004n];
  try {
    // Delete only this suite's fixed synthetic fixtures, including cascading sessions.
    await db.mentor.deleteMany({ where: { id: 910101n } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    const passwordHash = await hash('IC010-e2e-password!', 10);
    for (const [index, role] of ['STUDENT', 'MENTOR', 'ADMIN', 'STUDENT'].entries()) {
      const name = ['student', 'mentor', 'admin', 'confirmation'][index];
      await db.user.create({ data: { id: ids[index], role, fullName: `IC010 ${name}`,
        email: `ic010-${name}@example.test`, passwordHash, emailVerifiedAt: new Date(), profile: { create: {} } } });
    }
    await db.mentor.create({ data: { id: 910101n, userId: ids[1], name: 'IC010 Test Mentor',
      slug: 'ic010-test-mentor', isVerified: true, status: 'ACTIVE' } });
    await db.mentorBookingSetting.create({ data: { mentorId: 910101n, autoConfirm: false, bookingNoticeHour: 2 } });
    const startAt = new Date(Date.now() + 2 * 86_400_000);
    startAt.setUTCMinutes(0, 0, 0);
    for (const [index, id] of [910201n, 910202n].entries()) {
      const start = new Date(startAt.getTime() + index * 3 * 3_600_000);
      await db.mentorBooking.create({ data: { id, mentorId: 910101n, studentUserId: ids[index === 0 ? 0 : 3],
        startAt: start, endAt: new Date(start.getTime() + 3_600_000), durationMinute: 60,
        responseDueAt: new Date(Date.now() + 86_400_000), note: `IC010 ${index === 0 ? 'student cancellation' : 'admin confirmation'}` } });
    }
    console.log('Dedicated E2E schema seeded with synthetic role and booking fixtures.');
  } finally { await db.$disconnect(); }
}
