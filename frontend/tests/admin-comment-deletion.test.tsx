import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { AdminBlogCommentsManager } from '../src/components/admin/AdminBlogCommentsModal';
import { blogApi, type BlogComment } from '../src/lib/blogApi';

const comment: BlogComment = { id: '17', content: 'Nội dung để kiểm duyệt', status: 'VISIBLE', guestName: 'Khách kiểm thử', user: null, deletedAt: null, createdAt: '2026-10-13T08:00:00Z' };
let deleted = false;
let client: QueryClient;
beforeEach(() => {
  deleted = false;
  vi.spyOn(blogApi, 'adminListComments').mockImplementation(async (query) => ({
    comments: query?.status === 'deleted' ? (deleted ? [{ ...comment, deletedAt: '2026-10-13T09:00:00Z' }] : []) : (deleted ? [] : [comment]),
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  }));
});
afterEach(() => { cleanup(); client?.clear(); vi.restoreAllMocks(); });
const mount = () => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><MotionConfig reducedMotion="always"><AdminBlogCommentsManager embedded showCloseButton={false} /></MotionConfig></QueryClientProvider>);
  return userEvent.setup();
};

describe('comment deletion', () => {
  it('keeps failed deletion open with an inline error and lets the operator retry', async () => {
    const api = vi.spyOn(blogApi, 'adminDeleteComment').mockRejectedValueOnce(new Error('Lỗi kết nối kiểm thử')).mockImplementationOnce(async () => { deleted = true; return { message: 'Deleted' }; });
    const user = mount();
    await user.click(await screen.findByTitle(/Xóa/));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Xóa bình luận' }));
    expect((await within(dialog).findByRole('alert')).textContent).toContain('Lỗi kết nối kiểm thử');
    expect(screen.getByRole('dialog')).toBe(dialog);
    await user.click(within(dialog).getByRole('button', { name: 'Xóa bình luận' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api).toHaveBeenCalledTimes(2);
    expect(api).toHaveBeenLastCalledWith('17');
    await user.click(screen.getByRole('button', { name: 'Đã xóa' }));
    await screen.findByText(comment.content);
    expect(screen.queryByTitle('Xóa bình luận')).toBeNull();
  });

  it('blocks duplicate submission and Escape while deletion is pending', async () => {
    let finish!: (value: { message: string }) => void;
    const api = vi.spyOn(blogApi, 'adminDeleteComment').mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const user = mount();
    await user.click(await screen.findByTitle(/Xóa/));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Xóa bình luận' }));
    const buttons = within(dialog).getAllByRole('button');
    expect(buttons.every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(api).toHaveBeenCalledTimes(1);
    finish({ message: 'Deleted' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
