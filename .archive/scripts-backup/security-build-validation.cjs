#!/usr/bin/env node

/**
 * Production Security Build Validation
 *
 * This script performs comprehensive security checks before allowing
 * production builds to proceed. It validates environment variables,
 * security configurations, and build outputs.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityBuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.securityIssues = [];
  }

  /**
   * Run all security validations
   */
  async validate() {
    console.log('🔒 Starting Security Build Validation...\n');

    this.validateEnvironment();
    this.validateConfigurationFiles();
    this.validateDependencies();
    this.validateBuildOutput();
    this.validateSecurityHeaders();
    this.validatePermissions();

    this.reportResults();

    if (this.errors.length > 0 || this.securityIssues.length > 0) {
      console.log('\n❌ Security validation failed. Build blocked.');
      process.exit(1);
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Security validation passed with warnings.');
    } else {
      console.log('\n✅ Security validation passed successfully.');
    }
  }

  /**
   * Validate environment variables
   */
  validateEnvironment() {
    console.log('🔍 Validating environment variables...');

    const envPath = path.join(process.cwd(), '.env');
    const prodEnvPath = path.join(process.cwd(), '.env.production');

    // Check for development environment files
    if (fs.existsSync(envPath)) {
      this.securityIssues.push('Development .env file exists - should not be deployed to production');
    }

    // Check if production environment file exists
    if (!fs.existsSync(prodEnvPath)) {
      this.errors.push('Production .env.production file not found');
      return;
    }

    // Read and validate production environment
    const prodEnv = fs.readFileSync(prodEnvPath, 'utf8');
    const prodLines = prodEnv.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    // Check for placeholder values
    const placeholderPatterns = [
      /template|example|your-|placeholder|xxxxx|\.\.\./i,
      /^pk_test_/,  // Test keys in production
      /^sk_test_/,  // Test secret keys
      /localhost/i,
      /127\.0\.0\.1/,
      /development|staging/i
    ];

    prodLines.forEach((line, index) => {
      const [key, value] = line.split('=');
      if (!key || !value) return;

      // Skip validation for non-sensitive fields
      const nonSensitiveFields = [
        'VITE_APP_NAME', 'VITE_DEFAULT_CURRENCY', 'VITE_DEFAULT_LOCALE',
        'DEFAULT_BOOKING_DURATION', 'MAX_BOOKING_WINDOW', 'MIN_CANCELLATION_HOURS'
      ];

      if (nonSensitiveFields.includes(key.trim())) {
        return;
      }

      // Check for placeholder values in sensitive fields
      if (placeholderPatterns.some(pattern => pattern.test(value))) {
        this.securityIssues.push(`Line ${index + 1}: ${key} contains placeholder or development value`);
      }

      // Check for empty values in required fields
      if (!value.trim() || value === '""' || value === "''") {
        this.errors.push(`Line ${index + 1}: ${key} is empty`);
      }

      // Check for hardcoded secrets in values that look like URLs
      if (value.includes('http') && value.includes('key') || value.includes('secret')) {
        this.warnings.push(`Line ${index + 1}: ${key} might contain hardcoded secrets in URL`);
      }
    });

    console.log(`   ✓ Environment validation complete`);
  }

  /**
   * Validate configuration files for security
   */
  validateConfigurationFiles() {
    console.log('🔍 Validating configuration files...');

    // Check package.json for security configurations
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Check for vulnerabilities in dependencies
      if (packageJson.dependencies) {
        Object.entries(packageJson.dependencies).forEach(([name, version]) => {
          // Check for known vulnerable packages
          const vulnerablePackages = [
            'lodash',
            'request',
            'axios', // Check for outdated versions
            'moment',
          ];

          if (vulnerablePackages.includes(name)) {
            this.warnings.push(`Dependency ${name} - ensure latest secure version is used`);
          }
        });
      }

      // Check for insecure scripts
      if (packageJson.scripts) {
        Object.entries(packageJson.scripts).forEach(([name, command]) => {
          if (command.includes('rm -rf') && !command.includes('node_modules')) {
            this.warnings.push(`Script '${name}' contains potentially dangerous command`);
          }
        });
      }
    }

    // Check Vite configuration for security
    const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
    if (fs.existsSync(viteConfigPath)) {
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

      if (viteConfig.includes('sourcemap: true') && !viteConfig.includes("mode === 'development'")) {
        this.securityIssues.push('Source maps enabled in production - this exposes source code');
      }

      if (viteConfig.includes("host: '::'") || viteConfig.includes("host: '0.0.0.0'")) {
        this.warnings.push('Vite server configured to accept all hosts - ensure this is intended');
      }
    }

    console.log(`   ✓ Configuration validation complete`);
  }

  /**
   * Validate dependencies for known vulnerabilities
   */
  validateDependencies() {
    console.log('🔍 Validating dependencies...');

    const packageLockPath = path.join(process.cwd(), 'package-lock.json');
    if (!fs.existsSync(packageLockPath)) {
      this.warnings.push('package-lock.json not found - dependency audit not possible');
      return;
    }

    // Check for package-lock.json integrity
    try {
      const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));

      if (!packageLock.lockfileVersion) {
        this.warnings.push('package-lock.json appears to be outdated');
      }

      // Check for suspicious dependency patterns
      if (packageLock.packages) {
        Object.values(packageLock.packages).forEach(pkg => {
          if (pkg.resolved && pkg.resolved.includes('git+http://')) {
            this.securityIssues.push(`Insecure protocol detected for dependency: ${pkg.name}`);
          }
        });
      }
    } catch (error) {
      this.warnings.push('Could not parse package-lock.json');
    }

    console.log(`   ✓ Dependency validation complete`);
  }

  /**
   * Validate build output for security
   */
  validateBuildOutput() {
    console.log('🔍 Validating build output...');

    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      this.errors.push('Build output directory (dist) not found');
      return;
    }

    // Check for sensitive files in build output
    const sensitivePatterns = [
      /\.env$/i,
      /\.key$/i,
      /\.pem$/i,
      /\.p12$/i,
      /\.pfx$/i,
      /secret/i,
      /private/i,
      /\.git\//,
      /node_modules/
    ];

    const checkDirectory = (dir, depth = 0) => {
      if (depth > 3) return; // Limit recursion depth

      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          checkDirectory(itemPath, depth + 1);
        } else {
          // Check for sensitive files
          if (sensitivePatterns.some(pattern => pattern.test(itemPath))) {
            this.securityIssues.push(`Sensitive file found in build output: ${itemPath}`);
          }

          // Check for large files that might contain sensitive data
          if (stat.size > 1024 * 1024) { // 1MB
            this.warnings.push(`Large file in build output: ${itemPath} (${Math.round(stat.size / 1024)}KB)`);
          }

          // Check JavaScript files for secrets
          if (item.endsWith('.js')) {
            const content = fs.readFileSync(itemPath, 'utf8');
            const secretPatterns = [
              /sk_[a-zA-Z0-9]{24,}/, // Stripe secret keys
              /pk_[a-zA-Z0-9]{24,}/, // Stripe publishable keys
              /[a-zA-Z0-9]{32,}=/, // Base64 encoded secrets
              /["']?[a-zA-Z0-9_-]{40,}["']?/, // Long strings that might be API keys
            ];

            secretPatterns.forEach(pattern => {
              if (pattern.test(content)) {
                this.securityIssues.push(`Potential secret found in ${itemPath}`);
              }
            });
          }
        }
      });
    };

    checkDirectory(distPath);

    // Check for service worker security
    const swPath = path.join(distPath, 'sw.js');
    if (fs.existsSync(swPath)) {
      const swContent = fs.readFileSync(swPath, 'utf8');

      if (swContent.includes('cache.addAll') && swContent.includes('*')) {
        this.warnings.push('Service worker caches all resources - review cache strategy');
      }

      if (swContent.includes('fetch(') && !swContent.includes('https://')) {
        this.securityIssues.push('Service worker may fetch insecure resources');
      }
    }

    console.log(`   ✓ Build output validation complete`);
  }

  /**
   * Validate security headers configuration
   */
  validateSecurityHeaders() {
    console.log('🔍 Validating security headers...');

    const envPath = path.join(process.cwd(), '.env.production');
    if (!fs.existsSync(envPath)) return;

    const envContent = fs.readFileSync(envPath, 'utf8');

    // Check for security header configurations
    const securityHeaders = [
      'VITE_SECURITY_HEADERS_ENABLED=true',
      'VITE_CSP_NONCE_GENERATION=true',
    ];

    securityHeaders.forEach(header => {
      if (!envContent.includes(header)) {
        this.warnings.push(`Security header configuration missing: ${header}`);
      }
    });

    // Check for development features in production
    const devFeatures = [
      'VITE_HMR=true',
      'VITE_SOURCE_MAP=true',
    ];

    devFeatures.forEach(feature => {
      if (envContent.includes(feature)) {
        this.securityIssues.push(`Development feature enabled in production: ${feature}`);
      }
    });

    console.log(`   ✓ Security headers validation complete`);
  }

  /**
   * Validate file permissions
   */
  validatePermissions() {
    console.log('🔍 Validating file permissions...');

    const envPath = path.join(process.cwd(), '.env.production');
    if (fs.existsSync(envPath)) {
      try {
        const stats = fs.statSync(envPath);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);

        // Check if file is world-readable or group-readable
        if (mode.includes('4') && (mode.length > 3 || mode[2] !== '0')) {
          this.securityIssues.push(`Insecure file permissions on .env.production: ${mode} (should be 600)`);
        }
      } catch (error) {
        this.warnings.push('Could not check file permissions');
      }
    }

    // Check for executable permissions on non-executable files
    const sensitiveFiles = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      '.env.example',
    ];

    sensitiveFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          if (stats.mode & parseInt('111', 8)) {
            this.warnings.push(`File has executable permissions: ${file}`);
          }
        } catch (error) {
          // Ignore permission errors
        }
      }
    });

    console.log(`   ✓ File permissions validation complete`);
  }

  /**
   * Report validation results
   */
  reportResults() {
    console.log('\n' + '='.repeat(60));
    console.log('SECURITY VALIDATION REPORT');
    console.log('='.repeat(60));

    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORS (Build Blocked):');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (this.securityIssues.length > 0) {
      console.log('\n🔒 SECURITY ISSUES (Build Blocked):');
      this.securityIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (Proceed with Caution):');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new SecurityBuildValidator();
  validator.validate().catch(error => {
    console.error('Security validation failed with error:', error);
    process.exit(1);
  });
}

module.exports = SecurityBuildValidator;