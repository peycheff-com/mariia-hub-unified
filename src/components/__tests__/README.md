# Component Tests

This directory contains test files for components in the parent directory.

## Testing Framework

- **Vitest** for unit and integration tests
- **Testing Library** for component testing
- **jsdom** environment for DOM simulation

## File Naming Convention

- `ComponentName.test.tsx` for component tests
- `ComponentName.spec.tsx` for specification tests
- `utils.test.ts` for utility function tests

## Test Structure

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });
});
```

## Guidelines

- Test user behavior, not implementation details
- Use meaningful test descriptions
- Mock external dependencies
- Test accessibility attributes
- Keep tests focused and simple