import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminBookingsPage from '../src/pages/admin/AdminBookingsPage';
import { bookingApi, type BookingStatus, type MentorBooking } from '../src/lib/bookingApi';
import { createAppError } from '../src/lib/appError';

const fixture = (): MentorBooking => ({
  id: '1', status: 'REQUESTED', outcomeReviewRequired: false, requestExpired: false,
  timezone: 'Asia/Ho_Chi_Minh', responseDueAt: new Date(Date.now() + 86_400_000).toISOString(), expiredAt: null,
  requestType: 'AVAILABILITY_SLOT', date: '2099-10-12', startTime: '15:00', endTime: '16:00',
  startAt: '2099-10-12T08:00:00Z', endAt: '2099-10-12T09:00:00Z', durationMinute: 60,
  note: 'Giữ nội dung lịch khi thao tác thất bại.', cancelReason: null, cancelledBy: null, cancelledAt: null,
  confirmedAt: null, completedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  mentor: { id: '10', slug: 'mentor', name: 'Test Mentor', avatarUrl: null, title: null, bio: null,
    level: null, expertiseArea: null, expertise: [], yearsOfExperience: null, hourlyRate: null,
    currentSchool: null, currentCompany: null, currentJobTitle: null, consultationLang: null,
    reviewCount: 0, isVerified: true },
  student: { id: '20', fullName: 'Test Student', email: 'student@example.test', avatarUrl: null }, review: null,
});
let booking: MentorBooking;
let client: QueryClient;
beforeEach(() => {
  booking = fixture();
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  vi.spyOn(bookingApi, 'adminListBookings').mockImplementation(async () => ({
    bookings: [booking], pagination: { page: 1, limit: 15, total: 1, totalPages: 1 },
  }));
  vi.spyOn(bookingApi, 'adminGetBookingDetail').mockImplementation(async () => ({ booking }));
});
afterEach(() => { cleanup(); client.clear(); vi.useRealTimers(); });

const openDetails = async () => {
  const user = userEvent.setup();
  render(<HelmetProvider><QueryClientProvider client={client}><MotionConfig reducedMotion="always"><AdminBookingsPage /></MotionConfig></QueryClientProvider></HelmetProvider>);
  await user.click(await screen.findByRole('button', { name: 'Chi tiết' }));
  await screen.findByRole('heading', { name: /Chi tiết (Booking|lịch tư vấn)/ });
  return user;
};
const expectNoActions = () => {
  for (const name of ['Xác nhận', 'Hoàn thành', 'Không tham dự', 'Hủy lịch']) {
    expect(screen.queryByRole('button', { name })).toBeNull();
  }
};

