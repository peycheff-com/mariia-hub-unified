# Testing Strategy & Standards

This document outlines the comprehensive testing strategy, standards, and best practices for the Mariia Hub booking platform.

## 🎯 Testing Philosophy

### Core Principles
- **Test-First Development**: Write tests before implementation when possible
- **Coverage with Purpose**: Aim for meaningful coverage, not just numbers
- **Developer Experience**: Tests should be fast, reliable, and easy to understand
- **Business Value**: Tests should protect business logic and user experience
- **Maintainability**: Tests should evolve with the codebase

### Testing Pyramid
```
    E2E Tests (10%)
     ─────────────────
   Integration Tests (20%)
   ─────────────────────────
  Unit Tests (70%)
```

## 🧪 Testing Stack

### Core Technologies
- **Unit Testing**: Vitest + Testing Library + jsdom
- **E2E Testing**: Playwright
- **Component Testing**: Vitest + Testing Library
- **Mocking**: Vitest built-in mocking
- **Coverage**: v8 provider with HTML reports
- **Accessibility**: jest-axe integration
- **Performance**: Custom performance utilities

### Configuration Files
- **Vitest Config**: `vitest.config.ts`
- **Playwright Config**: `playwright.config.ts`
- **Test Setup**: `src/test/setup-vitest.ts`
- **Global Setup**: `src/test/setup-global.ts`

## 📊 Coverage Requirements

### Current Targets
- **Global Coverage**: 60% minimum (working toward 70%)
- **Functions**: 60% minimum
- **Branches**: 60% minimum
- **Lines**: 60% minimum
- **Statements**: 60% minimum

### Coverage Strategy
```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
}
```

## 🏗️ Test Architecture

### File Structure
```
src/
├── test/
│   ├── setup-vitest.ts          # Global test setup
│   ├── setup-global.ts          # Shared test utilities
│   ├── utils/                  # Test helpers and factories
│   │   ├── comprehensive-test-utils.tsx
│   │   ├── test-utils.tsx
│   │   ├── api-test-helpers.ts
│   │   └── custom-matchers.ts
│   ├── mocks/                  # Mock implementations
│   │   └── services.mock.ts
│   └── factories/              # Test data factories
│       ├── index.ts
│       └── extended-factories.ts
├── components/
│   └── __tests__/             # Component tests
├── services/
│   └── __tests__/             # Service tests
├── lib/
│   └── __tests__/             # Utility tests
└── pages/
    └── __tests__/             # Page tests
```

### Test Naming Conventions
```typescript
// ✅ Good
ComponentName.test.tsx
serviceName.test.ts
utilityFunction.test.ts

// ✅ Descriptive test names
describe('BookingFlow - Step2Time', () => {
  it('selects first available slot and calls onComplete', () => {
    // test implementation
  });
});

// ✅ Context-specific describes
describe('when user is authenticated', () => {
  describe('and has active booking', () => {
    it('should show booking details', () => {
      // test implementation
    });
  });
});
```

## 🧩 Component Testing

### Testing Patterns

#### 1. Render with Providers
```typescript
import { renderWithProviders } from '@/test/utils/comprehensive-test-utils';

const renderComponent = (props = {}) => {
  return renderWithProviders(
    <BookingStep serviceId="test" {...props} />,
    {
      initialRoute: '/booking',
    }
  );
};
```

#### 2. Test Helper Classes
```typescript
import { BookingFlowTestHelper } from '@/test/utils/comprehensive-test-utils';

const helper = renderComponentForTesting(<BookingWizard />);
await helper.selectService('Lash Enhancement');
await helper.proceedToNextStep();
```

#### 3. Mock Implementations
```typescript
// Mock external dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

vi.mock('@/hooks/useSlotGeneration', () => ({
  useSlotGeneration: () => mockSlotGeneration,
}));
```

#### 4. Accessibility Testing
```typescript
import { testAccessibility } from '@/test/utils/comprehensive-test-utils';

it('should be accessible', async () => {
  const { container } = renderComponent();
  await testAccessibility(container);
});
```

### Component Testing Checklist
- [ ] Renders without errors
- [ ] Handles required props
- [ ] Handles optional props
- [ ] Updates on prop changes
- [ ] Handles user interactions
- [ ] Shows loading states
- [ ] Shows error states
- [ ] Is accessible (a11y)
- [ ] Is keyboard navigable

## 🔧 Service & Utility Testing

### Service Testing Patterns

#### 1. API Service Testing
```typescript
describe('BookingService', () => {
  it('should create booking successfully', async () => {
    const mockBooking = { serviceId: 'svc_1', clientId: 'client_1' };
    mockApiSuccess(mockSupabase.from().insert, { id: 'booking_1' });

    const result = await BookingService.create(mockBooking);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('booking_1');
  });
});
```

