import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Booking Wizard Page Object Model
 * Handles the 4-step booking flow
 */
export class BookingWizardPage extends BasePage {
  readonly stepIndicators: Locator;
  readonly currentStep: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;

  // Step 1 - Service Selection
  readonly step1Container: Locator;
  readonly serviceCards: Locator;
  readonly beautyServicesTab: Locator;
  readonly fitnessServicesTab: Locator;
  readonly serviceSearch: Locator;
  readonly serviceCategories: Locator;

  // Step 2 - Time Selection
  readonly step2Container: Locator;
  readonly calendar: Locator;
  readonly timeSlots: Locator;
  readonly selectedDate: Locator;
  readonly availabilityStatus: Locator;
  readonly durationInfo: Locator;

  // Step 3 - Details
  readonly step3Container: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly notesTextarea: Locator;
  readonly consentCheckbox: Locator;
  readonly gdprCheckbox: Locator;

  // Step 4 - Payment
  readonly step4Container: Locator;
  readonly bookingSummary: Locator;
  readonly paymentForm: Locator;
  readonly stripeElement: Locator;
  readonly payButton: Locator;
  readonly totalPrice: Locator;
  readonly serviceDetails: Locator;

  constructor(page: Page) {
    super(page);

    // General wizard elements
    this.stepIndicators = page.locator('[data-testid="step-indicator"], .step-indicator');
    this.currentStep = page.locator('[data-testid="current-step"], .current-step');
    this.nextButton = page.locator('button:has-text("Next"), button:has-text("Dalej"), [data-testid="next-step"]');
    this.previousButton = page.locator('button:has-text("Previous"), button:has-text("Wstecz"), [data-testid="previous-step"]');

    // Step 1 - Service Selection
    this.step1Container = page.locator('[data-testid="step-1"], .booking-step[data-step="1"]');
    this.serviceCards = page.locator('[data-testid="service-card"], .service-card, [data-service-id]');
    this.beautyServicesTab = page.locator('button:has-text("Beauty"), button:has-text("Uroda"), [data-testid="beauty-tab"]');
    this.fitnessServicesTab = page.locator('button:has-text("Fitness"), button:has-text("Fitness"), [data-testid="fitness-tab"]');
    this.serviceSearch = page.locator('input[placeholder*="search"], input[placeholder*="Search"], [data-testid="service-search"]');
    this.serviceCategories = page.locator('[data-testid="service-category"], .service-category');

    // Step 2 - Time Selection
    this.step2Container = page.locator('[data-testid="step-2"], .booking-step[data-step="2"]');
    this.calendar = page.locator('[data-testid="calendar"], .calendar, .date-picker');
    this.timeSlots = page.locator('[data-testid="time-slot"], .time-slot, button[datetime]');
    this.selectedDate = page.locator('[data-testid="selected-date"], .selected-date');
    this.availabilityStatus = page.locator('[data-testid="availability-status"], .availability-status');
    this.durationInfo = page.locator('[data-testid="duration-info"], .duration-info');

    // Step 3 - Details
    this.step3Container = page.locator('[data-testid="step-3"], .booking-step[data-step="3"]');
    this.firstNameInput = page.locator('input[name="firstName"], input[name="first_name"], input[placeholder*="First"], input[id*="first"]');
    this.lastNameInput = page.locator('input[name="lastName"], input[name="last_name"], input[placeholder*="Last"], input[id*="last"]');
    this.emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email"]');
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone"]');
    this.notesTextarea = page.locator('textarea[name="notes"], textarea[placeholder*="notes"], [data-testid="notes"]');
    this.consentCheckbox = page.locator('input[name="consent"], [data-testid="consent-checkbox"]');
    this.gdprCheckbox = page.locator('input[name="gdpr"], [data-testid="gdpr-checkbox"]');

    // Step 4 - Payment
    this.step4Container = page.locator('[data-testid="step-4"], .booking-step[data-step="4"]');
    this.bookingSummary = page.locator('[data-testid="booking-summary"], .booking-summary');
    this.paymentForm = page.locator('[data-testid="payment-form"], .payment-form');
    this.stripeElement = page.locator('[data-testid="stripe-element"], .StripeElement');
    this.payButton = page.locator('button:has-text("Pay"), button:has-text("Zapłać"), [data-testid="pay-button"]');
    this.totalPrice = page.locator('[data-testid="total-price"], .total-price, [data-testid="price"]');
    this.serviceDetails = page.locator('[data-testid="service-details"], .service-details');
  }

  /**
   * Navigate to booking wizard
   */
  async navigateToBooking(): Promise<void> {
    await this.goto('/book');
    await this.step1Container.waitFor({ state: 'visible' });
  }

