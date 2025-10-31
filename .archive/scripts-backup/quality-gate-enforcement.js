#!/usr/bin/env node

/**
 * Quality Gate Enforcement System
 *
 * Provides comprehensive quality gate management:
 * - Multi-level quality gates (warning, blocking, critical)
 * - Automated quality score calculation
 * - Quality-based deployment decisions
 * - Quality trend analysis and reporting
 * - Automated quality improvement recommendations
 * - Integration with CI/CD pipelines
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class QualityGateEnforcement {
  constructor(options = {}) {
    this.options = {
      testResultsDir: path.join(process.cwd(), 'test-results'),
      qualityDir: path.join(process.cwd(), 'test-results', 'quality'),
      reportsDir: path.join(process.cwd(), 'test-results', 'quality', 'reports'),
      gatesConfig: path.join(process.cwd(), 'config', 'quality-gates.json'),
      thresholds: {
        // Global thresholds
        overall: {
          excellent: 95,
          good: 85,
          acceptable: 70,
          minimum: 60
        },
        // Coverage thresholds
        coverage: {
          excellent: { lines: 95, functions: 95, branches: 95, statements: 95 },
          good: { lines: 90, functions: 90, branches: 90, statements: 90 },
          acceptable: { lines: 80, functions: 80, branches: 80, statements: 80 },
          minimum: { lines: 70, functions: 70, branches: 70, statements: 70 }
        },
        // Performance thresholds
        performance: {
          excellent: { lighthouse: 95, coreWebVitals: 95, budget: 95 },
          good: { lighthouse: 90, coreWebVitals: 90, budget: 85 },
          acceptable: { lighthouse: 80, coreWebVitals: 80, budget: 75 },
          minimum: { lighthouse: 70, coreWebVitals: 70, budget: 70 }
        },
        // Security thresholds
        security: {
          excellent: { vulnerabilities: 0, critical: 0, high: 0 },
          good: { vulnerabilities: 2, critical: 0, high: 0 },
          acceptable: { vulnerabilities: 5, critical: 0, high: 1 },
          minimum: { vulnerabilities: 10, critical: 0, high: 2 }
        },
        // Accessibility thresholds
        accessibility: {
          excellent: { violations: 0, score: 95 },
          good: { violations: 2, score: 90 },
          acceptable: { violations: 5, score: 80 },
          minimum: { violations: 10, score: 70 }
        },
        // Test success rate thresholds
        testSuccess: {
          excellent: 100,
          good: 98,
          acceptable: 95,
          minimum: 90
        }
      },
      qualityGates: [
        {
          id: 'code-coverage',
          name: 'Code Coverage',
          level: 'blocking',
          weight: 0.2,
          enabled: true,
          description: 'Ensures adequate test coverage across the codebase'
        },
        {
          id: 'performance-standards',
          name: 'Performance Standards',
          level: 'blocking',
          weight: 0.2,
          enabled: true,
          description: 'Ensures application meets performance benchmarks'
        },
        {
          id: 'security-compliance',
          name: 'Security Compliance',
          level: 'critical',
          weight: 0.25,
          enabled: true,
          description: 'Ensures security vulnerabilities are addressed'
        },
        {
          id: 'accessibility-standards',
          name: 'Accessibility Standards',
          level: 'critical',
          weight: 0.15,
          enabled: true,
          description: 'Ensures WCAG compliance and accessibility'
        },
        {
          id: 'test-success-rate',
          name: 'Test Success Rate',
          level: 'blocking',
          weight: 0.1,
          enabled: true,
          description: 'Ensures tests are passing consistently'
        },
        {
          id: 'code-quality',
          name: 'Code Quality',
          level: 'warning',
          weight: 0.1,
          enabled: true,
          description: 'Ensures code quality standards are met'
        }
      ],
      deploymentRules: {
        production: {
          minimumScore: 90,
          requiredGates: ['security-compliance', 'accessibility-standards'],
          blockedGates: []
        },
        staging: {
          minimumScore: 80,
          requiredGates: ['security-compliance'],
          blockedGates: []
        },
        preview: {
          minimumScore: 70,
          requiredGates: [],
          blockedGates: []
        }
      },
      ...options
    };

    this.qualityResults = {
      summary: {
        overallScore: 0,
        grade: 'F',
        passedGates: 0,
        totalGates: 0,
        criticalFailures: 0,
        blockingFailures: 0,
        warningFailures: 0,
        deploymentReady: false,
        duration: 0
      },
      gates: [],
      trends: [],
      recommendations: [],
      deploymentDecision: null
    };

    this.initializeDirectories();
    this.loadQualityGatesConfig();
  }

  initializeDirectories() {
    const dirs = [
      this.options.qualityDir,
      this.options.reportsDir,
      path.join(this.options.qualityDir, 'trends'),
      path.join(this.options.qualityDir, 'history')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadQualityGatesConfig() {
    if (fs.existsSync(this.options.gatesConfig)) {
      try {
        const customConfig = JSON.parse(fs.readFileSync(this.options.gatesConfig, 'utf8'));
        this.options.qualityGates = customConfig.gates || this.options.qualityGates;
        this.options.thresholds = { ...this.options.thresholds, ...customConfig.thresholds };
      } catch (error) {
        console.warn('Could not load custom quality gates config:', error.message);
      }
    }
  }

  async runQualityGateEnforcement(environment = 'production') {
    console.log('🚦 Starting Quality Gate Enforcement...\n');
    const startTime = Date.now();

    try {
      // 1. Load test results from all test suites
      console.log('📊 Loading test results...');
      const testResults = await this.loadAllTestResults();

      // 2. Evaluate each quality gate
      console.log('🔍 Evaluating quality gates...');
      await this.evaluateQualityGates(testResults);

      // 3. Calculate overall quality score
      console.log('📈 Calculating overall quality score...');
      this.calculateOverallQualityScore();

      // 4. Determine quality grade
      console.log('🎓 Determining quality grade...');
      this.determineQualityGrade();

      // 5. Analyze quality trends
      console.log('📊 Analyzing quality trends...');
      await this.analyzeQualityTrends();

      // 6. Generate recommendations
      console.log('💡 Generating quality recommendations...');
      this.generateQualityRecommendations();

      // 7. Make deployment decision
      console.log('🚀 Making deployment decision...');
      this.makeDeploymentDecision(environment);

      // 8. Generate quality report
      console.log('📋 Generating quality report...');
      await this.generateQualityReport();

      this.qualityResults.summary.duration = Date.now() - startTime;

      console.log(`\n✅ Quality gate enforcement completed:`);
      console.log(`   Overall Score: ${this.qualityResults.summary.overallScore}/100`);
      console.log(`   Quality Grade: ${this.qualityResults.summary.grade}`);
      console.log(`   Gates Passed: ${this.qualityResults.summary.passedGates}/${this.qualityResults.summary.totalGates}`);
      console.log(`   Deployment Decision: ${this.qualityResults.deploymentDecision?.status || 'Unknown'}`);
      console.log(`   Duration: ${(this.qualityResults.summary.duration / 1000).toFixed(2)}s`);

      return this.qualityResults;

    } catch (error) {
      console.error('❌ Quality gate enforcement failed:', error);
      throw error;
    }
  }

  async loadAllTestResults() {
    const testResults = {
      unit: await this.loadTestResults('unit'),
      integration: await this.loadTestResults('integration'),
      e2e: await this.loadTestResults('e2e'),
      performance: await this.loadTestResults('performance'),
      accessibility: await this.loadTestResults('accessibility'),
      security: await this.loadTestResults('security'),
      visual: await this.loadTestResults('visual')
    };

    // Also try to load specific test result files
    try {
      const coverageResults = await this.loadCoverageResults();
      testResults.coverage = coverageResults;
    } catch (error) {
      console.warn('Could not load coverage results:', error.message);
    }

    try {
      const lighthouseResults = await this.loadLighthouseResults();
      testResults.lighthouse = lighthouseResults;
    } catch (error) {
      console.warn('Could not load Lighthouse results:', error.message);
    }

    try {
      const securityAuditResults = await this.loadSecurityAuditResults();
      testResults.securityAudit = securityAuditResults;
    } catch (error) {
      console.warn('Could not load security audit results:', error.message);
    }

    return testResults;
  }

  async loadTestResults(testType) {
    const resultsFile = path.join(this.options.testResultsDir, `${testType}-results.json`);

    if (!fs.existsSync(resultsFile)) {
      return { exists: false };
    }

    try {
      const data = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      return { ...data, exists: true };
    } catch (error) {
      console.warn(`Could not load ${testType} results:`, error.message);
      return { exists: false, error: error.message };
    }
  }

  async loadCoverageResults() {
    const coverageFile = path.join(this.options.testResultsDir, 'coverage', 'coverage-summary.json');

    if (!fs.existsSync(coverageFile)) {
      return { exists: false };
    }

    try {
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      return { ...coverage, exists: true };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  async loadLighthouseResults() {
    const lighthouseFile = path.join(this.options.testResultsDir, 'performance', 'reports', 'performance-report.json');

    if (!fs.existsSync(lighthouseFile)) {
      return { exists: false };
    }

    try {
      const lighthouse = JSON.parse(fs.readFileSync(lighthouseFile, 'utf8'));
      return { ...lighthouse, exists: true };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  async loadSecurityAuditResults() {
    const securityFile = path.join(this.options.testResultsDir, 'security', 'reports', 'security-report.json');

    if (!fs.existsSync(securityFile)) {
      return { exists: false };
    }

    try {
      const security = JSON.parse(fs.readFileSync(securityFile, 'utf8'));
      return { ...security, exists: true };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  async evaluateQualityGates(testResults) {
    const enabledGates = this.options.qualityGates.filter(gate => gate.enabled);

    for (const gate of enabledGates) {
      console.log(`   🔍 Evaluating gate: ${gate.name}`);

      try {
        const gateResult = await this.evaluateQualityGate(gate, testResults);
        this.qualityResults.gates.push(gateResult);

        // Update failure counters
        if (!gateResult.passed) {
          switch (gate.level) {
            case 'critical':
              this.qualityResults.summary.criticalFailures++;
              break;
            case 'blocking':
              this.qualityResults.summary.blockingFailures++;
              break;
            case 'warning':
              this.qualityResults.summary.warningFailures++;
              break;
          }
        } else {
          this.qualityResults.summary.passedGates++;
        }

        this.qualityResults.summary.totalGates++;

      } catch (error) {
        console.log(`   ❌ Error evaluating gate ${gate.name}: ${error.message}`);

        this.qualityResults.gates.push({
          id: gate.id,
          name: gate.name,
          level: gate.level,
          weight: gate.weight,
          passed: false,
          score: 0,
          error: error.message,
          details: {}
        });

        this.qualityResults.summary.totalGates++;
        this.qualityResults.summary.blockingFailures++;
      }
    }
  }

  async evaluateQualityGate(gate, testResults) {
    const evaluators = {
      'code-coverage': () => this.evaluateCodeCoverageGate(testResults),
      'performance-standards': () => this.evaluatePerformanceGate(testResults),
      'security-compliance': () => this.evaluateSecurityGate(testResults),
      'accessibility-standards': () => this.evaluateAccessibilityGate(testResults),
      'test-success-rate': () => this.evaluateTestSuccessGate(testResults),
      'code-quality': () => this.evaluateCodeQualityGate(testResults)
    };

    const evaluator = evaluators[gate.id];
    if (!evaluator) {
      throw new Error(`No evaluator found for gate: ${gate.id}`);
    }

    const result = await evaluator();

    return {
      id: gate.id,
      name: gate.name,
      level: gate.level,
      weight: gate.weight,
      description: gate.description,
      ...result
    };
  }

  async evaluateCodeCoverageGate(testResults) {
    const coverage = testResults.coverage || {};

    if (!coverage.exists) {
      return {
        passed: false,
        score: 0,
        details: { error: 'Coverage results not found' }
      };
    }

    const total = coverage.total || {};
    const thresholds = this.options.thresholds.coverage.good;

    const coverageMetrics = {
      lines: total.lines?.pct || 0,
      functions: total.functions?.pct || 0,
      branches: total.branches?.pct || 0,
      statements: total.statements?.pct || 0
    };

    // Calculate coverage score
    const coverageScore = (
      (coverageMetrics.lines / thresholds.lines) * 25 +
      (coverageMetrics.functions / thresholds.functions) * 25 +
      (coverageMetrics.branches / thresholds.branches) * 25 +
      (coverageMetrics.statements / thresholds.statements) * 25
    );

    const passed = Object.entries(thresholds).every(([metric, threshold]) =>
      coverageMetrics[metric] >= threshold
    );

    return {
      passed,
      score: Math.min(100, Math.round(coverageScore)),
      details: {
        metrics: coverageMetrics,
        thresholds: thresholds,
        belowThreshold: Object.entries(thresholds)
          .filter(([metric, threshold]) => coverageMetrics[metric] < threshold)
          .map(([metric, threshold]) => ({ metric, current: coverageMetrics[metric], threshold }))
      }
    };
  }

  async evaluatePerformanceGate(testResults) {
    const performance = testResults.performance || {};
    const lighthouse = testResults.lighthouse || {};

    if (!performance.exists && !lighthouse.exists) {
      return {
        passed: false,
        score: 0,
        details: { error: 'Performance results not found' }
      };
    }

    const thresholds = this.options.thresholds.performance.good;

    // Get performance metrics
    const lighthouseScore = lighthouse.summary?.lighthouseScore || performance.summary?.overallScore || 0;
    const coreWebVitalsScore = lighthouse.summary?.coreWebVitalsScore || performance.summary?.coreWebVitalsScore || 0;
    const budgetScore = lighthouse.summary?.budgetScore || performance.summary?.budgetScore || 0;

    const performanceMetrics = {
      lighthouse: lighthouseScore,
      coreWebVitals: coreWebVitalsScore,
      budget: budgetScore
    };

    // Calculate performance score
    const performanceScore = (
      (performanceMetrics.lighthouse / thresholds.lighthouse) * 0.4 +
      (performanceMetrics.coreWebVitals / thresholds.coreWebVitals) * 0.4 +
      (performanceMetrics.budget / thresholds.budget) * 0.2
    ) * 100;

    const passed = Object.entries(thresholds).every(([metric, threshold]) =>
      performanceMetrics[metric] >= threshold
    );

    return {
      passed,
      score: Math.min(100, Math.round(performanceScore)),
      details: {
        metrics: performanceMetrics,
        thresholds: thresholds,
        belowThreshold: Object.entries(thresholds)
          .filter(([metric, threshold]) => performanceMetrics[metric] < threshold)
          .map(([metric, threshold]) => ({ metric, current: performanceMetrics[metric], threshold }))
      }
    };
  }

  async evaluateSecurityGate(testResults) {
    const security = testResults.security || {};
    const securityAudit = testResults.securityAudit || {};

    if (!security.exists && !securityAudit.exists) {
      return {
        passed: false,
        score: 0,
        details: { error: 'Security results not found' }
      };
    }

    const summary = security.summary || securityAudit.summary || {};
    const thresholds = this.options.thresholds.security.good;

    const securityMetrics = {
      vulnerabilities: summary.totalVulnerabilities || 0,
      critical: summary.criticalVulnerabilities || 0,
      high: summary.highVulnerabilities || 0,
      overallScore: summary.overallScore || 0
    };

    // Security gates are more strict - any critical or high vulnerabilities fail
    const passed = securityMetrics.critical === 0 &&
                   securityMetrics.high <= thresholds.high &&
                   securityMetrics.vulnerabilities <= thresholds.vulnerabilities;

    // Calculate security score
    let securityScore = securityMetrics.overallScore;

    // Heavy penalties for critical and high vulnerabilities
    if (securityMetrics.critical > 0) {
      securityScore = Math.max(0, securityScore - (securityMetrics.critical * 50));
    }
    if (securityMetrics.high > 0) {
      securityScore = Math.max(0, securityScore - (securityMetrics.high * 25));
    }

    return {
      passed,
      score: Math.round(securityScore),
      details: {
        metrics: securityMetrics,
        thresholds: thresholds,
        vulnerabilities: {
          critical: securityMetrics.critical,
          high: securityMetrics.high,
          medium: summary.mediumVulnerabilities || 0,
          low: summary.lowVulnerabilities || 0
        }
      }
    };
  }

  async evaluateAccessibilityGate(testResults) {
    const accessibility = testResults.accessibility || {};

    if (!accessibility.exists) {
      return {
        passed: false,
        score: 0,
        details: { error: 'Accessibility results not found' }
      };
    }

    const summary = accessibility.summary || {};
    const thresholds = this.options.thresholds.accessibility.good;

    const accessibilityMetrics = {
      violations: summary.totalVulnerabilities || 0,
      score: summary.overallScore || 0
    };

    const passed = accessibilityMetrics.violations <= thresholds.violations &&
                   accessibilityMetrics.score >= thresholds.score;

    return {
      passed,
      score: Math.round(accessibilityMetrics.score),
      details: {
        metrics: accessibilityMetrics,
        thresholds: thresholds,
        violations: {
          critical: summary.criticalViolations || 0,
          serious: summary.seriousViolations || 0,
          moderate: summary.moderateViolations || 0,
          minor: summary.minorViolations || 0
        }
      }
    };
  }

  async evaluateTestSuccessGate(testResults) {
    const allTestResults = [
      testResults.unit,
      testResults.integration,
      testResults.e2e,
      testResults.visual
    ].filter(result => result && result.exists);

    if (allTestResults.length === 0) {
      return {
        passed: false,
        score: 0,
        details: { error: 'No test results found' }
      };
    }

    let totalTests = 0;
    let passedTests = 0;

    allTestResults.forEach(result => {
      totalTests += result.total || 0;
      passedTests += result.passed || 0;
    });

    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const thresholds = this.options.thresholds.testSuccess.good;

    const passed = successRate >= thresholds;

    return {
      passed,
      score: Math.round(successRate),
      details: {
        metrics: {
          totalTests,
          passedTests,
          failedTests: totalTests - passedTests,
          successRate: Math.round(successRate)
        },
        thresholds: thresholds
      }
    };
  }

  async evaluateCodeQualityGate(testResults) {
    // This would integrate with code quality tools like SonarQube, ESLint, etc.
    // For now, we'll simulate code quality evaluation

    const codeQualityMetrics = {
      maintainabilityIndex: 85 + Math.random() * 15,
      technicalDebt: Math.random() * 10, // hours
      codeSmells: Math.floor(Math.random() * 5),
      duplicatedLines: Math.random() * 1000, // lines
      coverage: 85 + Math.random() * 10
    };

    const thresholds = {
      maintainabilityIndex: 80,
      technicalDebt: 8, // hours
      codeSmells: 5,
      duplicatedLines: 500, // lines
      coverage: 85
    };

    // Calculate code quality score
    let qualityScore = 0;
    let metricsPassed = 0;

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = codeQualityMetrics[metric];
      let passed = false;

      if (metric === 'technicalDebt' || metric === 'codeSmells' || metric === 'duplicatedLines') {
        passed = value <= threshold;
      } else {
        passed = value >= threshold;
      }

      if (passed) {
        metricsPassed++;
        qualityScore += 100;
      } else {
        // Partial score based on how far from threshold
        const ratio = metric === 'technicalDebt' || metric === 'codeSmells' || metric === 'duplicatedLines'
          ? threshold / value
          : value / threshold;
        qualityScore += Math.max(0, ratio * 100);
      }
    });

    const overallScore = Math.round(qualityScore / Object.keys(thresholds).length);
    const passed = metricsPassed >= Object.keys(thresholds).length - 1; // Allow one metric to be below threshold

    return {
      passed,
      score: overallScore,
      details: {
        metrics: codeQualityMetrics,
        thresholds: thresholds,
        metricsPassed: metricsPassed,
        totalMetrics: Object.keys(thresholds).length
      }
    };
  }

  calculateOverallQualityScore() {
    const enabledGates = this.qualityResults.gates.filter(gate => gate.weight > 0);

    if (enabledGates.length === 0) {
      this.qualityResults.summary.overallScore = 0;
      return;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    enabledGates.forEach(gate => {
      weightedSum += gate.score * gate.weight;
      totalWeight += gate.weight;
    });

    this.qualityResults.summary.overallScore = Math.round(weightedSum / totalWeight);
  }

  determineQualityGrade() {
    const score = this.qualityResults.summary.overallScore;
    const thresholds = this.options.thresholds.overall;

    if (score >= thresholds.excellent) {
      this.qualityResults.summary.grade = 'A+';
    } else if (score >= thresholds.good) {
      this.qualityResults.summary.grade = 'A';
    } else if (score >= thresholds.acceptable) {
      this.qualityResults.summary.grade = 'B';
    } else if (score >= thresholds.minimum) {
      this.qualityResults.summary.grade = 'C';
    } else {
      this.qualityResults.summary.grade = 'F';
    }
  }

  async analyzeQualityTrends() {
    const trendsFile = path.join(this.options.qualityDir, 'trends', 'quality-trends.json');

    let existingTrends = [];
    if (fs.existsSync(trendsFile)) {
      try {
        existingTrends = JSON.parse(fs.readFileSync(trendsFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load existing trends:', error.message);
      }
    }

    // Add current results
    const currentTrend = {
      timestamp: new Date().toISOString(),
      overallScore: this.qualityResults.summary.overallScore,
      grade: this.qualityResults.summary.grade,
      gates: this.qualityResults.gates.map(gate => ({
        id: gate.id,
        name: gate.name,
        score: gate.score,
        passed: gate.passed
      }))
    };

    existingTrends.push(currentTrend);

    // Keep only last 30 entries
    if (existingTrends.length > 30) {
      existingTrends.splice(0, existingTrends.length - 30);
    }

    this.qualityResults.trends = existingTrends;

    // Save trends
    fs.writeFileSync(trendsFile, JSON.stringify(existingTrends, null, 2));

    // Calculate trend analysis
    if (existingTrends.length >= 2) {
      const recent = existingTrends.slice(-5); // Last 5 results
      const older = existingTrends.slice(-10, -5); // Previous 5 results

      if (recent.length >= 3 && older.length >= 2) {
        const recentAvg = recent.reduce((sum, t) => sum + t.overallScore, 0) / recent.length;
        const olderAvg = older.reduce((sum, t) => sum + t.overallScore, 0) / older.length;

        const trend = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable';
        const change = Math.abs(recentAvg - olderAvg);

        this.qualityResults.trendAnalysis = {
          direction: trend,
          change: Math.round(change),
          recentAverage: Math.round(recentAvg),
          olderAverage: Math.round(olderAvg)
        };
      }
    }
  }

  generateQualityRecommendations() {
    this.qualityResults.recommendations = [];

    // Generate recommendations based on failed gates
    this.qualityResults.gates.forEach(gate => {
      if (!gate.passed) {
        const recommendations = this.getGateRecommendations(gate);
        this.qualityResults.recommendations.push(...recommendations);
      }
    });

    // Generate recommendations based on score
    const score = this.qualityResults.summary.overallScore;
    if (score < 70) {
      this.qualityResults.recommendations.push({
        type: 'overall',
        priority: 'critical',
        title: 'Critical Quality Issues',
        description: 'Overall quality score is below minimum threshold. Immediate action required.',
        actions: [
          'Address all failing quality gates',
          'Review and fix critical test failures',
          'Improve code coverage and test quality',
          'Address security vulnerabilities'
        ]
      });
    } else if (score < 85) {
      this.qualityResults.recommendations.push({
        type: 'overall',
        priority: 'high',
        title: 'Quality Improvements Needed',
        description: 'Quality score is below recommended threshold. Consider improvements.',
        actions: [
          'Focus on failing quality gates',
          'Improve test coverage in weak areas',
          'Optimize performance and address bottlenecks',
          'Enhance accessibility compliance'
        ]
      });
    }

    // Generate trend-based recommendations
    if (this.qualityResults.trendAnalysis) {
      const { direction, change } = this.qualityResults.trendAnalysis;
      if (direction === 'declining' && change > 10) {
        this.qualityResults.recommendations.push({
          type: 'trend',
          priority: 'high',
          title: 'Quality Decline Detected',
          description: `Quality has declined by ${change} points recently. Investigate and address root causes.`,
          actions: [
            'Review recent code changes for quality impact',
            'Check if test coverage has decreased',
            'Verify if new dependencies introduced issues',
            'Assess if performance has regressed'
          ]
        });
      }
    }
  }

  getGateRecommendations(gate) {
    const recommenders = {
      'code-coverage': () => this.getCoverageRecommendations(gate),
      'performance-standards': () => this.getPerformanceRecommendations(gate),
      'security-compliance': () => this.getSecurityRecommendations(gate),
      'accessibility-standards': () => this.getAccessibilityRecommendations(gate),
      'test-success-rate': () => this.getTestSuccessRecommendations(gate),
      'code-quality': () => this.getCodeQualityRecommendations(gate)
    };

    const recommender = recommenders[gate.id];
    return recommender ? recommender() : [];
  }

  getCoverageRecommendations(gate) {
    const recommendations = [];
    const belowThreshold = gate.details?.belowThreshold || [];

    belowThreshold.forEach(item => {
      recommendations.push({
        type: 'coverage',
        priority: gate.level === 'critical' ? 'critical' : 'high',
        title: `Improve ${item.metric} Coverage`,
        description: `${item.metric} coverage is ${item.current}% (target: ${item.threshold}%)`,
        actions: [
          `Write unit tests for uncovered ${item.metric}`,
          'Use test-driven development for new features',
          'Review and refactor untestable code',
          'Set up coverage monitoring in CI'
        ]
      });
    });

    return recommendations;
  }

  getPerformanceRecommendations(gate) {
    const recommendations = [];
    const belowThreshold = gate.details?.belowThreshold || [];

    belowThreshold.forEach(item => {
      recommendations.push({
        type: 'performance',
        priority: gate.level === 'critical' ? 'critical' : 'high',
        title: `Improve ${item.metric} Performance`,
        description: `${item.metric} score is ${item.current} (target: ${item.threshold})`,
        actions: [
          'Profile application to identify bottlenecks',
          'Optimize images and assets',
          'Implement code splitting and lazy loading',
          'Use caching strategies effectively'
        ]
      });
    });

    return recommendations;
  }

  getSecurityRecommendations(gate) {
    const recommendations = [];
    const vulnerabilities = gate.details?.vulnerabilities || {};

    if (vulnerabilities.critical > 0) {
      recommendations.push({
        type: 'security',
        priority: 'critical',
        title: 'Fix Critical Security Vulnerabilities',
        description: `${vulnerabilities.critical} critical vulnerabilities detected`,
        actions: [
          'Address critical vulnerabilities immediately',
          'Update dependencies to secure versions',
          'Review and fix security flaws',
          'Implement security testing in CI'
        ]
      });
    }

    if (vulnerabilities.high > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        title: 'Fix High-Severity Security Issues',
        description: `${vulnerabilities.high} high-severity vulnerabilities detected`,
        actions: [
          'Address high-severity vulnerabilities soon',
          'Review security best practices',
          'Implement proper input validation',
          'Add security headers and configurations'
        ]
      });
    }

    return recommendations;
  }

  getAccessibilityRecommendations(gate) {
    const recommendations = [];
    const violations = gate.details?.violations || {};

    if (violations.critical > 0 || violations.serious > 0) {
      recommendations.push({
        type: 'accessibility',
        priority: 'high',
        title: 'Fix Critical Accessibility Issues',
        description: `${violations.critical + violations.serious} critical/serious accessibility violations`,
        actions: [
          'Fix WCAG AA compliance issues',
          'Add proper alt text to images',
          'Ensure keyboard navigation works',
          'Test with screen readers'
        ]
      });
    }

    return recommendations;
  }

  getTestSuccessRecommendations(gate) {
    const recommendations = [];
    const metrics = gate.details?.metrics || {};

    if (metrics.failedTests > 0) {
      recommendations.push({
        type: 'tests',
        priority: 'critical',
        title: 'Fix Failing Tests',
        description: `${metrics.failedTests} tests are failing`,
        actions: [
          'Review and fix failing tests',
          'Check for flaky tests and stabilize them',
          'Update test data and fixtures',
          'Ensure tests are reliable and deterministic'
        ]
      });
    }

    if (metrics.successRate < 95) {
      recommendations.push({
        type: 'tests',
        priority: 'high',
        title: 'Improve Test Success Rate',
        description: `Test success rate is ${metrics.successRate}% (target: 95%+)`,
        actions: [
          'Investigate test failure patterns',
          'Improve test reliability',
          'Add better error handling in tests',
          'Review test environment stability'
        ]
      });
    }

    return recommendations;
  }

  getCodeQualityRecommendations(gate) {
    const recommendations = [];
    const metrics = gate.details?.metrics || {};

    if (metrics.maintainabilityIndex < 80) {
      recommendations.push({
        type: 'code-quality',
        priority: 'medium',
        title: 'Improve Code Maintainability',
        description: `Maintainability index is ${metrics.maintainabilityIndex.toFixed(1)} (target: 80+)`,
        actions: [
          'Refactor complex methods and classes',
          'Reduce code duplication',
          'Improve code documentation',
          'Follow coding best practices'
        ]
      });
    }

    if (metrics.codeSmells > 3) {
      recommendations.push({
        type: 'code-quality',
        priority: 'medium',
        title: 'Address Code Smells',
        description: `${metrics.codeSmells} code smells detected`,
        actions: [
          'Review and refactor code smells',
          'Use static analysis tools',
          'Establish coding standards',
          'Conduct regular code reviews'
        ]
      });
    }

    return recommendations;
  }

  makeDeploymentDecision(environment) {
    const rules = this.options.deploymentRules[environment];
    if (!rules) {
      this.qualityResults.deploymentDecision = {
        status: 'unknown',
        reason: `No deployment rules configured for ${environment}`,
        canDeploy: false
      };
      return;
    }

    const score = this.qualityResults.summary.overallScore;
    const failedCriticalGates = this.qualityResults.gates.filter(gate => !gate.passed && gate.level === 'critical');
    const failedBlockingGates = this.qualityResults.gates.filter(gate => !gate.passed && gate.level === 'blocking');

    // Check minimum score requirement
    if (score < rules.minimumScore) {
      this.qualityResults.deploymentDecision = {
        status: 'blocked',
        reason: `Quality score ${score} is below minimum threshold ${rules.minimumScore}`,
        canDeploy: false,
        requirement: 'minimum-score'
      };
      return;
    }

    // Check required gates
    const failedRequiredGates = failedCriticalGates.concat(failedBlockingGates)
      .filter(gate => rules.requiredGates.includes(gate.id));

    if (failedRequiredGates.length > 0) {
      this.qualityResults.deploymentDecision = {
        status: 'blocked',
        reason: `Required quality gates failed: ${failedRequiredGates.map(g => g.name).join(', ')}`,
        canDeploy: false,
        requirement: 'required-gates',
        failedGates: failedRequiredGates.map(g => g.id)
      };
      return;
    }

    // Check blocked gates
    const failedBlockedGates = failedCriticalGates.concat(failedBlockingGates)
      .filter(gate => rules.blockedGates.includes(gate.id));

    if (failedBlockedGates.length > 0) {
      this.qualityResults.deploymentDecision = {
        status: 'blocked',
        reason: `Blocked quality gates failed: ${failedBlockedGates.map(g => g.name).join(', ')}`,
        canDeploy: false,
        requirement: 'blocked-gates',
        failedGates: failedBlockedGates.map(g => g.id)
      };
      return;
    }

    // All checks passed
    this.qualityResults.deploymentDecision = {
      status: 'approved',
      reason: `Quality score ${score} meets requirements and all required gates passed`,
      canDeploy: true,
      qualityScore: score,
      passedGates: this.qualityResults.gates.filter(g => g.passed).length,
      totalGates: this.qualityResults.gates.length
    };

    this.qualityResults.summary.deploymentReady = true;
  }

  async generateQualityReport() {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Gate Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 700; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin-bottom: 40px; }
        .metric-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; transition: transform 0.2s ease; }
        .metric-card:hover { transform: translateY(-5px); }
        .metric-value { font-size: 3em; font-weight: 700; margin-bottom: 10px; }
        .metric-label { color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .grade-A { color: #10b981; }
        .grade-B { color: #f59e0b; }
        .grade-C { color: #f97316; }
        .grade-F { color: #ef4444; }
        .section { background: white; margin-bottom: 30px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .section-header { background: #f8fafc; padding: 25px; border-bottom: 1px solid #e5e7eb; }
        .section-header h2 { margin: 0; color: #1f2937; font-size: 1.5em; }
        .section-content { padding: 25px; }
        .gate-item { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 20px; padding: 20px; border-bottom: 1px solid #e5e7eb; }
        .gate-item:last-child { border-bottom: none; }
        .gate-info h3 { margin: 0 0 5px 0; color: #1f2937; }
        .gate-info p { margin: 0; color: #666; font-size: 0.9em; }
        .gate-score { font-size: 1.5em; font-weight: 700; min-width: 60px; text-align: center; }
        .gate-status { padding: 6px 16px; border-radius: 20px; font-weight: 600; text-transform: uppercase; font-size: 0.8em; }
        .status-passed { background: #d1fae5; color: #065f46; }
        .status-failed { background: #fee2e2; color: #991b1b; }
        .status-critical { background: #fef2f2; color: #991b1b; border: 2px solid #dc2626; }
        .deployment-decision { padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
        .deployment-approved { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
        .deployment-blocked { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
        .deployment-approved h3 { color: white; }
        .deployment-blocked h3 { color: white; }
        .recommendations { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-top: 20px; }
        .recommendations h3 { color: #d97706; margin-top: 0; }
        .recommendation-item { background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #f59e0b; }
        .recommendation-title { font-weight: 600; color: #d97706; margin-bottom: 5px; }
        .recommendation-description { color: #666; margin-bottom: 10px; }
        .recommendation-actions ul { margin: 0; padding-left: 20px; }
        .recommendation-actions li { margin-bottom: 5px; }
        .chart-container { position: relative; height: 400px; margin: 20px 0; }
        .trend-indicator { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 600; margin-left: 10px; }
        .trend-improving { background: #d1fae5; color: #065f46; }
        .trend-declining { background: #fee2e2; color: #991b1b; }
        .trend-stable { background: #f3f4f6; color: #374151; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚦 Quality Gate Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Comprehensive Quality Assessment & Deployment Decision</p>
    </div>

    <div class="deployment-decision ${this.qualityResults.deploymentDecision?.canDeploy ? 'deployment-approved' : 'deployment-blocked'}">
        <h3>${this.qualityResults.deploymentDecision?.status === 'approved' ? '✅ DEPLOYMENT APPROVED' : '🚫 DEPLOYMENT BLOCKED'}</h3>
        <p>${this.qualityResults.deploymentDecision?.reason}</p>
        ${this.qualityResults.deploymentDecision?.qualityScore ? `<p>Quality Score: ${this.qualityResults.deploymentDecision.qualityScore}/100</p>` : ''}
    </div>

    <div class="summary-grid">
        <div class="metric-card">
            <div class="metric-value grade-${this.qualityResults.summary.grade}">${this.qualityResults.summary.overallScore}/100</div>
            <div class="metric-label">Overall Quality Score</div>
        </div>
        <div class="metric-card">
            <div class="metric-value grade-${this.qualityResults.summary.grade}">${this.qualityResults.summary.grade}</div>
            <div class="metric-label">Quality Grade</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${this.qualityResults.summary.passedGates}/${this.qualityResults.summary.totalGates}</div>
            <div class="metric-label">Gates Passed</div>
        </div>
        <div class="metric-card">
            <div class="metric-value critical">${this.qualityResults.summary.criticalFailures}</div>
            <div class="metric-label">Critical Failures</div>
        </div>
        <div class="metric-card">
            <div class="metric-value high">${this.qualityResults.summary.blockingFailures}</div>
            <div class="metric-label">Blocking Failures</div>
        </div>
        <div class="metric-card">
            <div class="metric-value ${(this.qualityResults.summary.duration / 1000).toFixed(1)}s</div>
            <div class="metric-label">Evaluation Duration</div>
        </div>
    </div>

    ${this.generateGatesHTML()}
    ${this.generateTrendsHTML()}
    ${this.generateRecommendationsHTML()}
</body>
</html>`;

    fs.writeFileSync(
      path.join(this.options.reportsDir, 'quality-gate-report.html'),
      htmlTemplate
    );

    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary: this.qualityResults.summary,
      gates: this.qualityResults.gates,
      trends: this.qualityResults.trends,
      trendAnalysis: this.qualityResults.trendAnalysis,
      recommendations: this.qualityResults.recommendations,
      deploymentDecision: this.qualityResults.deploymentDecision,
      config: this.options
    };

    fs.writeFileSync(
      path.join(this.options.reportsDir, 'quality-gate-report.json'),
      JSON.stringify(jsonReport, null, 2)
    );

    // Save to history
    const historyFile = path.join(this.options.qualityDir, 'history', `quality-report-${Date.now()}.json`);
    fs.writeFileSync(historyFile, JSON.stringify(jsonReport, null, 2));
  }

  generateGatesHTML() {
    return `
      <div class="section">
        <div class="section-header">
          <h2>🚦 Quality Gates Results</h2>
        </div>
        <div class="section-content">
          ${this.qualityResults.gates.map(gate => `
            <div class="gate-item">
              <div class="gate-info">
                <h3>${gate.name}</h3>
                <p>${gate.description}</p>
              </div>
              <div class="gate-score grade-${gate.score >= 90 ? 'A' : gate.score >= 80 ? 'B' : gate.score >= 70 ? 'C' : 'F'}">
                ${gate.score}
              </div>
              <div class="gate-status ${gate.passed ? 'status-passed' : gate.level === 'critical' ? 'status-critical' : 'status-failed'}">
                ${gate.passed ? 'PASSED' : gate.level.toUpperCase()}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  generateTrendsHTML() {
    if (!this.qualityResults.trendAnalysis) {
      return '';
    }

    const { direction, change, recentAverage, olderAverage } = this.qualityResults.trendAnalysis;

    return `
      <div class="section">
        <div class="section-header">
          <h2>📊 Quality Trends</h2>
          <span class="trend-indicator trend-${direction}">
            ${direction === 'improving' ? '↗️' : direction === 'declining' ? '↘️' : '→'} ${direction.charAt(0).toUpperCase() + direction.slice(1)}
          </span>
        </div>
        <div class="section-content">
          <div class="chart-container">
            <canvas id="qualityTrendChart"></canvas>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p><strong>Recent Average:</strong> ${recentAverage}/100</p>
            <p><strong>Previous Average:</strong> ${olderAverage}/100</p>
            <p><strong>Change:</strong> ${change > 0 ? '+' : ''}${change} points</p>
          </div>
        </div>
      </div>

      <script>
        // Quality trend chart
        const ctx = document.getElementById('qualityTrendChart').getContext('2d');
        const trendData = ${JSON.stringify(this.qualityResults.trends.slice(-10))};

        new Chart(ctx, {
          type: 'line',
          data: {
            labels: trendData.map(d => new Date(d.timestamp).toLocaleDateString()),
            datasets: [{
              label: 'Quality Score',
              data: trendData.map(d => d.overallScore),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '/100';
                  }
                }
              }
            }
          }
        });
      </script>
    `;
  }

  generateRecommendationsHTML() {
    if (this.qualityResults.recommendations.length === 0) {
      return `
        <div class="section">
          <div class="section-header">
            <h2>💡 Quality Recommendations</h2>
          </div>
          <div class="section-content">
            <p style="text-align: center; color: #10b981; font-weight: 600;">🎉 Excellent quality! No recommendations at this time.</p>
          </div>
        </div>
      `;
    }

    const groupedRecommendations = this.qualityResults.recommendations.reduce((groups, rec) => {
      if (!groups[rec.type]) {
        groups[rec.type] = [];
      }
      groups[rec.type].push(rec);
      return groups;
    }, {});

    return `
      <div class="section">
        <div class="section-header">
          <h2>💡 Quality Recommendations</h2>
        </div>
        <div class="section-content">
          ${Object.entries(groupedRecommendations).map(([type, recommendations]) => `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #374151; margin-bottom: 15px; text-transform: capitalize;">${type.replace('-', ' ')} Improvements</h3>
              ${recommendations.map(rec => `
                <div class="recommendation-item">
                  <div class="recommendation-title">${rec.title}</div>
                  <div class="recommendation-description">${rec.description}</div>
                  ${rec.actions ? `
                    <div class="recommendation-actions">
                      <strong>Actions:</strong>
                      <ul>
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
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
  const environment = process.argv[2] || 'production';
  const options = {
    configFile: process.argv.includes('--config') ? process.argv[process.argv.indexOf('--config') + 1] : null,
    strictMode: process.argv.includes('--strict'),
    generateReport: !process.argv.includes('--no-report')
  };

  const qualityGate = new QualityGateEnforcement(options);

  qualityGate.runQualityGateEnforcement(environment)
    .then((results) => {
      console.log('\n✅ Quality gate enforcement completed!');

      if (results.deploymentDecision?.canDeploy) {
        console.log(`🎉 Deployment approved for ${environment}!`);
        console.log(`Quality Score: ${results.summary.overallScore}/100 (${results.summary.grade})`);
        process.exit(0);
      } else {
        console.log(`🚫 Deployment blocked for ${environment}!`);
        console.log(`Reason: ${results.deploymentDecision?.reason}`);
        console.log(`Quality Score: ${results.summary.overallScore}/100 (${results.summary.grade})`);

        if (options.generateReport) {
          console.log('📊 View detailed report: test-results/quality/reports/quality-gate-report.html');
        }

        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Quality gate enforcement failed:', error);
      process.exit(1);
    });
}

module.exports = QualityGateEnforcement;