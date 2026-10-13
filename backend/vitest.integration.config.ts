import { defineConfig } from 'vitest/config';
import { requireTestDatabaseUrl } from './scripts/test-database-url.mjs';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    clearMocks: true,
    env: { DATABASE_URL: requireTestDatabaseUrl(), JWT_ACCESS_SECRET: 'ic003-integration-test-only', RATE_LIMIT_USE_REDIS: 'false' },
  },
});
