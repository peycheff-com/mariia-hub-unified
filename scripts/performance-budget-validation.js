#!/usr/bin/env node

/**
 * Performance Budget Validation Script
 * Validates bundle sizes, image optimizations, and performance metrics
 * against luxury market standards
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Performance budgets for luxury beauty market
const PERFORMANCE_BUDGETS = {
  // Bundle size budgets (in bytes)
  bundles: {
    'react-vendor': 150 * 1024,    // 150KB
    'router-vendor': 50 * 1024,    // 50KB
    'query-vendor': 40 * 1024,     // 40KB
    'ui-vendor': 80 * 1024,        // 80KB
    'forms-vendor': 30 * 1024,     // 30KB
    'utils-vendor': 25 * 1024,     // 25KB
    'animations-vendor': 35 * 1024, // 35KB
    'supabase-vendor': 45 * 1024,   // 45KB
    'i18n-vendor': 20 * 1024,       // 20KB
    'stripe-vendor': 40 * 1024,     // 40KB
    'total': 300 * 1024,            // 300KB total
  },

  // Image size budgets (in bytes)
  images: {
    hero: 500 * 1024,        // 500KB for hero images
    gallery: 200 * 1024,     // 200KB for gallery images
    thumbnail: 20 * 1024,    // 20KB for thumbnails
    logo: 50 * 1024,         // 50KB for logos
  },

  // Performance metrics thresholds (in milliseconds)
  metrics: {
    lcp: 2500,  // Largest Contentful Paint
    fid: 100,   // First Input Delay
    cls: 0.1,   // Cumulative Layout Shift
    fcp: 1800,  // First Contentful Paint
    ttfb: 600,  // Time to First Byte
  },

  // API performance thresholds
  api: {
    responseTime: 2000,     // 2s response time
    timeout: 30000,         // 30s timeout
    maxRetries: 3,          // Maximum retries
    errorRate: 0.01,        // 1% error rate
  }
};

class PerformanceBudgetValidator {
  constructor() {
    this.distPath = join(__dirname, '../dist');
    this.publicPath = join(__dirname, '../public');
    this.violations = [];
    this.warnings = [];
    this.passes = [];
  }

  async validate() {
    console.log('🔍 Performance Budget Validation Started\n');
    console.log('Target: Luxury Beauty Market Standards\n');

    try {
      // Validate bundle sizes
      await this.validateBundleSizes();

      // Validate image optimizations
      await this.validateImageOptimizations();

      // Validate critical files
      await this.validateCriticalFiles();

      // Generate report
      this.generateReport();

      // Set exit code based on violations
      process.exit(this.violations.length > 0 ? 1 : 0);

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  async validateBundleSizes() {
    console.log('📦 Validating Bundle Sizes...');

    const assetsPath = join(this.distPath, 'assets');
    if (!existsSync(assetsPath)) {
      this.warnings.push('Assets directory not found - build may have failed');
      return;
    }

    const bundleStats = this.getBundleStats(assetsPath);
    let totalSize = 0;

    for (const [name, budget] of Object.entries(PERFORMANCE_BUDGETS.bundles)) {
      if (name === 'total') continue;

      const bundle = bundleStats.find(b => b.name.includes(name));
      const size = bundle?.size || 0;
      totalSize += size;

      if (size > budget) {
        this.violations.push({
          type: 'bundle-size',
          severity: 'error',
          message: `Bundle ${name} exceeds budget`,
          details: {
            actual: this.formatBytes(size),
            budget: this.formatBytes(budget),
            overage: this.formatBytes(size - budget),
            path: bundle?.path || 'N/A'
          }
        });
      } else {
        this.passes.push({
          type: 'bundle-size',
          message: `Bundle ${name} within budget`,
          details: {
            actual: this.formatBytes(size),
            budget: this.formatBytes(budget),
            efficiency: Math.round((1 - size / budget) * 100) + '%'
          }
        });
      }
    }

    // Check total bundle size
    if (totalSize > PERFORMANCE_BUDGETS.bundles.total) {
      this.violations.push({
        type: 'bundle-size',
        severity: 'error',
        message: `Total bundle size exceeds budget`,
        details: {
          actual: this.formatBytes(totalSize),
          budget: this.formatBytes(PERFORMANCE_BUDGETS.bundles.total),
          overage: this.formatBytes(totalSize - PERFORMANCE_BUDGETS.bundles.total)
        }
      });
    } else {
      this.passes.push({
        type: 'bundle-size',
        message: `Total bundle size within budget`,
        details: {
          actual: this.formatBytes(totalSize),
          budget: this.formatBytes(PERFORMANCE_BUDGETS.bundles.total),
          efficiency: Math.round((1 - totalSize / PERFORMANCE_BUDGETS.bundles.total) * 100) + '%'
        }
      });
    }

    console.log('✅ Bundle size validation complete\n');
  }

  async validateImageOptimizations() {
    console.log('🖼️  Validating Image Optimizations...');

    const imagePaths = [
      join(this.publicPath, 'images'),
      join(this.distPath, 'assets', 'images')
    ];

    let totalImages = 0;
    let optimizedImages = 0;

    for (const imagePath of imagePaths) {
      if (!existsSync(imagePath)) continue;

      const images = this.getImageStats(imagePath);
      totalImages += images.length;

      for (const image of images) {
        const budget = this.getImageBudget(image.name);

        if (budget && image.size > budget) {
          this.violations.push({
            type: 'image-size',
            severity: 'warning',
            message: `Image ${image.name} exceeds size budget`,
            details: {
              actual: this.formatBytes(image.size),
              budget: this.formatBytes(budget),
              overage: this.formatBytes(image.size - budget),
              path: image.path,
              suggestion: this.getOptimizationSuggestion(image.name)
            }
          });
        } else {
          optimizedImages++;
        }

        // Check for modern formats
        if (!image.name.endsWith('.webp') && !image.name.endsWith('.avif')) {
          this.warnings.push({
            type: 'image-format',
            message: `Image ${image.name} not using modern format`,
            details: {
              currentFormat: image.name.split('.').pop(),
              recommendation: 'Consider using WebP or AVIF for better compression',
              path: image.path
            }
          });
        }
      }
    }

    if (totalImages > 0) {
      const optimizationRate = (optimizedImages / totalImages) * 100;

      if (optimizationRate >= 90) {
        this.passes.push({
          type: 'image-optimization',
          message: `Excellent image optimization rate`,
          details: {
            rate: Math.round(optimizationRate) + '%',
            optimized: optimizedImages,
            total: totalImages
          }
        });
      } else if (optimizationRate >= 75) {
        this.warnings.push({
          type: 'image-optimization',
          message: `Good image optimization rate`,
          details: {
            rate: Math.round(optimizationRate) + '%',
            optimized: optimizedImages,
            total: totalImages,
            suggestion: 'Optimize more images for better performance'
          }
        });
      } else {
        this.violations.push({
          type: 'image-optimization',
          severity: 'warning',
          message: `Low image optimization rate`,
          details: {
            rate: Math.round(optimizationRate) + '%',
            optimized: optimizedImages,
            total: totalImages,
            suggestion: 'Significant image optimization needed'
          }
        });
      }
    }

    console.log('✅ Image optimization validation complete\n');
  }

  async validateCriticalFiles() {
    console.log('⚡ Validating Critical Files...');

    const criticalFiles = [
      'index.html',
      'manifest.json',
      'sw.js'
    ];

    for (const file of criticalFiles) {
      const filePath = join(this.distPath, file);

      if (!existsSync(filePath)) {
        this.violations.push({
          type: 'missing-file',
          severity: 'error',
          message: `Critical file missing: ${file}`,
          details: {
            expectedPath: filePath,
            impact: file === 'sw.js' ? 'PWA functionality disabled' : 'Core functionality affected'
          }
        });
        continue;
      }

      const stats = statSync(filePath);

      // Check file sizes for critical files
      if (file === 'index.html' && stats.size > 10 * 1024) { // 10KB
        this.warnings.push({
          type: 'file-size',
          message: `HTML file is large`,
          details: {
            file,
            size: this.formatBytes(stats.size),
            recommendation: 'Consider inline critical CSS and defer non-critical resources'
          }
        });
      }
    }

    // Check for service worker registration
    const htmlPath = join(this.distPath, 'index.html');
    if (existsSync(htmlPath)) {
      const html = readFileSync(htmlPath, 'utf8');

      if (!html.includes('navigator.serviceWorker')) {
        this.warnings.push({
          type: 'pwa',
          message: 'Service worker registration not found',
          details: {
            impact: 'PWA features will not work offline',
            recommendation: 'Add service worker registration to main script'
          }
        });
      } else {
        this.passes.push({
          type: 'pwa',
          message: 'Service worker registration found',
          details: {
            benefit: 'PWA features enabled for better user experience'
          }
        });
      }
    }

    console.log('✅ Critical files validation complete\n');
  }

  getBundleStats(assetsPath) {
    const bundles = [];

    try {
      const files = require('fs').readdirSync(assetsPath);

      for (const file of files) {
        if (file.endsWith('.js')) {
          const filePath = join(assetsPath, file);
          const stats = statSync(filePath);

          bundles.push({
            name: file.replace(/-\w+\.js$/, ''), // Remove hash
            size: stats.size,
            path: filePath
          });
        }
      }
    } catch (error) {
      console.warn('Could not read assets directory:', error.message);
    }

    return bundles;
  }

  getImageStats(imagePath) {
    const images = [];

    try {
      const files = require('fs').readdirSync(imagePath);

      for (const file of files) {
        if (this.isImageFile(file)) {
          const filePath = join(imagePath, file);
          const stats = statSync(filePath);

          images.push({
            name: file,
            size: stats.size,
            path: filePath
          });
        }
      }
    } catch (error) {
      console.warn(`Could not read image directory ${imagePath}:`, error.message);
    }

    return images;
  }

  isImageFile(filename) {
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(filename);
  }

  getImageBudget(filename) {
    const name = filename.toLowerCase();

    if (name.includes('hero') || name.includes('banner')) {
      return PERFORMANCE_BUDGETS.images.hero;
    }
    if (name.includes('gallery') || name.includes('portfolio')) {
      return PERFORMANCE_BUDGETS.images.gallery;
    }
    if (name.includes('thumb') || name.includes('small')) {
      return PERFORMANCE_BUDGETS.images.thumbnail;
    }
    if (name.includes('logo')) {
      return PERFORMANCE_BUDGETS.images.logo;
    }

    return PERFORMANCE_BUDGETS.images.gallery; // Default budget
  }

  getOptimizationSuggestion(filename) {
    const name = filename.toLowerCase();

    if (name.includes('hero')) {
      return 'Use responsive images with WebP/AVIF format and implement lazy loading';
    }
    if (name.includes('gallery')) {
      return 'Optimize for web, use WebP format, and implement progressive loading';
    }
    if (name.includes('thumb')) {
      return 'Use small, optimized thumbnails with WebP format';
    }

    return 'Compress image and consider modern formats (WebP/AVIF)';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateReport() {
    console.log('📊 PERFORMANCE BUDGET REPORT\n');
    console.log('='.repeat(50));

    // Summary
    console.log(`\n📈 SUMMARY:`);
    console.log(`✅ Passes: ${this.passes.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Violations: ${this.violations.length}`);

    // Violations
    if (this.violations.length > 0) {
      console.log(`\n❌ VIOLATIONS (${this.violations.length}):`);
      this.violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.message}`);
        if (violation.details) {
          Object.entries(violation.details).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
          });
        }
      });
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.message}`);
        if (warning.details) {
          Object.entries(warning.details).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
          });
        }
      });
    }

    // Passes (top 10)
    if (this.passes.length > 0) {
      console.log(`\n✅ PASSES (${this.passes.length}):`);
      this.passes.slice(0, 10).forEach((pass, index) => {
        console.log(`\n${index + 1}. ${pass.message}`);
        if (pass.details) {
          Object.entries(pass.details).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
          });
        }
      });

      if (this.passes.length > 10) {
        console.log(`\n   ... and ${this.passes.length - 10} more passes`);
      }
    }

    // Performance Score
    const score = this.calculatePerformanceScore();
    console.log(`\n🏆 PERFORMANCE SCORE: ${score}/100`);

    if (score >= 90) {
      console.log('🌟 Excellent! Ready for luxury market deployment.');
    } else if (score >= 75) {
      console.log('✅ Good performance. Consider addressing warnings for optimal experience.');
    } else if (score >= 60) {
      console.log('⚠️  Acceptable but needs optimization for luxury standards.');
    } else {
      console.log('❌ Performance below luxury market standards. Optimization required.');
    }

    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    this.generateRecommendations();

    console.log('\n' + '='.repeat(50));
    console.log('Validation complete.\n');
  }

  calculatePerformanceScore() {
    let score = 100;

    // Deduct points for violations
    score -= this.violations.length * 10;

    // Deduct points for warnings
    score -= this.warnings.length * 5;

    // Bonus for passes
    score += Math.min(this.passes.length, 10);

    return Math.max(0, Math.min(100, score));
  }

  generateRecommendations() {
    const recommendations = [];

    // Bundle size recommendations
    const bundleViolations = this.violations.filter(v => v.type === 'bundle-size');
    if (bundleViolations.length > 0) {
      recommendations.push('🔧 Optimize bundle sizes: Implement code splitting and tree shaking');
    }

    // Image optimization recommendations
    const imageViolations = this.violations.filter(v => v.type === 'image-size');
    if (imageViolations.length > 0) {
      recommendations.push('🖼️  Optimize images: Use WebP/AVIF formats and implement responsive images');
    }

    // Missing files recommendations
    const missingFiles = this.violations.filter(v => v.type === 'missing-file');
    if (missingFiles.length > 0) {
      recommendations.push('📁 Fix missing critical files: Ensure all required files are built');
    }

    // PWA recommendations
    const pwaWarnings = this.warnings.filter(w => w.type === 'pwa');
    if (pwaWarnings.length > 0) {
      recommendations.push('📱 Implement PWA features: Add service worker for offline functionality');
    }

    if (recommendations.length === 0) {
      recommendations.push('🎉 Performance is optimized! Continue monitoring in production.');
    }

    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new PerformanceBudgetValidator();
  validator.validate().catch(console.error);
}

export default PerformanceBudgetValidator;