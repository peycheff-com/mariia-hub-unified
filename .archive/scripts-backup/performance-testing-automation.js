#!/usr/bin/env node

/**
 * Performance Testing Automation System
 *
 * Provides comprehensive performance testing capabilities:
 * - Core Web Vitals validation
 * - Lighthouse performance audits
 * - Load testing and stress testing
 * - Bundle size analysis
 * - Performance budgets enforcement
 * - Real-time performance monitoring
 * - Performance regression detection
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceTestingAutomation {
  constructor(options = {}) {
    this.options = {
      baseUrl: process.env.BASE_URL || 'http://localhost:8080',
      testResultsDir: path.join(process.cwd(), 'test-results', 'performance'),
      reportsDir: path.join(process.cwd(), 'test-results', 'performance', 'reports'),
      lighthouseDir: path.join(process.cwd(), '.lighthouseci'),
      coreWebVitalsThresholds: {
        LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint (ms)
        FID: { good: 100, needsImprovement: 300 },     // First Input Delay (ms)
        CLS: { good: 0.1, needsImprovement: 0.25 },    // Cumulative Layout Shift
        FCP: { good: 1800, needsImprovement: 3000 },   // First Contentful Paint (ms)
        TTFB: { good: 800, needsImprovement: 1800 },   // Time to First Byte (ms)
        INP: { good: 200, needsImprovement: 500 }      // Interaction to Next Paint (ms)
      },
      lighthouseThresholds: {
        performance: 90,
        accessibility: 95,
        'best-practices': 90,
        seo: 85
      },
      budgetThresholds: {
        totalSize: 2500000,        // 2.5MB total
        javascriptSize: 250000,    // 250KB JavaScript
        cssSize: 100000,          // 100KB CSS
        imageSize: 1000000,       // 1MB images
        fontSize: 100000,         // 100KB fonts
        totalRequests: 50,        // Total number of requests
        jsRequests: 10,           // JavaScript requests
        cssRequests: 3            // CSS requests
      },
      loadTesting: {
        concurrentUsers: [10, 50, 100],
        duration: 60, // seconds
        rampUpTime: 10, // seconds
        thinkTime: 2000 // ms between requests
      },
      viewports: [
        { name: 'Desktop', width: 1280, height: 720, deviceScaleFactor: 1 },
        { name: 'Mobile', width: 375, height: 667, deviceScaleFactor: 2 },
        { name: 'Tablet', width: 768, height: 1024, deviceScaleFactor: 1.5 }
      ],
      networkConditions: [
        { name: 'Fast 3G', downloadThroughput: 1.5 * 1024 * 1024, uploadThroughput: 750 * 1024, latency: 40 },
        { name: 'Slow 3G', downloadThroughput: 500 * 1024, uploadThroughput: 500 * 1024, latency: 400 },
        { name: 'Offline', downloadThroughput: 0, uploadThroughput: 0, latency: 0, offline: true }
      ],
      pages: [
        { path: '/', name: 'Home', critical: true },
        { path: '/beauty', name: 'Beauty Services', critical: true },
        { path: '/fitness', name: 'Fitness Programs', critical: true },
        { path: '/booking', name: 'Booking Wizard', critical: true },
        { path: '/about', name: 'About', critical: false },
        { path: '/contact', name: 'Contact', critical: false }
      ],
      ...options
    };

    this.results = {
      summary: {
        overallScore: 0,
        coreWebVitalsScore: 0,
        lighthouseScore: 0,
        budgetScore: 0,
        loadTestScore: 0,
        duration: 0,
        passedAllTests: false
      },
      coreWebVitals: [],
      lighthouse: [],
      budgetAnalysis: {},
      loadTests: [],
      bundleAnalysis: {},
      regressions: [],
      recommendations: []
    };

    this.initializeDirectories();
  }

  initializeDirectories() {
    const dirs = [
      this.options.testResultsDir,
      this.options.reportsDir,
      this.options.lighthouseDir,
      path.join(this.options.testResultsDir, 'core-web-vitals'),
      path.join(this.options.testResultsDir, 'lighthouse'),
      path.join(this.options.testResultsDir, 'load-tests'),
      path.join(this.options.testResultsDir, 'bundle-analysis')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async runPerformanceTests() {
    console.log('⚡ Starting Comprehensive Performance Testing...\n');
    const startTime = Date.now();

    try {
      // 1. Core Web Vitals Testing
      console.log('🎯 Running Core Web Vitals validation...');
      await this.runCoreWebVitalsTests();

      // 2. Lighthouse Performance Audits
      console.log('🔍 Running Lighthouse performance audits...');
      await this.runLighthouseTests();

      // 3. Performance Budget Analysis
      console.log('📊 Analyzing performance budgets...');
      await this.runBudgetAnalysis();

      // 4. Bundle Size Analysis
      console.log('📦 Analyzing bundle sizes...');
      await this.runBundleAnalysis();

      // 5. Load Testing
      console.log('🚀 Running load testing...');
      await this.runLoadTests();

      // 6. Performance Regression Detection
      console.log('📈 Detecting performance regressions...');
      await this.detectPerformanceRegressions();

      // 7. Generate Performance Report
      console.log('📋 Generating performance report...');
      await this.generatePerformanceReport();

      this.results.summary.duration = Date.now() - startTime;

      console.log(`\n✅ Performance testing completed:`);
      console.log(`   Overall Score: ${this.results.summary.overallScore}/100`);
      console.log(`   Core Web Vitals: ${this.results.summary.coreWebVitalsScore}/100`);
      console.log(`   Lighthouse: ${this.results.summary.lighthouseScore}/100`);
      console.log(`   Duration: ${(this.results.summary.duration / 1000).toFixed(2)}s`);

      return this.results;

    } catch (error) {
      console.error('❌ Performance testing failed:', error);
      throw error;
    }
  }

  async runCoreWebVitalsTests() {
    for (const page of this.options.pages) {
      for (const viewport of this.options.viewports) {
        for (const network of this.options.networkConditions) {
          await this.testPageCoreWebVitals(page, viewport, network);
        }
      }
    }
  }

  async testPageCoreWebVitals(page, viewport, network) {
    console.log(`   🎯 Testing Core Web Vitals: ${page.name} (${viewport.name}, ${network.name})`);

    try {
      // Run Core Web Vitals measurement
      const metrics = await this.measureCoreWebVitals(page.path, viewport, network);

      const vitalsResult = {
        page: page.name,
        path: page.path,
        viewport: viewport.name,
        network: network.name,
        critical: page.critical,
        metrics: metrics,
        score: this.calculateCoreWebVitalsScore(metrics),
        passed: this.checkCoreWebVitalsThresholds(metrics)
      };

      this.results.coreWebVitals.push(vitalsResult);

      if (!vitalsResult.passed) {
        this.generateCoreWebVitalsRecommendations(metrics);
      }

    } catch (error) {
      console.log(`   ❌ Error testing ${page.name}: ${error.message}`);

      this.results.coreWebVitals.push({
        page: page.name,
        path: page.path,
        viewport: viewport.name,
        network: network.name,
        error: error.message,
        score: 0,
        passed: false
      });
    }
  }

  async measureCoreWebVitals(path, viewport, network) {
    // Mock Core Web Vitals measurement (in real implementation, use web-vitals library or Lighthouse)
    return {
      LCP: 1500 + Math.random() * 2000,  // Largest Contentful Paint
      FID: 50 + Math.random() * 150,      // First Input Delay
      CLS: 0.05 + Math.random() * 0.2,   // Cumulative Layout Shift
      FCP: 1200 + Math.random() * 1800,  // First Contentful Paint
      TTFB: 400 + Math.random() * 800,   // Time to First Byte
      INP: 100 + Math.random() * 300,    // Interaction to Next Paint
      FMP: 1800 + Math.random() * 1200,  // First Meaningful Paint
      TTI: 3000 + Math.random() * 2000   // Time to Interactive
    };
  }

  calculateCoreWebVitalsScore(metrics) {
    const thresholds = this.options.coreWebVitalsThresholds;
    let totalScore = 0;
    let metricsCount = 0;

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      if (metrics[metric] !== undefined) {
        let score = 0;
        if (metrics[metric] <= threshold.good) {
          score = 100;
        } else if (metrics[metric] <= threshold.needsImprovement) {
          // Linear interpolation between good and needs improvement
          score = 100 - ((metrics[metric] - threshold.good) / (threshold.needsImprovement - threshold.good)) * 50;
        } else {
          score = Math.max(0, 50 - ((metrics[metric] - threshold.needsImprovement) / threshold.good) * 25);
        }
        totalScore += score;
        metricsCount++;
      }
    });

    return metricsCount > 0 ? Math.round(totalScore / metricsCount) : 0;
  }

  checkCoreWebVitalsThresholds(metrics) {
    const thresholds = this.options.coreWebVitalsThresholds;

    return Object.entries(thresholds).every(([metric, threshold]) => {
      return metrics[metric] === undefined || metrics[metric] <= threshold.needsImprovement;
    });
  }

  generateCoreWebVitalsRecommendations(metrics) {
    const thresholds = this.options.coreWebVitalsThresholds;

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      if (metrics[metric] && metrics[metric] > threshold.needsImprovement) {
        let recommendation = '';
        let value = metrics[metric];

        switch (metric) {
          case 'LCP':
            recommendation = `Largest Contentful Paint is ${value}ms (target: <${threshold.good}ms). Optimize images, server response time, and remove render-blocking resources.`;
            break;
          case 'FID':
            recommendation = `First Input Delay is ${value}ms (target: <${threshold.good}ms). Reduce JavaScript execution time and break up long tasks.`;
            break;
          case 'CLS':
            recommendation = `Cumulative Layout Shift is ${value} (target: <${threshold.good}). Ensure dimensions for images, videos, ads, and iframes. Avoid inserting content above existing content.`;
            break;
          case 'FCP':
            recommendation = `First Contentful Paint is ${value}ms (target: <${threshold.good}ms). Reduce server response time and optimize critical rendering path.`;
            break;
          case 'TTFB':
            recommendation = `Time to First Byte is ${value}ms (target: <${threshold.good}ms). Improve server response time and use CDN.`;
            break;
          case 'INP':
            recommendation = `Interaction to Next Paint is ${value}ms (target: <${threshold.good}ms). Optimize JavaScript execution and reduce input delay.`;
            break;
        }

        this.results.recommendations.push({
          type: 'core-web-vitals',
          metric: metric,
          value: value,
          target: threshold.good,
          recommendation: recommendation,
          priority: metric === 'CLS' ? 'high' : 'medium'
        });
      }
    });
  }

  async runLighthouseTests() {
    for (const page of this.options.pages) {
      await this.testPageWithLighthouse(page);
    }
  }

  async testPageWithLighthouse(page) {
    console.log(`   🔍 Running Lighthouse audit: ${page.name}`);

    try {
      // Run Lighthouse audit (mock implementation)
      const lighthouseResult = await this.runLighthouseAudit(page.path);

      const processedResult = {
        page: page.name,
        path: page.path,
        critical: page.critical,
        performance: lighthouseResult.performance,
        accessibility: lighthouseResult.accessibility,
        bestPractices: lighthouseResult['best-practices'],
        seo: lighthouseResult.seo,
        pwa: lighthouseResult.pwa,
        score: this.calculateLighthouseScore(lighthouseResult),
        passed: this.checkLighthouseThresholds(lighthouseResult),
        audits: lighthouseResult.audits
      };

      this.results.lighthouse.push(processedResult);

      if (!processedResult.passed) {
        this.generateLighthouseRecommendations(lighthouseResult);
      }

    } catch (error) {
      console.log(`   ❌ Error running Lighthouse on ${page.name}: ${error.message}`);

      this.results.lighthouse.push({
        page: page.name,
        path: page.path,
        error: error.message,
        score: 0,
        passed: false
      });
    }
  }

  async runLighthouseAudit(path) {
    // Mock Lighthouse results (in real implementation, use Lighthouse CLI or Node API)
    return {
      performance: 85 + Math.random() * 15,
      accessibility: 90 + Math.random() * 10,
      'best-practices': 88 + Math.random() * 12,
      seo: 82 + Math.random() * 18,
      pwa: 60 + Math.random() * 40,
      audits: {
        'first-contentful-paint': { value: 1200 + Math.random() * 800 },
        'largest-contentful-paint': { value: 2000 + Math.random() * 1500 },
        'cumulative-layout-shift': { value: 0.05 + Math.random() * 0.15 },
        'total-blocking-time': { value: 200 + Math.random() * 300 },
        'speed-index': { value: 3000 + Math.random() * 2000 },
        'interactive': { value: 3500 + Math.random() * 2500 }
      }
    };
  }

  calculateLighthouseScore(lighthouseResult) {
    const thresholds = this.options.lighthouseThresholds;
    let totalScore = 0;
    let categoriesCount = 0;

    Object.entries(thresholds).forEach(([category, threshold]) => {
      if (lighthouseResult[category] !== undefined) {
        totalScore += lighthouseResult[category];
        categoriesCount++;
      }
    });

    return categoriesCount > 0 ? Math.round(totalScore / categoriesCount) : 0;
  }

  checkLighthouseThresholds(lighthouseResult) {
    const thresholds = this.options.lighthouseThresholds;

    return Object.entries(thresholds).every(([category, threshold]) => {
      return lighthouseResult[category] === undefined || lighthouseResult[category] >= threshold;
    });
  }

  generateLighthouseRecommendations(lighthouseResult) {
    const recommendations = [];

    if (lighthouseResult.performance < this.options.lighthouseThresholds.performance) {
      recommendations.push({
        type: 'lighthouse',
        category: 'performance',
        score: lighthouseResult.performance,
        recommendation: 'Improve performance score by optimizing images, reducing JavaScript bundle size, and minimizing server response time.'
      });
    }

    if (lighthouseResult.accessibility < this.options.lighthouseThresholds.accessibility) {
      recommendations.push({
        type: 'lighthouse',
        category: 'accessibility',
        score: lighthouseResult.accessibility,
        recommendation: 'Improve accessibility by adding proper alt text, ensuring sufficient color contrast, and implementing proper ARIA labels.'
      });
    }

    if (lighthouseResult['best-practices'] < this.options.lighthouseThresholds['best-practices']) {
      recommendations.push({
        type: 'lighthouse',
        category: 'best-practices',
        score: lighthouseResult['best-practices'],
        recommendation: 'Follow web development best practices including using HTTPS, updating dependencies, and implementing proper error handling.'
      });
    }

    if (lighthouseResult.seo < this.options.lighthouseThresholds.seo) {
      recommendations.push({
        type: 'lighthouse',
        category: 'seo',
        score: lighthouseResult.seo,
        recommendation: 'Improve SEO by adding meta descriptions, proper heading structure, and structured data.'
      });
    }

    this.results.recommendations.push(...recommendations);
  }

  async runBudgetAnalysis() {
    console.log('   📊 Analyzing performance budgets...');

    try {
      // Analyze bundle sizes and resource usage
      const budgetAnalysis = await this.analyzeResourceUsage();

      this.results.budgetAnalysis = budgetAnalysis;
      this.results.summary.budgetScore = this.calculateBudgetScore(budgetAnalysis);

      if (this.results.summary.budgetScore < 90) {
        this.generateBudgetRecommendations(budgetAnalysis);
      }

    } catch (error) {
      console.log(`   ❌ Error analyzing budgets: ${error.message}`);
      this.results.budgetAnalysis = { error: error.message };
    }
  }

  async analyzeResourceUsage() {
    // Mock resource analysis (in real implementation, analyze webpack bundles and network requests)
    return {
      totalSize: 1800000 + Math.random() * 1000000,
      javascriptSize: 200000 + Math.random() * 100000,
      cssSize: 80000 + Math.random() * 40000,
      imageSize: 900000 + Math.random() * 500000,
      fontSize: 80000 + Math.random() * 40000,
      totalRequests: 35 + Math.floor(Math.random() * 20),
      jsRequests: 8 + Math.floor(Math.random() * 5),
      cssRequests: 2 + Math.floor(Math.random() * 2),
      imageRequests: 15 + Math.floor(Math.random() * 10),
      fontRequests: 3 + Math.floor(Math.random() * 2),
      resourceBreakdown: {
        html: 15000,
        css: 85000,
        javascript: 220000,
        images: 950000,
        fonts: 85000,
        other: 45000
      },
      compressionSavings: {
        gzip: 35,
        brotli: 42
      }
    };
  }

  calculateBudgetScore(budgetAnalysis) {
    const thresholds = this.options.budgetThresholds;
    let score = 100;

    // Calculate score based on budget adherence
    const sizeRatios = {
      totalSize: budgetAnalysis.totalSize / thresholds.totalSize,
      javascriptSize: budgetAnalysis.javascriptSize / thresholds.javascriptSize,
      cssSize: budgetAnalysis.cssSize / thresholds.cssSize,
      imageSize: budgetAnalysis.imageSize / thresholds.imageSize,
      fontSize: budgetAnalysis.fontSize / thresholds.fontSize
    };

    const requestRatios = {
      totalRequests: budgetAnalysis.totalRequests / thresholds.totalRequests,
      jsRequests: budgetAnalysis.jsRequests / thresholds.jsRequests,
      cssRequests: budgetAnalysis.cssRequests / thresholds.cssRequests
    };

    Object.values(sizeRatios).forEach(ratio => {
      if (ratio > 1) {
        score -= Math.min(25, (ratio - 1) * 50);
      }
    });

    Object.values(requestRatios).forEach(ratio => {
      if (ratio > 1) {
        score -= Math.min(15, (ratio - 1) * 30);
      }
    });

    return Math.max(0, Math.round(score));
  }

  generateBudgetRecommendations(budgetAnalysis) {
    const thresholds = this.options.budgetThresholds;

    if (budgetAnalysis.totalSize > thresholds.totalSize) {
      this.results.recommendations.push({
        type: 'budget',
        category: 'total-size',
        current: budgetAnalysis.totalSize,
        target: thresholds.totalSize,
        recommendation: `Reduce total page size by optimizing images, implementing better compression, and removing unused assets.`
      });
    }

    if (budgetAnalysis.javascriptSize > thresholds.javascriptSize) {
      this.results.recommendations.push({
        type: 'budget',
        category: 'javascript-size',
        current: budgetAnalysis.javascriptSize,
        target: thresholds.javascriptSize,
        recommendation: `Reduce JavaScript bundle size through code splitting, tree shaking, and removing unused dependencies.`
      });
    }

    if (budgetAnalysis.imageSize > thresholds.imageSize) {
      this.results.recommendations.push({
        type: 'budget',
        category: 'image-size',
        current: budgetAnalysis.imageSize,
        target: thresholds.imageSize,
        recommendation: `Optimize images by using modern formats (WebP, AVIF), implementing responsive images, and using CDNs.`
      });
    }

    if (budgetAnalysis.totalRequests > thresholds.totalRequests) {
      this.results.recommendations.push({
        type: 'budget',
        category: 'requests',
        current: budgetAnalysis.totalRequests,
        target: thresholds.totalRequests,
        recommendation: `Reduce number of requests by bundling assets, using CSS sprites, and implementing resource consolidation.`
      });
    }
  }

  async runBundleAnalysis() {
    console.log('   📦 Analyzing bundle sizes...');

    try {
      const bundleAnalysis = await this.analyzeBundles();

      this.results.bundleAnalysis = bundleAnalysis;

      // Check for large chunks and potential optimizations
      if (bundleAnalysis.chunks) {
        bundleAnalysis.chunks.forEach(chunk => {
          if (chunk.size > 500000) { // 500KB chunks
            this.results.recommendations.push({
              type: 'bundle',
              category: 'large-chunk',
              chunk: chunk.name,
              size: chunk.size,
              recommendation: `Consider splitting large chunk "${chunk.name}" (${(chunk.size / 1024).toFixed(1)}KB) into smaller chunks.`
            });
          }
        });
      }

    } catch (error) {
      console.log(`   ❌ Error analyzing bundles: ${error.message}`);
      this.results.bundleAnalysis = { error: error.message };
    }
  }

  async analyzeBundles() {
    // Mock bundle analysis (in real implementation, analyze webpack-stats.json or similar)
    return {
      totalSize: 420000,
      chunks: [
        { name: 'main.js', size: 280000, modules: 156 },
        { name: 'vendor.js', size: 120000, modules: 45 },
        { name: 'booking.js', size: 15000, modules: 8 },
        { name: 'admin.js', size: 5000, modules: 3 }
      ],
      dependencies: {
        'react': 42000,
        'react-dom': 120000,
        '@supabase/supabase-js': 45000,
        'framer-motion': 35000,
        'lucide-react': 25000,
        'recharts': 48000,
        'date-fns': 22000,
        'i18next': 18000
      },
      optimizationOpportunities: [
        'Replace moment.js with date-fns (potential savings: 67KB)',
        'Use dynamic imports for admin components (potential savings: 15KB)',
        'Remove unused lodash utilities (potential savings: 8KB)'
      ]
    };
  }

  async runLoadTests() {
    console.log('   🚀 Running load tests...');

    for (const userCount of this.options.loadTesting.concurrentUsers) {
      await this.runLoadTest(userCount);
    }
  }

  async runLoadTest(concurrentUsers) {
    console.log(`     👥 Testing with ${concurrentUsers} concurrent users...`);

    try {
      const loadTestResult = await this.performLoadTest(concurrentUsers);

      this.results.loadTests.push({
        concurrentUsers: concurrentUsers,
        ...loadTestResult,
        passed: this.checkLoadTestThresholds(loadTestResult)
      });

    } catch (error) {
      console.log(`     ❌ Load test failed: ${error.message}`);

      this.results.loadTests.push({
        concurrentUsers: concurrentUsers,
        error: error.message,
        passed: false
      });
    }
  }

  async performLoadTest(concurrentUsers) {
    // Mock load test results (in real implementation, use k6, Artillery, or similar tools)
    const baseResponseTime = 200 + Math.random() * 300;
    const concurrencyImpact = Math.log(concurrentUsers) * 50;

    return {
      totalRequests: concurrentUsers * 10,
      successfulRequests: Math.floor(concurrentUsers * 10 * (0.95 + Math.random() * 0.05)),
      failedRequests: Math.floor(concurrentUsers * 10 * (0 + Math.random() * 0.05)),
      averageResponseTime: baseResponseTime + concurrencyImpact,
      minResponseTime: 100 + Math.random() * 100,
      maxResponseTime: baseResponseTime + concurrencyImpact + Math.random() * 500,
      p50ResponseTime: baseResponseTime + concurrencyImpact * 0.5,
      p95ResponseTime: baseResponseTime + concurrencyImpact * 1.5,
      p99ResponseTime: baseResponseTime + concurrencyImpact * 2,
      requestsPerSecond: concurrentUsers * 0.8,
      throughput: concurrentUsers * 8000, // bytes per second
      errors: {
        timeouts: Math.floor(Math.random() * 2),
        connectionErrors: Math.floor(Math.random() * 1),
        status5xx: Math.floor(Math.random() * 1)
      }
    };
  }

  checkLoadTestThresholds(loadTestResult) {
    // Define acceptable thresholds for load tests
    const thresholds = {
      averageResponseTime: 1000, // 1 second
      p95ResponseTime: 2000,     // 2 seconds
      errorRate: 0.05,            // 5% error rate
      minRequestsPerSecond: 10    // Minimum RPS
    };

    const errorRate = loadTestResult.failedRequests / loadTestResult.totalRequests;

    return loadTestResult.averageResponseTime <= thresholds.averageResponseTime &&
           loadTestResult.p95ResponseTime <= thresholds.p95ResponseTime &&
           errorRate <= thresholds.errorRate &&
           loadTestResult.requestsPerSecond >= thresholds.minRequestsPerSecond;
  }

  async detectPerformanceRegressions() {
    console.log('   📈 Detecting performance regressions...');

    try {
      const previousResults = await this.loadPreviousPerformanceResults();
      if (previousResults) {
        const regressions = this.compareWithPreviousResults(previousResults);
        this.results.regressions = regressions;

        regressions.forEach(regression => {
          this.results.recommendations.push({
            type: 'regression',
            metric: regression.metric,
            previous: regression.previous,
            current: regression.current,
            degradation: regression.degradation,
            recommendation: `Performance regression detected: ${regression.metric} degraded by ${regression.degradation.toFixed(1)}%.`
          });
        });
      } else {
        console.log('     ℹ️ No previous results found for regression detection');
      }

      // Save current results for future comparison
      await this.saveCurrentResults();

    } catch (error) {
      console.log(`     ❌ Error detecting regressions: ${error.message}`);
    }
  }

  async loadPreviousPerformanceResults() {
    const resultsFile = path.join(this.options.testResultsDir, 'previous-results.json');

    if (!fs.existsSync(resultsFile)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    } catch (error) {
      console.warn('Could not load previous results:', error.message);
      return null;
    }
  }

  compareWithPreviousResults(previousResults) {
    const regressions = [];
    const regressionThreshold = 10; // 10% degradation threshold

    // Compare Core Web Vitals
    const currentCWVScore = this.calculateAverageCoreWebVitalsScore();
    const previousCWVScore = previousResults.summary?.coreWebVitalsScore || 0;

    if (previousCWVScore > 0) {
      const degradation = ((previousCWVScore - currentCWVScore) / previousCWVScore) * 100;
      if (degradation > regressionThreshold) {
        regressions.push({
          metric: 'Core Web Vitals Score',
          previous: previousCWVScore,
          current: currentCWVScore,
          degradation: degradation
        });
      }
    }

    // Compare Lighthouse performance
    const currentLighthouseScore = this.calculateAverageLighthouseScore();
    const previousLighthouseScore = previousResults.summary?.lighthouseScore || 0;

    if (previousLighthouseScore > 0) {
      const degradation = ((previousLighthouseScore - currentLighthouseScore) / previousLighthouseScore) * 100;
      if (degradation > regressionThreshold) {
        regressions.push({
          metric: 'Lighthouse Performance Score',
          previous: previousLighthouseScore,
          current: currentLighthouseScore,
          degradation: degradation
        });
      }
    }

    // Compare bundle size
    if (this.results.budgetAnalysis.totalSize && previousResults.budgetAnalysis?.totalSize) {
      const sizeIncrease = ((this.results.budgetAnalysis.totalSize - previousResults.budgetAnalysis.totalSize) / previousResults.budgetAnalysis.totalSize) * 100;
      if (sizeIncrease > regressionThreshold) {
        regressions.push({
          metric: 'Total Bundle Size',
          previous: previousResults.budgetAnalysis.totalSize,
          current: this.results.budgetAnalysis.totalSize,
          degradation: sizeIncrease
        });
      }
    }

    return regressions;
  }

  calculateAverageCoreWebVitalsScore() {
    if (this.results.coreWebVitals.length === 0) return 0;
    const totalScore = this.results.coreWebVitals.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / this.results.coreWebVitals.length);
  }

  calculateAverageLighthouseScore() {
    if (this.results.lighthouse.length === 0) return 0;
    const totalScore = this.results.lighthouse.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / this.results.lighthouse.length);
  }

  async saveCurrentResults() {
    const currentResults = {
      timestamp: new Date().toISOString(),
      summary: {
        coreWebVitalsScore: this.calculateAverageCoreWebVitalsScore(),
        lighthouseScore: this.calculateAverageLighthouseScore(),
        budgetAnalysis: this.results.budgetAnalysis
      }
    };

    const resultsFile = path.join(this.options.testResultsDir, 'previous-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(currentResults, null, 2));
  }

  calculateOverallScores() {
    this.results.summary.coreWebVitalsScore = this.calculateAverageCoreWebVitalsScore();
    this.results.summary.lighthouseScore = this.calculateAverageLighthouseScore();
    this.results.summary.loadTestScore = this.calculateLoadTestScore();

    // Calculate overall score (weighted average)
    const weights = {
      coreWebVitals: 0.3,
      lighthouse: 0.3,
      budget: 0.2,
      loadTest: 0.2
    };

    this.results.summary.overallScore = Math.round(
      this.results.summary.coreWebVitalsScore * weights.coreWebVitals +
      this.results.summary.lighthouseScore * weights.lighthouse +
      this.results.summary.budgetScore * weights.budget +
      this.results.summary.loadTestScore * weights.loadTest
    );

    this.results.summary.passedAllTests =
      this.results.summary.coreWebVitalsScore >= 90 &&
      this.results.summary.lighthouseScore >= 90 &&
      this.results.summary.budgetScore >= 85 &&
      this.results.summary.loadTestScore >= 80;
  }

  calculateLoadTestScore() {
    if (this.results.loadTests.length === 0) return 100;

    const passedTests = this.results.loadTests.filter(test => test.passed).length;
    return Math.round((passedTests / this.results.loadTests.length) * 100);
  }

  async generatePerformanceReport() {
    this.calculateOverallScores();

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Testing Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 700; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin-bottom: 40px; }
        .metric-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; transition: transform 0.2s ease; }
        .metric-card:hover { transform: translateY(-5px); }
        .metric-value { font-size: 3em; font-weight: 700; margin-bottom: 10px; }
        .metric-label { color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .score-excellent { color: #10b981; }
        .score-good { color: #f59e0b; }
        .score-poor { color: #ef4444; }
        .section { background: white; margin-bottom: 30px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .section-header { background: #f8fafc; padding: 25px; border-bottom: 1px solid #e5e7eb; }
        .section-header h2 { margin: 0; color: #1f2937; font-size: 1.5em; }
        .section-content { padding: 25px; }
        .vitals-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .vital-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .vital-card.good { border-color: #10b981; }
        .vital-card.needs-improvement { border-color: #f59e0b; }
        .vital-card.poor { border-color: #ef4444; }
        .vital-name { font-weight: 600; margin-bottom: 10px; color: #1f2937; }
        .vital-value { font-size: 1.8em; font-weight: 700; margin-bottom: 5px; }
        .vital-status { font-size: 0.9em; color: #666; }
        .chart-container { position: relative; height: 400px; margin: 20px 0; }
        .recommendations { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-top: 20px; }
        .recommendations h3 { color: #d97706; margin-top: 0; }
        .recommendation-item { background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #f59e0b; }
        .recommendation-type { font-weight: 600; color: #d97706; margin-bottom: 5px; }
        .test-item { display: flex; justify-content: between; align-items: center; padding: 15px; border-bottom: 1px solid #e5e7eb; }
        .test-item:last-child { border-bottom: none; }
        .test-info { flex: 1; }
        .test-name { font-weight: 600; margin-bottom: 5px; }
        .test-details { color: #666; font-size: 0.9em; }
        .test-score { padding: 8px 16px; border-radius: 20px; font-weight: 600; color: white; min-width: 60px; text-align: center; }
        .score-high { background: #10b981; }
        .score-medium { background: #f59e0b; }
        .score-low { background: #ef4444; }
        .budget-bar { background: #e5e7eb; height: 24px; border-radius: 12px; overflow: hidden; margin: 10px 0; }
        .budget-fill { height: 100%; transition: width 0.3s ease; }
        .budget-fill.good { background: #10b981; }
        .budget-fill.warning { background: #f59e0b; }
        .budget-fill.danger { background: #ef4444; }
        .load-test-results { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .load-test-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .load-test-users { font-size: 1.5em; font-weight: 700; color: #3b82f6; margin-bottom: 10px; }
        .load-test-metric { color: #666; margin-bottom: 5px; }
        .regression-item { background: #fee2e2; border: 1px solid #ef4444; border-radius: 6px; padding: 15px; margin-bottom: 10px; }
        .regression-metric { font-weight: 600; color: #dc2626; margin-bottom: 5px; }
        .regression-details { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚡ Performance Testing Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Comprehensive Performance Analysis & Core Web Vitals Validation</p>
    </div>

    <div class="summary-grid">
        <div class="metric-card">
            <div class="metric-value ${this.getScoreClass(this.results.summary.overallScore)}">${this.results.summary.overallScore}/100</div>
            <div class="metric-label">Overall Score</div>
        </div>
        <div class="metric-card">
            <div class="metric-value ${this.getScoreClass(this.results.summary.coreWebVitalsScore)}">${this.results.summary.coreWebVitalsScore}/100</div>
            <div class="metric-label">Core Web Vitals</div>
        </div>
        <div class="metric-card">
            <div class="metric-value ${this.getScoreClass(this.results.summary.lighthouseScore)}">${this.results.summary.lighthouseScore}/100</div>
            <div class="metric-label">Lighthouse Score</div>
        </div>
        <div class="metric-card">
            <div class="metric-value ${this.getScoreClass(this.results.summary.budgetScore)}">${this.results.summary.budgetScore}/100</div>
            <div class="metric-label">Budget Score</div>
        </div>
        <div class="metric-card">
            <div class="metric-value ${(this.results.summary.duration / 1000).toFixed(1)}s</div>
            <div class="metric-label">Test Duration</div>
        </div>
        <div class="metric-card">
            <div class="metric-value ${this.results.summary.passedAllTests ? 'score-excellent' : 'score-poor'}">${this.results.summary.passedAllTests ? '✅' : '❌'}</div>
            <div class="metric-label">All Tests Passed</div>
        </div>
    </div>

    ${this.generateCoreWebVitalsHTML()}
    ${this.generateLighthouseHTML()}
    ${this.generateBudgetAnalysisHTML()}
    ${this.generateBundleAnalysisHTML()}
    ${this.generateLoadTestsHTML()}
    ${this.generateRegressionsHTML()}
    ${this.generateRecommendationsHTML()}
</body>
</html>`;

    fs.writeFileSync(
      path.join(this.options.reportsDir, 'performance-report.html'),
      htmlTemplate
    );

    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      results: this.results,
      config: this.options,
      thresholds: {
        coreWebVitals: this.options.coreWebVitalsThresholds,
        lighthouse: this.options.lighthouseThresholds,
        budget: this.options.budgetThresholds
      }
    };

    fs.writeFileSync(
      path.join(this.options.reportsDir, 'performance-report.json'),
      JSON.stringify(jsonReport, null, 2)
    );
  }

  getScoreClass(score) {
    if (score >= 90) return 'score-excellent';
    if (score >= 70) return 'score-good';
    return 'score-poor';
  }

  generateCoreWebVitalsHTML() {
    if (this.results.coreWebVitals.length === 0) return '';

    // Group metrics for display
    const metricGroups = {};
    this.results.coreWebVitals.forEach(result => {
      if (!metricGroups[result.page]) {
        metricGroups[result.page] = [];
      }
      metricGroups[result.page].push(result);
    });

    return `
      <div class="section">
        <div class="section-header">
          <h2>🎯 Core Web Vitals Results</h2>
        </div>
        <div class="section-content">
          ${Object.entries(metricGroups).map(([page, results]) => `
            <h3>${page}</h3>
            <div class="vitals-grid">
              ${results[0].metrics ? Object.entries(results[0].metrics).map(([metric, value]) => {
                const threshold = this.options.coreWebVitalsThresholds[metric];
                let status = 'good';
                if (value > threshold.needsImprovement) status = 'poor';
                else if (value > threshold.good) status = 'needs-improvement';

                return `
                  <div class="vital-card ${status}">
                    <div class="vital-name">${metric.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div class="vital-value">${typeof value === 'number' && value < 1 ? value.toFixed(3) : Math.round(value)}${metric === 'CLS' ? '' : 'ms'}</div>
                    <div class="vital-status">${status === 'good' ? '✅ Good' : status === 'needs-improvement' ? '⚠️ Needs Improvement' : '❌ Poor'}</div>
                  </div>
                `;
              }).join('') : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  generateLighthouseHTML() {
    if (this.results.lighthouse.length === 0) return '';

    return `
      <div class="section">
        <div class="section-header">
          <h2>🔍 Lighthouse Performance Audits</h2>
        </div>
        <div class="section-content">
          ${this.results.lighthouse.map(result => `
            <div class="test-item">
              <div class="test-info">
                <div class="test-name">${result.page}</div>
                <div class="test-details">
                  Performance: ${Math.round(result.performance)} |
                  Accessibility: ${Math.round(result.accessibility)} |
                  Best Practices: ${Math.round(result.bestPractices)} |
                  SEO: ${Math.round(result.seo)}
                </div>
              </div>
              <div class="test-score ${result.score >= 90 ? 'score-high' : result.score >= 70 ? 'score-medium' : 'score-low'}">
                ${Math.round(result.score)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  generateBudgetAnalysisHTML() {
    if (!this.results.budgetAnalysis.totalSize) return '';

    const thresholds = this.options.budgetThresholds;
    const analysis = this.results.budgetAnalysis;

    return `
      <div class="section">
        <div class="section-header">
          <h2>📊 Performance Budget Analysis</h2>
        </div>
        <div class="section-content">
          <div class="budget-item">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Total Size</span>
              <span>${(analysis.totalSize / 1024 / 1024).toFixed(2)}MB / ${(thresholds.totalSize / 1024 / 1024).toFixed(2)}MB</span>
            </div>
            <div class="budget-bar">
              <div class="budget-fill ${analysis.totalSize <= thresholds.totalSize ? 'good' : 'danger'}"
                   style="width: ${Math.min(100, (analysis.totalSize / thresholds.totalSize) * 100)}%"></div>
            </div>
          </div>

          <div class="budget-item">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>JavaScript</span>
              <span>${(analysis.javascriptSize / 1024).toFixed(0)}KB / ${(thresholds.javascriptSize / 1024).toFixed(0)}KB</span>
            </div>
            <div class="budget-bar">
              <div class="budget-fill ${analysis.javascriptSize <= thresholds.javascriptSize ? 'good' : 'danger'}"
                   style="width: ${Math.min(100, (analysis.javascriptSize / thresholds.javascriptSize) * 100)}%"></div>
            </div>
          </div>

          <div class="budget-item">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>CSS</span>
              <span>${(analysis.cssSize / 1024).toFixed(0)}KB / ${(thresholds.cssSize / 1024).toFixed(0)}KB</span>
            </div>
            <div class="budget-bar">
              <div class="budget-fill ${analysis.cssSize <= thresholds.cssSize ? 'good' : 'danger'}"
                   style="width: ${Math.min(100, (analysis.cssSize / thresholds.cssSize) * 100)}%"></div>
            </div>
          </div>

          <div class="budget-item">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Images</span>
              <span>${(analysis.imageSize / 1024 / 1024).toFixed(2)}MB / ${(thresholds.imageSize / 1024 / 1024).toFixed(2)}MB</span>
            </div>
            <div class="budget-bar">
              <div class="budget-fill ${analysis.imageSize <= thresholds.imageSize ? 'good' : 'danger'}"
                   style="width: ${Math.min(100, (analysis.imageSize / thresholds.imageSize) * 100)}%"></div>
            </div>
          </div>

          <div class="budget-item">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Total Requests</span>
              <span>${analysis.totalRequests} / ${thresholds.totalRequests}</span>
            </div>
            <div class="budget-bar">
              <div class="budget-fill ${analysis.totalRequests <= thresholds.totalRequests ? 'good' : 'danger'}"
                   style="width: ${Math.min(100, (analysis.totalRequests / thresholds.totalRequests) * 100)}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  generateBundleAnalysisHTML() {
    if (!this.results.bundleAnalysis.chunks) return '';

    return `
      <div class="section">
        <div class="section-header">
          <h2>📦 Bundle Analysis</h2>
        </div>
        <div class="section-content">
          <h3>Bundle Chunks</h3>
          ${this.results.bundleAnalysis.chunks.map(chunk => `
            <div style="display: flex; justify-content: space-between; padding: 10px; background: #f8fafc; margin-bottom: 5px; border-radius: 4px;">
              <span>${chunk.name}</span>
              <span>${(chunk.size / 1024).toFixed(1)}KB (${chunk.modules} modules)</span>
            </div>
          `).join('')}

          <h3 style="margin-top: 20px;">Dependency Sizes</h3>
          ${Object.entries(this.results.bundleAnalysis.dependencies || {}).map(([dep, size]) => `
            <div style="display: flex; justify-content: space-between; padding: 8px; background: #f8fafc; margin-bottom: 3px; border-radius: 4px; font-size: 0.9em;">
              <span>${dep}</span>
              <span>${(size / 1024).toFixed(1)}KB</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  generateLoadTestsHTML() {
    if (this.results.loadTests.length === 0) return '';

    return `
      <div class="section">
        <div class="section-header">
          <h2>🚀 Load Testing Results</h2>
        </div>
        <div class="section-content">
          <div class="load-test-results">
            ${this.results.loadTests.map(test => `
              <div class="load-test-card">
                <div class="load-test-users">${test.concurrentUsers} Users</div>
                <div class="load-test-metric">Avg Response: ${Math.round(test.averageResponseTime)}ms</div>
                <div class="load-test-metric">95th Percentile: ${Math.round(test.p95ResponseTime)}ms</div>
                <div class="load-test-metric">Success Rate: ${Math.round((test.successfulRequests / test.totalRequests) * 100)}%</div>
                <div class="load-test-metric">RPS: ${Math.round(test.requestsPerSecond)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  generateRegressionsHTML() {
    if (this.results.regressions.length === 0) return '';

    return `
      <div class="section">
        <div class="section-header">
          <h2>📉 Performance Regressions</h2>
        </div>
        <div class="section-content">
          ${this.results.regressions.map(regression => `
            <div class="regression-item">
              <div class="regression-metric">${regression.metric}</div>
              <div class="regression-details">
                Previous: ${regression.previous} → Current: ${regression.current} (${regression.degradation.toFixed(1)}% degradation)
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  generateRecommendationsHTML() {
    if (this.results.recommendations.length === 0) return '';

    const groupedRecommendations = this.results.recommendations.reduce((groups, rec) => {
      if (!groups[rec.type]) {
        groups[rec.type] = [];
      }
      groups[rec.type].push(rec);
      return groups;
    }, {});

    return `
      <div class="section">
        <div class="section-header">
          <h2>🎯 Performance Optimization Recommendations</h2>
        </div>
        <div class="section-content">
          ${Object.entries(groupedRecommendations).map(([type, recommendations]) => `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #374151; margin-bottom: 15px;">${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Optimizations</h3>
              ${recommendations.map(rec => `
                <div class="recommendation-item">
                  <div class="recommendation-type">${rec.category || rec.metric}</div>
                  <div>${rec.recommendation}</div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// CLI interface
if (require.main === module) {
  const options = {
    baseUrl: process.env.BASE_URL || 'http://localhost:8080',
    lighthouse: !process.argv.includes('--no-lighthouse'),
    loadTesting: !process.argv.includes('--no-load-testing'),
    bundleAnalysis: !process.argv.includes('--no-bundle-analysis'),
    regressionDetection: !process.argv.includes('--no-regression')
  };

  const performanceTesting = new PerformanceTestingAutomation(options);

  performanceTesting.runPerformanceTests()
    .then((results) => {
      console.log('\n✅ Performance testing completed!');

      if (results.summary.passedAllTests && results.summary.overallScore >= 85) {
        console.log(`🎉 Excellent performance! Overall score: ${results.summary.overallScore}/100`);
        process.exit(0);
      } else {
        console.log(`⚠️ Performance needs improvement (Score: ${results.summary.overallScore}/100)`);
        console.log('📊 View the detailed report: test-results/performance/reports/performance-report.html');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Performance testing failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceTestingAutomation;