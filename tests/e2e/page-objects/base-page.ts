import { Page, Locator, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

/**
 * Base Page Object Model class for Mariia Hub E2E tests
 * Provides common functionality and utilities for all pages
 */
export abstract class BasePage {
  readonly page: Page;
  readonly navigation: NavigationComponent;
  readonly loadingOverlay: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navigation = new NavigationComponent(page);
    this.loadingOverlay = page.locator('[data-testid="loading-overlay"], .loading, .spinner');
    this.toast = page.locator('[data-testid="toast"], .toast, [role="alert"]');
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string = ''): Promise<void> {
    const url = path.startsWith('/') ? path : `/${path}`;
    await this.page.goto(url);
    await this.waitForLoadState();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoadState(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.loadingOverlay.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  /**
   * Take screenshot for visual testing
   */
  async takeScreenshot(options?: { fullPage?: boolean; selector?: string }): Promise<Buffer> {
    const screenshotOptions: any = {
      fullPage: options?.fullPage ?? false,
      animations: 'disabled'
    };

    if (options?.selector) {
      const element = this.page.locator(options.selector);
      await element.waitFor({ state: 'visible' });
      return await element.screenshot(screenshotOptions);
    }

    return await this.page.screenshot(screenshotOptions);
  }

  /**
   * Run accessibility audit
   */
  async checkAccessibility(options?: {
    context?: string | Locator;
    includeHidden?: boolean;
    rules?: any;
  }): Promise<void> {
    await injectAxe(this.page);

    const axeOptions = {
      includeHidden: options?.includeHidden ?? false,
      detailedReport: true,
      detailedReportOptions: { html: true }
    };

    const context = options?.context ? options.context : this.page;
    await checkA11y(context, undefined, {
      ...axeOptions,
      rules: options?.rules
    });
  }

  /**
   * Wait for and verify toast message
   */
  async expectToast(message: string | RegExp): Promise<void> {
    await this.toast.waitFor({ state: 'visible' });
    await expect(this.toast).toContainText(message);
  }

  /**
   * Verify current URL matches expected pattern
   */
  async expectUrl(pattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  /**
   * Verify page title
   */
  async expectTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await element.waitFor({ state: 'visible' });
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      await element.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Hover over element
   */
  async hover(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.hover();
  }

  /**
   * Focus element
   */
  async focus(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.focus();
  }

  /**
   * Type text with clear delay for realistic typing
   */
  async type(selector: string, text: string, options?: { delay?: number }): Promise<void> {
    const element = this.page.locator(selector);
    await element.clear();
    await element.type(text, { delay: options?.delay ?? 50 });
  }

  /**
   * Fill form field
   */
  async fill(selector: string, value: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.fill(value);
  }

  /**
   * Click element and wait for navigation if needed
   */
  async clickAndWait(selector: string, options?: { waitForNavigation?: boolean }): Promise<void> {
    const element = this.page.locator(selector);

    if (options?.waitForNavigation) {
      await Promise.all([
        this.page.waitForLoadState('networkidle'),
        element.click()
      ]);
    } else {
      await element.click();
    }
  }

  /**
   * Mobile-specific interactions
   */
  async tap(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.tap();
  }

  /**
   * Swipe gesture for mobile
   */
  async swipe(startX: number, startY: number, endX: number, endY: number): Promise<void> {
    await this.page.touchscreen.tap(startX, startY);
    await this.page.touchscreen.move(endX, endY);
    await this.page.touchscreen.tap(endX, endY);
  }

  /**
   * Wait for API call to complete
   */
  async waitForNetworkResponse(urlPattern: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForResponse(urlPattern, { timeout });
  }

  /**
   * Get element text content
   */
  async getText(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    return await element.textContent() || '';
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return await element.count() > 0;
  }

  /**
   * Select dropdown option
   */
  async selectOption(selector: string, value: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.selectOption(value);
  }

  /**
   * Check checkbox
   */
  async check(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.check();
  }

  /**
   * Uncheck checkbox
   */
  async uncheck(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.uncheck();
  }

  /**
   * Upload file
   */
  async uploadFile(selector: string, filePath: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.setInputFiles(filePath);
  }

  /**
   * Press keyboard key
   */
  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Wait for element to be enabled
   */
  async waitForElementEnabled(selector: string, timeout: number = 5000): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'enabled', timeout });
  }

  /**
   * Get element attribute
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    const element = this.page.locator(selector);
    return await element.getAttribute(attribute);
  }

  /**
   * Verify CSS property
   */
  async expectCssProperty(selector: string, property: string, value: string): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element).toHaveCSS(property, value);
  }
}

/**
 * Navigation component POM
 */
export class NavigationComponent {
  readonly page: Page;
  readonly nav: Locator;
  readonly beautyLink: Locator;
  readonly fitnessLink: Locator;
  readonly bookButton: Locator;
  readonly mobileMenuButton: Locator;
  readonly mobileMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = page.locator('nav, [data-testid="navigation"]');
    this.beautyLink = page.locator('a[href*="beauty"], nav a:has-text("Beauty"), button:has-text("Beauty")');
    this.fitnessLink = page.locator('a[href*="fitness"], nav a:has-text("Fitness"), button:has-text("Fitness")');
    this.bookButton = page.locator('a[href*="book"], [data-testid="book-button"], button:has-text("Book")');
    this.mobileMenuButton = page.locator('[data-testid="mobile-menu-button"], .mobile-menu-button, button[aria-label="menu"]');
    this.mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu');
  }

  async clickBeautyLink(): Promise<void> {
    await this.beautyLink.click();
  }

  async clickFitnessLink(): Promise<void> {
    await this.fitnessLink.click();
  }

  async clickBookButton(): Promise<void> {
    await this.bookButton.click();
  }

  async openMobileMenu(): Promise<void> {
    if (await this.mobileMenuButton.isVisible()) {
      await this.mobileMenuButton.click();
      await this.mobileMenu.waitFor({ state: 'visible' });
    }
  }

  async closeMobileMenu(): Promise<void> {
    if (await this.mobileMenu.isVisible()) {
      await this.mobileMenuButton.click();
      await this.mobileMenu.waitFor({ state: 'hidden' });
    }
  }

  async verifyNavigationVisible(): Promise<void> {
    await expect(this.nav).toBeVisible();
  }
}