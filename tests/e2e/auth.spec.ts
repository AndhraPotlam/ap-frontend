import { test, expect } from '@playwright/test';

test.describe('Auth E2E Tests', () => {
  test('should load login page and show validation errors on empty submit', async ({ page }) => {
    await page.goto('auth/login');

    // Confirm heading is present
    await expect(page.getByText('Sign in to your account', { exact: true })).toBeVisible();

    // Click submit button
    await page.click('button[type="submit"]');

    // Should display validation error
    await expect(page.getByText('Please fill in all fields')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('auth/login');

    // Fill in invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');

    // Click submit
    await page.click('button[type="submit"]');

    // Should display validation error
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });
});
