# Deployment Guide

## Overview

This guide covers the deployment process for Mariia Hub across different environments, including staging and production setups.

## Environments

### 1. Development
- **URL**: http://localhost:8080
- **Purpose**: Local development
- **Database**: Local Supabase instance
- **Trigger**: Manual (`npm run dev`)

### 2. Staging
- **URL**: https://staging.mariia-hub.com
- **Purpose**: Pre-production testing
- **Database**: Supabase preview branch
- **Trigger**: Push to `develop` or `main` branch
- **Features**:
  - Latest code from main branches
  - Staging database with test data
  - Performance monitoring enabled
  - Error tracking enabled

### 3. Production
- **URL**: https://mariia-hub.com
- **Purpose**: Live production environment
- **Database**: Supabase production
- **Trigger**: Manual approval after staging tests pass
- **Features**:
  - Optimized builds
  - Full monitoring
  - CDN distribution
  - SSL certificate

## Deployment Process

### Automated Deployment (CI/CD)

The project uses GitHub Actions for automated deployment. The pipeline includes:

1. **Code Quality Checks**
   - ESLint
   - TypeScript compilation
   - Unit tests with 90% coverage requirement
   - Security audit

2. **Build Process**
   - Vite production build
   - Bundle size analysis
   - Asset optimization

3. **Testing**
   - E2E tests on multiple browsers
   - Visual regression tests
   - Accessibility tests
   - Performance tests (Lighthouse)

4. **Deployment**
   - Staging: Automatic on push to `develop`/`main`
   - Production: Manual approval after staging validation

### Manual Deployment

For emergency deployments or hotfixes:

```bash
# 1. Install dependencies
npm ci

# 2. Build the application
npm run build

# 3. Deploy to Vercel
vercel --prod

# 4. Run smoke tests
curl -f https://mariia-hub.com
```

## Environment Variables

### Required Environment Variables

#### Supabase
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

#### Stripe
- `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key

#### Analytics
- `VITE_GA_MEASUREMENT_ID`: Google Analytics measurement ID

#### External Services
- `VITE_BOOKSY_API_URL`: Booksy API endpoint
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key

### Setting Environment Variables

#### GitHub Secrets
1. Go to repository Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `STAGING_SUPABASE_URL`
   - `STAGING_SUPABASE_ANON_KEY`
   - `STAGING_STRIPE_PUBLIC_KEY`
   - `PRODUCTION_SUPABASE_URL`
   - `PRODUCTION_SUPABASE_ANON_KEY`
   - `PRODUCTION_STRIPE_PUBLIC_KEY`
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

#### Vercel Environment Variables
1. Go to Vercel dashboard > Project Settings > Environment Variables
2. Add variables for different environments
3. Ensure sensitive variables are not exposed client-side

## Monitoring and Observability

### Error Tracking
- **Tool**: Sentry
- **Configuration**: Automatic error capture in production
- **Access**: https://sentry.io/mariia-hub

### Performance Monitoring
- **Tool**: Vercel Analytics + Lighthouse CI
- **Metrics**: Core Web Vitals, bundle size, API response times
- **Alerts**: Performance degradation notifications

### Log Aggregation
- **Tool**: Vercel Logs + Custom logging
- **Retention**: 30 days
- **Access**: Vercel dashboard

### Uptime Monitoring
- **Tool**: UptimeRobot
- **Checks**: Every 5 minutes
- **Notifications**: Slack and email alerts

## Database Management

### Staging Database
- Automatic migrations on deployment
- Test data seeding
- Daily backups

### Production Database
- Manual migrations with approval
- Point-in-time recovery enabled
- Daily and weekly backups
- Read replicas for analytics

### Migration Process
```bash
# Create new migration
npx supabase db diff

# Apply to staging (automatic)
# Apply to production (manual approval required)
npx supabase db push
```

## Rollback Procedures

### Automatic Rollback
- Health check failures trigger automatic rollback
- Monitors: Response time, error rate, SSL certificate

### Manual Rollback
```bash
# 1. Identify previous stable deployment
vercel ls

# 2. Promote previous deployment
vercel promote <deployment-url>

# 3. Verify rollback
curl -f https://mariia-hub.com/health
```

## Security Considerations

### SSL/TLS
- Automatic SSL certificate management
- HTTPS enforced in production
- HSTS headers configured

### Content Security Policy
```javascript
// Example CSP header
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';
```

### API Security
- Rate limiting enabled
- CORS properly configured
- API keys rotated quarterly

## Performance Optimization

### Build Optimizations
- Code splitting by route
- Tree shaking
- Minification
- Gzip compression

### Caching Strategy
- Static assets: 1 year
- HTML pages: 1 hour
- API responses: 5 minutes
- Images: CDN with 30 days

### CDN Configuration
- Vercel Edge Network
- Global distribution
- Automatic image optimization

## Testing in Production

### Feature Flags
Use feature flags for gradual rollouts:
```javascript
if (process.env.VITE_ENABLE_NEW_FEATURE === 'true') {
  // New feature code
}
```

### A/B Testing
- Implement controlled experiments
- Monitor key metrics
- Gradual traffic increase

### Canary Deployments
- Deploy to subset of users
- Monitor for issues
- Full rollout after validation

## Troubleshooting

### Common Issues

#### Build Failures
1. Check dependency versions
2. Verify environment variables
3. Review build logs in GitHub Actions

#### Deployment Failures
1. Check Vercel function logs
2. Verify API endpoints
3. Review error tracking dashboard

#### Performance Issues
1. Check bundle size
2. Review Lighthouse reports
3. Monitor Core Web Vitals

### Debug Commands
```bash
# Check deployment status
vercel inspect

# View logs
vercel logs

# Test locally
npm run build && npm run preview
```

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| DevOps Lead |  | Slack: @devops |
| Backend Lead |  | Slack: @backend |
| Frontend Lead |  | Slack: @frontend |
| Product Owner |  | Slack: @product |

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Emergency Runbook](./EMERGENCY_RUNBOOK.md)