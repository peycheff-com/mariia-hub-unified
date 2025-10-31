# Testing Infrastructure

This directory contains the comprehensive testing infrastructure for mariiaborysevych, designed to achieve 90% test coverage with robust unit, integration, and end-to-end testing.

## 📁 Directory Structure

```
src/test/
├── README.md                     # This file
├── setup-global.ts              # Global test setup and mocks
├── setup.ts                     # Basic test setup
├── setup-vitest.ts              # Vitest-specific setup
├── setup-a11y.ts                # Accessibility testing setup
├── factories/                   # Test data factories
│   ├── index.ts                 # Basic factories
│   └── extended-factories.ts    # Extended factories with realistic data
├── utils/                       # Test utilities and helpers
│   ├── test-utils.tsx           # React testing utilities
│   ├── comprehensive-test-utils.tsx  # Advanced testing helpers
│   ├── custom-matchers.ts       # Custom Jest/Vitest matchers
│   └── api-test-helpers.ts      # API testing utilities
└── mocks/                       # Mock implementations
    └── services.mock.ts         # External service mocks
```

## 🚀 Quick Start

### Running Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run accessibility tests
npm run test:a11y

# Run visual regression tests
npm run test:e2e:visual
```

### Writing Your First Test

```typescript
import { renderWithProviders, screen } from '@/test/utils/comprehensive-test-utils';
import { createService } from '@/test/factories/extended-factories';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders service information correctly', () => {
    const mockService = createService({
      title: 'Lash Enhancement',
      price: 200,
    });

    renderWithProviders(<MyComponent service={mockService} />);

    expect(screen.getByText('Lash Enhancement')).toBeInTheDocument();
    expect(screen.getByText('200 PLN')).toBeInTheDocument();
  });
});
```

## 🔧 Configuration

### Vitest Configuration

The Vitest configuration is in `vitest.config.ts` and includes:

- **Environment**: jsdom for DOM testing
- **Coverage**: 90% threshold for all metrics
- **Setup Files**: Global setup, custom matchers, and mocks
- **Test Sharding**: Parallel execution in CI
- **Reporters**: JSON for CI, verbose and HTML for local

### Playwright Configuration

The Playwright configuration is in `playwright.config.ts` and includes:

- **Browsers**: Chromium, Firefox, WebKit, and mobile variants
- **Test Directory**: `tests/e2e/`
- **Timeouts**: Optimized for reliable test execution
- **Screenshots**: On failure for debugging
- **Reporting**: JSON for CI, HTML for local

## 📊 Test Data Factories

### Basic Factories (`factories/index.ts`)

```typescript
import { createService, createBooking, createProfile } from '@/test/factories';

// Create a single service
const service = createService({ category: 'beauty' });

// Create multiple bookings
const bookings = createBookings(10, { status: 'confirmed' });
```

### Extended Factories (`factories/extended-factories.ts`)

More realistic data with comprehensive fields:

```typescript
import { createExtendedService, createBookingFlowScenario } from '@/test/factories/extended-factories';

// Create a detailed service
const service = createExtendedService({
  category: 'beauty',
  service_type: 'individual',
  booking_settings: {
    advance_notice: 48,
    cancellation_policy: 24,
  },
});

// Create booking flow scenario
const scenario = createBookingFlowScenario('new-client');
```

## 🛠️ Test Utilities

### Component Testing (`utils/comprehensive-test-utils.tsx`)

```typescript
import { renderComponentForTesting } from '@/test/utils/comprehensive-test-utils';

describe('Booking Flow', () => {
  it('completes booking flow successfully', async () => {
    const helper = renderComponentForTesting(<BookingWizard />);

    await helper.selectService('Lash Enhancement');
    await helper.selectDateTime('2024-01-01', '10:00');
    await helper.fillClientInfo({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+48123456789',
    });
    await helper.completeBooking();

    helper.expectElementToExist('booking-confirmed');
  });
});
```

### API Testing (`utils/api-test-helpers.ts`)

```typescript
import { createServiceApiMock, testApiCall } from '@/test/utils/api-test-helpers';

describe('Service API', () => {
  it('fetches services successfully', async () => {
    const mockApi = createServiceApiMock();

    await testApiCall(
      () => mockApi.getServices(),
      200,
      expect.arrayContaining([
        expect.objectContaining({ id: expect.any(String) })
      ])
    );
  });
});
```

### Custom Matchers (`utils/custom-matchers.ts`)

```typescript
import { expect } from 'vitest';

expect(email).toBeValidEmail();
expect(phoneNumber).toBeValidPhoneNumber('PL');
expect(date).toBeValidISODate();
expect(uuid).toBeValidUUID();
expect(url).toHaveValidURL({ protocol: 'https' });
```

## 🎭 Mocks

### Service Mocks (`mocks/services.mock.ts`)

Complete mocks for all external services:

```typescript
import { setupAllMocks } from '@/test/mocks/services.mock';

// Setup all mocks in your test file
beforeEach(() => {
  setupAllMocks();
});
```

Available mocks:
- **Supabase**: Database, auth, storage, functions
- **Stripe**: Payments, checkout, payment methods
- **Booksy**: External booking system
- **Google Analytics**: Event tracking
- **Email/SMS**: Notification services
- **Webhooks**: Incoming webhook handlers

## 🦽 Accessibility Testing

### Basic Accessibility Test

```typescript
import { checkAccessibility } from '@/test/setup-a11y';

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  await checkAccessibility(container);
});
```

### Advanced Accessibility Tests

```typescript
import {
  testFocusableElements,
  testHeadingHierarchy,
  testFormLabels,
} from '@/test/setup-a11y';

