# Library Tests

This directory contains test files for library utilities and functions in the parent directory.

## Testing Framework

- **Vitest** for unit and integration tests
- **Type checking** with TypeScript
- **Property-based testing** when applicable

## File Naming Convention

- `utilityName.test.ts` for utility tests
- `functionName.spec.ts` for specification tests
- `integration.test.ts` for integration tests

## Test Structure

```ts
import { describe, it, expect } from 'vitest';
import { utilityFunction } from '../utilityName';

describe('utilityFunction', () => {
  it('returns expected output for valid input', () => {
    const result = utilityFunction(validInput);
    expect(result).toBe(expectedOutput);
  });

  it('handles edge cases', () => {
    expect(() => utilityFunction(invalidInput)).toThrow();
  });
});
```

## Guidelines

- Test pure functions thoroughly
- Cover edge cases and error conditions
- Use property-based testing for complex functions
- Test type definitions when critical
- Mock external dependencies