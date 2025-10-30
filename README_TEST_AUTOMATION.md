# Comprehensive Test Automation and CI/CD Integration

This document outlines the complete test automation infrastructure implemented for the Mariia Hub beauty/fitness booking platform.

## Overview

The test automation system provides:
- **Automated Test Execution**: Parallel test execution with intelligent sharding
- **Quality Gates**: Comprehensive quality metrics and threshold enforcement
- **Performance Monitoring**: Lighthouse CI integration for performance regression testing
- **Security Testing**: Automated vulnerability scanning and security analysis
- **Test Data Management**: Automated test data provisioning and cleanup
- **Mock Services**: Complete mocking of external dependencies
- **Docker Environment**: Containerized test environments for consistency
- **Monitoring & Alerting**: Real-time monitoring and intelligent alerting

## Architecture

### CI/CD Pipeline Stages

1. **Code Quality Gates** (`code-quality`)
   - ESLint with comprehensive rules
   - TypeScript strict type checking
   - Prettier formatting validation
   - Security vulnerability scanning

2. **Parallel Unit Testing** (`unit-tests-matrix`)
   - Intelligent test sharding across 4 parallel runners
   - Coverage analysis with 85% minimum threshold
   - Test result aggregation and reporting

3. **Coverage Analysis** (`coverage-analysis`)
   - Coverage report merging from parallel execution
   - Trend analysis and coverage drift detection
   - Integration with Codecov for historical tracking

4. **Integration Testing** (`integration-tests`)
   - Database integration testing with PostgreSQL
   - API endpoint testing with real services
   - Redis caching integration validation

5. **Build & E2E Testing** (`build-and-e2e`)
   - Application build validation
   - Multi-browser E2E testing (Chrome, Firefox, Safari)
   - Visual regression testing

6. **Performance Testing** (`performance-tests`)
   - Lighthouse CI performance monitoring
   - Core Web Vitals tracking
   - Bundle size analysis and optimization

7. **Security Testing** (`security-tests`)
   - Snyk vulnerability scanning
   - OWASP ZAP security analysis
   - Secrets detection with TruffleHog

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run parallel unit tests
npm run test:parallel

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Setup test data
npm run test:data:setup

# Clean up test data
npm run test:data:cleanup

# Run full test suite
npm run test:full

# Monitor test results
npm run test:monitor
```

### Docker Testing Environment

```bash
# Start test environment with all services
npm run test:docker

# Clean up Docker environment
npm run test:docker:cleanup
```

### Test Data Management

```bash
# Setup test database and seed data
npm run test:data:setup

# Reset test database
npm run test:data:reset

# Seed test data
npm run test:data:seed

# Clean up test data
npm run test:data:cleanup
```

## Configuration

### Environment Variables

```bash
# Test Database Configuration
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5433/test_db
TEST_REDIS_URL=redis://localhost:6380

# Supabase Test Configuration
VITE_SUPABASE_URL=http://localhost:54323
VITE_SUPABASE_ANON_KEY=test-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=test-service-key

# Stripe Test Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_...
TEST_STRIPE_SECRET_KEY=sk_test_...

# Monitoring Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
LHCI_GITHUB_APP_TOKEN=ghp_...
SNYK_TOKEN=your-snyk-token
```

### Quality Gates Configuration

Quality gates are configured in the GitHub Actions workflow:

```yaml
# Coverage thresholds
MIN_LINES_COVERAGE: 85%
MIN_FUNCTIONS_COVERAGE: 85%
MIN_BRANCHES_COVERAGE: 80%
MIN_STATEMENTS_COVERAGE: 85%

# Performance thresholds
MIN_PERFORMANCE_SCORE: 90
MIN_ACCESSIBILITY_SCORE: 95

# Security thresholds
MAX_SECURITY_VULNERABILITIES: 5
MAX_CRITICAL_VULNERABILITIES: 0
```

## Test Parallelization

### Intelligent Test Sharding

The system uses intelligent test sharding based on:

- **Test Complexity**: Number of test cases, assertions, and code complexity
- **Execution Time**: Historical execution time data
- **Dependencies**: Test file interdependencies
- **Load Balancing**: Even distribution across available runners

### Usage

```bash
# Run with 4 shards (default)
node scripts/test-parallel-execution.js

