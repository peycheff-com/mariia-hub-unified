# Testing Playbook for New Developers

Welcome to the Mariia Hub testing playbook! This guide will help you get started with testing in this React/TypeScript booking platform.

## 🚀 Quick Start

### 1. Running Tests
```bash
# Run all tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test Step2Time.test.tsx

# Run tests matching a pattern
npm run test -- --grep "booking"
```

### 2. Running E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e booking.spec.ts

# Run E2E tests in headed mode (with browser window)
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug
```

### 3. Your First Test
Let's create a simple component test:

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

## 📁 Understanding the Test Structure

### File Locations
```
src/
├── test/                      # Global test utilities and setup
│   ├── setup-vitest.ts        # Global test configuration
│   └── utils/                # Reusable test helpers
├── components/
│   └── __tests__/            # Component tests live with their components
├── services/
│   └── __tests__/            # Service layer tests
├── lib/
│   └── __tests__/            # Utility function tests
└── pages/
    └── __tests__/            # Page-level tests
```

### Test Files Naming
- `ComponentName.test.tsx` for React components
- `serviceName.test.ts` for services/utilities
- `featureName.spec.ts` for Playwright E2E tests

## 🧩 Common Testing Patterns

### Pattern 1: Basic Component Test
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import { BookingButton } from '../BookingButton';

describe('BookingButton', () => {
  it('shows loading state during booking', async () => {
    const onBook = vi.fn();
    render(<BookingButton onBook={onBook} loading={false} />);

    const button = screen.getByRole('button', { name: /book now/i });
    await userEvent.click(button);

    expect(onBook).toHaveBeenCalledTimes(1);
  });
});
```

### Pattern 2: Testing with Mocks
```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { BookingService } from '../booking.service';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client');

describe('BookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates booking successfully', async () => {
    const mockBooking = { serviceId: 'svc_1', clientId: 'client_1' };

    // Mock successful API call
    mockApiSuccess(supabase.from().insert, { id: 'booking_1' });

    const result = await BookingService.create(mockBooking);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('booking_1');
  });
});
```

### Pattern 3: Form Testing
```typescript
import { renderComponentForTesting } from '@/test/utils/comprehensive-test-utils';
import { BookingForm } from '../BookingForm';

describe('BookingForm', () => {
  it('validates required fields', async () => {
    const helper = renderComponentForTesting(<BookingForm />);

    await helper.clickButton('Submit');

    // Check for error messages
    helper.expectElementToHaveText('name-error', 'Name is required');
    helper.expectElementToHaveText('email-error', 'Email is required');
  });

  it('submits valid form data', async () => {
    const helper = renderComponentForTesting(<BookingForm />);

    await helper.fillForm({
      'Name': 'John Doe',
      'Email': 'john@example.com',
      'Phone': '+48 123 456 789',
    });

    await helper.clickButton('Submit');

    helper.expectElementToExist('booking-success');
  });
});
```

### Pattern 4: Booking Flow Testing
```typescript
import { BookingFlowTestHelper } from '@/test/utils/comprehensive-test-utils';
import { BookingWizard } from '../BookingWizard';

describe('Booking Wizard Flow', () => {
  it('completes full booking flow', async () => {
    const helper = renderComponentForTesting(<BookingWizard />);

    // Step 1: Select service
    await helper.selectService('Lash Enhancement');
    await helper.proceedToNextStep();

    // Step 2: Select time slot
    await helper.clickButton('10:00 AM');
    await helper.proceedToNextStep();

    // Step 3: Fill client info
    await helper.fillClientInfo({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+48 987 654 321',
    });

    // Step 4: Complete booking
    await helper.completeBooking();

    helper.expectElementToExist('booking-confirmed');
  });
});
```

## 🎭 Mocking Guide

### What to Mock
- External APIs (Supabase, Stripe, Booksy)
- Browser APIs (localStorage, fetch)
- Time/Date operations
- Random values

### How to Mock

#### 1. Simple Module Mock
```typescript
// Mock entire module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: { id: '123' } }),
      eq: vi.fn().mockReturnThis(),
    })),
  },
}));
```

