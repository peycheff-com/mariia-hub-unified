import { test, expect, devices } from '@playwright/test';
import { HomePage } from './page-objects/home-page';
import { BookingWizardPage } from './page-objects/booking-wizard';
import { BeautyPage } from './page-objects/beauty-page';
import { BOOKING_SCENARIOS, MOBILE_VIEWPORTS, TABLET_VIEWPORTS } from './utils/test-data';

/**
 * Comprehensive E2E tests for the complete 4-step booking flow
 * Tests both happy path and edge cases across devices
 */

test.describe('Complete Booking Flow - Happy Path', () => {
  let homePage: HomePage;
  let bookingWizard: BookingWizardPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    bookingWizard = new BookingWizardPage(page);
  });

  test('complete beauty service booking from homepage', async ({ page }) => {
    // Navigate to homepage
    await homePage.navigateToHome();
    await expect(homePage.page).toHaveTitle(/Mariia|Beauty/i);

    // Navigate to beauty section
    await homePage.navigateToBeauty();
    await expect(page).toHaveURL(/beauty/);

    // Click on a service to start booking
    const beautyPage = new BeautyPage(page);
    await beautyPage.waitForBeautyPageLoad();

    // Select a service
    await beautyPage.viewServiceDetails('Brow Lamination');

    // Book the service
    await beautyPage.bookService();
    await expect(page).toHaveURL(/book/);

    // Complete the booking flow
    await completeBookingFlow(bookingWizard, BOOKING_SCENARIOS.polishBeautyBooking);

    // Verify booking confirmation
    await expect(page).toHaveURL(/success|confirmation/);
    await expect(page.locator('h1, [data-testid="confirmation-title"]')).toContainText(/booking|confirmation|success/i);
  });

  test('complete fitness service booking direct from wizard', async ({ page }) => {
    // Navigate directly to booking wizard
    await bookingWizard.navigateToBooking();
    await bookingWizard.waitForWizardLoad();

    // Complete fitness booking flow
    await completeBookingFlow(bookingWizard, BOOKING_SCENARIOS.internationalFitnessBooking);

    // Verify booking confirmation
    await expect(page).toHaveURL(/success|confirmation/);
    await expect(page.locator('[data-testid="booking-summary"], .booking-summary')).toContainText('Glute Sculpting Program');
  });

  test('booking flow with mobile device interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone12);

    // Navigate to homepage
    await homePage.navigateToHome();

    // Test mobile navigation
    await homePage.navigation.openMobileMenu();
    await homePage.navigation.clickBeautyLink();
    await homePage.navigation.closeMobileMenu();

    // Start booking from mobile
    const beautyPage = new BeautyPage(page);
    await beautyPage.waitForBeautyPageLoad();

    // Select service with mobile interactions
    await beautyPage.tap('[data-testid="service-card"]:has-text("Brow")');

    // Book using mobile interactions
    await beautyPage.bookService();

    // Complete booking flow with mobile-friendly interactions
    await completeMobileBookingFlow(bookingWizard, BOOKING_SCENARIOS.polishBeautyBooking);

    // Verify mobile confirmation
    await expect(page).toHaveURL(/success|confirmation/);
  });
});

test.describe('Complete Booking Flow - Cross-Device', () => {
  const devices = [
    { name: 'Desktop', ...devices['Desktop Chrome'] },
    { name: 'Tablet', ...TABLET_VIEWPORTS.iPad },
    { name: 'Mobile', ...MOBILE_VIEWPORTS.Pixel5 }
  ];

  devices.forEach(device => {
    test(`booking flow on ${device.name}`, async ({ page }) => {
      // Set device viewport
      await page.setViewportSize({ width: device.width, height: device.height });

      const bookingWizard = new BookingWizardPage(page);
      await bookingWizard.navigateToBooking();

      // Complete booking flow
      await completeBookingFlow(bookingWizard, BOOKING_SCENARIOS.polishBeautyBooking);

      // Verify success
      await expect(page).toHaveURL(/success|confirmation/);
    });
  });
});

