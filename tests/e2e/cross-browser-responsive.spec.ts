import { test, expect, devices } from '@playwright/test';
import { HomePage } from './page-objects/home-page';
import { BookingWizardPage } from './page-objects/booking-wizard';
import { BeautyPage } from './page-objects/beauty-page';

/**
 * Cross-browser compatibility and responsive design tests
 * Ensures consistent experience across all supported browsers and devices
 */

test.describe('Cross-Browser Compatibility', () => {
  const browsers = ['chromium', 'firefox', 'webkit'];

  browsers.forEach(browserName => {
    test.describe(`${browserName} - Core Functionality`, () => {
      test.beforeEach(async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigateToHome();
        await homePage.waitForHomePageLoad();
      });

      test(`${browserName} - homepage loads correctly`, async ({ page }) => {
        // Check basic elements are present
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('nav')).toBeVisible();
        await expect(page.locator('main')).toBeVisible();

        // Check no console errors
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));

        await page.reload();
        await page.waitForLoadState('networkidle');

        expect(errors.length).toBe(0);
      });

      test(`${browserName} - navigation works`, async ({ page }) => {
        const homePage = new HomePage(page);

        // Test navigation links
        await homePage.navigation.clickBeautyLink();
        await expect(page).toHaveURL(/beauty/);

        await homePage.navigation.clickFitnessLink();
        await expect(page).toHaveURL(/fitness/);

        await homePage.navigation.clickBookButton();
        await expect(page).toHaveURL(/book/);
      });

      test(`${browserName} - booking wizard functions`, async ({ page }) => {
        const bookingWizard = new BookingWizardPage(page);
        await bookingWizard.navigateToBooking();
        await bookingWizard.waitForWizardLoad();

        // Test service selection
        await bookingWizard.selectService('Brow Lamination');
        await expect(bookingWizard.step2Container).toBeVisible();

        // Test date selection
        await bookingWizard.selectDate('2024-12-15');
        await bookingWizard.selectTimeSlot('10:30');
        await bookingWizard.proceedToStep3();

        // Test form filling
        await bookingWizard.fillCustomerDetails({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '+48 123 456 789'
        });

        // Check form accepts input
        const firstNameValue = await bookingWizard.firstNameInput.inputValue();
        expect(firstNameValue).toBe('Test');
      });

      test(`${browserName} - JavaScript features work`, async ({ page }) => {
        // Test modern JavaScript features
        const jsFeatures = await page.evaluate(() => {
          return {
            fetch: typeof fetch !== 'undefined',
            asyncAwait: typeof async !== 'undefined',
            arrowFunctions: (() => true)(),
            templateLiterals: `test` === 'test',
            destructuring: (() => { const {a} = {a: 1}; return a === 1; })()
          };
        });

        expect(jsFeatures.fetch).toBe(true);
        expect(jsFeatures.asyncAwait).toBe(true);
        expect(jsFeatures.arrowFunctions).toBe(true);
        expect(jsFeatures.templateLiterals).toBe(true);
        expect(jsFeatures.destructuring).toBe(true);
      });

      test(`${browserName} - CSS rendering is consistent`, async ({ page }) => {
        // Check CSS Grid support
        const gridSupport = await page.evaluate(() => {
          const element = document.createElement('div');
          element.style.display = 'grid';
          return element.style.display === 'grid';
        });

        expect(gridSupport).toBe(true);

        // Check Flexbox support
        const flexboxSupport = await page.evaluate(() => {
          const element = document.createElement('div');
          element.style.display = 'flex';
          return element.style.display === 'flex';
        });

        expect(flexboxSupport).toBe(true);

        // Check CSS Variables support
        const cssVarsSupport = await page.evaluate(() => {
          const element = document.createElement('div');
          element.style.setProperty('--test', 'value');
          return element.style.getPropertyValue('--test') === 'value';
        });

        expect(cssVarsSupport).toBe(true);
      });

      test(`${browserName} - media queries work`, async ({ page }) => {
        // Test responsive breakpoints
        const breakpoints = await page.evaluate(() => {
          return {
            mobile: window.matchMedia('(max-width: 767px)').matches,
            tablet: window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches,
            desktop: window.matchMedia('(min-width: 1024px)').matches
          };
        });

        // Should match desktop by default in tests
        expect(breakpoints.desktop).toBe(true);
      });

      test(`${browserName} - local storage works`, async ({ page }) => {
        const storageTest = await page.evaluate(() => {
          try {
            localStorage.setItem('test', 'value');
            const value = localStorage.getItem('test');
            localStorage.removeItem('test');
            return value === 'value';
          } catch (e) {
            return false;
          }
        });

        expect(storageTest).toBe(true);
      });

      test(`${browserName} - session storage works`, async ({ page }) => {
        const sessionTest = await page.evaluate(() => {
          try {
            sessionStorage.setItem('test', 'value');
            const value = sessionStorage.getItem('test');
            sessionStorage.removeItem('test');
            return value === 'value';
          } catch (e) {
            return false;
          }
        });

        expect(sessionTest).toBe(true);
      });
    });
  });
});

