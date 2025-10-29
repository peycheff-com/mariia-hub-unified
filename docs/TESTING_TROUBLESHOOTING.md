# Testing Troubleshooting Guide

This guide helps you diagnose and fix common testing issues in the Mariia Hub codebase. It's organized by problem type with specific solutions and debugging techniques.

## 🔍 Quick Diagnosis Checklist

Before diving into specific issues, check these common problems:

```bash
# 1. Clear all caches
npm run test:clean

# 2. Update dependencies (sometimes version mismatches cause issues)
npm update

# 3. Check configuration files
cat vitest.config.ts
cat package.json

# 4. Run with verbose output for more clues
npm run test -- --reporter=verbose

# 5. Check test files for syntax errors
npm run type-check
```

## 🚫 Common Test Failures

### 1. "Cannot find module" Errors

#### Problem
```
Cannot find module '@/components/BookingButton' or its corresponding type declarations
```

#### Causes & Solutions

**Cause A: Path Alias Issue**
```typescript
// ✅ Check if alias is configured in vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/components': path.resolve(__dirname, './src/components'),
  },
}
```

**Cause B: TypeScript Path Mapping**
```json
// Check tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"]
    }
  }
}
```

**Cause C: Wrong Import Path**
```typescript
// ❌ Wrong
import { BookingButton } from '@/components/booking/BookingButton';

// ✅ Correct (check actual file structure)
import { BookingButton } from '@/components/BookingButton';
```

**Debugging Steps**
```bash
# Find actual file location
find src -name "*BookingButton*"

# Check if file exports correctly
grep -n "export.*BookingButton" src/components/BookingButton.tsx
```

### 2. Act() Warnings

#### Problem
```
Warning: An update to Component inside a test was not wrapped in act(...)
```

#### Causes & Solutions

**Cause A: State Change Without User Action**
```typescript
// ❌ Problem: Direct state change
const { result } = renderHook(useBooking);
result.current.setBooking(mockBooking); // Triggers warning

// ✅ Solution: Use waitFor or act
import { act, waitFor } from '@testing-library/react';

await act(async () => {
  result.current.setBooking(mockBooking);
});

// Or for async operations:
await waitFor(() => {
  expect(result.current.booking).toEqual(mockBooking);
});
```

**Cause B: useEffect Running After Test**
```typescript
// ❌ Problem: useEffect runs after test completes
useEffect(() => {
  setBooking(initializeBooking());
}, []);

// ✅ Solution: Wait for effects to complete
const { result } = renderHook(useBooking);
await waitFor(() => {
  expect(result.current.booking).toBeDefined();
});
```

**Cause C: API Mock Not Working**
```typescript
// ❌ Problem: Mock setup after import
import { BookingService } from './booking.service';
vi.mock('./booking.service', () => ({ BookingService: mockService }));

// ✅ Solution: Mock before import
vi.mock('./booking.service', () => ({ BookingService: mockService }));
import { BookingService } from './booking.service';
```

### 3. Test Timeouts

#### Problem
```
Test timeout of 5000ms exceeded
```

#### Causes & Solutions

**Cause A: Infinite Loop or Promise**
```typescript
// ❌ Problem: Never resolves
const mockPromise = new Promise(() => {}); // Never resolves

// ✅ Solution: Use proper async/await or setTimeout
const mockPromise = Promise.resolve('success');
await mockPromise;
```

**Cause B: Fixed Timeouts Instead of Waits**
```typescript
// ❌ Problem: Fixed timeout - unreliable
setTimeout(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, 2000);

// ✅ Solution: Use waitFor for reliable testing
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, { timeout: 5000 });
```

**Cause C: Missing await on async operations**
```typescript
// ❌ Problem: Not waiting for async
userEvent.click(submitButton); // async operation
expect(screen.getByText('Success')).toBeInTheDocument();

// ✅ Solution: await the user action
await userEvent.click(submitButton);
expect(screen.getByText('Success')).toBeInTheDocument();
```

### 4. Mock Not Working

#### Problem
```
TypeError: Cannot read property 'mockResolvedValue' of undefined
```

#### Causes & Solutions

