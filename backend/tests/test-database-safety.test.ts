import { expect, it } from 'vitest';
import { requireTestDatabaseUrl } from '../scripts/test-database-url.mjs';

it.each([
  'mysql://test@127.0.0.1/it_compass',
  'mysql://test@127.0.0.1/mysql',
  'mysql://test@database.example.com/itcompass_ic003_test',
  'postgres://test@127.0.0.1/itcompass_ic003_test',
])('refuses an unsafe integration database before fixture cleanup: %s', (url) => {
  expect(() => requireTestDatabaseUrl(url)).toThrow('Integration tests require');
});
