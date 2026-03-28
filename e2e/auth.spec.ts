import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('login page loads at /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('email and password inputs are visible', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByPlaceholder('Email');
    const passwordInput = page.getByPlaceholder('Password');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('sign-up toggle switches form mode', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    const toggleButton = page.getByRole('button', { name: 'Sign up' });
    await toggleButton.click();

    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  });

  test('visiting /app without auth redirects to /login', async ({ page }) => {
    await page.goto('/app');
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });

  test('Google OAuth button is present', async ({ page }) => {
    await page.goto('/login');

    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
  });
});