**Cause A: Mock Structure Mismatch**
```typescript
// ❌ Problem: Wrong mock structure
vi.mock('@/services/booking.service', () => ({
  create: vi.fn().mockResolvedValue({ success: true }) // Wrong level
}));

// ✅ Solution: Match the actual module structure
vi.mock('@/services/booking.service', () => ({
  BookingService: {
    create: vi.fn().mockResolvedValue({ success: true })
  }
}));
```

**Cause B: hoisted vs Regular Mock**
```typescript
// ❌ Problem: Regular mock doesn't work for imports
const mockCreate = vi.fn();
vi.mock('@/services/booking.service', () => ({
  BookingService: { create: mockCreate }
}));

// ✅ Solution: Use hoisted for dynamic mocks
const mockCreate = vi.hoisted(() => vi.fn());
vi.mock('@/services/booking.service', () => ({
  BookingService: { create: mockCreate }
}));

// Now you can control it
mockCreate.mockResolvedValueOnce({ success: false });
```

**Cause C: Module Already Imported**
```typescript
// ❌ Problem: Mock after module is already cached
import { BookingService } from '@/services/booking.service';

// Later in test...
vi.mock('@/services/booking.service', () => ({
  BookingService: mockBookingService
}));

// ✅ Solution: Mock before any imports
vi.mock('@/services/booking.service', () => ({
  BookingService: mockBookingService
}));

import { BookingService } from '@/services/booking.service';
```

### 5. Provider Context Missing

#### Problem
```
Error: Invariant failed: useBooking must be used within a BookingProvider
```

#### Causes & Solutions

**Cause A: Component Needs Context**
```typescript
// ❌ Problem: Component rendered without providers
render(<BookingCalendar />); // Needs BookingContext

// ✅ Solution: Use renderWithProviders
import { renderWithProviders } from '@/test/utils/comprehensive-test-utils';

renderWithProviders(<BookingCalendar />);
```

**Cause B: Custom Provider Setup**
```typescript
// ❌ Problem: Missing specific context
renderWithProviders(<MyComponent />); // Needs special context

// ✅ Solution: Wrap with specific provider
import { CustomContextProvider } from './CustomContext';

render(
  <CustomContextProvider value={mockValue}>
    <MyComponent />
  </CustomContextProvider>
);
```

### 6. Query Client Issues

#### Problem
```
Error: No QueryClient instance found
```

#### Solutions
```typescript
// ❌ Problem: Component needs QueryClient
import { render } from '@testing-library/react';
render(<MyComponent />); // Uses useQuery internally

// ✅ Solution: Use renderWithProviders (includes QueryClient)
import { renderWithProviders } from '@/test/utils/comprehensive-test-utils';

renderWithProviders(<MyComponent />);

// OR: Custom QueryClient
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false }
  }
});

render(
  <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
);
```

## 🔧 Environment and Setup Issues

### 1. Global Setup Failures

#### Problem
```
SyntaxError: Unexpected token < in test setup file
```

#### Solutions

**Check Test Setup Files**
```typescript
// src/test/setup-vitest.ts - Make sure it's valid TypeScript/JavaScript
import '@testing-library/jest-dom/vitest';

// ✅ Good
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ❌ Bad - Invalid syntax
global.something = {; // Syntax error
```

**Check Configuration**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: [
      "./src/test/setup-vitest.ts",     // ✅ Correct path
      "./src/test/setup-global.ts",     // ✅ Correct path
    ],
    globals: true,                      // Required for globals
  },
});
```

### 2. jsdom vs Node Environment

#### Problem
```
ReferenceError: window is not defined
```

#### Solutions
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom', // ✅ Required for React components

    // For Node.js specific tests:
    // environment: 'node',
  },
});
```

**Environment-Specific Tests**
```typescript
// Use describe.withEnvironment for specific environments
import { describe } from 'vitest';

describe.withEnvironment('node')('Node-specific functionality', () => {
  it('should work in Node environment', () => {
    // Node-specific tests
  });
});

describe.withEnvironment('jsdom')('Browser functionality', () => {
  it('should work in browser environment', () => {
    // DOM-specific tests
  });
});
```

### 3. Coverage Issues

#### Problem
```
Coverage collection failed unexpectedly
```

#### Solutions