#### 2. Error Handling
```typescript
it('should handle API errors gracefully', async () => {
  mockApiError(mockSupabase.from().insert, 'Database error');

  const result = await BookingService.create(invalidBooking);

  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
});
```

#### 3. Utility Function Testing
```typescript
describe('formatPrice', () => {
  it('should format PLN prices correctly', () => {
    expect(formatPrice(100, 'PLN')).toBe('100 zł');
  });

  it('should handle zero prices', () => {
    expect(formatPrice(0, 'PLN')).toBe('0 zł');
  });
});
```

## 🎭 E2E Testing with Playwright

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete booking journey', async ({ page }) => {
    // Step 1: Select service
    await page.click('[data-testid="service-lash-enhancement"]');
    await page.click('[data-testid="next-step"]');

    // Step 2: Select time
    await page.click('[data-testid="time-slot-10:00"]');
    await page.click('[data-testid="next-step"]');

    // Step 3: Fill details
    await page.fill('[data-testid="client-name"]', 'John Doe');
    await page.fill('[data-testid="client-email"]', 'john@example.com');
    await page.click('[data-testid="confirm-booking"]');

    // Verify success
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
  });
});
```

### E2E Best Practices
- Use data-testid for reliable element selection
- Wait for elements instead of using fixed timeouts
- Test happy paths and critical error paths
- Use page objects for complex interactions
- Run tests in multiple viewports and browsers

## 🔄 Test-First Development Workflow

### RED-GREEN-REFACTOR Cycle

#### 1. RED - Write Failing Test
```typescript
// First, write the test that fails
describe('BookingService', () => {
  it('should calculate booking duration correctly', () => {
    const service = { duration: 60, bufferTime: 15 };
    const result = BookingService.calculateDuration(service);
    expect(result).toBe(75); // This will fail initially
  });
});
```

#### 2. GREEN - Make Test Pass
```typescript
// Minimal implementation to make test pass
export const BookingService = {
  calculateDuration: (service: ServiceType) => {
    return service.duration + 15; // Simple implementation
  },
};
```

#### 3. REFACTOR - Improve Implementation
```typescript
// Refactored, more robust implementation
export const BookingService = {
  calculateDuration: (service: ServiceType) => {
    const { duration, bufferTime = 15 } = service;
    return duration + bufferTime;
  },
};
```

### Test-Driven Development Examples

#### Example: New Booking Feature
```typescript
// 1. Write tests first
describe('Group Booking Feature', () => {
  it('should allow booking for multiple participants', async () => {
    const booking = {
      serviceId: 'svc_1',
      participants: ['user1', 'user2'],
      groupSize: 2,
    };

    const result = await BookingService.createGroupBooking(booking);

    expect(result.success).toBe(true);
    expect(result.bookings).toHaveLength(2);
  });

  it('should validate group size limits', async () => {
    const booking = {
      serviceId: 'svc_1',
      participants: Array(11).fill('user'), // Exceeds limit
      groupSize: 11,
    };

    const result = await BookingService.createGroupBooking(booking);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum group size');
  });
});
```

## 🛠️ Testing Utilities & Helpers

### Comprehensive Test Utils
Located at: `/src/test/utils/comprehensive-test-utils.ts`

#### Key Features
- **Provider Wrapping**: Automatic context providers
- **Mock Services**: Pre-configured mock implementations
- **Test Helpers**: Specialized classes for common patterns
- **API Mocking**: Utilities for success/error/loading states

#### Usage Examples
```typescript
// Basic rendering with all providers
const { user } = renderWithProviders(<BookingWizard />);

// Booking flow testing
const bookingHelper = renderComponentForTesting(<BookingWizard />);
await bookingHelper.selectService('Lash Enhancement');
await bookingHelper.proceedToNextStep();

// Form validation testing
const formHelper = renderComponentForTesting(<BookingForm />);
await formHelper.testRequiredField('Email');
await formHelper.testInvalidEmail('invalid-email');
```

### Custom Matchers
```typescript
// Custom matchers for common assertions
expect(toast).toHaveBeenCalledWithMessage('Booking created successfully');
expect(navigation).toHaveBeenCalledWith('/booking/success');
expect(component).toBeAccessible();
```

## 🔍 Mocking Strategy

### When to Mock
- External APIs (Supabase, Stripe, Booksy)
- Browser APIs (localStorage, fetch)
- Time-dependent operations (Date, setTimeout)
- Random operations (Math.random, UUID generation)

### Mocking Patterns

#### 1. Complete API Mock
```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));
```

#### 2. Partial Mock
```typescript
const mockUseBooking = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useBooking', () => ({
  useBooking: mockUseBooking,
}));

mockUseBooking.mockReturnValue({
  booking: mockBooking,
  isLoading: false,
});
```

#### 3. Dynamic Mock
```typescript
vi.mock('@/services/booking.service', () => ({
  BookingService: {
    create: vi.fn().mockImplementation(async (booking) => {
      if (booking.invalid) {
        return { success: false, error: 'Invalid booking' };
      }
      return { success: true, data: { id: 'new-booking' } };
    }),
  },
}));
```

## 📈 Performance Testing

### Render Performance
```typescript
import { measureRenderTime } from '@/test/utils/comprehensive-test-utils';