  /**
   * Wait for booking wizard to load
   */
  async waitForWizardLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.stepIndicators.first().waitFor({ state: 'visible' });
  }

  /**
   * Get current step number
   */
  async getCurrentStep(): Promise<number> {
    const activeStep = this.page.locator('[data-testid="step-indicator"].active, .step-indicator.active');
    const stepText = await activeStep.getAttribute('data-step') || '1';
    return parseInt(stepText);
  }

  // STEP 1 - SERVICE SELECTION METHODS

  /**
   * Select service by name
   */
  async selectService(serviceName: string): Promise<void> {
    const serviceCard = this.serviceCards.filter({ hasText: serviceName });
    await expect(serviceCard).toBeVisible();
    await serviceCard.click();

    // Wait for selection to be processed
    await this.page.waitForTimeout(500);
  }

  /**
   * Select service by ID
   */
  async selectServiceById(serviceId: string): Promise<void> {
    const serviceCard = this.serviceCards.filter({ hasAttribute: 'data-service-id', value: serviceId });
    await expect(serviceCard).toBeVisible();
    await serviceCard.click();

    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to beauty services tab
   */
  async selectBeautyServices(): Promise<void> {
    if (await this.beautyServicesTab.isVisible()) {
      await this.beautyServicesTab.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Switch to fitness services tab
   */
  async selectFitnessServices(): Promise<void> {
    if (await this.fitnessServicesTab.isVisible()) {
      await this.fitnessServicesTab.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Search for services
   */
  async searchServices(query: string): Promise<void> {
    if (await this.serviceSearch.isVisible()) {
      await this.serviceSearch.fill(query);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Get selected service information
   */
  async getSelectedService(): Promise<{ name: string; price: string; duration: string } | null> {
    const selectedCard = this.page.locator('[data-testid="service-card"].selected, .service-card.selected');

    if (!(await selectedCard.isVisible())) {
      return null;
    }

    const name = await selectedCard.locator('[data-testid="service-name"], .service-name, h3').textContent() || '';
    const price = await selectedCard.locator('[data-testid="service-price"], .service-price, .price').textContent() || '';
    const duration = await selectedCard.locator('[data-testid="service-duration"], .service-duration, .duration').textContent() || '';

    return { name: name.trim(), price: price.trim(), duration: duration.trim() };
  }

  /**
   * Proceed to step 2
   */
  async proceedToStep2(): Promise<void> {
    await this.nextButton.click();
    await this.step2Container.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  // STEP 2 - TIME SELECTION METHODS

  /**
   * Select a date from the calendar
   */
  async selectDate(date: string): Promise<void> {
    // Format date to match calendar format (YYYY-MM-DD)
    const formattedDate = new Date(date).toISOString().split('T')[0];
    const dateElement = this.calendar.locator(`[data-date="${formattedDate}"], [data-day="${formattedDate}"]`);

    if (await dateElement.isVisible()) {
      await dateElement.click();
      await this.page.waitForTimeout(300);
    } else {
      // Navigate through calendar if needed
      const todayButton = this.calendar.locator('button:has-text("Today"), button:has-text("Dziś")');
      if (await todayButton.isVisible()) {
        await todayButton.click();
      }
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Select time slot
   */
  async selectTimeSlot(time: string): Promise<void> {
    const timeSlot = this.timeSlots.filter({ hasText: time });
    await expect(timeSlot).toBeVisible();
    await timeSlot.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Get selected time slot
   */
  async getSelectedTimeSlot(): Promise<string | null> {
    const selectedSlot = this.page.locator('[data-testid="time-slot"].selected, .time-slot.selected');
    return await selectedSlot.textContent();
  }

  /**
   * Check if time slot is available
   */
  async isTimeSlotAvailable(time: string): Promise<boolean> {
    const timeSlot = this.timeSlots.filter({ hasText: time });
    return !(await timeSlot.locator('.disabled, [disabled], .unavailable').isVisible());
  }

  /**
   * Proceed to step 3
   */
  async proceedToStep3(): Promise<void> {
    await this.nextButton.click();
    await this.step3Container.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  // STEP 3 - DETAILS METHODS

  /**
   * Fill customer details
   */
  async fillCustomerDetails(details: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes?: string;
  }): Promise<void> {
    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    await this.emailInput.fill(details.email);
    await this.phoneInput.fill(details.phone);

    if (details.notes && await this.notesTextarea.isVisible()) {
      await this.notesTextarea.fill(details.notes);
    }
  }

  /**
   * Accept consents
   */
  async acceptConsents(): Promise<void> {
    if (await this.consentCheckbox.isVisible()) {
      await this.consentCheckbox.check();
    }
    if (await this.gdprCheckbox.isVisible()) {
      await this.gdprCheckbox.check();
    }
  }

  /**
   * Validate form fields
   */
  async validateForm(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required fields
    const firstName = await this.firstNameInput.inputValue();
    const lastName = await this.lastNameInput.inputValue();
    const email = await this.emailInput.inputValue();
    const phone = await this.phoneInput.inputValue();

    if (!firstName.trim()) errors.push('First name is required');
    if (!lastName.trim()) errors.push('Last name is required');
    if (!email.trim() || !email.includes('@')) errors.push('Valid email is required');
    if (!phone.trim()) errors.push('Phone number is required');

    // Check consents
    if (await this.consentCheckbox.isVisible() && !(await this.consentCheckbox.isChecked())) {
      errors.push('Service consent is required');
    }
    if (await this.gdprCheckbox.isVisible() && !(await this.gdprCheckbox.isChecked())) {
      errors.push('GDPR consent is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Proceed to step 4
   */
  async proceedToStep4(): Promise<void> {
    await this.nextButton.click();
    await this.step4Container.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  // STEP 4 - PAYMENT METHODS

  /**
   * Get booking summary
   */
  async getBookingSummary(): Promise<{
    service: string;
    date: string;
    time: string;
    price: string;
    customer: string;
  } | null> {
    if (!(await this.bookingSummary.isVisible())) {
      return null;
    }

    const service = await this.serviceDetails.textContent() || '';
    const date = await this.page.locator('[data-testid="booking-date"], .booking-date').textContent() || '';
    const time = await this.page.locator('[data-testid="booking-time"], .booking-time').textContent() || '';
    const price = await this.totalPrice.textContent() || '';
    const customer = await this.page.locator('[data-testid="customer-info"], .customer-info').textContent() || '';

    return {
      service: service.trim(),
      date: date.trim(),
      time: time.trim(),
      price: price.trim(),
      customer: customer.trim()
    };
  }

  /**
   * Fill payment form with test card
   */
  async fillPaymentForm(testCard?: {
    cardNumber: string;
    expiry: string;
    cvc: string;
    name: string;
  }): Promise<void> {
    const card = testCard || {
      cardNumber: '4242424242424242',
      expiry: '12/25',
      cvc: '123',
      name: 'Test User'
    };

    // Fill Stripe iframe elements
    const iframeElement = await this.page.waitForSelector('iframe[name^="__privateStripeFrame"]');
    const iframe = await iframeElement.contentFrame();

    if (iframe) {
      const cardNumberInput = iframe.locator('input[placeholder*="card"], input[placeholder="Card number"]');
      const expiryInput = iframe.locator('input[placeholder*="expiry"], input[placeholder="MM / YY"]');
      const cvcInput = iframe.locator('input[placeholder*="CVC"], input[placeholder="CVC"]');

      if (await cardNumberInput.isVisible()) {
        await cardNumberInput.fill(card.cardNumber);
      }
      if (await expiryInput.isVisible()) {
        await expiryInput.fill(card.expiry);
      }
      if (await cvcInput.isVisible()) {
        await cvcInput.fill(card.cvc);
      }
    }

    // Fill name on card if separate input exists
    const nameInput = this.page.locator('input[placeholder*="name"], [data-testid="card-name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill(card.name);
    }
  }

  /**
   * Submit payment
   */
  async submitPayment(): Promise<void> {
    await this.payButton.click();
    // Wait for payment processing
    await this.page.waitForTimeout(3000);
  }

  /**
   * Go to previous step
   */
  async goToPreviousStep(): Promise<void> {
    await this.previousButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if step is completed
   */
  async isStepCompleted(step: number): Promise<boolean> {
    const stepIndicator = this.page.locator(`[data-step="${step}"].completed, .step-indicator[data-step="${step}"].completed`);
    return await stepIndicator.isVisible();
  }

  /**
   * Complete full booking flow
   */
  async completeBookingFlow(bookingData: {
    serviceName: string;
    date: string;
    time: string;
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      notes?: string;
    };
    payment?: {
      cardNumber: string;
      expiry: string;
      cvc: string;
      name: string;
    };
  }): Promise<void> {
    // Step 1: Select service
    await this.selectService(bookingData.serviceName);
    await this.proceedToStep2();

    // Step 2: Select date and time
    await this.selectDate(bookingData.date);
    await this.selectTimeSlot(bookingData.time);
    await this.proceedToStep3();

    // Step 3: Fill details
    await this.fillCustomerDetails(bookingData.customer);
    await this.acceptConsents();
    await this.proceedToStep4();

    // Step 4: Payment
    if (bookingData.payment) {
      await this.fillPaymentForm(bookingData.payment);
      await this.submitPayment();
    }
  }
}