import { test, expect, devices } from '@playwright/test';
import { HomePage } from './page-objects/home-page';
import { BookingWizardPage } from './page-objects/booking-wizard';
import { BeautyPage } from './page-objects/beauty-page';
import { MOBILE_VIEWPORTS, TABLET_VIEWPORTS } from './utils/test-data';

/**
 * Performance testing and Core Web Vitals verification
 * Ensures the application meets performance standards for optimal user experience
 */

test.describe('Core Web Vitals - Performance Metrics', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      // Capture Web Vitals
      (window as any).__WEB_VITALS__ = [];

      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        (window as any).__WEB_VITALS__.push({
          name: 'LCP',
          value: lastEntry.startTime,
          timestamp: Date.now()
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID) / Interaction to Next Paint (INP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-input') {
            (window as any).__WEB_VITALS__.push({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              timestamp: Date.now()
            });
          } else if (entry.name.includes('click') || entry.name.includes('keydown')) {
            (window as any).__WEB_VITALS__.push({
              name: 'INP',
              value: entry.processingStart - entry.startTime,
              timestamp: Date.now()
            });
          }
        });
      }).observe({ entryTypes: ['first-input', 'event'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        (window as any).__WEB_VITALS__.push({
          name: 'CLS',
          value: clsValue,
          timestamp: Date.now()
        });
      }).observe({ entryTypes: ['layout-shift'] });
    });
  });

  test('homepage meets Core Web Vitals thresholds', async ({ page }) => {
    const homePage = new HomePage(page);

    // Navigate and load the page
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Trigger some interactions to measure INP
    await page.click('a[href*="beauty"]');
    await page.waitForTimeout(1000);
    await page.goBack();

    // Get performance metrics
    const webVitals = await page.evaluate(() => (window as any).__WEB_VITALS__);
    console.log('Web Vitals collected:', webVitals);

    // Extract specific metrics
    const lcp = webVitals.find((v: any) => v.name === 'LCP')?.value || 0;
    const cls = webVitals.find((v: any) => v.name === 'CLS')?.value || 0;
    const inp = webVitals.find((v: any) => v.name === 'INP')?.value || 0;

    console.log(`Performance Metrics: LCP=${lcp}ms, CLS=${cls}, INP=${inp}ms`);

    // Core Web Vitals thresholds (Good thresholds)
    expect(lcp).toBeLessThan(2500); // LCP should be under 2.5s
    expect(cls).toBeLessThan(0.1);   // CLS should be under 0.1
    expect(inp).toBeLessThan(200);   // INP should be under 200ms

    // Get additional performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        totalResources: performance.getEntriesByType('resource').length,
        transferSize: performance.getEntriesByType('resource').reduce((total, entry) =>
          total + (entry as any).transferSize, 0)
      };
    });

    console.log('Additional Performance Metrics:', performanceMetrics);

    // Performance expectations
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000);
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1800);
    expect(performanceMetrics.transferSize).toBeLessThan(3 * 1024 * 1024); // Less than 3MB
  });

  test('booking wizard performance meets standards', async ({ page }) => {
    const bookingWizard = new BookingWizardPage(page);
    const startTime = Date.now();

    // Navigate to booking wizard
    await bookingWizard.navigateToBooking();
    await bookingWizard.waitForWizardLoad();

    // Measure each step's load time
    const stepLoadTimes: number[] = [];

    for (let step = 1; step <= 4; step++) {
      const stepStart = Date.now();
      await bookingWizard.page.waitForLoadState('networkidle');
      stepLoadTimes.push(Date.now() - stepStart);

      if (step < 4 && await bookingWizard.nextButton.isVisible()) {
        await bookingWizard.nextButton.click();
        await page.waitForTimeout(500);
      }
    }

    const totalTime = Date.now() - startTime;

    console.log(`Booking wizard performance: Total=${totalTime}ms, Steps=${stepLoadTimes}`);

    // Performance expectations for booking flow
    expect(totalTime).toBeLessThan(10000); // Complete flow under 10 seconds
    stepLoadTimes.forEach((loadTime, index) => {
      expect(loadTime).toBeLessThan(3000); // Each step under 3 seconds
    });

    // Check for layout shifts during wizard navigation
    const webVitals = await page.evaluate(() => (window as any).__WEB_VITALS__);
    const cls = webVitals.find((v: any) => v.name === 'CLS')?.value || 0;
    expect(cls).toBeLessThan(0.1);
  });

  test('beauty page with images performs well', async ({ page }) => {
    const beautyPage = new BeautyPage(page);
    const startTime = Date.now();

    await beautyPage.navigateToBeauty();
    await beautyPage.waitForBeautyPageLoad();

    const loadTime = Date.now() - startTime;

    // Check image loading performance
    const imageMetrics = await beautyPage.verifyImagesLoaded();
    console.log(`Beauty page loaded in ${loadTime}ms, Images: ${imageMetrics.loaded}/${imageMetrics.total}`);

    // Image performance expectations
    expect(imageMetrics.loaded / imageMetrics.total).toBeGreaterThan(0.8); // 80% of images should load
    expect(loadTime).toBeLessThan(5000); // Page should load under 5 seconds even with images

    // Check lazy loading
    const lazyLoadingWorks = await beautyPage.testLazyLoading();
    expect(lazyLoadingWorks).toBe(true);
  });

  test('mobile performance meets standards', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone12);

    const homePage = new HomePage(page);
    const startTime = Date.now();

    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    const mobileLoadTime = Date.now() - startTime;

    // Mobile performance expectations
    expect(mobileLoadTime).toBeLessThan(4000); // Mobile should load under 4 seconds

    // Check mobile-specific performance
    const mobileMetrics = await page.evaluate(() => {
      return {
        memoryUsage: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        } : null,
        longTasks: performance.getEntriesByType('longtask').length,
        renderBlockingResources: document.querySelectorAll('link[rel="stylesheet"][media="all"]').length
      };
    });

    console.log('Mobile performance metrics:', mobileMetrics);

    if (mobileMetrics.memoryUsage) {
      // Memory usage should be reasonable
      const memoryUsageMB = mobileMetrics.memoryUsage.used / (1024 * 1024);
      expect(memoryUsageMB).toBeLessThan(50); // Less than 50MB memory usage
    }

    // Should have minimal long tasks
    expect(mobileMetrics.longTasks).toBeLessThan(5);

    // Should minimize render-blocking resources
    expect(mobileMetrics.renderBlockingResources).toBeLessThan(10);
  });
});

