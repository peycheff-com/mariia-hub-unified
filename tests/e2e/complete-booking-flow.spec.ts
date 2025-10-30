import { test, expect, devices } from '@playwright/test';
import { HomePage } from './page-objects/home-page';
import { BookingWizardPage } from './page-objects/booking-wizard';
import { BeautyPage } from './page-objects/beauty-page';
import { BOOKING_SCENARIOS, MOBILE_VIEWPORTS, TABLET_VIEWPORTS } from './utils/test-data';

test.describe('Complete Booking Flow E2E', () => {
  let bookingPage: BookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page);
    await page.goto('/');
  });

  test('complete beauty service booking flow - guest user', async ({ page }) => {
    // Start booking from homepage
    await bookingPage.startBookingFromHomepage();

    // Step 1: Select Beauty Service
    await bookingPage.selectService('beauty', 'Lip Enhancement');
    await bookingPage.verifyStepHeader('Select Date & Time');

    // Step 2: Select Date and Time
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.proceedToNextStep();

    // Step 3: Fill Client Details
    await bookingPage.fillClientDetails({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      notes: 'First time appointment'
    });
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.acceptMarketingConsent(false);
    await bookingPage.proceedToNextStep();

    // Step 4: Payment Information
    await bookingPage.verifyPaymentSummary();
    await bookingPage.selectPaymentMethod('card');

    // Fill payment form (using test card)
    await bookingPage.fillPaymentDetails({
      cardNumber: '4242424242424242',
      expiryDate: '12/25',
      cvv: '123',
      postalCode: '12345'
    });

    // Complete booking
    await bookingPage.confirmBooking();
    await bookingPage.verifyBookingConfirmation();

    // Verify confirmation details
    await expect(page.locator('[data-testid="confirmation-service"]')).toContainText('Lip Enhancement');
    await expect(page.locator('[data-testid="confirmation-email"]')).toContainText('john.doe@example.com');
  });

  test('complete fitness service booking flow - group booking', async ({ page }) => {
    await bookingPage.startBookingFromHomepage();

    // Step 1: Select Fitness Service with Group Booking
    await bookingPage.selectService('fitness', 'Personal Training');
    await bookingPage.enableGroupBooking();
    await bookingPage.setGroupSize(3);
    await bookingPage.verifyStepHeader('Select Date & Time');

    // Step 2: Select Date and Time for Group
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.verifyGroupCapacityAvailable(3);
    await bookingPage.proceedToNextStep();

    // Step 3: Fill Group Details
    await bookingPage.fillClientDetails({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567890'
    });
    await bookingPage.addGroupParticipants([
      { name: 'Alice Johnson', email: 'alice@example.com' },
      { name: 'Bob Wilson', email: 'bob@example.com' }
    ]);
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.proceedToNextStep();

    // Step 4: Verify Group Pricing and Payment
    await bookingPage.verifyGroupPricing(3);
    await bookingPage.selectPaymentMethod('card');
    await bookingPage.fillPaymentDetails({
      cardNumber: '4242424242424242',
      expiryDate: '12/25',
      cvv: '123',
      postalCode: '12345'
    });

    // Complete group booking
    await bookingPage.confirmBooking();
    await bookingPage.verifyBookingConfirmation();
    await expect(page.locator('[data-testid="confirmation-group-size"]')).toContainText('3 participants');
  });

  test('booking flow with waitlist option when no availability', async ({ page }) => {
    // Mock a fully booked scenario
    await page.route('**/api/availability**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          available: false,
          alternatives: [],
          waitlistAvailable: true
        })
      });
    });

    await bookingPage.startBookingFromHomepage();
    await bookingPage.selectService('beauty', 'Brow Lamination');
    await bookingPage.selectDateInFuture(7); // Select date 7 days from now

    // Should show no availability
    await expect(page.locator('[data-testid="no-availability"]')).toBeVisible();

    // Add to waitlist
    await bookingPage.joinWaitlist({
      email: 'waitlist@example.com',
      phone: '+1234567890',
      flexibleWithTime: true
    });

    await expect(page.locator('[data-testid="waitlist-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="waitlist-email"]')).toContainText('waitlist@example.com');
  });

  test('booking flow validation and error handling', async ({ page }) => {
    await bookingPage.startBookingFromHomepage();

    // Step 1: Try to proceed without selecting service
    await expect(page.locator('button:has-text("Continue")')).toBeDisabled();

    // Select service and proceed
    await bookingPage.selectService('beauty', 'PMU Brows');
    await bookingPage.proceedToNextStep();

    // Step 2: Try to proceed without selecting time
    await expect(page.locator('button:has-text("Continue")')).toBeDisabled();

    // Select time and proceed
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.proceedToNextStep();

    // Step 3: Try to proceed without filling required fields
    await bookingPage.fillClientDetails({
      firstName: 'Test',
      lastName: 'User',
      email: '', // Empty email should cause validation error
      phone: '+1234567890'
    });
    await expect(page.locator('button:has-text("Continue")')).toBeDisabled();

    // Fill with invalid email
    await bookingPage.fillClientDetails({
      firstName: 'Test',
      lastName: 'User',
      email: 'invalid-email',
      phone: '+1234567890'
    });
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();

    // Correct the email
    await bookingPage.fillClientDetails({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+1234567890'
    });
    await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible();
  });

  test('booking flow with rescheduling option', async ({ page }) => {
    // First complete a booking
    await test.step('Create initial booking', async () => {
      await bookingPage.startBookingFromHomepage();
      await bookingPage.selectService('beauty', 'Lash Extensions');
      await bookingPage.selectFirstAvailableDate();
      await bookingPage.selectFirstAvailableTime();
      await bookingPage.fillClientDetails({
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@example.com',
        phone: '+1234567890'
      });
      await bookingPage.acceptTermsAndConditions();
      await bookingPage.selectPaymentMethod('card');
      await bookingPage.fillPaymentDetails({
        cardNumber: '4242424242424242',
        expiryDate: '12/25',
        cvv: '123',
        postalCode: '12345'
      });
      await bookingPage.confirmBooking();
      await bookingPage.verifyBookingConfirmation();
    });

    // Now test rescheduling
    await test.step('Reschedule the booking', async () => {
      await page.goto('/booking/history');
      await bookingPage.rescheduleFirstBooking();
      await bookingPage.selectNewDateInFuture(3);
      await bookingPage.selectFirstAvailableTime();
      await bookingPage.confirmReschedule();
      await expect(page.locator('[data-testid="reschedule-confirmation"]')).toBeVisible();
    });
  });

  test('booking flow with gift card payment', async ({ page }) => {
    await bookingPage.startBookingFromHomepage();
    await bookingPage.selectService('beauty', 'Lip Enhancement');
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.fillClientDetails({
      firstName: 'Mike',
      lastName: 'Brown',
      email: 'mike@example.com',
      phone: '+1234567890'
    });
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.proceedToNextStep();

    // Apply gift card
    await bookingPage.applyGiftCard('GIFT-123456789');
    await bookingPage.verifyGiftCardApplied(50.00); // Assuming $50 gift card

    // Complete booking with remaining balance
    await bookingPage.selectPaymentMethod('card');
    await bookingPage.fillPaymentDetails({
      cardNumber: '4242424242424242',
      expiryDate: '12/25',
      cvv: '123',
      postalCode: '12345'
    });
    await bookingPage.confirmBooking();
    await bookingPage.verifyBookingConfirmation();
  });
});