# Custom configuration
node scripts/test-parallel-execution.js --shards 8 --workers 4 --timeout 60000

# CI integration
npm run test:ci-parallel
```

### Caching Strategy

- **Dependency Caching**: Node modules cached based on lockfile hash
- **Test Caching**: Test results cached for unchanged files
- **Coverage Caching**: Coverage data merged from parallel executions
- **Asset Caching**: Build artifacts cached between test stages

## Test Data Management

### Database Schema

The test database includes:

- **Test Users**: Customer, provider, and admin accounts
- **Test Services**: Beauty and fitness service definitions
- **Test Availability**: Time slots and scheduling data
- **Test Bookings**: Booking records and payment data
- **Audit Logging**: Complete audit trail for test data changes

### Data Isolation

- **Schema Isolation**: Separate test schemas for different test suites
- **Transaction Rollback**: Automatic cleanup after each test
- **Database Snapshots**: Pre-test snapshots for quick restoration
- **Data Seeding**: Consistent test data across test runs

### Usage Examples

```bash
# Setup test environment
node scripts/test-data-manager.js setup

# Create test isolation for specific suite
node scripts/test-data-manager.js isolation --suite booking-flow

# Verify data integrity
node scripts/test-data-manager.js verify

# Reset to clean state
node scripts/test-data-manager.js reset
```

## Mock Services

### Available Mocks

1. **Supabase Mock** (`SupabaseMockService`)
   - Database operations (CRUD)
   - Authentication flows
   - File storage operations
   - Real-time subscriptions

2. **Stripe Mock** (`StripeMockService`)
   - Payment intent creation
   - Customer management
   - Price and product management
   - Webhook event simulation

3. **Booksy Mock** (`BooksyMockService`)
   - Availability checking
   - Appointment booking
   - Service management
   - Calendar synchronization

4. **Email Mock** (`EmailMockService`)
   - Email sending simulation
   - Template rendering
   - Delivery tracking
   - Email validation

### Usage in Tests

```typescript
import { setupMocks, cleanupMocks } from '@/mocks/services/mockServiceFactory';

