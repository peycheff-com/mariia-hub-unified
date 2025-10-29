import { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');

  // Clean up test data or any other global requirements
  if (process.env.CI) {
    console.log('🔧 Cleaning up CI environment...');
    // Add any CI-specific cleanup here
  }

  console.log('✅ Playwright global teardown complete');
}

export default globalTeardown;
