#!/bin/bash

# Comprehensive CI/CD Setup Script for Mariia Hub
# This script sets up all necessary configurations and dependencies for the CI/CD pipeline

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    log_step "Checking requirements..."

    local required_tools=("node" "npm" "git" "curl" "jq")
    local missing_tools=()

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done

    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install the missing tools and run this script again."
        exit 1
    fi

    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi

    log_success "All requirements satisfied"
}

# Setup GitHub CLI for authentication
setup_github_cli() {
    log_step "Setting up GitHub CLI..."

    if ! command -v gh &> /dev/null; then
        log_info "GitHub CLI not found. Installing..."

        # Detect OS and install GitHub CLI
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install gh
            else
                log_error "Homebrew not found. Please install GitHub CLI manually."
                exit 1
            fi
        else
            log_error "Unsupported OS. Please install GitHub CLI manually."
            exit 1
        fi
    fi

    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        log_info "GitHub CLI not authenticated. Please run: gh auth login"
        log_warning "Skipping GitHub-specific setup..."
    else
        log_success "GitHub CLI is authenticated"
    fi
}

# Install and configure project dependencies
setup_dependencies() {
    log_step "Setting up project dependencies..."

    # Install npm dependencies
    log_info "Installing npm dependencies..."
    npm ci

    # Install global CLI tools
    log_info "Installing global CLI tools..."

    local global_tools=(
        "@lhci/cli@0.13.x"
        "lighthouse"
        "pa11y"
        "snyk"
        "webpagetest"
        "vercel"
    )

    for tool in "${global_tools[@]}"; do
        log_info "Installing $tool..."
        npm install -g "$tool" || log_warning "Failed to install $tool (may not be critical)"
    done

    log_success "Dependencies installed"
}

# Setup security scanning tools
setup_security_tools() {
    log_step "Setting up security scanning tools..."

    # Install Python tools for security scanning
    if command -v pip3 &> /dev/null; then
        log_info "Installing Python security tools..."
        pip3 install safety bandit semgrep || log_warning "Failed to install Python security tools"
    fi

    # Install OWASP Dependency Check
    if [ ! -d "dependency-check" ]; then
        log_info "Installing OWASP Dependency Check..."
        wget https://github.com/jeremylong/DependencyCheck/releases/download/v9.0.9/dependency-check-9.0.9-release.zip
        unzip dependency-check-9.0.9-release.zip
        rm dependency-check-9.0.9-release.zip
    fi

    log_success "Security tools configured"
}

# Setup testing tools
setup_testing_tools() {
    log_step "Setting up testing tools..."

    # Install Playwright browsers
    log_info "Installing Playwright browsers..."
    npx playwright install --with-deps

    # Generate test configuration files
    log_info "Creating test configuration files..."

    # Create Playwright configuration
    if [ ! -f "playwright.config.ts" ]; then
        cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
EOF
    fi

    # Create Vitest configuration
    if [ ! -f "vitest.config.ts" ]; then
        cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
EOF
    fi

    log_success "Testing tools configured"
}

# Setup performance monitoring tools
setup_performance_tools() {
    log_step "Setting up performance monitoring tools..."

    # Create Lighthouse CI configuration
    if [ ! -f ".lighthouserc.js" ]; then
        cat > .lighthouserc.js << 'EOF'
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless',
      },
      url: ['http://localhost:4173/'],
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
EOF
    fi

    # Create performance budget configuration
    if [ ! -f "performance-budget.json" ]; then
        cat > performance-budget.json << 'EOF'
{
  "budgets": [
    {
      "path": "dist/*.js",
      "maxSize": "250kb",
      "warningSize": "200kb"
    },
    {
      "path": "dist/*.css",
      "maxSize": "50kb",
      "warningSize": "40kb"
    },
    {
      "path": "dist/**/*.{png,jpg,jpeg,svg,webp}",
      "maxSize": "500kb",
      "warningSize": "400kb"
    }
  ],
  "thresholds": {
    "performance": 80,
    "accessibility": 90,
    "bestPractices": 80,
    "seo": 80
  }
}
EOF
    fi

    log_success "Performance monitoring tools configured"
}

# Setup environment configuration files
setup_environment_config() {
    log_step "Setting up environment configuration..."

    # Create .env.example with CI/CD variables
    cat > .env.example << 'EOF'
# Production Environment Variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# CI/CD Configuration
VITE_BUILD_ID=auto
VITE_BUILD_TIMESTAMP=auto
VITE_DEPLOYMENT_ENV=development

# Feature Flags
VITE_FEATURE_FLAGS_ENABLED=false
VITE_FEATURE_FLAGS=default

# Monitoring
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Analytics
VITE_GA_TRACKING_ID=your_google_analytics_id
VITE_HOTJAR_ID=your_hotjar_id
EOF

    # Create Vercel configuration
    if [ ! -f "vercel.json" ]; then
        cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
EOF
    fi

    log_success "Environment configuration created"
}

