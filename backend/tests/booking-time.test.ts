import { describe, expect, it } from 'vitest';
import { formatDate, formatTime, parseDateBoundary, parseLocalDateTime } from '../src/services/booking-time.js';

describe('Vietnam booking calendar boundaries', () => {
  it('keeps midnight and weekday independent from the host timezone', () => {
    const result = parseLocalDateTime({ date: '2026-10-13', startTime: '00:00', durationMinute: 60 });
    expect(result).toMatchObject({ startAt: new Date('2026-10-12T17:00:00Z'), endAt: new Date('2026-10-12T18:00:00Z'), weekday: 2 });
    expect(formatDate(new Date('2026-10-12T19:30:00Z'))).toBe('2026-10-13');
    expect(formatTime(new Date('2026-10-12T19:30:00Z'))).toBe('02:30');
  });
  it('uses business-day boundaries for inclusive date filters', () => {
    expect(parseDateBoundary('2026-10-13', 'start')).toEqual(new Date('2026-10-12T17:00:00Z'));
    expect(parseDateBoundary('2026-10-13', 'end')).toEqual(new Date('2026-10-13T17:00:00Z'));
  });
  it.each(['2026-02-29', '2026-04-31', '2026-13-01'])('rejects the invalid calendar day %s', (date) => {
    expect(() => parseLocalDateTime({ date, startTime: '10:00', durationMinute: 60 })).toThrow('Invalid booking date');
  });
  it('permits ending exactly at midnight but rejects crossing the selected day', () => {
    expect(parseLocalDateTime({ date: '2026-10-13', startTime: '23:00', durationMinute: 60 }).endAt).toEqual(new Date('2026-10-13T17:00:00Z'));
    expect(() => parseLocalDateTime({ date: '2026-10-13', startTime: '23:30', durationMinute: 60 })).toThrow('Booking must end within the selected date');
  });
});
