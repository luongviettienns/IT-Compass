import { describe, expect, it } from 'vitest';
import { requireE2EDatabaseUrl } from '../scripts/e2e-database-url.mjs';

describe('dedicated E2E database guard', () => {
  it('accepts only the dedicated local E2E schema', () => {
    const url = 'mysql://root:test@127.0.0.1:3306/itcompass_ic010_e2e_test';
    expect(requireE2EDatabaseUrl(url)).toBe(url);
  });
  it.each([undefined, 'mysql://root:test@127.0.0.1:3306/itcompass',
    'mysql://root:test@127.0.0.1:3306/itcompass_ic003_test',
    'mysql://root:test@database.example:3306/itcompass_ic010_e2e_test',
    'postgres://root:test@localhost:5432/itcompass_ic010_e2e_test'])('rejects unsafe or shared target %s', (value) => {
    expect(() => requireE2EDatabaseUrl(value ?? '')).toThrow();
  });
});
