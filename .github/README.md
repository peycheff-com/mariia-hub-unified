# GitHub Actions Workflows for Mariia Hub

This directory contains the CI/CD workflows for Mariia Hub. The implementation provides a comprehensive automated pipeline for testing, security scanning, deployment, and monitoring.

## 🚀 Quick Start

### For Developers

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Push Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

3. **Open Pull Request**
   - Create PR to `develop` branch for new features
   - Create PR to `main` branch for hotfixes

4. **Automatic Checks Run**
   - Linting and type checking
   - Unit tests with coverage
   - Security scanning
   - Build verification

5. **Preview Environment**
   - Automatically created for each PR
   - URL: `https://preview-pr-{number}.mariia-hub.com`

### For Operations

1. **Deploy to Staging**
   ```bash
   # Automatic on push to develop
   git push origin develop
   ```

2. **Deploy to Production**
   ```bash
   # Requires approval
   ./scripts/deploy.sh -e production
   ```

3. **Rollback**
   ```bash
   ./scripts/rollback.sh production
   ```

## 📁 Workflow Files

| Workflow | Purpose | Trigger |
|---------|---------|---------|
| `ci.yml` | Continuous Integration | Push to main/develop, PR |
| `deploy.yml` | Deployments | Push, Manual, Workflow Call |
| `security-scan.yml` | Security Analysis | Push, PR, Schedule |
| `preview.yml` | Preview Environments | Pull Request |
| `integration-tests.yml` | Integration Testing | After Deployment |
| `dependency-update.yml` | Dependency Updates | Schedule, Manual |
| `monitoring.yml` | Production Monitoring | Schedule, Manual |
| `accessibility.yml` | Accessibility Testing | Push, PR, Schedule |
| `pr-check.yml` | PR Validation | Pull Request |

## 🌍 Environments

### Development
- **Source**: Feature branches
- **URL**: Local
- **Features**: Hot reload, debugging

### Staging
- **Source**: `develop` branch
- **URL**: https://staging.mariia-hub.com
- **Deployment**: Automatic
- **Tests**: Full test suite

### Production
- **Source**: `main` branch
- **URL**: https://mariia-hub.com
- **Deployment**: Manual approval required
- **Features**: Blue-green deployment

### Preview
- **Source**: Pull Requests
- **URL**: https://preview-pr-{number}.mariia-hub.com
- **Features**: Visual testing, performance testing

## 🔧 Configuration

### Required Secrets

Add these to **Repository Settings > Secrets**:

#### Core Secrets
- `GITHUB_TOKEN` (automatically provided)
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

#### Staging Environment
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_SUPABASE_SERVICE_KEY`
- `STAGING_STRIPE_PUBLIC_KEY`
- `STAGING_STRIPE_SECRET_KEY`

#### Production Environment
- `PRODUCTION_SUPABASE_URL`
- `PRODUCTION_SUPABASE_ANON_KEY`
- `PRODUCTION_SUPABASE_SERVICE_KEY`
- `PRODUCTION_STRIPE_PUBLIC_KEY`
- `PRODUCTION_STRIPE_SECRET_KEY`

#### Monitoring & Notifications
- `SLACK_WEBHOOK_URL`
- `DISCORD_WEBHOOK_URL`
- `SENTRY_DSN`
- `Sentry_AUTH_TOKEN`

#### Security Scanning
- `SNYK_TOKEN`
- `SONAR_TOKEN`
- `GITLEAKS_LICENSE`

### Environment Protection Rules

Configure in **Settings > Environments**:

#### Staging
- No approval required
- Auto-deploy from `develop` branch
- Wait timer: 0 minutes

#### Production
- Required reviewers: 2
- Require admin approval
- Wait timer: 5 minutes
- Restrict deployments to trusted users

## 📊 Monitoring

### Health Checks
- Endpoints: `/health`, `/api/health`
- Frequency: Every 15 minutes
- Auto-alert on failure

### Performance Monitoring
- Lighthouse scores tracked
- Performance thresholds enforced
- Automatic issue creation on regression

### Security Monitoring
- SSL certificate expiry: 30-day warning
- Security headers verification
- Automated vulnerability scanning

## 🚨 Alerts

### Channels
- **Slack**: `#deployments`, `#alerts`
- **Discord**: Production alerts
- **Email**: Team distribution lists
- **GitHub Issues**: Automated issue creation

