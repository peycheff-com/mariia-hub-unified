# CI/CD Pipeline Guide for Mariia Hub

This guide covers the comprehensive CI/CD pipeline implementation for Mariia Hub, including workflows, deployment processes, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Environments](#environments)
3. [Workflows](#workflows)
4. [Deployment Process](#deployment-process)
5. [Testing Strategy](#testing-strategy)
6. [Security Measures](#security-measures)
7. [Monitoring and Alerting](#monitoring-and-alerting)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

## Overview

The CI/CD pipeline is built on GitHub Actions and provides:

- **Automated Testing**: Unit, integration, and E2E tests on every push
- **Security Scanning**: Comprehensive security analysis on every PR
- **Multi-Environment Deployments**: Staging, production, and preview environments
- **Blue-Green Deployments**: Zero-downtime production deployments
- **Automated Rollbacks**: Automatic rollback on failure
- **Performance Monitoring**: Lighthouse CI and performance thresholds
- **Notifications**: Slack, Discord, and email notifications

## Environments

### Development
- **Branch**: `feature/*`, `hotfix/*`
- **URL**: Local development
- **Database**: Local Supabase
- **Features**: Hot reload, debugging enabled

### Staging
- **Branch**: `develop`
- **URL**: https://staging.mariia-hub.com
- **Database**: Staging Supabase
- **Deployment**: Automatic on push to `develop`
- **Features**: Full testing suite, performance monitoring

### Production
- **Branch**: `main`
- **URL**: https://mariia-hub.com
- **Database**: Production Supabase
- **Deployment**: Manual approval required
- **Features**: Blue-green deployment, comprehensive health checks

### Preview
- **Trigger**: Pull Request creation/update
- **URL**: https://preview-pr-{number}.mariia-hub.com
- **Database**: Preview Supabase
- **Features**: Visual regression testing, performance testing

## Workflows

### 1. Continuous Integration (`ci.yml`)
Triggers on every push to `main` and `develop` branches, and on all pull requests.

**Jobs:**
- **Lint & Type Check**: ESLint, TypeScript validation
- **Unit Tests**: Vitest with coverage reporting
- **Build**: Production build verification
- **E2E Tests**: Playwright cross-browser testing
- **Visual Tests**: Visual regression testing
- **Security Audit**: npm audit and CodeQL analysis
- **Deploy to Staging**: Automatic deployment from develop branch
- **Performance Tests**: Lighthouse CI evaluation
- **Deploy to Production**: Manual deployment from main branch

### 2. Pull Request Checks (`pr-check.yml`)
Triggers on PR creation and updates.

**Jobs:**
- **Quick Checks**: Linting, type checking, unit tests
- **Bundle Size Check**: Analysis and reporting
- **Accessibility Check**: Pa11y and axe-core testing
- **Mobile Check**: Responsive design testing
- **Code Quality**: SonarCloud analysis
- **PR Labeler**: Automatic PR labeling
- **Conflict Check**: Merge conflict detection

### 3. Security Scan (`security-scan.yml`)
Comprehensive security analysis workflow.

**Jobs:**
- **Dependency Audit**: npm audit and Snyk scanning
- **CodeQL Analysis**: Static code security analysis
- **Secret Scanning**: TruffleHog and Gitleaks
- **SAST Analysis**: Semgrep and njsscan
- **Container Security**: Trivy and Grype scanning
- **OWASP ZAP**: Dynamic application security testing
- **Security Scorecard**: OSSF evaluation

### 4. Deployment (`deploy.yml`)
Handles all environment deployments.

**Features:**
- Pre-deployment validation
- Environment-specific configurations
- Automatic versioning
- Docker image building
- Blue-green deployment for production
- Automatic rollback on failure
- Deployment status updates

### 5. Preview Deployments (`preview.yml`)
Creates preview environments for PRs.

**Features:**
- Automatic preview URLs
- Screenshot capture
- Visual regression testing
- Performance testing
- Automatic cleanup on PR close

### 6. Integration Tests (`integration-tests.yml`)
Runs comprehensive integration tests on deployed environments.

**Test Categories:**
- **API Integration**: Endpoint testing
- **Database Integration**: Database operations
- **Payment Integration**: Stripe testing
- **E2E Integration**: Full user flows
- **Performance**: Load testing with k6
- **Security**: OWASP ZAP integration

### 7. Accessibility Testing (`accessibility.yml`)
Specialized accessibility testing workflow.

**Tests:**
- Pa11y CI automation
- axe-core analysis
- Lighthouse accessibility audit
- Keyboard navigation tests
- Color contrast validation

## Deployment Process

### Automatic Deployments

#### To Staging
```bash
# Push to develop branch
git checkout develop
git pull origin develop
git merge feature-branch
git push origin develop
```

#### To Production
```bash
# Push to main branch (requires approval)
git checkout main
git pull origin main
git merge release-branch
git push origin main
```

### Manual Deployment

#### Using GitHub Actions
1. Go to Actions tab in GitHub
2. Select "Deploy" workflow
3. Click "Run workflow"
4. Select environment and options
5. Wait for approval (production)

#### Using CLI Script
```bash
# Deploy to staging
./scripts/deploy.sh -e staging

# Deploy to production with version
./scripts/deploy.sh -e production -v v1.2.3

# Force deployment (skip checks)
./scripts/deploy.sh -e production -f

# Dry run (show what would be deployed)
./scripts/deploy.sh -e production -n
```

### Production Deployment Approval Process

1. **PR Approval**: Must be approved by at least 2 team members
2. **CI/CD Checks**: All checks must pass
3. **Manual Approval**: Additional approval in GitHub Environments
4. **Wait Timer**: 5-minute waiting period before deployment
5. **Health Checks**: Automated verification after deployment

## Testing Strategy

### Test Categories

#### Unit Tests
- **Framework**: Vitest
- **Coverage**: Minimum 90% required for production
- **Location**: `src/**/*.test.ts`, `src/**/*.test.tsx`

#### Integration Tests
- **API Tests**: Endpoint validation
- **Database Tests**: CRUD operations
- **External Service Tests**: Third-party integrations

#### E2E Tests
- **Framework**: Playwright
- **Browsers**: Chrome, Firefox, Safari
- **Devices**: Desktop, Mobile, Tablet
- **Location**: `tests/e2e/`

#### Visual Tests
- **Tool**: Percy integration
- **Screenshots**: Critical pages and components
- **Regression**: Automatic diff detection

#### Performance Tests
- **Lighthouse CI**: Automated scoring
- **Load Testing**: k6 scripts
- **Budgets**: Bundle size thresholds

### Running Tests Locally

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration

# Performance tests
npm run test:performance

# Accessibility tests
npm run test:a11y

# All tests
npm run test:all
```

## Security Measures

### Automated Security Scans

#### Static Analysis
- **CodeQL**: GitHub's advanced static analysis
- **Semgrep**: Custom security rules
- **ESLint Security Rules**: Security-focused linting
- **njsscan**: Node.js specific vulnerability scanning

#### Dependency Scanning
- **npm audit**: Known vulnerability check
- **Snyk**: Continuously updated vulnerability database
- **GitHub Advisory Database**: Automated dependency updates

#### Dynamic Analysis
- **OWASP ZAP**: Web application security scanner
- **TruffleHog**: Secret detection in code
- **Gitleaks**: Git history scanning

#### Container Security
- **Trivy**: Container image vulnerability scanning
- **Grype**: Alternative container scanner
- **Docker Bench Security**: Configuration validation

### Security Best Practices

1. **Secrets Management**
   - All secrets in GitHub Secrets
   - Environment-specific secrets
   - Regular secret rotation

2. **Code Security**
   - No hardcoded credentials
   - Input validation and sanitization
   - HTTPS only in production
   - CSP headers implementation

3. **Dependencies**
   - Regular dependency updates
   - Lock file verification
   - License compliance checking

## Monitoring and Alerting

### Health Checks

#### Endpoints
- `/health`: Basic application health
- `/api/health`: API status and metrics
- `/api/v1/services`: Service availability

#### Metrics Monitored
- **Response Time**: P95 < 500ms
- **Error Rate**: < 0.1%
- **Uptime**: > 99.9%
- **CPU Usage**: < 70%
- **Memory Usage**: < 80%

### Alerting Channels

#### Slack
- `#deployments`: Deployment notifications
- `#alerts`: Critical alerts
- `#performance`: Performance degradation

#### Email
- `team@mariia-hub.com`: General notifications
- `alerts@mariia-hub.com`: Critical alerts

#### Discord
- Production alerts channel
- Development notifications

#### PagerDuty
- Critical production issues
- 24/7 on-call rotation

### Performance Monitoring

#### Lighthouse Scores
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

#### Real User Monitoring (RUM)
- Core Web Vitals tracking
- User journey analytics
- Error tracking with Sentry

## Rollback Procedures

### Automatic Rollback

Triggers:
- Health check failures
- Performance threshold breaches
- Error rate increase
- Manual trigger

### Manual Rollback

#### Using GitHub Actions
1. Go to Actions tab
2. Select "Deploy" workflow
3. Click "Run workflow"
4. Choose rollback option
5. Select target version

#### Using CLI Script
```bash
# Rollback to previous version
./scripts/rollback.sh production

# Rollback to specific version
./scripts/rollback.sh production v1.2.3

# Rollback to specific commit
./scripts/rollback.sh staging a1b2c3d
```

### Rollback Steps

1. **Verification**: Confirm rollback necessity
2. **Preparation**: Check target version
3. **Execution**: Deploy rollback version
4. **Validation**: Health checks
5. **Notification**: Alert team
6. **Documentation**: Create incident ticket

### Post-Rollback Actions

1. Create GitHub issue for investigation
2. Schedule incident post-mortem
3. Update documentation
4. Implement preventive measures

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
npm run build 2>&1 | tee build.log

# Common fixes
npm ci  # Clean install
npm audit fix  # Fix vulnerabilities
npx tsc --noEmit  # Type check
```

#### Test Failures
```bash
# Run specific test
npm run test -- ServiceBooking.test.tsx

# Debug with watch mode
npm run test:watch

# Update snapshots
npx playwright test --update-snapshots
```

#### Deployment Failures
```bash
# Check environment variables
cat .env.production | grep -v "^#"

# Verify Vercel configuration
npx vercel whoami
npx vercel link

# Check DNS propagation
nslookup mariia-hub.com
```

#### Performance Issues
```bash
# Analyze bundle size
npm run build:analyze

# Lighthouse audit
npx lighthouse https://mariia-hub.com

# Web Vitals check
npm run test:performance
```

### Getting Help

1. **Documentation**: Check this guide and inline docs
2. **Issues**: Create GitHub issue with details
3. **Slack**: Ask in `#devops` channel
4. **Escalation**: Contact DevOps team lead

### Debug Mode

Enable debug logging:
```bash
# GitHub Actions debug
DEBUG=*:*

# Vercel debug
VERCEL_DEBUG=1

# Application debug
VITE_DEBUG=true
```

### Monitoring Debug

View detailed logs:
```bash
# GitHub Actions
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/mariia-hub/mariia-hub-unified/actions/runs

# Vercel
npx vercel logs

# Sentry
# Check Sentry dashboard for errors
```

## Best Practices

### Development Workflow

1. **Feature Branches**: Create feature branches from `develop`
2. **Small Commits**: Keep commits focused and small
3. **PR Reviews**: Require at least one review
4. **Update Documentation**: Keep docs in sync with code

### Deployment Safety

1. **Test First**: Never skip tests for production
2. **Staging First**: Always test in staging first
3. **Gradual Rollout**: Use feature flags for risky changes
4. **Monitor Closely**: Watch metrics after deployment

### Security Hygiene

1. **Regular Updates**: Keep dependencies current
2. **Secret Rotation**: Rotate secrets regularly
3. **Access Control**: Principle of least privilege
4. **Audit Logs**: Regularly review access logs

### Performance Optimization

1. **Bundle Analysis**: Regular size checks
2. **Image Optimization**: Use WebP format
3. **Caching Strategy**: Implement proper caching
4. **CDN Usage**: Distribute assets globally

## Environment Configuration

### Required Secrets

#### All Environments
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

#### Staging
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_SUPABASE_SERVICE_KEY`
- `STAGING_STRIPE_PUBLIC_KEY`
- `STAGING_STRIPE_SECRET_KEY`

#### Production
- All staging secrets
- `PRODUCTION_SUPABASE_URL`
- `PRODUCTION_SUPABASE_ANON_KEY`
- `PRODUCTION_SUPABASE_SERVICE_KEY`
- `PRODUCTION_STRIPE_PUBLIC_KEY`
- `PRODUCTION_STRIPE_SECRET_KEY`
- `SENTRY_DSN`
- `SLACK_WEBHOOK_URL`
- `DISCORD_WEBHOOK_URL`

### Environment Files

Create `.env.{environment}` files:

```bash
# .env.staging
VITE_ENVIRONMENT=staging
VITE_SUPABASE_URL=https://your-staging.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-key

# .env.production
VITE_ENVIRONMENT=production
VITE_SUPABASE_URL=https://your-production.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_STRIPE_PUBLIC_KEY=pk_live_your-production-key
```

## Appendix

### Quick Reference Commands

```bash
# Deploy commands
./scripts/deploy.sh -e staging          # Deploy to staging
./scripts/deploy.sh -e production      # Deploy to production
./scripts/deploy.sh -e production -v v1.2.3  # Deploy with version
./scripts/deploy.sh -e production -n  # Dry run

# Rollback commands
./scripts/rollback.sh production       # Rollback production
./scripts/rollback.sh staging v1.2.3   # Rollback to version

# Test commands
npm run test                           # Unit tests
npm run test:e2e                       # E2E tests
npm run test:integration                # Integration tests
npm run test:performance               # Performance tests
```

### Useful Links

- [GitHub Actions Dashboard](https://github.com/mariia-hub/mariia-hub-unified/actions)
- [Vercel Dashboard](https://vercel.com/mariia-hub)
- [Sentry Error Tracking](https://sentry.io/mariia-hub)
- [Lighthouse CI](https://lighthouse-ci.org)
- [OWASP ZAP](https://www.zaproxy.org/)

### Contact Information

- **DevOps Team**: devops@mariia-hub.com
- **On-call**: oncall@mariia-hub.com
- **Emergencies**: +1-555-DEVOPS (24/7)

---

Last updated: $(date)
Version: 1.0.0