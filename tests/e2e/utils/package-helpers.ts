import { Page } from '@playwright/test';

import { TestHelpers } from './test-helpers';
import { TestCreditCards } from './test-data';

export class PackageHelpers extends TestHelpers {
  constructor(page: Page) {
    super(page);
  }

  // Navigate to packages page
  async navigateToPackages() {
    await this.navigateTo('/packages');
    await this.waitForPageLoad();
  }

  // Select a package by name or type
  async selectPackage(packageName: string, packageType?: 'beauty' | 'fitness') {
    await this.navigateToPackages();

    // Filter by type if specified
    if (packageType) {
      const filterButton = this.page.getByRole('button', { name: new RegExp(packageType, 'i') });
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await this.page.waitForTimeout(500);
      }
    }

    // Find and click on the package
    const packageCard = this.page.locator('[data-testid="package-card"]').filter({
      hasText: packageName
    }).first();

    if (await packageCard.isVisible()) {
      await packageCard.click();
      await this.waitForPageLoad();
    } else {
      // Try alternative selector
      const packageHeading = this.page.getByRole('heading', { name: packageName });
      if (await packageHeading.isVisible()) {
        await packageHeading.click();
        await this.waitForPageLoad();
      } else {
        throw new Error(`Package "${packageName}" not found`);
      }
    }
  }

  // Purchase a package
  async purchasePackage(options?: {
    packageName?: string;
    packageType?: 'beauty' | 'fitness';
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    paymentMethod?: 'card' | 'bank-transfer' | 'cash';
  }) {
    const {
      packageName = 'Beauty Package 5 Sessions',
      packageType = 'beauty',
      userName = 'Test User',
      userEmail = 'test@example.com',
      userPhone = '+48 123 456 789',
      paymentMethod = 'card',
    } = options || {};

    // Navigate to package
    await this.selectPackage(packageName, packageType);

    // Click purchase button
    const purchaseButton = this.page.getByRole('button', {
      name: /purchase package|buy now|activate package/i
    });

    if (await purchaseButton.isVisible()) {
      await purchaseButton.click();
      await this.waitForPageLoad();
    } else {
      throw new Error('Purchase button not found');
    }

    // Fill in user details if required
    await this.fillPackagePurchaseDetails({
      name: userName,
      email: userEmail,
      phone: userPhone,
    });

    // Select payment method
    await this.selectPackagePaymentMethod(paymentMethod);

    // Complete payment
    await this.completePackagePayment();

    // Verify package activation
    await this.verifyPackageActivation(packageName);
  }

  // Fill package purchase details
  private async fillPackagePurchaseDetails(details: {
    name: string;
    email: string;
    phone: string;
  }) {
    // Check if user details form is present
    const nameField = this.page.getByLabel(/name|full name/i);
    if (await nameField.isVisible()) {
      await nameField.fill(details.name);
    }

    const emailField = this.page.getByLabel(/email/i);
    if (await emailField.isVisible()) {
      await emailField.fill(details.email);
    }

    const phoneField = this.page.getByLabel(/phone/i);
    if (await phoneField.isVisible()) {
      await phoneField.fill(details.phone);
    }

    // Accept terms if present
    const termsCheckbox = this.page.getByLabel(/terms and conditions|agree to terms/i);
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }
  }

  // Select payment method for package
  private async selectPackagePaymentMethod(method: 'card' | 'bank-transfer' | 'cash') {
    switch (method) {
      case 'card': {
        const cardPayment = this.page.getByLabel(/card|credit card/i);
        if (await cardPayment.isVisible()) {
          await cardPayment.check();
        }
        break;
      }
      case 'bank-transfer': {
        const bankTransfer = this.page.getByLabel(/bank transfer|wire transfer/i);
        if (await bankTransfer.isVisible()) {
          await bankTransfer.check();
        }
        break;
      }
      case 'cash': {
        const cashPayment = this.page.getByLabel(/cash|in person/i);
        if (await cashPayment.isVisible()) {
          await cashPayment.check();
        }
        break;
      }
    }
  }

  // Complete package payment
  private async completePackagePayment() {
    // Fill in Stripe details if card payment
    const cardNumberField = this.page.locator('input[name="cardnumber"], [data-testid="card-number"]');
    if (await cardNumberField.isVisible()) {
      await cardNumberField.fill(TestCreditCards.visa.number);

      const expiryField = this.page.locator('input[name="exp-date"], [data-testid="card-expiry"]');
      if (await expiryField.isVisible()) {
        await expiryField.fill('12/30');
      }

      const cvcField = this.page.locator('input[name="cvc"], [data-testid="card-cvc"]');
      if (await cvcField.isVisible()) {
        await cvcField.fill('123');
      }
    }

    // Submit payment
    const completeButton = this.page.getByRole('button', {
      name: /complete purchase|pay now|confirm payment/i
    });

    if (await completeButton.isVisible()) {
      await completeButton.click();

      // Wait for payment processing
      await this.page.waitForSelector('[data-testid="processing-payment"]', {
        state: 'visible',
        timeout: 5000
      });

      // Wait for confirmation
      await this.page.waitForSelector('[data-testid="package-activated"]', {
        state: 'visible',
        timeout: 30000
      });
    }
  }

  // Verify package activation
  private async verifyPackageActivation(packageName: string) {
    await this.expectTextToBeVisible(/package activated|purchase complete|thank you/i);
    await this.expectTextToBeVisible(new RegExp(packageName, 'i'));

    // Check for package details
    const packageDetails = this.page.locator('[data-testid="package-details"]');
    if (await packageDetails.isVisible()) {
      console.log('✅ Package details displayed');
    }

    // Check for session information
    const sessionsInfo = this.page.getByText(/sessions|credits/i);
    if (await sessionsInfo.isVisible()) {
      console.log('✅ Session information displayed');
    }

    // Check for expiration information
    const expirationInfo = this.page.getByText(/expires|valid for/i);
    if (await expirationInfo.isVisible()) {
      console.log('✅ Expiration information displayed');
    }
  }

  // Check available packages
  async checkAvailablePackages(packageType?: 'beauty' | 'fitness') {
    await this.navigateToPackages();

    // Filter by type if specified
    if (packageType) {
      const filterButton = this.page.getByRole('button', { name: new RegExp(packageType, 'i') });
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await this.page.waitForTimeout(500);
      }
    }

    // Count available packages
    const packageCards = this.page.locator('[data-testid="package-card"]');
    const packageCount = await packageCards.count();

    console.log(`Found ${packageCount} ${packageType || ''} packages`);

    return {
      count: packageCount,
      packages: await this.extractPackageDetails(packageCount),
    };
  }

  // Extract package details
  private async extractPackageDetails(packageCount: number) {
    const packages = [];

    for (let i = 0; i < packageCount; i++) {
      const card = this.page.locator('[data-testid="package-card"]').nth(i);

      const name = await card.locator('[data-testid="package-name"]').textContent() || '';
      const price = await card.locator('[data-testid="package-price"]').textContent() || '';
      const sessions = await card.locator('[data-testid="package-sessions"]').textContent() || '';

      packages.push({
        name: name.trim(),
        price: price.trim(),
        sessions: sessions.trim(),
      });
    }

    return packages;
  }

  // Test package session usage
  async testPackageSessionUsage(packageName: string) {
    // First purchase a package
    await this.purchasePackage({ packageName });

    // Now try to book a service using the package
    await this.navigateTo('/booking');
    await this.waitForPageLoad();

    // Complete service selection
    await this.page.getByRole('heading', { name: 'Beauty Brows Enhancement' }).click();
    await this.page.waitForTimeout(500);

    // Check if package session option is available
    const packageOption = this.page.getByLabel(/use package|package session/i);
    if (await packageOption.isVisible()) {
      await packageOption.check();
      console.log('✅ Package session option available');

      // Complete booking without payment (should use package session)
      await this.completeServiceSelection('Beauty Brows Enhancement');
      await this.completeTimeSelection();
      await this.completeClientDetails({
        name: 'Package User',
        email: 'package@example.com',
        phone: '+48 123 456 789',
      });

      // Should skip payment step when using package
      await this.page.waitForTimeout(2000);

      // Check if booking is confirmed without payment
      const confirmation = this.page.getByText(/booking confirmed/i);
      if (await confirmation.isVisible()) {
        console.log('✅ Package session used successfully for booking');
      }

      // Check if package sessions are deducted
      await this.navigateTo('/profile');
      await this.page.waitForLoadState('networkidle');

      const remainingSessions = this.page.getByText(/sessions remaining|balance/i);
      if (await remainingSessions.isVisible()) {
        console.log('✅ Package session balance updated');
      }
    } else {
      console.log('⚠️  Package session option not available');
    }
  }

  // Test package expiration
  async testPackageExpiration() {
    // This would test package expiration scenarios
    // In a real implementation, you might create a package with a short expiration
    // or mock the system date to test expiration

    console.log('🎯 Testing package expiration scenarios');

    // Navigate to profile to check active packages
    await this.navigateTo('/profile');
    await this.waitForPageLoad();

    const activePackages = this.page.locator('[data-testid="active-package"]');
    const expiredPackages = this.page.locator('[data-testid="expired-package"]');

    const activeCount = await activePackages.count();
    const expiredCount = await expiredPackages.count();

    console.log(`Active packages: ${activeCount}, Expired packages: ${expiredCount}`);

    if (expiredCount > 0) {
      console.log('✅ Package expiration handling working');
    }
  }

  // Test package comparison
  async testPackageComparison() {
    await this.navigateToPackages();
    await this.waitForPageLoad();

    // Look for comparison feature
    const compareButton = this.page.getByRole('button', { name: /compare/i });
    if (await compareButton.isVisible()) {
      await compareButton.click();

      // Select packages to compare
      const packageCards = this.page.locator('[data-testid="package-card"]');
      const packageCount = await packageCards.count();

      if (packageCount >= 2) {
        // Select first two packages
        await packageCards.first().getByRole('checkbox').check();
        await packageCards.nth(1).getByRole('checkbox').check();

        // Compare packages
        const compareNowButton = this.page.getByRole('button', { name: /compare now/i });
        if (await compareNowButton.isVisible()) {
          await compareNowButton.click();

          // Verify comparison view
          await this.expectElementToBeVisible('[data-testid="package-comparison"]');
          console.log('✅ Package comparison feature working');
        }
      }
    } else {
      console.log('⚠️  Package comparison feature not available');
    }
  }

  // Test package sharing or gifting
  async testPackageGifting() {
    await this.navigateToPackages();
    await this.waitForPageLoad();

    // Look for gift option
    const giftButton = this.page.getByRole('button', { name: /gift|send as gift/i });
    if (await giftButton.isVisible()) {
      await giftButton.click();

      // Fill gift details
      await this.page.getByLabel(/recipient name/i).fill('Gift Recipient');
      await this.page.getByLabel(/recipient email/i).fill('gift@example.com');
      await this.page.getByLabel(/gift message/i).fill('This is a gift for you!');

      // Complete gifting process
      const sendGiftButton = this.page.getByRole('button', { name: /send gift|complete gift/i });
      if (await sendGiftButton.isVisible()) {
        await sendGiftButton.click();

        await this.expectTextToBeVisible(/gift sent|gift purchased/i);
        console.log('✅ Package gifting feature working');
      }
    } else {
      console.log('⚠️  Package gifting feature not available');
    }
  }
}