test.describe('Complete Booking Flow - Payment Scenarios', () => {
  test('successful payment with Visa card', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    await completeBookingFlow(bookingWizard, BOOKING_SCENARIOS.polishBeautyBooking);

    // Verify payment success
    await expect(page.locator('[data-testid="payment-success"], .payment-success')).toBeVisible();
    await expect(page.locator('[data-testid="booking-confirmation"], .booking-confirmation')).toContainText('confirmed');
  });

  test('handle declined payment gracefully', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Complete booking up to payment
    await completeBookingFlow(bookingWizard, {
      ...BOOKING_SCENARIOS.polishBeautyBooking,
      payment: { number: '4000000000000002', exp_month: '12', exp_year: '25', cvc: '123', name: 'Test User' }
    });

    // Verify payment decline handling
    await expect(page.locator('[data-testid="payment-error"], .payment-error')).toBeVisible();
    await expect(page.locator('text=/payment declined|card declined|payment failed/i')).toBeVisible();

    // Should stay on payment step to retry
    const currentStep = await bookingWizard.getCurrentStep();
    expect(currentStep).toBe(4);
  });
});

test.describe('Complete Booking Flow - Accessibility', () => {
  test('booking flow is keyboard accessible', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Test keyboard navigation through all steps
    await testKeyboardNavigation(bookingWizard, BOOKING_SCENARIOS.polishBeautyBooking);

    // Verify completion
    await expect(page).toHaveURL(/success|confirmation/);
  });

  test('booking flow meets WCAG AA standards', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Run accessibility audit on each step
    for (let step = 1; step <= 4; step++) {
      await bookingWizard.checkAccessibility({
        context: `[data-testid="step-${step}"]`
      });

      // Move to next step if not on step 4
      if (step < 4) {
        await bookingWizard.nextButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('screen reader compatibility', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Check for proper ARIA labels and announcements
    await verifyScreenReaderSupport(bookingWizard);
  });
});

test.describe('Complete Booking Flow - Performance', () => {
  test('booking flow meets performance benchmarks', async ({ page }) => {
    const startTime = Date.now();

    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Measure load time for each step
    const stepLoadTimes: number[] = [];

    for (let step = 1; step <= 4; step++) {
      const stepStart = Date.now();
      await bookingWizard.page.waitForLoadState('networkidle');
      stepLoadTimes.push(Date.now() - stepStart);

      if (step < 4) {
        await bookingWizard.nextButton.click();
      }
    }

    const totalTime = Date.now() - startTime;

    // Performance assertions
    expect(totalTime).toBeLessThan(30000); // Complete flow under 30 seconds
    stepLoadTimes.forEach(loadTime => {
      expect(loadTime).toBeLessThan(5000); // Each step loads under 5 seconds
    });
  });

  test('images load properly during booking', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Check that service images load
    const images = page.locator('img');
    const count = await images.count();

    let loadedImages = 0;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      if (naturalWidth > 0) loadedImages++;
    }

    expect(loadedImages).toBeGreaterThan(0);
  });
});

test.describe('Complete Booking Flow - Error Handling', () => {
  test('handle network failures gracefully', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Mock network failure
    await page.route('**/rest/v1/**', route => route.abort());

    // Try to proceed through booking
    await bookingWizard.selectService('Brow Lamination');
    await bookingWizard.nextButton.click();

    // Should show error message
    await expect(page.locator('[data-testid="error-message"], .error, [role="alert"]')).toBeVisible();
    await expect(page.locator('text=/network|connection|error/i')).toBeVisible();
  });

  test('handle form validation errors', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Skip to details step
    await bookingWizard.selectService('Brow Lamination');
    await bookingWizard.proceedToStep2();
    await bookingWizard.selectDate('2024-12-15');
    await bookingWizard.selectTimeSlot('10:30');
    await bookingWizard.proceedToStep3();

    // Try to proceed with empty form
    await bookingWizard.nextButton.click();

    // Should show validation errors
    const validationErrors = page.locator('[data-testid="validation-error"], .error-message, .field-error');
    await expect(validationErrors.first()).toBeVisible();

    // Check for required field errors
    await expect(page.locator('text=/required|mandatory|fill in/i')).toBeVisible();
  });

  test('handle time slot conflicts', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Select service and date
    await bookingWizard.selectService('Brow Lamination');
    await bookingWizard.proceedToStep2();
    await bookingWizard.selectDate('2024-12-15');

    // Try to select an unavailable time slot
    await bookingWizard.page.locator('[data-testid="time-slot"]:has-text("unavailable")').first().click();

    // Should show unavailable message
    await expect(page.locator('[data-testid="unavailable-message"], .unavailable')).toBeVisible();
    await expect(page.locator('text=/not available|already booked|unavailable/i')).toBeVisible();
  });
});