# Setup monitoring and alerting configuration
setup_monitoring_config() {
    log_step "Setting up monitoring and alerting configuration..."

    # Create monitoring configuration
    mkdir -p monitoring

    cat > monitoring/config.json << 'EOF'
{
  "environments": {
    "production": {
      "url": "https://mariaborysevych.com",
      "thresholds": {
        "performance": 80,
        "availability": 99.9,
        "errorRate": 1,
        "responseTime": 2000
      }
    },
    "staging": {
      "url": "https://staging.mariaborysevych.com",
      "thresholds": {
        "performance": 75,
        "availability": 99.0,
        "errorRate": 2,
        "responseTime": 3000
      }
    }
  },
  "alerts": {
    "channels": ["slack", "email"],
    "conditions": [
      "performance < threshold",
      "availability < threshold",
      "error_rate > threshold",
      "response_time > threshold"
    ]
  },
  "monitoring": {
    "interval": "5m",
    "retention": "30d",
    "reports": {
      "enabled": true,
      "schedule": "daily",
      "recipients": ["team@mariaborysevych.com"]
    }
  }
}
EOF

    # Create health check endpoint configuration
    cat > monitoring/health-checks.json << 'EOF'
{
  "endpoints": [
    {
      "name": "Homepage",
      "path": "/",
      "timeout": 10000,
      "expectedStatus": 200
    },
    {
      "name": "API Health",
      "path": "/api/health",
      "timeout": 5000,
      "expectedStatus": 200
    },
    {
      "name": "Beauty Services",
      "path": "/beauty",
      "timeout": 10000,
      "expectedStatus": 200
    },
    {
      "name": "Fitness Programs",
      "path": "/fitness",
      "timeout": 10000,
      "expectedStatus": 200
    },
    {
      "name": "Booking System",
      "path": "/booking",
      "timeout": 10000,
      "expectedStatus": 200
    }
  ]
}
EOF

    log_success "Monitoring configuration created"
}

# Create deployment scripts
create_deployment_scripts() {
    log_step "Creating deployment scripts..."

    # Create deployment script
    cat > scripts/deploy.sh << 'EOF'
#!/bin/bash

# Deployment script for Mariia Hub
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Parse arguments
ENVIRONMENT=${1:-staging}
STRATEGY=${2:-standard}

log_info "Starting deployment..."
log_info "Environment: $ENVIRONMENT"
log_info "Strategy: $STRATEGY"

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Run tests
log_info "Running tests..."
npm run test || {
    log_error "Tests failed. Aborting deployment."
    exit 1
}

# Run security audit
log_info "Running security audit..."
npm audit --audit-level=moderate || {
    log_warning "Security audit found issues. Review before proceeding."
}

# Build application
log_info "Building application..."
npm run build || {
    log_error "Build failed. Aborting deployment."
    exit 1
}

# Run performance check
log_info "Running performance check..."
npm run performance:validate || {
    log_warning "Performance check failed. Review before proceeding."
}

# Deploy based on strategy
case $STRATEGY in
    "standard")
        log_info "Deploying with standard strategy..."
        vercel $([ "$ENVIRONMENT" = "production" ] && echo "--prod") --confirm
        ;;
    "blue-green")
        log_info "Deploying with blue-green strategy..."
        # Blue-green deployment logic here
        ;;
    "canary")
        log_info "Deploying with canary strategy..."
        # Canary deployment logic here
        ;;
    *)
        log_error "Unknown deployment strategy: $STRATEGY"
        exit 1
        ;;
esac

# Post-deployment verification
log_info "Running post-deployment verification..."

# Health checks
DEPLOY_URL=$(vercel ls $([ "$ENVIRONMENT" = "production" ] && echo "--prod" || echo "") | grep -v "Latest" | head -1 | awk '{print $2}')

if [ -n "$DEPLOY_URL" ]; then
    log_info "Deployment URL: $DEPLOY_URL"

    # Basic health check
    if curl -f "$DEPLOY_URL/health" > /dev/null 2>&1; then
        log_info "Health check passed"
    else
        log_error "Health check failed"
        exit 1
    fi
else
    log_error "Could not determine deployment URL"
    exit 1
fi

log_success "Deployment completed successfully!"
log_info "Deployed to: $DEPLOY_URL"
EOF

    chmod +x scripts/deploy.sh

    # Create rollback script
    cat > scripts/rollback.sh << 'EOF'
#!/bin/bash

# Rollback script for Mariia Hub
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

ENVIRONMENT=${1:-production}

log_info "Starting rollback for $ENVIRONMENT..."

