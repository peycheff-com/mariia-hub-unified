import { test, expect } from '@playwright/test';

import { BookingPage } from './page-objects/BookingPage';

test.describe('Payment Flow E2E Tests', () => {
  let bookingPage: BookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page);

    // Mock Stripe for testing
    await page.route('**/js.stripe.com/v3/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          window.Stripe = function() {
            return {
              elements: function() {
                return {
                  create: function(type) {
                    return {
                      mount: function() { return Promise.resolve(); },
                      addEventListener: function() {},
                      destroy: function() { return Promise.resolve(); }
                    };
                  }
                };
              },
              confirmCardPayment: function() {
                return Promise.resolve({ paymentIntent: { status: 'succeeded' } });
              },
              confirmPayment: function() {
                return Promise.resolve({ paymentIntent: { status: 'succeeded' } });
              },
              handleCardAction: function() {
                return Promise.resolve({ paymentIntent: { status: 'succeeded' } });
              },
              retrievePaymentIntent: function() {
                return Promise.resolve({
                  paymentIntent: {
                    status: 'succeeded',
                    id: 'pi_test_1234567890'
                  }
                });
              }
            };
          };
        `
      });
    });

    // Mock payment intent creation
    await page.route('**/api/create-payment-intent**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clientSecret: 'pi_test_1234567890_secret_test',
          paymentIntentId: 'pi_test_1234567890'
        })
      });
    });

    // Mock payment processing
    await page.route('**/api/confirm-payment**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'succeeded',
          bookingId: 'booking_test_1234567890'
        })
      });
    });
  });

  test('successful card payment flow', async ({ page }) => {
    // Start booking process
    await page.goto('/');
    await bookingPage.startBookingFromHomepage();
    await bookingPage.selectService('beauty', 'Lip Enhancement');
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.fillClientDetails({
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1234567890'
    });
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.proceedToNextStep();

    // Verify payment summary
    await bookingPage.verifyPaymentSummary();

    // Select card payment method
    await bookingPage.selectPaymentMethod('card');

    // Fill Stripe payment form
    await bookingPage.fillPaymentDetails({
      cardNumber: '4242424242424242',
      expiryDate: '12/25',
      cvv: '123',
      postalCode: '12345'
    });

    // Complete payment
    await bookingPage.confirmBooking();
    await bookingPage.verifyBookingConfirmation();

    // Verify payment success
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-reference"]')).toContainText('booking_test_1234567890');
  });

  test('payment with 3D secure authentication', async ({ page }) => {
    // Override Stripe mock for 3D secure
    await page.unroute('**/js.stripe.com/v3/**');
    await page.route('**/js.stripe.com/v3/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          window.Stripe = function() {
            return {
              elements: function() {
                return {
                  create: function(type) {
                    return {
                      mount: function() { return Promise.resolve(); },
                      addEventListener: function() {},
                      destroy: function() { return Promise.resolve(); }
                    };
                  }
                };
              },
              confirmCardPayment: function() {
                return Promise.resolve({
                  paymentIntent: {
                    status: 'requires_action',
                    next_action: { type: 'use_stripe_sdk' }
                  }
                });
              },
              handleCardAction: function() {
                return Promise.resolve({
                  paymentIntent: { status: 'succeeded' }
                });
              }
            };
          };
        `
      });
    });

    await page.goto('/');
    await bookingPage.startBookingFromHomepage();
    await bookingPage.selectService('beauty', 'PMU Brows');
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.fillClientDetails({
      firstName: 'Mike',
      lastName: 'Wilson',
      email: 'mike.wilson@example.com',
      phone: '+1234567890'
    });
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.proceedToNextStep();

    await bookingPage.selectPaymentMethod('card');
    await bookingPage.fillPaymentDetails({
      cardNumber: '4000002500003155', // 3D secure test card
      expiryDate: '12/25',
      cvv: '123',
      postalCode: '12345'
    });

    // Should trigger 3D secure flow
    await bookingPage.confirmBooking();

    // Mock 3D secure authentication
    const authenticationFrame = page.frameLocator('iframe[name*="stripe"]');
    await expect(authenticationFrame.locator('body')).toBeVisible();

    // Simulate successful authentication
    await page.evaluate(() => {
      window.postMessage({
        type: 'stripe_3ds2_challenge_complete',
        payload: { paymentIntent: { status: 'succeeded' } }
      }, '*');
    });

    await bookingPage.verifyBookingConfirmation();
  });

  test('payment failure scenarios', async ({ page }) => {
    // Test declined card
    await page.unroute('**/api/confirm-payment**');
    await page.route('**/api/confirm-payment**', (route) => {
      route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'Your card was declined.',
            type: 'card_error',
            code: 'card_declined'
          }
        })
      });
    });

    await page.goto('/');
    await bookingPage.startBookingFromHomepage();
    await bookingPage.selectService('beauty', 'Lash Extensions');
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.fillClientDetails({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '+1234567890'
    });
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.proceedToNextStep();

    await bookingPage.selectPaymentMethod('card');
    await bookingPage.fillPaymentDetails({
      cardNumber: '4000000000000002', // Declined test card
      expiryDate: '12/25',
      cvv: '123',
      postalCode: '12345'
    });

    await bookingPage.confirmBooking();

    // Verify error handling
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Your card was declined.');

    // Verify retry option
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
    await expect(page.locator('button:has-text("Use Different Card")')).toBeVisible();
  });

  test('insufficient funds payment failure', async ({ page }) => {
    // Mock insufficient funds error
    await page.unroute('**/api/confirm-payment**');
    await page.route('**/api/confirm-payment**', (route) => {
      route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'Insufficient funds.',
            type: 'card_error',
            code: 'insufficient_funds'
          }
        })
      });
    });

    await page.goto('/');
    await bookingPage.startBookingFromHomepage();
    await bookingPage.selectService('fitness', 'Personal Training');
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.fillClientDetails({
      firstName: 'Tom',
      lastName: 'Smith',
      email: 'tom.smith@example.com',
      phone: '+1234567890'
    });
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.proceedToNextStep();

    await bookingPage.selectPaymentMethod('card');
    await bookingPage.fillPaymentDetails({
      cardNumber: '4000000000009995', // Insufficient funds test card
      expiryDate: '12/25',
      cvv: '123',
      postalCode: '12345'
    });

    await bookingPage.confirmBooking();

    // Verify specific error for insufficient funds
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Insufficient funds');
  });

  test('payment processing timeout', async ({ page }) => {
    // Mock timeout scenario
    await page.unroute('**/api/confirm-payment**');
    await page.route('**/api/confirm-payment**', (route) => {
      // Don't respond to simulate timeout
      setTimeout(() => {
        route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: 'Payment processing timeout.',
              type: 'api_error',
              code: 'timeout'
            }
          })
        });
      }, 10000); // 10 second delay
    });

    await page.goto('/');
    await bookingPage.startBookingFromHomepage();
    await bookingPage.selectService('beauty', 'Brow Lamination');
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.fillClientDetails({
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@example.com',
      phone: '+1234567890'
    });
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.proceedToNextStep();

    await bookingPage.selectPaymentMethod('card');
    await bookingPage.fillPaymentDetails({
      cardNumber: '4242424242424242',
      expiryDate: '12/25',
      cvv: '123',
      postalCode: '12345'
    });

    await bookingPage.confirmBooking();

    // Verify timeout handling
    await expect(page.locator('[data-testid="payment-timeout"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
  });

  test('cash payment option', async ({ page }) => {
    await page.goto('/');
    await bookingPage.startBookingFromHomepage();
    await bookingPage.selectService('beauty', 'Lip Enhancement');
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.fillClientDetails({
      firstName: 'David',
      lastName: 'Brown',
      email: 'david.brown@example.com',
      phone: '+1234567890'
    });
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.proceedToNextStep();

    // Select cash payment
    await bookingPage.selectPaymentMethod('cash');

    // Verify cash payment details
    await expect(page.locator('[data-testid="cash-payment-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-location"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-amount"]')).toBeVisible();

    // Confirm cash booking
    await bookingPage.confirmBooking();
    await bookingPage.verifyBookingConfirmation();

    // Verify cash payment confirmation details
    await expect(page.locator('[data-testid="cash-payment-confirmed"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-instructions"]')).toBeVisible();
  });

  test('gift card combined with card payment', async ({ page }) => {
    // Mock gift card validation
    await page.route('**/api/validate-gift-card**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          balance: 50.00,
          originalBalance: 100.00
        })
      });
    });

    await page.goto('/');
    await bookingPage.startBookingFromHomepage();
    await bookingPage.selectService('beauty', 'Lip Enhancement');
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.fillClientDetails({
      firstName: 'Emma',
      lastName: 'Davis',
      email: 'emma.davis@example.com',
      phone: '+1234567890'
    });
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.proceedToNextStep();

    // Apply gift card
    await bookingPage.applyGiftCard('GIFT-123456789');
    await bookingPage.verifyGiftCardApplied(50.00);

    // Verify remaining balance
    await expect(page.locator('[data-testid="remaining-balance"]')).toContainText('$50.00');

    // Select card payment for remaining balance
    await bookingPage.selectPaymentMethod('card');
    await bookingPage.fillPaymentDetails({
      cardNumber: '4242424242424242',
      expiryDate: '12/25',
      cvv: '123',
      postalCode: '12345'
    });

    await bookingPage.confirmBooking();
    await bookingPage.verifyBookingConfirmation();

    // Verify split payment confirmation
    await expect(page.locator('[data-testid="gift-card-applied"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-payment-applied"]')).toBeVisible();
  });

  test('invalid gift card handling', async ({ page }) => {
    // Mock invalid gift card
    await page.route('**/api/validate-gift-card**', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'Invalid gift card code.',
            code: 'invalid_gift_card'
          }
        })
      });
    });

    await page.goto('/');
    await bookingPage.startBookingFromHomepage();
    await bookingPage.selectService('beauty', 'Lip Enhancement');
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.fillClientDetails({
      firstName: 'Ryan',
      lastName: 'Taylor',
      email: 'ryan.taylor@example.com',
      phone: '+1234567890'
    });
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.proceedToNextStep();

    // Try to apply invalid gift card
    await bookingPage.applyGiftCard('INVALID-CARD');

    // Verify error handling
    await expect(page.locator('[data-testid="gift-card-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid gift card code');

    // Continue with regular payment
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

  test('payment retry after initial failure', async ({ page }) => {
    let attemptCount = 0;

    // Mock payment that fails on first attempt, succeeds on second
    await page.unroute('**/api/confirm-payment**');
    await page.route('**/api/confirm-payment**', (route) => {
      attemptCount++;
      if (attemptCount === 1) {
        route.fulfill({
          status: 402,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: 'Payment failed.',
              type: 'card_error',
              code: 'transaction_declined'
            }
          })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'succeeded',
            bookingId: 'booking_retry_success'
          })
        });
      }
    });

    await page.goto('/');
    await bookingPage.startBookingFromHomepage();
    await bookingPage.selectService('beauty', 'Lip Enhancement');
    await bookingPage.selectFirstAvailableDate();
    await bookingPage.selectFirstAvailableTime();
    await bookingPage.fillClientDetails({
      firstName: 'Chris',
      lastName: 'Martin',
      email: 'chris.martin@example.com',
      phone: '+1234567890'
    });
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.proceedToNextStep();

    await bookingPage.selectPaymentMethod('card');
    await bookingPage.fillPaymentDetails({
      cardNumber: '4000000000000341', // Test card that requires retry
      expiryDate: '12/25',
      cvv: '123',
      postalCode: '12345'
    });

    // First attempt fails
    await bookingPage.confirmBooking();
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();

    // Retry payment
    await page.locator('button:has-text("Try Again")').click();
    await bookingPage.confirmBooking();

    // Second attempt succeeds
    await bookingPage.verifyBookingConfirmation();
    await expect(page.locator('[data-testid="booking-reference"]')).toContainText('booking_retry_success');
  });
});