### Alert Types
- Health check failures
- Performance degradation
- Security vulnerabilities
- Deployment failures
- SSL certificate expiry

## 🛠️ Local Development

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration

# Performance tests
npm run test:performance
```

### Building Locally

```bash
# Development build
npm run build:dev

# Production build
npm run build

# Analyze bundle
npm run build:analyze
```

### Manual Deployment

```bash
# Deploy to staging
./scripts/deploy.sh -e staging

# Deploy to production with version
./scripts/deploy.sh -e production -v v1.2.3

# Dry run (show what would be deployed)
./scripts/deploy.sh -e production -n
```

## 🔄 Deployment Process

### Automated Deployments

1. **To Staging**:
   - Push to `develop` branch
   - All checks must pass
   - Automatic deployment
   - Health checks after deployment

2. **To Production**:
   - Push to `main` branch
   - All checks must pass
   - Manual approval in GitHub
   - Blue-green deployment
   - Rollback on failure

### Manual Deployment

1. **Using GitHub Actions**:
   - Go to Actions > Deploy
   - Click "Run workflow"
   - Select environment
   - Wait for approval (production)

2. **Using CLI**:
   - Use deployment script
   - See examples above

### Rollback Process

1. **Automatic Rollback**:
   - Triggered on health check failure
   - Instant rollback to previous version

2. **Manual Rollback**:
   ```bash
   # To previous version
   ./scripts/rollback.sh production

   # To specific version
   ./scripts/rollback.sh production v1.2.3
   ```

## 📋 Best Practices

### Development
1. **Branch Protection**:
   - Require PR reviews
   - Require status checks to pass
   - Delete merged branches

2. **Commit Messages**:
   - Use conventional commits
   - Include issue numbers
   - Sign commits

3. **Testing**:
   - Write tests for new features
   - Maintain 90% coverage
   - Test edge cases

### Deployment
1. **Staging First**:
   - Always test in staging
   - Verify all features work
   - Check performance metrics

2. **Production Deploy**:
   - Deploy during low traffic
   - Monitor metrics closely
   - Have rollback plan ready

3. **Rollback**:
   - Know rollback command
   - Document reasons
   - Create post-mortem

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check dependencies
   - Verify environment variables
   - Review build logs

2. **Test Failures**:
   - Run tests locally
   - Update snapshots
   - Check test environment

3. **Deployment Failures**:
   - Check Vercel configuration
   - Verify secrets
   - Check permissions

4. **Health Check Failures**:
   - Check server logs
   - Verify database connection
   - Check recent deployments

### Getting Help

1. **Check Logs**:
   - GitHub Actions logs
   - Vercel logs
   - Application logs

2. **Monitor Dashboard**:
   - Sentry for errors
   - Vercel Analytics
   - Custom monitoring

3. **Contact Support**:
   - DevOps team
   - On-call engineer
   - Create GitHub issue

## 📚 Documentation

- [CI/CD Guide](../../docs/CI_CD_GUIDE.md) - Comprehensive guide
- [Deployment Scripts](../../scripts/) - Utility scripts
- [Environment Config](./environments/) - Environment settings
- [Security Policies](../../docs/SECURITY_POLICY.md) - Security guidelines

## 🤝 Contributing

When adding new workflows:

1. **Use Templates**: Copy from existing workflows
2. **Add Documentation**: Update this README
3. **Test Locally**: Use act tool for local testing
4. **Get Review**: Create PR for changes

### Local Testing with Act

```bash
# Install act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow locally
act -j test
```

## 📄 License

This CI/CD configuration is part of the Mariia Hub project. See the main repository license for details.