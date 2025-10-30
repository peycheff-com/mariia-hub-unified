import { test, expect, devices } from '@playwright/test';
import { HomePage } from './page-objects/home-page';
import { BookingWizardPage } from './page-objects/booking-wizard';
import { BeautyPage } from './page-objects/beauty-page';
import { MOBILE_VIEWPORTS, TABLET_VIEWPORTS } from './utils/test-data';
import { compareScreenshots } from './utils/visual-testing';

/**
 * Visual regression tests for the Mariia Hub application
 * Ensures UI consistency across devices and prevents unintended design changes
 */

test.describe('Visual Regression - Critical Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test('homepage visual consistency', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Take full page screenshot
    const screenshot = await homePage.takeScreenshot({ fullPage: true });

    // Compare with baseline (if exists)
    await expect(screenshot).toMatchSnapshot('homepage-full.png', {
      threshold: 0.2, // Allow 20% difference for dynamic content
      maxDiffPixels: 500
    });
  });

  test('beauty services page visual consistency', async ({ page }) => {
    const beautyPage = new BeautyPage(page);
    await beautyPage.navigateToBeauty();
    await beautyPage.waitForBeautyPageLoad();

    const screenshot = await beautyPage.takeScreenshot({ fullPage: true });

    await expect(screenshot).toMatchSnapshot('beauty-page-full.png', {
      threshold: 0.25, // Higher threshold for service cards
      maxDiffPixels: 800
    });
  });

  test('booking wizard step 1 visual consistency', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();
    await bookingWizard.waitForWizardLoad();

    const screenshot = await bookingWizard.takeScreenshot({
      fullPage: true,
      selector: '[data-testid="step-1"]'
    });

    await expect(screenshot).toMatchSnapshot('booking-step-1.png', {
      threshold: 0.15,
      maxDiffPixels: 300
    });
  });

  test('booking wizard step 2 visual consistency', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Navigate to step 2
    await bookingWizard.selectService('Brow Lamination');
    await bookingWizard.proceedToStep2();

    const screenshot = await bookingWizard.takeScreenshot({
      fullPage: true,
      selector: '[data-testid="step-2"]'
    });

    await expect(screenshot).toMatchSnapshot('booking-step-2.png', {
      threshold: 0.15,
      maxDiffPixels: 300
    });
  });

  test('booking wizard step 3 visual consistency', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Navigate to step 3
    await bookingWizard.selectService('Brow Lamination');
    await bookingWizard.proceedToStep2();
    await bookingWizard.selectDate('2024-12-15');
    await bookingWizard.selectTimeSlot('10:30');
    await bookingWizard.proceedToStep3();

    const screenshot = await bookingWizard.takeScreenshot({
      fullPage: true,
      selector: '[data-testid="step-3"]'
    });

    await expect(screenshot).toMatchSnapshot('booking-step-3.png', {
      threshold: 0.15,
      maxDiffPixels: 300
    });
  });

  test('booking wizard step 4 visual consistency', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Navigate to step 4
    await bookingWizard.selectService('Brow Lamination');
    await bookingWizard.proceedToStep2();
    await bookingWizard.selectDate('2024-12-15');
    await bookingWizard.selectTimeSlot('10:30');
    await bookingWizard.proceedToStep3();
    await bookingWizard.fillCustomerDetails({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+48 123 456 789'
    });
    await bookingWizard.acceptConsents();
    await bookingWizard.proceedToStep4();

    const screenshot = await bookingWizard.takeScreenshot({
      fullPage: true,
      selector: '[data-testid="step-4"]'
    });

    await expect(screenshot).toMatchSnapshot('booking-step-4.png', {
      threshold: 0.2, // Higher threshold for payment elements
      maxDiffPixels: 400
    });
  });
});

test.describe('Visual Regression - Responsive Design', () => {
  const viewports = [
    { name: 'Mobile-Portrait', ...MOBILE_VIEWPORTS.iPhone12 },
    { name: 'Mobile-Landscape', width: 844, height: 390 },
    { name: 'Tablet-Portrait', ...TABLET_VIEWPORTS.iPad },
    { name: 'Tablet-Landscape', width: 1024, height: 768 },
    { name: 'Desktop-HD', width: 1280, height: 720 },
    { name: 'Desktop-FHD', width: 1920, height: 1080 }
  ];

  viewports.forEach(viewport => {
    test(`homepage responsive - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const homePage = new HomePage(page);
      await homePage.navigateToHome();
      await homePage.waitForHomePageLoad();

      const screenshot = await homePage.takeScreenshot({ fullPage: true });

      await expect(screenshot).toMatchSnapshot(`homepage-${viewport.name.toLowerCase()}.png`, {
        threshold: 0.25,
        maxDiffPixels: 1000
      });
    });

    test(`booking wizard responsive - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const bookingWizard = new BookingWizardPage(page);
      await bookingWizard.navigateToBooking();
      await bookingWizard.waitForWizardLoad();

      const screenshot = await bookingWizard.takeScreenshot({ fullPage: true });

      await expect(screenshot).toMatchSnapshot(`booking-wizard-${viewport.name.toLowerCase()}.png`, {
        threshold: 0.2,
        maxDiffPixels: 800
      });
    });
  });
});

