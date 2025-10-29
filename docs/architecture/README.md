# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) that capture important architectural decisions for the Mariia Hub platform.

## What are ADRs?

Architecture Decision Records are short documents that capture an important architectural decision made along with its context and consequences. Each ADR follows a standardized format to maintain consistency and clarity.

## ADR Format

Each ADR follows this structure:

- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Deciders**: Who made the decision
- **Date**: When the decision was made
- **Context**: The situation and problem being addressed
- **Decision**: The actual decision made
- **Consequences**: What results from this decision (both positive and negative)

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|---------|------|
| [ADR-001](./001-testing-framework.md) | Testing Framework Selection | Accepted | 2025-01-26 |
| [ADR-002](./002-state-management.md) | State Management Architecture | Accepted | 2025-01-26 |
| [ADR-003](./003-ui-framework.md) | UI Framework and Design System | Accepted | 2025-01-26 |
| [ADR-004](./004-api-layer.md) | API Layer and Data Fetching | Accepted | 2025-01-26 |
| [ADR-005](./005-booking-flow.md) | Booking Flow Architecture | Accepted | 2025-01-26 |
| [ADR-006](./006-internationalization.md) | Internationalization Strategy | Accepted | 2025-01-26 |
| [ADR-007](./007-testing-strategy.md) | Comprehensive Testing Strategy | Accepted | 2025-01-26 |

## How to Read ADRs

1. **Start with the Context** - Understand the problem being solved
2. **Review the Decision** - See what was chosen and why
3. **Consider Consequences** - Understand the trade-offs
4. **Check Status** - Note if the decision is still current

## How to Create a New ADR

When facing an important architectural decision:

1. **Create a new file** using the next sequential number: `XXX-decision-title.md`
2. **Use the template** from the `template.md` file
3. **Discuss with team** before finalizing
4. **Update the index** with the new ADR
5. **Share in PR** for review and discussion

## ADR Lifecycle

1. **Proposed**: Initial draft for discussion
2. **Accepted**: Decision made and implemented
3. **Deprecated**: Decision no longer recommended but still in use
4. **Superseded**: Replaced by a newer decision (link to new ADR)

## Related Documentation

- [Technical Architecture](../TECHNICAL_ARCHITECTURE.md)
- [Testing Strategy](../TESTING_STRATEGY.md)
- [Project Overview](../PROJECT_OVERVIEW.md)