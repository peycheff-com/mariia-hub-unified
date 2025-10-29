import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Mariia Hub/i);
  });

  test('loads hero section', async ({ page }) => {
    await expect(page.locator('section.hero')).toBeVisible();
  });

  test('has navigation menu', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });

  test('has CTA buttons', async ({ page }) => {
    const bookButton = page.locator('a', { hasText: 'Book Now' });
    await expect(bookButton).toBeVisible();

    const learnButton = page.locator('a', { hasText: 'Learn More' });
    await expect(learnButton).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    // Test beauty link
    await page.click('nav a', { hasText: 'Beauty' });
    await expect(page).toHaveURL(/beauty/);
    await page.goBack();

    // Test fitness link
    await page.click('nav a', { hasText: 'Fitness' });
    await expect(page).toHaveURL(/fitness/);
    await page.goBack();
  });

  test('is responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('.hamburger-menu')).toBeVisible(); // Update with actual selector

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('nav')).toBeVisible();
  });

  test('language switching works', async ({ page }) => {
    // Check for language switcher (update selector as needed)
    const langSwitcher = page.locator('.language-switcher'); // Update with actual selector
    if (await langSwitcher.count() > 0) {
      await langSwitcher.click();
      await page.click('text=Polish');
      await expect(page).toHaveURL(/\/pl/);
    }
  });

  test('has proper metadata', async ({ page }) => {
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content');
    await expect(await description.getAttribute('content')).toContain('beauty');
    await expect(await description.getAttribute('content')).toContain('fitness');
  });
});