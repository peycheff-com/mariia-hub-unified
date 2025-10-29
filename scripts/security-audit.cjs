#!/usr/bin/env node

/**
 * Security Audit Script
 *
 * Comprehensive security audit for the Mariia Hub application
 * - Scans codebase for security vulnerabilities
 * - Validates configurations
 * - Checks for common security issues
 * - Generates detailed security report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.info = [];
    this.scanResults = {
      files: 0,
      lines: 0,
      issues: 0,
      warnings: 0,
      info: 0
    };
  }

  /**
   * Run comprehensive security audit
   */
  async runAudit() {
    console.log('🔒 Starting Security Audit...\n');

    // 1. File system security checks
    await this.auditFileSecurity();

    // 2. Code security analysis
    await this.auditCodeSecurity();

    // 3. Configuration security
    await this.auditConfigSecurity();

    // 4. Dependency security
    await this.auditDependencies();

    // 5. Database security
    await this.auditDatabaseSecurity();

    // 6. Generate report
    this.generateReport();
  }

  /**
   * Audit file system security
   */
  async auditFileSecurity() {
    console.log('📁 Auditing file system security...');

    // Check for sensitive files
    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'config.json',
      'secrets.json',
      'private.key',
      'id_rsa',
      '*.pem',
      '*.p12'
    ];

    for (const pattern of sensitiveFiles) {
      try {
        const files = execSync(`find . -name "${pattern}" -not -path "./node_modules/*" -not -path "./.git/*"`, { encoding: 'utf8' });
        if (files.trim()) {
          this.warnings.push({
            type: 'SENSITIVE_FILE',
            message: `Sensitive files found: ${files.trim()}`,
            severity: 'HIGH',
            recommendation: 'Ensure sensitive files are properly secured and not committed to version control'
          });
        }
      } catch (error) {
        // No files found, which is good
      }
    }

    // Check file permissions
    try {
      const keyFiles = execSync('find . -name "*.key" -o -name "*.pem" -not -path "./node_modules/*"', { encoding: 'utf8' });
      if (keyFiles.trim()) {
        const files = keyFiles.trim().split('\n');
        for (const file of files) {
          try {
            const stats = fs.statSync(file);
            const mode = (stats.mode & parseInt('777', 8)).toString(8);
            if (mode !== '600' && mode !== '400') {
              this.issues.push({
                type: 'FILE_PERMISSIONS',
                message: `Insecure permissions on ${file}: ${mode}`,
                severity: 'HIGH',
                recommendation: 'Set file permissions to 600 or 400 for sensitive files'
              });
            }
          } catch (error) {
            // File might not exist
          }
        }
      }
    } catch (error) {
      // No key files found
    }

    // Check for .gitignore security
    if (fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      const requiredEntries = ['.env', 'node_modules', '.DS_Store', '*.log'];

      for (const entry of requiredEntries) {
        if (!gitignore.includes(entry)) {
          this.warnings.push({
            type: 'GITIGNORE',
            message: `Missing ${entry} in .gitignore`,
            severity: 'MEDIUM',
            recommendation: 'Add sensitive file patterns to .gitignore'
          });
        }
      }
    } else {
      this.issues.push({
        type: 'GITIGNORE',
        message: '.gitignore file not found',
        severity: 'HIGH',
        recommendation: 'Create .gitignore file to prevent sensitive files from being committed'
      });
    }
  }

  /**
   * Audit code security
   */
  async auditCodeSecurity() {
    console.log('💻 Auditing code security...');

    const sourceDirs = ['src', 'scripts', 'supabase/functions'];
    const securityPatterns = [
      {
        pattern: /process\.env\.[A-Z_]+/,
        type: 'ENV_VAR',
        message: 'Environment variable usage',
        severity: 'INFO',
        recommendation: 'Ensure environment variables are properly secured'
      },
      {
        pattern: /password\s*[:=]\s*['"`][^'"`]+['"`]/i,
        type: 'HARDCODED_PASSWORD',
        message: 'Hardcoded password detected',
        severity: 'HIGH',
        recommendation: 'Remove hardcoded passwords and use environment variables'
      },
      {
        pattern: /api[_-]?key\s*[:=]\s*['"`][^'"`]+['"`]/i,
        type: 'HARDCODED_API_KEY',
        message: 'Hardcoded API key detected',
        severity: 'HIGH',
        recommendation: 'Remove hardcoded API keys and use secure credential management'
      },
      {
        pattern: /eval\s*\(/,
        type: 'DANGEROUS_EVAL',
        message: 'Use of eval() detected',
        severity: 'HIGH',
        recommendation: 'Avoid using eval() as it can execute arbitrary code'
      },
      {
        pattern: /innerHTML\s*=/,
        type: 'XSS_RISK',
        message: 'innerHTML assignment detected (XSS risk)',
        severity: 'MEDIUM',
        recommendation: 'Use textContent or sanitize HTML before assignment'
      },
      {
        pattern: /document\.write\s*\(/,
        type: 'XSS_RISK',
        message: 'document.write() detected (XSS risk)',
        severity: 'HIGH',
        recommendation: 'Avoid document.write() as it can introduce XSS vulnerabilities'
      },
      {
        pattern: /sql\s*[:=]\s*['"`][^'"`]*\s*\+/i,
        type: 'SQL_INJECTION',
        message: 'Potential SQL injection vulnerability',
        severity: 'HIGH',
        recommendation: 'Use parameterized queries or prepared statements'
      },
      {
        pattern: /console\.(log|error|warn)/,
        type: 'CONSOLE_LOG',
        message: 'Console logging detected',
        severity: 'INFO',
        recommendation: 'Remove console logs from production code'
      },
      {
        pattern: /debugger\s*;/,
        type: 'DEBUGGER_STATEMENT',
        message: 'Debugger statement detected',
        severity: 'MEDIUM',
        recommendation: 'Remove debugger statements from production code'
      },
      {
        pattern: /TODO|FIXME|XXX/,
        type: 'CODE_COMMENT',
        message: 'Development comment detected',
        severity: 'INFO',
        recommendation: 'Address TODO/FIXME comments before production'
      }
    ];

    for (const dir of sourceDirs) {
      if (!fs.existsSync(dir)) continue;

      this.scanDirectory(dir, securityPatterns);
    }
  }

  /**
   * Scan directory for security patterns
   */
  scanDirectory(dir, patterns) {
    const files = this.getAllFiles(dir);

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        this.scanResults.files++;
        this.scanResults.lines += lines.length;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;

          for (const pattern of patterns) {
            if (pattern.pattern.test(line)) {
              const finding = {
                type: pattern.type,
                file: path.relative('.', file),
                line: lineNumber,
                message: pattern.message,
                severity: pattern.severity,
                recommendation: pattern.recommendation,
                content: line.trim()
              };

              this.addFinding(finding);
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }

  /**
   * Get all files in directory recursively
   */
  getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        this.getAllFiles(filePath, fileList);
      } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.jsx'))) {
        fileList.push(filePath);
      }
    }

    return fileList;
  }

  /**
   * Audit configuration security
   */
  async auditConfigSecurity() {
    console.log('⚙️ Auditing configuration security...');

    // Check package.json
    if (fs.existsSync('package.json')) {
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

        // Check for insecure dependencies
        if (packageJson.dependencies) {
          const insecureDeps = [
            'lodash',
            'request',
            'uglify-js',
            'handlebars',
            'moment'
          ];

          for (const dep of insecureDeps) {
            if (packageJson.dependencies[dep]) {
              this.warnings.push({
                type: 'INSECURE_DEPENDENCY',
                message: `Potentially insecure dependency: ${dep}`,
                severity: 'MEDIUM',
                recommendation: 'Review and update to latest secure version'
              });
            }
          }
        }

        // Check for scripts that might be insecure
        if (packageJson.scripts) {
          const suspiciousScripts = Object.entries(packageJson.scripts)
            .filter(([script, command]) =>
              command.includes('rm -rf') ||
              command.includes('sudo') ||
              command.includes('chmod 777')
            );

          for (const [script, command] of suspiciousScripts) {
            this.warnings.push({
              type: 'SUSPICIOUS_SCRIPT',
              message: `Potentially dangerous script: ${script}`,
              severity: 'MEDIUM',
              recommendation: 'Review script security implications'
            });
          }
        }
      } catch (error) {
        this.warnings.push({
          type: 'PACKAGE_JSON',
          message: 'Could not parse package.json',
          severity: 'LOW',
          recommendation: 'Ensure package.json is valid JSON'
        });
      }
    }

    // Check for security headers configuration
    const configFiles = ['vite.config.ts', 'next.config.js', 'server.js', 'app.js'];

    for (const configFile of configFiles) {
      if (fs.existsSync(configFile)) {
        try {
          const content = fs.readFileSync(configFile, 'utf8');

          if (!content.includes('helmet') && !content.includes('Content-Security-Policy')) {
            this.warnings.push({
              type: 'SECURITY_HEADERS',
              message: `Security headers not configured in ${configFile}`,
              severity: 'MEDIUM',
              recommendation: 'Implement security headers including CSP, HSTS, etc.'
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }

  /**
   * Audit dependencies for security vulnerabilities
   */
  async auditDependencies() {
    console.log('📦 Auditing dependencies...');

    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditResult);

      if (auditData.vulnerabilities) {
        const vulnerabilities = Object.values(auditData.vulnerabilities);

        for (const vuln of vulnerabilities) {
          const severity = vuln.severity || 'unknown';
          const severityLevel = severity === 'high' || severity === 'critical' ? 'HIGH' :
                              severity === 'moderate' ? 'MEDIUM' : 'LOW';

          this.addFinding({
            type: 'DEPENDENCY_VULNERABILITY',
            message: `Vulnerability in ${vuln.name}: ${vuln.title}`,
            severity: severityLevel,
            recommendation: `Update ${vuln.name} to version ${vuln.fixAvailable?.version || 'latest'}`,
            package: vuln.name,
            severity_level: vuln.severity
          });
        }
      }
    } catch (error) {
      this.warnings.push({
        type: 'DEPENDENCY_AUDIT',
        message: 'Could not run npm audit',
        severity: 'LOW',
        recommendation: 'Ensure npm audit is available and package.json is valid'
      });
    }

    // Check for outdated dependencies
    try {
      const outdatedResult = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdatedData = JSON.parse(outdatedResult);

      for (const [pkg, info] of Object.entries(outdatedData)) {
        this.info.push({
          type: 'OUTDATED_DEPENDENCY',
          message: `Outdated dependency: ${pkg}`,
          severity: 'INFO',
          recommendation: `Update ${pkg} from ${info.current} to ${info.latest}`,
          current: info.current,
          latest: info.latest
        });
      }
    } catch (error) {
      // No outdated dependencies or command failed
    }
  }

  /**
   * Audit database security
   */
  async auditDatabaseSecurity() {
    console.log('🗄️ Auditing database security...');

    const migrationsDir = 'supabase/migrations';
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'));

      for (const file of migrationFiles) {
        try {
          const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

          // Check for security issues in SQL
          const sqlSecurityPatterns = [
            {
              pattern: /DROP\s+TABLE\s+IF\s+EXISTS\s+public\./i,
              type: 'RISKY_SQL',
              message: 'Dropping public tables detected',
              severity: 'HIGH',
              recommendation: 'Ensure table drops are intentional and authorized'
            },
            {
              pattern: /GRANT\s+ALL\s+PRIVILEGES/i,
              type: 'PERMISSIVE_GRANT',
              message: 'Granting all privileges detected',
              severity: 'MEDIUM',
              recommendation: 'Use principle of least privilege for database permissions'
            },
            {
              pattern: /DISABLE\s+ROW\s+LEVEL\s+SECURITY/i,
              type: 'RLS_DISABLED',
              message: 'Row Level Security disabled',
              severity: 'HIGH',
              recommendation: 'Keep RLS enabled for security'
            },
            {
              pattern: /password\s*=\s*'[^']/i,
              type: 'SQL_PASSWORD',
              message: 'Password in SQL file',
              severity: 'HIGH',
              recommendation: 'Remove hardcoded passwords from SQL files'
            }
          ];

          for (const pattern of sqlSecurityPatterns) {
            if (pattern.pattern.test(content)) {
              this.addFinding({
                type: pattern.type,
                file: path.join('supabase/migrations', file),
                message: pattern.message,
                severity: pattern.severity,
                recommendation: pattern.recommendation
              });
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }

  /**
   * Add finding to appropriate list
   */
  addFinding(finding) {
    switch (finding.severity) {
      case 'HIGH':
        this.issues.push(finding);
        break;
      case 'MEDIUM':
        this.warnings.push(finding);
        break;
      case 'LOW':
      case 'INFO':
        this.info.push(finding);
        break;
    }

    this.scanResults.issues += finding.severity === 'HIGH' ? 1 : 0;
    this.scanResults.warnings += finding.severity === 'MEDIUM' ? 1 : 0;
    this.scanResults.info += ['LOW', 'INFO'].includes(finding.severity) ? 1 : 0;
  }

  /**
   * Generate comprehensive security report
   */
  generateReport() {
    console.log('\n🔍 SECURITY AUDIT REPORT\n');
    console.log('=' .repeat(50));

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('-'.repeat(20));
    console.log(`Files scanned: ${this.scanResults.files}`);
    console.log(`Lines of code: ${this.scanResults.lines}`);
    console.log(`Critical issues: ${this.issues.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    console.log(`Info items: ${this.info.length}`);

    const securityScore = Math.max(0, 100 - (this.issues.length * 10) - (this.warnings.length * 3));
    console.log(`\nSecurity Score: ${securityScore}/100`);

    // Critical Issues
    if (this.issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES');
      console.log('-'.repeat(20));

      this.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.type}`);
        console.log(`   File: ${issue.file || 'N/A'}`);
        if (issue.line) console.log(`   Line: ${issue.line}`);
        console.log(`   Message: ${issue.message}`);
        console.log(`   Recommendation: ${issue.recommendation}`);
        if (issue.content) console.log(`   Content: ${issue.content}`);
      });
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS');
      console.log('-'.repeat(20));

      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.type}`);
        console.log(`   File: ${warning.file || 'N/A'}`);
        if (warning.line) console.log(`   Line: ${warning.line}`);
        console.log(`   Message: ${warning.message}`);
        console.log(`   Recommendation: ${warning.recommendation}`);
      });
    }

    // Info
    if (this.info.length > 0) {
      console.log('\nℹ️ INFORMATION');
      console.log('-'.repeat(20));

      this.info.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.type}`);
        console.log(`   Message: ${item.message}`);
        if (item.recommendation) console.log(`   Recommendation: ${item.recommendation}`);
      });
    }

    // Recommendations
    console.log('\n🎯 SECURITY RECOMMENDATIONS');
    console.log('-'.repeat(30));

    if (this.issues.length > 0) {
      console.log('\n1. IMMEDIATE ACTION REQUIRED:');
      console.log('   - Address all critical issues before production deployment');
      console.log('   - Review hardcoded credentials and implement secure credential management');
      console.log('   - Fix any XSS or SQL injection vulnerabilities');
    }

    if (this.warnings.length > 0) {
      console.log('\n2. IMPROVEMENTS NEEDED:');
      console.log('   - Implement security headers (CSP, HSTS, etc.)');
      console.log('   - Add proper input validation and sanitization');
      console.log('   - Review and update dependencies');
    }

    console.log('\n3. BEST PRACTICES:');
    console.log('   - Regular security audits (monthly)');
    console.log('   - Implement automated security testing');
    console.log('   - Use dependency scanning tools');
    console.log('   - Keep all dependencies updated');
    console.log('   - Implement proper logging and monitoring');

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      scanResults: this.scanResults,
      securityScore,
      issues: this.issues,
      warnings: this.warnings,
      info: this.info
    };

    try {
      fs.writeFileSync('security-audit-report.json', JSON.stringify(reportData, null, 2));
      console.log('\n📄 Detailed report saved to: security-audit-report.json');
    } catch (error) {
      console.log('\n❌ Could not save detailed report');
    }

    // Exit with appropriate code
    if (this.issues.length > 0) {
      console.log('\n❌ Security audit failed with critical issues');
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log('\n⚠️ Security audit completed with warnings');
      process.exit(2);
    } else {
      console.log('\n✅ Security audit passed');
      process.exit(0);
    }
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit().catch(error => {
    console.error('Security audit failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityAuditor;