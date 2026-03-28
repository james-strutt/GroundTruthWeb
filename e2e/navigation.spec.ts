import { test, expect } from '@playwright/test';

test.describe('App navigation (unauthenticated)', () => {
  test('/app redirects to /login for unauthenticated users', async ({ page }) => {
    await page.goto('/app');
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });

  test('/app/snaps redirects to /login for unauthenticated users', async ({ page }) => {
    await page.goto('/app/snaps');
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });

  test('/app/inspections redirects to /login for unauthenticated users', async ({ page }) => {
    await page.goto('/app/inspections');
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page has link back to landing page', async ({ page }) => {
    await page.goto('/login');

    const brandLink = page.getByRole('link', { name: 'GroundTruth' });
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toHaveAttribute('href', '/');
  });
});
