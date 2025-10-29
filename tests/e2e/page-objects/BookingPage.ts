import { Page, Locator, expect } from '@playwright/test';

import { TestHelpers } from '../utils/test-helpers';

export interface ClientDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  postalCode: string;
}

export interface GroupParticipant {
  name: string;
  email: string;
}

export interface WaitlistDetails {
  email: string;
  phone: string;
  flexibleWithTime: boolean;
}

export class BookingPage {
  private helpers: TestHelpers;

  // Locators
  readonly serviceCard: Locator;
  readonly timeSlotButton: Locator;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly bookingSummary: Locator;
  readonly paymentButton: Locator;
  readonly confirmationMessage: Locator;

  // Enhanced locators for comprehensive testing
  readonly bookNowButton: Locator;
  readonly bookingSheet: Locator;
  readonly progressBar: Locator;
  readonly beautyTab: Locator;
  readonly fitnessTab: Locator;
  readonly groupBookingToggle: Locator;
  readonly groupSizeSelector: Locator;
  readonly dateSelector: Locator;
  readonly calendarDates: Locator;
  readonly capacityIndicator: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly notesTextarea: Locator;
  readonly termsCheckbox: Locator;
  readonly marketingCheckbox: Locator;
  readonly addParticipantButton: Locator;
  readonly participantInputs: Locator;
  readonly paymentSummary: Locator;
  readonly paymentMethodSelector: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryDateInput: Locator;
  readonly cvvInput: Locator;
  readonly postalCodeInput: Locator;
  readonly giftCardInput: Locator;
  readonly applyGiftCardButton: Locator;
  readonly confirmBookingButton: Locator;
  readonly bookingReference: Locator;
  readonly confirmationDetails: Locator;
  // Missing locators used later
  readonly timeSlots: Locator;
  readonly continueButton: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);

    // Initialize locators
    this.serviceCard = page.locator('[data-testid="service-card"]');
    this.timeSlotButton = page.locator('[data-testid="time-slot"]');
    this.nextButton = page.getByRole('button', { name: /next|continue/i });
    this.backButton = page.getByRole('button', { name: /back|previous/i });
    this.bookingSummary = page.locator('[data-testid="booking-summary"]');
    this.paymentButton = page.getByRole('button', { name: /pay|confirm/i });
    this.confirmationMessage = page.locator('[data-testid="booking-confirmation"]');

    // Enhanced locators
    this.bookNowButton = page.locator('a:has-text("Book Now"), button:has-text("Book Now")');
    this.bookingSheet = page.locator('[data-testid="booking-sheet"]');
    this.progressBar = page.locator('[data-testid="progress-bar"]');
    this.beautyTab = page.locator('[data-testid="beauty-tab"]');
    this.fitnessTab = page.locator('[data-testid="fitness-tab"]');
    this.groupBookingToggle = page.locator('[data-testid="group-booking-toggle"]');
    this.groupSizeSelector = page.locator('[data-testid="group-size-selector"]');
    this.dateSelector = page.locator('[data-testid="date-selector"]');
    this.calendarDates = page.locator('[data-testid="calendar-date"]');
    this.capacityIndicator = page.locator('[data-testid="capacity-indicator"]');
    this.firstNameInput = page.locator('input[name="firstName"], input[placeholder*="First"]');
    this.lastNameInput = page.locator('input[name="lastName"], input[placeholder*="Last"]');
    this.emailInput = page.locator('input[name="email"], input[type="email"]');
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"]');
    this.notesTextarea = page.locator('textarea[name="notes"], textarea[placeholder*="notes"]');
    this.termsCheckbox = page.locator('input[name="terms"], input[data-testid="terms-checkbox"]');
    this.marketingCheckbox = page.locator('input[name="marketing"], input[data-testid="marketing-checkbox"]');
    this.addParticipantButton = page.locator('button:has-text("Add Participant")');
    this.participantInputs = page.locator('[data-testid="participant-input"]');
    this.paymentSummary = page.locator('[data-testid="payment-summary"]');
    this.paymentMethodSelector = page.locator('[data-testid="payment-method-selector"]');
    this.cardNumberInput = page.locator('input[name="cardNumber"], input[placeholder*="Card"]');
    this.expiryDateInput = page.locator('input[name="expiry"], input[placeholder*="MM/YY"]');
    this.cvvInput = page.locator('input[name="cvv"], input[placeholder*="CVV"]');
    this.postalCodeInput = page.locator('input[name="postalCode"], input[placeholder*="Postal"]');
    this.giftCardInput = page.locator('input[name="giftCard"], input[placeholder*="Gift"]');
    this.applyGiftCardButton = page.locator('button:has-text("Apply Gift Card")');
    this.confirmBookingButton = page.locator('button:has-text("Confirm Booking"), button:has-text("Pay Now")');
    this.bookingReference = page.locator('[data-testid="booking-reference"]');
    this.confirmationDetails = page.locator('[data-testid="confirmation-details"]');
    this.timeSlots = page.locator('[data-testid="time-slot"]');
    this.continueButton = this.nextButton;

    // Basic network mocks for payment-related requests to keep E2E deterministic
    page.route('**/api.stripe.com/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });
    page.route('**/stripe/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });
    page.route('**/api/payment**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, paymentIntent: 'pi_test_123' }) });
    });
  }

  // Navigation
  async navigateToBooking(serviceId?: string) {
    const url = serviceId ? `/booking?service=${serviceId}` : '/booking';
    await this.helpers.navigateTo(url);
  }

  // Removed legacy simple methods in favor of enhanced ones below

  // Step 3: Client Details
  async fillClientDetails(details: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }) {
    await this.helpers.fillBookingDetails(details);
  }

  async acceptTerms() {
    await this.page.getByLabel(/terms|conditions/i).check();
  }

  async proceedToPayment() {
    await this.nextButton.click();
  }

  // Step 4: Payment & Confirmation
  async verifyBookingSummary(expectedDetails: {
    service: string;
    date: string;
    time: string;
    price: string;
  }) {
    await expect(this.bookingSummary).toContainText(expectedDetails.service);
    await expect(this.bookingSummary).toContainText(expectedDetails.date);
    await expect(this.bookingSummary).toContainText(expectedDetails.time);
    await expect(this.bookingSummary).toContainText(expectedDetails.price);
  }

  async completeBooking() {
    await this.paymentButton.click();
  }

  async verifyBookingConfirmation() {
    await expect(this.confirmationMessage).toBeVisible();
    await expect(this.page.getByText(/booking confirmed|thank you/i)).toBeVisible();
  }

  // Error handling
  async verifyErrorMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async verifyTimeSlotUnavailable(time: string) {
    const timeSlot = this.timeSlotButton.filter({ hasText: time });
    await expect(timeSlot).toHaveClass(/disabled|unavailable/);
  }

  // Progress indicators
  async verifyCurrentStep(stepNumber: number) {
    const stepIndicator = this.page.locator(`[data-testid="step-${stepNumber}"]`);
    await expect(stepIndicator).toHaveClass(/active|current/);
  }

  // Form validation
  async submitEmptyForm() {
    await this.nextButton.click();
    await expect(this.page.getByText(/required|please fill/i)).toBeVisible();
  }

  async submitInvalidEmail() {
    await this.page.getByLabel(/email/i).fill('invalid-email');
    await this.nextButton.click();
    await expect(this.page.getByText(/invalid email/i)).toBeVisible();
  }

  // Booking modification
  async modifyBooking() {
    await this.page.getByRole('button', { name: /modify|change/i }).click();
  }

  async cancelBooking() {
    await this.page.getByRole('button', { name: /cancel/i }).click();
    await this.page.getByRole('button', { name: /confirm|yes/i }).click();
  }

  // Enhanced Methods for Comprehensive Testing
  async startBookingFromHomepage() {
    await this.bookNowButton.first().click();
    await this.bookingSheet.waitFor({ state: 'visible' });
    await expect(this.progressBar).toBeVisible();
  }

  async verifyStepHeader(expectedStep: string) {
    await expect(this.page.locator('h2:has-text("' + expectedStep + '")')).toBeVisible();
  }

  // Enhanced Service Selection
  async selectService(serviceType: 'beauty' | 'fitness', serviceName: string) {
    if (serviceType === 'beauty') {
      await this.beautyTab.click();
    } else {
      await this.fitnessTab.click();
    }

    await this.page.waitForTimeout(500); // Wait for service cards to load
    const serviceCard = this.page.locator(`[data-testid="service-card"]:has-text("${serviceName}")`);
    await serviceCard.click();
  }

  async enableGroupBooking() {
    await this.groupBookingToggle.click();
  }

  async setGroupSize(size: number) {
    await this.groupSizeSelector.selectOption(size.toString());
  }

  // Enhanced Time Selection
  async selectFirstAvailableDate() {
    const availableDate = this.calendarDates.filter({ hasText: /^\d+$/ }).first();
    await availableDate.click();
  }

  async selectDateInFuture(daysFromNow: number) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysFromNow);
    const dateString = futureDate.getDate().toString();

    const targetDate = this.calendarDates.filter({ hasText: dateString }).first();
    if (await targetDate.isVisible()) {
      await targetDate.click();
    }
  }

  async selectFirstAvailableTime() {
    await this.page.waitForTimeout(500); // Wait for time slots to load
    const availableSlot = this.timeSlots.filter({ hasNotText: 'Booked' }).first();
    await availableSlot.click();
  }

  async selectNewDateInFuture(daysFromNow: number) {
    await this.selectDateInFuture(daysFromNow);
    await this.selectFirstAvailableTime();
  }

  async verifyGroupCapacityAvailable(groupSize: number) {
    await expect(this.capacityIndicator).toBeVisible();
    await expect(this.page.locator(`text=Capacity for ${groupSize} people`)).toBeVisible();
  }

  // Enhanced Client Details
  async fillClientDetails(details: ClientDetails) {
    if (details.firstName) {
      await this.firstNameInput.fill(details.firstName);
    }
    if (details.lastName) {
      await this.lastNameInput.fill(details.lastName);
    }
    if (details.email) {
      await this.emailInput.fill(details.email);
    }
    if (details.phone) {
      await this.phoneInput.fill(details.phone);
    }
    if (details.notes) {
      await this.notesTextarea.fill(details.notes);
    }
  }

  async addGroupParticipants(participants: GroupParticipant[]) {
    for (const participant of participants) {
      await this.addParticipantButton.click();
      const participantInput = this.participantInputs.last();
      await participantInput.fill(`${participant.name} (${participant.email})`);
    }
  }

  async acceptTermsAndConditions() {
    if (!(await this.termsCheckbox.isChecked())) {
      await this.termsCheckbox.check();
    }
  }

  async acceptMarketingConsent(accept: boolean) {
    if (accept !== await this.marketingCheckbox.isChecked()) {
      await this.marketingCheckbox.setChecked(accept);
    }
  }

  // Enhanced Payment Methods
  async verifyPaymentSummary() {
    await expect(this.paymentSummary).toBeVisible();
    await expect(this.page.locator('[data-testid="service-price"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="total-price"]')).toBeVisible();
  }

  async verifyGroupPricing(groupSize: number) {
    await expect(this.page.locator(`text=Group of ${groupSize}`)).toBeVisible();
    await expect(this.page.locator('[data-testid="group-discount"]')).toBeVisible();
  }

  async selectPaymentMethod(method: 'card' | 'cash' | 'gift') {
    const methodOption = this.page.locator(`[data-testid="payment-${method}"]`);
    await methodOption.click();
  }

  async fillPaymentDetails(details: PaymentDetails) {
    await this.cardNumberInput.fill(details.cardNumber);
    await this.expiryDateInput.fill(details.expiryDate);
    await this.cvvInput.fill(details.cvv);
    await this.postalCodeInput.fill(details.postalCode);
  }

  async applyGiftCard(giftCardCode: string) {
    await this.giftCardInput.fill(giftCardCode);
    await this.applyGiftCardButton.click();
  }

  async verifyGiftCardApplied(amount: number) {
    await expect(this.page.locator(`text=Gift card applied: $${amount.toFixed(2)}`)).toBeVisible();
    await expect(this.page.locator('[data-testid="remaining-balance"]')).toBeVisible();
  }

  // Enhanced Completion Methods
  async confirmBooking() {
    await this.confirmBookingButton.click();
  }

  async verifyBookingConfirmation() {
    await this.confirmationMessage.waitFor({ state: 'visible' });
    await expect(this.bookingReference).toBeVisible();
    await expect(this.confirmationDetails).toBeVisible();
  }

  async proceedToNextStep() {
    await this.continueButton.click();
    await this.page.waitForTimeout(500); // Brief wait for step transition
  }

  // Rescheduling Methods
  async rescheduleFirstBooking() {
    await this.page.goto('/booking/history');
    const rescheduleButton = this.page.locator('[data-testid="reschedule-booking"]').first();
    await rescheduleButton.click();
  }

  async confirmReschedule() {
    await this.page.locator('button:has-text("Confirm Reschedule")').click();
    await expect(this.page.locator('[data-testid="reschedule-success"]')).toBeVisible();
  }

  // Waitlist Methods
  async joinWaitlist(details: WaitlistDetails) {
    await this.page.locator('[data-testid="join-waitlist"]').click();
    await this.page.locator('input[name="waitlist-email"]').fill(details.email);
    await this.page.locator('input[name="waitlist-phone"]').fill(details.phone);

    if (details.flexibleWithTime) {
      await this.page.locator('input[name="flexible-time"]').check();
    }

    await this.page.locator('button:has-text("Join Waitlist")').click();
  }
}