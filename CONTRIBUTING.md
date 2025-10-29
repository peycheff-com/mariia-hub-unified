# Contributing to Mariia Hub

Thank you for your interest in contributing to Mariia Hub! This guide will help you get started with contributing to our premium beauty and fitness booking platform.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🤝 Code of Conduct

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone, regardless of:

- Level of experience
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race
- Ethnicity
- Age
- Religion
- Nationality

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Harassment, sexualized language, or imagery
- Trolling, insulting/derogatory comments
- Personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Any other conduct which could reasonably be considered inappropriate

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Git configured
- A code editor (we recommend VS Code)
- Basic knowledge of React, TypeScript, and Tailwind CSS

### Setup Steps

1. **Fork the repository**
   ```bash
   # Fork the repository on GitHub
   # Then clone your fork
   git clone https://github.com/YOUR_USERNAME/mariia-hub-unified.git
   cd mariia-hub-unified
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local development values
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🔄 Development Workflow

### 1. Choose an Issue

- **New features**: Create an issue with the "enhancement" label
- **Bug fixes**: Create an issue with the "bug" label
- **Documentation**: Create an issue with the "documentation" label

### 2. Claim the Issue

- Comment on the issue that you'd like to work on it
- Wait for assignment from maintainers

### 3. Create Your Branch

Use the following naming conventions:
- `feature/short-description` - New features
- `fix/short-description` - Bug fixes
- `docs/short-description` - Documentation updates
- `refactor/short-description` - Code refactoring
- `test/short-description` - Test additions
- `chore/short-description` - Maintenance tasks

### 4. Make Your Changes

Follow our [coding standards](#coding-standards) and ensure your code is well-tested.

### 5. Test Your Changes

```bash
# Run tests
npm run test

# Run type checking
npm run type-check

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid using `any` type - use proper type definitions
- Use interfaces for object shapes
- Use enums for constants with semantic meaning

### React

- Use functional components with hooks
- Follow React Hooks rules
- Use memoization (`useMemo`, `useCallback`) for performance
- Keep components small and focused

### Naming Conventions

```typescript
// Components - PascalCase
export const BookingWizard = () => {};

// Hooks - camelCase starting with "use"
export const useBookingState = () => {};

// Functions - camelCase
const calculateAvailability = () => {};

// Constants - UPPER_SNAKE_CASE
const MAX_BOOKING_DURATION = 3600;

// Files - kebab-case
// booking-wizard.tsx
// use-booking-state.ts
// api-constants.ts
```

### Code Organization

```typescript
// Import order
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

// 3. Internal imports (use @ alias)
import { BookingType } from '@/types/booking';
import { useBookingContext } from '@/contexts/BookingContext';

// 4. Relative imports
import './BookingWizard.css';
```

### Comments and JSDoc

```typescript
/**
 * Calculates the total price for a booking including discounts and taxes
 * @param basePrice - The base price of the service
 * @param duration - Duration in minutes
 * @param discount - Optional discount percentage (0-100)
 * @param currency - Currency code for conversion
 * @returns The final price formatted with currency symbol
 * @example
 * ```typescript
 * const price = calculateBookingPrice(100, 60, 10, 'PLN');
 * console.log(price); // '90.00 zł'
 * ```
 */
export const calculateBookingPrice = (
  basePrice: number,
  duration: number,
  discount = 0,
  currency = 'PLN'
): string => {
  // Implementation
};
```

### CSS and Styling

- Use Tailwind CSS classes whenever possible
- Use CSS-in-JS only for dynamic styles
- Follow the 8px grid system for spacing
- Use semantic color variables from the theme

```tsx
// Good - Using Tailwind
<div className="flex flex-col gap-4 p-6 bg-background rounded-lg shadow-sm">

// Avoid - Inline styles
<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
```

## 🧪 Testing Guidelines

### Unit Tests

- Write tests for all new functions and components
- Use Vitest and Testing Library
- Aim for 80%+ code coverage

```typescript
import { render, screen } from '@testing-library/react';
import { BookingWizard } from './BookingWizard';

describe('BookingWizard', () => {
  it('renders all booking steps', () => {
    render(<BookingWizard />);
    expect(screen.getByText('Choose Service')).toBeInTheDocument();
    expect(screen.getByText('Select Time')).toBeInTheDocument();
  });

  it('navigates between steps correctly', async () => {
    // Test implementation
  });
});
```

### Integration Tests

- Test user flows and interactions
- Use mock data for consistent testing
- Test error states and edge cases

### E2E Tests

- Write E2E tests for critical user journeys
- Use Playwright for browser automation
- Test mobile and desktop views

## 📖 Documentation

### Code Documentation

- Add JSDoc comments to all public functions
- Document component props and usage
- Add inline comments for complex logic

### README Updates

- Update feature documentation in README
- Add new environment variables to setup instructions
- Update API documentation for changes

### Changelog

Maintain CHANGELOG.md with:
- Version number
- Release date
- Added features
- Fixed bugs
- Breaking changes

## 🔄 Pull Request Process

### 1. Before Submitting

- [ ] Code follows all coding standards
- [ ] All tests pass
- [ ] Code is properly commented
- [ ] Documentation is updated
- [ ] Type checking passes

### 2. Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests written/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain changes.

## Additional Notes
Any additional context or considerations.
```

### 3. Code Review Process

1. **Automated Checks**
   - CI/CD pipeline runs tests
   - Code quality checks
   - Type checking

2. **Manual Review**
   - At least one maintainer approval required
   - All feedback must be addressed
   - Re-request review after changes

3. **Merge**
   - Squash and merge commits
   - Delete feature branch
   - Update changelog

## 🐛 Issue Reporting

### Bug Reports

Use the following template:

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to...
2. Click on...
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
Add screenshots if helpful

**Environment**
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Firefox, Safari]
- Version: [e.g., v1.2.3]
```

### Feature Requests

```markdown
**Feature Description**
Clear description of the feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this be implemented?

**Alternatives Considered**
Other approaches you've thought of

**Additional Context**
Any other relevant information
```

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Annual project report

### Types of Contributions

- **Code**: Pull requests with new features or fixes
- **Documentation**: Improving docs and guides
- **Bug Reports**: Identifying and reporting issues
- **Code Review**: Reviewing pull requests
- **Translation**: Helping with internationalization
- **Design**: Improving UI/UX and accessibility

## 📞 Getting Help

- **Discord/Slack**: Join our community channel
- **GitHub Discussions**: Ask questions and share ideas
- **Email**: Contact maintainers at support@mariiahub.com
- **Documentation**: Check `/docs` directory for guides

## 📜 License

By contributing to Mariia Hub, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Mariia Hub! Your contributions help make beauty and fitness services more accessible and enjoyable for everyone. 💅💪