describe('Booking Flow', () => {
  let mocks;

  beforeEach(() => {
    mocks = setupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  it('should create a booking', async () => {
    // Use mocked Supabase client
    const { data } = await mocks.supabase
      .from('bookings')
      .insert(mockBookingData)
      .select()
      .single();

    expect(data).toBeDefined();
  });
});
```

## Performance Testing

### Lighthouse CI Configuration

The Lighthouse CI setup includes:

- **Multi-page Testing**: All major application pages
- **Performance Budgets**: Bundle size and loading time limits
- **Core Web Vitals**: LCP, FID, CLS monitoring
- **Accessibility Testing**: WCAG AA compliance checking
- **SEO Validation**: Search engine optimization checks

### Performance Budgets

```javascript
// lighthouserc.js
budgets: [
  {
    path: '/*',
    resourceSizes: [
      { resourceType: 'script', budget: 300000 },
      { resourceType: 'total', budget: 1000000 }
    ],
    timingBudgets: [
      { metric: 'interactive', budget: 5000 },
      { metric: 'first-contentful-paint', budget: 2000 },
      { metric: 'largest-contentful-paint', budget: 2500 }
    ]
  }
]
```

### Running Performance Tests

```bash
# Local performance testing
lhci autorun

# Docker-based performance testing
docker-compose -f docker-compose.test.yml up lighthouse-test

# Performance monitoring dashboard
# Available at http://localhost:9009
```

## Security Testing

### Security Scans

1. **Dependency Scanning** (Snyk)
   - Known vulnerability detection
   - License compliance checking
   - Automated dependency updates

2. **Static Analysis** (CodeQL)
   - Code security patterns
   - Data flow analysis
   - Injection vulnerability detection

3. **Dynamic Analysis** (OWASP ZAP)
   - Web application security testing
   - API endpoint scanning
   - Authentication and authorization testing

4. **Secrets Detection** (TruffleHog)
   - Hardcoded secrets detection
   - API key scanning
   - Credential leak prevention

### Security Configuration

```bash
# Run security scans
npm run security-audit

# Snyk scanning
snyk test --json > security-reports/snyk-results.json

# OWASP ZAP scanning
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -J security-reports/zap-report.json
```

## Monitoring and Alerting

### Metrics Tracked

- **Test Execution Metrics**: Pass rates, execution times, flaky tests
- **Coverage Metrics**: Line, branch, function, statement coverage
- **Performance Metrics**: Lighthouse scores, Core Web Vitals
- **Security Metrics**: Vulnerability counts, risk scores
- **Quality Metrics**: Code quality scores, technical debt

### Alert Configuration

Alerts are triggered for:

- **High Failure Rates**: >10% test failure rate
- **Low Coverage**: <85% code coverage
- **Performance Regression**: <90 Lighthouse score
- **Security Issues**: Any critical vulnerabilities
- **Execution Time**: >10 minute total execution time

### Monitoring Dashboard

```bash
# Generate comprehensive report
npm run test:monitor

# View HTML report
open test-results/comprehensive-report.html

# Monitor trends
# Reports include historical trend analysis
```

## Docker Test Environment

### Services Included

- **PostgreSQL**: Test database with seeded data
- **Redis**: Caching and session storage
- **Supabase**: Local Supabase instance
- **Application**: Test application build
- **Playwright**: E2E testing environment
- **Lighthouse**: Performance testing
- **ZAP**: Security scanning

### Usage

```bash
# Start complete test environment
docker-compose -f docker-compose.test.yml up -d

# Run specific services
docker-compose -f docker-compose.test.yml up postgres-test redis-test

# View logs
docker-compose -f docker-compose.test.yml logs -f app-test

# Clean up environment
docker-compose -f docker-compose.test.yml down -v
```

## Best Practices

### Test Organization

1. **Unit Tests**: Fast, isolated component tests
2. **Integration Tests**: API and database integration
3. **E2E Tests**: Full user journey testing
4. **Performance Tests**: Application performance validation
5. **Security Tests**: Vulnerability and compliance testing

### Test Writing Guidelines

1. **Descriptive Names**: Clear, descriptive test names
2. **Arrange-Act-Assert**: Structured test organization
3. **Test Isolation**: Independent test execution
4. **Mock Usage**: Proper mocking of external dependencies
5. **Assertion Quality**: Meaningful and comprehensive assertions

### CI/CD Best Practices

1. **Fast Feedback**: Quick failure detection
2. **Parallel Execution**: Optimize for speed
3. **Caching**: Reduce redundant work
4. **Quality Gates**: Prevent low-quality code
5. **Monitoring**: Track trends and regressions

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout values
2. **Database Connection**: Check database service status
3. **Mock Failures**: Verify mock configuration
4. **Coverage Issues**: Check test coverage thresholds
5. **Docker Issues**: Verify Docker configuration

### Debug Commands

```bash
# Debug test execution
npm run test:debug

# Check test environment
npm run test:health

# Analyze test results
npm run test:analyze

# Clean test environment
npm run test:clean
```

## Contributing

When adding new tests or modifying the test automation system:

1. **Update Documentation**: Keep README files current
2. **Add Test Cases**: Ensure adequate test coverage
3. **Update Configuration**: Modify quality gates as needed
4. **Test Locally**: Verify changes before committing
5. **Monitor Impact**: Check for performance regressions

## Support

For questions or issues with the test automation system:

1. Check this documentation
2. Review GitHub Actions logs
3. Examine test reports in artifacts
4. Check monitoring dashboard
5. Contact the development team

---

This comprehensive test automation system ensures reliable, fast, and high-quality deployments for the Mariia Hub platform while maintaining the luxury quality standards expected by our premium beauty and fitness clients.