**Check Coverage Configuration**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // ✅ More reliable than istanbul
      clean: true,     // ✅ Clean old reports
      all: true,       // ✅ Include all files

      exclude: [
        'node_modules/',
        'src/test/',           // ✅ Exclude test files
        'src/mocks/',         // ✅ Exclude mocks
        '**/*.d.ts',         // ✅ Exclude type definitions
        'src/vite-env.d.ts',
      ],
    },
  },
});
```

**Fix Permission Issues**
```bash
# macOS/Linux: Fix coverage directory permissions
chmod -R 755 coverage/

# Or delete and regenerate
rm -rf coverage/
npm run test:coverage
```

## 🐛 Component Testing Issues

### 1. Element Not Found

#### Problem
```
TestingLibraryElementError: Unable to find an element with the text: "Submit"
```

#### Solutions

**Check Element Actually Renders**
```typescript
// Debug: What's actually in the document?
const { debug } = render(<MyComponent />);
debug(); // Prints current DOM

// Or check if element exists but with different text
expect(screen.getByRole('button')).toBeInTheDocument(); // Find by role
```

**Use Better Selectors**
```typescript
// ❌ Fragile text matching
screen.getByText('Submit'); // Fails with "Submit Form"

// ✅ More robust selectors
screen.getByRole('button', { name: /submit/i }); // Regex match
screen.getByTestId('submit-button'); // Test ID
screen.getByLabelText('Submit booking'); // Label

// ✅ Multiple fallbacks
screen.getByRole('button', { name: /submit/i }) ||
screen.getByTestId('submit-button');
```

**Wait for Async Rendering**
```typescript
// ❌ Element loads asynchronously but test checks immediately
expect(screen.getByText('Loaded')).toBeInTheDocument();

// ✅ Wait for element
await screen.findByText('Loaded'); // findBy waits automatically
// OR
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### 2. Form Validation Issues

#### Problem
```
Expected input value to be "test@example.com" but received ""
```

#### Solutions

**Use Correct Event APIs**
```typescript
// ❌ Old API (doesn't trigger React state updates)
fireEvent.change(input, { target: { value: 'test@example.com' } });

// ✅ User event API (more realistic)
await userEvent.type(input, 'test@example.com');

// ✅ For complete replacement
await userEvent.clear(input);
await userEvent.type(input, 'new-value');
```

**Check Form Implementation**
```typescript
// Verify your form handles onChange correctly
const MyInput = ({ value, onChange }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)} // ✅ Correct
    // onChange={(e) => onChange(e)}           // ❌ Event object, not value
  />
);
```

### 3. Modal/PDialog Testing

#### Problem
```
Unable to find modal content in DOM
```

#### Solutions

**Portal Handling**
```typescript
// ❌ Portal content might not be in test container
expect(screen.getByText('Modal Content')).toBeInTheDocument();

// ✅ Use within for portal content
expect(screen.within(document.body).getByText('Modal Content')).toBeInTheDocument();

// ✅ Or configure test container
const { container } = render(<ModalComponent />);
expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
```

**Mock Portal**
```typescript
// Mock react-dom portal for simpler testing
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (children) => children, // Render inline for testing
  };
});
```

## 🚀 Performance Issues

### 1. Slow Test Execution

#### Problem
Tests take too long to run, affecting developer experience.

#### Solutions

**Optimize Test Setup**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Faster for development
    maxWorkers: 4,
    isolate: false, // Faster but potentially less isolated

    // Optimize timeout
    testTimeout: 5000,
    hookTimeout: 5000,
  },
});
```

**Use Efficient Mocks**
```typescript
// ❌ Slow: Real network requests
vi.mock('@/services/api');

// ✅ Fast: In-memory mocks
vi.mock('@/services/api', () => ({
  ApiClient: {
    get: vi.fn().mockResolvedValue({ data: 'mock' }),
    post: vi.fn().mockResolvedValue({ data: 'success' }),
  },
}));
```

**Avoid Unnecessary Renders**
```typescript
// ❌ Re-renders every test component
import { render } from '@testing-library/react';

describe('HeavyComponent', () => {
  it('test 1', () => {
    render(<HeavyComponent />);
    // test logic
  });

  it('test 2', () => {
    render(<HeavyComponent />); // Re-renders heavy component
    // test logic
  });
});

// ✅ Use beforeEach for shared setup
import { render } from '@testing-library/react';

