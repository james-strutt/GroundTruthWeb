import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with title containing GroundTruth', async ({ page }) => {
    await expect(page).toHaveTitle(/GroundTruth/);
  });

  test('navigation links are visible', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav.getByText('Features')).toBeVisible();
    await expect(nav.getByText('How it works')).toBeVisible();
    await expect(nav.getByText('Pricing')).toBeVisible();
    await expect(nav.getByText('Sign in')).toBeVisible();
  });

  test('feature tabs are clickable and switch content', async ({ page }) => {
    const tabList = page.getByRole('tablist', { name: 'Feature modes' });
    await expect(tabList).toBeVisible();

    const snapTab = tabList.getByRole('tab', { name: 'Snap' });
    await expect(snapTab).toHaveAttribute('aria-selected', 'true');

    const inspectTab = tabList.getByRole('tab', { name: 'Inspect' });
    await inspectTab.click();
    await expect(inspectTab).toHaveAttribute('aria-selected', 'true');
    await expect(snapTab).toHaveAttribute('aria-selected', 'false');

    const panel = page.getByRole('tabpanel');
    await expect(panel).toBeVisible();
  });

  test('waitlist form is visible and accepts email input', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');

    const submitButton = page.getByRole('button', { name: /join the waitlist/i }).first();
    await expect(submitButton).toBeVisible();
  });

  test('mobile hamburger menu works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const hamburger = page.getByRole('button', { name: /open menu/i });
    await expect(hamburger).toBeVisible();

    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    const mobileMenu = page.getByText('Get early access');
    await expect(mobileMenu).toBeVisible();
  });

  test('footer links to Privacy, Terms, and Pricing', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    await expect(footer.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
    await expect(footer.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
  });
});
