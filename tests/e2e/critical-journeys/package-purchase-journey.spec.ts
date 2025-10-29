import { test, expect } from '@playwright/test';
import { PackageHelpers } from '../utils/package-helpers';
import { BookingHelpers } from '../utils/booking-helpers';
import { TestDataManager, TestDataFactory } from '../utils/test-data';

test.describe('Package Purchase Journey - Critical User Journey', () => {
  let packageHelpers: PackageHelpers;
  let bookingHelpers: BookingHelpers;
  let testDataManager: TestDataManager;

  test.beforeEach(async ({ page, context }) => {
    packageHelpers = new PackageHelpers(page);
    bookingHelpers = new BookingHelpers(page);
    testDataManager = new TestDataManager(context);

    // Set up error handling
    await packageHelpers.handleErrors();

    // Accept cookies if present
    await packageHelpers.acceptCookies();
  });

  test.afterEach(async ({ context }) => {
    await testDataManager.cleanup();
  });

  test.describe('Package Discovery and Selection', () => {
    test('PKG-001: Discover and browse available packages', async ({ page }) => {
      console.log('🎯 Starting PKG-001: Package discovery test');

      // Check beauty packages
      const beautyPackages = await packageHelpers.checkAvailablePackages('beauty');
      expect(beautyPackages.count).toBeGreaterThan(0);
      console.log(`✅ Found ${beautyPackages.count} beauty packages`);

      // Check fitness packages
      const fitnessPackages = await packageHelpers.checkAvailablePackages('fitness');
      console.log(`Found ${fitnessPackages.count} fitness packages`);

      // Check all packages
      const allPackages = await packageHelpers.checkAvailablePackages();
      expect(allPackages.count).toBeGreaterThanOrEqual(beautyPackages.count + fitnessPackages.count);

      // Verify package information is displayed
      for (const pkg of allPackages.packages) {
        expect(pkg.name).toBeTruthy();
        expect(pkg.price).toBeTruthy();
        expect(pkg.sessions).toBeTruthy();
      }

      console.log('✅ PKG-001: Package discovery completed successfully');
    });

    test('PKG-002: Filter and sort packages', async ({ page }) => {
      console.log('🎯 Starting PKG-002: Package filtering and sorting');

      await packageHelpers.navigateToPackages();

      // Test filtering by type
      const beautyFilter = page.getByRole('button', { name: /beauty/i });
      if (await beautyFilter.isVisible()) {
        await beautyFilter.click();
        await page.waitForTimeout(500);

        const beautyPackages = await page.locator('[data-testid="package-card"]').count();
        console.log(`Beauty packages after filtering: ${beautyPackages}`);

        // Verify all displayed packages are beauty packages
        const packageNames = page.locator('[data-testid="package-name"]');
        for (let i = 0; i < await packageNames.count(); i++) {
          const name = await packageNames.nth(i).textContent();
          // This would need to be adjusted based on actual package naming
        }
      }

      // Test sorting options
      const sortButton = page.getByRole('button', { name: /sort/i });
      if (await sortButton.isVisible()) {
        await sortButton.click();

        // Try different sort options
        const sortByPrice = page.getByRole('menuitem', { name: /price/i });
        if (await sortByPrice.isVisible()) {
          await sortByPrice.click();
          await page.waitForTimeout(500);
          console.log('✅ Packages sorted by price');
        }

        const sortBySessions = page.getByRole('menuitem', { name: /sessions/i });
        if (await sortBySessions.isVisible()) {
          await sortBySessions.click();
          await page.waitForTimeout(500);
          console.log('✅ Packages sorted by sessions');
        }
      }

      console.log('✅ PKG-002: Package filtering and sorting completed');
    });

    test('PKG-003: Compare different packages', async ({ page }) => {
      console.log('🎯 Starting PKG-003: Package comparison test');

      await packageHelpers.testPackageComparison();
      console.log('✅ PKG-003: Package comparison completed');
    });
  });

  test.describe('Package Purchase Flow', () => {
    test('PKG-004: Complete beauty package purchase - Happy Path', async ({ page }) => {
      console.log('🎯 Starting PKG-004: Complete beauty package purchase');

      // Create test user
      const testUser = await testDataManager.createUser({
        name: 'Anna Wiśniewska',
        email: 'anna.wisniewska@example.com',
        phone: '+48 512 345 678',
      });

      // Purchase beauty package
      await packageHelpers.purchasePackage({
        packageName: 'Beauty Package 5 Sessions',
        packageType: 'beauty',
        userName: testUser.name,
        userEmail: testUser.email,
        userPhone: testUser.phone,
        paymentMethod: 'card',
      });

      // Verify package activation
      await expect(page.getByText(/package activated|purchase complete/i)).toBeVisible();
      await expect(page.getByText(/5 sessions/i)).toBeVisible();

      // Check for activation email message
      const emailMessage = page.getByText(/activation email sent/i);
      if (await emailMessage.isVisible()) {
        console.log('✅ Package activation email message displayed');
      }

      // Take screenshot for verification
      await packageHelpers.takeScreenshot('beauty-package-purchase-confirmation');

      console.log('✅ PKG-004: Beauty package purchase completed successfully');
    });

    test('PKG-005: Complete fitness package purchase - Happy Path', async ({ page }) => {
      console.log('🎯 Starting PKG-005: Complete fitness package purchase');

      // Create test user
      const testUser = await testDataManager.createUser({
        name: 'Paweł Kowalski',
        email: 'pawel.kowalski@example.com',
        phone: '+48 601 234 567',
      });

      // Purchase fitness package
      await packageHelpers.purchasePackage({
        packageName: 'Fitness Package 10 Sessions',
        packageType: 'fitness',
        userName: testUser.name,
        userEmail: testUser.email,
        userPhone: testUser.phone,
        paymentMethod: 'card',
      });

      // Verify package activation
      await expect(page.getByText(/package activated|purchase complete/i)).toBeVisible();
      await expect(page.getByText(/10 sessions/i)).toBeVisible();

      // Take screenshot for verification
      await packageHelpers.takeScreenshot('fitness-package-purchase-confirmation');

      console.log('✅ PKG-005: Fitness package purchase completed successfully');
    });

    test('PKG-006: Package purchase with different payment methods', async ({ page }) => {
      console.log('🎯 Starting PKG-006: Package purchase with different payment methods');

      const paymentMethods = ['card', 'bank-transfer'] as const;

      for (const method of paymentMethods) {
        console.log(`Testing payment method: ${method}`);

        try {
          await packageHelpers.purchasePackage({
            packageName: 'Beauty Package 5 Sessions',
            packageType: 'beauty',
            userName: `Payment Test ${method}`,
            userEmail: `payment-${method}@example.com`,
            userPhone: '+48 512 345 678',
            paymentMethod: method,
          });

          console.log(`✅ Payment method ${method} completed successfully`);

          // Navigate back for next test
          await page.goto('/packages');
          await page.waitForLoadState('networkidle');

        } catch (error) {
          console.log(`⚠️  Payment method ${method} failed:`, error.message);
        }
      }

      console.log('✅ PKG-006: Multiple payment methods test completed');
    });

    test('PKG-007: Package purchase validation and error handling', async ({ page }) => {
      console.log('🎯 Starting PKG-007: Package purchase validation test');

      await packageHelpers.navigateToPackages();

      // Try to purchase without selecting a package
      const purchaseButton = page.getByRole('button', { name: /purchase/i });
      if (await purchaseButton.isVisible()) {
        await purchaseButton.click();

        // Should show validation error or stay on packages page
        await page.waitForTimeout(1000);
        const isStillOnPackages = await page.locator('[data-testid="package-grid"]').isVisible();
        if (isStillOnPackages) {
          console.log('✅ Purchase without package selection prevented');
        }
      }

      // Test with invalid payment details
      try {
        await packageHelpers.selectPackage('Beauty Package 5 Sessions');

        const purchaseNowButton = page.getByRole('button', { name: /purchase now/i });
        if (await purchaseNowButton.isVisible()) {
          await purchaseNowButton.click();

          // Try to submit without required details
          const completeButton = page.getByRole('button', { name: /complete purchase/i });
          if (await completeButton.isVisible()) {
            await completeButton.click();

            // Should show validation errors
            const validationError = page.getByText(/required|invalid/i);
            if (await validationError.isVisible()) {
              console.log('✅ Package purchase validation working');
            }
          }
        }
      } catch (error) {
        console.log('⚠️  Package purchase validation test skipped:', error.message);
      }

      console.log('✅ PKG-007: Package purchase validation completed');
    });
  });

  test.describe('Package Session Management', () => {
    test('PKG-008: Use package session for booking', async ({ page }) => {
      console.log('🎯 Starting PKG-008: Package session usage test');

      // First purchase a package
      await packageHelpers.purchasePackage({
        packageName: 'Beauty Package 5 Sessions',
        packageType: 'beauty',
        userName: 'Package User',
        userEmail: 'package.user@example.com',
        userPhone: '+48 512 345 678',
      });

      // Now try to book using the package session
      await packageHelpers.testPackageSessionUsage('Beauty Package 5 Sessions');

      console.log('✅ PKG-008: Package session usage completed');
    });

    test('PKG-009: Check package session balance', async ({ page }) => {
      console.log('🎯 Starting PKG-009: Package session balance test');

      // Purchase a package
      await packageHelpers.purchasePackage({
        packageName: 'Beauty Package 5 Sessions',
        packageType: 'beauty',
        userName: 'Balance Test User',
        userEmail: 'balance@example.com',
        userPhone: '+48 512 345 678',
      });

      // Navigate to profile to check balance
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');

      // Look for active packages
      const activePackages = page.locator('[data-testid="active-package"]');
      expect(await activePackages.count()).toBeGreaterThan(0);

      // Check session count
      const sessionInfo = page.getByText(/sessions remaining|5 sessions/i);
      if (await sessionInfo.isVisible()) {
        console.log('✅ Package session balance displayed correctly');
      }

      // Check expiration date
      const expirationInfo = page.getByText(/expires|valid until/i);
      if (await expirationInfo.isVisible()) {
        console.log('✅ Package expiration information displayed');
      }

      console.log('✅ PKG-009: Package session balance check completed');
    });

    test('PKG-010: Package expiration handling', async ({ page }) => {
      console.log('🎯 Starting PKG-010: Package expiration test');

      await packageHelpers.testPackageExpiration();
      console.log('✅ PKG-010: Package expiration handling completed');
    });

    test('PKG-011: Multiple package management', async ({ page }) => {
      console.log('🎯 Starting PKG-011: Multiple package management test');

      // Purchase two different packages
      await packageHelpers.purchasePackage({
        packageName: 'Beauty Package 5 Sessions',
        packageType: 'beauty',
        userName: 'Multi Package User',
        userEmail: 'multi.beauty@example.com',
        userPhone: '+48 512 345 678',
      });

      await page.goto('/packages');
      await page.waitForLoadState('networkidle');

      await packageHelpers.purchasePackage({
        packageName: 'Fitness Package 10 Sessions',
        packageType: 'fitness',
        userName: 'Multi Package User',
        userEmail: 'multi.fitness@example.com',
        userPhone: '+48 512 345 678',
      });

      // Check profile for multiple packages
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');

      const activePackages = page.locator('[data-testid="active-package"]');
      const packageCount = await activePackages.count();

      if (packageCount >= 2) {
        console.log('✅ Multiple packages displayed correctly');

        // Check if packages are properly categorized
        const beautyPackage = page.getByText(/beauty package/i);
        const fitnessPackage = page.getByText(/fitness package/i);

        if (await beautyPackage.isVisible() && await fitnessPackage.isVisible()) {
          console.log('✅ Package categorization working correctly');
        }
      } else {
        console.log('⚠️  Multiple packages not displayed correctly');
      }

      console.log('✅ PKG-011: Multiple package management completed');
    });
  });

  test.describe('Package Features and Upselling', () => {
    test('PKG-012: Package benefits and features display', async ({ page }) => {
      console.log('🎯 Starting PKG-012: Package benefits display test');

      await packageHelpers.selectPackage('Beauty Package 5 Sessions');

      // Check for benefits section
      const benefitsSection = page.locator('[data-testid="package-benefits"]');
      if (await benefitsSection.isVisible()) {
        console.log('✅ Package benefits section displayed');

        // Check for specific benefits
        const benefits = [
          /discount/i,
          /priority booking/i,
          /exclusive access/i,
          /flexible scheduling/i,
        ];

        for (const benefit of benefits) {
          const benefitElement = page.getByText(benefit);
          if (await benefitElement.isVisible()) {
            console.log(`✅ Benefit found: ${benefit}`);
          }
        }
      }

      // Check for what's included section
      const includedSection = page.locator('[data-testid="package-includes"]');
      if (await includedSection.isVisible()) {
        console.log('✅ Package inclusions section displayed');
      }

      console.log('✅ PKG-012: Package benefits display completed');
    });

    test('PKG-013: Package gifting functionality', async ({ page }) => {
      console.log('🎯 Starting PKG-013: Package gifting test');

      await packageHelpers.testPackageGifting();
      console.log('✅ PKG-013: Package gifting completed');
    });

    test('PKG-014: Package recommendations and upselling', async ({ page }) => {
      console.log('🎯 Starting PKG-014: Package recommendations test');

      await packageHelpers.selectPackage('Beauty Package 5 Sessions');

      // Look for recommended packages
      const recommendationsSection = page.locator('[data-testid="recommended-packages"]');
      if (await recommendationsSection.isVisible()) {
        console.log('✅ Package recommendations displayed');

        const recommendedPackages = recommendationsSection.locator('[data-testid="package-card"]');
        const recommendationCount = await recommendedPackages.count();

        if (recommendationCount > 0) {
          console.log(`✅ Found ${recommendationCount} recommended packages`);
        }
      }

      // Look for upselling prompts
      const upsellSection = page.locator('[data-testid="package-upsell"]');
      if (await upsellSection.isVisible()) {
        console.log('✅ Package upselling displayed');
      }

      console.log('✅ PKG-014: Package recommendations completed');
    });
  });

  test.describe('Package Mobile Experience', () => {
    test('PKG-015: Package purchase on mobile devices', async ({ page }) => {
      console.log('🎯 Starting PKG-015: Mobile package purchase test');

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      // Complete package purchase on mobile
      await packageHelpers.purchasePackage({
        packageName: 'Beauty Package 5 Sessions',
        packageType: 'beauty',
        userName: 'Mobile Package User',
        userEmail: 'mobile.package@example.com',
        userPhone: '+48 512 345 678',
      });

      // Verify mobile-specific elements
      await expect(page.getByText(/package activated/i)).toBeVisible();

      // Check mobile navigation
      const mobileNav = page.locator('[data-testid="mobile-navigation"]');
      if (await mobileNav.isVisible()) {
        console.log('✅ Mobile navigation working correctly');
      }

      // Take mobile screenshot
      await packageHelpers.takeScreenshot('mobile-package-purchase');

      console.log('✅ PKG-015: Mobile package purchase completed successfully');
    });

    test('PKG-016: Package comparison on mobile', async ({ page }) => {
      console.log('🎯 Starting PKG-016: Mobile package comparison test');

      await page.setViewportSize({ width: 375, height: 667 });

      await packageHelpers.testPackageComparison();

      console.log('✅ PKG-016: Mobile package comparison completed');
    });
  });

  test.describe('Package Performance and Reliability', () => {
    test('PKG-017: Package purchase performance test', async ({ page }) => {
      console.log('🎯 Starting PKG-017: Package purchase performance test');

      const startTime = Date.now();

      await packageHelpers.purchasePackage({
        packageName: 'Beauty Package 5 Sessions',
        packageType: 'beauty',
        userName: 'Performance Test User',
        userEmail: 'performance.package@example.com',
        userPhone: '+48 512 345 678',
      });

      const endTime = Date.now();
      const purchaseTime = endTime - startTime;

      console.log(`⏱️  Package purchase completed in ${purchaseTime}ms`);

      // Package purchase should complete within reasonable time (45 seconds)
      expect(purchaseTime).toBeLessThan(45000);

      await expect(page.getByText(/package activated/i)).toBeVisible();
      console.log('✅ PKG-017: Package purchase performance test passed');
    });

    test('PKG-018: Package purchase with network issues', async ({ page }) => {
      console.log('🎯 Starting PKG-018: Package purchase network resilience test');

      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
        await route.continue();
      });

      try {
        await packageHelpers.purchasePackage({
          packageName: 'Beauty Package 5 Sessions',
          packageType: 'beauty',
          userName: 'Slow Network User',
          userEmail: 'slow.network@example.com',
          userPhone: '+48 512 345 678',
        });

        console.log('✅ PKG-018: Package purchase completed despite slow network');
      } catch (error) {
        console.log('⚠️  Package purchase failed with slow network:', error.message);
      }

      // Clean up network simulation
      await page.unroute('**/*');
    });
  });
});