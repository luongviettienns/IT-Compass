import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, role: 'student' | 'mentor' | 'admin', target: string) {
  await page.goto(`/auth/login?redirect=${encodeURIComponent(target)}`);
  await page.getByLabel('Email', { exact: true }).fill(`ic010-${role}@example.test`);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('IC010-e2e-password!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${target.replaceAll('/', '\\/')}$`));
}

test('guest must log in before opening student bookings', async ({ page }) => {
  await page.goto('/bookings');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});

test('student cancels own request and sees persisted cancellation after refresh', async ({ page }) => {
  await login(page, 'student', '/bookings');
  await page.getByRole('button', { name: 'Hủy lịch', exact: true }).click();
  await page.getByLabel('Lý do hủy', { exact: true }).fill('IC010 thay đổi thời gian học');
  await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
  await expect(page.getByText('Đã hủy lịch tư vấn.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('IC010 thay đổi thời gian học', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy lịch', exact: true })).toHaveCount(0);
});

test('mentor saves booking notice and reads it back after refresh', async ({ page }) => {
  await login(page, 'mentor', '/mentor/availability');
  const notice = page.getByLabel('Báo trước (giờ)', { exact: true });
  await expect(notice).toHaveValue('2');
  await notice.fill('3');
  await page.getByRole('button', { name: 'Lưu cài đặt', exact: true }).click();
  await expect(page.getByText('Đã lưu cài đặt đặt lịch.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(notice).toHaveValue('3');
  await page.goto('/admin/bookings');
  await expect(page).toHaveURL('http://127.0.0.1:54322/');
});

test('admin confirms a request and sees persisted confirmed detail after refresh', async ({ page }) => {
  await login(page, 'admin', '/admin/bookings');
  const row = page.getByRole('row').filter({ hasText: 'ic010-confirmation@example.test' });
  await row.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận lịch tư vấn', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã xác nhận lịch tư vấn.' })).toBeVisible();
  await page.reload();
  // Default queue filters REQUESTED; choose confirmed to read the persisted result.
  await page.getByLabel('Trạng thái lịch tư vấn', { exact: true }).selectOption('CONFIRMED');
  await expect(row).toContainText('Đã xác nhận');
  await row.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Xác nhận', exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog').getByText('Mã lịch: 910202', { exact: true })).toBeVisible();
});
