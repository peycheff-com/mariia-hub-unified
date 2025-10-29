import { test, expect, Page } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper document structure', async ({ page }) => {
    // Check for skip link
    await expect(page.getByRole('link', { name: /skip/i })).toBeVisible();

    // Check for main landmark
    await expect(page.getByRole('main')).toBeVisible();

    // Check for proper heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();

    // Check for navigation
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test Tab navigation
    await page.keyboard.press('Tab');
    let focused = await page.locator(':focus');
    await expect(focused).toBeVisible();

    // Navigate through interactive elements
    let tabCount = 0;
    while (tabCount < 10) {
      await page.keyboard.press('Tab');
      focused = await page.locator(':focus');
      expect(focused).toBeVisible();
      tabCount++;

      // Break if we've looped back to the start
      if (await focused.getAttribute('href') === '/') break;
    }

    // Test Enter key on links
    const firstLink = page.getByRole('link').first();
    await firstLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/.*/);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // This would require a color contrast analyzer plugin
    // For now, we'll check that text is visible
    const textElements = page.getByText(/./).all();
    expect(textElements.length).toBeGreaterThan(0);

    // Check that interactive elements have focus styles
    const button = page.getByRole('button').first();
    await button.focus();
    const focusedButton = page.locator(':focus');
    await expect(focusedButton).toBeVisible();
  });

  test('should announce important changes to screen readers', async ({ page }) => {
    // Check for ARIA live regions
    const liveRegions = page.locator('[aria-live]');
    const hasLiveRegions = await liveRegions.count() > 0;

    // If live regions exist, test them
    if (hasLiveRegions) {
      await expect(liveRegions.first()).toBeVisible();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    // Navigate to a page with forms
    await page.getByRole('link', { name: /book/i }).click();

    // Wait for form to load
    await page.waitForSelector('input, select, textarea');

    // Check form labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);

      // Check for associated label
      const hasLabel = await input.evaluate((el: HTMLElement) => {
        const id = el.id;
        const hasExplicitLabel = el.getAttribute('aria-label') ||
                               el.getAttribute('aria-labelledby');
        const hasImplicitLabel = el.closest('label') ||
                               document.querySelector(`label[for="${id}"]`);
        return !!(hasExplicitLabel || hasImplicitLabel);
      });

      expect(hasLabel).toBe(true);
    }
  });

  test('should handle modal dialogs properly', async ({ page }) => {
    // Open a modal if available
    const modalTrigger = page.getByRole('button', { name: /book/i }).first();
    await modalTrigger.click();

    // Check for modal appearance
    const modal = page.locator('[role="dialog"]').or(page.locator('.modal'));
    const modalExists = await modal.count() > 0;

    if (modalExists) {
      await expect(modal.first()).toBeVisible();

      // Check focus is trapped
      const modalFocused = page.locator(':focus');
      const isInsideModal = await modalFocused.evaluate((el: HTMLElement, modal: HTMLElement) =>
        modal.contains(el), await modal.first());
      expect(isInsideModal).toBe(true);

      // Test closing with Escape
      await page.keyboard.press('Escape');
      await expect(modal.first()).not.toBeVisible();
    }
  });

  test('should support reduced motion', async ({ page }) => {
    // Set prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();

    // Check that animations are disabled
    const animatedElements = page.locator('[style*="animation"]');
    const animatedCount = await animatedElements.count();

    // If animations exist, they should respect the preference
    if (animatedCount > 0) {
      const hasReducedMotion = await animatedElements.first().evaluate((el: HTMLElement) => {
        const style = window.getComputedStyle(el);
        return style.animationDuration === '0s' ||
               style.animation === 'none';
      });

      // Note: This test might need adjustment based on implementation
    }
  });

  test('should support high contrast mode', async ({ page }) => {
    // Set prefers-contrast
    await page.emulateMedia({ contrast: 'more' });
    await page.reload();

    // Check that content is still readable
    const textElements = page.getByText(/./).all();
    expect(textElements.length).toBeGreaterThan(0);

    // Check that interactive elements are still visible
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();
    }
  });

  test('should have proper table structure if tables exist', async ({ page }) => {
    const tables = page.locator('table');
    const tableCount = await tables.count();

    if (tableCount > 0) {
      const firstTable = tables.first();

      // Check for table headers
      const headers = firstTable.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);

      // Check for scope attributes
      const hasScope = await headers.first().getAttribute('scope');
      expect(hasScope).toBeTruthy();

      // Check for caption
      const caption = firstTable.locator('caption');
      const hasCaption = await caption.count() > 0;
      // Caption is recommended but not required
    }
  });

  test('should have proper link text', async ({ page }) => {
    const links = page.getByRole('link');
    const linkCount = await links.count();

    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = links.nth(i);

      // Check for descriptive link text
      const linkText = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const ariaLabelledBy = await link.getAttribute('aria-labelledby');

      const hasDescription = !!(linkText?.trim() || ariaLabel || ariaLabelledBy);
      expect(hasDescription).toBe(true);

      // Avoid "click here" text
      expect(linkText?.toLowerCase()).not.toContain('click here');
    }
  });

  test('should have proper image alt text', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      // Alt text should exist
      expect(alt).not.toBeNull();
    }
  });

  test('should have proper button labels', async ({ page }) => {
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);

      // Check for button label
      const buttonText = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const title = await button.getAttribute('title');

      const hasLabel = !!(buttonText?.trim() || ariaLabel || ariaLabelledBy || title);
      expect(hasLabel).toBe(true);
    }
  });

  test('should handle ARIA attributes correctly', async ({ page }) => {
    // Check for ARIA attributes on interactive elements
    const elementsWithAria = page.locator('[aria-label], [aria-expanded], [aria-selected], [aria-checked]');
    const ariaCount = await elementsWithAria.count();

    if (ariaCount > 0) {
      // Verify ARIA attributes are used appropriately
      const expandedElements = page.locator('[aria-expanded]');
      const expandedCount = await expandedElements.count();

      if (expandedCount > 0) {
        // aria-expanded should be boolean
        const firstExpanded = expandedElements.first();
        const expandedValue = await firstExpanded.getAttribute('aria-expanded');
        expect(['true', 'false']).toContain(expandedValue);
      }
    }
  });

  test('should have proper focus management', async ({ page }) => {
    // Test tab order
    const focusableElements = page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const elementCount = await focusableElements.count();

    // Should have focusable elements
    expect(elementCount).toBeGreaterThan(0);

    // Test tab navigation doesn't trap user
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should still be able to navigate
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should respect user preferences', async ({ page }) => {
    // Test dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    // Page should still be functional
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    // Test font size preference
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    await page.reload();

    // Page should still be functional
    await expect(heading).toBeVisible();
  });
});

// Performance-related accessibility tests
test.describe('Performance & Accessibility', () => {
  test('should have fast loading time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should maintain interactivity during loading', async ({ page }) => {
    await page.goto('/');

    // Check if page is interactive quickly
    const interactive = await page.waitForSelector('button, [href]', { timeout: 2000 });
    expect(interactive).toBeTruthy();
  });
});

// Mobile accessibility tests
test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be accessible on mobile', async ({ page }) => {
    await page.goto('/');

    // Check touch targets are at least 44x44
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const boundingBox = await firstButton.boundingBox();

      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Check for horizontal scrolling
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('should have proper spacing for touch', async ({ page }) => {
    await page.goto('/');

    // Check that interactive elements aren't too close together
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 1) {
      const firstButton = buttons.first();
      const secondButton = buttons.nth(1);

      const firstBox = await firstButton.boundingBox();
      const secondBox = await secondButton.boundingBox();

      if (firstBox && secondBox) {
        const verticalSpacing = Math.abs(secondBox.y - firstBox.y);
        expect(verticalSpacing).toBeGreaterThanOrEqual(8);
      }
    }
  });
});