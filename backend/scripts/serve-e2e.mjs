import { requireE2EDatabaseUrl } from './e2e-database-url.mjs';
import { seedE2E } from './seed-e2e.mjs';

// Overwrite app defaults before importing app/config. No production DB/credentials.
Object.assign(process.env, {
  DATABASE_URL: requireE2EDatabaseUrl(), NODE_ENV: 'test', PORT: '54321',
  JWT_ACCESS_SECRET: 'ic010-e2e-test-only', AUTH_DEBUG_EXPOSE_TOKENS: 'false',
  REFRESH_TOKEN_COOKIE_NAME: 'ic010_e2e_refresh', COOKIE_SECURE: 'false', COOKIE_DOMAIN: '',
  FRONTEND_URL: 'http://127.0.0.1:54322', ALLOWED_ORIGINS: 'http://127.0.0.1:54322',
  RATE_LIMIT_USE_REDIS: 'false', REDIS_URL: '', TRUSTED_PROXIES: '', METRICS_TOKEN: '',
});
await seedE2E();
await import('../src/server.ts');
