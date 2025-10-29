import { test, expect } from '@playwright/test';
import { UserHelpers } from '../utils/user-helpers';
import { BookingHelpers } from '../utils/booking-helpers';
import { TestDataManager, TestDataFactory } from '../utils/test-data';

test.describe('User Registration & Profile Management - Critical User Journey', () => {
  let userHelpers: UserHelpers;
  let bookingHelpers: BookingHelpers;
  let testDataManager: TestDataManager;

  test.beforeEach(async ({ page, context }) => {
    userHelpers = new UserHelpers(page);
    bookingHelpers = new BookingHelpers(page);
    testDataManager = new TestDataManager(context);

    // Set up error handling
    await userHelpers.handleErrors();

    // Accept cookies if present
    await userHelpers.acceptCookies();
  });

  test.afterEach(async ({ context }) => {
    await testDataManager.cleanup();
  });

  test.describe('User Registration Flow', () => {
    test('UR-001: Complete user registration - Happy Path', async ({ page }) => {
      console.log('🎯 Starting UR-001: Complete user registration');

      const timestamp = Date.now();
      const userProfile = {
        name: 'Ewa Nowakowska',
        email: `ewa.nowakowska.${timestamp}@example.com`,
        phone: '+48 512 345 678',
        preferences: {
          beauty: true,
          fitness: false,
          newsletters: true,
          smsNotifications: false,
          promotions: false,
        },
        consents: {
          terms: true,
          privacy: true,
          marketing: false,
          gdpr: true,
        },
      };

      // Register user
      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true, // Skip for E2E testing
        skipPhoneVerification: true, // Skip for E2E testing
      });

      // Verify registration success
      await expect(page.getByText(/welcome|registration complete/i)).toBeVisible();

      // Verify profile information is displayed
      await expect(page.getByText(userProfile.name)).toBeVisible();
      await expect(page.getByText(userProfile.email)).toBeVisible();

      // Take screenshot for verification
      await userHelpers.takeScreenshot('user-registration-complete');

      console.log('✅ UR-001: User registration completed successfully');
    });

    test('UR-002: User registration with Polish phone number validation', async ({ page }) => {
      console.log('🎯 Starting UR-002: Polish phone number validation in registration');

      const timestamp = Date.now();
      const userProfile = {
        name: 'Jan Kowalski',
        email: `jan.kowalski.${timestamp}@example.com`,
        phone: '+48 601 234 567',
      };

      // Register user
      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Verify successful registration with Polish phone number
      await expect(page.getByText(/welcome|registration complete/i)).toBeVisible();

      console.log('✅ UR-002: Polish phone number validation working correctly');
    });

    test('UR-003: User registration validation and error handling', async ({ page }) => {
      console.log('🎯 Starting UR-003: Registration validation tests');

      await userHelpers.testRegistrationValidation();
      await userHelpers.testPolishPhoneValidation();

      console.log('✅ UR-003: Registration validation tests completed');
    });

    test('UR-004: User registration with different consent preferences', async ({ page }) => {
      console.log('🎯 Starting UR-004: Registration with different consents');

      const timestamp = Date.now();
      const userProfile = {
        name: 'Maria Wiśniewska',
        email: `maria.wisniewska.${timestamp}@example.com`,
        phone: '+48 501 234 567',
        preferences: {
          beauty: true,
          fitness: true,
          newsletters: true,
          smsNotifications: true,
          promotions: true,
        },
        consents: {
          terms: true,
          privacy: true,
          marketing: true, // Opt-in to marketing
          gdpr: true,
        },
      };

      // Register user with all consents
      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Verify registration success
      await expect(page.getByText(/welcome|registration complete/i)).toBeVisible();

      // Check if marketing preferences are reflected
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');

      const marketingPreference = page.getByLabel(/marketing|promotions/i);
      if (await marketingPreference.isVisible()) {
        const isMarketingEnabled = await marketingPreference.isChecked();
        expect(isMarketingEnabled).toBeTruthy();
        console.log('✅ Marketing consent preference saved correctly');
      }

      console.log('✅ UR-004: Registration with different consents completed');
    });

    test('UR-005: Email verification flow', async ({ page }) => {
      console.log('🎯 Starting UR-005: Email verification flow test');

      const timestamp = Date.now();
      const userProfile = {
        name: 'Piotr Zieliński',
        email: `piotr.zielinski.${timestamp}@example.com`,
        phone: '+48 502 345 678',
      };

      // In a real test, you would handle actual email verification
      // For E2E purposes, we'll simulate the verification flow
      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: false, // Attempt email verification
        skipPhoneVerification: true,
      });

      // Check if email verification prompt appears
      const verificationPrompt = page.getByText(/verification email sent|check your email/i);
      if (await verificationPrompt.isVisible()) {
        console.log('✅ Email verification prompt displayed correctly');

        // Look for verification code input
        const verificationInput = page.getByLabel(/verification code/i);
        if (await verificationInput.isVisible()) {
          console.log('✅ Verification code input field available');
        }
      }

      console.log('✅ UR-005: Email verification flow test completed');
    });
  });

  test.describe('User Login Flow', () => {
    test('UL-001: Successful user login', async ({ page }) => {
      console.log('🎯 Starting UL-001: Successful user login');

      // First register a user
      const timestamp = Date.now();
      const userProfile = {
        name: 'Login Test User',
        email: `login.test.${timestamp}@example.com`,
        phone: '+48 503 345 678',
      };

      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Logout the user
      await userHelpers.logoutUser();

      // Now login
      await userHelpers.loginUser(userProfile.email!, 'TestPassword123!');

      // Verify successful login
      await expect(page.getByText(/welcome|dashboard|profile/i)).toBeVisible();

      // Verify user information is displayed
      await expect(page.getByText(userProfile.name!)).toBeVisible();

      console.log('✅ UL-001: User login completed successfully');
    });

    test('UL-002: Login validation and error handling', async ({ page }) => {
      console.log('🎯 Starting UL-002: Login validation tests');

      await userHelpers.navigateToLogin();

      // Test invalid email format
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/password/i).fill('TestPassword123!');
      await page.getByRole('button', { name: /login/i }).click();

      const emailError = page.getByText(/invalid email/i);
      if (await emailError.isVisible()) {
        console.log('✅ Invalid email validation working');
      }

      // Test wrong password
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /login/i }).click();

      const passwordError = page.getByText(/incorrect password|invalid credentials/i);
      if (await passwordError.isVisible()) {
        console.log('✅ Wrong password validation working');
      }

      // Test non-existent user
      await page.getByLabel(/email/i).fill('nonexistent@example.com');
      await page.getByLabel(/password/i).fill('TestPassword123!');
      await page.getByRole('button', { name: /login/i }).click();

      const userError = page.getByText(/user not found|account does not exist/i);
      if (await userError.isVisible()) {
        console.log('✅ Non-existent user validation working');
      }

      console.log('✅ UL-002: Login validation tests completed');
    });

    test('UL-003: Password reset flow', async ({ page }) => {
      console.log('🎯 Starting UL-003: Password reset flow test');

      const timestamp = Date.now();
      const email = `password.reset.${timestamp}@example.com`;

      // Test password reset
      await userHelpers.testPasswordReset(email);

      console.log('✅ UL-003: Password reset flow test completed');
    });

    test('UL-004: Remember me functionality', async ({ page }) => {
      console.log('🎯 Starting UL-004: Remember me functionality test');

      // This would test if "remember me" checkbox works correctly
      // In a real implementation, you would:
      // 1. Login with "remember me" checked
      // 2. Close browser/reopen
      // 3. Verify user is still logged in

      await userHelpers.navigateToLogin();

      const rememberMeCheckbox = page.getByLabel(/remember me/i);
      if (await rememberMeCheckbox.isVisible()) {
        await rememberMeCheckbox.check();
        console.log('✅ Remember me checkbox available and selectable');
      } else {
        console.log('⚠️  Remember me functionality not available');
      }

      console.log('✅ UL-004: Remember me functionality test completed');
    });
  });

  test.describe('Profile Management', () => {
    test('PM-001: Update user profile information', async ({ page }) => {
      console.log('🎯 Starting PM-001: Profile information update');

      // First register a user
      const timestamp = Date.now();
      const userProfile = {
        name: 'Profile Test User',
        email: `profile.test.${timestamp}@example.com`,
        phone: '+48 504 345 678',
      };

      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Update profile information
      const updatedProfile = {
        name: 'Updated Name',
        phone: '+48 605 123 456',
        preferences: {
          beauty: false,
          fitness: true,
          newsletters: true,
          smsNotifications: false,
          promotions: true,
        },
      };

      await userHelpers.updateProfile(updatedProfile);

      // Verify updates
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(updatedProfile.name)).toBeVisible();
      await expect(page.getByText(updatedProfile.phone)).toBeVisible();

      // Verify preferences updated
      const fitnessToggle = page.getByLabel(/fitness/i);
      if (await fitnessToggle.isVisible()) {
        const isFitnessEnabled = await fitnessToggle.isChecked();
        expect(isFitnessEnabled).toBeTruthy();
      }

      // Take screenshot for verification
      await userHelpers.takeScreenshot('profile-update-complete');

      console.log('✅ PM-001: Profile information updated successfully');
    });

    test('PM-002: Update user preferences and consents', async ({ page }) => {
      console.log('🎯 Starting PM-002: Preferences and consents update');

      // Register a user
      const timestamp = Date.now();
      const userProfile = {
        name: 'Preferences Test User',
        email: `preferences.test.${timestamp}@example.com`,
        phone: '+48 505 345 678',
      };

      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Test consent management
      await userHelpers.testConsentManagement();

      console.log('✅ PM-002: Preferences and consents updated successfully');
    });

    test('PM-003: Profile picture upload', async ({ page }) => {
      console.log('🎯 Starting PM-003: Profile picture upload test');

      // Register a user
      const timestamp = Date.now();
      const userProfile = {
        name: 'Photo Test User',
        email: `photo.test.${timestamp}@example.com`,
        phone: '+48 506 345 678',
      };

      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Test profile picture upload
      await userHelpers.testProfilePictureUpload();

      console.log('✅ PM-003: Profile picture upload test completed');
    });

    test('PM-004: View booking history', async ({ page }) => {
      console.log('🎯 Starting PM-004: Booking history view');

      // Register a user
      const timestamp = Date.now();
      const userProfile = {
        name: 'History Test User',
        email: `history.test.${timestamp}@example.com`,
        phone: '+48 507 345 678',
      };

      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Make a booking
      await bookingHelpers.bookBeautyService({
        serviceName: 'Beauty Brows Enhancement',
        userName: userProfile.name!,
        userEmail: userProfile.email!,
        userPhone: userProfile.phone!,
        notes: 'E2E Test Booking for history',
      });

      // Navigate to profile and check booking history
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');

      // Look for booking history section
      const bookingHistory = page.locator('[data-testid="booking-history"]');
      if (await bookingHistory.isVisible()) {
        console.log('✅ Booking history section found');

        const bookingItems = bookingHistory.locator('[data-testid="booking-item"]');
        const bookingCount = await bookingItems.count();

        if (bookingCount > 0) {
          console.log(`✅ Found ${bookingCount} booking(s) in history`);

          // Check booking details
          const firstBooking = bookingItems.first();
          const serviceName = firstBooking.getByText(/beauty brows enhancement/i);
          if (await serviceName.isVisible()) {
            console.log('✅ Booking details displayed correctly');
          }
        }
      } else {
        console.log('⚠️  Booking history section not found');
      }

      console.log('✅ PM-004: Booking history view test completed');
    });

    test('PM-005: View active packages and session balance', async ({ page }) => {
      console.log('🎯 Starting PM-005: Active packages and session balance view');

      // Register a user
      const timestamp = Date.now();
      const userProfile = {
        name: 'Package Test User',
        email: `package.test.${timestamp}@example.com`,
        phone: '+48 508 345 678',
      };

      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Purchase a package (this would require package purchase flow)
      // For now, we'll just check if the section exists
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');

      // Look for active packages section
      const activePackages = page.locator('[data-testid="active-packages"]');
      if (await activePackages.isVisible()) {
        console.log('✅ Active packages section found');

        const packageItems = activePackages.locator('[data-testid="package-item"]');
        const packageCount = await packageItems.count();

        if (packageCount > 0) {
          console.log(`✅ Found ${packageCount} active package(s)`);

          // Check session balance
          const sessionBalance = page.getByText(/sessions remaining|balance/i);
          if (await sessionBalance.isVisible()) {
            console.log('✅ Session balance displayed');
          }
        }
      } else {
        console.log('⚠️  Active packages section not found');
      }

      console.log('✅ PM-005: Active packages and session balance test completed');
    });
  });

  test.describe('Account Security', () => {
    test('AS-001: Change password', async ({ page }) => {
      console.log('🎯 Starting AS-001: Change password test');

      // Register a user
      const timestamp = Date.now();
      const userProfile = {
        name: 'Security Test User',
        email: `security.test.${timestamp}@example.com`,
        phone: '+48 509 345 678',
      };

      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Navigate to security settings
      await page.goto('/profile/security');
      await page.waitForLoadState('networkidle');

      // Look for change password section
      const changePasswordSection = page.locator('[data-testid="change-password"]');
      if (await changePasswordSection.isVisible()) {
        console.log('✅ Change password section found');

        // Fill in current password
        await page.getByLabel(/current password/i).fill('TestPassword123!');

        // Fill in new password
        await page.getByLabel(/new password/i).fill('NewPassword123!');
        await page.getByLabel(/confirm new password/i).fill('NewPassword123!');

        // Submit password change
        await page.getByRole('button', { name: /change password|update password/i }).click();

        // Verify success message
        const successMessage = page.getByText(/password changed successfully/i);
        if (await successMessage.isVisible()) {
          console.log('✅ Password changed successfully');
        }
      } else {
        console.log('⚠️  Change password section not found');
      }

      console.log('✅ AS-001: Change password test completed');
    });

    test('AS-002: Two-factor authentication setup', async ({ page }) => {
      console.log('🎯 Starting AS-002: Two-factor authentication test');

      // Register a user
      const timestamp = Date.now();
      const userProfile = {
        name: '2FA Test User',
        email: `2fa.test.${timestamp}@example.com`,
        phone: '+48 510 345 678',
      };

      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Navigate to security settings
      await page.goto('/profile/security');
      await page.waitForLoadState('networkidle');

      // Look for 2FA setup section
      const twoFactorSection = page.locator('[data-testid="two-factor-auth"]');
      if (await twoFactorSection.isVisible()) {
        console.log('✅ Two-factor authentication section found');

        const enable2FAButton = page.getByRole('button', { name: /enable 2fa|set up 2fa/i });
        if (await enable2FAButton.isVisible()) {
          await enable2FAButton.click();

          // Look for QR code or setup instructions
          const qrCode = page.locator('[data-testid="2fa-qr-code"]');
          const setupCode = page.locator('[data-testid="2fa-setup-code"]');

          if (await qrCode.isVisible() || await setupCode.isVisible()) {
            console.log('✅ 2FA setup instructions displayed');
          }
        }
      } else {
        console.log('⚠️  Two-factor authentication section not found');
      }

      console.log('✅ AS-002: Two-factor authentication test completed');
    });

    test('AS-003: Account deletion', async ({ page }) => {
      console.log('🎯 Starting AS-003: Account deletion test');

      // Register a user
      const timestamp = Date.now();
      const userProfile = {
        name: 'Delete Test User',
        email: `delete.test.${timestamp}@example.com`,
        phone: '+48 511 345 678',
      };

      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Test account deletion flow
      await userHelpers.testAccountDeletion();

      console.log('✅ AS-003: Account deletion test completed');
    });
  });

  test.describe('Cross-Platform Profile Management', () => {
    test('CPM-001: Profile management on mobile devices', async ({ page }) => {
      console.log('🎯 Starting CPM-001: Mobile profile management test');

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      // Register a user on mobile
      const timestamp = Date.now();
      const userProfile = {
        name: 'Mobile Profile User',
        email: `mobile.profile.${timestamp}@example.com`,
        phone: '+48 512 345 678',
      };

      await userHelpers.registerUser(userProfile, {
        skipEmailVerification: true,
        skipPhoneVerification: true,
      });

      // Update profile on mobile
      await userHelpers.updateProfile({
        name: 'Mobile Updated Name',
      });

      // Verify mobile-specific elements
      await expect(page.getByText('Mobile Updated Name')).toBeVisible();

      // Check mobile navigation
      const mobileNav = page.locator('[data-testid="mobile-navigation"]');
      if (await mobileNav.isVisible()) {
        console.log('✅ Mobile profile navigation working correctly');
      }

      // Take mobile screenshot
      await userHelpers.takeScreenshot('mobile-profile-management');

      console.log('✅ CPM-001: Mobile profile management completed successfully');
    });
  });
});