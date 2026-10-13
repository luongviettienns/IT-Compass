import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingDialog } from '../src/components/mentor/BookingDialog';
import { bookingApi } from '../src/lib/bookingApi';

let queryClient: QueryClient;
beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  // These queries fail harmlessly; the existing dialog has usable defaults and
  // a custom-time path. Only the external create transport is inspected.
  vi.spyOn(bookingApi, 'getPublicBookingConfig').mockRejectedValue(new Error('No test config'));
  vi.spyOn(bookingApi, 'getPublicAvailability').mockRejectedValue(new Error('No test availability'));
});
afterEach(() => { cleanup(); queryClient.clear(); });

const prepareRequest = async () => {
  const user = userEvent.setup();
  render(<QueryClientProvider client={queryClient}><BookingDialog slug="test-mentor" open onOpenChange={() => {}} /></QueryClientProvider>);
  await user.click(screen.getByRole('button', { name: /Đề xuất giờ riêng.*Gửi một/ }));
  fireEvent.change(screen.getByLabelText('Giờ bắt đầu bạn muốn đề xuất'), { target: { value: '10:00' } });
  await user.click(screen.getByRole('button', { name: 'Tiếp tục xác nhận' }));
  return user;
};

describe('booking request retry identity', () => {
  it('reuses the same key when an unchanged request is retried after an unknown response', async () => {
    const send = vi.spyOn(bookingApi, 'createBooking').mockRejectedValue(new Error('Response lost'));
    const user = await prepareRequest();
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu đặt lịch' }));
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    await waitFor(() => expect((screen.getByRole('button', { name: 'Gửi yêu cầu đặt lịch' }) as HTMLButtonElement).disabled).toBe(false));
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu đặt lịch' }));
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    const requests = send.mock.calls as unknown as Array<[string, unknown, string]>;
    expect(requests[0][2]).toMatch(/^[a-f0-9-]{36}$/);
    expect(requests[1][2]).toBe(requests[0][2]);
    expect(requests[1][1]).toEqual(requests[0][1]);
  });

  it('assigns a different key after the user changes the requested time', async () => {
    const send = vi.spyOn(bookingApi, 'createBooking').mockRejectedValue(new Error('Response lost'));
    const user = await prepareRequest();
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu đặt lịch' }));
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Quay lại chỉnh sửa' }));
    fireEvent.change(screen.getByLabelText('Giờ bắt đầu bạn muốn đề xuất'), { target: { value: '12:00' } });
    await user.click(screen.getByRole('button', { name: 'Tiếp tục xác nhận' }));
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu đặt lịch' }));
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    const requests = send.mock.calls as unknown as Array<[string, unknown, string]>;
    expect(requests[1][2]).toMatch(/^[a-f0-9-]{36}$/);
    expect(requests[1][2]).not.toBe(requests[0][2]);
  });
});