test.describe('Network Performance', () => {
  test('resource loading is optimized', async ({ page }) => {
    const homePage = new HomePage(page);

    // Monitor resource loading
    const resources: any[] = [];
    page.on('response', response => {
      resources.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        size: response.headers()['content-length'] || 0
      });
    });

    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Analyze loaded resources
    const resourceAnalysis = {
      totalRequests: resources.length,
      totalSize: resources.reduce((total, r) => total + parseInt(r.size || 0), 0),
      failedRequests: resources.filter(r => r.status >= 400).length,
      cssFiles: resources.filter(r => r.url.includes('.css')).length,
      jsFiles: resources.filter(r => r.url.includes('.js')).length,
      images: resources.filter(r => r.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)).length,
      fontFiles: resources.filter(r => r.url.match(/\.(woff|woff2|ttf|eot)$/i)).length
    };

    console.log('Resource analysis:', resourceAnalysis);

    // Resource optimization expectations
    expect(resourceAnalysis.totalRequests).toBeLessThan(50); // Keep total requests low
    expect(resourceAnalysis.totalSize).toBeLessThan(2 * 1024 * 1024); // Less than 2MB
    expect(resourceAnalysis.failedRequests).toBe(0);
    expect(resourceAnalysis.cssFiles).toBeLessThan(5); // Minimal CSS files
    expect(resourceAnalysis.jsFiles).toBeLessThan(10); // Minimal JS files

    // Check for optimization headers
    const cssResponses = resources.filter(r => r.url.includes('.css'));
    const jsResponses = resources.filter(r => r.url.includes('.js'));

    // Should have compression
    const hasGzip = [...cssResponses, ...jsResponses].some(r =>
      r.headers['content-encoding']?.includes('gzip') ||
      r.headers['content-encoding']?.includes('br')
    );
    expect(hasGzip).toBe(true);
  });

  test('API responses are fast', async ({ page }) => {
    const apiTimes: number[] = [];

    page.on('response', async response => {
      if (response.url().includes('/api/') || response.url().includes('/rest/v1/')) {
        const timing = await response.request().timing();
        const totalTime = timing.responseEnd - timing.requestStart;
        apiTimes.push(totalTime);
      }
    });

    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();
    await bookingWizard.waitForWizardLoad();

    // Trigger some API calls
    await bookingWizard.selectService('Brow Lamination');
    await bookingWizard.proceedToStep2();

    console.log('API response times:', apiTimes);

    if (apiTimes.length > 0) {
      const averageApiTime = apiTimes.reduce((sum, time) => sum + time, 0) / apiTimes.length;
      const maxApiTime = Math.max(...apiTimes);

      expect(averageApiTime).toBeLessThan(1000); // Average API response under 1s
      expect(maxApiTime).toBeLessThan(3000); // No single API call over 3s
    }
  });

  test('caching headers are properly set', async ({ page }) => {
    const responses: any[] = [];

    page.on('response', response => {
      if (response.url().match(/\.(js|css|png|jpg|jpeg|webp|svg|woff|woff2)$/i)) {
        responses.push({
          url: response.url(),
          cacheControl: response.headers()['cache-control'],
          etag: response.headers()['etag'],
          expires: response.headers()['expires']
        });
      }
    });

    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Analyze caching headers
    const staticResources = responses.filter(r =>
      r.url.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff|woff2)$/i)
    );

    console.log(`Analyzing caching for ${staticResources.length} static resources`);

    let cachedResources = 0;
    staticResources.forEach(resource => {
      if (resource.cacheControl?.includes('max-age') ||
          resource.etag ||
          resource.expires) {
        cachedResources++;
      }
    });

    // Most static resources should have caching headers
    if (staticResources.length > 0) {
      const cacheRatio = cachedResources / staticResources.length;
      expect(cacheRatio).toBeGreaterThan(0.8); // 80% of resources should be cacheable
    }
  });
});

