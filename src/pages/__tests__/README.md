# Page Tests

This directory contains test files for page components in the parent directory.

## Testing Framework

- **Vitest** for unit and integration tests
- **Testing Library** for component testing
- **Mock Service Worker** for API mocking
- **React Router Memory Router** for route testing

## File Naming Convention

- `PageName.test.tsx` for page tests
- `PageName.spec.tsx` for specification tests
- `integration.test.tsx` for integration tests

## Test Structure

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageName } from '../PageName';

describe('PageName', () => {
  it('renders page correctly', () => {
    render(
      <MemoryRouter>
        <PageName />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /page title/i })).toBeInTheDocument();
  });
});
```

## Guidelines

- Test page layout and structure
- Test navigation and routing
- Mock API calls and external data
- Test loading and error states
- Verify accessibility attributes
- Test responsive behavior when critical