describe('admin booking state and transaction UX', () => {
  it.each<BookingStatus>(['COMPLETED', 'NO_SHOW', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_MENTOR'])('%s is read only', async (status) => {
    booking = { ...booking, status };
    await openDetails();
    expectNoActions();
  });

  it('makes an expired pending request read only', async () => {
    booking = { ...booking, requestExpired: true, expiredAt: '2026-10-13T09:00:00Z' };
    await openDetails();
    expectNoActions();
  });

  it('only exposes confirmation and cancellation for a live request', async () => {
    await openDetails();
    expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hủy lịch' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Hoàn thành' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Không tham dự' })).toBeNull();
  });

  it('only allows cancellation before a confirmed session has ended', async () => {
    booking = { ...booking, status: 'CONFIRMED' };
    await openDetails();
    expect(screen.getByRole('button', { name: 'Hủy lịch' })).toBeTruthy();
    for (const name of ['Xác nhận', 'Hoàn thành', 'Không tham dự']) expect(screen.queryByRole('button', { name })).toBeNull();
  });

  it('allows reviewed outcomes after a confirmed session ends', async () => {
    booking = { ...booking, status: 'CONFIRMED', startAt: '2020-10-12T08:00:00Z', endAt: '2020-10-12T09:00:00Z', outcomeReviewRequired: true };
    await openDetails();
    expect(screen.queryByRole('button', { name: 'Xác nhận' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Hoàn thành' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Không tham dự' })).toBeTruthy();
  });

  it('does not act on the stale list record when loading detail fails', async () => {
    vi.mocked(bookingApi.adminGetBookingDetail).mockRejectedValue(new Error('Không thể tải chi tiết.'));
    await openDetails();
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('Không thể tải chi tiết.'));
    expect((screen.getByRole('button', { name: 'Xác nhận' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('keeps cancellation reason and detail on failure, then permits retry', async () => {
    const cancel = vi.spyOn(bookingApi, 'adminCancelBooking').mockRejectedValueOnce(new Error('Lỗi lưu lịch.'));
    const user = await openDetails();
    await user.click(screen.getByRole('button', { name: 'Hủy lịch' }));
    const dialog = await screen.findByRole('dialog', { name: /Hủy (booking|lịch tư vấn)/ });
    const reason = within(dialog).getByRole('textbox', { name: /Lý do/ });
    await user.type(reason, 'Lịch này cần được dời lại.');
    await user.click(within(dialog).getByRole('button', { name: /Hủy (booking|lịch tư vấn)/ }));
    expect(await within(dialog).findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('Lỗi lưu lịch.'));
    expect(reason).toHaveProperty('value', 'Lịch này cần được dời lại.');
    expect(screen.getByRole('heading', { name: /Chi tiết (Booking|lịch tư vấn)/ })).toBeTruthy();
    expect(cancel).toHaveBeenCalledOnce();
    booking = { ...booking, status: 'CANCELLED_BY_MENTOR', cancelledBy: 'SYSTEM', cancelReason: 'Lịch này cần được dời lại.', cancelledAt: new Date().toISOString() };
    cancel.mockResolvedValue({ message: 'Saved', booking });
    await waitFor(() => expect((within(dialog).getByRole('button', { name: /Hủy (booking|lịch tư vấn)/ }) as HTMLButtonElement).disabled).toBe(false));
    await user.click(within(dialog).getByRole('button', { name: /Hủy (booking|lịch tư vấn)/ }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Hủy lịch tư vấn' })).toBeNull());
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveProperty('textContent', 'Đã hủy lịch tư vấn.');
    expect(screen.getAllByText('Quản trị viên đã hủy').length).toBeGreaterThan(0);
    expectNoActions();
  });

  it('locks duplicate confirmation and closing, then keeps the updated detail visible', async () => {
    let resolveSave!: (value: { message: string; booking: MentorBooking }) => void;
    const save = vi.spyOn(bookingApi, 'adminConfirmBooking').mockImplementation(() => new Promise((resolve) => { resolveSave = resolve; }));
    const user = await openDetails();
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    const dialog = await screen.findByRole('dialog', { name: 'Xác nhận lịch tư vấn' });
    await user.click(within(dialog).getByRole('button', { name: 'Xác nhận lịch tư vấn' }));
    await waitFor(() => expect((within(dialog).getByRole('button', { name: 'Đang xử lý...' }) as HTMLButtonElement).disabled).toBe(true));
    await user.keyboard('{Escape}');
    fireEvent.click(screen.getByRole('button', { name: 'Đóng chi tiết' }));
    expect(screen.getByRole('heading', { name: /Chi tiết (Booking|lịch tư vấn)/ })).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Đang xử lý...' }));
    expect(save).toHaveBeenCalledOnce();
    booking = { ...booking, status: 'CONFIRMED', confirmedAt: '2026-10-13T09:00:00Z' };
    resolveSave({ message: 'Saved', booking });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Xác nhận lịch tư vấn' })).toBeNull());
    expect(screen.getByRole('heading', { name: /Chi tiết (Booking|lịch tư vấn)/ })).toBeTruthy();
    expect(screen.getByRole('status')).toHaveProperty('textContent', expect.stringContaining('Đã xác nhận lịch tư vấn.'));
    expect(screen.queryByRole('button', { name: 'Xác nhận' })).toBeNull();
  });

  it('defaults to the pending work queue', async () => {
    await openDetails();
    expect(bookingApi.adminListBookings).toHaveBeenCalledWith(expect.objectContaining({ status: 'REQUESTED' }));
  });

  it.each([
    ['confirm', 'Xác nhận', 'Xác nhận lịch tư vấn'] as const,
    ['complete', 'Hoàn thành', 'Xác nhận đã tư vấn'] as const,
  ])('keeps the %s review dialog and detail when the API fails', async (action, label, title) => {
    if (action === 'complete') booking = { ...booking, status: 'CONFIRMED', startAt: '2020-10-12T08:00:00Z', endAt: '2020-10-12T09:00:00Z', outcomeReviewRequired: true };
    const save = vi.spyOn(bookingApi, action === 'confirm' ? 'adminConfirmBooking' : 'adminCompleteBooking').mockRejectedValue(new Error('Không thể lưu thao tác.'));
    const user = await openDetails();
    await user.click(screen.getByRole('button', { name: label }));
    const dialog = await screen.findByRole('dialog', { name: title });
    await user.click(within(dialog).getByRole('button', { name: title }));
    expect(await within(dialog).findByRole('alert')).toHaveProperty('textContent', 'Không thể lưu thao tác.');
    expect(screen.getByRole('heading', { name: 'Chi tiết lịch tư vấn' })).toBeTruthy();
    await waitFor(() => expect((within(dialog).getByRole('button', { name: title }) as HTMLButtonElement).disabled).toBe(false));
    await user.click(within(dialog).getByRole('button', { name: title }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  });

  it('refreshes a rejected expired request and blocks replay of its obsolete action', async () => {
    const save = vi.spyOn(bookingApi, 'adminConfirmBooking').mockImplementation(async () => {
      booking = { ...booking, requestExpired: true, expiredAt: new Date().toISOString() };
      throw createAppError(new Response(null, { status: 409 }),
        { code: 'BOOKING_REQUEST_EXPIRED', message: 'Booking request has expired' }, 'Không thể lưu.');
    });
    const user = await openDetails();
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    const dialog = await screen.findByRole('dialog', { name: 'Xác nhận lịch tư vấn' });
    await user.click(within(dialog).getByRole('button', { name: 'Xác nhận lịch tư vấn' }));
    expect(await within(dialog).findByRole('alert')).toHaveProperty('textContent', 'Yêu cầu đặt lịch đã hết hạn xác nhận.');
    await waitFor(() => expect((within(dialog).getByRole('button', { name: 'Xác nhận lịch tư vấn' }) as HTMLButtonElement).disabled).toBe(true));
    await user.click(within(dialog).getByRole('button', { name: 'Xác nhận lịch tư vấn' }));
    expect(save).toHaveBeenCalledOnce();
    await user.click(within(dialog).getByRole('button', { name: 'Đóng' }));
    expectNoActions();
  });

  it('shows a failed list load as an error rather than an empty queue', async () => {
    vi.mocked(bookingApi.adminListBookings).mockRejectedValue(new Error('Không thể tải danh sách.'));
    render(<HelmetProvider><QueryClientProvider client={client}><MotionConfig reducedMotion="always"><AdminBookingsPage /></MotionConfig></QueryClientProvider></HelmetProvider>);
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('Không thể tải danh sách.'));
    expect(screen.queryByText('Không tìm thấy lịch hẹn')).toBeNull();
  });

  it('returns keyboard focus to the filter when a successful action removes the queue row', async () => {
    vi.mocked(bookingApi.adminListBookings).mockImplementation(async () => ({
      bookings: booking.status === 'REQUESTED' ? [booking] : [], pagination: { page: 1, limit: 15, total: 1, totalPages: 1 },
    }));
    vi.spyOn(bookingApi, 'adminConfirmBooking').mockImplementation(async () => {
      booking = { ...booking, status: 'CONFIRMED', confirmedAt: new Date().toISOString() };
      return { message: 'Saved', booking };
    });
    const user = await openDetails();
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    const dialog = await screen.findByRole('dialog', { name: 'Xác nhận lịch tư vấn' });
    await user.click(within(dialog).getByRole('button', { name: 'Xác nhận lịch tư vấn' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Xác nhận lịch tư vấn' })).toBeNull());
    expect(screen.getByRole('heading', { name: 'Chi tiết lịch tư vấn' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Đóng chi tiết' }));
    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Trạng thái lịch tư vấn' }));
  });

  it('does not submit after the deadline passes while the review dialog stays open', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-13T09:00:00Z'));
    booking = { ...booking, responseDueAt: '2026-10-13T09:00:01Z' };
    const save = vi.spyOn(bookingApi, 'adminConfirmBooking').mockResolvedValue({ message: 'Saved', booking });
    const user = await openDetails();
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    const dialog = await screen.findByRole('dialog', { name: 'Xác nhận lịch tư vấn' });
    vi.setSystemTime(new Date('2026-10-13T09:00:01Z'));
    await user.click(within(dialog).getByRole('button', { name: 'Xác nhận lịch tư vấn' }));
    expect(save).not.toHaveBeenCalled();
    expect(await within(dialog).findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('không còn hợp lệ'));
  });
});
