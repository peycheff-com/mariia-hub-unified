# E2E Testing Guide - Critical User Journeys

This guide provides comprehensive documentation for the End-to-End (E2E) testing implementation for the Mariia Hub platform.

## 🎯 Overview

The E2E test suite validates the most critical user journeys that drive business value for the Mariia Hub beauty and fitness booking platform. With **71 comprehensive test scenarios** across 4 major user journeys, we ensure exceptional user experience and platform reliability.

## 📊 Test Coverage Summary

| Journey Category | Test Scenarios | Key Features Tested |
|-----------------|----------------|-------------------|
| **Complete Booking Flow** | 13 tests | Beauty & fitness booking, Polish phone validation, payment processing |
| **Package Purchase Journey** | 18 tests | Package discovery, purchase, session management, mobile experience |
| **User Registration & Profile** | 18 tests | Registration with verification, profile management, consent handling |
| **Admin Dashboard** | 22 tests | Service management, booking overview, analytics, user management |
| **Total** | **71 tests** | **Complete platform coverage** |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Playwright browsers installed

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install system dependencies (for Linux)
npx playwright install-deps
```

### Running Tests

```bash
# Run all critical journey tests
npm run test:e2e

# Run specific test suites
npm run test:e2e -- --grep "BE-"      # Beauty booking tests
npm run test:e2e -- --grep "FT-"      # Fitness booking tests
npm run test:e2e -- --grep "PKG-"     # Package tests
npm run test:e2e -- --grep "UR-"      # User registration tests
npm run test:e2e -- --grep "AD-"      # Admin dashboard tests

# Run tests in headed mode (visible browser)
npm run test:e2e:debug

# Run tests with UI
npm run test:e2e:ui

# Run visual regression tests
npm run test:e2e -- --grep "visual"

# Run performance tests
npm run test:e2e -- --grep "performance|PR-"
```

## 🎯 Critical User Journeys

### 1. Complete Booking Flow (BE-XXX, FT-XXX)

**Objective**: Validate the complete booking experience from service selection to payment confirmation.

**Key Test Scenarios**:
- **BE-001**: Complete beauty service booking (Happy Path)
- **BE-002**: Polish phone number format validation
- **BE-003**: Booking error scenarios and validation
- **BE-004**: Multiple payment methods
- **FT-001**: Complete fitness service booking
- **FT-002**: Fitness booking with package sessions
- **CP-001**: Mobile booking experience
- **PR-001**: Booking performance validation

**Validated Features**:
- ✅ Polish phone number formats (+48 123 456 789, +48 123-456-789, etc.)
- ✅ 4-step booking wizard (Service → Time → Details → Payment)
- ✅ Real-time slot availability and reservation
- ✅ Payment processing with Stripe integration
- ✅ Email confirmation workflow
- ✅ Mobile-responsive booking flow
- ✅ Cross-browser compatibility

### 2. Package Purchase Journey (PKG-XXX)

**Objective**: Ensure seamless package discovery, purchase, and session management.

**Key Test Scenarios**:
- **PKG-001**: Package discovery and browsing
- **PKG-002**: Package filtering and sorting
- **PKG-003**: Package comparison features
- **PKG-004**: Complete beauty package purchase
- **PKG-005**: Complete fitness package purchase
- **PKG-006**: Different payment methods
- **PKG-008**: Package session usage for bookings
- **PKG-009**: Session balance management
- **PKG-012**: Package benefits display
- **PKG-013**: Package gifting functionality

**Validated Features**:
- ✅ Package filtering by type (beauty/fitness)
- ✅ Package comparison tools
- ✅ Multi-payment method support
- ✅ Session balance tracking
- ✅ Package expiration handling
- ✅ Mobile package management
- ✅ Package gifting and sharing

### 3. User Registration & Profile Management (UR-XXX, UL-XXX, PM-XXX)

**Objective**: Validate user onboarding, profile management, and account security.

**Key Test Scenarios**:
- **UR-001**: Complete user registration (Happy Path)
- **UR-002**: Polish phone validation in registration
- **UR-003**: Registration validation and error handling
- **UR-004**: Different consent preferences
- **UL-001**: Successful user login
- **UL-002**: Login validation and error handling
- **UL-003**: Password reset flow
- **PM-001**: Profile information updates
- **PM-002**: Preferences and consent management
- **PM-004**: Booking history view
- **AS-001**: Password change functionality
- **AS-002**: Two-factor authentication

**Validated Features**:
- ✅ Email and phone verification workflows
- ✅ Polish phone number validation
- ✅ GDPR compliance and consent management
- ✅ Profile picture upload
- ✅ Booking history tracking
- ✅ Account security features
- ✅ Mobile profile management

### 4. Admin Dashboard Functionality (AD-XXX, SM-XXX, BM-XXX, etc.)

**Objective**: Ensure comprehensive admin tools for service, booking, and user management.

**Key Test Scenarios**:
- **AD-001**: Admin login and dashboard access
- **AD-002**: Admin permissions and access control
- **SM-001**: Create new beauty service
- **SM-002**: Update existing service
- **SM-003**: Delete service
- **BM-001**: View and manage bookings
- **BM-002**: Booking filtering and search
- **UM-001**: View and manage users
- **AR-001**: Analytics dashboard
- **SC-001**: System settings management

**Validated Features**:
- ✅ Admin authentication and authorization
- ✅ Service CRUD operations
- ✅ Booking management and status updates
- ✅ User management and role assignment
- ✅ Analytics and reporting
- ✅ Data export functionality
- ✅ System configuration

## 🧪 Test Data Management

### Test Data Factory

The `TestDataFactory` class provides standardized test data:

```typescript
import { TestDataFactory, PolishPhoneNumbers } from '../utils/test-data';

