#!/usr/bin/env node

/**
 * Test Automation Monitoring and Alerting System
 *
 * This script provides comprehensive monitoring, alerting, and reporting
 * for the test automation pipeline with intelligent analysis.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

class TestMonitoringSystem {
  constructor(options = {}) {
    this.options = {
      resultsDir: options.resultsDir || 'test-results',
      coverageDir: options.coverageDir || 'coverage',
      alertThresholds: {
        failureRate: options.alertThresholds?.failureRate || 10, // 10%
        coverageThreshold: options.alertThresholds?.coverageThreshold || 85, // 85%
        performanceThreshold: options.alertThresholds?.performanceThreshold || 90, // 90%
        securityVulnerabilities: options.alertThresholds?.securityVulnerabilities || 5,
        executionTime: options.alertThresholds?.executionTime || 600000 // 10 minutes
      },
      notificationChannels: options.notificationChannels || ['slack', 'email'],
      retentionDays: options.retentionDays || 30,
      ...options
    };

    this.metrics = {
      timestamp: new Date().toISOString(),
      git: this.getGitInfo(),
      tests: {},
      coverage: {},
      performance: {},
      security: {},
      trends: {}
    };

    this.alerts = [];
    this.trends = this.loadTrends();
  }

  /**
   * Get current Git information
   */
  getGitInfo() {
    try {
      return {
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
        message: execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim(),
        author: execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim(),
        timestamp: execSync('git log -1 --pretty=%ai', { encoding: 'utf8' }).trim()
      };
    } catch (error) {
      return {
        commit: 'unknown',
        branch: 'unknown',
        message: 'Unknown',
        author: 'Unknown',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Load historical trends data
   */
  loadTrends() {
    try {
      const trendsPath = path.join(this.options.resultsDir, 'trends.json');
      if (fs.existsSync(trendsPath)) {
        return JSON.parse(fs.readFileSync(trendsPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Failed to load trends data:', error.message);
    }
    return {
      coverage: [],
      performance: [],
      failureRate: [],
      executionTime: [],
      security: []
    };
  }

  /**
   * Save trends data
   */
  saveTrends() {
    try {
      if (!fs.existsSync(this.options.resultsDir)) {
        fs.mkdirSync(this.options.resultsDir, { recursive: true });
      }

      const trendsPath = path.join(this.options.resultsDir, 'trends.json');
      fs.writeFileSync(trendsPath, JSON.stringify(this.trends, null, 2));
    } catch (error) {
      console.warn('Failed to save trends data:', error.message);
    }
  }

  /**
   * Analyze test results
   */
  async analyzeTestResults() {
    console.log('📊 Analyzing test results...');

    try {
      // Find all test result files
      const testFiles = this.findTestResultFiles();

      let totalTests = 0;
      let passedTests = 0;
      let failedTests = 0;
      let skippedTests = 0;
      let flakyTests = 0;
      let totalExecutionTime = 0;

      for (const file of testFiles) {
        try {
          const result = this.parseTestResultFile(file);
          if (result) {
            totalTests += result.totalTests || 0;
            passedTests += result.passedTests || 0;
            failedTests += result.failedTests || 0;
            skippedTests += result.skippedTests || 0;
            flakyTests += result.flakyTests || 0;
            totalExecutionTime += result.executionTime || 0;
          }
        } catch (error) {
          console.warn(`Failed to parse test result file ${file}:`, error.message);
        }
      }

      const failureRate = totalTests > 0 ? (failedTests / totalTests) * 100 : 0;

      this.metrics.tests = {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        flakyTests,
        failureRate: Math.round(failureRate * 100) / 100,
        totalExecutionTime,
        averageExecutionTime: totalTests > 0 ? totalExecutionTime / totalTests : 0,
        successRate: totalTests > 0 ? ((passedTests / totalTests) * 100) : 100
      };

      // Check for test failures alert
      if (failureRate > this.options.alertThresholds.failureRate) {
        this.addAlert('high_failure_rate', `Test failure rate (${failureRate.toFixed(2)}%) exceeds threshold (${this.options.alertThresholds.failureRate}%)`, 'high');
      }

      console.log(`✅ Test analysis completed: ${totalTests} tests, ${failureRate.toFixed(2)}% failure rate`);
      return this.metrics.tests;

    } catch (error) {
      console.error('❌ Test analysis failed:', error.message);
      this.addAlert('test_analysis_error', `Failed to analyze test results: ${error.message}`, 'high');
      return null;
    }
  }

  /**
   * Find all test result files
   */
  findTestResultFiles() {
    const testFiles = [];
    const patterns = [
      '**/test-results/*.json',
      '**/test-results/**/*.json',
      '**/junit*.xml',
      '**/e2e-results.json',
      '**/unit-*-results.json'
    ];

    patterns.forEach(pattern => {
      try {
        const files = this.findFiles(pattern);
        testFiles.push(...files);
      } catch (error) {
        // Ignore pattern matching errors
      }
    });

    return testFiles.filter(file => fs.existsSync(file));
  }

  /**
   * Find files matching a pattern (simple implementation)
   */
  findFiles(pattern) {
    const results = [];
    const parts = pattern.split('/');

    function searchDirectory(dir, remainingParts) {
      if (remainingParts.length === 0) return;

      const currentPart = remainingParts[0];
      const remaining = remainingParts.slice(1);

      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && (currentPart === '**' || remaining.length > 0)) {
            searchDirectory(fullPath, currentPart === '**' ? remainingParts : remaining);
          } else if (stat.isFile() && this.matchesPattern(item, currentPart)) {
            results.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore directory access errors
      }
    }

    searchDirectory('.', parts);
    return results;
  }

  /**
   * Check if filename matches pattern
   */
  matchesPattern(filename, pattern) {
    if (pattern === '**') return true;
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    }
    return filename === pattern;
  }

  /**
   * Parse test result file
   */
  parseTestResultFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);

    try {
      if (ext === '.json') {
        const data = JSON.parse(content);
        return this.parseJsonTestResult(data);
      } else if (ext === '.xml') {
        return this.parseXmlTestResult(content);
      }
    } catch (error) {
      console.warn(`Failed to parse ${filePath}:`, error.message);
    }

    return null;
  }

  /**
   * Parse JSON test result
   */
  parseJsonTestResult(data) {
    // Handle different JSON test result formats
    if (data.numTotalTests !== undefined) {
      // Vitest format
      return {
        totalTests: data.numTotalTests,
        passedTests: data.numPassedTests,
        failedTests: data.numFailedTests,
        skippedTests: data.numPendingTests,
        flakyTests: data.numFlakyTests || 0,
        executionTime: data.testResults?.reduce((sum, test) => sum + (test.duration || 0), 0) || 0
      };
    } else if (data.stats) {
      // Playwright format
      return {
        totalTests: data.stats.expected,
        passedTests: data.stats.expected - data.stats.failed,
        failedTests: data.stats.failed,
        skippedTests: data.stats.skipped || 0,
        flakyTests: data.stats.flaky || 0,
        executionTime: data.stats.duration || 0
      };
    }

    return null;
  }

  /**
   * Parse XML test result (basic implementation)
   */
  parseXmlTestResult(xmlContent) {
    // Simple XML parsing for JUnit format
    const testsMatch = xmlContent.match(/tests="(\d+)"/);
    const failuresMatch = xmlContent.match(/failures="(\d+)"/);
    const errorsMatch = xmlContent.match(/errors="(\d+)"/);
    const skippedMatch = xmlContent.match(/skipped="(\d+)"/);
    const timeMatch = xmlContent.match(/time="([^"]+)"/);

    const totalTests = testsMatch ? parseInt(testsMatch[1]) : 0;
    const failedTests = (failuresMatch ? parseInt(failuresMatch[1]) : 0) +
                       (errorsMatch ? parseInt(errorsMatch[1]) : 0);
    const skippedTests = skippedMatch ? parseInt(skippedMatch[1]) : 0;
    const executionTime = timeMatch ? parseFloat(timeMatch[1]) * 1000 : 0;

    return {
      totalTests,
      passedTests: totalTests - failedTests - skippedTests,
      failedTests,
      skippedTests,
      flakyTests: 0,
      executionTime
    };
  }

  /**
   * Analyze coverage results
   */
  async analyzeCoverageResults() {
    console.log('📈 Analyzing coverage results...');

    try {
      const coverageSummaryPath = path.join(this.options.coverageDir, 'coverage-summary.json');

      if (!fs.existsSync(coverageSummaryPath)) {
        console.warn('Coverage summary not found');
        return null;
      }

      const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
      const total = coverageData.total;

      this.metrics.coverage = {
        lines: {
          covered: total.lines.covered,
          total: total.lines.total,
          percentage: total.lines.pct
        },
        functions: {
          covered: total.functions.covered,
          total: total.functions.total,
          percentage: total.functions.pct
        },
        branches: {
          covered: total.branches.covered,
          total: total.branches.total,
          percentage: total.branches.pct
        },
        statements: {
          covered: total.statements.covered,
          total: total.statements.total,
          percentage: total.statements.pct
        },
        overall: total.lines.pct // Use lines coverage as overall metric
      };

      // Check for coverage alert
      if (this.metrics.coverage.overall < this.options.alertThresholds.coverageThreshold) {
        this.addAlert('low_coverage', `Coverage (${this.metrics.coverage.overall}%) below threshold (${this.options.alertThresholds.coverageThreshold}%)`, 'medium');
      }

      // Add to trends
      this.trends.coverage.push({
        timestamp: this.metrics.timestamp,
        value: this.metrics.coverage.overall,
        commit: this.metrics.git.commit
      });

      // Keep only last 30 entries
      if (this.trends.coverage.length > 30) {
        this.trends.coverage = this.trends.coverage.slice(-30);
      }

      console.log(`✅ Coverage analysis completed: ${this.metrics.coverage.overall}% overall coverage`);
      return this.metrics.coverage;

    } catch (error) {
      console.error('❌ Coverage analysis failed:', error.message);
      this.addAlert('coverage_analysis_error', `Failed to analyze coverage: ${error.message}`, 'medium');
      return null;
    }
  }

  /**
   * Analyze performance results
   */
  async analyzePerformanceResults() {
    console.log('⚡ Analyzing performance results...');

    try {
      const lighthouseResultsPath = path.join('.lighthouseci', 'lhr-report.json');

      if (!fs.existsSync(lighthouseResultsPath)) {
        console.warn('Lighthouse results not found');
        return null;
      }

      const lighthouseData = JSON.parse(fs.readFileSync(lighthouseResultsPath, 'utf8'));
      const categories = lighthouseData[0]?.categories || {};

      this.metrics.performance = {
        performance: categories.performance?.score * 100 || 0,
        accessibility: categories.accessibility?.score * 100 || 0,
        bestPractices: categories['best-practices']?.score * 100 || 0,
        seo: categories.seo?.score * 100 || 0,
        pwa: categories.pwa?.score * 100 || 0
      };

      // Check for performance alert
      if (this.metrics.performance.performance < this.options.alertThresholds.performanceThreshold) {
        this.addAlert('low_performance', `Performance score (${this.metrics.performance.performance}%) below threshold (${this.options.alertThresholds.performanceThreshold}%)`, 'medium');
      }

      // Add to trends
      this.trends.performance.push({
        timestamp: this.metrics.timestamp,
        value: this.metrics.performance.performance,
        commit: this.metrics.git.commit
      });

      // Keep only last 30 entries
      if (this.trends.performance.length > 30) {
        this.trends.performance = this.trends.performance.slice(-30);
      }

      console.log(`✅ Performance analysis completed: ${this.metrics.performance.performance}% performance score`);
      return this.metrics.performance;

    } catch (error) {
      console.error('❌ Performance analysis failed:', error.message);
      this.addAlert('performance_analysis_error', `Failed to analyze performance: ${error.message}`, 'medium');
      return null;
    }
  }

  /**
   * Analyze security results
   */
  async analyzeSecurityResults() {
    console.log('🔒 Analyzing security results...');

    try {
      const securityReports = [
        'security-reports/snyk-results.json',
        'security-reports/zap-report.json',
        'security-reports/secrets-scan.json',
        'npm-audit.json'
      ];

      let totalVulnerabilities = 0;
      let highSeverityVulnerabilities = 0;
      let criticalIssues = 0;

      for (const report of securityReports) {
        if (fs.existsSync(report)) {
          try {
            const reportData = JSON.parse(fs.readFileSync(report, 'utf8'));
            const analysis = this.parseSecurityReport(reportData, report);
            totalVulnerabilities += analysis.total;
            highSeverityVulnerabilities += analysis.high;
            criticalIssues += analysis.critical;
          } catch (error) {
            console.warn(`Failed to parse security report ${report}:`, error.message);
          }
        }
      }

      this.metrics.security = {
        totalVulnerabilities,
        highSeverityVulnerabilities,
        criticalIssues,
        riskScore: this.calculateRiskScore(totalVulnerabilities, highSeverityVulnerabilities, criticalIssues)
      };

      // Check for security alerts
      if (totalVulnerabilities > this.options.alertThresholds.securityVulnerabilities) {
        this.addAlert('security_vulnerabilities', `Found ${totalVulnerabilities} security vulnerabilities`, 'high');
      }

      if (criticalIssues > 0) {
        this.addAlert('critical_security_issues', `Found ${criticalIssues} critical security issues`, 'critical');
      }

      // Add to trends
      this.trends.security.push({
        timestamp: this.metrics.timestamp,
        value: totalVulnerabilities,
        commit: this.metrics.git.commit
      });

      // Keep only last 30 entries
      if (this.trends.security.length > 30) {
        this.trends.security = this.trends.security.slice(-30);
      }

      console.log(`✅ Security analysis completed: ${totalVulnerabilities} vulnerabilities found`);
      return this.metrics.security;

    } catch (error) {
      console.error('❌ Security analysis failed:', error.message);
      this.addAlert('security_analysis_error', `Failed to analyze security: ${error.message}`, 'high');
      return null;
    }
  }

  /**
   * Parse security report data
   */
  parseSecurityReport(data, reportType) {
    let total = 0;
    let high = 0;
    let critical = 0;

    if (reportType.includes('snyk')) {
      // Snyk format
      if (data.vulnerabilities) {
        total = Object.keys(data.vulnerabilities).length;
        Object.values(data.vulnerabilities).forEach(vuln => {
          if (vuln.severity === 'high') high++;
          if (vuln.severity === 'critical') critical++;
        });
      }
    } else if (reportType.includes('zap')) {
      // ZAP format
      if (data.site && data.site.alerts) {
        total = data.site.alerts.length;
        data.site.alerts.forEach(alert => {
          if (alert.riskcode === 'High') high++;
          if (alert.riskcode === 'Critical') critical++;
        });
      }
    } else if (reportType.includes('npm-audit')) {
      // NPM audit format
      if (data.vulnerabilities) {
        total = Object.keys(data.vulnerabilities).length;
        Object.values(data.vulnerabilities).forEach(vuln => {
          if (vuln.severity === 'high') high++;
          if (vuln.severity === 'critical') critical++;
        });
      }
    }

    return { total, high, critical };
  }

  /**
   * Calculate security risk score
   */
  calculateRiskScore(total, high, critical) {
    // Weighted score: critical=10, high=5, medium=2, low=1
    const criticalScore = critical * 10;
    const highScore = high * 5;
    const mediumScore = (total - high - critical) * 2;

    const totalScore = criticalScore + highScore + mediumScore;

    // Normalize to 0-100 scale (100 being highest risk)
    return Math.min(100, totalScore);
  }

  /**
   * Add alert to the system
   */
  addAlert(type, message, severity = 'medium') {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      resolved: false,
      gitInfo: this.metrics.git
    };

    this.alerts.push(alert);
    console.warn(`🚨 ALERT [${severity.toUpperCase()}]: ${message}`);
  }

  /**
   * Analyze trends and provide insights
   */
  analyzeTrends() {
    console.log('📈 Analyzing trends...');

    const insights = [];

    // Coverage trend analysis
    if (this.trends.coverage.length >= 3) {
      const recent = this.trends.coverage.slice(-3);
      const trend = this.calculateTrend(recent.map(r => r.value));

      if (trend < -5) {
        insights.push({
          type: 'coverage_decline',
          message: `Coverage is declining (${trend.toFixed(1)}% trend over last 3 runs)`,
          severity: 'medium'
        });
      } else if (trend > 5) {
        insights.push({
          type: 'coverage_improvement',
          message: `Coverage is improving (${trend.toFixed(1)}% trend over last 3 runs)`,
          severity: 'info'
        });
      }
    }

    // Performance trend analysis
    if (this.trends.performance.length >= 3) {
      const recent = this.trends.performance.slice(-3);
      const trend = this.calculateTrend(recent.map(r => r.value));

      if (trend < -10) {
        insights.push({
          type: 'performance_decline',
          message: `Performance is declining (${trend.toFixed(1)}% trend over last 3 runs)`,
          severity: 'high'
        });
      }
    }

    // Security trend analysis
    if (this.trends.security.length >= 3) {
      const recent = this.trends.security.slice(-3);
      const trend = this.calculateTrend(recent.map(r => r.value));

      if (trend > 5) {
        insights.push({
          type: 'security_increase',
          message: `Security vulnerabilities are increasing (${trend.toFixed(1)} trend over last 3 runs)`,
          severity: 'medium'
        });
      }
    }

    // Execution time trend analysis
    if (this.trends.executionTime.length >= 3) {
      const recent = this.trends.executionTime.slice(-3);
      const trend = this.calculateTrend(recent.map(r => r.value));

      if (trend > 20) {
        insights.push({
          type: 'execution_time_increase',
          message: `Test execution time is increasing (${trend.toFixed(1)}% trend over last 3 runs)`,
          severity: 'medium'
        });
      }
    }

    this.metrics.insights = insights;
    console.log(`✅ Trend analysis completed: ${insights.length} insights found`);
    return insights;
  }

  /**
   * Calculate trend percentage
   */
  calculateTrend(values) {
    if (values.length < 2) return 0;

    const first = values[0];
    const last = values[values.length - 1];

    if (first === 0) return last > 0 ? 100 : 0;

    return ((last - first) / first) * 100;
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('📋 Generating comprehensive test report...');

    const report = {
      metadata: {
        timestamp: this.metrics.timestamp,
        git: this.metrics.git,
        environment: process.env.NODE_ENV || 'unknown',
        nodeVersion: process.version,
        platform: process.platform
      },
      summary: {
        overall: this.calculateOverallScore(),
        status: this.calculateOverallStatus()
      },
      metrics: this.metrics,
      alerts: this.alerts,
      trends: {
        current: this.trends,
        insights: this.metrics.insights || []
      },
      recommendations: this.generateRecommendations()
    };

    // Save report
    const reportPath = path.join(this.options.resultsDir, 'comprehensive-report.json');
    if (!fs.existsSync(this.options.resultsDir)) {
      fs.mkdirSync(this.options.resultsDir, { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    this.generateHtmlReport(report);

    console.log(`✅ Comprehensive report generated: ${reportPath}`);
    return report;
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallScore() {
    let score = 100;

    // Deduct points for test failures
    if (this.metrics.tests.failureRate > 0) {
      score -= this.metrics.tests.failureRate * 2;
    }

    // Deduct points for low coverage
    if (this.metrics.coverage.overall < 100) {
      score -= (100 - this.metrics.coverage.overall) * 0.5;
    }

    // Deduct points for performance issues
    if (this.metrics.performance.performance < 100) {
      score -= (100 - this.metrics.performance.performance) * 0.3;
    }

    // Deduct points for security issues
    score -= this.metrics.security.totalVulnerabilities * 5;
    score -= this.metrics.security.criticalIssues * 20;

    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate overall status
   */
  calculateOverallStatus() {
    if (this.alerts.some(alert => alert.severity === 'critical')) {
      return 'critical';
    }
    if (this.alerts.some(alert => alert.severity === 'high')) {
      return 'high';
    }
    if (this.alerts.some(alert => alert.severity === 'medium')) {
      return 'medium';
    }
    if (this.alerts.length > 0) {
      return 'low';
    }
    return 'excellent';
  }

  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations() {
    const recommendations = [];

    // Test recommendations
    if (this.metrics.tests.failureRate > 5) {
      recommendations.push({
        category: 'tests',
        priority: 'high',
        title: 'Reduce Test Failure Rate',
        description: `Current failure rate is ${this.metrics.tests.failureRate.toFixed(2)}%. Consider reviewing flaky tests and improving test stability.`
      });
    }

    if (this.metrics.tests.flakyTests > 0) {
      recommendations.push({
        category: 'tests',
        priority: 'medium',
        title: 'Fix Flaky Tests',
        description: `Found ${this.metrics.tests.flakyTests} flaky tests. These should be stabilized for reliable CI/CD.`
      });
    }

    // Coverage recommendations
    if (this.metrics.coverage.overall < 90) {
      recommendations.push({
        category: 'coverage',
        priority: 'medium',
        title: 'Improve Test Coverage',
        description: `Current coverage is ${this.metrics.coverage.overall}%. Aim for 90%+ coverage for better code reliability.`
      });
    }

    // Performance recommendations
    if (this.metrics.performance.performance < 95) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Optimize Performance',
        description: `Current performance score is ${this.metrics.performance.performance}%. Focus on improving Core Web Vitals.`
      });
    }

    // Security recommendations
    if (this.metrics.security.totalVulnerabilities > 0) {
      recommendations.push({
        category: 'security',
        priority: 'high',
        title: 'Address Security Vulnerabilities',
        description: `Found ${this.metrics.security.totalVulnerabilities} security vulnerabilities. Update dependencies and fix security issues.`
      });
    }

    return recommendations;
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Automation Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #007bff; }
        .metric-card h3 { margin: 0 0 10px 0; color: #333; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-details { margin-top: 10px; font-size: 0.9em; color: #666; }
        .status-${report.summary.status} { border-left-color: ${this.getStatusColor(report.summary.status)}; }
        .alerts { margin-top: 30px; }
        .alert { padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid; }
        .alert-critical { background: #f8d7da; border-color: #dc3545; color: #721c24; }
        .alert-high { background: #fff3cd; border-color: #ffc107; color: #856404; }
        .alert-medium { background: #cce5ff; border-color: #007bff; color: #004085; }
        .alert-low { background: #d4edda; border-color: #28a745; color: #155724; }
        .recommendations { margin-top: 30px; }
        .recommendation { background: #e7f3ff; border-radius: 6px; padding: 15px; margin-bottom: 10px; border-left: 4px solid #007bff; }
        .recommendation h4 { margin: 0 0 5px 0; color: #333; }
        .recommendation .priority { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; margin-left: 10px; }
        .priority-high { background: #dc3545; color: white; }
        .priority-medium { background: #ffc107; color: #212529; }
        .priority-low { background: #28a745; color: white; }
        .git-info { background: #f8f9fa; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 0.9em; }
        .score { font-size: 3em; font-weight: bold; text-align: center; margin: 20px 0; }
        .score.excellent { color: #28a745; }
        .score.good { color: #007bff; }
        .score.warning { color: #ffc107; }
        .score.danger { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Automation Report</h1>
            <div class="subtitle">
                Generated on ${new Date(report.metadata.timestamp).toLocaleString()}<br>
                Branch: ${report.metadata.git.branch} | Commit: ${report.metadata.git.commit.substring(0, 8)}
            </div>
        </div>

        <div class="content">
            <div class="score ${report.summary.status}">
                Overall Score: ${report.summary.overall}/100
                <div style="font-size: 0.4em; font-weight: normal;">Status: ${report.summary.status.toUpperCase()}</div>
            </div>

            <div class="metrics">
                <div class="metric-card status-${report.summary.status}">
                    <h3>🧪 Tests</h3>
                    <div class="metric-value">${report.metrics.tests.successRate?.toFixed(1) || 'N/A'}%</div>
                    <div class="metric-details">
                        ${report.metrics.tests.totalTests || 0} total<br>
                        ${report.metrics.tests.failedTests || 0} failed<br>
                        ${report.metrics.tests.flakyTests || 0} flaky
                    </div>
                </div>

                <div class="metric-card">
                    <h3>📊 Coverage</h3>
                    <div class="metric-value">${report.metrics.coverage.overall?.toFixed(1) || 'N/A'}%</div>
                    <div class="metric-details">
                        Lines: ${report.metrics.coverage.lines?.percentage?.toFixed(1) || 'N/A'}%<br>
                        Functions: ${report.metrics.coverage.functions?.percentage?.toFixed(1) || 'N/A'}%<br>
                        Branches: ${report.metrics.coverage.branches?.percentage?.toFixed(1) || 'N/A'}%
                    </div>
                </div>

                <div class="metric-card">
                    <h3>⚡ Performance</h3>
                    <div class="metric-value">${report.metrics.performance.performance?.toFixed(0) || 'N/A'}</div>
                    <div class="metric-details">
                        Accessibility: ${report.metrics.performance.accessibility?.toFixed(0) || 'N/A'}<br>
                        Best Practices: ${report.metrics.performance.bestPractices?.toFixed(0) || 'N/A'}<br>
                        SEO: ${report.metrics.performance.seo?.toFixed(0) || 'N/A'}
                    </div>
                </div>

                <div class="metric-card">
                    <h3>🔒 Security</h3>
                    <div class="metric-value">${report.metrics.security.totalVulnerabilities || 0}</div>
                    <div class="metric-details">
                        Critical: ${report.metrics.security.criticalIssues || 0}<br>
                        High: ${report.metrics.security.highSeverityVulnerabilities || 0}<br>
                        Risk Score: ${report.metrics.security.riskScore || 0}
                    </div>
                </div>
            </div>

            ${report.alerts.length > 0 ? `
            <div class="alerts">
                <h3>🚨 Alerts</h3>
                ${report.alerts.map(alert => `
                    <div class="alert alert-${alert.severity}">
                        <strong>${alert.type}</strong>: ${alert.message}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${report.recommendations.length > 0 ? `
            <div class="recommendations">
                <h3>💡 Recommendations</h3>
                ${report.recommendations.map(rec => `
                    <div class="recommendation">
                        <h4>${rec.title} <span class="priority priority-${rec.priority}">${rec.priority}</span></h4>
                        <p>${rec.description}</p>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="git-info">
                <strong>Git Information:</strong><br>
                Commit: ${report.metadata.git.commit}<br>
                Branch: ${report.metadata.git.branch}<br>
                Author: ${report.metadata.git.author}<br>
                Message: ${report.metadata.git.message}<br>
                Timestamp: ${report.metadata.git.timestamp}
            </div>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.options.resultsDir, 'comprehensive-report.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 HTML report generated: ${htmlPath}`);
  }

  /**
   * Get status color
   */
  getStatusColor(status) {
    switch (status) {
      case 'excellent': return '#28a745';
      case 'good': return '#007bff';
      case 'medium': return '#ffc107';
      case 'high': return '#fd7e14';
      case 'critical': return '#dc3545';
      default: return '#6c757d';
    }
  }

  /**
   * Send notifications
   */
  async sendNotifications() {
    console.log('📢 Sending notifications...');

    if (this.options.notificationChannels.includes('slack')) {
      await this.sendSlackNotification();
    }

    if (this.options.notificationChannels.includes('email')) {
      await this.sendEmailNotification();
    }

    console.log('✅ Notifications sent');
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification() {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) {
        console.warn('Slack webhook URL not configured');
        return;
      }

      const payload = {
        text: `Test Automation Report - ${this.calculateOverallStatus().toUpperCase()}`,
        attachments: [
          {
            color: this.getStatusColor(this.calculateOverallStatus()),
            fields: [
              {
                title: 'Overall Score',
                value: `${this.calculateOverallScore()}/100`,
                short: true
              },
              {
                title: 'Test Success Rate',
                value: `${this.metrics.tests.successRate?.toFixed(1) || 'N/A'}%`,
                short: true
              },
              {
                title: 'Coverage',
                value: `${this.metrics.coverage.overall?.toFixed(1) || 'N/A'}%`,
                short: true
              },
              {
                title: 'Performance',
                value: `${this.metrics.performance.performance?.toFixed(0) || 'N/A'}`,
                short: true
              }
            ],
            actions: this.alerts.length > 0 ? [{
              type: 'button',
              text: 'View Report',
              url: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
            }] : undefined
          }
        ]
      };

      // Send to Slack (implementation depends on your HTTP client)
      console.log('📱 Slack notification prepared:', payload);
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error.message);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification() {
    try {
      // Email notification implementation
      console.log('📧 Email notification prepared');
    } catch (error) {
      console.error('❌ Failed to send email notification:', error.message);
    }
  }

  /**
   * Run complete monitoring analysis
   */
  async run() {
    console.log('🚀 Starting Test Automation Monitoring...\n');

    try {
      // Analyze all metrics
      await this.analyzeTestResults();
      await this.analyzeCoverageResults();
      await this.analyzePerformanceResults();
      await this.analyzeSecurityResults();

      // Analyze trends
      this.analyzeTrends();

      // Generate report
      const report = this.generateReport();

      // Save trends
      this.saveTrends();

      // Send notifications
      if (this.alerts.length > 0 || report.summary.status !== 'excellent') {
        await this.sendNotifications();
      }

      console.log('\n🎉 Monitoring completed successfully!');
      console.log(`📊 Overall Score: ${report.summary.overall}/100 (${report.summary.status})`);

      if (this.alerts.length > 0) {
        console.log(`🚨 ${this.alerts.length} alerts generated`);
      }

      if (report.recommendations.length > 0) {
        console.log(`💡 ${report.recommendations.length} recommendations provided`);
      }

      return report;

    } catch (error) {
      console.error('❌ Monitoring failed:', error);
      this.addAlert('monitoring_error', `Monitoring system failed: ${error.message}`, 'critical');
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];

    switch (key) {
      case 'results-dir':
        options.resultsDir = value;
        break;
      case 'coverage-dir':
        options.coverageDir = value;
        break;
      case 'failure-threshold':
        options.alertThresholds = { ...options.alertThresholds, failureRate: parseFloat(value) };
        break;
      case 'coverage-threshold':
        options.alertThresholds = { ...options.alertThresholds, coverageThreshold: parseFloat(value) };
        break;
      case 'performance-threshold':
        options.alertThresholds = { ...options.alertThresholds, performanceThreshold: parseFloat(value) };
        break;
      case 'notifications':
        options.notificationChannels = value.split(',');
        break;
    }
  }

  const monitor = new TestMonitoringSystem(options);
  monitor.run().then(report => {
    process.exit(report.summary.status === 'critical' ? 1 : 0);
  }).catch(error => {
    console.error('❌ Monitoring failed:', error);
    process.exit(1);
  });
}

module.exports = TestMonitoringSystem;