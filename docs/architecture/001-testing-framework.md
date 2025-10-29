# ADR-001: Testing Framework Selection

## Status
Accepted

## Deciders
- Development Team
- Architecture Team

## Date
2025-01-26

## Context
The Mariia Hub platform required a comprehensive testing strategy to ensure reliability, maintainability, and business logic protection. We needed to select testing frameworks and tools that would:

1. Support our React 18 + TypeScript + Vite stack
2. Provide fast development experience with hot reloading
3. Enable comprehensive unit, integration, and E2E testing
4. Support mocking of external dependencies (Supabase, Stripe, Booksy)
5. Integrate well with CI/CD pipelines
6. Provide good coverage reporting
7. Support accessibility testing

### Requirements Considered
- **Performance**: Fast test execution for developer productivity
- **Developer Experience**: Easy setup, good documentation, helpful error messages
- **Compatibility**: Works with Vite, TypeScript, React 18
- **Feature Set**: Comprehensive testing capabilities including mocking, snapshots, coverage
- **Ecosystem**: Good plugin/support ecosystem
- **CI Integration**: Reliable performance in CI environments

### Alternatives Considered

1. **Jest + React Testing Library**
   - Pros: Industry standard, mature ecosystem, great documentation
   - Cons: Slower startup with Vite, requires configuration for ES modules

2. **Vitest + React Testing Library**
   - Pros: Native Vite integration, faster startup, Jest-compatible API
   - Cons: Younger ecosystem, fewer community examples

3. **Jest + Playwright Unit**
   - Pros: Same framework for unit and E2E, consistent API
   - Cons: Slower unit tests, less mature for unit testing

4. **Web Test Runner**
   - Pros: Modern, Web standards-based
   - Cons: Less mature, smaller ecosystem

## Decision
We selected **Vitest + React Testing Library** for unit and component testing, and **Playwright** for E2E testing.

### Core Stack
- **Unit Testing**: Vitest with jsdom environment
- **Component Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright
- **Mocking**: Vitest built-in mocking
- **Coverage**: v8 provider for speed and accuracy
- **Accessibility**: jest-axe integration
- **Performance Testing**: Custom utilities with Performance API

## Consequences

### Positive Consequences
- **Fast Development**: Tests start up quickly thanks to Vite integration
- **Excellent DX**: Familiar API for developers coming from Jest
- **Type Safety**: Full TypeScript support with proper typing
- **CI Performance**: Parallel test execution and sharding support
- **Modern Stack**: Built for modern JavaScript/TypeScript features
- **Reliable E2E**: Playwright provides reliable cross-browser testing

### Negative Consequences
- **Learning Curve**: Team needed to learn Vitest-specific features
- **Ecosystem**: Smaller ecosystem than Jest (fewer examples, plugins)
- **Migration Effort**: Required migration from any existing Jest setup
- **Tooling**: Some IDE extensions may favor Jest over Vitest

### Trade-offs
- **Speed vs Ecosystem**: Prioritized development speed over mature ecosystem
- **Modern vs Stable**: Chose modern tools over battle-tested alternatives
- **Unified vs Specialized**: Different frameworks for unit vs E2E testing

## Implementation Notes

### Key Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup-vitest.ts"],
    globals: true,
    coverage: {
      provider: 'v8',
      thresholds: {
        global: { branches: 60, functions: 60, lines: 60, statements: 60 }
      }
    }
  }
});
```

### Test Organization
```
src/
├── test/
│   ├── setup-vitest.ts          # Global setup
│   ├── utils/                  # Reusable helpers
│   └── mocks/                  # Mock implementations
├── components/__tests__/         # Component tests
├── services/__tests__/         # Service tests
└── pages/__tests__/           # Page tests
```

### Testing Utilities
Created comprehensive test utilities at `/src/test/utils/comprehensive-test-utils.tsx`:
- Provider wrapping for React Context
- Mock implementations for external services
- Helper classes for common patterns (booking flow, form validation)
- Accessibility testing helpers
- Performance testing utilities

### Mocking Strategy
- External APIs (Supabase, Stripe, Booksy) are mocked at module level
- Browser APIs are mocked globally in setup files
- Time-dependent operations use Vitest's time mocking
- Random operations have deterministic mocks

### E2E Testing Setup
Playwright configuration includes:
- Multi-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile viewport testing
- CI optimization with parallel execution
- Automatic dev server startup
- Comprehensive reporting

## Related Decisions
- [ADR-002: State Management Architecture](./002-state-management.md) - Influences testing patterns
- [ADR-005: Booking Flow Architecture](./005-booking-flow.md) - Key testing target
- [ADR-007: Comprehensive Testing Strategy](./007-testing-strategy.md) - Builds on this foundation

## Evidence
- **Vitest Performance Benchmarks**: Showed 3-5x faster startup compared to Jest
- **Team Evaluation**: Testing period with both frameworks showed strong preference for Vitest DX
- **CI Performance**: Faster test suite execution in GitHub Actions
- **Proof of Concept**: Successful migration of existing tests to Vitest

## Future Considerations
- Monitor Vitest ecosystem growth and adoption
- Consider test coverage refinement based on business criticality
- Evaluate potential for visual regression testing integration
- Assess need for performance regression testing