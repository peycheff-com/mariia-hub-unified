import { test, expect } from '@playwright/test';

test.describe('Booking flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('can start booking process', async ({ page }) => {
    // Click on a book button
    await page.click('a', { hasText: 'Book Now' });

    // Should be on booking page
    await expect(page).toHaveURL(/booking/);
    await expect(page.locator('h1')).toContainText('Book');
  });

  test('beauty service selection', async ({ page }) => {
    await page.goto('/beauty');

    // Click on a service
    await page.click('.service-card:first-child');

    // Should navigate to service detail
    await expect(page.locator('h1')).toBeVisible();
  });

  test('fitness program selection', async ({ page }) => {
    await page.goto('/fitness');

    // Click on a program
    await page.click('.program-card:first-child');

    // Should navigate to program detail
    await expect(page.locator('h1')).toBeVisible();
  });

  test('booking wizard steps', async ({ page }) => {
    // Start booking
    await page.goto('/booking');

    // Check for booking steps
    await expect(page.locator('[data-testid="booking-step-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-step-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-step-3"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-step-4"]')).toBeVisible();
  });

  test('form validation works', async ({ page }) => {
    // This would test form validation
    // Implementation depends on actual form structure
    await page.goto('/booking');

    // Try to submit without required fields
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await expect(page.locator('text=required')).toBeVisible();
    }
  });
});