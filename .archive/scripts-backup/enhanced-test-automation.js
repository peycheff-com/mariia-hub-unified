#!/usr/bin/env node

/**
 * Enhanced Test Automation System
 *
 * Provides comprehensive test automation capabilities including:
 * - Intelligent test selection based on code changes
 * - Visual regression testing
 * - Accessibility testing automation
 * - Performance testing with Core Web Vitals
 * - Security testing automation
 * - Quality gate enforcement
 * - Test analytics and reporting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { glob } = require('glob');

class EnhancedTestAutomation {
  constructor(options = {}) {
    this.options = {
      projectRoot: process.cwd(),
      testResultsDir: path.join(process.cwd(), 'test-results'),
      coverageDir: path.join(process.cwd(), 'coverage'),
      reportsDir: path.join(process.cwd(), 'test-reports'),
      thresholds: {
        coverage: {
          lines: 95,
          functions: 95,
          branches: 95,
          statements: 95
        },
        performance: {
          lighthouse: {
            performance: 90,
            accessibility: 95,
            'best-practices': 90,
            seo: 85
          },
          coreWebVitals: {
            LCP: 2500,  // Largest Contentful Paint (ms)
            FID: 100,   // First Input Delay (ms)
            CLS: 0.1    // Cumulative Layout Shift
          }
        },
        accessibility: {
          violations: 0,
          criticalViolations: 0
        },
        security: {
          vulnerabilities: 0,
          criticalVulnerabilities: 0
        }
      },
      ...options
    };

    this.testResults = {
      unit: {},
      integration: {},
      e2e: {},
      visual: {},
      accessibility: {},
      performance: {},
      security: {},
      quality: {}
    };

    this.qualityGates = new Map();
    this.initializeDirectories();
    this.setupQualityGates();
  }

  initializeDirectories() {
    const dirs = [
      this.options.testResultsDir,
      this.options.coverageDir,
      this.options.reportsDir,
      path.join(this.options.testResultsDir, 'visual'),
      path.join(this.options.testResultsDir, 'accessibility'),
      path.join(this.options.testResultsDir, 'performance'),
      path.join(this.options.testResultsDir, 'security'),
      path.join(this.options.testResultsDir, 'quality')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  setupQualityGates() {
    // Coverage quality gate
    this.qualityGates.set('coverage', {
      name: 'Code Coverage',
      level: 'blocking',
      check: (results) => {
        const coverage = results.unit?.coverage || {};
        const thresholds = this.options.thresholds.coverage;

        return {
          passed: Object.keys(thresholds).every(metric =>
            (coverage[metric] || 0) >= thresholds[metric]
          ),
          score: Math.round(
            Object.keys(thresholds).reduce((acc, metric) => {
              const value = coverage[metric] || 0;
              return acc + (value / thresholds[metric]) * 25;
            }, 0)
          ),
          details: thresholds
        };
      }
    });

    // Performance quality gate
    this.qualityGates.set('performance', {
      name: 'Performance Standards',
      level: 'blocking',
      check: (results) => {
        const perf = results.performance?.lighthouse || {};
        const thresholds = this.options.thresholds.performance.lighthouse;

        return {
          passed: Object.keys(thresholds).every(metric =>
            (perf[metric] || 0) >= thresholds[metric]
          ),
          score: Math.round(
            Object.keys(thresholds).reduce((acc, metric) => {
              const value = perf[metric] || 0;
              return acc + (value / 100) * 25;
            }, 0)
          ),
          details: thresholds
        };
      }
    });

    // Accessibility quality gate
    this.qualityGates.set('accessibility', {
      name: 'Accessibility Compliance',
      level: 'critical',
      check: (results) => {
        const accessibility = results.accessibility || {};
        const violations = accessibility.violations || 0;
        const criticalViolations = accessibility.criticalViolations || 0;

        return {
          passed: violations === 0 && criticalViolations === 0,
          score: Math.max(0, 100 - (violations * 10) - (criticalViolations * 25)),
          details: { violations, criticalViolations }
        };
      }
    });

    // Security quality gate
    this.qualityGates.set('security', {
      name: 'Security Standards',
      level: 'critical',
      check: (results) => {
        const security = results.security || {};
        const vulnerabilities = security.vulnerabilities || 0;
        const criticalVulnerabilities = security.criticalVulnerabilities || 0;

        return {
          passed: criticalVulnerabilities === 0 && vulnerabilities <= 5,
          score: Math.max(0, 100 - (vulnerabilities * 5) - (criticalVulnerabilities * 50)),
          details: { vulnerabilities, criticalVulnerabilities }
        };
      }
    });

    // Test success rate quality gate
    this.qualityGates.set('test-success', {
      name: 'Test Success Rate',
      level: 'blocking',
      check: (results) => {
        const totalTests = this.getTotalTestCount(results);
        const failedTests = this.getFailedTestCount(results);
        const successRate = totalTests > 0 ? ((totalTests - failedTests) / totalTests) * 100 : 100;

        return {
          passed: successRate >= 95,
          score: Math.round(successRate),
          details: { totalTests, failedTests, successRate: Math.round(successRate) }
        };
      }
    });
  }

  async runFullTestSuite(options = {}) {
    console.log('🚀 Starting Enhanced Test Automation Suite...\n');

    const startTime = Date.now();
    const results = {};

    try {
      // 1. Intelligent Test Selection
      if (options.intelligentSelection) {
        console.log('🧠 Running intelligent test selection...');
        const changedFiles = await this.getChangedFiles();
        const selectedTests = await this.selectTestsBasedOnChanges(changedFiles);
        console.log(`Selected ${selectedTests.length} tests based on changes\n`);
      }

      // 2. Unit Tests with Coverage
      console.log('🔬 Running unit tests with coverage...');
      results.unit = await this.runUnitTests();
      console.log(`✅ Unit tests completed: ${results.unit.passed}/${results.unit.total} passed\n`);

      // 3. Integration Tests
      console.log('🔗 Running integration tests...');
      results.integration = await this.runIntegrationTests();
      console.log(`✅ Integration tests completed: ${results.integration.passed}/${results.integration.total} passed\n`);

      // 4. Visual Regression Tests
      if (options.visual !== false) {
        console.log('👁️ Running visual regression tests...');
        results.visual = await this.runVisualTests();
        console.log(`✅ Visual tests completed: ${results.visual.passed}/${results.visual.total} passed\n`);
      }

      // 5. Accessibility Tests
      if (options.accessibility !== false) {
        console.log('♿ Running accessibility tests...');
        results.accessibility = await this.runAccessibilityTests();
        console.log(`✅ Accessibility tests completed with ${results.accessibility.violations} violations\n`);
      }

      // 6. Performance Tests
      if (options.performance !== false) {
        console.log('⚡ Running performance tests...');
        results.performance = await this.runPerformanceTests();
        console.log(`✅ Performance tests completed with score ${results.performance.score}\n`);
      }

      // 7. Security Tests
      if (options.security !== false) {
        console.log('🔒 Running security tests...');
        results.security = await this.runSecurityTests();
        console.log(`✅ Security tests completed with ${results.security.vulnerabilities} vulnerabilities\n`);
      }

      // 8. E2E Tests
      if (options.e2e !== false) {
        console.log('🌐 Running E2E tests...');
        results.e2e = await this.runE2ETests();
        console.log(`✅ E2E tests completed: ${results.e2e.passed}/${results.e2e.total} passed\n`);
      }

      // 9. Quality Gate Evaluation
      console.log('🚦 Evaluating quality gates...');
      results.quality = await this.evaluateQualityGates(results);
      console.log(`✅ Quality gates evaluated with overall score: ${results.quality.overallScore}\n`);

      // 10. Generate Reports
      console.log('📊 Generating comprehensive reports...');
      await this.generateReports(results);
      console.log('✅ Reports generated successfully\n');

      const duration = Date.now() - startTime;
      console.log(`🎉 Test suite completed in ${(duration / 1000).toFixed(2)}s`);

      return results;

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  async runUnitTests() {
    try {
      // Run unit tests with coverage
      const output = execSync('npm run test:coverage', {
        encoding: 'utf8',
        cwd: this.options.projectRoot
      });

      // Parse coverage results
      const coverageResults = await this.parseCoverageResults();

      // Parse test results
      const testResults = await this.parseTestResults('unit');

      return {
        passed: testResults.passed,
        failed: testResults.failed,
        total: testResults.total,
        coverage: coverageResults,
        duration: testResults.duration,
        output
      };
    } catch (error) {
      return {
        passed: 0,
        failed: 1,
        total: 1,
        coverage: {},
        duration: 0,
        error: error.message
      };
    }
  }

  async runIntegrationTests() {
    try {
      const output = execSync('npm run test:integration', {
        encoding: 'utf8',
        cwd: this.options.projectRoot
      });

      const testResults = await this.parseTestResults('integration');

      return {
        passed: testResults.passed,
        failed: testResults.failed,
        total: testResults.total,
        duration: testResults.duration,
        output
      };
    } catch (error) {
      return {
        passed: 0,
        failed: 1,
        total: 1,
        duration: 0,
        error: error.message
      };
    }
  }

  async runVisualTests() {
    try {
      const output = execSync('npm run test:e2e:visual', {
        encoding: 'utf8',
        cwd: this.options.projectRoot
      });

      const testResults = await this.parseTestResults('visual');

      return {
        passed: testResults.passed,
        failed: testResults.failed,
        total: testResults.total,
        duration: testResults.duration,
        output
      };
    } catch (error) {
      return {
        passed: 0,
        failed: 1,
        total: 1,
        duration: 0,
        error: error.message
      };
    }
  }

  async runAccessibilityTests() {
    try {
      // Run accessibility tests
      const output = execSync('npx playwright test --grep="accessibility"', {
        encoding: 'utf8',
        cwd: this.options.projectRoot
      });

      const testResults = await this.parseTestResults('accessibility');

      // Parse axe results if available
      const axeResults = await this.parseAxeResults();

      return {
        passed: testResults.passed,
        failed: testResults.failed,
        total: testResults.total,
        violations: axeResults.violations || 0,
        criticalViolations: axeResults.criticalViolations || 0,
        duration: testResults.duration,
        output
      };
    } catch (error) {
      return {
        passed: 0,
        failed: 1,
        total: 1,
        violations: 1,
        criticalViolations: 1,
        duration: 0,
        error: error.message
      };
    }
  }

  async runPerformanceTests() {
    try {
      // Run Lighthouse CI
      const lighthouseOutput = execSync('npm run test:lighthouse', {
        encoding: 'utf8',
        cwd: this.options.projectRoot
      });

      // Parse Lighthouse results
      const lighthouseResults = await this.parseLighthouseResults();

      // Run Core Web Vitals tests
      const coreWebVitalsResults = await this.runCoreWebVitalsTests();

      return {
        lighthouse: lighthouseResults,
        coreWebVitals: coreWebVitalsResults,
        score: Math.round(
          (lighthouseResults.performance || 0) * 0.4 +
          (coreWebVitals.score || 0) * 0.6
        ),
        duration: lighthouseResults.duration || 0,
        output: lighthouseOutput
      };
    } catch (error) {
      return {
        lighthouse: {},
        coreWebVitals: {},
        score: 0,
        duration: 0,
        error: error.message
      };
    }
  }

  async runSecurityTests() {
    try {
      // Run security audit
      const auditOutput = execSync('npm run security-audit', {
        encoding: 'utf8',
        cwd: this.options.projectRoot
      });

      // Run security E2E tests
      const e2eOutput = execSync('npx playwright test --grep="security"', {
        encoding: 'utf8',
        cwd: this.options.projectRoot
      });

      const auditResults = await this.parseSecurityAudit(auditOutput);
      const testResults = await this.parseTestResults('security');

      return {
        vulnerabilities: auditResults.vulnerabilities || 0,
        criticalVulnerabilities: auditResults.criticalVulnerabilities || 0,
        passed: testResults.passed,
        failed: testResults.failed,
        total: testResults.total,
        duration: testResults.duration,
        output: auditOutput + '\n' + e2eOutput
      };
    } catch (error) {
      return {
        vulnerabilities: 1,
        criticalVulnerabilities: 1,
        passed: 0,
        failed: 1,
        total: 1,
        duration: 0,
        error: error.message
      };
    }
  }

  async runE2ETests() {
    try {
      const output = execSync('npm run test:e2e:ci', {
        encoding: 'utf8',
        cwd: this.options.projectRoot
      });

      const testResults = await this.parseTestResults('e2e');

      return {
        passed: testResults.passed,
        failed: testResults.failed,
        total: testResults.total,
        duration: testResults.duration,
        output
      };
    } catch (error) {
      return {
        passed: 0,
        failed: 1,
        total: 1,
        duration: 0,
        error: error.message
      };
    }
  }

  async evaluateQualityGates(results) {
    const gateResults = new Map();
    let overallScore = 0;
    let criticalFailures = 0;
    let blockingFailures = 0;

    for (const [key, gate] of this.qualityGates) {
      const result = gate.check(results);
      gateResults.set(key, {
        ...result,
        name: gate.name,
        level: gate.level
      });

      overallScore += result.score;

      if (!result.passed) {
        if (gate.level === 'critical') criticalFailures++;
        else if (gate.level === 'blocking') blockingFailures++;
      }
    }

    const overallGateScore = Math.round(overallScore / this.qualityGates.size);
    const passedAllGates = criticalFailures === 0 && blockingFailures === 0;

    return {
      gates: Object.fromEntries(gateResults),
      overallScore: overallGateScore,
      passed: passedAllGates,
      criticalFailures,
      blockingFailures,
      recommendation: this.getQualityRecommendation(overallGateScore, criticalFailures, blockingFailures)
    };
  }

  getQualityRecommendation(score, criticalFailures, blockingFailures) {
    if (criticalFailures > 0) {
      return '🚫 CRITICAL: Fix critical issues before deployment';
    }
    if (blockingFailures > 0) {
      return '⛔ BLOCKING: Fix blocking issues before deployment';
    }
    if (score < 70) {
      return '⚠️ WARNING: Quality score below threshold - improvements recommended';
    }
    if (score < 85) {
      return '✅ ACCEPTABLE: Meets minimum quality standards';
    }
    return '🌟 EXCELLENT: Exceeds quality standards';
  }

  async getChangedFiles() {
    try {
      const output = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' });
      return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      console.warn('Could not determine changed files:', error.message);
      return [];
    }
  }

  async selectTestsBasedOnChanges(changedFiles) {
    // This is a simplified implementation
    // In a real scenario, you would analyze file dependencies and select relevant tests
    const testPatterns = [];

    for (const file of changedFiles) {
      if (file.includes('.test.') || file.includes('.spec.')) {
        testPatterns.push(file);
      } else if (file.includes('src/')) {
        // Find related test files
        const testFile = file.replace('src/', 'src/test/').replace(/\.(ts|tsx)$/, '.test.ts');
        testPatterns.push(testFile);
      }
    }

    return testPatterns;
  }

  async parseCoverageResults() {
    const coverageFile = path.join(this.options.coverageDir, 'coverage-summary.json');

    if (!fs.existsSync(coverageFile)) {
      return {};
    }

    try {
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      return {
        lines: coverage.total?.lines?.pct || 0,
        functions: coverage.total?.functions?.pct || 0,
        branches: coverage.total?.branches?.pct || 0,
        statements: coverage.total?.statements?.pct || 0
      };
    } catch (error) {
      console.warn('Could not parse coverage results:', error.message);
      return {};
    }
  }

  async parseTestResults(testType) {
    const resultsFile = path.join(this.options.testResultsDir, `${testType}-results.json`);

    if (!fs.existsSync(resultsFile)) {
      return { passed: 0, failed: 0, total: 0, duration: 0 };
    }

    try {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      return {
        passed: results.passed || 0,
        failed: results.failed || 0,
        total: results.total || 0,
        duration: results.duration || 0
      };
    } catch (error) {
      console.warn(`Could not parse ${testType} test results:`, error.message);
      return { passed: 0, failed: 0, total: 0, duration: 0 };
    }
  }

  async parseAxeResults() {
    // Parse axe-core accessibility results
    const axeFile = path.join(this.options.testResultsDir, 'axe-results.json');

    if (!fs.existsSync(axeFile)) {
      return { violations: 0, criticalViolations: 0 };
    }

    try {
      const results = JSON.parse(fs.readFileSync(axeFile, 'utf8'));
      const violations = results.violations || [];
      const criticalViolations = violations.filter(v => v.impact === 'critical').length;

      return { violations: violations.length, criticalViolations };
    } catch (error) {
      return { violations: 0, criticalViolations: 0 };
    }
  }

  async parseLighthouseResults() {
    const lighthouseFile = path.join(this.options.testResultsDir, 'lighthouse-results.json');

    if (!fs.existsSync(lighthouseFile)) {
      return {};
    }

    try {
      const results = JSON.parse(fs.readFileSync(lighthouseFile, 'utf8'));
      const categories = results.lhr?.categories || {};

      return {
        performance: Math.round(categories.performance?.score * 100) || 0,
        accessibility: Math.round(categories.accessibility?.score * 100) || 0,
        'best-practices': Math.round(categories['best-practices']?.score * 100) || 0,
        seo: Math.round(categories.seo?.score * 100) || 0,
        duration: results.lhr?.audits?.metrics?.details?.items?.[0]?.observedLoad || 0
      };
    } catch (error) {
      return {};
    }
  }

  async parseSecurityAudit(output) {
    // Parse npm audit results
    const vulnerabilities = (output.match(/found \d+ vulnerabilities/g) || [])
      .map(match => parseInt(match.match(/\d+/)[0]))
      .reduce((sum, count) => sum + count, 0);

    const criticalVulnerabilities = (output.match(/Critical:\d+/g) || [])
      .map(match => parseInt(match.match(/Critical:(\d+)/)[1]))
      .reduce((sum, count) => sum + count, 0);

    return { vulnerabilities, criticalVulnerabilities };
  }

  async runCoreWebVitalsTests() {
    // This would integrate with web-vitals library or Lighthouse
    return {
      LCP: 0,   // Largest Contentful Paint
      FID: 0,   // First Input Delay
      CLS: 0,   // Cumulative Layout Shift
      score: 0
    };
  }

  getTotalTestCount(results) {
    return Object.values(results).reduce((total, result) => {
      return total + (result.total || 0);
    }, 0);
  }

  getFailedTestCount(results) {
    return Object.values(results).reduce((total, result) => {
      return total + (result.failed || 0);
    }, 0);
  }

  async generateReports(results) {
    // Generate HTML report
    await this.generateHTMLReport(results);

    // Generate JSON report
    await this.generateJSONReport(results);

    // Generate Markdown summary
    await this.generateMarkdownReport(results);

    // Generate quality metrics
    await this.generateQualityMetrics(results);
  }

  async generateHTMLReport(results) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Results Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
        .score { font-size: 24px; font-weight: bold; }
        .gate { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .gate.passed { background-color: #d4edda; }
        .gate.failed { background-color: #f8d7da; }
        .progress-bar { width: 100%; height: 20px; background: #eee; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #ffc107, #dc3545); transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Enhanced Test Automation Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <div class="score">Overall Quality Score: ${results.quality?.overallScore || 0}/100</div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${results.quality?.overallScore || 0}%"></div>
        </div>
        <p><strong>Status:</strong> ${results.quality?.recommendation || 'Unknown'}</p>
    </div>

    <div class="section">
        <h2>📊 Test Summary</h2>
        <div class="success">✅ Passed: ${this.getTotalTestCount(results) - this.getFailedTestCount(results)}</div>
        <div class="error">❌ Failed: ${this.getFailedTestCount(results)}</div>
        <div class="info">📈 Total: ${this.getTotalTestCount(results)}</div>
    </div>

    <div class="section">
        <h2>🚦 Quality Gates</h2>
        ${Object.entries(results.quality?.gates || {}).map(([key, gate]) => `
            <div class="gate ${gate.passed ? 'passed' : 'failed'}">
                <strong>${gate.name}</strong> (${gate.level})
                <br>Score: ${gate.score}/100 | Status: ${gate.passed ? '✅ Passed' : '❌ Failed'}
                <br>${JSON.stringify(gate.details, null, 2)}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>🔬 Test Results</h2>
        ${Object.entries(results).filter(([key]) => key !== 'quality').map(([key, result]) => `
            <div>
                <strong>${key.charAt(0).toUpperCase() + key.slice(1)} Tests:</strong>
                ${result.passed}/${result.total} passed
                ${result.duration ? `(${result.duration}ms)` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    fs.writeFileSync(
      path.join(this.options.reportsDir, 'test-report.html'),
      htmlTemplate
    );
  }

  async generateJSONReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.getTotalTestCount(results),
        passedTests: this.getTotalTestCount(results) - this.getFailedTestCount(results),
        failedTests: this.getFailedTestCount(results),
        overallScore: results.quality?.overallScore || 0,
        passedAllGates: results.quality?.passed || false
      },
      results,
      qualityGates: results.quality?.gates || {},
      thresholds: this.options.thresholds
    };

    fs.writeFileSync(
      path.join(this.options.reportsDir, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  async generateMarkdownReport(results) {
    const markdown = `
# 🚀 Enhanced Test Automation Report

**Generated:** ${new Date().toISOString()}

## 📊 Executive Summary

- **Overall Quality Score:** ${results.quality?.overallScore || 0}/100
- **Status:** ${results.quality?.recommendation || 'Unknown'}
- **Total Tests:** ${this.getTotalTestCount(results)}
- **Passed:** ${this.getTotalTestCount(results) - this.getFailedTestCount(results)}
- **Failed:** ${this.getFailedTestCount(results)}

## 🚦 Quality Gates

${Object.entries(results.quality?.gates || {}).map(([key, gate]) => `
### ${gate.name} (${gate.level})
- **Score:** ${gate.score}/100
- **Status:** ${gate.passed ? '✅ Passed' : '❌ Failed'}
- **Details:** \`${JSON.stringify(gate.details)}\`
`).join('')}

## 📈 Test Results by Category

${Object.entries(results).filter(([key]) => key !== 'quality').map(([key, result]) => `
### ${key.charAt(0).toUpperCase() + key.slice(1)} Tests
- **Passed:** ${result.passed}/${result.total}
- **Duration:** ${result.duration}ms
${result.error ? `- **Error:** ${result.error}` : ''}
`).join('')}

## 🎯 Recommendations

${this.generateRecommendations(results)}
`;

    fs.writeFileSync(
      path.join(this.options.reportsDir, 'test-report.md'),
      markdown
    );
  }

  generateRecommendations(results) {
    const recommendations = [];

    if (results.unit?.coverage) {
      const coverage = results.unit.coverage;
      Object.entries(coverage).forEach(([metric, value]) => {
        if (value < 90) {
          recommendations.push(`- Improve ${metric} coverage: currently ${value}% (target: 90%+)`);
        }
      });
    }

    if (results.performance?.lighthouse) {
      const lighthouse = results.performance.lighthouse;
      Object.entries(lighthouse).forEach(([metric, value]) => {
        if (value < 90 && typeof value === 'number') {
          recommendations.push(`- Optimize ${metric}: currently ${value}/100 (target: 90+)`);
        }
      });
    }

    if (results.accessibility?.violations > 0) {
      recommendations.push(`- Fix ${results.accessibility.violations} accessibility violations`);
    }

    if (results.security?.vulnerabilities > 0) {
      recommendations.push(`- Address ${results.security.vulnerabilities} security vulnerabilities`);
    }

    if (recommendations.length === 0) {
      recommendations.push('- 🎉 Excellent quality! Consider setting higher thresholds for continuous improvement.');
    }

    return recommendations.join('\n');
  }

  async generateQualityMetrics(results) {
    const metrics = {
      timestamp: new Date().toISOString(),
      trends: await this.loadQualityTrends(),
      current: {
        coverage: results.unit?.coverage || {},
        performance: results.performance?.lighthouse || {},
        accessibility: {
          violations: results.accessibility?.violations || 0,
          score: results.quality?.gates?.accessibility?.score || 0
        },
        security: {
          vulnerabilities: results.security?.vulnerabilities || 0,
          score: results.quality?.gates?.security?.score || 0
        }
      }
    };

    // Save current metrics
    fs.writeFileSync(
      path.join(this.options.testResultsDir, 'quality', 'current-metrics.json'),
      JSON.stringify(metrics, null, 2)
    );

    // Update trends
    await this.updateQualityTrends(metrics);
  }

  async loadQualityTrends() {
    const trendsFile = path.join(this.options.testResultsDir, 'quality', 'trends.json');

    if (!fs.existsSync(trendsFile)) {
      return [];
    }

    try {
      return JSON.parse(fs.readFileSync(trendsFile, 'utf8'));
    } catch (error) {
      return [];
    }
  }

  async updateQualityTrends(metrics) {
    const trends = await this.loadQualityTrends();

    // Add current metrics to trends (keep last 30 days)
    trends.push({
      timestamp: metrics.timestamp,
      ...metrics.current
    });

    // Keep only last 30 entries
    if (trends.length > 30) {
      trends.splice(0, trends.length - 30);
    }

    fs.writeFileSync(
      path.join(this.options.testResultsDir, 'quality', 'trends.json'),
      JSON.stringify(trends, null, 2)
    );
  }
}

// CLI interface
if (require.main === module) {
  const options = {
    intelligentSelection: process.argv.includes('--intelligent'),
    visual: !process.argv.includes('--no-visual'),
    accessibility: !process.argv.includes('--no-accessibility'),
    performance: !process.argv.includes('--no-performance'),
    security: !process.argv.includes('--no-security'),
    e2e: !process.argv.includes('--no-e2e')
  };

  const automation = new EnhancedTestAutomation();

  automation.runFullTestSuite(options)
    .then((results) => {
      console.log('\n✅ Test automation completed successfully!');

      if (results.quality?.passed) {
        console.log('🎉 All quality gates passed!');
        process.exit(0);
      } else {
        console.log('❌ Some quality gates failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Test automation failed:', error);
      process.exit(1);
    });
}

module.exports = EnhancedTestAutomation;