test.describe('Complete Booking Flow - Internationalization', () => {
  test('booking flow works in Polish', async ({ page }) => {
    // Set language to Polish
    await page.goto('/?lang=pl');

    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Complete booking flow with Polish data
    await completeBookingFlow(bookingWizard, BOOKING_SCENARIOS.polishBeautyBooking);

    // Verify Polish success message
    await expect(page.locator('text=/rezerwacja|potwierdzenie|sukces/i')).toBeVisible();
  });

  test('booking flow works in English', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();

    // Complete booking flow with English data
    await completeBookingFlow(bookingWizard, BOOKING_SCENARIOS.internationalFitnessBooking);

    // Verify English success message
    await expect(page.locator('text=/booking|confirmation|success/i')).toBeVisible();
  });
});

/**
 * Helper function to complete a full booking flow
 */
async function completeBookingFlow(bookingWizard: BookingWizardPage, scenario: any): Promise<void> {
  // Step 1: Select service
  await bookingWizard.selectService(scenario.serviceName);
  await bookingWizard.proceedToStep2();

  // Step 2: Select date and time
  await bookingWizard.selectDate(scenario.date);
  await bookingWizard.selectTimeSlot(scenario.time);
  await bookingWizard.proceedToStep3();

  // Step 3: Fill customer details
  await bookingWizard.fillCustomerDetails(scenario.customer);
  await bookingWizard.acceptConsents();
  await bookingWizard.proceedToStep4();

  // Step 4: Payment (if payment info provided)
  if (scenario.payment) {
    await bookingWizard.fillPaymentForm(scenario.payment);
    await bookingWizard.submitPayment();
  }
}

/**
 * Helper function for mobile-specific booking flow
 */
async function completeMobileBookingFlow(bookingWizard: BookingWizardPage, scenario: any): Promise<void> {
  // Step 1: Select service with mobile interactions
  await bookingWizard.tap('[data-testid="service-card"]:has-text("' + scenario.serviceName + '")');
  await bookingWizard.tap('[data-testid="next-step"]');

  // Step 2: Select date and time with mobile interactions
  await bookingWizard.tap('[data-date="' + scenario.date + '"]');
  await bookingWizard.tap('[datetime="' + scenario.time + '"]');
  await bookingWizard.tap('[data-testid="next-step"]');

  // Step 3: Fill details with mobile keyboard
  await bookingWizard.fill('[data-testid="first-name"]', scenario.customer.firstName);
  await bookingWizard.fill('[data-testid="last-name"]', scenario.customer.lastName);
  await bookingWizard.fill('[data-testid="email"]', scenario.customer.email);
  await bookingWizard.fill('[data-testid="phone"]', scenario.customer.phone);

  if (scenario.customer.notes) {
    await bookingWizard.fill('[data-testid="notes"]', scenario.customer.notes);
  }

  await bookingWizard.check('[data-testid="consent-checkbox"]');
  await bookingWizard.check('[data-testid="gdpr-checkbox"]');
  await bookingWizard.tap('[data-testid="next-step"]');

  // Step 4: Payment
  if (scenario.payment) {
    await bookingWizard.fillPaymentForm(scenario.payment);
    await bookingWizard.tap('[data-testid="pay-button"]');
  }
}

/**
 * Helper function to test keyboard navigation
 */
async function testKeyboardNavigation(bookingWizard: BookingWizardPage, scenario: any): Promise<void> {
  // Navigate using Tab key
  await bookingWizard.page.keyboard.press('Tab');
  await bookingWizard.page.keyboard.press('Enter'); // Select service

  // Navigate through form fields
  await bookingWizard.page.keyboard.press('Tab');
  await bookingWizard.page.keyboard.press('Tab');
  await bookingWizard.page.keyboard.press('Enter'); // Next step

  // Continue with keyboard navigation for all steps
  for (let i = 0; i < 10; i++) {
    await bookingWizard.page.keyboard.press('Tab');
    if (i % 3 === 0) {
      await bookingWizard.page.keyboard.type('Test Data');
    }
  }
}

/**
 * Helper function to verify screen reader support
 */
async function verifyScreenReaderSupport(bookingWizard: BookingWizardPage): Promise<void> {
  // Check for proper ARIA labels
  const interactiveElements = bookingWizard.page.locator('button, input, select, textarea');
  const count = await interactiveElements.count();

  for (let i = 0; i < Math.min(count, 10); i++) {
    const element = interactiveElements.nth(i);
    const ariaLabel = await element.getAttribute('aria-label');
    const ariaLabelledBy = await element.getAttribute('aria-labelledby');
    const title = await element.getAttribute('title');

    // Each interactive element should have some form of label
    expect(ariaLabel || ariaLabelledBy || title).toBeTruthy();
  }

  // Check for proper heading structure
  const headings = bookingWizard.page.locator('h1, h2, h3, h4, h5, h6');
  expect(await headings.count()).toBeGreaterThan(0);
}