// Create test users
const user = TestDataFactory.createTestUser({
  name: 'Anna Nowak',
  phone: '+48 512 345 678'
});

// Polish phone number validation
for (const phone of PolishPhoneNumbers.valid) {
  // Test validation logic
}
```

### Test Data Cleanup

Automatic cleanup ensures test isolation:

```typescript
import { TestDataManager } from '../utils/test-data';

const testDataManager = new TestDataManager(context);

// Create test data
const user = await testDataManager.createUser();

// Automatic cleanup after test
await testDataManager.cleanup();
```

## 📱 Mobile Testing

### Viewport Testing

Tests automatically run on multiple mobile viewports:

- iPhone SE (375x667)
- iPhone 12 (390x844)
- iPhone 11 (414x896)

### Mobile-Specific Features

- Touch interactions and gestures
- Mobile navigation patterns
- Responsive form layouts
- Mobile payment flows

## 🌐 Cross-Browser Testing

### Supported Browsers

- **Chromium** (Chrome-based)
- **Firefox**
- **WebKit** (Safari)
- **Mobile Chrome** (Android)
- **Mobile Safari** (iOS)

### Browser-Specific Testing

```bash
# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## ⚡ Performance Testing

### Performance Metrics

- **First Contentful Paint (FCP)**: < 2 seconds
- **Booking Flow Completion**: < 30 seconds
- **Package Purchase**: < 45 seconds
- **Admin Dashboard Load**: < 5 seconds

### Performance Test Tags

Use `PR-` prefix for performance tests:

```bash
npx playwright test --grep "PR-"
```

## 🔐 Security Testing

### Security Features Tested

- Admin authentication and authorization
- Password strength validation
- Session management
- CSRF protection
- Input validation and sanitization
- GDPR compliance

### Security Test Tags

Use `AS-` prefix for security tests:

```bash
npx playwright test --grep "AS-"
```

## 🌍 Polish Market Specific Testing

### Phone Number Validation

Validates Polish phone number formats:

```typescript
const PolishPhoneNumbers = {
  valid: [
    '+48 123 456 789',    // International format
    '+48 123-456-789',    // With dashes
    '+48123456789',       // No separators
    '123 456 789',        // Local format
    '123-456-789',        // Local with dashes
    '123456789',          // Local no separators
  ],
  invalid: [
    '+48 123 456 78',     // Too short
    '+48 123 456 7890',   // Too long
    '+33 123 456 789',    // Wrong country code
  ]
};
```

### Localization Testing

- Polish language interface
- Polish currency (PLN) handling
- Polish address formats
- Local payment methods

## 🚀 CI/CD Integration

### GitHub Actions Workflow

The E2E tests run automatically on:

- **Push to main/develop**: Full test suite
- **Pull Requests**: Critical journey tests
- **Daily Schedule**: Comprehensive testing at 2 AM UTC
- **Manual Dispatch**: On-demand testing

### Test Execution Strategy

```yaml
# Parallel execution across 4 shards
strategy:
  matrix:
    shard: [1, 2, 3, 4]

# Specialized test jobs
- critical-journeys    # Main user journeys
- visual-regression    # UI consistency
- performance-tests    # Performance validation
- cross-browser-tests  # Browser compatibility
- security-tests       # Security validation
```

### Environment Configuration

```bash
# Development
BASE_URL=http://localhost:8080
TEST_ENVIRONMENT=development

# Staging (CI)
BASE_URL=https://staging.mariia-hub.com
TEST_ENVIRONMENT=staging

# Production (scheduled tests)
BASE_URL=https://mariia-hub.com
TEST_ENVIRONMENT=production
```

## 📊 Test Reporting

### HTML Reports

```bash
# Generate HTML report
npm run test:e2e -- --reporter=html

# View report
open playwright-report/index.html
```

### JSON Reports

```bash
# Generate JSON for CI integration
npm run test:e2e:ci
```

### Screenshot and Video Evidence

- **Screenshots**: Automatic on test failure
- **Videos**: Record test execution for debugging
- **Traces**: Detailed performance analysis

## 🛠️ Test Helpers and Utilities

