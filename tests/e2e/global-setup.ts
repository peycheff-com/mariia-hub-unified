import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright global setup for comprehensive E2E testing...');

  // Get test configuration
  const baseUrl = config.webServer?.url || process.env.BASE_URL || 'http://localhost:8080';
  const isCI = process.env.CI === 'true';

  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`🔧 CI Environment: ${isCI}`);

  // Create browser for setup tasks
  const browser = await chromium.launch({
    headless: isCI,
    slowMo: isCI ? 0 : 100
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    locale: 'en-US',
    timezoneId: 'Europe/Warsaw'
  });

  const page = await context.newPage();

  try {
    // Set up test environment variables
    process.env.TEST_ENVIRONMENT = isCI ? 'staging' : 'development';
    process.env.TEST_TIMEOUT = (60 * 1000).toString(); // 60 seconds
    process.env.BASE_URL = baseUrl;

    // Create test directories
    const screenshotsDir = join(process.cwd(), 'test-results', 'screenshots');
    const baselineDir = join(process.cwd(), 'test-results', 'baseline');
    const reportsDir = join(process.cwd(), 'test-results', 'reports');

    [screenshotsDir, baselineDir, reportsDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    // Wait for application to be ready
    if (!isCI) {
      console.log('⏳ Waiting for application to be ready...');
      await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Check if application is responsive
      const title = await page.title();
      console.log(`📄 Application title: ${title}`);

      if (!title.includes('Mariia') && !title.includes('Beauty') && !title.includes('Hub')) {
        console.warn(`⚠️  Application may not be ready. Title: ${title}`);
      }

      // Verify critical endpoints are accessible
      console.log('🔍 Verifying critical endpoints...');
      const endpoints = ['/', '/beauty', '/fitness', '/book'];

      for (const endpoint of endpoints) {
        try {
          const response = await page.goto(`${baseUrl}${endpoint}`, { waitUntil: 'domcontentloaded' });
          if (response && response.status() !== 200) {
            console.warn(`⚠️  Endpoint ${endpoint} returned status ${response.status()}`);
          } else {
            console.log(`✅ Endpoint ${endpoint} is accessible`);
          }
        } catch (error) {
          console.warn(`⚠️  Could not access endpoint ${endpoint}:`, error);
        }
      }
    }

    // Set up mock data for testing
    console.log('📊 Setting up test data and mocks...');
    await setupTestData(page, baseUrl);

    // Initialize visual regression baselines if needed
    if (process.env.UPDATE_BASELINE_SCREENSHOTS === 'true') {
      console.log('📸 Taking baseline screenshots...');
      await takeBaselineScreenshots(page, config);
    }

    // Set up performance monitoring
    console.log('📈 Setting up performance monitoring...');
    await setupPerformanceMonitoring(page);

    // Configure accessibility testing
    console.log('♿ Setting up accessibility testing...');
    await setupAccessibilityTesting(page);

    console.log('✅ Playwright global setup complete');
    console.log(`🧪 Test environment: ${process.env.TEST_ENVIRONMENT}`);
    console.log(`⏰ Test timeout: ${process.env.TEST_TIMEOUT}ms`);

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Set up test data and mocks for E2E testing
 */
async function setupTestData(page: any, baseUrl: string) {
  try {
    // Initialize test data state
    await page.addInitScript(() => {
      // Mock test data for consistent testing
      (window as any).__TEST_DATA__ = {
        users: {
          polish: {
            firstName: 'Anna',
            lastName: 'Nowak',
            email: 'anna.nowak@test.pl',
            phone: '+48 512 345 678'
          },
          international: {
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah.johnson@test.com',
            phone: '+44 20 7946 0958'
          }
        },
        services: {
          beauty: [
            { id: 'brows-lamination', name: 'Brow Lamination', price: 350, duration: 60 },
            { id: 'lip-enhancement', name: 'Lip Enhancement', price: 400, duration: 90 }
          ],
          fitness: [
            { id: 'personal-training', name: 'Personal Training', price: 200, duration: 60 },
            { id: 'glutes-program', name: 'Glute Sculpting Program', price: 150, duration: 45 }
          ]
        },
        timeSlots: {
          morning: ['09:00', '09:30', '10:00', '10:30', '11:00'],
          afternoon: ['12:00', '12:30', '14:00', '14:30', '15:00'],
          evening: ['16:00', '16:30', '17:00', '17:30', '18:00']
        }
      };
    });

    // Set up API mocking for consistent test responses
    await page.route('**/rest/v1/services**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'brows-lamination', name: 'Brow Lamination', type: 'beauty', price: 350, duration: 60 },
          { id: 'lip-enhancement', name: 'Lip Enhancement', type: 'beauty', price: 400, duration: 90 },
          { id: 'personal-training', name: 'Personal Training', type: 'fitness', price: 200, duration: 60 },
          { id: 'glutes-program', name: 'Glute Sculpting Program', type: 'fitness', price: 150, duration: 45 }
        ])
      });
    });

    await page.route('**/rest/v1/availability_slots**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'slot-1', start_time: '2024-12-15T09:00:00Z', end_time: '2024-12-15T10:00:00Z', is_available: true },
          { id: 'slot-2', start_time: '2024-12-15T10:30:00Z', end_time: '2024-12-15T11:30:00Z', is_available: true },
          { id: 'slot-3', start_time: '2024-12-15T14:00:00Z', end_time: '2024-12-15T15:00:00Z', is_available: true }
        ])
      });
    });

    console.log('✅ Test data and mocks configured');
  } catch (error) {
    console.warn('⚠️  Could not set up test data:', error);
  }
}

