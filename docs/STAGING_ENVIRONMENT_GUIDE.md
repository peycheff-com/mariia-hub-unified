# Mariia Hub - Staging Environment Guide

This guide covers everything you need to know about the staging environment setup, usage, and best practices for Mariia Hub.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Preview Deployments](#preview-deployments)
7. [Testing in Staging](#testing-in-staging)
8. [Security](#security)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

## Overview

### What is Staging?

The staging environment is a production-like environment that:
- Mirrors the production setup but uses isolated resources
- Automatically deploys with every pull request
- Contains realistic but anonymized test data
- Allows thorough testing before production deployment

### Key Features

- **Preview Deployments**: Automatic deployment for every PR
- **Isolated Database**: Separate Supabase instance or branch
- **Test Data**: Realistic but anonymized data for testing
- **Feature Flags**: All features enabled for comprehensive testing
- **Security**: Isolated from production with test credentials

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Developer    │───▶│   GitHub PR     │───▶│  Preview Deploy │
│   Local Env    │    │                 │    │   (Vercel)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Production     │◀───│   Main Branch   │◀───│  Staging Env    │
│   (Vercel)      │    │                 │    │   (Vercel)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Production DB   │    │ Staging DB      │    │ Preview DB      │
│ (Supabase)      │    │ (Supabase)      │    │ (Supabase)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/mariia-hub.git
cd mariia-hub

# Install dependencies
npm install

# Set up staging environment
npm run setup:staging
```

### 2. Configure Environment Variables

```bash
# Copy staging environment template
cp .env.staging .env.local

# Fill in your staging credentials
# (Refer to Environment Configuration section)
```

### 3. Set Up Staging Database

```bash
# Create and seed staging database
npm run db:seed:staging
```

### 4. Deploy to Staging

```bash
# Deploy staging branch
npm run deploy:staging
```

## Environment Configuration

### Required Environment Variables

Create `.env.staging` with the following variables:

```bash
# Supabase Configuration
STAGING_SUPABASE_URL="https://your-staging-project.supabase.co"
STAGING_SUPABASE_ANON_KEY="your-staging-anon-key"
STAGING_SUPABASE_SERVICE_ROLE_KEY="your-staging-service-key"

# Application
VITE_APP_URL="https://staging.mariia-hub.com"
VITE_APP_ENV="staging"

# Stripe (Test Mode)
STAGING_STRIPE_PUBLIC_KEY="pk_test_..."
STAGING_STRIPE_SECRET_KEY="sk_test_..."

# Google Services (Test)
STAGING_GOOGLE_MAPS_API_KEY="your-test-key"
STAGING_GA_MEASUREMENT_ID="G-STAGING"
```

### Vercel Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

#### Production Environment
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLIC_KEY`
- `VITE_GA_MEASUREMENT_ID`

#### Preview Environment
- `PREVIEW_SUPABASE_URL`
- `PREVIEW_SUPABASE_ANON_KEY`
- `PREVIEW_STRIPE_PUBLIC_KEY`
- `PREVIEW_GOOGLE_MAPS_API_KEY`
- `PREVIEW_GA_MEASUREMENT_ID`

## Database Setup

### Option 1: Supabase Branching (Recommended)

```bash
# Set up Supabase preview branch
./scripts/setup-supabase-staging.sh
```

### Option 2: Separate Staging Project

1. Create a new Supabase project named "mariia-hub-staging"
2. Run migrations:
   ```bash
   supabase link --project-ref <staging-project-id>
   supabase db push
   ```

### Seeding Test Data

```bash
# Generate and seed test data
npm run db:seed:staging

# Reset all staging data
npm run db:reset:staging
```

#### Generated Data Includes:
- **Services**: 20 realistic beauty, fitness, and lifestyle services
- **Users**: 50 test clients and 3 admin accounts
- **Bookings**: 200 sample bookings with various statuses
- **Availability**: 2 months of time slots
- **Content**: Service descriptions, galleries, and metadata

#### Test Credentials:
- **Admin**: admin{1-3}@staging.mariia-hub.com / staging123!
- **Client**: Any email address / client123!

## Preview Deployments

### Automatic Preview Deployments

Every pull request automatically:
1. Runs tests and builds
2. Deploys to a unique preview URL
3. Seeds test database
4. Runs smoke tests
5. Comments on PR with preview link

### Preview URL Format
```
https://<branch-name>-mariia-hub.vercel.app
```

### Manual Preview Deployment

```bash
# Deploy current branch to preview
vercel --no-deployment-protection
```

### Preview Environment Features

- **Debug Mode**: Enabled for easier troubleshooting
- **Test Data**: Automatically populated
- **Mock Services**: Can be enabled for specific testing
- **Verbose Logging**: Detailed logs for debugging

## Testing in Staging

### Test Checklist

#### Functionality Testing
- [ ] User registration and login flow
- [ ] Service browsing and filtering
- [ ] Booking creation and management
- [ ] Payment processing (Stripe test mode)
- [ ] Admin dashboard functionality
- [ ] Email notifications
- [ ] Multi-language support (EN/PL)

#### Visual Testing
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Cross-browser compatibility
- [ ] Loading states and animations
- [ ] Error states and messages
- [ ] Dark mode (if applicable)

#### Performance Testing
- [ ] Page load times (< 3 seconds)
- [ ] Core Web Vitals scores
- [ ] Bundle size optimization
- [ ] Image optimization
- [ ] API response times

#### Integration Testing
- [ ] Stripe payment flow
- [ ] Email service (Resend)
- [ ] Google Maps integration
- [ ] Analytics tracking
- [ ] Error monitoring (Sentry)

### Test Data Management

#### Reset Data
```sql
-- Reset all staging data
SELECT reset_staging_data();
```

#### Custom Test Scenarios
```bash
# Create specific test scenario
npm run db:seed:custom -- --scenario=high-volume
```

## Security

### Security Measures

#### Isolation
- Separate database instance
- Test-only API keys
- No real customer data
- IP restrictions (optional)

#### Authentication
- Test Stripe keys (test mode)
- Staging-specific secrets
- Rate limiting disabled for testing
- CORS configured for staging domain

#### Data Protection
- No PII in test data
- Anonymized user information
- Disposable email domains
- Fake payment information

### Security Headers

The staging environment includes:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- HSTS (in production)

## Monitoring

### Health Checks

Monitor these endpoints:
- `https://staging.mariia-hub.com/health` - Application health
- `https://staging.mariia-hub.com/api/health` - API health
- `https://staging.mariia-hub.com/api/health/db` - Database health

### Performance Monitoring

Set up monitoring for:
- Page load times
- Core Web Vitals
- API response times
- Error rates
- SSL certificate expiry

### Alerts Configuration

Create alerts for:
- Downtime > 5 minutes
- Error rate > 5%
- Response time > 2 seconds
- SSL expiry in 30 days

### Monitoring Tools

- **Uptime**: UptimeRobot or Pingdom
- **Performance**: Lighthouse CI
- **Errors**: Sentry
- **Logs**: Vercel Logs

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
vercel logs <deployment-url>

# Local build test
npm run build

# Check TypeScript errors
npm run type-check
```

#### Database Issues
```bash
# Check database connection
supabase status

# Reset database
npm run db:reset:staging

# Check migrations
supabase migration list
```

#### DNS/Domain Issues
```bash
# Check DNS propagation
dig staging.mariia-hub.com

# Check SSL certificate
openssl s_client -servername staging.mariia-hub.com -connect staging.mariia-hub.com:443

# Run health check
./scripts/health-check.sh
```

#### Preview Deployment Issues
```bash
# Check preview logs
vercel logs --scope <team-id>

# Redeploy preview
vercel --force

# Clear Vercel cache
vercel rm <project-id>
```

### Debug Mode

Enable debug mode in staging:
```bash
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### Log Levels

- `error`: Errors only
- `warn`: Warnings and errors
- `info`: General information
- `debug`: Detailed debugging
- `trace`: Full trace logging

## Best Practices

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Develop and Test Locally**
   ```bash
   npm run dev
   npm run test
   ```

3. **Create Pull Request**
   - Automatic preview deployment
   - Run all tests
   - Manual testing in preview

4. **Review and Merge**
   - Code review
   - Staging approval
   - Merge to main

5. **Production Deployment**
   - Manual trigger
   - Full test suite
   - Production verification

### Staging Environment Usage

#### DO:
- Test all new features
- Verify bug fixes
- Check responsive design
- Test payment flows (test mode)
- Validate email notifications
- Performance testing
- Cross-browser testing

#### DON'T:
- Use production credentials
- Store real customer data
- Skip tests
- Ignore SSL warnings
- Commit sensitive data
- Use for load testing

### Data Management

#### Test Data Guidelines:
- Keep it realistic but anonymous
- Use consistent patterns
- Include edge cases
- Update regularly
- Document scenarios

#### Data Cleanup:
- Reset before major tests
- Clean up after use
- Automate cleanup jobs
- Monitor storage usage

### Security Best Practices

1. **Credential Management**
   - Never commit secrets
   - Use environment variables
   - Rotate keys regularly
   - Use test credentials

2. **Access Control**
   - IP whitelisting option
   - VPN for remote access
   - Basic authentication option
   - Team access only

3. **Monitoring**
   - Set up alerts
   - Monitor access logs
   - Track performance
   - SSL monitoring

## Maintenance

### Regular Tasks

#### Weekly
- Review deployment logs
- Check SSL certificates
- Monitor storage usage
- Update test data

#### Monthly
- Rotate secrets/keys
- Update dependencies
- Review performance metrics
- Clean up old deployments

#### Quarterly
- Security audit
- Performance review
- Cost optimization
- Documentation updates

### Automation Scripts

```bash
# Full staging reset
npm run staging:reset

# Health check
./scripts/health-check.sh

# Update test data
npm run db:seed:staging

# Performance test
npm run test:lighthouse
```

## Support

### Get Help

- **Documentation**: Check this guide first
- **Issues**: Create a GitHub issue
- **Slack**: #staging-environment channel
- **Emergency**: Contact the DevOps team

### Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Changelog

### v1.0.0
- Initial staging environment setup
- Preview deployments for PRs
- Database seeding automation
- Health monitoring setup
- SSL certificate configuration

---

**Last Updated**: 2025-01-24
**Maintained by**: DevOps Team