test.describe('Animation and Interaction Performance', () => {
  test('animations perform at 60fps', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Monitor frame rate during interactions
    const frameRates: number[] = [];

    await page.addInitScript(() => {
      let lastTime = performance.now();
      let frames = 0;

      function measureFrameRate() {
        frames++;
        const currentTime = performance.now();

        if (currentTime - lastTime >= 1000) {
          (window as any).__FRAME_RATE__ = frames;
          frames = 0;
          lastTime = currentTime;
        }

        requestAnimationFrame(measureFrameRate);
      }

      requestAnimationFrame(measureFrameRate);
    });

    // Trigger some animations
    await page.hover('.service-card, [data-testid="service-card"]');
    await page.waitForTimeout(1000);

    // Click some interactive elements
    await page.click('button, .btn');
    await page.waitForTimeout(500);

    // Get frame rate measurements
    const frameRate = await page.evaluate(() => (window as any).__FRAME_RATE__);
    console.log(`Measured frame rate: ${frameRate} fps`);

    // Should maintain good performance during interactions
    if (frameRate) {
      expect(frameRate).toBeGreaterThan(30); // Minimum 30fps for smooth animations
    }
  });

  test('micro-interactions are performant', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Test button hover states
    const buttons = page.locator('button, .btn, a[href*="book"]');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i);

      // Measure hover performance
      const hoverStart = Date.now();
      await button.hover();
      await page.waitForTimeout(200); // Allow transition to complete
      const hoverTime = Date.now() - hoverStart;

      console.log(`Button ${i} hover time: ${hoverTime}ms`);
      expect(hoverTime).toBeLessThan(300); // Hover effects should be quick
    }

    // Test click interactions
    for (let i = 0; i < Math.min(buttonCount, 2); i++) {
      const button = buttons.nth(i);

      const clickStart = Date.now();
      await button.click();
      const clickTime = Date.now() - clickStart;

      console.log(`Button ${i} click response time: ${clickTime}ms`);
      expect(clickTime).toBeLessThan(100); // Click responses should be immediate
    }
  });
});

