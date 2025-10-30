#!/usr/bin/env tsx

/**
 * Comprehensive Security Test Runner
 *
 * This script runs all security tests and generates a comprehensive
 * security report for the application.
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface SecurityTestResult {
  suite: string;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  status: 'passed' | 'failed' | 'error';
  issues: string[];
}

interface SecurityReport {
  timestamp: string;
  summary: {
    totalSuites: number;
    passedSuites: number;
    failedSuites: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    securityScore: number;
    duration: number;
  };
  suites: SecurityTestResult[];
  recommendations: string[];
  criticalIssues: string[];
}

const SECURITY_TEST_SUITES = [
  {
    name: 'Security Regression Tests',
    file: 'src/test/security/security-regression.test.ts',
    description: 'Automated tests to prevent security regressions',
  },
  {
    name: 'Penetration Testing',
    file: 'src/test/security/penetration-testing.test.ts',
    description: 'Simulated attack scenarios and penetration testing',
  },
  {
    name: 'Dependency Vulnerability Scanning',
    file: 'src/test/security/dependency-vulnerability.test.ts',
    description: 'Scans for vulnerable dependencies',
  },
  {
    name: 'Authentication & Authorization',
    file: 'src/test/security/authentication-authorization.test.ts',
    description: 'Tests authentication and authorization mechanisms',
  },
  {
    name: 'Input Validation',
    file: 'src/test/security/input-validation.test.ts',
    description: 'Tests input validation and sanitization',
  },
  {
    name: 'XSS & Injection Prevention',
    file: 'src/test/security/xss-injection-prevention.test.ts',
    description: 'Tests XSS and injection attack prevention',
  },
  {
    name: 'Session Security',
    file: 'src/test/security/session-security.test.ts',
    description: 'Tests session management security',
  },
  {
    name: 'API Security',
    file: 'src/test/security/api-security.test.ts',
    description: 'Tests API security controls',
  },
];

function runTestSuite(suite: typeof SECURITY_TEST_SUITES[0]): SecurityTestResult {
  console.log(`\n🔒 Running ${suite.name}...`);
  console.log(`📁 File: ${suite.file}`);
  console.log(`📝 ${suite.description}`);

  const startTime = Date.now();

  try {
    // Run the test suite with vitest
    const output = execSync(
      `npx vitest run ${suite.file} --reporter=json --no-coverage`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000, // 5 minutes
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    try {
      const results = JSON.parse(output);

      return {
        suite: suite.name,
        passed: results.numPassedTests || 0,
        failed: results.numFailedTests || 0,
        total: results.numTotalTests || 0,
        duration,
        status: results.numFailedTests === 0 ? 'passed' : 'failed',
        issues: results.testResults
          ?.filter((test: any) => test.status === 'failed')
          ?.map((test: any) => `${test.title}: ${test.failureMessages?.join(', ')}`) || [],
      };
    } catch (parseError) {
      // If JSON parsing fails, try to extract basic info from output
      const passedMatch = output.match(/✓ (\d+) test/);
      const failedMatch = output.match(/✗ (\d+) test/);

      return {
        suite: suite.name,
        passed: parseInt(passedMatch?.[1] || '0'),
        failed: parseInt(failedMatch?.[1] || '0'),
        total: parseInt(passedMatch?.[1] || '0') + parseInt(failedMatch?.[1] || '0'),
        duration,
        status: parseInt(failedMatch?.[1] || '0') === 0 ? 'passed' : 'failed',
        issues: parseInt(failedMatch?.[1] || '0') > 0 ? ['Test failures detected'] : [],
      };
    }
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      suite: suite.name,
      passed: 0,
      failed: 1,
      total: 1,
      duration,
      status: 'error',
      issues: [`Test execution failed: ${error.message}`],
    };
  }
}

function calculateSecurityScore(results: SecurityTestResult[]): number {
  let totalScore = 100;
  let maxDeduction = 0;

  results.forEach(result => {
    if (result.status === 'failed') {
      const deduction = Math.min(50, (result.failed / result.total) * 50);
      maxDeduction = Math.max(maxDeduction, deduction);
    } else if (result.status === 'error') {
      maxDeduction = Math.max(maxDeduction, 25);
    }
  });

  return Math.max(0, totalScore - maxDeduction);
}

function generateRecommendations(results: SecurityTestResult[]): string[] {
  const recommendations: string[] = [];

  results.forEach(result => {
    if (result.status === 'failed') {
      switch (result.suite) {
        case 'Security Regression Tests':
          recommendations.push('Review and fix security regression test failures to prevent security vulnerabilities');
          break;
        case 'Penetration Testing':
          recommendations.push('Address identified security vulnerabilities and implement additional security controls');
          break;
        case 'Dependency Vulnerability Scanning':
          recommendations.push('Update vulnerable dependencies and implement dependency monitoring');
          break;
        case 'Authentication & Authorization':
          recommendations.push('Strengthen authentication and authorization mechanisms');
          break;
        case 'Input Validation':
          recommendations.push('Improve input validation and sanitization controls');
          break;
        case 'XSS & Injection Prevention':
          recommendations.push('Enhance XSS and injection prevention measures');
          break;
        case 'Session Security':
          recommendations.push('Fix session management security issues');
          break;
        case 'API Security':
          recommendations.push('Strengthen API security controls and rate limiting');
          break;
      }
    } else if (result.status === 'error') {
      recommendations.push(`Fix test execution issues in ${result.suite}`);
    }
  });

  // Add general recommendations
  if (results.some(r => r.status === 'failed' || r.status === 'error')) {
    recommendations.push('Schedule regular security testing and code reviews');
    recommendations.push('Implement automated security testing in CI/CD pipeline');
    recommendations.push('Consider using additional security scanning tools');
  }

  return recommendations;
}

function identifyCriticalIssues(results: SecurityTestResult[]): string[] {
  const criticalIssues: string[] = [];

  results.forEach(result => {
    if (result.status === 'error') {
      criticalIssues.push(`Critical: ${result.suite} failed to execute - ${result.issues.join(', ')}`);
    }

    // Look for specific critical patterns in issues
    result.issues.forEach(issue => {
      if (issue.toLowerCase().includes('security') ||
          issue.toLowerCase().includes('vulnerability') ||
          issue.toLowerCase().includes('injection') ||
          issue.toLowerCase().includes('xss')) {
        criticalIssues.push(`Critical security issue in ${result.suite}: ${issue}`);
      }
    });
  });

  return criticalIssues;
}

function generateSecurityReport(results: SecurityTestResult[]): SecurityReport {
  const totalSuites = results.length;
  const passedSuites = results.filter(r => r.status === 'passed').length;
  const failedSuites = results.filter(r => r.status === 'failed').length;
  const errorSuites = results.filter(r => r.status === 'error').length;

  const totalTests = results.reduce((sum, r) => sum + r.total, 0);
  const passedTests = results.reduce((sum, r) => sum + r.passed, 0);
  const failedTests = results.reduce((sum, r) => sum + r.failed, 0);

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const securityScore = calculateSecurityScore(results);

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalSuites,
      passedSuites,
      failedSuites,
      totalTests,
      passedTests,
      failedTests,
      securityScore,
      duration: totalDuration,
    },
    suites: results,
    recommendations: generateRecommendations(results),
    criticalIssues: identifyCriticalIssues(results),
  };
}

function printReport(report: SecurityReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('🔒 COMPREHENSIVE SECURITY TEST REPORT');
  console.log('='.repeat(80));
  console.log(`📅 Timestamp: ${report.timestamp}`);
  console.log(`⏱️  Total Duration: ${(report.summary.duration / 1000).toFixed(2)}s`);

  console.log('\n📊 SUMMARY:');
  console.log(`   Test Suites: ${report.summary.passedSuites}/${report.summary.totalSuites} passed`);
  console.log(`   Tests: ${report.summary.passedTests}/${report.summary.totalTests} passed`);
  console.log(`   Security Score: ${report.summary.securityScore}/100`);

  // Print color-coded score
  if (report.summary.securityScore >= 90) {
    console.log('   ✅ EXCELLENT security posture');
  } else if (report.summary.securityScore >= 70) {
    console.log('   ⚠️  GOOD security posture with room for improvement');
  } else if (report.summary.securityScore >= 50) {
    console.log('   🚨 MODERATE security posture - immediate attention needed');
  } else {
    console.log('   🔴 POOR security posture - critical attention needed');
  }

  console.log('\n📋 TEST SUITE RESULTS:');
  report.suites.forEach(suite => {
    const statusIcon = suite.status === 'passed' ? '✅' :
                      suite.status === 'failed' ? '❌' : '💥';
    const percentage = suite.total > 0 ? ((suite.passed / suite.total) * 100).toFixed(1) : '0';

    console.log(`   ${statusIcon} ${suite.suite}`);
    console.log(`      Tests: ${suite.passed}/${suite.total} (${percentage}%)`);
    console.log(`      Duration: ${(suite.duration / 1000).toFixed(2)}s`);

    if (suite.issues.length > 0) {
      console.log(`      Issues: ${suite.issues.length}`);
      suite.issues.slice(0, 3).forEach(issue => {
        console.log(`        - ${issue.substring(0, 100)}${issue.length > 100 ? '...' : ''}`);
      });
      if (suite.issues.length > 3) {
        console.log(`        ... and ${suite.issues.length - 3} more`);
      }
    }
    console.log('');
  });

  if (report.criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:');
    report.criticalIssues.forEach(issue => {
      console.log(`   • ${issue}`);
    });
    console.log('');
  }

  if (report.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    console.log('');
  }
}

function saveReport(report: SecurityReport, outputPath: string): void {
  const reportJson = JSON.stringify(report, null, 2);
  writeFileSync(outputPath, reportJson, 'utf8');
  console.log(`📄 Detailed report saved to: ${outputPath}`);
}

function main(): void {
  console.log('🔒 Starting Comprehensive Security Test Suite');
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
  console.log(`📊 Running ${SECURITY_TEST_SUITES.length} test suites`);

  const results: SecurityTestResult[] = [];

  // Run each test suite
  SECURITY_TEST_SUITES.forEach(suite => {
    const result = runTestSuite(suite);
    results.push(result);
  });

  // Generate comprehensive report
  const report = generateSecurityReport(results);

  // Print report to console
  printReport(report);

  // Save detailed report
  const reportPath = join(process.cwd(), 'security-test-report.json');
  saveReport(report, reportPath);

  // Exit with appropriate code
  if (report.criticalIssues.length > 0) {
    console.log('💥 Critical security issues detected!');
    process.exit(1);
  } else if (report.summary.failedSuites > 0) {
    console.log('⚠️ Some security tests failed');
    process.exit(1);
  } else {
    console.log('✅ All security tests passed successfully!');
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}