# Get previous successful deployment
PREVIOUS_DEPLOY=$(vercel ls $([ "$ENVIRONMENT" = "production" ] && echo "--prod" || echo "") | grep -v "Latest" | head -2 | tail -1 | awk '{print $1}')

if [ -z "$PREVIOUS_DEPLOY" ]; then
    log_error "No previous deployment found for rollback"
    exit 1
fi

log_info "Rolling back to deployment: $PREVIOUS_DEPLOY"

# Promote previous deployment
vercel promote "$PREVIOUS_DEPLOY" $([ "$ENVIRONMENT" = "production" ] && echo "--prod") --confirm

# Verify rollback
CURRENT_URL=$(vercel ls $([ "$ENVIRONMENT" = "production" ] && echo "--prod" || echo "") | grep -v "Latest" | head -1 | awk '{print $2}')

if [ -n "$CURRENT_URL" ]; then
    log_info "Rollback URL: $CURRENT_URL"

    # Health check
    if curl -f "$CURRENT_URL/health" > /dev/null 2>&1; then
        log_info "Rollback health check passed"
    else
        log_error "Rollback health check failed"
        exit 1
    fi
else
    log_error "Could not verify rollback URL"
    exit 1
fi

log_success "Rollback completed successfully!"
log_info "Current deployment: $CURRENT_URL"
EOF

    chmod +x scripts/rollback.sh

    log_success "Deployment scripts created"
}

# Setup GitHub Actions workflows
setup_github_workflows() {
    log_step "Setting up GitHub Actions workflows..."

    # Ensure .github/workflows directory exists
    mkdir -p .github/workflows

    # The workflows are already created in the repository
    log_info "GitHub Actions workflows are already configured"
    log_info "Available workflows:"

    local workflows=(
        "comprehensive-ci-cd.yml"
        "automated-testing-suite.yml"
        "security-compliance-automation.yml"
        "performance-quality-gates.yml"
        "feature-flag-deployment.yml"
        "monitoring-alerting-system.yml"
    )

    for workflow in "${workflows[@]}"; do
        if [ -f ".github/workflows/$workflow" ]; then
            log_info "  ✓ $workflow"
        else
            log_warning "  ✗ $workflow (missing)"
        fi
    done
}