describe('HeavyComponent', () => {
  let component;

  beforeEach(() => {
    component = render(<HeavyComponent />);
  });

  it('test 1', () => {
    // test with component from beforeEach
  });

  it('test 2', () => {
    // test with same component
  });
});
```

### 2. Memory Leaks in Tests

#### Problem
Tests consume increasing memory over time.

#### Solutions

**Clean Up Resources**
```typescript
// afterEach cleanup
afterEach(() => {
  cleanup(); // Testing Library cleanup
  vi.clearAllMocks(); // Clear mocks
});

// For async operations
afterEach(async () => {
  await flushPromises(); // Wait for pending promises
});

// Clean up timers
afterEach(() => {
  vi.clearAllTimers();
});
```

**Avoid Global State**
```typescript
// ❌ Problem: Global state persists between tests
let globalCounter = 0;

export const useCounter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    globalCounter++; // Persists between tests
  });

  return [count, setCount];
};

// ✅ Solution: Isolated state
export const useCounter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Local effect only
  });

  return [count, setCount];
};
```

## 🛠️ Debugging Techniques

### 1. Test Debugging Tools

**Debug DOM State**
```typescript
import { render, screen, debug } from '@testing-library/react';

const { container, debug } = render(<MyComponent />);

// Print entire DOM
debug();

// Print specific element
debug(container.querySelector('.specific-class'));

// Print with pretty formatting
console.log(container.innerHTML);
```

**Debug Test Execution**
```typescript
// Use debugger statement
it('should work correctly', () => {
  debugger; // Opens browser dev tools
  // Test logic here
});

// Use console.log for async debugging
await waitFor(() => {
  console.log('Current DOM:', screen.getByTestId('test-element').innerHTML);
  expect(screen.getByText('Expected')).toBeInTheDocument();
});
```

**Mock Debugging**
```typescript
// Check mock calls
expect(mockFunction).toHaveBeenCalledTimes(1);
console.log('Mock calls:', mockFunction.mock.calls);
console.log('Mock results:', mockFunction.mock.results);

// Check all mocks
vi.clearAllMocks(); // Clear before test
// ... run test
console.log('All mocks:', vi.getMockedModule('@/services/api'));
```

### 2. Performance Debugging

**Measure Test Performance**
```typescript
it('should be performant', () => {
  const start = performance.now();

  render(<ExpensiveComponent />);

  const end = performance.now();
  console.log(`Render took ${end - start} milliseconds`);

  expect(end - start).toBeLessThan(100); // Should render in <100ms
});
```

**Profile Test Execution**
```bash
# Run tests with Node.js profiler
node --prof node_modules/.bin/vitest run

# Analyze results
node --prof-process isolate-*.log > performance-analysis.txt
```

## 📋 Getting Help Checklist

When you're stuck with a testing issue:

### Before Asking for Help
1. **Clear caches and restart**: `npm run test:clean && npm run test`
2. **Check console logs**: Are there warnings or errors you missed?
3. **Simplify the test**: Can you reproduce with a minimal example?
4. **Check recent changes**: Did this work before? What changed?
5. **Google the error**: Search for the exact error message

### When Asking for Help
Include:
1. **Error message**: Full error stack trace
2. **Test code**: Minimal reproduction
3. **Component code**: Relevant parts of component being tested
4. **What you tried**: List of attempted solutions
5. **Expected vs Actual**: What should happen vs what's happening

### Test Issue Template
```markdown
## Testing Issue

### Error Message
```
[Paste full error message here]
```

### Test Code
```typescript
[Paste failing test code]
```

### Component Code
```typescript
[Paste relevant component code]
```

### What I've Tried
- [ ] Cleared caches and restarted
- [ ] Checked for syntax errors
- [ ] Tried different selectors
- [ ] Checked mock implementation

### Expected Behavior
[Describe what should happen]

### Actual Behavior
[Describe what actually happens]
```

## 🔄 Prevention Strategies

### 1. Write Better Tests
- Test behavior, not implementation
- Use meaningful assertions
- Keep tests simple and focused
- Use appropriate selectors

### 2. Maintain Test Health
- Regular test refactoring
- Update tests when components change
- Remove obsolete tests
- Monitor test performance

### 3. Code Review Standards
- Review tests with code
- Check for test coverage
- Verify mock implementations
- Ensure test reliability

---

*Remember: Testing problems are normal and solvable. Use this guide, ask for help when needed, and learn from each issue you encounter!*