#### 2. Partial Mock
```typescript
// Keep some implementation, mock specific functions
import { actualBookingService } from '@/services/booking.service';

vi.mock('@/services/booking.service', () => ({
  BookingService: {
    ...actualBookingService,
    create: vi.fn().mockResolvedValue({ success: true }),
  },
}));
```

#### 3. Dynamic Mock
```typescript
// Create mock you can control in tests
const mockCreateBooking = vi.fn();
vi.mock('@/services/booking.service', () => ({
  BookingService: {
    create: mockCreateBooking,
  },
}));

// In your test
mockCreateBooking.mockResolvedValueOnce({ success: false, error: 'Failed' });
```

#### 4. Browser API Mock
```typescript
// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();
fetch.mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'success' }),
});
```

## 🔧 Test Utilities You Should Know

### renderWithProviders
```typescript
import { renderWithProviders } from '@/test/utils/comprehensive-test-utils';

// Automatically wraps with all necessary providers
renderWithProviders(
  <MyComponent />,
  {
    initialRoute: '/booking',  // Set initial URL
    queryClient: customClient, // Custom query client
  }
);
```

### renderComponentForTesting
```typescript
import { renderComponentForTesting } from '@/test/utils/comprehensive-test-utils';

// Returns helper with booking flow methods
const helper = renderComponentForTesting(<BookingWizard />);
await helper.selectService('Lash Enhancement');
```

### Test Helper Classes

#### ComponentTestHelper
```typescript
const helper = renderComponentForTesting(<MyComponent />);

// Element interaction
await helper.clickButton('Submit');
await helper.typeText('Email', 'test@example.com');

// Assertions
helper.expectElementToExist('success-message');
helper.expectElementToHaveText('title', 'Booking Complete');
```

#### FormValidationTestHelper
```typescript
const helper = renderComponentForTesting(<MyForm />);

// Test form validation
await helper.testRequiredField('Email');
await helper.testInvalidEmail('invalid-email');
await helper.testMinLength('Name', 2);
```

## 📊 Understanding Test Coverage

### Viewing Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Targets
- **Minimum**: 60% across all metrics
- **Goal**: 70% across all metrics
- **Focus**: Business logic and user-critical paths

### What Counts as "Good Coverage"?
```typescript
// ✅ Good - Tests business logic
it('should calculate total price with tax', () => {
  const result = calculateTotal(100, 0.23); // 23% VAT
  expect(result).toBe(123);
});

// ❌ Low value - Tests implementation detail
it('should return the input value', () => {
  const identity = (x) => x;
  expect(identity(5)).toBe(5);
});
```

## 🐛 Common Testing Issues & Solutions

### Issue 1: Test Times Out
```typescript
// ❌ Problem: Fixed timeout
setTimeout(() => {
  expect(element).toBeInTheDocument();
}, 1000);

// ✅ Solution: Use waitFor
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument();
});
```

### Issue 2: Act Warning
```typescript
// ❌ Problem: No user action
expect(screen.getByText('Updated')).toBeInTheDocument();

// ✅ Solution: Use userEvent or fireEvent
import { userEvent } from '@testing-library/user-event';

await userEvent.click(updateButton);
expect(screen.getByText('Updated')).toBeInTheDocument();
```

### Issue 3: Mock Not Working
```typescript
// ❌ Problem: Mock after import
import { service } from './service';
vi.mock('./service', () => ({ service: mockService }));

// ✅ Solution: Mock before import
vi.mock('./service', () => ({ service: mockService }));
import { service } from './service';
```

### Issue 4: Provider Context Missing
```typescript
// ❌ Problem: Component needs context
render(<MyComponent />); // Fails if component needs BookingContext

// ✅ Solution: Use renderWithProviders
renderWithProviders(<MyComponent />);
```

## 🎯 Writing Your First Real Test

Let's say you need to test a new feature: "Group Booking Discount". Here's how to approach it:

### Step 1: Understand the Requirements
- Groups of 3+ people get 10% discount
- Groups of 5+ people get 20% discount
- Individual bookings pay full price

### Step 2: Write the Test First
```typescript
// src/services/__tests__/groupBooking.test.ts
import { describe, it, expect } from 'vitest';
import { GroupBookingService } from '../groupBooking.service';

describe('GroupBookingService - Calculate Discount', () => {
  it('should give 10% discount for groups of 3', () => {
    const result = GroupBookingService.calculateDiscount({
      basePrice: 100,
      groupSize: 3,
    });

    expect(result.discountPercent).toBe(10);
    expect(result.finalPrice).toBe(90);
  });

  it('should give 20% discount for groups of 5', () => {
    const result = GroupBookingService.calculateDiscount({
      basePrice: 100,
      groupSize: 5,
    });

    expect(result.discountPercent).toBe(20);
    expect(result.finalPrice).toBe(80);
  });

  it('should give no discount for individuals', () => {
    const result = GroupBookingService.calculateDiscount({
      basePrice: 100,
      groupSize: 1,
    });

    expect(result.discountPercent).toBe(0);
    expect(result.finalPrice).toBe(100);
  });
});
```

### Step 3: Run the Test (It Should Fail)
```bash
npm run test groupBooking.test.ts
```

### Step 4: Implement Minimum Code to Pass
```typescript
// src/services/groupBooking.service.ts
export const GroupBookingService = {
  calculateDiscount: ({ basePrice, groupSize }) => {
    let discountPercent = 0;

    if (groupSize >= 5) {
      discountPercent = 20;
    } else if (groupSize >= 3) {
      discountPercent = 10;
    }

    return {
      discountPercent,
      finalPrice: basePrice * (1 - discountPercent / 100),
    };
  },
};
```

### Step 5: Refactor if Needed
The implementation is already clean, so we're done!

## 🔄 Testing Workflow

### Daily Development
1. **Start**: Write or update tests for your feature
2. **Run**: `npm run test` to see current state
3. **Code**: Implement or fix code to make tests pass
4. **Verify**: Run tests again to confirm they pass
5. **Check**: Run `npm run test:coverage` to ensure good coverage

### Before Committing
```bash
# Run full test suite
npm run test:ci

# Check coverage
npm run test:coverage

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### After Pushing
- CI will automatically run tests
- Check test results in your pull request
- Address any failing tests before merging

## 📚 Learning Resources

### Internal Documentation
- [Testing Strategy Guide](./TESTING_STRATEGY.md) - Comprehensive testing approach
- [Component Library Documentation](./COMPONENT_LIBRARY.md) - UI component patterns
- Look at existing tests in the codebase for examples

### External Resources
- [Vitest Documentation](https://vitest.dev/) - Our testing framework
- [Testing Library Guides](https://testing-library.com/docs/guides-principles) - Testing best practices
- [React Testing Patterns](https://kentcdodds.com/blog/common-testing-mistakes) - Common pitfalls

### Practice Exercises
1. Add a test to an existing component that's missing coverage
2. Write tests for a new utility function
3. Create a booking flow integration test
4. Add an E2E test for a critical user journey

## 🆘 Getting Help

### Troubleshooting Checklist
- [ ] Are you mocking the right modules?
- [ ] Are you using the correct test utilities?
- [ ] Is your component wrapped in necessary providers?
- [ ] Are you waiting for async operations?
- [ ] Are your selectors robust enough?

### Asking for Help
When asking for help with a test, include:
1. The test code
2. The component/service code being tested
3. The error message
4. What you've tried so far

### Code Review Checklist
When reviewing tests:
- [ ] Does the test add value?
- [ ] Is the test readable and maintainable?
- [ ] Are mocks appropriate?
- [ ] Does the test cover important edge cases?
- [ ] Is the test isolated and not flaky?

## 🎉 Congratulations!

You now have the knowledge to write effective tests for the Mariia Hub platform. Remember:

- Tests are code - make them clean and maintainable
- Focus on testing behavior, not implementation
- Use the provided utilities to make testing easier
- Ask for help when you're stuck
- Practice makes perfect!

Happy testing! 🧪

---

*This playbook evolves with the project. Check back regularly for updates.*