import { test, expect } from '@playwright/test';

test.describe('Pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('page loads at /pricing', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /pricing/i })).toBeVisible();
  });

  test('three pricing tiers are visible', async ({ page }) => {
    await expect(page.getByText('Free')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('Enterprise')).toBeVisible();
  });

  test('monthly/annual toggle changes prices', async ({ page }) => {
    const proPrice = page.getByText('$29');
    await expect(proPrice).toBeVisible();

    const annualToggle = page.getByRole('button', { name: /toggle annual billing/i });
    await annualToggle.click();

    await expect(page.getByText('$24')).toBeVisible();
  });

  test('FAQ items are expandable', async ({ page }) => {
    const firstFaqButton = page.getByRole('button', { name: /can i cancel anytime/i });
    await expect(firstFaqButton).toBeVisible();
    await expect(firstFaqButton).toHaveAttribute('aria-expanded', 'false');

    await firstFaqButton.click();
    await expect(firstFaqButton).toHaveAttribute('aria-expanded', 'true');

    const answer = page.getByText(/you can cancel your subscription/i);
    await expect(answer).toBeVisible();
  });

  test('back to home link works', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /back to home/i });
    await expect(backLink).toBeVisible();

    await backLink.click();
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });
});