test.describe('Visual Regression - Component Level', () => {
  test('navigation component visual consistency', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Focus on navigation component
    const navScreenshot = await homePage.takeScreenshot({
      selector: 'nav, [data-testid="navigation"]'
    });

    await expect(navScreenshot).toMatchSnapshot('navigation-component.png', {
      threshold: 0.1,
      maxDiffPixels: 100
    });
  });

  test('service cards visual consistency', async ({ page }) => {
    const beautyPage = new BeautyPage(page);
    await beautyPage.navigateToBeauty();
    await beautyPage.waitForBeautyPageLoad();

    // Focus on service grid
    const serviceCardsScreenshot = await beautyPage.takeScreenshot({
      selector: '[data-testid="service-grid"], .service-grid'
    });

    await expect(serviceCardsScreenshot).toMatchSnapshot('service-cards.png', {
      threshold: 0.2,
      maxDiffPixels: 500
    });
  });

  test('hero section visual consistency', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    const heroScreenshot = await homePage.takeScreenshot({
      selector: '[data-testid="hero"], .hero'
    });

    await expect(heroScreenshot).toMatchSnapshot('hero-section.png', {
      threshold: 0.25, // Allow for background image variations
      maxDiffPixels: 800
    });
  });

  test('trust strip visual consistency', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    const trustStripScreenshot = await homePage.takeScreenshot({
      selector: '[data-testid="trust-strip"], #trust'
    });

    await expect(trustStripScreenshot).toMatchSnapshot('trust-strip.png', {
      threshold: 0.1,
      maxDiffPixels: 100
    });
  });
});

test.describe('Visual Regression - Interactive States', () => {
  test('button hover states', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Test button hover states
    const buttons = page.locator('button, .btn, a[href*="book"]');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      await button.hover();
      await page.waitForTimeout(100); // Allow hover state to apply

      const hoverScreenshot = await button.screenshot();
      await expect(hoverScreenshot).toMatchSnapshot(`button-hover-${i}.png`, {
        threshold: 0.3, // Higher threshold for hover effects
        maxDiffPixels: 50
      });

      // Move mouse away
      await page.mouse.move(0, 0);
    }
  });

  test('form field focus states', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Navigate to step 3 for form fields
    await bookingWizard.selectService('Brow Lamination');
    await bookingWizard.proceedToStep2();
    await bookingWizard.selectDate('2024-12-15');
    await bookingWizard.selectTimeSlot('10:30');
    await bookingWizard.proceedToStep3();

    // Test form field focus states
    const formFields = page.locator('input, textarea, select');
    const fieldCount = await formFields.count();

    for (let i = 0; i < Math.min(fieldCount, 3); i++) {
      const field = formFields.nth(i);
      await field.focus();
      await page.waitForTimeout(100);

      const focusScreenshot = await field.screenshot();
      await expect(focusScreenshot).toMatchSnapshot(`field-focus-${i}.png`, {
        threshold: 0.2,
        maxDiffPixels: 30
      });
    }
  });

  test('service card selected state', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Select a service
    await bookingWizard.selectService('Brow Lamination');

    const selectedCardScreenshot = await bookingWizard.takeScreenshot({
      selector: '[data-testid="service-card"].selected, .service-card.selected'
    });

    await expect(selectedCardScreenshot).toMatchSnapshot('service-card-selected.png', {
      threshold: 0.15,
      maxDiffPixels: 200
    });
  });

  test('time slot selected state', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Navigate to time selection
    await bookingWizard.selectService('Brow Lamination');
    await bookingWizard.proceedToStep2();
    await bookingWizard.selectDate('2024-12-15');
    await bookingWizard.selectTimeSlot('10:30');

    const selectedSlotScreenshot = await bookingWizard.takeScreenshot({
      selector: '[data-testid="time-slot"].selected, .time-slot.selected'
    });

    await expect(selectedSlotScreenshot).toMatchSnapshot('time-slot-selected.png', {
      threshold: 0.15,
      maxDiffPixels: 150
    });
  });
});