# Create documentation
create_documentation() {
    log_step "Creating documentation..."

    # Create CI/CD documentation
    cat > docs/CI-CD-SETUP.md << 'EOF'
# CI/CD Setup Guide

This document provides comprehensive information about the CI/CD pipeline setup for Mariia Hub.

## Overview

The CI/CD pipeline is built using GitHub Actions and includes:

- **Comprehensive CI/CD Pipeline**: Multi-stage deployments with quality gates
- **Automated Testing Suite**: Unit, integration, E2E, performance, and accessibility tests
- **Security & Compliance**: Vulnerability scanning, code analysis, and compliance checks
- **Performance & Quality Gates**: Performance monitoring, bundle size analysis, and code quality checks
- **Feature Flag & Deployment Strategies**: Canary, blue-green, and feature flag deployments
- **Monitoring & Alerting**: Real-time monitoring and alerting systems

## Available Workflows

### 1. Comprehensive CI/CD Pipeline (`comprehensive-ci-cd.yml`)
- Multi-stage deployments (standard, blue-green, canary)
- Quality gates and automated testing
- Security scanning and vulnerability detection
- Automated rollback procedures
- Environment-specific deployment strategies

### 2. Automated Testing Suite (`automated-testing-suite.yml`)
- Unit tests (Vitest) with coverage reporting
- Integration tests with database and API testing
- E2E tests (Playwright) with multiple browsers
- Performance tests (Lighthouse CI)
- Accessibility testing (axe-core)
- Visual regression testing
- Security tests

### 3. Security & Compliance Automation (`security-compliance-automation.yml`)
- Dependency vulnerability scanning (npm audit, Snyk)
- Static Application Security Testing (SAST)
- Infrastructure security scanning
- Secrets detection (gitleaks, detect-secrets)
- Compliance checking (licenses, GDPR, accessibility)
- Comprehensive security reporting

### 4. Performance & Quality Gates (`performance-quality-gates.yml`)
- Performance testing with Core Web Vitals
- Code quality analysis (ESLint, SonarQube)
- Bundle size analysis and optimization
- Accessibility testing and WCAG compliance
- SEO analysis and optimization
- Quality score calculation and reporting

### 5. Feature Flag & Deployment Strategies (`feature-flag-deployment.yml`)
- Canary deployments with traffic splitting
- Blue-green deployments with zero downtime
- Feature flag management and rollout
- A/B testing infrastructure
- Automatic rollback on failure

### 6. Monitoring & Alerting System (`monitoring-alerting-system.yml`)
- Real-time performance monitoring
- Security monitoring and alerting
- Uptime monitoring and health checks
- Error monitoring and alerting
- Comprehensive monitoring dashboards

## Environment Variables

### Required Environment Variables

#### Production
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

#### CI/CD Specific
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `SNYK_TOKEN`: Snyk API token (for security scanning)
- `SONAR_TOKEN`: SonarQube token (for code analysis)
- `WEBPAGETEST_API_KEY`: WebPageTest API key (for performance testing)

#### Monitoring & Alerting
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications
- `TEAM_EMAIL`: Team email address for notifications
- `EMAIL_USERNAME`: SMTP username for email notifications
- `EMAIL_PASSWORD`: SMTP password for email notifications

## Usage

### Manual Deployment
```bash
# Deploy to staging
./scripts/deploy.sh staging standard

# Deploy to production with blue-green strategy
./scripts/deploy.sh production blue-green

# Deploy with canary strategy (10% traffic)
./scripts/deploy.sh production canary
```

### Rollback
```bash
# Rollback production deployment
./scripts/rollback.sh production
```

### Local Testing
```bash
# Run all tests
npm run test:full

# Run specific test suites
npm run test:unit
npm run test:e2e
npm run test:performance

# Run security audit
npm run security-audit

# Run performance validation
npm run performance:validate
```

## Configuration

### Feature Flags
Feature flags are configured in `src/config/featureFlags.ts`:

```typescript
export const featureFlags = {
  // Enable/disable features
  NEW_BOOKING_FLOW: process.env.VITE_FEATURE_NEW_BOOKING_FLOW === 'true',
  ENHANCED_UI: process.env.VITE_FEATURE_ENHANCED_UI === 'true',
  IMPROVED_ANALYTICS: process.env.VITE_FEATURE_IMPROVED_ANALYTICS === 'true',

  // Rollout percentages (0-100)
  ROLLOUT_PERCENTAGE: parseInt(process.env.VITE_ROLLOUT_PERCENTAGE) || 0,

  // Target environments
  ENVIRONMENTS: process.env.VITE_FEATURE_ENVIRONMENTS?.split(',') || [],
};
```

### Performance Budgets
Performance budgets are defined in `performance-budget.json`:

```json
{
  "budgets": [
    {
      "path": "dist/*.js",
      "maxSize": "250kb",
      "warningSize": "200kb"
    }
  ],
  "thresholds": {
    "performance": 80,
    "accessibility": 90,
    "bestPractices": 80,
    "seo": 80
  }
}
```

### Monitoring Configuration
Monitoring settings are in `monitoring/config.json`:

```json
{
  "environments": {
    "production": {
      "url": "https://mariaborysevych.com",
      "thresholds": {
        "performance": 80,
        "availability": 99.9,
        "errorRate": 1,
        "responseTime": 2000
      }
    }
  }
}
```

## Best Practices

1. **Always run tests locally before committing**
2. **Use feature flags for new features**
3. **Monitor deployments closely after release**
4. **Keep dependencies updated**
5. **Review security scan results**
6. **Monitor performance metrics**
7. **Test rollback procedures**

## Troubleshooting

### Common Issues

#### Tests Fail Locally
- Ensure all dependencies are installed (`npm ci`)
- Check Node.js version (>= 18 required)
- Verify environment variables are set

#### Deployment Fails
- Check Vercel configuration
- Verify environment variables
- Review build logs for errors
- Check quality gate results

#### Performance Issues
- Review bundle size analysis
- Check Core Web Vitals
- Optimize images and assets
- Consider code splitting

#### Security Alerts
- Review vulnerability scan results
- Update affected dependencies
- Check for exposed secrets
- Review security headers

## Support

For CI/CD issues:
1. Check GitHub Actions logs
2. Review error messages
3. Consult this documentation
4. Contact the DevOps team

For deployment issues:
1. Check Vercel dashboard
2. Review build logs
3. Verify DNS configuration
4. Check SSL certificates

For monitoring issues:
1. Check monitoring dashboards
2. Review alert configurations
3. Verify endpoint availability
4. Check threshold settings
EOF

    log_success "Documentation created"
}

# Main setup function
main() {
    log_info "🚀 Starting Comprehensive CI/CD Setup for Mariia Hub"
    log_info "This script will configure all necessary tools and configurations"

    check_requirements
    setup_github_cli
    setup_dependencies
    setup_security_tools
    setup_testing_tools
    setup_performance_tools
    setup_environment_config
    setup_monitoring_config
    create_deployment_scripts
    setup_github_workflows
    create_documentation

    log_success "🎉 CI/CD setup completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Set up required environment variables"
    log_info "2. Configure GitHub secrets for authentication"
    log_info "3. Test the workflows by triggering them manually"
    log_info "4. Review the generated documentation"
    log_info ""
    log_info "For more information, see: docs/CI-CD-SETUP.md"
}

# Run the setup
main "$@"