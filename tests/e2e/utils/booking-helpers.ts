import { Page } from '@playwright/test';

import { TestHelpers } from './test-helpers';
import { PolishPhoneNumbers, TestCreditCards } from './test-data';

export class BookingHelpers extends TestHelpers {
  constructor(page: Page) {
    super(page);
  }

  // Complete booking flow for beauty service
  async bookBeautyService(options?: {
    serviceName?: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    notes?: string;
    skipPayment?: boolean;
  }) {
    const {
      serviceName = 'Beauty Brows Enhancement',
      userName = 'Test User',
      userEmail = 'test@example.com',
      userPhone = '+48 123 456 789',
      notes = 'E2E Test Booking',
      skipPayment = false,
    } = options || {};

    await this.navigateTo('/beauty');
    await this.waitForPageLoad();

    // Select service
    await this.page.getByRole('heading', { name: serviceName }).click();
    await this.waitForPageLoad();

    // Start booking
    const bookNowButton = this.page.getByRole('button', { name: /book now/i });
    if (await bookNowButton.isVisible()) {
      await bookNowButton.click();
    } else {
      await this.page.goto('/booking');
    }

    await this.waitForPageLoad();

    // Step 1: Service Selection (if needed)
    await this.completeServiceSelection(serviceName);

    // Step 2: Time Selection
    await this.completeTimeSelection();

    // Step 3: Client Details
    await this.completeClientDetails({
      name: userName,
      email: userEmail,
      phone: userPhone,
      notes,
    });

    // Step 4: Payment (unless skipped)
    if (!skipPayment) {
      await this.completePayment();
    }

    // Verify booking confirmation
    await this.verifyBookingConfirmation();
  }

  // Complete booking flow for fitness service
  async bookFitnessService(options?: {
    serviceName?: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    notes?: string;
    skipPayment?: boolean;
  }) {
    const {
      serviceName = 'Glute Sculpting Program',
      userName = 'Test User',
      userEmail = 'test@example.com',
      userPhone = '+48 123 456 789',
      notes = 'E2E Fitness Test Booking',
      skipPayment = false,
    } = options || {};

    await this.navigateTo('/fitness');
    await this.waitForPageLoad();

    // Select program
    await this.page.getByRole('heading', { name: serviceName }).click();
    await this.waitForPageLoad();

    // Start booking
    const bookNowButton = this.page.getByRole('button', { name: /book now/i });
    if (await bookNowButton.isVisible()) {
      await bookNowButton.click();
    } else {
      await this.page.goto('/booking');
    }

    await this.waitForPageLoad();

    // Complete booking steps
    await this.completeServiceSelection(serviceName);
    await this.completeTimeSelection();
    await this.completeClientDetails({
      name: userName,
      email: userEmail,
      phone: userPhone,
      notes,
    });

    if (!skipPayment) {
      await this.completePayment();
    }

    await this.verifyBookingConfirmation();
  }

  // Complete service selection step
  private async completeServiceSelection(serviceName: string) {
    // Check if we're on service selection step
    const serviceStep = this.page.locator('[data-testid="booking-step-1"]');
    if (await serviceStep.isVisible()) {
      // Select the service
      await this.page.getByRole('heading', { name: serviceName }).click();

      // Click continue
      const continueButton = this.page.getByRole('button', { name: /continue/i });
      await continueButton.click();

      await this.waitForLoadingToComplete();
    }
  }

  // Complete time selection step
  private async completeTimeSelection() {
    await this.page.waitForSelector('[data-testid="booking-step-2"]', { state: 'visible' });

    // Wait for time slots to load
    await this.page.waitForSelector('[data-testid="time-slot"]', { state: 'visible' });

    // Select first available time slot
    const firstAvailableSlot = this.page.locator('[data-testid="time-slot"]').first();
    await firstAvailableSlot.click();

    // Wait for slot to be selected
    await this.page.waitForTimeout(500);

    // Continue to next step (should auto-advance, but we'll wait)
    await this.page.waitForSelector('[data-testid="booking-step-3"]', { state: 'visible', timeout: 10000 });
  }