it('should render within performance budget', async () => {
  const { renderTime, isAcceptable } = await measureRenderTime(
    <ComplexBookingComponent />
  );

  expect(isAcceptable(100)).toBe(true); // Should render in <100ms
});
```

### Component Re-render Testing
```typescript
it('should not re-render unnecessarily', async () => {
  const { rerender } = renderWithProviders(<BookingCalendar />);
  const updates = [
    { selectedDate: new Date() },
    { selectedDate: new Date() },
  ];

  const { maxRenderTime } = await testComponentRerender(
    <BookingCalendar />,
    updates
  );

  expect(maxRenderTime).toBeLessThan(50); // Fast re-renders
});
```

## ♿ Accessibility Testing

### Automated A11y Testing
```typescript
import { testAccessibility, testKeyboardNavigation } from '@/test/utils/comprehensive-test-utils';

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = renderComponent();
    await testAccessibility(container);
  });

  it('should be keyboard navigable', async () => {
    const { container } = renderComponent();
    await testKeyboardNavigation(container);
  });
});
```

### Manual A11y Checklist
- [ ] Color contrast ratios meet WCAG AA standards
- [ ] Focus management works correctly
- [ ] Screen reader announcements are appropriate
- [ ] Keyboard navigation covers all interactive elements
- [ ] Form inputs have proper labels
- [ ] Images have alt text

## 🐛 Debugging Tests

### Common Issues & Solutions

#### 1. Async Test Timeouts
```typescript
// ✅ Use waitFor instead of fixed timeouts
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// ❌ Avoid this
setTimeout(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
}, 1000);
```

#### 2. Mock Implementation Issues
```typescript
// ✅ Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// ✅ Use vi.hoisted for dynamic mocks
const mockFunction = vi.hoisted(() => vi.fn());
vi.mock('@/module', () => ({
  function: mockFunction,
}));
```

#### 3. Provider Issues
```typescript
// ✅ Use renderWithProviders for complex components
const { user } = renderWithProviders(
  <BookingWizard />,
  {
    initialRoute: '/booking',
    queryClient: customQueryClient,
  }
);
```

### Debugging Tools
- **`screen.debug()`**: Print current DOM state
- **`vi.fn()`**: Track function calls and arguments
- **Coverage reports**: Identify untested code paths
- **Playwright trace viewer**: Debug E2E test failures

## 📋 Test Coverage Strategy

### What to Test (High Priority)
- [ ] Business logic functions
- [ ] API service integrations
- [ ] Complex user workflows
- [ ] Error handling paths
- [ ] Form validation
- [ ] Authentication flows

### What to Test (Medium Priority)
- [ ] Component rendering
- [ ] State management
- [ ] Data transformations
- [ ] Utility functions

### What to Skip (Low Priority)
- [ ] Simple getter functions
- [ ] Static content
- [ ] Third-party library functionality
- [ ] Trivial components

### Coverage Quality over Quantity
```typescript
// ✅ Meaningful test
it('should handle booking conflicts gracefully', async () => {
  const conflictingBooking = createMockBooking();
  mockApiError(supabase.from().insert, 'Slot already booked');

  const result = await BookingService.create(conflictingBooking);

  expect(result.success).toBe(false);
  expect(result.error).toContain('Slot already booked');
  expect(showErrorToast).toHaveBeenCalledWith(
    'This time slot is no longer available'
  );
});

// ❌ Low-value test
it('should return the booking object', () => {
  const booking = { id: '1' };
  expect(booking.id).toBe('1');
});
```

## 🚀 Continuous Integration

### CI Configuration
```yaml
# GitHub Actions example
- name: Run Tests
  run: npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage/lcov.info

- name: Run E2E Tests
  run: npm run test:e2e:ci
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:affected"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ]
  }
}
```

## 📚 Resources & References

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Patterns](https://kentcdodds.com/blog/common-testing-mistakes)

### Best Practices
- [Testing Best Practices](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Component Testing Guidelines](https://testing-library.com/docs/guides-using-test-idioms)

### Internal Resources
- Test Utilities: `/src/test/utils/comprehensive-test-utils.ts`
- Test Examples: Look through existing `*.test.tsx` files
- Mock Patterns: `/src/test/mocks/services.mock.ts`

## 🎯 Next Steps

### Immediate Actions
1. Review existing test coverage reports
2. Identify critical untested business logic
3. Set up test coverage monitoring in CI
4. Create test templates for common patterns

### Long-term Goals
1. Achieve 70% meaningful test coverage
2. Implement visual regression testing
3. Add performance testing to CI
4. Create comprehensive test documentation

---

*Last updated: January 2025*
*Contact: Development Team*