import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AdminBookingsPage from '../src/pages/admin/AdminBookingsPage';
import { bookingApi, type MentorBooking } from '../src/lib/bookingApi';

const makeBooking = (): MentorBooking & { outcomeReviewRequired: boolean } => ({
  id: '1', status: 'CONFIRMED', outcomeReviewRequired: true,
  requestType: 'AVAILABILITY_SLOT', date: '2026-10-12', startTime: '15:00', endTime: '16:00',
  startAt: '2020-10-12T08:00:00Z', endAt: '2020-10-12T09:00:00Z', durationMinute: 60,
  note: null, cancelReason: null, cancelledBy: null, cancelledAt: null,
  confirmedAt: '2020-10-11T08:00:00Z', completedAt: null,
  createdAt: '2020-10-11T08:00:00Z', updatedAt: '2020-10-11T08:00:00Z',
  student: { id: '20', fullName: 'Test Student', email: 'student@example.test', avatarUrl: null },
  mentor: {
    id: '10', slug: 'test-mentor', name: 'Test Mentor', avatarUrl: null,
    title: null, bio: null, level: null, expertiseArea: null, expertise: [],
    yearsOfExperience: null, hourlyRate: null, currentSchool: null, currentCompany: null,
    currentJobTitle: null, consultationLang: null, reviewCount: 0, isVerified: true,
  },
  review: null,
});

let booking = makeBooking();
const queryClients: QueryClient[] = [];

beforeEach(() => {
  booking = makeBooking();
  vi.spyOn(bookingApi, 'adminListBookings').mockImplementation(async () => ({
    bookings: [booking], pagination: { page: 1, limit: 15, total: 1, totalPages: 1 },
  }));
  vi.spyOn(bookingApi, 'adminGetBookingDetail').mockImplementation(async () => ({ booking }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  for (const queryClient of queryClients.splice(0)) queryClient.clear();
});

const openDetails = async () => {
  const user = userEvent.setup();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClients.push(client);
  render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MotionConfig reducedMotion="always"><AdminBookingsPage /></MotionConfig>
      </QueryClientProvider>
    </HelmetProvider>,
  );
  await user.click(await screen.findByRole('button', { name: 'Chi tiết' }));
  await screen.findByRole('heading', { name: 'Chi tiết lịch tư vấn' });
  return user;
};

describe('admin attendance review', () => {
  it('refreshes the pending outcome while a booking detail stays open', async () => {
    // Fire the registered query interval without advancing Motion's shared
    // animation clock, which would contaminate subsequent dialog exit tests.
    const intervalCallbacks: Array<() => void> = [];
    const nativeSetInterval = globalThis.setInterval;
    vi.spyOn(globalThis, 'setInterval').mockImplementation((callback, delay, ...args) => {
      if (delay === 60_000) intervalCallbacks.push(() => callback(...args));
      return nativeSetInterval(callback, delay, ...args);
    });
    booking = { ...booking, outcomeReviewRequired: false };
    await openDetails();
    expect(screen.queryByText('Chờ xác nhận kết quả')).toBeNull();
    booking = { ...booking, outcomeReviewRequired: true };
    await act(async () => { intervalCallbacks.forEach((callback) => callback()); });
    expect((await screen.findAllByText('Chờ xác nhận kết quả')).length).toBeGreaterThan(0);
    expect((screen.getByRole('button', { name: 'Không tham dự' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('explains that an ended confirmed session still needs outcome confirmation', async () => {
    await openDetails();
    expect(screen.getAllByText('Chờ xác nhận kết quả').length).toBeGreaterThan(0);
  });

  it('does not expose attendance decisions for future sessions', async () => {
    booking = { ...booking, endAt: '2099-10-12T09:00:00Z', outcomeReviewRequired: false };
    await openDetails();
    expect(screen.queryByRole('button', { name: 'Không tham dự' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Hoàn thành' })).toBeNull();
  });

  it('preserves the entered review and dialog when the API rejects the decision', async () => {
    vi.spyOn(bookingApi, 'adminMarkNoShowBooking').mockRejectedValue(new Error('Không thể lưu kết quả.'));
    const user = await openDetails();
    await user.click(screen.getByRole('button', { name: /No-show|Không tham dự/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Xác nhận không tham dự' });
    const input = within(dialog).getByRole('textbox', { name: 'Căn cứ xác nhận' });
    await user.type(input, 'Đã trao đổi với mentor và học viên.');
    await user.click(within(dialog).getByRole('button', { name: 'Xác nhận không tham dự' }));

    expect(await within(dialog).findByRole('alert')).toHaveProperty('textContent', 'Không thể lưu kết quả.');
    expect(input).toHaveProperty('value', 'Đã trao đổi với mentor và học viên.');
    expect(screen.getByRole('heading', { name: 'Chi tiết lịch tư vấn' })).toBeTruthy();
  });

  it('blocks duplicate submission and closing while saving, then displays the reviewed result', async () => {
    let finishSave!: (result: { message: string; booking: MentorBooking }) => void;
    const save = vi.spyOn(bookingApi, 'adminMarkNoShowBooking').mockImplementation(() => new Promise((resolve) => { finishSave = resolve; }));
    const user = await openDetails();
    await user.click(screen.getByRole('button', { name: /No-show|Không tham dự/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Xác nhận không tham dự' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Căn cứ xác nhận' }), '  Mentor xác nhận học viên không tham dự.  ');
    await user.click(within(dialog).getByRole('button', { name: 'Xác nhận không tham dự' }));
    await waitFor(() => expect((within(dialog).getByRole('button', { name: 'Đang xử lý...' }) as HTMLButtonElement).disabled).toBe(true));
    expect((within(dialog).getByRole('button', { name: 'Đóng' }) as HTMLButtonElement).disabled).toBe(true);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Xác nhận không tham dự' })).toBeTruthy();

    booking = { ...booking, status: 'NO_SHOW', outcomeReviewRequired: false, updatedAt: '2026-10-13T06:00:00Z' };
    finishSave({ message: 'Saved', booking });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Xác nhận không tham dự' })).toBeNull());
    expect(save).toHaveBeenCalledExactlyOnceWith('1', 'Mentor xác nhận học viên không tham dự.');
    expect(screen.getAllByText('Không tham dự').length).toBeGreaterThan(0);
    const update = screen.getByText('Cập nhật kết quả không tham dự').closest('li');
    expect(update).toHaveProperty('textContent', expect.stringContaining('13:00:00 13/10/2026'));
  });
});
