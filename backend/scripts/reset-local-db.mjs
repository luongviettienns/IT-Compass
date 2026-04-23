import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlFilePath = path.resolve(__dirname, '../../init_it_compass_vi_25_tables.sql');
const authFoundationSqlFilePath = path.resolve(
  __dirname,
  '../prisma/migrations/0001_auth_foundation/migration.sql',
);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const targetUrl = new URL(databaseUrl);
const dbName = targetUrl.pathname.replace(/^\//, '');
const adminUrl = new URL(databaseUrl);
adminUrl.pathname = '/mysql';

const adminPrisma = new PrismaClient({
  datasources: {
    db: {
      url: adminUrl.toString(),
    },
  },
});

const prisma = new PrismaClient();

const sql = await fs.readFile(sqlFilePath, 'utf8');
const authFoundationSql = await fs.readFile(authFoundationSqlFilePath, 'utf8');

const executeSqlStatements = async (rawSql) => {
  for (const statement of rawSql
    .split(/;\s*(?:\r?\n|$)/)
    .map((item) => item.trim())
    .filter(Boolean)) {
    await prisma.$executeRawUnsafe(statement);
  }
};

try {
  await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await adminPrisma.$executeRawUnsafe(
    `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );

  await executeSqlStatements(sql);
  await executeSqlStatements(authFoundationSql);

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  await prisma.user.create({
    data: {
      fullName: 'Quan tri vien',
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
      profile: {
        create: {},
      },
    },
  });

  console.log(`Reset database ${dbName} successfully.`);
  console.log('Admin account: admin@example.com / Admin@123');
} finally {
  await adminPrisma.$disconnect();
  await prisma.$disconnect();
}
