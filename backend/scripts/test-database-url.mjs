export function requireTestDatabaseUrl(value = process.env.TEST_DATABASE_URL) {
  if (!value) throw new Error('TEST_DATABASE_URL is required for MySQL integration tests.');
  const url = new URL(value);
  if (url.protocol !== 'mysql:' || !['127.0.0.1', 'localhost'].includes(url.hostname)
      || !/^\/itcompass_[a-z0-9_]+_test$/.test(url.pathname)) {
    throw new Error('Integration tests require a local MySQL database named itcompass_*_test.');
  }
  return value;
}
