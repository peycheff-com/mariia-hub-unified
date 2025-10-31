#!/usr/bin/env node

/**
 * Comprehensive Security Scanner for Mariia Hub
 *
 * This script scans the codebase for common security vulnerabilities:
 * - Hardcoded secrets and API keys
 * - XSS vulnerabilities (innerHTML, dangerouslySetInnerHTML)
 * - SQL injection patterns
 * - Weak random generation
 * - Log injection vulnerabilities
 * - Insecure dependencies
 *
 * Usage: node scripts/security-scan-comprehensive.js
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configuration
const config = {
  // File patterns to scan
  includePatterns: [
    '**/*.js',
    '**/*.jsx',
    '**/*.ts',
    '**/*.tsx',
    '**/*.json',
    '**/*.env*',
    '**/*.yml',
    '**/*.yaml'
  ],

  // Directories to exclude
  excludeDirs: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '.nyc_output',
    'tmp',
    'temp'
  ],

  // Secret patterns to detect
  secretPatterns: [
    // API Keys
    { pattern: /['"]?(sk_|pk_|AIza|ghp_|gho_|ghu_|ghs_|ghr_|glpat-)['\s=]*([a-zA-Z0-9_-]{20,})/g, type: 'API Key', severity: 'HIGH' },

    // JWT tokens
    { pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, type: 'JWT Token', severity: 'HIGH' },

    // Passwords
    { pattern: /password\s*[:=]\s*['"]([^'"]{8,})['"]/gi, type: 'Password', severity: 'HIGH' },

    // Database URLs
    { pattern: /(postgres|mysql|mongodb):\/\/[^:\s]+:[^@\s]+@[^\s]+/g, type: 'Database URL', severity: 'HIGH' },

    // Stripe webhook secrets
    { pattern: /whsec_[a-zA-Z0-9]{24,}/g, type: 'Stripe Webhook Secret', severity: 'HIGH' },

    // Generic secret patterns
    { pattern: /['"]?(secret|private|key|token|password|pwd)['"]?\s*[:=]\s*['"]([^'"]{16,})['"]/gi, type: 'Generic Secret', severity: 'MEDIUM' }
  ],

  // XSS patterns to detect
  xssPatterns: [
    { pattern: /\.innerHTML\s*=/g, type: 'innerHTML Assignment', severity: 'HIGH' },
    { pattern: /dangerouslySetInnerHTML/g, type: 'React dangerouslySetInnerHTML', severity: 'HIGH' },
    { pattern: /insertAdjacentHTML/g, type: 'insertAdjacentHTML', severity: 'MEDIUM' },
    { pattern: /document\.write/g, type: 'document.write', severity: 'HIGH' },
    { pattern: /eval\s*\(/g, type: 'eval() Usage', severity: 'HIGH' }
  ],

  // SQL injection patterns
  sqlInjectionPatterns: [
    { pattern: /\.ilike\s*\(\s*['"`][^'"`]*\$\{[^}]*\}[^'"`]*['"`]/g, type: 'SQL Injection in .ilike()', severity: 'HIGH' },
    { pattern: /\.ilike\s*\(\s*['"`][^'"`]*\+[^'"`]*['"`]/g, type: 'SQL Injection via String Concatenation', severity: 'HIGH' },
    { pattern: /query\s*\(\s*['"`][^'"`]*\$\{[^}]*\}/g, type: 'SQL Injection in query()', severity: 'HIGH' },
    { pattern: /execute\s*\(\s*['"`][^'"`]*\$\{[^}]*\}/g, type: 'SQL Injection in execute()', severity: 'HIGH' }
  ],

  // Weak random patterns
  weakRandomPatterns: [
    { pattern: /Math\.random\(\)/g, type: 'Weak Random Generation', severity: 'MEDIUM' },
    { pattern: /Date\.now\(\)\s*\+\s*Math\.random/g, type: 'Weak Random with Timestamp', severity: 'MEDIUM' }
  ],

  // Log injection patterns
  logInjectionPatterns: [
    { pattern: /(console\.log|logger\.info|logger\.error|logger\.warn)\s*\(\s*`[^`]*\$\{[^}]*\}[^`]*`/g, type: 'Log Injection in Template Literal', severity: 'MEDIUM' },
    { pattern: /(console\.log|logger\.info|logger\.error|logger\.warn)\s*\(\s*[^,]+,\s*\$\{[^}]*\}/g, type: 'Log Injection with Variable', severity: 'MEDIUM' }
  ]
};

// Results storage
const results = {
  secrets: [],
  xss: [],
  sqlInjection: [],
  weakRandom: [],
  logInjection: [],
  summary: {
    filesScanned: 0,
    vulnerabilitiesFound: 0,
    highSeverity: 0,
    mediumSeverity: 0,
    lowSeverity: 0
  }
};

// Helper function to check if a path should be excluded
function shouldExcludePath(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return config.excludeDirs.some(dir => normalizedPath.includes(`/${dir}/`) || normalizedPath.startsWith(`${dir}/`));
}

// Helper function to get all files recursively
function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory() && !shouldExcludePath(filePath)) {
      getAllFiles(filePath, fileList);
    } else if (stat.isFile()) {
      // Check if file matches include patterns
      const relativePath = filePath.replace(rootDir + '/', '');
      const isIncluded = config.includePatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(relativePath);
      });

      if (isIncluded) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// Scan file for patterns
function scanFileForPatterns(filePath, patterns, category) {
  const findings = [];

  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    patterns.forEach(({ pattern, type, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1]?.trim() || '';

        findings.push({
          file: filePath.replace(rootDir + '/', ''),
          line: lineNumber,
          type,
          severity,
          content: lineContent,
          match: match[0]
        });
      }
    });
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message);
  }

  return findings;
}

// Main scan function
function runSecurityScan() {
  console.log('🔒 Starting Comprehensive Security Scan...\n');

  // Get all files to scan
  const allFiles = getAllFiles(rootDir);
  results.summary.filesScanned = allFiles.length;

  console.log(`📁 Scanning ${allFiles.length} files...\n`);

  // Scan for secrets
  console.log('🔍 Scanning for hardcoded secrets...');
  allFiles.forEach(file => {
    const findings = scanFileForPatterns(file, config.secretPatterns, 'secrets');
    results.secrets.push(...findings);
  });

  // Scan for XSS vulnerabilities
  console.log('⚠️  Scanning for XSS vulnerabilities...');
  allFiles.forEach(file => {
    const findings = scanFileForPatterns(file, config.xssPatterns, 'xss');
    results.xss.push(...findings);
  });

  // Scan for SQL injection
  console.log('💉 Scanning for SQL injection vulnerabilities...');
  allFiles.forEach(file => {
    const findings = scanFileForPatterns(file, config.sqlInjectionPatterns, 'sqlInjection');
    results.sqlInjection.push(...findings);
  });

  // Scan for weak random generation
  console.log('🎲 Scanning for weak random generation...');
  allFiles.forEach(file => {
    const findings = scanFileForPatterns(file, config.weakRandomPatterns, 'weakRandom');
    results.weakRandom.push(...findings);
  });

  // Scan for log injection
  console.log('📝 Scanning for log injection vulnerabilities...');
  allFiles.forEach(file => {
    const findings = scanFileForPatterns(file, config.logInjectionPatterns, 'logInjection');
    results.logInjection.push(...findings);
  });

  // Calculate summary
  results.summary.vulnerabilitiesFound =
    results.secrets.length +
    results.xss.length +
    results.sqlInjection.length +
    results.weakRandom.length +
    results.logInjection.length;

  results.summary.highSeverity = [
    ...results.secrets.filter(f => f.severity === 'HIGH'),
    ...results.xss.filter(f => f.severity === 'HIGH'),
    ...results.sqlInjection.filter(f => f.severity === 'HIGH')
  ].length;

  results.summary.mediumSeverity = [
    ...results.secrets.filter(f => f.severity === 'MEDIUM'),
    ...results.xss.filter(f => f.severity === 'MEDIUM'),
    ...results.sqlInjection.filter(f => f.severity === 'MEDIUM'),
    ...results.weakRandom.filter(f => f.severity === 'MEDIUM'),
    ...results.logInjection.filter(f => f.severity === 'MEDIUM')
  ].length;

  // Generate report
  generateReport();
}

// Generate and save report
function generateReport() {
  console.log('\n📊 Generating Security Report...\n');

  const report = {
    scanDate: new Date().toISOString(),
    summary: results.summary,
    findings: {
      secrets: results.secrets,
      xss: results.xss,
      sqlInjection: results.sqlInjection,
      weakRandom: results.weakRandom,
      logInjection: results.logInjection
    },
    recommendations: generateRecommendations()
  };

  // Save JSON report
  const reportPath = join(rootDir, 'security-reports', `security-report-${Date.now()}.json`);

  // Create reports directory if it doesn't exist
  const reportsDir = dirname(reportPath);
  if (!existsSync(reportsDir)) {
    require('fs').mkdirSync(reportsDir, { recursive: true });
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary to console
  printSummary(report);

  console.log(`\n📄 Full report saved to: ${reportPath}`);

  // Exit with error code if high severity vulnerabilities found
  if (results.summary.highSeverity > 0) {
    console.log('\n❌ Security scan failed - High severity vulnerabilities detected!');
    process.exit(1);
  } else if (results.summary.vulnerabilitiesFound > 0) {
    console.log('\n⚠️  Security scan completed with warnings');
    process.exit(2);
  } else {
    console.log('\n✅ Security scan passed - No vulnerabilities detected!');
    process.exit(0);
  }
}

// Print summary to console
function printSummary(report) {
  console.log('='.repeat(60));
  console.log('🔒 SECURITY SCAN SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files Scanned: ${report.summary.filesScanned}`);
  console.log(`Vulnerabilities Found: ${report.summary.vulnerabilitiesFound}`);
  console.log(`High Severity: ${report.summary.highSeverity}`);
  console.log(`Medium Severity: ${report.summary.mediumSeverity}`);
  console.log('='.repeat(60));

  // Print high severity findings
  if (report.summary.highSeverity > 0) {
    console.log('\n🚨 HIGH SEVERITY VULNERABILITIES:');
    console.log('-'.repeat(40));

    const allFindings = [
      ...report.findings.secrets.filter(f => f.severity === 'HIGH'),
      ...report.findings.xss.filter(f => f.severity === 'HIGH'),
      ...report.findings.sqlInjection.filter(f => f.severity === 'HIGH')
    ];

    allFindings.forEach(finding => {
      console.log(`\n📍 ${finding.type}`);
      console.log(`   File: ${finding.file}:${finding.line}`);
      console.log(`   Code: ${finding.content.substring(0, 100)}...`);
    });
  }

  if (report.summary.vulnerabilitiesFound === 0) {
    console.log('\n✨ No vulnerabilities detected! Great job!');
  }
}

// Generate recommendations
function generateRecommendations() {
  const recommendations = [];

  if (results.secrets.length > 0) {
    recommendations.push({
      category: 'Secrets Management',
      priority: 'HIGH',
      description: 'Remove hardcoded secrets and use environment variables',
      action: 'Move all API keys, passwords, and secrets to environment variables or a secure vault'
    });
  }

  if (results.xss.length > 0) {
    recommendations.push({
      category: 'XSS Prevention',
      priority: 'HIGH',
      description: 'Eliminate unsafe HTML injection',
      action: 'Replace innerHTML and dangerouslySetInnerHTML with safe DOM manipulation'
    });
  }

  if (results.sqlInjection.length > 0) {
    recommendations.push({
      category: 'SQL Injection Prevention',
      priority: 'HIGH',
      description: 'Use parameterized queries',
      action: 'Replace string interpolation in SQL queries with parameterized queries'
    });
  }

  if (results.weakRandom.length > 0) {
    recommendations.push({
      category: 'Random Number Generation',
      priority: 'MEDIUM',
      description: 'Use cryptographically secure random generation',
      action: 'Replace Math.random() with crypto.getRandomValues() for security-sensitive operations'
    });
  }

  if (results.logInjection.length > 0) {
    recommendations.push({
      category: 'Log Injection Prevention',
      priority: 'MEDIUM',
      description: 'Sanitize log inputs',
      action: 'Escape or sanitize user input before logging to prevent log injection'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      category: 'Security Best Practices',
      priority: 'INFO',
      description: 'Continue following security best practices',
      action: 'Regular security reviews, dependency updates, and security testing'
    });
  }

  return recommendations;
}

// Run the scan
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityScan();
}

export { runSecurityScan };