it('meets accessibility standards', async () => {
  const { container } = render(<MyComponent />);

  await testFocusableElements(container);
  await testHeadingHierarchy(container);
  await testFormLabels(container);
});
```

## 📸 Visual Regression Testing

### Basic Visual Test

```typescript
import { test, expect } from '@playwright/test';
import { VisualRegression } from '@/tests/e2e/utils/visual-regression';

test('hero section visual regression', async ({ page }) => {
  await page.goto('/');
  const visualTesting = new VisualRegression(page);

  const result = await visualTesting.compareWithBaseline('hero-section', {
    selector: '[data-testid="hero-section"]',
    threshold: 0.1,
  });

  expect(result.passed).toBe(true);
});
```

### Responsive Visual Testing

```typescript
test('responsive design', async ({ page }) => {
  await page.goto('/');
  const visualTesting = new VisualRegression(page);

  const results = await visualTesting.testResponsiveViewports('booking-page');

  results.forEach(result => {
    expect(result.passed).toBe(true);
  });
});
```

## 📈 Coverage

The project aims for 90% test coverage across all metrics:

- **Statements**: 90%
- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

## 🎯 Best Practices

### 1. Test Organization

- Group related tests in `describe` blocks
- Use descriptive test names (`it('should...')`)
- Test one behavior per test
- Use `beforeEach`/`afterEach` for setup/teardown

### 2. Test Data

- Use factories for test data
- Avoid hardcoded values
- Use realistic data that matches production
- Keep test data independent between tests

### 3. Async Testing

- Use `await` for all async operations
- Use `waitFor` for elements that appear asynchronously
- Test loading and error states
- Use `vi.useFakeTimers()` for time-based tests

### 4. Component Testing

- Test user interactions, not implementation details
- Test component behavior, not props
- Use meaningful queries (`getByRole`, `getByLabelText`)
- Test accessibility alongside functionality

### 5. API Testing

- Mock external dependencies
- Test both success and error scenarios
- Validate request/response shapes
- Test edge cases and error handling

## 🐛 Debugging

### Debugging Tests

```typescript
// Use screen.debug() to print the DOM
screen.debug();

// Use .logTestingPlaywrightDebugURL() in Playwright
await page.logTestingPlaywrightDebugURL();

// Pause test execution
await page.pause();

// Take screenshot
await page.screenshot({ path: 'debug.png' });
```

### Common Issues

1. **Act warnings**: Use `act()` from React testing utils
2. **Timer issues**: Use `vi.useFakeTimers()`
3. **Mock not working**: Check mock setup and call order
4. **Async test timing**: Use `waitFor` instead of fixed timeouts

## 📝 Example Test Suite

Here's a complete example of a test suite for a booking component:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderComponentForTesting } from '@/test/utils/comprehensive-test-utils';
import { createService, createBooking } from '@/test/factories/extended-factories';
import { createServiceApiMock } from '@/test/utils/api-test-helpers';
import { BookingComponent } from '@/components/BookingComponent';

describe('BookingComponent', () => {
  const mockService = createService({
    id: 'test-service',
    title: 'Lash Enhancement',
    price: 200,
    duration: 60,
  });

  const mockApi = createServiceApiMock();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders service information', () => {
    const helper = renderComponentForTesting(
      <BookingComponent service={mockService} />
    );

    helper.expectElementToHaveText('service-title', 'Lash Enhancement');
    helper.expectElementToHaveText('service-price', '200 PLN');
    helper.expectElementToHaveText('service-duration', '60 min');
  });

  it('allows selecting a time slot', async () => {
    const helper = renderComponentForTesting(
      <BookingComponent service={mockService} />
    );

    await helper.clickButton('10:00');
    helper.expectElementToHaveText('selected-time', '10:00');
  });

  it('submits booking successfully', async () => {
    const helper = renderComponentForTesting(
      <BookingComponent service={mockService} />
    );

    await helper.fillForm({
      'Name': 'John Doe',
      'Email': 'john@example.com',
      'Phone': '+48123456789',
    });
    await helper.clickButton('Book Now');

    await helper.waitForElement('booking-success');
    expect(mockApi.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        service_id: 'test-service',
        client_name: 'John Doe',
      })
    );
  });

  it('shows validation errors for invalid email', async () => {
    const helper = renderComponentForTesting(
      <BookingComponent service={mockService} />
    );

    await helper.typeText('Email', 'invalid-email');
    await helper.clickButton('Book Now');

    helper.expectElementToExist('email-error');
    helper.expectElementToHaveText('email-error', 'Please enter a valid email');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <BookingComponent service={mockService} />
    );
    await checkAccessibility(container);
  });
});
```

## 🔗 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Axe Core Documentation](https://www.deque.com/axe/)
- [Jest Matchers Documentation](https://jestjs.io/docs/expect)

## 📞 Support

If you need help with testing:

1. Check existing tests in `src/**/__tests__/` and `tests/`
2. Review this documentation
3. Check the Vitest and Playwright documentation
4. Ask for help in the team's communication channel