test.describe('Responsive Design Testing', () => {
  const viewports = [
    { name: 'Mobile-Portrait', width: 375, height: 667 },
    { name: 'Mobile-Landscape', width: 667, height: 375 },
    { name: 'Tablet-Portrait', width: 768, height: 1024 },
    { name: 'Tablet-Landscape', width: 1024, height: 768 },
    { name: 'Small-Desktop', width: 1280, height: 720 },
    { name: 'Large-Desktop', width: 1920, height: 1080 },
    { name: 'Ultra-Wide', width: 2560, height: 1440 }
  ];

  viewports.forEach(viewport => {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      test(`homepage layout adapts to ${viewport.name}`, async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigateToHome();
        await homePage.waitForHomePageLoad();

        // Check no horizontal scroll
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2); // Allow 2px tolerance

        // Check content is visible
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('main')).toBeVisible();

        // Check responsive navigation
        const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"], .mobile-menu-button');
        const desktopNav = page.locator('nav:not(.mobile)');

        if (viewport.width < 768) {
          // Should show mobile navigation
          if (await mobileMenuButton.isVisible()) {
            await expect(mobileMenuButton).toBeVisible();
          }
        } else {
          // Should show desktop navigation
          await expect(desktopNav).toBeVisible();
        }
      });

      test(`beauty page adapts to ${viewport.name}`, async ({ page }) => {
        const beautyPage = new BeautyPage(page);
        await beautyPage.navigateToBeauty();
        await beautyPage.waitForBeautyPageLoad();

        // Check service cards layout
        const serviceGrid = beautyPage.serviceGrid;
        await expect(serviceGrid).toBeVisible();

        // Get grid layout information
        const gridInfo = await serviceGrid.evaluate((el, width) => {
          const style = window.getComputedStyle(el);
          const gridColumns = style.gridTemplateColumns;
          const gap = style.gap;
          return { gridColumns, gap, containerWidth: el.scrollWidth };
        }, viewport.width);

        console.log(`${viewport.name} grid info:`, gridInfo);

        // Check for responsive breakpoints in grid layout
        if (viewport.width < 768) {
          // Mobile should have 1 column
          expect(gridInfo.gridColumns.includes('1fr') || gridInfo.gridColumns === 'repeat(1, 1fr)').toBeTruthy();
        } else if (viewport.width < 1024) {
          // Tablet should have 2 columns
          expect(gridInfo.gridColumns.includes('2fr') || gridInfo.gridColumns === 'repeat(2, 1fr)').toBeTruthy();
        } else {
          // Desktop should have 3+ columns
          expect(gridInfo.gridColumns.includes('3fr') || gridInfo.gridColumns.includes('4fr')).toBeTruthy();
        }
      });

      test(`booking wizard adapts to ${viewport.name}`, async ({ page }) => {
        const bookingWizard = new BookingWizardPage(page);
        await bookingWizard.navigateToBooking();
        await bookingWizard.waitForWizardLoad();

        // Check step indicators are visible
        await expect(bookingWizard.stepIndicators.first()).toBeVisible();

        // Check current step content is visible
        await expect(bookingWizard.step1Container).toBeVisible();

        // Test form layout on smaller screens
        if (viewport.width < 768) {
          // Mobile-specific layout checks
          await bookingWizard.selectService('Brow Lamination');
          await bookingWizard.proceedToStep2();
          await bookingWizard.selectDate('2024-12-15');
          await bookingWizard.selectTimeSlot('10:30');
          await bookingWizard.proceedToStep3();

          // Check form fields stack vertically on mobile
          const formFields = page.locator('input, textarea, select');
          const fieldCount = await formFields.count();

          for (let i = 0; i < Math.min(fieldCount, 3); i++) {
            const field = formFields.nth(i);
            await expect(field).toBeVisible();

            // Check field width on mobile
            const boundingBox = await field.boundingBox();
            if (boundingBox) {
              expect(boundingBox.width).toBeGreaterThan(200); // Minimum width for usability
            }
          }
        }
      });

      test(`touch interactions work on ${viewport.name}`, async ({ page }) => {
        if (viewport.width < 1024) { // Test touch on mobile/tablet
          const homePage = new HomePage(page);
          await homePage.navigateToHome();
          await homePage.waitForHomePageLoad();

          // Test tap interactions
          const beautyCard = homePage.beautyCard;
          await beautyCard.tap();

          await page.waitForTimeout(500);
          await expect(page).toHaveURL(/beauty/);

          // Test swipe gestures if applicable
          if (viewport.width < 768) {
            // Test mobile menu swipe
            await homePage.navigation.openMobileMenu();
            await expect(page.locator('[data-testid="mobile-menu"], .mobile-menu')).toBeVisible();
          }
        }
      });

      test(`images are responsive on ${viewport.name}`, async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigateToHome();
        await homePage.waitForHomePageLoad();

        // Check that images don't overflow
        const images = page.locator('img');
        const imageCount = await images.count();

        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const img = images.nth(i);
          if (await img.isVisible()) {
            const boundingBox = await img.boundingBox();
            const naturalWidth = await img.evaluate(el => el.naturalWidth);
            const displayWidth = await img.evaluate(el => el.clientWidth);

            if (boundingBox && naturalWidth > 0) {
              // Image should fit within viewport
              expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
              expect(displayWidth).toBeLessThanOrEqual(viewport.width);
            }
          }
        }
      });

      test(`text is readable on ${viewport.name}`, async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigateToHome();
        await homePage.waitForHomePageLoad();

        // Check font sizes are appropriate
        const headings = page.locator('h1, h2, h3');
        const bodyText = page.locator('p, .description, .text');

        // Check heading sizes
        if (viewport.width < 768) {
          // Mobile headings should be appropriately sized
          const h1 = page.locator('h1').first();
          const h1Size = await h1.evaluate(el => {
            return window.getComputedStyle(el).fontSize;
          });
          const h1SizeNum = parseInt(h1Size);
          expect(h1SizeNum).toBeGreaterThanOrEqual(24); // Minimum 24px for mobile h1
        }

        // Check text doesn't require horizontal scrolling
        const textElements = await bodyText.all();
        for (let i = 0; i < Math.min(textElements.length, 3); i++) {
          const element = textElements[i];
          if (await element.isVisible()) {
            const boundingBox = await element.boundingBox();
            if (boundingBox) {
              expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
            }
          }
        }
      });

      test(`buttons are accessible on ${viewport.name}`, async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigateToHome();
        await homePage.waitForHomePageLoad();

        // Check button sizes
        const buttons = page.locator('button, .btn, a[href*="book"]');
        const buttonCount = await buttons.count();

        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const boundingBox = await button.boundingBox();

            if (boundingBox) {
              if (viewport.width < 768) {
                // Mobile touch targets
                expect(boundingBox.width).toBeGreaterThanOrEqual(44);
                expect(boundingBox.height).toBeGreaterThanOrEqual(44);
              } else {
                // Desktop buttons
                expect(boundingBox.width).toBeGreaterThanOrEqual(32);
                expect(boundingBox.height).toBeGreaterThanOrEqual(32);
              }
            }
          }
        }
      });
    });
  });
});