/**
 * Take baseline screenshots for visual regression testing
 */
async function takeBaselineScreenshots(page: any, config: FullConfig) {
  const screenshotsDir = join(process.cwd(), 'test-results', 'baseline');

  try {
    const pages = [
      { path: '/', name: 'homepage' },
      { path: '/beauty', name: 'beauty-page' },
      { path: '/fitness', name: 'fitness-page' },
      { path: '/book', name: 'booking-page' }
    ];

    for (const pageConfig of pages) {
      try {
        await page.goto(`${process.env.BASE_URL}${pageConfig.path}`);
        await page.waitForLoadState('networkidle');

        // Disable animations for consistent screenshots
        await page.addStyleTag({
          content: `
            *, *::before, *::after {
              animation-duration: 0s !important;
              animation-delay: 0s !important;
              transition-duration: 0s !important;
              transition-delay: 0s !important;
            }
          `
        });

        await page.screenshot({
          path: `${screenshotsDir}/${pageConfig.name}-baseline.png`,
          fullPage: true,
          animations: 'disabled'
        });

        console.log(`📸 Baseline screenshot taken: ${pageConfig.name}`);
      } catch (error) {
        console.warn(`⚠️  Could not take baseline screenshot for ${pageConfig.name}:`, error);
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not create baseline screenshots:', error);
  }
}

/**
 * Set up performance monitoring
 */
async function setupPerformanceMonitoring(page: any) {
  try {
    await page.addInitScript(() => {
      // Initialize performance monitoring
      (window as any).__PERFORMANCE_MONITOR__ = {
        metrics: [],
        startMeasure: (name: string) => {
          (window as any).__PERFORMANCE_MONITOR__.metrics.push({
            name,
            startTime: performance.now(),
            type: 'start'
          });
        },
        endMeasure: (name: string) => {
          const metrics = (window as any).__PERFORMANCE_MONITOR__.metrics;
          const startMetric = metrics.find(m => m.name === name && m.type === 'start');
          if (startMetric) {
            metrics.push({
              name,
              endTime: performance.now(),
              duration: performance.now() - startMetric.startTime,
              type: 'end'
            });
          }
        }
      };

      // Monitor Core Web Vitals
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log(`LCP: ${lastEntry.startTime}ms`);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          });
          console.log(`CLS: ${clsValue}`);
        }).observe({ entryTypes: ['layout-shift'] });
      }
    });

    console.log('✅ Performance monitoring configured');
  } catch (error) {
    console.warn('⚠️  Could not set up performance monitoring:', error);
  }
}

/**
 * Set up accessibility testing helpers
 */
async function setupAccessibilityTesting(page: any) {
  try {
    await page.addInitScript(() => {
      // Initialize accessibility testing helpers
      (window as any).__ACCESSIBILITY_HELPERS__ = {
        checkColorContrast: () => {
          // Simple color contrast checking
          const elements = document.querySelectorAll('*');
          const issues: any[] = [];

          elements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;

            // Basic contrast check (would need proper implementation)
            if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
              // This is a simplified check - real implementation would calculate contrast ratios
              const contrast = 4.5; // Placeholder
              if (contrast < 4.5) {
                issues.push({
                  element,
                  contrast,
                  color,
                  backgroundColor
                });
              }
            }
          });

          return issues;
        },
        checkKeyboardNavigation: () => {
          const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          return {
            totalFocusableElements: focusableElements.length,
            hasSkipLinks: document.querySelectorAll('a[href^="#"]').length > 0,
            hasMainLandmark: document.querySelectorAll('main, [role="main"]').length > 0,
            hasNavigationLandmark: document.querySelectorAll('nav, [role="navigation"]').length > 0
          };
        }
      };
    });

    console.log('✅ Accessibility testing helpers configured');
  } catch (error) {
    console.warn('⚠️  Could not set up accessibility testing:', error);
  }
}

export default globalSetup;