### BookingHelpers

```typescript
import { BookingHelpers } from '../utils/booking-helpers';

const bookingHelpers = new BookingHelpers(page);

// Complete beauty service booking
await bookingHelpers.bookBeautyService({
  serviceName: 'Beauty Brows Enhancement',
  userName: 'Test User',
  userEmail: 'test@example.com',
  userPhone: '+48 123 456 789'
});
```

### PackageHelpers

```typescript
import { PackageHelpers } from '../utils/package-helpers';

const packageHelpers = new PackageHelpers(page);

// Purchase package
await packageHelpers.purchasePackage({
  packageName: 'Beauty Package 5 Sessions',
  packageType: 'beauty',
  userName: 'Test User'
});
```

### UserHelpers

```typescript
import { UserHelpers } from '../utils/user-helpers';

const userHelpers = new UserHelpers(page);

// Register new user
await userHelpers.registerUser({
  name: 'Test User',
  email: 'test@example.com',
  phone: '+48 123 456 789'
});
```

### AdminHelpers

```typescript
import { AdminHelpers } from '../utils/admin-helpers';

const adminHelpers = new AdminHelpers(page);

// Login as admin
await adminHelpers.loginAsAdmin();

// Create service
await adminHelpers.createService({
  name: 'New Beauty Service',
  type: 'beauty',
  price: 450,
  duration: 90
});
```

## 🔧 Debugging and Troubleshooting

### Debug Mode

```bash
# Run tests with visible browser
npm run test:e2e:debug

# Run with Playwright Inspector
npx playwright test --debug
```

### Common Issues

1. **Application not running**
   ```bash
   # Start development server
   npm run dev
   ```

2. **Browser not installed**
   ```bash
   # Install browsers
   npx playwright install
   ```

3. **Test flakiness**
   - Increase timeouts in `playwright.config.ts`
   - Use `page.waitForTimeout()` for dynamic content
   - Check for race conditions in async operations

4. **Mobile test failures**
   - Verify responsive design
   - Check touch target sizes
   - Ensure mobile navigation works

### Test Best Practices

1. **Use test data factories** for consistent test data
2. **Clean up test data** after each test
3. **Use descriptive test names** with journey prefixes
4. **Add assertions** for all critical user actions
5. **Test error scenarios** and edge cases
6. **Include accessibility** and performance validation
7. **Use proper waits** instead of fixed timeouts
8. **Mock external services** when possible

## 📈 Test Metrics and Success Criteria

### Success Metrics

- **Test Coverage**: 71 comprehensive E2E scenarios
- **Pass Rate**: > 95% on main branch
- **Performance**: All booking flows under 30 seconds
- **Cross-Browser**: Tests pass on Chromium, Firefox, WebKit
- **Mobile**: All critical flows work on mobile devices

### Quality Gates

- ✅ All critical booking journeys must pass
- ✅ Polish phone number validation must work
- ✅ Payment processing must be functional
- ✅ Admin dashboard must be accessible
- ✅ Mobile experience must be optimal

## 🚀 Future Enhancements

### Planned Improvements

1. **Visual Regression Testing**
   - Automated screenshot comparison
   - Cross-browser visual consistency
   - Mobile layout validation

2. **API Testing Integration**
   - Backend API validation
   - Database state verification
   - Performance metrics collection

3. **Accessibility Testing**
   - WCAG compliance validation
   - Screen reader testing
   - Keyboard navigation testing

4. **Load Testing Integration**
   - Multiple concurrent users
   - Stress testing booking flows
   - Performance under load

5. **Advanced Analytics**
   - User journey tracking
   - Conversion funnel validation
   - Performance benchmarking

## 📞 Support and Maintenance

### Getting Help

1. **Check test logs** in `test-results/` directory
2. **Review HTML reports** in `playwright-report/`
3. **Examine screenshots** for visual debugging
4. **Check CI/CD logs** for pipeline issues

### Maintaining Tests

1. **Update selectors** when UI changes
2. **Add new test scenarios** for new features
3. **Update test data** when business rules change
4. **Monitor test performance** and flakiness
5. **Regular maintenance** of test dependencies

---

## 🎉 Conclusion

This comprehensive E2E testing implementation ensures the Mariia Hub platform delivers exceptional user experiences across all critical journeys. With **71 test scenarios** covering booking, packages, user management, and admin functionality, we can confidently deploy changes knowing they won't impact the core user experience.

The tests are specifically designed for the **Polish beauty and fitness market**, with extensive validation of Polish phone numbers, local payment methods, and market-specific user behaviors.

**Key Achievements**:
- ✅ Complete coverage of critical user journeys
- ✅ Polish market validation
- ✅ Mobile-first testing approach
- ✅ Cross-browser compatibility
- ✅ Performance validation
- ✅ CI/CD integration
- ✅ Maintainable test architecture

The E2E test suite is now ready for production deployment and will serve as the foundation for ensuring continued platform quality and user satisfaction.