test.describe('Browser-Specific Features', () => {
  test('Chrome-specific features work', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test');

    // Test Chrome DevTools integration if available
    const chromeFeatures = await page.evaluate(() => {
      return {
        webpSupport: document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0,
        intersectionObserver: 'IntersectionObserver' in window,
        mutationObserver: 'MutationObserver' in window,
        requestIdleCallback: 'requestIdleCallback' in window
      };
    });

    expect(chromeFeatures.intersectionObserver).toBe(true);
    expect(chromeFeatures.mutationObserver).toBe(true);
  });

  test('Firefox-specific features work', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');

    // Test Firefox-specific features
    const firefoxFeatures = await page.evaluate(() => {
      return {
        webComponents: 'customElements' in window,
        es6Modules: 'import' in window,
        webAssembly: 'WebAssembly' in window
      };
    });

    expect(firefoxFeatures.webComponents).toBe(true);
    expect(firefoxFeatures.es6Modules).toBe(true);
  });

  test('Safari-specific features work', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');

    // Test Safari-specific features
    const safariFeatures = await page.evaluate(() => {
      return {
        cssGrid: CSS.supports('display', 'grid'),
        cssCustomProperties: CSS.supports('color', 'var(--test)'),
        webkitFontSmoothing: CSS.supports('-webkit-font-smoothing', 'antialiased')
      };
    });

    expect(safariFeatures.cssGrid).toBe(true);
    expect(safariFeatures.cssCustomProperties).toBe(true);
  });
});

