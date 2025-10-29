import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...');

  // Set up test database or any other global requirements
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Example: Seed test data or authenticate test user
  if (process.env.CI) {
    console.log('🔧 Setting up CI environment...');

    // Set up CI-specific configurations
    if (process.env.STAGING_URL) {
      console.log(`🌐 Using staging URL: ${process.env.STAGING_URL}`);
    }

    // Set up test database if needed
    if (process.env.TEST_DB_URL) {
      console.log('🗄️  Test database URL configured');
    }
  }

  // Set up test environment variables
  process.env.TEST_ENVIRONMENT = process.env.CI ? 'staging' : 'development';
  process.env.TEST_TIMEOUT = (60 * 1000).toString(); // 60 seconds

  // Create test screenshots directory
  const screenshotsDir = join(process.cwd(), 'test-results', 'screenshots');
  if (!existsSync(screenshotsDir)) {
    mkdirSync(screenshotsDir, { recursive: true });
    console.log('📁 Created screenshots directory');
  }

  // Check if application is running (for local development)
  if (!process.env.CI) {
    try {
      await page.goto(process.env.BASE_URL || 'http://localhost:8080');
      await page.waitForLoadState('networkidle');
      console.log('✅ Application is running and accessible');
    } catch (error) {
      console.warn('⚠️  Application not accessible, tests may fail', error);
      console.log('💡 Make sure the application is running on http://localhost:8080');
    }
  }

  // Set up mock services if needed
  console.log('🔌 Setting up test services...');

  // Close browser after setup
  await context.close();
  await browser.close();

  console.log('✅ Playwright global setup complete');
  console.log(`🧪 Test environment: ${process.env.TEST_ENVIRONMENT}`);
  console.log(`⏰ Test timeout: ${process.env.TEST_TIMEOUT}ms`);
}

export default globalSetup;
