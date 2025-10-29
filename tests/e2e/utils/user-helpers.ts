import { Page } from '@playwright/test';

import { TestHelpers } from './test-helpers';
import { PolishPhoneNumbers, TestEmails } from './test-data';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  preferences?: {
    beauty: boolean;
    fitness: boolean;
    newsletters: boolean;
    smsNotifications: boolean;
    promotions: boolean;
  };
  consents?: {
    terms: boolean;
    privacy: boolean;
    marketing: boolean;
    gdpr: boolean;
  };
}

export class UserHelpers extends TestHelpers {
  constructor(page: Page) {
    super(page);
  }

  // Navigate to registration page
  async navigateToRegistration() {
    await this.navigateTo('/register');
    await this.waitForPageLoad();
  }

  // Navigate to login page
  async navigateToLogin() {
    await this.navigateTo('/login');
    await this.waitForPageLoad();
  }

  // Navigate to profile page
  async navigateToProfile() {
    await this.navigateTo('/profile');
    await this.waitForPageLoad();
  }

  // Complete user registration
  async registerUser(profile: Partial<UserProfile>, options?: {
    skipEmailVerification?: boolean;
    skipPhoneVerification?: boolean;
    skipConsents?: boolean;
  }) {
    const {
      skipEmailVerification = false,
      skipPhoneVerification = false,
      skipConsents = false,
    } = options || {};

    const fullProfile = this.createFullProfile(profile);

    await this.navigateToRegistration();

    // Fill in basic information
    await this.fillRegistrationForm(fullProfile);

    // Handle consents if not skipped
    if (!skipConsents) {
      await this.handleRegistrationConsents(fullProfile.consents || {});
    }

    // Submit registration
    await this.submitRegistration();

    // Handle email verification if not skipped
    if (!skipEmailVerification) {
      await this.handleEmailVerification(fullProfile.email);
    }

    // Handle phone verification if not skipped
    if (!skipPhoneVerification) {
      await this.handlePhoneVerification(fullProfile.phone);
    }

    // Verify successful registration
    await this.verifyRegistrationSuccess();

    return fullProfile;
  }

  // Create full user profile with defaults
  private createFullProfile(profile: Partial<UserProfile>): UserProfile {
    const timestamp = Date.now();
    return {
      name: profile.name || 'Test User',
      email: profile.email || `test+${timestamp}@example.com`,
      phone: profile.phone || '+48 123 456 789',
      preferences: {
        beauty: true,
        fitness: false,
        newsletters: false,
        smsNotifications: false,
        promotions: false,
        ...profile.preferences,
      },
      consents: {
        terms: true,
        privacy: true,
        marketing: false,
        gdpr: true,
        ...profile.consents,
      },
    };
  }

  // Fill registration form
  private async fillRegistrationForm(profile: UserProfile) {
    // Basic information
    await this.page.getByLabel(/name|full name/i).fill(profile.name);
    await this.page.getByLabel(/email/i).fill(profile.email);
    await this.page.getByLabel(/phone/i).fill(profile.phone);

    // Password
    const passwordField = this.page.getByLabel(/password/i);
    if (await passwordField.isVisible()) {
      await passwordField.fill('TestPassword123!');
    }

    // Confirm password
    const confirmPasswordField = this.page.getByLabel(/confirm password/i);
    if (await confirmPasswordField.isVisible()) {
      await confirmPasswordField.fill('TestPassword123!');
    }

    console.log('✅ Registration form filled');
  }

  // Handle registration consents
  private async handleRegistrationConsents(consents: UserProfile['consents']) {
    // Terms and conditions
    if (consents.terms) {
      const termsCheckbox = this.page.getByLabel(/terms and conditions|agree to terms/i);
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }
    }

    // Privacy policy
    if (consents.privacy) {
      const privacyCheckbox = this.page.getByLabel(/privacy policy/i);
      if (await privacyCheckbox.isVisible()) {
        await privacyCheckbox.check();
      }
    }

    // Marketing consents
    if (consents.marketing) {
      const marketingCheckbox = this.page.getByLabel(/marketing|promotions/i);
      if (await marketingCheckbox.isVisible()) {
        await marketingCheckbox.check();
      }
    }

    // GDPR consent
    if (consents.gdpr) {
      const gdprCheckbox = this.page.getByLabel(/gdpr|data processing/i);
      if (await gdprCheckbox.isVisible()) {
        await gdprCheckbox.check();
      }
    }

