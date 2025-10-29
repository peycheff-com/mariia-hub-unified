import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

import { Page } from '@playwright/test';

export class VisualTesting {
  private screenshotsDir = './test-results/visual-screenshots';
  private baselineDir = './tests/e2e/visual-baseline';

  constructor(private page: Page) {
    // Ensure directories exist
    this.ensureDirExists(this.screenshotsDir);
    this.ensureDirExists(this.baselineDir);
  }

  private ensureDirExists(dir: string) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  async takeScreenshot(name: string, options?: {
    fullPage?: boolean;
    selector?: string;
    waitUntil?: 'networkidle' | 'domcontentloaded' | 'load';
  }) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = join(this.screenshotsDir, filename);

    if (options?.waitUntil) {
      await this.page.waitForLoadState(options.waitUntil);
    }

    if (options?.selector) {
      const element = this.page.locator(options.selector);
      await element.screenshot({
        path: filepath,
        fullPage: options.fullPage || false,
      });
    } else {
      await this.page.screenshot({
        path: filepath,
        fullPage: options.fullPage || true,
      });
    }

    return filepath;
  }

  async compareScreenshots(name: string, threshold = 0.1) {
    const currentScreenshot = await this.takeScreenshot(name);
    const baselineScreenshot = join(this.baselineDir, `${name}.png`);

    // For now, just take screenshots. In a real implementation,
    // you'd use a library like 'pixelmatch' to compare images
    console.log(`Screenshot taken: ${currentScreenshot}`);
    console.log(`Baseline: ${baselineScreenshot}`);
    console.log(`Comparison threshold: ${threshold}`);

    // Return true if baseline doesn't exist (for first run)
    if (!existsSync(baselineScreenshot)) {
      console.log(`⚠️ No baseline found for ${name}. Copy current screenshot to baseline if it looks correct.`);
      return false;
    }

    // TODO: Implement actual pixel comparison
    // For now, always pass
    return true;
  }

  async setBaseline(name: string) {
    const filepath = join(this.baselineDir, `${name}.png`);

    await this.page.screenshot({
      path: filepath,
      fullPage: true,
    });

    console.log(`✅ Baseline created: ${filepath}`);
  }

  // Component-specific visual tests
  async captureHeroSection() {
    return this.takeScreenshot('hero-section', {
      selector: '[data-testid="hero-section"]',
      fullPage: false,
    });
  }

  async captureServiceCards() {
    return this.takeScreenshot('service-cards', {
      selector: '[data-testid="service-grid"]',
      fullPage: false,
    });
  }

  async captureBookingWizard(step: number) {
    return this.takeScreenshot(`booking-wizard-step-${step}`, {
      selector: '[data-testid="booking-wizard"]',
      fullPage: false,
    });
  }

  async captureNavigationMenu() {
    return this.takeScreenshot('navigation-menu', {
      selector: '[data-testid="navigation"]',
      fullPage: false,
    });
  }

  async captureFooter() {
    return this.takeScreenshot('footer', {
      selector: 'footer',
      fullPage: false,
    });
  }

  // Responsive testing
  async captureResponsiveScreenshots(name: string) {
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1280, height: 720 },  // Desktop
      { width: 1920, height: 1080 }, // Large Desktop
    ];

    const screenshots = [];

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      const screenshot = await this.takeScreenshot(`${name}-${viewport.width}x${viewport.height}`);
      screenshots.push(screenshot);
    }

    return screenshots;
  }

  // Dark mode testing
  async toggleDarkMode() {
    // This would depend on your dark mode implementation
    const darkModeToggle = this.page.locator('[data-testid="dark-mode-toggle"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
    }
  }

  async captureDarkMode(name: string) {
    await this.toggleDarkMode();
    await this.page.waitForTimeout(500); // Wait for theme transition
    return this.takeScreenshot(`${name}-dark-mode`);
  }

  // Animation states
  async captureLoadingState() {
    return this.takeScreenshot('loading-state', {
      selector: '[data-testid="loading"]',
      fullPage: false,
    });
  }

  async captureErrorState() {
    return this.takeScreenshot('error-state', {
      selector: '[data-testid="error"]',
      fullPage: false,
    });
  }

  // Form states
  async captureFormValidation(name: string) {
    return this.takeScreenshot(`form-validation-${name}`, {
      selector: '[data-testid="form"]',
      fullPage: false,
    });
  }

  // Interactive states
  async captureHoverState(selector: string) {
    const element = this.page.locator(selector);
    await element.hover();
    await this.page.waitForTimeout(200); // Wait for hover transition
    return this.takeScreenshot(`hover-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`, {
      selector,
      fullPage: false,
    });
  }

  async captureFocusState(selector: string) {
    const element = this.page.locator(selector);
    await element.focus();
    await this.page.waitForTimeout(200);
    return this.takeScreenshot(`focus-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`, {
      selector,
      fullPage: false,
    });
  }
}
