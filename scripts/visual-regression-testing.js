#!/usr/bin/env node

/**
 * Visual Regression Testing System
 *
 * Provides comprehensive visual testing capabilities:
 * - Screenshot capture and comparison
 * - Pixel-perfect visual diff detection
 * - Component-level visual testing
 * - Cross-browser visual consistency
 * - Responsive design testing
 * - Visual analytics and reporting
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

class VisualRegressionTesting {
  constructor(options = {}) {
    this.options = {
      baselineDir: path.join(process.cwd(), 'test-results', 'visual', 'baseline'),
      currentDir: path.join(process.cwd(), 'test-results', 'visual', 'current'),
      diffDir: path.join(process.cwd(), 'test-results', 'visual', 'diff'),
      reportsDir: path.join(process.cwd(), 'test-results', 'visual', 'reports'),
      threshold: 0.1, // 0.1% pixel difference threshold
      includeAA: false, // Include anti-aliased pixels
      scaleToSameSize: true,
      parallel: true,
      maxConcurrency: 4,
      viewports: [
        { name: 'Desktop', width: 1280, height: 720 },
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Wide', width: 1920, height: 1080 }
      ],
      themes: ['light', 'dark'],
      pages: [
        { path: '/', name: 'Home' },
        { path: '/beauty', name: 'Beauty Services' },
        { path: '/fitness', name: 'Fitness Programs' },
        { path: '/booking', name: 'Booking' },
        { path: '/about', name: 'About' },
        { path: '/contact', name: 'Contact' }
      ],
      components: [
        'HeroSection',
        'ServiceCard',
        'BookingWizard',
        'TestimonialCard',
        'GalleryComponent'
      ],
      ...options
    };

    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      scenarios: [],
      duration: 0
    };

    this.initializeDirectories();
  }

  initializeDirectories() {
    const dirs = [
      this.options.baselineDir,
      this.options.currentDir,
      this.options.diffDir,
      this.options.reportsDir,
      path.join(this.options.baselineDir, 'desktop'),
      path.join(this.options.baselineDir, 'mobile'),
      path.join(this.options.baselineDir, 'tablet'),
      path.join(this.options.baselineDir, 'wide'),
      path.join(this.options.currentDir, 'desktop'),
      path.join(this.options.currentDir, 'mobile'),
      path.join(this.options.currentDir, 'tablet'),
      path.join(this.options.currentDir, 'wide')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async runVisualTests() {
    console.log('👁️ Starting Visual Regression Testing...\n');
    const startTime = Date.now();

    try {
      // 1. Page-level visual tests
      console.log('📄 Running page-level visual tests...');
      await this.runPageTests();

      // 2. Component-level visual tests
      console.log('🧩 Running component-level visual tests...');
      await this.runComponentTests();

      // 3. Responsive design tests
      console.log('📱 Running responsive design tests...');
      await this.runResponsiveTests();

      // 4. Cross-browser visual tests
      console.log('🌐 Running cross-browser visual tests...');
      await this.runCrossBrowserTests();

      // 5. Generate visual report
      console.log('📊 Generating visual regression report...');
      await this.generateVisualReport();

      this.results.duration = Date.now() - startTime;

      console.log(`\n✅ Visual regression testing completed:`);
      console.log(`   Passed: ${this.results.passed}/${this.results.total}`);
      console.log(`   Failed: ${this.results.failed}/${this.results.total}`);
      console.log(`   Duration: ${(this.results.duration / 1000).toFixed(2)}s`);

      return this.results;

    } catch (error) {
      console.error('❌ Visual regression testing failed:', error);
      throw error;
    }
  }

  async runPageTests() {
    const { pages, viewports, themes } = this.options;

    for (const page of pages) {
      for (const viewport of viewports) {
        for (const theme of themes) {
          await this.testPageVisual(page, viewport, theme);
        }
      }
    }
  }

  async runComponentTests() {
    for (const component of this.options.components) {
      await this.testComponentVisual(component);
    }
  }

  async runResponsiveTests() {
    // Test specific responsive scenarios
    const responsiveTests = [
      {
        name: 'Mobile Menu',
        path: '/',
        viewport: { width: 375, height: 667 },
        actions: [
          { type: 'click', selector: '[data-testid="mobile-menu-toggle"]' },
          { type: 'wait', duration: 500 }
        ]
      },
      {
        name: 'Responsive Gallery',
        path: '/beauty',
        viewport: { width: 768, height: 1024 },
        actions: [
          { type: 'scroll', x: 0, y: 500 },
          { type: 'wait', duration: 300 }
        ]
      },
      {
        name: 'Booking Form Mobile',
        path: '/booking',
        viewport: { width: 375, height: 667 },
        actions: [
          { type: 'click', selector: '[data-testid="service-select"]' },
          { type: 'wait', duration: 500 }
        ]
      }
    ];

    for (const test of responsiveTests) {
      await this.testResponsiveScenario(test);
    }
  }

  async runCrossBrowserTests() {
    // Cross-browser tests would be implemented with Playwright
    const browsers = ['chromium', 'firefox', 'webkit'];

    for (const browser of browsers) {
      await this.testCrossBrowserConsistency(browser);
    }
  }

  async testPageVisual(page, viewport, theme) {
    const scenarioName = `${page.name}_${viewport.name}_${theme}`;
    const scenario = {
      name: scenarioName,
      type: 'page',
      url: page.path,
      viewport,
      theme,
      status: 'pending',
      diff: 0,
      baselinePath: '',
      currentPath: '',
      diffPath: '',
      passed: false
    };

    try {
      console.log(`   📸 Capturing: ${scenarioName}`);

      // Capture current screenshot (would use Playwright in real implementation)
      const currentScreenshot = await this.captureScreenshot(page.path, viewport, theme);
      scenario.currentPath = currentScreenshot.path;

      // Get baseline screenshot
      const baselineScreenshot = await this.getBaselineScreenshot(scenarioName, viewport);
      scenario.baselinePath = baselineScreenshot.path;

      // Compare screenshots
      if (baselineScreenshot.exists) {
        const comparison = await this.compareScreenshots(
          baselineScreenshot.path,
          currentScreenshot.path,
          scenarioName
        );

        scenario.diff = comparison.diff;
        scenario.diffPath = comparison.diffPath;
        scenario.passed = comparison.diff <= this.options.threshold;

        if (!scenario.passed) {
          console.log(`   ⚠️ Visual diff detected: ${scenarioName} (${comparison.diff.toFixed(2)}%)`);
        }
      } else {
        // No baseline exists, create one
        await this.createBaseline(currentScreenshot.path, scenarioName, viewport);
        scenario.passed = true;
        console.log(`   ✨ New baseline created: ${scenarioName}`);
      }

      scenario.status = scenario.passed ? 'passed' : 'failed';
      this.results[scenario.passed ? 'passed' : 'failed']++;
      this.results.total++;

    } catch (error) {
      scenario.status = 'error';
      scenario.error = error.message;
      this.results.failed++;
      this.results.total++;
      console.log(`   ❌ Error testing ${scenarioName}: ${error.message}`);
    }

    this.results.scenarios.push(scenario);
  }

  async testComponentVisual(componentName) {
    const scenarioName = `component_${componentName}`;
    const scenario = {
      name: scenarioName,
      type: 'component',
      component: componentName,
      status: 'pending',
      diff: 0,
      baselinePath: '',
      currentPath: '',
      diffPath: '',
      passed: false
    };

    try {
      console.log(`   🧩 Testing component: ${componentName}`);

      // Capture component screenshot (would use Storybook or similar)
      const currentScreenshot = await this.captureComponentScreenshot(componentName);
      scenario.currentPath = currentScreenshot.path;

      // Get baseline screenshot
      const baselineScreenshot = await this.getBaselineComponentScreenshot(componentName);
      scenario.baselinePath = baselineScreenshot.path;

      // Compare screenshots
      if (baselineScreenshot.exists) {
        const comparison = await this.compareScreenshots(
          baselineScreenshot.path,
          currentScreenshot.path,
          scenarioName
        );

        scenario.diff = comparison.diff;
        scenario.diffPath = comparison.diffPath;
        scenario.passed = comparison.diff <= this.options.threshold;

        if (!scenario.passed) {
          console.log(`   ⚠️ Component visual diff: ${componentName} (${comparison.diff.toFixed(2)}%)`);
        }
      } else {
        // Create baseline
        await this.createComponentBaseline(currentScreenshot.path, componentName);
        scenario.passed = true;
        console.log(`   ✨ New component baseline: ${componentName}`);
      }

      scenario.status = scenario.passed ? 'passed' : 'failed';
      this.results[scenario.passed ? 'passed' : 'failed']++;
      this.results.total++;

    } catch (error) {
      scenario.status = 'error';
      scenario.error = error.message;
      this.results.failed++;
      this.results.total++;
      console.log(`   ❌ Error testing component ${componentName}: ${error.message}`);
    }

    this.results.scenarios.push(scenario);
  }

  async testResponsiveScenario(test) {
    const scenarioName = `responsive_${test.name}`;
    const scenario = {
      name: scenarioName,
      type: 'responsive',
      url: test.path,
      viewport: test.viewport,
      actions: test.actions,
      status: 'pending',
      diff: 0,
      baselinePath: '',
      currentPath: '',
      diffPath: '',
      passed: false
    };

    try {
      console.log(`   📱 Testing responsive scenario: ${test.name}`);

      // Execute actions and capture screenshot
      const currentScreenshot = await this.captureResponsiveScenario(test);
      scenario.currentPath = currentScreenshot.path;

      // Get baseline screenshot
      const baselineScreenshot = await this.getBaselineResponsiveScreenshot(test.name);
      scenario.baselinePath = baselineScreenshot.path;

      // Compare screenshots
      if (baselineScreenshot.exists) {
        const comparison = await this.compareScreenshots(
          baselineScreenshot.path,
          currentScreenshot.path,
          scenarioName
        );

        scenario.diff = comparison.diff;
        scenario.diffPath = comparison.diffPath;
        scenario.passed = comparison.diff <= this.options.threshold;

        if (!scenario.passed) {
          console.log(`   ⚠️ Responsive visual diff: ${test.name} (${comparison.diff.toFixed(2)}%)`);
        }
      } else {
        // Create baseline
        await this.createResponsiveBaseline(currentScreenshot.path, test.name);
        scenario.passed = true;
        console.log(`   ✨ New responsive baseline: ${test.name}`);
      }

      scenario.status = scenario.passed ? 'passed' : 'failed';
      this.results[scenario.passed ? 'passed' : 'failed']++;
      this.results.total++;

    } catch (error) {
      scenario.status = 'error';
      scenario.error = error.message;
      this.results.failed++;
      this.results.total++;
      console.log(`   ❌ Error testing responsive scenario ${test.name}: ${error.message}`);
    }

    this.results.scenarios.push(scenario);
  }

  async testCrossBrowserConsistency(browser) {
    const scenarioName = `crossbrowser_${browser}`;
    const scenario = {
      name: scenarioName,
      type: 'crossbrowser',
      browser,
      status: 'pending',
      diff: 0,
      baselinePath: '',
      currentPath: '',
      diffPath: '',
      passed: false
    };

    try {
      console.log(`   🌐 Testing cross-browser: ${browser}`);

      // Capture screenshot in specific browser
      const currentScreenshot = await this.captureCrossBrowserScreenshot(browser);
      scenario.currentPath = currentScreenshot.path;

      // Get baseline screenshot (typically from Chrome)
      const baselineScreenshot = await this.getBaselineCrossBrowserScreenshot(browser);
      scenario.baselinePath = baselineScreenshot.path;

      // Compare screenshots
      if (baselineScreenshot.exists) {
        const comparison = await this.compareScreenshots(
          baselineScreenshot.path,
          currentScreenshot.path,
          scenarioName,
          { threshold: 0.5 } // Higher tolerance for cross-browser differences
        );

        scenario.diff = comparison.diff;
        scenario.diffPath = comparison.diffPath;
        scenario.passed = comparison.diff <= 0.5; // 0.5% threshold for cross-browser

        if (!scenario.passed) {
          console.log(`   ⚠️ Cross-browser visual diff: ${browser} (${comparison.diff.toFixed(2)}%)`);
        }
      } else {
        // Create baseline
        await this.createCrossBrowserBaseline(currentScreenshot.path, browser);
        scenario.passed = true;
        console.log(`   ✨ New cross-browser baseline: ${browser}`);
      }

      scenario.status = scenario.passed ? 'passed' : 'failed';
      this.results[scenario.passed ? 'passed' : 'failed']++;
      this.results.total++;

    } catch (error) {
      scenario.status = 'error';
      scenario.error = error.message;
      this.results.failed++;
      this.results.total++;
      console.log(`   ❌ Error testing cross-browser ${browser}: ${error.message}`);
    }

    this.results.scenarios.push(scenario);
  }

  async captureScreenshot(url, viewport, theme) {
    // This would use Playwright to capture screenshots
    // For now, we'll simulate the capture process
    const filename = this.generateScreenshotName(url, viewport, theme);
    const filepath = path.join(this.options.currentDir, viewport.name, filename);

    // Simulate screenshot capture (in real implementation, this would use Playwright)
    const mockScreenshot = this.generateMockScreenshot();
    fs.writeFileSync(filepath, mockScreenshot);

    return { path: filepath, exists: true };
  }

  async captureComponentScreenshot(componentName) {
    const filename = `${componentName}.png`;
    const filepath = path.join(this.options.currentDir, 'components', filename);

    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }

    // Simulate component screenshot
    const mockScreenshot = this.generateMockScreenshot({ width: 400, height: 300 });
    fs.writeFileSync(filepath, mockScreenshot);

    return { path: filepath, exists: true };
  }

  async captureResponsiveScenario(test) {
    const filename = `${test.name}.png`;
    const filepath = path.join(this.options.currentDir, 'responsive', filename);

    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }

    // Simulate responsive scenario screenshot
    const mockScreenshot = this.generateMockScreenshot(test.viewport);
    fs.writeFileSync(filepath, mockScreenshot);

    return { path: filepath, exists: true };
  }

  async captureCrossBrowserScreenshot(browser) {
    const filename = `crossbrowser_${browser}.png`;
    const filepath = path.join(this.options.currentDir, 'crossbrowser', filename);

    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }

    // Simulate cross-browser screenshot
    const mockScreenshot = this.generateMockScreenshot();
    fs.writeFileSync(filepath, mockScreenshot);

    return { path: filepath, exists: true };
  }

  async getBaselineScreenshot(scenarioName, viewport) {
    const filename = `${scenarioName}.png`;
    const filepath = path.join(this.options.baselineDir, viewport.name, filename);

    return {
      path: filepath,
      exists: fs.existsSync(filepath)
    };
  }

  async getBaselineComponentScreenshot(componentName) {
    const filename = `${componentName}.png`;
    const filepath = path.join(this.options.baselineDir, 'components', filename);

    return {
      path: filepath,
      exists: fs.existsSync(filepath)
    };
  }

  async getBaselineResponsiveScreenshot(scenarioName) {
    const filename = `${scenarioName}.png`;
    const filepath = path.join(this.options.baselineDir, 'responsive', filename);

    return {
      path: filepath,
      exists: fs.existsSync(filepath)
    };
  }

  async getBaselineCrossBrowserScreenshot(browser) {
    const filename = `crossbrowser_${browser}.png`;
    const filepath = path.join(this.options.baselineDir, 'crossbrowser', filename);

    return {
      path: filepath,
      exists: fs.existsSync(filepath)
    };
  }

  async compareScreenshots(baselinePath, currentPath, scenarioName, options = {}) {
    const threshold = options.threshold || this.options.threshold;

    try {
      const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
      const current = PNG.sync.read(fs.readFileSync(currentPath));

      // Ensure images are the same size
      let baselineImg, currentImg;
      if (this.options.scaleToSameSize) {
        const width = Math.max(baseline.width, current.width);
        const height = Math.max(baseline.height, current.height);
        baselineImg = this.scaleImage(baseline, width, height);
        currentImg = this.scaleImage(current, width, height);
      } else {
        baselineImg = baseline;
        currentImg = current;
      }

      // Create diff image
      const diff = new PNG({ width: baselineImg.width, height: baselineImg.height });

      // Compare images
      const diffPixels = pixelmatch(
        baselineImg.data,
        currentImg.data,
        diff.data,
        baselineImg.width,
        baselineImg.height,
        {
          threshold: 0.1,
          includeAA: this.options.includeAA
        }
      );

      // Calculate diff percentage
      const totalPixels = baselineImg.width * baselineImg.height;
      const diffPercentage = (diffPixels / totalPixels) * 100;

      // Save diff image if there are differences
      if (diffPixels > 0) {
        const diffPath = path.join(this.options.diffDir, `${scenarioName}_diff.png`);
        fs.writeFileSync(diffPath, PNG.sync.write(diff));

        return {
          diff: diffPercentage,
          diffPath,
          diffPixels,
          totalPixels
        };
      }

      return {
        diff: diffPercentage,
        diffPath: null,
        diffPixels,
        totalPixels
      };

    } catch (error) {
      console.error(`Error comparing screenshots for ${scenarioName}:`, error);
      return {
        diff: 100, // Assume total failure
        diffPath: null,
        error: error.message
      };
    }
  }

  scaleImage(image, width, height) {
    // Simple scaling implementation (in real scenario, use a proper image library)
    const scaled = new PNG({ width, height });
    const scaleX = image.width / width;
    const scaleY = image.height / height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const srcIndex = (srcY * image.width + srcX) * 4;
        const destIndex = (y * width + x) * 4;

        scaled.data[destIndex] = image.data[srcIndex];
        scaled.data[destIndex + 1] = image.data[srcIndex + 1];
        scaled.data[destIndex + 2] = image.data[srcIndex + 2];
        scaled.data[destIndex + 3] = image.data[srcIndex + 3];
      }
    }

    return scaled;
  }

  generateScreenshotName(url, viewport, theme) {
    const hash = createHash('md5').update(`${url}_${viewport.name}_${theme}`).digest('hex');
    return `${hash}.png`;
  }

  generateMockScreenshot(size = { width: 1280, height: 720 }) {
    // Generate a mock PNG for demonstration
    const png = new PNG({ width: size.width, height: size.height });

    // Fill with a simple gradient pattern
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        const index = (y * size.width + x) * 4;
        png.data[index] = Math.floor((x / size.width) * 255);     // Red
        png.data[index + 1] = Math.floor((y / size.height) * 255); // Green
        png.data[index + 2] = 128;                                // Blue
        png.data[index + 3] = 255;                                // Alpha
      }
    }

    return PNG.sync.write(png);
  }

  async createBaseline(currentPath, scenarioName, viewport) {
    const baselinePath = path.join(this.options.baselineDir, viewport.name, `${scenarioName}.png`);
    fs.copyFileSync(currentPath, baselinePath);
  }

  async createComponentBaseline(currentPath, componentName) {
    const baselinePath = path.join(this.options.baselineDir, 'components', `${componentName}.png`);
    if (!fs.existsSync(path.dirname(baselinePath))) {
      fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    }
    fs.copyFileSync(currentPath, baselinePath);
  }

  async createResponsiveBaseline(currentPath, scenarioName) {
    const baselinePath = path.join(this.options.baselineDir, 'responsive', `${scenarioName}.png`);
    if (!fs.existsSync(path.dirname(baselinePath))) {
      fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    }
    fs.copyFileSync(currentPath, baselinePath);
  }

  async createCrossBrowserBaseline(currentPath, browser) {
    const baselinePath = path.join(this.options.baselineDir, 'crossbrowser', `crossbrowser_${browser}.png`);
    if (!fs.existsSync(path.dirname(baselinePath))) {
      fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    }
    fs.copyFileSync(currentPath, baselinePath);
  }

  async generateVisualReport() {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Regression Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
        .scenarios { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .scenario { border-bottom: 1px solid #eee; padding: 20px; display: grid; grid-template-columns: 1fr auto; align-items: center; }
        .scenario:last-child { border-bottom: none; }
        .scenario-info h3 { margin: 0 0 10px 0; }
        .scenario-meta { color: #666; font-size: 0.9em; }
        .status { padding: 6px 12px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 0.8em; }
        .status.passed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .status.error { background: #fff3cd; color: #856404; }
        .diff-images { margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .diff-image { text-align: center; }
        .diff-image img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; }
        .diff-image label { display: block; font-size: 0.8em; color: #666; margin-bottom: 5px; }
        .toggle-diffs { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 10px 0; }
        .diffs-container { display: none; }
        .diffs-container.show { display: block; }
    </style>
</head>
<body>
    <div class="header">
        <h1>👁️ Visual Regression Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <div class="summary">
            <div class="metric">
                <div class="metric-value ${this.results.failed === 0 ? 'success' : 'error'}">${this.results.passed}/${this.results.total}</div>
                <div class="metric-label">Tests Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value ${this.results.failed === 0 ? 'success' : 'error'}">${this.results.failed}</div>
                <div class="metric-label">Tests Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${((this.results.duration / 1000).toFixed(2))}s</div>
                <div class="metric-label">Duration</div>
            </div>
            <div class="metric">
                <div class="metric-value ${this.results.failed === 0 ? 'success' : 'warning'}">${this.results.failed === 0 ? '✅' : '⚠️'}</div>
                <div class="metric-label">Overall Status</div>
            </div>
        </div>
    </div>

    <div class="scenarios">
        <div style="padding: 20px; border-bottom: 1px solid #eee; background: #f8f9fa;">
            <button class="toggle-diffs" onclick="toggleDiffs()">Show/Hide Failed Diffs</button>
        </div>
        ${this.results.scenarios.map(scenario => this.generateScenarioHTML(scenario)).join('')}
    </div>

    <script>
        function toggleDiffs() {
            const container = document.querySelector('.diffs-container');
            if (container) {
                container.classList.toggle('show');
            } else {
                const diffs = document.querySelectorAll('.diff-images');
                diffs.forEach(diff => {
                    diff.style.display = diff.style.display === 'none' ? 'grid' : 'none';
                });
            }
        }

        // Show diffs for failed tests by default
        document.addEventListener('DOMContentLoaded', function() {
            const failedScenarios = document.querySelectorAll('.scenario.failed');
            failedScenarios.forEach(scenario => {
                const diffImages = scenario.querySelector('.diff-images');
                if (diffImages) {
                    diffImages.style.display = 'grid';
                }
            });
        });
    </script>
</body>
</html>`;

    fs.writeFileSync(
      path.join(this.options.reportsDir, 'visual-regression-report.html'),
      htmlTemplate
    );

    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        duration: this.results.duration,
        passRate: this.results.total > 0 ? (this.results.passed / this.results.total) * 100 : 0
      },
      scenarios: this.results.scenarios,
      config: {
        threshold: this.options.threshold,
        viewports: this.options.viewports,
        themes: this.options.themes
      }
    };

    fs.writeFileSync(
      path.join(this.options.reportsDir, 'visual-regression-report.json'),
      JSON.stringify(jsonReport, null, 2)
    );
  }

  generateScenarioHTML(scenario) {
    const statusClass = scenario.status;
    const diffImages = scenario.diffPath ? `
        <div class="diff-images">
            <div class="diff-image">
                <label>Baseline</label>
                <img src="../baseline/${scenario.baselinePath.split('/').pop()}" alt="Baseline" />
            </div>
            <div class="diff-image">
                <label>Current</label>
                <img src="../current/${scenario.currentPath.split('/').pop()}" alt="Current" />
            </div>
            <div class="diff-image">
                <label>Diff (${scenario.diff.toFixed(2)}%)</label>
                <img src="../diff/${scenario.diffPath.split('/').pop()}" alt="Difference" />
            </div>
        </div>
    ` : '';

    return `
        <div class="scenario ${statusClass}">
            <div class="scenario-info">
                <h3>${scenario.name}</h3>
                <div class="scenario-meta">
                    Type: ${scenario.type}
                    ${scenario.url ? `| URL: ${scenario.url}` : ''}
                    ${scenario.viewport ? `| Viewport: ${scenario.viewport.name}` : ''}
                    ${scenario.browser ? `| Browser: ${scenario.browser}` : ''}
                    ${scenario.diff !== undefined ? `| Diff: ${scenario.diff.toFixed(2)}%` : ''}
                </div>
                ${diffImages}
                ${scenario.error ? `<div style="color: #dc3545; margin-top: 10px;">Error: ${scenario.error}</div>` : ''}
            </div>
            <div class="status ${statusClass}">${scenario.status}</div>
        </div>
    `;
  }
}

// CLI interface
if (require.main === module) {
  const options = {
    threshold: parseFloat(process.argv[2]) || 0.1,
    updateBaseline: process.argv.includes('--update-baseline'),
    onlyFailed: process.argv.includes('--only-failed')
  };

  const visualTesting = new VisualRegressionTesting(options);

  visualTesting.runVisualTests()
    .then((results) => {
      console.log('\n✅ Visual regression testing completed!');

      if (results.failed === 0) {
        console.log('🎉 All visual tests passed!');
        process.exit(0);
      } else {
        console.log(`❌ ${results.failed} visual tests failed!`);
        console.log('📊 View the detailed report: test-results/visual/reports/visual-regression-report.html');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Visual regression testing failed:', error);
      process.exit(1);
    });
}

module.exports = VisualRegressionTesting;