    console.log('✅ Registration consents handled');
  }

  // Submit registration
  private async submitRegistration() {
    const submitButton = this.page.getByRole('button', {
      name: /register|create account|sign up/i
    });

    await submitButton.click();
    console.log('✅ Registration submitted');
  }

  // Handle email verification
  private async handleEmailVerification(_email: string) {
    // Look for email verification prompt
    const verificationPrompt = this.page.getByText(/verification email sent|check your email/i);
    if (await verificationPrompt.isVisible()) {
      console.log('📧 Email verification required');

      // Look for verification code input
      const verificationInput = this.page.getByLabel(/verification code|code/i);
      if (await verificationInput.isVisible()) {
        // In a real implementation, you might:
        // 1. Use an email testing service to get the code
        // 2. Mock the email verification endpoint
        // 3. Use a predetermined test code

        await verificationInput.fill('123456'); // Test code

        const verifyButton = this.page.getByRole('button', {
          name: /verify|confirm/i
        });
        await verifyButton.click();

        console.log('✅ Email verification completed');
      }
    }
  }

  // Handle phone verification
  private async handlePhoneVerification(_phone: string) {
    // Look for phone verification prompt
    const phoneVerificationPrompt = this.page.getByText(/phone verification|sms sent/i);
    if (await phoneVerificationPrompt.isVisible()) {
      console.log('📱 Phone verification required');

      const phoneVerificationInput = this.page.getByLabel(/phone code|sms code/i);
      if (await phoneVerificationInput.isVisible()) {
        await phoneVerificationInput.fill('654321'); // Test code

        const verifyPhoneButton = this.page.getByRole('button', {
          name: /verify phone|confirm phone/i
        });
        await verifyPhoneButton.click();

        console.log('✅ Phone verification completed');
      }
    }
  }

  // Verify registration success
  private async verifyRegistrationSuccess() {
    await this.expectTextToBeVisible(/registration complete|welcome|account created/i);

    // Check for profile redirection
    await this.page.waitForURL(/profile|dashboard/);

    console.log('✅ Registration successful');
  }

  // Login user
  async loginUser(email: string, password: string = 'TestPassword123!') {
    await this.navigateToLogin();

    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);

    const loginButton = this.page.getByRole('button', {
      name: /login|sign in/i
    });
    await loginButton.click();

    await this.page.waitForURL(/profile|dashboard/);

    console.log('✅ User logged in successfully');
  }

  // Logout user
  async logoutUser() {
    // Look for logout button/menu
    const logoutButton = this.page.getByRole('button', { name: /logout|sign out/i });
    const profileMenu = this.page.getByRole('button', { name: /profile|account/i });

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else if (await profileMenu.isVisible()) {
      await profileMenu.click();
      await this.page.waitForTimeout(500);
      const logoutInMenu = this.page.getByRole('menuitem', { name: /logout|sign out/i });
      await logoutInMenu.click();
    }

    await this.page.waitForURL(/login|home/);

    console.log('✅ User logged out successfully');
  }

  // Update user profile
  async updateProfile(updates: Partial<UserProfile>) {
    await this.navigateToProfile();

    // Edit profile
    const editButton = this.page.getByRole('button', { name: /edit profile|update profile/i });
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    // Update fields
    if (updates.name) {
      await this.page.getByLabel(/name/i).fill(updates.name);
    }

    if (updates.phone) {
      await this.page.getByLabel(/phone/i).fill(updates.phone);
    }

    // Update preferences
    if (updates.preferences) {
      await this.updatePreferences(updates.preferences);
    }

    // Save changes
    const saveButton = this.page.getByRole('button', { name: /save|update/i });
    await saveButton.click();

    await this.expectTextToBeVisible(/profile updated|changes saved/i);

    console.log('✅ Profile updated successfully');
  }

  // Update user preferences
  private async updatePreferences(preferences: UserProfile['preferences']) {
    // Beauty preference
    if (preferences.beauty !== undefined) {
      const beautyToggle = this.page.getByLabel(/beauty|beauty services/i);
      if (await beautyToggle.isVisible()) {
        if (preferences.beauty && !(await beautyToggle.isChecked())) {
          await beautyToggle.check();
        } else if (!preferences.beauty && await beautyToggle.isChecked()) {
          await beautyToggle.uncheck();
        }
      }
    }

    // Fitness preference
    if (preferences.fitness !== undefined) {
      const fitnessToggle = this.page.getByLabel(/fitness|fitness services/i);
      if (await fitnessToggle.isVisible()) {
        if (preferences.fitness && !(await fitnessToggle.isChecked())) {
          await fitnessToggle.check();
        } else if (!preferences.fitness && await fitnessToggle.isChecked()) {
          await fitnessToggle.uncheck();
        }
      }
    }

    // Newsletter preference
    if (preferences.newsletters !== undefined) {
      const newsletterToggle = this.page.getByLabel(/newsletter/i);
      if (await newsletterToggle.isVisible()) {
        if (preferences.newsletters && !(await newsletterToggle.isChecked())) {
          await newsletterToggle.check();
        } else if (!preferences.newsletters && await newsletterToggle.isChecked()) {
          await newsletterToggle.uncheck();
        }
      }
    }

    // SMS notifications
    if (preferences.smsNotifications !== undefined) {
      const smsToggle = this.page.getByLabel(/sms notifications/i);
      if (await smsToggle.isVisible()) {
        if (preferences.smsNotifications && !(await smsToggle.isChecked())) {
          await smsToggle.check();
        } else if (!preferences.smsNotifications && await smsToggle.isChecked()) {
          await smsToggle.uncheck();
        }
      }
    }

    // Promotions
    if (preferences.promotions !== undefined) {
      const promotionsToggle = this.page.getByLabel(/promotions|special offers/i);
      if (await promotionsToggle.isVisible()) {
        if (preferences.promotions && !(await promotionsToggle.isChecked())) {
          await promotionsToggle.check();
        } else if (!preferences.promotions && await promotionsToggle.isChecked()) {
          await promotionsToggle.uncheck();
        }
      }
    }

    console.log('✅ Preferences updated');
  }

  // Test registration validation
  async testRegistrationValidation() {
    await this.navigateToRegistration();

    // Test invalid emails
    for (const email of TestEmails.invalid) {
      await this.page.getByLabel(/email/i).fill(email);
      await this.page.getByLabel(/password/i).click(); // Trigger validation
      await this.page.waitForTimeout(500);

      const errorElement = this.page.getByText(/invalid email/i);
      if (await errorElement.isVisible()) {
        console.log(`✅ Invalid email rejected: ${email}`);
      }
    }

    // Test invalid phone numbers
    for (const phone of PolishPhoneNumbers.invalid) {
      await this.page.getByLabel(/phone/i).fill(phone);
      await this.page.getByLabel(/email/i).click(); // Trigger validation
      await this.page.waitForTimeout(500);

      const errorElement = this.page.getByText(/invalid phone/i);
      if (await errorElement.isVisible()) {
        console.log(`✅ Invalid phone rejected: ${phone}`);
      }
    }

    // Test password strength
    await this.page.getByLabel(/password/i).fill('123'); // Weak password
    await this.page.getByLabel(/confirm password/i).click();

    const passwordError = this.page.getByText(/password too weak|password must contain/i);
    if (await passwordError.isVisible()) {
      console.log('✅ Password strength validation working');
    }

    // Test required fields
    await this.page.getByLabel(/email/i).fill('');
    await this.page.getByLabel(/password/i).fill('');
    const submitButton = this.page.getByRole('button', { name: /register/i });
    await submitButton.click();

    const requiredError = this.page.getByText(/required|field is required/i);
    if (await requiredError.isVisible()) {
      console.log('✅ Required field validation working');
    }

    console.log('✅ Registration validation tests completed');
  }

  // Test Polish phone number formats in registration
  async testPolishPhoneValidation() {
    await this.navigateToRegistration();

    // Test valid Polish phone numbers
    for (const phoneNumber of PolishPhoneNumbers.valid) {
      await this.page.getByLabel(/phone/i).fill(phoneNumber);
      await this.page.getByLabel(/email/i).click(); // Trigger validation
      await this.page.waitForTimeout(500);

      const errorElement = this.page.getByText(/invalid phone/i);
      if (!(await errorElement.isVisible())) {
        console.log(`✅ Valid Polish phone number accepted: ${phoneNumber}`);
      }
    }

    console.log('✅ Polish phone number validation completed');
  }

  // Test password reset
  async testPasswordReset(email: string) {
    await this.navigateToLogin();

    // Click forgot password
    const forgotPasswordLink = this.page.getByRole('link', { name: /forgot password/i });
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();

      // Enter email
      await this.page.getByLabel(/email/i).fill(email);

      // Submit reset request
      const resetButton = this.page.getByRole('button', { name: /reset password|send reset/i });
      await resetButton.click();

      await this.expectTextToBeVisible(/reset email sent|check your email/i);
      console.log('✅ Password reset flow working');
    } else {
      console.log('⚠️  Forgot password link not found');
    }
  }

  // Test consent management
  async testConsentManagement() {
    await this.navigateToProfile();

    // Look for consent management section
    const consentSection = this.page.locator('[data-testid="consent-management"]');
    if (await consentSection.isVisible()) {
      console.log('✅ Consent management section found');

      // Test updating marketing consent
      const marketingToggle = this.page.getByLabel(/marketing|promotional emails/i);
      if (await marketingToggle.isVisible()) {
        const initialState = await marketingToggle.isChecked();
        await marketingToggle.click();
        await this.page.waitForTimeout(1000);

        const newState = await marketingToggle.isChecked();
        if (newState !== initialState) {
          console.log('✅ Marketing consent updated successfully');
        }
      }

      // Test updating privacy settings
      const privacySettings = this.page.getByRole('button', { name: /privacy settings/i });
      if (await privacySettings.isVisible()) {
        await privacySettings.click();

        const dataProcessingToggle = this.page.getByLabel(/data processing|analytics/i);
        if (await dataProcessingToggle.isVisible()) {
          await dataProcessingToggle.click();
          console.log('✅ Privacy settings updated');
        }
      }
    } else {
      console.log('⚠️  Consent management section not found');
    }
  }

  // Test profile picture upload
  async testProfilePictureUpload() {
    await this.navigateToProfile();

    const uploadButton = this.page.getByRole('button', { name: /upload photo|change picture/i });
    if (await uploadButton.isVisible()) {
      // Create a test image file
      const testImagePath = 'tests/fixtures/test-profile-picture.jpg';

      // Upload file
      const fileInput = this.page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles(testImagePath);

        // Wait for upload processing
        await this.page.waitForTimeout(2000);

        // Check if image is displayed
        const profileImage = this.page.locator('[data-testid="profile-image"]');
        if (await profileImage.isVisible()) {
          console.log('✅ Profile picture uploaded successfully');
        }
      }
    } else {
      console.log('⚠️  Profile picture upload not available');
    }
  }

  // Test account deletion
  async testAccountDeletion() {
    await this.navigateToProfile();

    // Look for account deletion option
    const deleteAccountButton = this.page.getByRole('button', { name: /delete account/i });
    if (await deleteAccountButton.isVisible()) {
      await deleteAccountButton.click();

      // Should show confirmation dialog
      const confirmDialog = this.page.getByRole('dialog');
      if (await confirmDialog.isVisible()) {
        // Type confirmation phrase
        const confirmInput = this.page.getByLabel(/type.*delete.*confirm/i);
        if (await confirmInput.isVisible()) {
          await confirmInput.fill('DELETE');
        }

        // Confirm deletion
        const confirmButton = this.page.getByRole('button', { name: /delete.*account/i });
        await confirmButton.click();

        await this.expectTextToBeVisible(/account deleted|deletion complete/i);
        console.log('✅ Account deletion flow working');
      }
    } else {
      console.log('⚠️  Account deletion option not found');
    }
  }

  // Get user profile information from the page
  async getUserProfileFromPage(): Promise<Partial<UserProfile>> {
    await this.navigateToProfile();

    const profile: Partial<UserProfile> = {};

    // Get name
    const nameElement = this.page.locator('[data-testid="user-name"]');
    if (await nameElement.isVisible()) {
      profile.name = await nameElement.textContent() || undefined;
    }

    // Get email
    const emailElement = this.page.locator('[data-testid="user-email"]');
    if (await emailElement.isVisible()) {
      profile.email = await emailElement.textContent() || undefined;
    }

    // Get phone
    const phoneElement = this.page.locator('[data-testid="user-phone"]');
    if (await phoneElement.isVisible()) {
      profile.phone = await phoneElement.textContent() || undefined;
    }

    return profile;
  }
}
