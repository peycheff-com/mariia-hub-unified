# Naming Conventions Guide

**Last Updated**: October 31, 2025
**Version**: 1.0

---

## 📋 Overview

This document establishes and enforces consistent naming conventions across the Mariia Hub codebase to improve maintainability, reduce confusion, and facilitate easier component discovery.

---

## ✅ Current State Analysis

### Successfully Completed

- ✅ Dead code eliminated (8 files removed in Phase 1)
- ✅ Console.log/debugger statements: **0 instances** (already clean)
- ✅ @ts-ignore comments: **0 instances** (already clean)
- ✅ TODO/FIXME/HACK comments: **0 instances** (already clean)

### In Progress

- Component naming consistency review

---

## 📁 Component File Naming

### ✅ Component Files (React Components)

**Convention**: PascalCase with component suffix

- ✅ Correct: `BookingSheet.tsx`, `ServiceCard.tsx`, `AnalyticsDashboard.tsx`
- ❌ Incorrect: `booking-sheet.tsx`, `service_card.tsx`

**Rationale**:

- Aligns with React community standards
- Improves IDE autocomplete
- Makes component files easily distinguishable

**Exception**: shadcn/ui components (kebab-case by design)

- ✅ Correct: `alert-dialog.tsx`, `date-range-picker.tsx`
- These are UI library components following their own conventions

---

### ✅ Index Files

**Convention**: `index.ts` or `index.tsx`

- ✅ Correct: `src/components/booking/index.ts`
- Used for barrel exports

**Content**:

```typescript
// src/components/booking/index.ts
export { BookingSheet } from './BookingSheet';
export { Step1Choose } from './Step1Choose';
// ... other exports
```

---

### ✅ Test Files

**Convention**: `{ComponentName}.test.tsx`

- ✅ Correct: `BookingSheet.test.tsx`, `ServiceCard.test.tsx`
- ✅ Alternative: `{ComponentName}.spec.tsx`

**Location**: Same directory as component

```
src/components/booking/
├── BookingSheet.tsx
├── BookingSheet.test.tsx
└── index.ts
```

---

### ✅ Utility Files

**Convention**: camelCase or kebab-case

- ✅ Correct: `dateUtils.ts`, `user-service.ts`
- Used for utility functions and services

---

## 🔄 Component Naming Patterns

### Page Components

**Convention**: Capitalized descriptive names

- ✅ Correct: `Beauty.tsx`, `Fitness.tsx`, `BookingWizard.tsx`

**Location**: `src/pages/` or `src/pages/{category}/`

---

### Feature-Specific Components

**Convention**: PascalCase with descriptive names

- ✅ Correct: `BeforeAfterSlider.tsx`, `LoyaltyRewardsCard.tsx`
- Avoid overly generic names like `Component1.tsx`

---

### Admin Components

**Convention**: Descriptive with context

- ✅ Correct: `AnalyticsDashboard.tsx`, `ContentManagementHub.tsx`

**Subdirectories**:

- `src/components/admin/` - General admin components
- `src/components/admin/{feature}/` - Feature-specific admin components

---

## 🎯 Naming Consistency Issues Found

### Duplicate Component Names (Resolved in Phase 1)

| Component          | Before     | After       | Status      |
| ------------------ | ---------- | ----------- | ----------- |
| Step2Time          | 3 versions | 1 canonical | ✅ Resolved |
| BookingSheet       | 3 versions | 1 canonical | ✅ Resolved |
| AIContentGenerator | 3 versions | 1 canonical | ✅ Resolved |
| BeforeAfterSlider  | 2 versions | 1 canonical | ✅ Resolved |

### Remaining Duplicate Files

| Component          | Locations                                 | Action Needed                        |
| ------------------ | ----------------------------------------- | ------------------------------------ |
| AnalyticsDashboard | admin/, analytics/                        | Analytics version unused (dead code) |
| ReportBuilder      | admin/analytics/, admin/advanced/         | Needs analysis                       |
| ContentAnalytics   | admin/content/, admin/content/components/ | Needs analysis                       |

---

## 📊 File Naming Statistics

### Total Components: ~1,375 files

- **PascalCase** (components): ~95%
- **kebab-case** (shadcn/ui): ~5%
- **Other**: <1%

### Naming Violations: **Very Low**

- Only legal/compliance components use descriptive kebab-case (intentional)
- shadcn/ui components follow library conventions (acceptable)

---

## 🎨 Naming Best Practices

### 1. Component Names

```typescript
// ✅ Good
export const BookingSheet = () => { ... };
export const ServiceCard = ({ service }) => { ... };

// ❌ Bad
export default function component() { ... };
```

### 2. Props Interfaces

```typescript
// ✅ Good
interface BookingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
}

// ❌ Bad
interface Props {
  isOpen: boolean;
}
```

### 3. File and Export Consistency

```typescript
// ✅ Good - filename matches export
// File: BookingSheet.tsx
export const BookingSheet = () => { ... };

// ❌ Bad - mismatch
// File: BookingSheet.tsx
export default MyComponent = () => { ... };
```

---

## 🚀 Enforcement Strategy

### Automated Checks

1. **ESLint Rules**:
   - Enforce PascalCase for components
   - Disallow default exports for components
   - Require file name to match component name

2. **Pre-commit Hooks**:
   - Run eslint --fix on commit
   - Validate naming conventions
   - Check for console.log statements

3. **CI/CD Pipeline**:
   - Fail builds on naming convention violations
   - Generate naming convention reports

### Manual Review

1. **Code Reviews**: Check naming in PR review
2. **Architecture Reviews**: Quarterly naming audits
3. **Onboarding**: Include naming conventions in developer docs

---

## 📝 Adoption Checklist

For New Components:

- [ ] File name in PascalCase
- [ ] Component name matches file name
- [ ] Props interface named `{ComponentName}Props`
- [ ] Component file in appropriate directory
- [ ] Test file created with `.test.tsx` suffix
- [ ] Barrel export in `index.ts` if part of a feature group

---

## 🔧 Migration Guide

### Existing Components

**Already Correct**: No action needed

- ~95% of components already follow conventions

**Needs Migration**: Legal/compliance components

- `data-breach-notification-system.tsx` → `DataBreachNotificationSystem.tsx`
- `data-subject-rights-portal.tsx` → `DataSubjectRightsPortal.tsx`

**Migration Steps**:

1. Rename file
2. Update component declaration
3. Update all imports
4. Update tests
5. Update barrel exports

---

## 📚 Resources

### Links

- [React Naming Conventions](https://react.dev/learn/naming-componenets)
- [TypeScript Naming Guidelines](https://typescript-eslint.io/rules/naming-convention/)
- [shadcn/ui File Structure](https://ui.shadcn.com/docs)

### Tools

- **ESLint**: `@typescript-eslint/naming-convention`
- **Prettier**: Enforces formatting
- **Husky**: Pre-commit hooks

---

## ✅ Summary

**Status**: ✅ **EXCELLENT**

The codebase already demonstrates excellent naming conventions:

- ✅ 95% compliance with PascalCase
- ✅ Clean of debug code
- ✅ Zero TODO/FIXME comments
- ✅ Consistent with React best practices

**Remaining Work**:

- Remove remaining duplicate components (Phase 3)
- Consider migrating legal/compliance components (optional)
- Add automated enforcement

**Recommendation**: Maintain current conventions and add automated checks to prevent drift.

---

**Document Owner**: Engineering Team
**Next Review**: Quarterly
**Effective Date**: October 31, 2025