test.describe('Memory Performance', () => {
  test('memory usage stays within limits', async ({ page }) => {
    const homePage = new HomePage(page);

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      } : null;
    });

    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Navigate through multiple pages
    await homePage.navigateToBeauty();
    await page.waitForTimeout(1000);

    const bookingWizard = new BookingWizardPage(page);
    await bookingWizard.navigateToBooking();
    await bookingWizard.waitForWizardLoad();

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      } : null;
    });

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.used - initialMemory.used;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      console.log(`Memory usage: Initial=${(initialMemory.used/1024/1024).toFixed(2)}MB, Final=${(finalMemory.used/1024/1024).toFixed(2)}MB, Increase=${memoryIncreaseMB.toFixed(2)}MB`);

      // Memory increase should be reasonable
      expect(memoryIncreaseMB).toBeLessThan(20); // Less than 20MB increase
      expect(finalMemory.used / (1024 * 1024)).toBeLessThan(100); // Total under 100MB
    }
  });

  test('no memory leaks detected', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    // Get baseline memory
    const baselineMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    // Perform memory-intensive operations
    for (let i = 0; i < 5; i++) {
      // Navigate and interact
      await page.goto('/beauty');
      await page.waitForTimeout(1000);
      await page.goto('/');
      await page.waitForTimeout(1000);
    }

    // Force garbage collection again
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    const memoryDifference = finalMemory - baselineMemory;
    const memoryDifferenceMB = memoryDifference / (1024 * 1024);

    console.log(`Memory leak test: Difference=${memoryDifferenceMB.toFixed(2)}MB`);

    // Memory difference should be minimal after GC
    expect(memoryDifferenceMB).toBeLessThan(10); // Less than 10MB difference
  });
});

test.describe('Performance Regression Testing', () => {
  test('performance budgets are maintained', async ({ page }) => {
    const performanceBudgets = {
      timeToFirstByte: 1500,      // 1.5s
      firstContentfulPaint: 1800, // 1.8s
      domContentLoaded: 3000,     // 3s
      loadComplete: 5000,         // 5s
      totalPageSize: 3 * 1024 * 1024, // 3MB
      totalRequests: 50           // 50 requests
    };

    const homePage = new HomePage(page);

    // Start monitoring
    const startTime = Date.now();

    await homePage.navigateToHome();
    await homePage.waitForHomePageLoad();

    const totalLoadTime = Date.now() - startTime;

    // Get detailed metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const resources = performance.getEntriesByType('resource');

      return {
        timeToFirstByte: navigation.responseStart - navigation.requestStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        totalPageSize: resources.reduce((total, r) => total + (r as any).transferSize, 0),
        totalRequests: resources.length
      };
    });

    console.log('Performance metrics vs budgets:', {
      budgets: performanceBudgets,
      actual: metrics,
      totalLoadTime
    });

    // Verify all budgets are met
    expect(metrics.timeToFirstByte).toBeLessThan(performanceBudgets.timeToFirstByte);
    expect(metrics.firstContentfulPaint).toBeLessThan(performanceBudgets.firstContentfulPaint);
    expect(metrics.domContentLoaded).toBeLessThan(performanceBudgets.domContentLoaded);
    expect(metrics.loadComplete).toBeLessThan(performanceBudgets.loadComplete);
    expect(metrics.totalPageSize).toBeLessThan(performanceBudgets.totalPageSize);
    expect(metrics.totalRequests).toBeLessThan(performanceBudgets.totalRequests);
    expect(totalLoadTime).toBeLessThan(performanceBudgets.loadComplete);
  });
});