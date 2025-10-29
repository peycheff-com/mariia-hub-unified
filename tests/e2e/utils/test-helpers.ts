import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500); // Additional wait for animations
  }

  // Form helpers
  async fillForm(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  async clickButton(selector: string) {
    await this.page.click(selector);
  }

  async submitForm(formSelector: string) {
    await this.page.locator(formSelector).getByRole('button', { type: 'submit' }).click();
  }

  // Booking flow helpers
  async selectService(serviceName: string) {
    await this.page.getByRole('heading', { name: serviceName }).click();
  }

  async selectTimeSlot(time: string) {
    await this.page.getByRole('button', { name: time }).click();
  }

  async fillBookingDetails(details: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }) {
    await this.page.getByLabel(/name/i).fill(details.name);
    await this.page.getByLabel(/email/i).fill(details.email);
    await this.page.getByLabel(/phone/i).fill(details.phone);
    if (details.notes) {
      await this.page.getByLabel(/notes/i).fill(details.notes);
    }
  }

  // Assertions
  async expectTextToBeVisible(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async expectElementToBeVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectUrlToContain(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  // Wait helpers
  async waitForElement(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text: string, timeout = 10000) {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  // Screenshot helpers
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  // Accessibility helpers
  async checkAccessibilityViolations() {
    // Add accessibility checking logic here if needed
    // This would require axe-playwright or similar
  }

  // Mobile-specific helpers
  async swipeUp() {
    await this.page.touchscreen.tap(0, 500);
    await this.page.touchscreen.tap(0, 200);
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  // Cookie handling
  async acceptCookies() {
    const acceptButton = this.page.getByRole('button', { name: /accept|agree/i });
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
    }
  }

  // Language switching
  async switchLanguage(lang: 'en' | 'pl') {
    await this.page.getByRole('button', { name: new RegExp(lang, 'i') }).click();
  }

  // Currency switching
  async switchCurrency(currency: 'PLN' | 'EUR' | 'USD') {
    await this.page.getByRole('button', { name: currency }).click();
  }

  // Service filtering
  async filterByCategory(category: string) {
    await this.page.getByRole('button', { name: category }).click();
  }

  // Date picker helpers
  async selectDate(date: string) {
    await this.page.getByRole('button', { name: date }).click();
  }

  // Modal helpers
  async closeModal() {
    await this.page.keyboard.press('Escape');
  }

  async waitForModalToAppear() {
    await this.page.waitForSelector('[role="dialog"]');
  }

  // Loading states
  async waitForLoadingToComplete() {
    await this.page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });
  }

  // Network helpers
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  async mockApiResponse(url: string, response: any) {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  // Error handling
  async handleErrors() {
    this.page.on('pageerror', error => {
      console.error('Page error:', error);
    });

    this.page.on('requestfailed', request => {
      console.error('Request failed:', request.url(), request.failure()?.errorText);
    });
  }
}