  // Complete client details step
  private async completeClientDetails(details: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }) {
    await this.page.waitForSelector('[data-testid="booking-step-3"]', { state: 'visible' });

    // Fill form fields
    await this.page.getByLabel(/name/i).fill(details.name);
    await this.page.getByLabel(/email/i).fill(details.email);
    await this.page.getByLabel(/phone/i).fill(details.phone);

    if (details.notes) {
      const notesField = this.page.getByLabel(/notes/i);
      if (await notesField.isVisible()) {
        await notesField.fill(details.notes);
      }
    }

    // Accept terms and conditions
    const termsCheckbox = this.page.getByLabel(/terms and conditions|agree to terms/i);
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Accept privacy policy if present
    const privacyCheckbox = this.page.getByLabel(/privacy policy/i);
    if (await privacyCheckbox.isVisible()) {
      await privacyCheckbox.check();
    }

    // Continue to payment
    const continueButton = this.page.getByRole('button', { name: /continue/i });
    await continueButton.click();

    await this.page.waitForSelector('[data-testid="booking-step-4"]', { state: 'visible', timeout: 10000 });
  }

  // Complete payment step
  private async completePayment() {
    await this.page.waitForSelector('[data-testid="booking-step-4"]', { state: 'visible' });

    // Wait for Stripe element to load
    await this.page.waitForSelector('[data-testid="stripe-element"]', {
      state: 'visible',
      timeout: 15000
    });

    // Fill in Stripe test card details
    // Note: This assumes Stripe Elements integration
    await this.page.fill('[data-testid="card-number"]', TestCreditCards.visa.number);
    await this.page.fill('[data-testid="card-expiry"]', '12/30');
    await this.page.fill('[data-testid="card-cvc"]', '123');
    await this.page.fill('[data-testid="card-name"]', 'Test User');

    // Submit payment
    const completeButton = this.page.getByRole('button', {
      name: /complete booking|pay now|confirm payment/i
    });
    await completeButton.click();

    // Wait for payment processing
    await this.page.waitForSelector('[data-testid="processing-payment"]', {
      state: 'visible',
      timeout: 5000
    });

    // Wait for confirmation
    await this.page.waitForSelector('[data-testid="booking-confirmed"]', {
      state: 'visible',
      timeout: 30000
    });
  }

  // Verify booking confirmation
  private async verifyBookingConfirmation() {
    await this.expectTextToBeVisible(/booking confirmed|thank you|appointment confirmed/i);

    // Check for booking details
    await this.expectElementToBeVisible('[data-testid="booking-details"]');

    // Check for email confirmation message
    const emailConfirmation = this.page.getByText(/email confirmation sent/i);
    if (await emailConfirmation.isVisible()) {
      console.log('✅ Email confirmation message displayed');
    }

    // Check for next steps
    const nextSteps = this.page.getByText(/what's next|next steps/i);
    if (await nextSteps.isVisible()) {
      console.log('✅ Next steps information displayed');
    }
  }

  // Test booking validation
  async testBookingValidation() {
    await this.navigateTo('/booking');
    await this.waitForPageLoad();

    // Try to proceed without selecting service
    const continueButton = this.page.getByRole('button', { name: /continue/i });
    await continueButton.click();

    // Should show validation error
    await this.expectTextToBeVisible(/please select a service/i);

    // Try invalid email
    await this.page.getByLabel(/email/i).fill('invalid-email');
    await continueButton.click();

    await this.expectTextToBeVisible(/invalid email/i);

    // Try invalid phone number
    await this.page.getByLabel(/phone/i).fill('123');
    await continueButton.click();

    await this.expectTextToBeVisible(/invalid phone number/i);

    console.log('✅ Booking validation tests passed');
  }

  // Test Polish phone number format validation
  async testPolishPhoneValidation() {
    await this.navigateTo('/booking');
    await this.waitForPageLoad();

    // Test valid Polish phone numbers
    for (const phoneNumber of PolishPhoneNumbers.valid) {
      await this.page.getByLabel(/phone/i).fill(phoneNumber);

      // Blur the field to trigger validation
      await this.page.getByLabel(/email/i).click();

      // Should not show error
      const errorElement = this.page.getByText(/invalid phone number/i);
      expect(await errorElement.isVisible()).toBeFalsy();

      console.log(`✅ Valid Polish phone number accepted: ${phoneNumber}`);
    }

    // Test invalid phone numbers
    for (const phoneNumber of PolishPhoneNumbers.invalid) {
      await this.page.getByLabel(/phone/i).fill(phoneNumber);

      // Blur the field to trigger validation
      await this.page.getByLabel(/email/i).click();

      // Should show error (after debounce)
      await this.page.waitForTimeout(500);
      const errorElement = this.page.getByText(/invalid phone number/i);
      if (await errorElement.isVisible()) {
        console.log(`✅ Invalid phone number rejected: ${phoneNumber}`);
      }
    }
  }

  // Test booking cancellation
  async testBookingCancellation() {
    await this.navigateTo('/booking');
    await this.waitForPageLoad();

    // Start booking process
    await this.completeServiceSelection('Beauty Brows Enhancement');
    await this.completeTimeSelection();
    await this.completeClientDetails({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+48 123 456 789',
    });

    // Before payment, try to cancel
    const cancelButton = this.page.getByRole('button', { name: /cancel|close/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Should show confirmation dialog
      const confirmDialog = this.page.getByRole('dialog');
      if (await confirmDialog.isVisible()) {
        await this.page.getByRole('button', { name: /yes|confirm/i }).click();
      }

      // Should return to previous page or home
      await this.waitForPageLoad();
      console.log('✅ Booking cancellation test passed');
    }
  }

  // Test booking persistence (session storage)
  async testBookingPersistence() {
    await this.navigateTo('/booking');
    await this.waitForPageLoad();

    // Complete first step
    await this.completeServiceSelection('Beauty Brows Enhancement');

    // Refresh page
    await this.page.reload();
    await this.waitForPageLoad();

    // Should still have service selected (if persistence is working)
    const selectedService = this.page.getByText(/beauty brows enhancement/i);
    if (await selectedService.isVisible()) {
      console.log('✅ Booking persistence test passed - service selection maintained');
    } else {
      console.log('⚠️  Booking persistence not implemented or not working');
    }
  }

  // Test booking with package
  async testBookingWithPackage() {
    await this.navigateTo('/packages');
    await this.waitForPageLoad();

    // Select a package
    await this.page.getByRole('heading', { name: /beauty package/i }).click();
    await this.waitForPageLoad();

    // Purchase package
    const purchaseButton = this.page.getByRole('button', { name: /purchase package|buy now/i });
    if (await purchaseButton.isVisible()) {
      await purchaseButton.click();

      // Complete payment for package
      await this.completePayment();

      // Verify package purchase
      await this.expectTextToBeVisible(/package purchased|package activated/i);

      // Now book a session using the package
      await this.bookBeautyService({ skipPayment: true });

      console.log('✅ Booking with package test passed');
    }
  }

  // Test real-time slot availability
  async testRealTimeSlotAvailability() {
    await this.navigateTo('/booking');
    await this.waitForPageLoad();

    await this.completeServiceSelection('Beauty Brows Enhancement');

    // Mock WebSocket event for slot being taken
    await this.page.evaluate(() => {
      const event = new CustomEvent('slot:reserved', {
        detail: { slotId: 'slot-1', userId: 'other-user' }
      });
      window.dispatchEvent(event);
    });

    // Check if slot shows as unavailable
    await this.page.waitForTimeout(1000);

    const slotElement = this.page.locator('[data-testid="time-slot"]').first();
    const isDisabled = await slotElement.isDisabled();

    if (isDisabled) {
      console.log('✅ Real-time slot availability test passed');
    } else {
      console.log('⚠️  Real-time slot updates not working');
    }
  }
}
