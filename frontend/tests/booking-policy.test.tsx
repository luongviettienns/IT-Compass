import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingDialog } from '../src/components/mentor/BookingDialog';
import { BookingStatusBadge } from '../src/components/mentor/BookingStatusBadge';
import { bookingApi } from '../src/lib/bookingApi';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'motion/react';
import MentorAvailabilityPage from '../src/pages/mentor/MentorAvailabilityPage';

const settings = {
  minDurationMinute: 30, maxDurationMinute: 120, defaultDurationMinute: 60, durationStepMinute: 30,
  bookingNoticeHour: 2, maxAdvanceDay: 30, bufferBeforeMinute: 0, bufferAfterMinute: 0, autoConfirm: false,
};
const mentor = {
  id: '10', slug: 'mentor', name: 'Test Mentor', avatarUrl: null, title: null, bio: null, level: null,
  expertiseArea: null, expertise: [], yearsOfExperience: null, hourlyRate: null, currentSchool: null,
  currentCompany: null, currentJobTitle: null, consultationLang: null, reviewCount: 0, isVerified: true,
};

let client: QueryClient;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-12T19:30:00Z')); // 02:30 on October 13 in Vietnam.
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.spyOn(bookingApi, 'getPublicBookingConfig').mockRejectedValue(new Error('No config'));
  vi.spyOn(bookingApi, 'getPublicAvailability').mockRejectedValue(new Error('No availability'));
});
afterEach(() => { cleanup(); client.clear(); vi.useRealTimers(); });

describe('booking calendar and expiry labels', () => {
  it('uses the Vietnam calendar date for the picker across UTC midnight', () => {
    render(<QueryClientProvider client={client}><BookingDialog slug="mentor" open onOpenChange={() => {}} /></QueryClientProvider>);
    const picker = screen.getByLabelText('Ngày tư vấn') as HTMLInputElement;
    expect(picker.value).toBe('2026-10-13');
    expect(picker.min).toBe('2026-10-13');
    expect(screen.getAllByText(/Asia\/Ho_Chi_Minh/).length).toBeGreaterThan(0);
  });

  it('shows expiry instead of a pending confirmation badge', () => {
    const props = { status: 'REQUESTED' as const, requestExpired: true };
    render(<BookingStatusBadge {...props} />);
    expect(screen.queryByText(/Chờ.*xác nhận/)).toBeNull();
    expect(screen.getByText('Hết hạn xác nhận')).toBeTruthy();
  });

  it('explains automatic confirmation when the mentor has enabled it', async () => {
    vi.mocked(bookingApi.getPublicBookingConfig).mockResolvedValue({ mentor, settings: { ...settings, autoConfirm: true }, durationOptions: [60] });
    render(<QueryClientProvider client={client}><BookingDialog slug="mentor" open onOpenChange={() => {}} /></QueryClientProvider>);
    expect(await screen.findByText(/Lịch hợp lệ sẽ được tự động xác nhận/)).toBeTruthy();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Đề xuất giờ riêng.*Gửi một/ }));
    fireEvent.change(screen.getByLabelText('Giờ bắt đầu bạn muốn đề xuất'), { target: { value: '10:00' } });
    await user.click(screen.getByRole('button', { name: 'Tiếp tục xác nhận' }));
    expect(screen.getByText(/Sau khi gửi, lịch hợp lệ sẽ được tự động xác nhận/)).toBeTruthy();
  });

  it('saves the automatic-confirm checkbox as a boolean setting', async () => {
    vi.spyOn(bookingApi, 'getMentorAvailability').mockResolvedValue({ blocks: [] });
    vi.spyOn(bookingApi, 'getMentorBookingSettings').mockResolvedValue({ settings, durationOptions: [30, 60, 90, 120] });
    const save = vi.spyOn(bookingApi, 'updateMentorBookingSettings').mockResolvedValue({
      message: 'Saved', settings: { ...settings, autoConfirm: true }, durationOptions: [30, 60, 90, 120],
    });
    render(<HelmetProvider><QueryClientProvider client={client}><MotionConfig reducedMotion="always"><MentorAvailabilityPage /></MotionConfig></QueryClientProvider></HelmetProvider>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('checkbox', { name: /Tự động xác nhận/ }));
    await user.click(screen.getByRole('button', { name: 'Lưu cài đặt' }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ autoConfirm: true }));
  });
});