test.describe('Visual Regression - Dark Mode', () => {
  test('dark mode homepage visual consistency', async ({ page }) => {
    // Enable dark mode (if implemented)
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });

    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    const darkModeScreenshot = await homePage.takeScreenshot({ fullPage: true });

    await expect(darkModeScreenshot).toMatchSnapshot('homepage-dark-mode.png', {
      threshold: 0.3, // Higher threshold for dark mode
      maxDiffPixels: 1000
    });
  });

  test('dark mode booking wizard visual consistency', async ({ page }) => {
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });

    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();
    await bookingWizard.waitForWizardLoad();

    const darkModeScreenshot = await bookingWizard.takeScreenshot({ fullPage: true });

    await expect(darkModeScreenshot).toMatchSnapshot('booking-wizard-dark-mode.png', {
      threshold: 0.25,
      maxDiffPixels: 800
    });
  });
});

test.describe('Visual Regression - Content Variations', () => {
  test('homepage with different content lengths', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Test with longer content (simulate different descriptions)
    await page.evaluate(() => {
      const descriptions = document.querySelectorAll('.description, p');
      descriptions.forEach(desc => {
        if (Math.random() > 0.5) {
          desc.textContent = desc.textContent + ' ' + desc.textContent; // Double some content
        }
      });
    });

    const variedContentScreenshot = await homePage.takeScreenshot({ fullPage: true });

    await expect(variedContentScreenshot).toMatchSnapshot('homepage-varied-content.png', {
      threshold: 0.35, // High threshold for content variations
      maxDiffPixels: 1500
    });
  });

  test('beauty page with different number of services', async ({ page }) => {
    const beautyPage = new BeautyPage(page);
    await beautyPage.navigateToBeauty();
    await beautyPage.waitForBeautyPageLoad();

    // Hide some service cards to test layout with fewer items
    await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="service-card"], .service-card');
      cards.forEach((card, index) => {
        if (index > 2) { // Keep only first 3 cards visible
          (card as HTMLElement).style.display = 'none';
        }
      });
    });

    const fewerServicesScreenshot = await beautyPage.takeScreenshot({ fullPage: true });

    await expect(fewerServicesScreenshot).toMatchSnapshot('beauty-fewer-services.png', {
      threshold: 0.2,
      maxDiffPixels: 800
    });
  });
});

test.describe('Visual Regression - Error States', () => {
  test('form validation error visual consistency', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Navigate to step 3 and trigger validation errors
    await bookingWizard.selectService('Brow Lamination');
    await bookingWizard.proceedToStep2();
    await bookingWizard.selectDate('2024-12-15');
    await bookingWizard.selectTimeSlot('10:30');
    await bookingWizard.proceedToStep3();

    // Try to proceed without filling form to trigger errors
    await bookingWizard.nextButton.click();
    await page.waitForTimeout(500);

    const errorStateScreenshot = await bookingWizard.takeScreenshot({
      fullPage: true,
      selector: '[data-testid="step-3"]'
    });

    await expect(errorStateScreenshot).toMatchSnapshot('booking-validation-errors.png', {
      threshold: 0.15,
      maxDiffPixels: 300
    });
  });

  test('network error visual consistency', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Mock network error
    await page.route('**/rest/v1/**', route => route.abort());

    // Try to load services
    await page.reload();
    await page.waitForTimeout(2000);

    const errorStateScreenshot = await bookingWizard.takeScreenshot({ fullPage: true });

    await expect(errorStateScreenshot).toMatchSnapshot('network-error-state.png', {
      threshold: 0.2,
      maxDiffPixels: 400
    });
  });
});

test.describe('Visual Regression - Loading States', () => {
  test('loading spinner visual consistency', async ({ page }) => {
    // Intercept and delay API calls to show loading state
    await page.route('**/rest/v1/services**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    const beautyPage = new BeautyPage(page);
    await beautyPage.navigateToBeauty();

    // Take screenshot while loading
    const loadingScreenshot = await beautyPage.takeScreenshot({ fullPage: true });

    await expect(loadingScreenshot).toMatchSnapshot('beauty-loading-state.png', {
      threshold: 0.3, // Higher threshold for loading animations
      maxDiffPixels: 600
    });
  });
});

test.describe('Visual Regression - Micro-interactions', () => {
  test('scroll animations disabled for consistency', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Scroll to different sections
    await homePage.scrollToSection('testimonials');
    await page.waitForTimeout(500);

    const scrolledScreenshot = await homePage.takeScreenshot({ fullPage: true });

    await expect(scrolledScreenshot).toMatchSnapshot('homepage-scrolled.png', {
      threshold: 0.2,
      maxDiffPixels: 800
    });
  });

  test('modal overlay visual consistency', async ({ page }) => {
    const beautyPage = new BeautyPage(page);
    await beautyPage.navigateToBeauty();
    await beautyPage.waitForBeautyPageLoad();

    // Open service detail modal
    await beautyPage.viewServiceDetails('Brow Lamination');

    const modalScreenshot = await beautyPage.takeScreenshot({
      selector: '[data-testid="service-modal"], .modal, .overlay'
    });

    await expect(modalScreenshot).toMatchSnapshot('service-modal.png', {
      threshold: 0.15,
      maxDiffPixels: 300
    });
  });
});