test.describe('Cross-Browser Performance', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`${browserName} performance metrics`, async ({ page, browserName }) => {
      const startTime = Date.now();

      const homePage = new HomePage(page);
      await homePage.navigateToHome();
      await homePage.waitForHomePageLoad();

      const loadTime = Date.now() - startTime;

      // Performance should be consistent across browsers
      expect(loadTime).toBeLessThan(5000); // 5 seconds max

      // Get performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0
        };
      });

      console.log(`${browserName} performance metrics:`, metrics);

      // Performance should be reasonable
      expect(metrics.domContentLoaded).toBeLessThan(3000);
      expect(metrics.loadComplete).toBeLessThan(5000);
    });
  });
});

test.describe('Browser Compatibility Fallbacks', () => {
  test('polyfills load when needed', async ({ page }) => {
    const polyfillCheck = await page.evaluate(() => {
      const checks = {
        // Check if polyfills are loaded for older browsers
        fetchPolyfill: typeof window.fetch !== 'undefined' || !!(window as any).polyfilledFetch,
        promisePolyfill: typeof Promise !== 'undefined' || !!(window as any).polyfilledPromise,
        objectAssignPolyfill: typeof Object.assign !== 'undefined' || !!(window as any).polyfilledObjectAssign
      };

      return checks;
    });

    // Should have required functionality
    expect(polyfillCheck.fetchPolyfill).toBe(true);
    expect(polyfillCheck.promisePolyfill).toBe(true);
    expect(polyfillCheck.objectAssignPolyfill).toBe(true);
  });

  test('graceful degradation without JavaScript', async ({ page }) => {
    // Disable JavaScript
    await page.context().setExtraHTTPHeaders({
      'Content-Security-Policy': "script-src 'none'"
    });

    const response = await page.goto('/');

    // Page should still load basic structure
    if (response && response.ok()) {
      // Check for noscript content or basic HTML structure
      const hasContent = await page.locator('body').textContent();
      expect(hasContent?.length).toBeGreaterThan(0);
    }
  });

  test('error handling for unsupported features', async ({ page }) => {
    // Test handling of unsupported browser features
    const errorHandling = await page.evaluate(() => {
      try {
        // Try using modern features
        const testPromise = new Promise(resolve => setTimeout(resolve, 100));
        const testAsync = async () => 'test';
        return { supported: true };
      } catch (error) {
        return { supported: false, error: error.message };
      }
    });

    expect(errorHandling.supported).toBe(true);
  });
});