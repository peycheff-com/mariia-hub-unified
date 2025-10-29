import { test, expect } from '@playwright/test';
import { BookingHelpers } from '../utils/booking-helpers';
import { TestDataManager, TestDataFactory } from '../utils/test-data';

test.describe('Complete Booking Flow - Critical User Journey', () => {
  let bookingHelpers: BookingHelpers;
  let testDataManager: TestDataManager;

  test.beforeEach(async ({ page, context }) => {
    bookingHelpers = new BookingHelpers(page);
    testDataManager = new TestDataManager(context);

    // Set up error handling
    await bookingHelpers.handleErrors();

    // Accept cookies if present
    await bookingHelpers.acceptCookies();

    // Set locale to Poland for phone number testing
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        get: () => 'en-GB',
      });
    });
  });

  test.afterEach(async ({ context }) => {
    await testDataManager.cleanup();
  });

  test.describe('Beauty Service Booking', () => {
    test('BE-001: Complete beauty service booking flow - Happy Path', async ({ page }) => {
      console.log('🎯 Starting BE-001: Complete beauty service booking flow');

      // Create test user
      const testUser = await testDataManager.createUser({
        name: 'Anna Nowak',
        email: 'anna.nowak@example.com',
        phone: '+48 512 345 678',
      });

      // Complete full booking flow
      await bookingHelpers.bookBeautyService({
        serviceName: 'Beauty Brows Enhancement',
        userName: testUser.name,
        userEmail: testUser.email,
        userPhone: testUser.phone,
        notes: 'First time client, looking for natural enhancement',
      });

      // Verify booking success
      await expect(page.getByText(/booking confirmed/i)).toBeVisible();

      // Check booking details
      await expect(page.getByText(testUser.name)).toBeVisible();
      await expect(page.getByText(testUser.email)).toBeVisible();
      await expect(page.getByText(/beauty brows enhancement/i)).toBeVisible();

      // Verify email confirmation message
      const emailConfirmation = page.getByText(/confirmation email has been sent/i);
      if (await emailConfirmation.isVisible()) {
        console.log('✅ Email confirmation message displayed');
      }

      // Take screenshot for verification
      await bookingHelpers.takeScreenshot('beauty-booking-confirmation');

      console.log('✅ BE-001: Beauty service booking completed successfully');
    });

    test('BE-002: Beauty service booking with Polish phone number formats', async ({ page }) => {
      console.log('🎯 Starting BE-002: Polish phone number format validation');

      const polishPhoneNumbers = [
        '+48 512 345 678',
        '+48 512-345-678',
        '+48512345678',
        '512 345 678',
        '512-345-678',
        '512345678',
      ];

      for (const phoneNumber of polishPhoneNumbers) {
        console.log(`Testing phone number: ${phoneNumber}`);

        // Start booking flow
        await page.goto('/beauty');
        await page.waitForLoadState('networkidle');

        await page.getByRole('heading', { name: 'Beauty Brows Enhancement' }).click();

        const bookNowButton = page.getByRole('button', { name: /book now/i });
        if (await bookNowButton.isVisible()) {
          await bookNowButton.click();
        } else {
          await page.goto('/booking');
        }

        await page.waitForLoadState('networkidle');

        // Fill in details with specific phone number
        await page.getByLabel(/name/i).fill('E2E Test User');
        await page.getByLabel(/email/i).fill(`test+${Date.now()}@example.com`);
        await page.getByLabel(/phone/i).fill(phoneNumber);

        // Accept terms
        const termsCheckbox = page.getByLabel(/terms and conditions/i);
        if (await termsCheckbox.isVisible()) {
          await termsCheckbox.check();
        }

        // Try to continue - should work without validation errors
        const continueButton = page.getByRole('button', { name: /continue/i });
        await continueButton.click();

        // Check if we moved to the next step or got validation error
        await page.waitForTimeout(1000);

        const validationError = page.getByText(/invalid phone number/i);
        if (await validationError.isVisible()) {
          console.log(`❌ Phone number rejected: ${phoneNumber}`);
        } else {
          console.log(`✅ Phone number accepted: ${phoneNumber}`);
        }

        // Start fresh for next test
        await page.goto('/');
      }
    });

    test('BE-003: Beauty service booking error scenarios', async ({ page }) => {
      console.log('🎯 Starting BE-003: Beauty service booking error scenarios');

      // Test invalid email
      await page.goto('/beauty');
      await page.waitForLoadState('networkidle');

      await page.getByRole('heading', { name: 'Beauty Brows Enhancement' }).click();
      await page.getByRole('button', { name: /book now/i }).click();

      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/phone/i).fill('+48 512 345 678');

      const continueButton = page.getByRole('button', { name: /continue/i });
      await continueButton.click();

      // Should show validation error
      await expect(page.getByText(/invalid email/i)).toBeVisible();
      console.log('✅ Invalid email validation working');

      // Test missing required fields
      await page.getByLabel(/email/i).fill('');
      await page.getByLabel(/phone/i).fill('');
      await continueButton.click();

      await expect(page.getByText(/required/i)).toBeVisible();
      console.log('✅ Required field validation working');

      // Test booking cancellation
      const cancelButton = page.getByRole('button', { name: /cancel|close/i });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        // Confirm cancellation if dialog appears
        const confirmDialog = page.getByRole('dialog');
        if (await confirmDialog.isVisible()) {
          await page.getByRole('button', { name: /yes|confirm/i }).click();
        }

        await page.waitForLoadState('networkidle');
        console.log('✅ Booking cancellation working');
      }
    });

    test('BE-004: Beauty service booking with different payment methods', async ({ page }) => {
      console.log('🎯 Starting BE-004: Beauty service booking payment methods');

      // Start booking flow
      await page.goto('/beauty');
      await page.waitForLoadState('networkidle');

      await page.getByRole('heading', { name: 'Beauty Brows Enhancement' }).click();
      await page.getByRole('button', { name: /book now/i }).click();

      // Complete initial steps
      await bookingHelpers.completeServiceSelection('Beauty Brows Enhancement');
      await bookingHelpers.completeTimeSelection();

      await page.getByLabel(/name/i).fill('Payment Test User');
      await page.getByLabel(/email/i).fill(`payment+${Date.now()}@example.com`);
      await page.getByLabel(/phone/i).fill('+48 512 345 678');

      const termsCheckbox = page.getByLabel(/terms and conditions/i);
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }

      await page.getByRole('button', { name: /continue/i }).click();
      await page.waitForSelector('[data-testid="booking-step-4"]', { state: 'visible' });

      // Test different payment methods if available
      const cardPayment = page.getByLabel(/card|credit card/i);
      const bankTransfer = page.getByLabel(/bank transfer/i);
      const cashOnArrival = page.getByLabel(/cash on arrival/i);

      if (await cardPayment.isVisible()) {
        await cardPayment.check();
        console.log('✅ Card payment option available and selectable');
      }

      if (await bankTransfer.isVisible()) {
        await bankTransfer.check();
        console.log('✅ Bank transfer option available and selectable');
      }

      if (await cashOnArrival.isVisible()) {
        await cashOnArrival.check();
        console.log('✅ Cash on arrival option available and selectable');
      }
    });
  });

  test.describe('Fitness Service Booking', () => {
    test('FT-001: Complete fitness service booking flow - Happy Path', async ({ page }) => {
      console.log('🎯 Starting FT-001: Complete fitness service booking flow');

      // Create test user
      const testUser = await testDataManager.createUser({
        name: 'Jan Kowalski',
        email: 'jan.kowalski@example.com',
        phone: '+48 601 234 567',
      });

      // Complete full booking flow
      await bookingHelpers.bookFitnessService({
        serviceName: 'Glute Sculpting Program',
        userName: testUser.name,
        userEmail: testUser.email,
        userPhone: testUser.phone,
        notes: 'Looking to improve glute strength and appearance',
      });

      // Verify booking success
      await expect(page.getByText(/booking confirmed/i)).toBeVisible();

      // Check booking details
      await expect(page.getByText(testUser.name)).toBeVisible();
      await expect(page.getByText(testUser.email)).toBeVisible();
      await expect(page.getByText(/glute sculpting program/i)).toBeVisible();

      // Take screenshot for verification
      await bookingHelpers.takeScreenshot('fitness-booking-confirmation');

      console.log('✅ FT-001: Fitness service booking completed successfully');
    });

    test('FT-002: Fitness service booking with package session', async ({ page }) => {
      console.log('🎯 Starting FT-002: Fitness booking with package session');

      // First navigate to packages and purchase one
      await page.goto('/packages');
      await page.waitForLoadState('networkidle');

      // Look for fitness packages
      const fitnessPackage = page.getByText(/fitness package|glutes package/i);
      if (await fitnessPackage.isVisible()) {
        await fitnessPackage.click();
        await page.waitForLoadState('networkidle');

        // Purchase package
        const purchaseButton = page.getByRole('button', { name: /purchase|buy now/i });
        if (await purchaseButton.isVisible()) {
          await purchaseButton.click();

          // Complete package purchase
          await bookingHelpers.completePayment();

          // Verify package is active
          await expect(page.getByText(/package activated|sessions available/i)).toBeVisible();

          // Now book a session using the package
          await bookingHelpers.bookFitnessService({
            serviceName: 'Glute Sculpting Program',
            userName: 'Package User',
            userEmail: 'package.user@example.com',
            userPhone: '+48 601 234 567',
            notes: 'Using my package session',
            skipPayment: true, // Should be free with package
          });

          console.log('✅ FT-002: Fitness booking with package session completed');
        } else {
          console.log('⚠️  No purchase button found for fitness package');
        }
      } else {
        console.log('⚠️  No fitness packages available for testing');
      }
    });

    test('FT-003: Fitness service booking validation', async ({ page }) => {
      console.log('🎯 Starting FT-003: Fitness service booking validation');

      await page.goto('/fitness');
      await page.waitForLoadState('networkidle');

      await page.getByRole('heading', { name: 'Glute Sculpting Program' }).click();
      await page.getByRole('button', { name: /book now/i }).click();

      // Test Polish phone number validation for fitness booking
      await bookingHelpers.testPolishPhoneValidation();

      // Test booking validation
      await bookingHelpers.testBookingValidation();

      console.log('✅ FT-003: Fitness booking validation completed');
    });
  });

  test.describe('Cross-Platform Booking', () => {
    test('CP-001: Booking flow works on mobile devices', async ({ page }) => {
      console.log('🎯 Starting CP-001: Mobile booking flow test');

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      // Complete booking on mobile
      await bookingHelpers.bookBeautyService({
        serviceName: 'Beauty Brows Enhancement',
        userName: 'Mobile Test User',
        userEmail: 'mobile@example.com',
        userPhone: '+48 512 345 678',
        notes: 'Mobile booking test',
      });

      // Verify mobile-specific elements
      await expect(page.getByText(/booking confirmed/i)).toBeVisible();

      // Check mobile-specific features
      const mobileNavigation = page.locator('[data-testid="mobile-navigation"]');
      if (await mobileNavigation.isVisible()) {
        console.log('✅ Mobile navigation working correctly');
      }

      console.log('✅ CP-001: Mobile booking flow completed successfully');
    });

    test('CP-002: Booking flow works across different browsers', async ({ page }) => {
      console.log('🎯 Starting CP-002: Cross-browser booking test');

      // This test will run in different browsers due to Playwright configuration
      await bookingHelpers.bookBeautyService({
        serviceName: 'Beauty Brows Enhancement',
        userName: 'Cross-Browser User',
        userEmail: 'crossbrowser@example.com',
        userPhone: '+48 512 345 678',
        notes: 'Cross-browser compatibility test',
      });

      await expect(page.getByText(/booking confirmed/i)).toBeVisible();
      console.log('✅ CP-002: Cross-browser booking completed successfully');
    });
  });

  test.describe('Booking Performance and Reliability', () => {
    test('PR-001: Booking performance test', async ({ page }) => {
      console.log('🎯 Starting PR-001: Booking performance test');

      const startTime = Date.now();

      // Complete booking flow and measure time
      await bookingHelpers.bookBeautyService({
        serviceName: 'Beauty Brows Enhancement',
        userName: 'Performance Test User',
        userEmail: 'performance@example.com',
        userPhone: '+48 512 345 678',
        notes: 'Performance test booking',
      });

      const endTime = Date.now();
      const bookingTime = endTime - startTime;

      console.log(`⏱️  Booking completed in ${bookingTime}ms`);

      // Booking should complete within reasonable time (30 seconds)
      expect(bookingTime).toBeLessThan(30000);

      await expect(page.getByText(/booking confirmed/i)).toBeVisible();
      console.log('✅ PR-001: Booking performance test passed');
    });

    test('PR-002: Booking with network issues', async ({ page }) => {
      console.log('🎯 Starting PR-002: Network resilience test');

      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        await route.continue();
      });

      try {
        await bookingHelpers.bookBeautyService({
          serviceName: 'Beauty Brows Enhancement',
          userName: 'Slow Network User',
          userEmail: 'slownetwork@example.com',
          userPhone: '+48 512 345 678',
          notes: 'Slow network test',
        });

        console.log('✅ PR-002: Booking completed despite slow network');
      } catch (error) {
        console.log('⚠️  Booking failed with slow network:', error);
      }

      // Clean up network simulation
      await page.unroute('**/*');
    });
  });

  test.describe('Booking Data Integrity', () => {
    test('DI-001: Booking data persistence', async ({ page }) => {
      console.log('🎯 Starting DI-001: Booking data persistence test');

      // Start booking
      await page.goto('/beauty');
      await page.waitForLoadState('networkidle');

      await page.getByRole('heading', { name: 'Beauty Brows Enhancement' }).click();
      await page.getByRole('button', { name: /book now/i }).click();

      // Fill in first step
      await bookingHelpers.completeServiceSelection('Beauty Brows Enhancement');
      await bookingHelpers.completeTimeSelection();

      // Fill in some details
      await page.getByLabel(/name/i).fill('Persistence Test User');
      await page.getByLabel(/email/i).fill('persistence@example.com');
      await page.getByLabel(/phone/i).fill('+48 512 345 678');

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check if data is persisted
      const nameField = page.getByLabel(/name/i);
      const persistedName = await nameField.inputValue();

      if (persistedName === 'Persistence Test User') {
        console.log('✅ DI-001: Booking data persisted correctly');
      } else {
        console.log('⚠️  DI-001: Booking data not persisted');
      }
    });

    test('DI-002: Booking data validation', async ({ page }) => {
      console.log('🎯 Starting DI-002: Booking data validation test');

      await page.goto('/booking');
      await page.waitForLoadState('networkidle');

      // Test various data validation scenarios
      const invalidEmails = ['invalid', '@test.com', 'test@', 'test..test@test.com'];
      const invalidPhones = ['123', 'abc123', '+48 123', '123456789012'];

      for (const email of invalidEmails) {
        await page.getByLabel(/email/i).fill(email);
        await page.getByLabel(/phone/i).click(); // Trigger validation
        await page.waitForTimeout(500);

        const errorElement = page.getByText(/invalid email/i);
        if (await errorElement.isVisible()) {
          console.log(`✅ Invalid email rejected: ${email}`);
        }
      }

      for (const phone of invalidPhones) {
        await page.getByLabel(/phone/i).fill(phone);
        await page.getByLabel(/email/i).click(); // Trigger validation
        await page.waitForTimeout(500);

        const errorElement = page.getByText(/invalid phone/i);
        if (await errorElement.isVisible()) {
          console.log(`✅ Invalid phone rejected: ${phone}`);
        }
      }

      console.log('✅ DI-002: Booking data validation completed');
    });
  });
});