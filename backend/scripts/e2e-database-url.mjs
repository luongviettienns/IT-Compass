import { requireTestDatabaseUrl } from './test-database-url.mjs';

export function requireE2EDatabaseUrl(value = process.env.TEST_DATABASE_URL) {
  const databaseUrl = requireTestDatabaseUrl(value);
  if (new URL(databaseUrl).pathname !== '/itcompass_ic010_e2e_test') {
    throw new Error('E2E requires the dedicated local schema itcompass_ic010_e2e_test.');
  }
  return databaseUrl;
}
