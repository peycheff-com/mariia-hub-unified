import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

import { Page } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

interface VisualRegressionOptions {
  threshold?: number;
  fullPage?: boolean;
  selector?: string;
  animations?: 'disabled' | 'enabled';
  mask?: string[];
}

export class VisualRegression {
  private screenshotsDir = './test-results/visual-screenshots';
  private baselineDir = './tests/e2e/visual-baseline';
  private diffDir = './test-results/visual-diffs';
  private reportData: any[] = [];

  constructor(private page: Page) {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.screenshotsDir, this.baselineDir, this.diffDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  private async disableAnimations() {
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
      `
    });
  }

  private async waitForStable(options: VisualRegressionOptions) {
    if (options.animations === 'disabled') {
      await this.disableAnimations();
    }

    // Wait for fonts to load
    await this.page.evaluate(() => {
      return document.fonts.ready;
    });

    // Wait for images to load
    await this.page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete);
    });

    // Additional wait for dynamic content
    await this.page.waitForTimeout(100);
  }

  private generateHash(content: Buffer): string {
    return createHash('md5').update(content).digest('hex');
  }

  private async takeScreenshot(options: VisualRegressionOptions): Promise<{ buffer: Buffer; hash: string }> {
    const { fullPage = true, selector, mask = [] } = options;

    const screenshotOptions: any = {
      fullPage,
      animations: 'disabled',
      mask: mask.map(selector => this.page.locator(selector)),
    };

    if (selector) {
      const element = this.page.locator(selector);
      return {
        buffer: await element.screenshot(screenshotOptions),
        hash: ''
      };
    }

    const buffer = await this.page.screenshot(screenshotOptions);
    return {
      buffer,
      hash: this.generateHash(buffer)
    };
  }

  async compareWithBaseline(name: string, options: VisualRegressionOptions = {}): Promise<{
    passed: boolean;
    baseline?: string;
    current?: string;
    diff?: string;
    diffPercentage?: number;
  }> {
    const {
      threshold = 0.1,
      fullPage = true,
      selector,
      animations = 'disabled',
      mask = []
    } = options;

    await this.waitForStable(options);

    // Take current screenshot
    const { buffer: currentBuffer } = await this.takeScreenshot({ fullPage, selector, mask, animations });
    const currentPath = join(this.screenshotsDir, `${name}-current.png`);
    writeFileSync(currentPath, currentBuffer);

    // Check if baseline exists
    const baselinePath = join(this.baselineDir, `${name}.png`);

    if (!existsSync(baselinePath)) {
      console.log(`⚠️ No baseline found for ${name}. Creating new baseline...`);
      writeFileSync(baselinePath, currentBuffer);

      this.reportData.push({
        name,
        status: 'new',
        baseline: baselinePath,
        current: currentPath,
        diff: null,
        diffPercentage: 0
      });

      return {
        passed: true,
        baseline: baselinePath,
        current: currentPath,
        diffPercentage: 0
      };
    }

    // Load baseline image
    const baselineBuffer = readFileSync(baselinePath);
    const baselinePNG = PNG.sync.read(baselineBuffer);
    const currentPNG = PNG.sync.read(currentBuffer);

    // Ensure dimensions match
    if (baselinePNG.width !== currentPNG.width || baselinePNG.height !== currentPNG.height) {
      console.log(`⚠️ Dimension mismatch for ${name}. Baseline: ${baselinePNG.width}x${baselinePNG.height}, Current: ${currentPNG.width}x${currentPNG.height}`);

      // Create diff showing dimension issue
      const diffPNG = new PNG({ width: Math.max(baselinePNG.width, currentPNG.width), height: Math.max(baselinePNG.height, currentPNG.height) });
      const diff = createHash('md5').update(`dimension-mismatch-${Date.now()}`).digest('hex');
      const diffPath = join(this.diffDir, `${name}-diff-${diff}.png`);
      writeFileSync(diffPath, PNG.sync.write(diffPNG));

      this.reportData.push({
        name,
        status: 'dimension-mismatch',
        baseline: baselinePath,
        current: currentPath,
        diff: diffPath,
        diffPercentage: 100
      });

      return {
        passed: false,
        baseline: baselinePath,
        current: currentPath,
        diff: diffPath,
        diffPercentage: 100
      };
    }

    // Compare images
    const { width, height } = baselinePNG;
    const diffPNG = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      baselinePNG.data,
      currentPNG.data,
      diffPNG.data,
      width,
      height,
      {
        threshold: 0.1,
        includeAA: true,
        diffColor: { r: 255, g: 0, b: 0 },
        diffMask: new Uint8Array(width * height),
        diffColorAlt: { r: 0, g: 0, b: 255 }
      }
    );

    const totalPixels = width * height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;
    const passed = diffPercentage <= threshold;

    // Save diff if there are differences
    let diffPath: string | undefined;
    if (!passed && numDiffPixels > 0) {
      const diff = createHash('md5').update(`${name}-${Date.now()}`).digest('hex');
      diffPath = join(this.diffDir, `${name}-diff-${diff}.png`);
      writeFileSync(diffPath, PNG.sync.write(diffPNG));
    }

    // Update report data
    this.reportData.push({
      name,
      status: passed ? 'passed' : 'failed',
      baseline: baselinePath,
      current: currentPath,
      diff: diffPath,
      diffPercentage: diffPercentage.toFixed(2),
      numDiffPixels
    });

    if (!passed) {
      console.log(`❌ Visual regression detected for ${name}`);
      console.log(`   Diff pixels: ${numDiffPixels}/${totalPixels} (${diffPercentage.toFixed(2)}%)`);
      console.log(`   Baseline: ${baselinePath}`);
      console.log(`   Current: ${currentPath}`);
      if (diffPath) {
        console.log(`   Diff: ${diffPath}`);
      }
    }

    return {
      passed,
      baseline: baselinePath,
      current: currentPath,
      diff: diffPath,
      diffPercentage
    };
  }

  async updateBaseline(name: string, options: VisualRegressionOptions = {}) {
    await this.waitForStable(options);
    const { buffer } = await this.takeScreenshot(options);
    const baselinePath = join(this.baselineDir, `${name}.png`);
    writeFileSync(baselinePath, buffer);
    console.log(`✅ Baseline updated for ${name}: ${baselinePath}`);
  }

  async generateReport(): Promise<string> {
    const reportPath = './test-results/visual-report.html';
    const html = this.generateHTMLReport();
    writeFileSync(reportPath, html);
    console.log(`📊 Visual report generated: ${reportPath}`);
    return reportPath;
  }

  private generateHTMLReport(): string {
    const passedCount = this.reportData.filter(r => r.status === 'passed').length;
    const failedCount = this.reportData.filter(r => r.status === 'failed').length;
    const newCount = this.reportData.filter(r => r.status === 'new').length;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Visual Regression Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; }
    .summary { display: flex; gap: 20px; margin-bottom: 30px; }
    .summary-card { flex: 1; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .summary-card h3 { margin: 0 0 10px 0; }
    .passed { color: #28a745; }
    .failed { color: #dc3545; }
    .new { color: #ffc107; }
    .test-item { background: white; margin-bottom: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .test-header { padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; }
    .test-name { font-weight: 600; margin: 0; }
    .test-status { padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; }
    .status-passed { background: #28a745; }
    .status-failed { background: #dc3545; }
    .status-new { background: #ffc107; color: #000; }
    .test-images { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; padding: 20px; }
    .image-container { text-align: center; }
    .image-container img { max-width: 100%; border: 1px solid #dee2e6; border-radius: 4px; }
    .image-label { margin-top: 10px; font-weight: 500; color: #666; }
    .diff-info { color: #dc3545; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Visual Regression Report</h1>

    <div class="summary">
      <div class="summary-card">
        <h3 class="passed">Passed: ${passedCount}</h3>
      </div>
      <div class="summary-card">
        <h3 class="failed">Failed: ${failedCount}</h3>
      </div>
      <div class="summary-card">
        <h3 class="new">New: ${newCount}</h3>
      </div>
    </div>

    ${this.reportData.map(test => `
      <div class="test-item">
        <div class="test-header">
          <h3 class="test-name">${test.name}</h3>
          <span class="test-status status-${test.status}">${test.status.toUpperCase()}</span>
        </div>
        <div class="test-images">
          <div class="image-container">
            <img src="..${test.baseline}" alt="Baseline">
            <div class="image-label">Baseline</div>
          </div>
          <div class="image-container">
            <img src="..${test.current}" alt="Current">
            <div class="image-label">Current</div>
          </div>
          ${test.diff ? `
            <div class="image-container">
              <img src="..${test.diff}" alt="Diff">
              <div class="image-label diff-info">Diff: ${test.diffPercentage}% (${test.numDiffPixels} pixels)</div>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;
  }

  // Predefined visual tests for common components
  async testHeroSection() {
    return this.compareWithBaseline('hero-section', {
      selector: '[data-testid="hero-section"]',
      fullPage: false,
      mask: ['[data-testid="dynamic-content"]']
    });
  }

  async testServiceGrid() {
    return this.compareWithBaseline('service-grid', {
      selector: '[data-testid="service-grid"]',
      fullPage: false
    });
  }

  async testBookingWizard(step: number) {
    return this.compareWithBaseline(`booking-wizard-step-${step}`, {
      selector: '[data-testid="booking-wizard"]',
      fullPage: false,
      mask: ['[data-testid="time-slots"]'] // Mask dynamic time slots
    });
  }

  async testNavigation() {
    return this.compareWithBaseline('navigation', {
      selector: '[data-testid="navigation"]',
      fullPage: false
    });
  }

  async testFooter() {
    return this.compareWithBaseline('footer', {
      selector: 'footer',
      fullPage: false,
      mask: ['[data-testid="social-feed"]'] // Mask dynamic social content
    });
  }

  async testResponsiveViewports(name: string, options: Omit<VisualRegressionOptions, 'fullPage'> = {}) {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'large', width: 1920, height: 1080 }
    ];

    const results = [];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      const result = await this.compareWithBaseline(`${name}-${viewport.name}`, {
        ...options,
        fullPage: true
      });
      results.push({ viewport: viewport.name, ...result });
    }

    return results;
  }

  async testDarkMode(name: string) {
    // Toggle dark mode
    await this.page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    });

    await this.page.waitForTimeout(300); // Wait for theme transition

    const result = await this.compareWithBaseline(`${name}-dark`, {
      fullPage: false,
      ...{ selector: '' }
    });

    // Reset to light mode
    await this.page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    });

    return result;
  }

  async testComponentStates(name: string, selector: string) {
    const states = ['default', 'hover', 'focus', 'active'];
    const results = [];

    for (const state of states) {
      // Reset to default state first
      await this.page.mouse.move(0, 0);
      await this.page.mouse.click(0, 0);

      // Apply state
      switch (state) {
        case 'hover':
          await this.page.hover(selector);
          await this.page.waitForTimeout(200);
          break;
        case 'focus':
          await this.page.focus(selector);
          await this.page.waitForTimeout(200);
          break;
        case 'active':
          await this.page.hover(selector);
          await this.page.mouse.down();
          await this.page.waitForTimeout(100);
          await this.page.mouse.up();
          await this.page.waitForTimeout(100);
          break;
      }

      const result = await this.compareWithBaseline(`${name}-${state}`, {
        selector,
        fullPage: false
      });

      results.push({ state, ...result });
    }

    return results;
  }
}
