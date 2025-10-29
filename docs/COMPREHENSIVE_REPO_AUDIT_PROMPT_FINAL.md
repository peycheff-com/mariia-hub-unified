# 🔍 Comprehensive Repository Cleanup & Optimization Audit Prompt

## Multi-Agent Execution Commands

### Deploy All Agents in Parallel
```bash
# Execute all audit agents simultaneously for complete coverage
/task "Security & Critical Issues Audit" "Scan the entire repository for security vulnerabilities, hardcoded secrets, and critical issues. Focus on: API keys, passwords, SQL injection risks, XSS vulnerabilities, outdated packages with CVEs, insecure endpoints, missing input validation. Use Grep to search for patterns like 'API_KEY', 'PASSWORD', 'SECRET', 'process.env'. Report all findings with file paths and line numbers." subagent_type=general-purpose

/task "Frontend Code Audit" "Analyze all frontend code in src/ directory for cleanup opportunities. Focus on: large components (>300 lines), unused imports, duplicate code patterns, TypeScript issues (any types), React best practices violations, performance bottlenecks, accessibility issues. Use Read tool to examine complex components, Grep for patterns. Identify refactoring and consolidation opportunities." subagent_type=Explore

/task "Backend & Database Audit" "Analyze supabase/ directory for cleanup opportunities. Focus on: unused tables/migrations, slow SQL queries, missing indexes, duplicate RLS policies, complex functions, unused endpoints. Check for database optimization opportunities and security issues in RLS policies." subagent_type=Explore

/task "Configuration & Dependencies Audit" "Check all configuration files for issues. Analyze package.json for unused dependencies, outdated packages, security vulnerabilities. Review tsconfig files, vite.config.ts, eslint configs for inconsistencies and optimizations. Check environment files for hardcoded values." subagent_type=general-purpose

/task "Documentation & Assets Audit" "Review docs/ and public/ directories. Focus on: outdated documentation, missing JSDoc, unused assets, large files, unoptimized images. Check API documentation completeness and accuracy." subagent_type=Explore

/task "Testing & Quality Audit" "Analyze test coverage and quality. Check for: missing tests, broken test files, low coverage areas, test patterns. Also check for code quality issues: magic numbers, nested ternary operators, complex functions, duplicate patterns." subagent_type=general-purpose

/task "Integration Health Audit" "Analyze all third-party integrations. Focus on: Stripe integration patterns, Booksy API usage, Supabase client usage, email service integration, analytics tracking. Look for duplicate API calls, missing error handling, inconsistent patterns." subagent_type=general-purpose
```

### Or Execute Sequentially with Single Agent
```
/task "Execute comprehensive repository audit" "Perform a complete audit of the Mariia Hub repository to identify ALL cleanup, refactoring, consolidation, and optimization opportunities.

Key Focus Areas:
1. DEAD CODE: Unused imports, components, functions, dependencies
2. REFACTORING: Large components (>300 lines), complex functions, nested ternary operators, magic numbers
3. CONSOLIDATION: Similar components, duplicate API calls, repeated patterns
4. PERFORMANCE: Bundle size, missing optimizations, slow queries
5. SECURITY: Hardcoded secrets, vulnerabilities, improper validation
6. CODE QUALITY: TypeScript health, React best practices, maintainability
7. ACCESSIBILITY: A11y compliance, keyboard navigation, screen readers
8. BUSINESS LOGIC: Booking flow validation, payment accuracy, multi-language consistency
9. INTEGRATIONS: Stripe, Booksy, Supabase health checks
10. DOCUMENTATION: Outdated docs, missing JSDoc, API specs

Create a comprehensive, prioritized todo list with:
- File paths and line numbers
- Effort/impact estimates
- Priority levels (CRITICAL/HIGH/MEDIUM/LOW)
- Dependencies between tasks

Output format: Detailed markdown report with actionable cleanup plan." subagent_type=general-purpose
```

## Audit Categories & Checkpoints

### 🔴 **CRITICAL Priority**
#### Security Vulnerabilities
- Hardcoded API keys, secrets, passwords
- SQL injection vulnerabilities
- XSS vulnerabilities
- Outdated packages with CVEs
- Insecure API endpoints
- Missing input validation

### 🟠 **HIGH Priority**
#### Dead Code Removal
- Unused imports in components
- Dead functions never called
- Commented out code blocks
- Unused variables and constants
- Obsolete error handling
- Deprecated API endpoints
- Unused SCSS/CSS classes
- Remove unused npm packages

#### Performance Issues
- Large components (>300 lines)
- Missing database indexes
- Slow SQL queries
- Bundle size optimization needs
- Missing lazy loading

#### Refactoring Needs
- Complex functions (>50 lines)
- Nested ternary operators
- Magic numbers (hard-coded values)
- Deeply nested JSX
- Complex state management
- TypeScript `any` type usage

### 🟡 **MEDIUM Priority**
#### Consolidation Opportunities
- Similar components (Forms, Modals, Cards)
- Duplicate API calls
- Repeated validation logic
- Similar error handling patterns
- Duplicate type definitions

#### Code Quality
- Missing React keys in lists
- useEffect dependency issues
- Direct state mutations
- Inconsistent naming conventions
- Missing return types

#### Accessibility
- Missing alt text on images
- Missing ARIA labels
- Keyboard navigation issues
- Color contrast problems
- Missing focus indicators

### 🟢 **LOW Priority**
#### Documentation
- Outdated README files
- Missing JSDoc comments
- Undocumented APIs
- Missing component prop docs

#### Testing
- Missing test coverage
- Broken test files
- Untested critical paths

#### File Organization
- Misplaced files
- Inconsistent folder structure
- Missing index files
- Poor naming conventions

## Specific Search Commands

### Find Large Components
```bash
find src -name "*.tsx" -exec wc -l {} + | awk '$1 > 300 {print $2, $1}'
```

### Find Nested Ternaries
```bash
grep -r "\\?[^:]*\\?[^:]*:" src --include="*.tsx" --include="*.ts"
```

### Find Magic Numbers
```bash
grep -r "\b[0-9]{2,}\b" src --include="*.tsx" --include="*.ts" | grep -v "//"
```

### Find Similar Components
```bash
find src/components -name "*Form*.tsx"
find src/components -name "*Modal*.tsx"
find src/components -name "*Card*.tsx"
```

### Find Duplicate API Calls
```bash
grep -r "supabase\.from\|fetch\|axios" src/services --include="*.ts" | cut -d: -f2 | sort | uniq -c
```

### Find TypeScript Issues
```bash
grep -r ": any" src --include="*.ts" --include="*.tsx"
grep -r "as " src --include="*.ts" --include="*.tsx"
```

### Find Accessibility Issues
```bash
grep -r "<img" src --include="*.tsx" | grep -v "alt="
grep -r "onClick" src --include="*.tsx" | grep -v "onKeyDown\|onKeyPress"
```

## Priority & Impact Assessment

| Priority | Impact | Examples | Action |
|----------|---------|----------|---------|
| **CRITICAL** | Security | Secrets, CVEs, vulnerabilities | Fix immediately |
| **HIGH** | Performance | Large components, slow queries, bundle size | Fix next |
| **HIGH** | Code Quality | TypeScript any, dead code, complex functions | Fix next |
| **MEDIUM** | Maintainability | Duplicates, consolidation needs | Plan for |
| **MEDIUM** | User Experience | A11y issues, missing features | Plan for |
| **LOW** | Documentation | Missing docs, outdated information | Address later |

## Expected Outcomes

### Code Quality Improvements
- Zero security vulnerabilities
- Zero TypeScript `any` types
- Reduced bundle size
- Eliminated dead code
- Improved component structure

### Performance Gains
- Faster build times
- Reduced bundle size
- Optimized database queries
- Better caching strategies

### Maintainability Boost
- Clearer code organization
- Better documentation
- Improved test coverage
- Consistent patterns

### Enhanced User Experience
- Better accessibility compliance
- Improved performance
- More reliable features

## Tools Integration

### Automated Checks
```json
{
  "scripts": {
    "audit:security": "npm audit && snyk test",
    "audit:bundle": "webpack-bundle-analyzer stats.json",
    "audit:a11y": "axe-cli src",
    "audit:types": "tsc --noEmit --strict",
    "audit:coverage": "vitest --coverage",
    "audit:lighthouse": "lhci autorun"
  }
}
```

### Pre-commit Hooks
- ESLint auto-fix
- TypeScript check
- Test coverage minimum
- Bundle size limit
- Security scan

## Final Deliverables

1. **Comprehensive Audit Report** (Markdown with categorized findings)
2. **Prioritized Todo List** (Critical → High → Medium → Low)
3. **Action Items** (With file paths, line numbers, and effort estimates)
4. **Consolidation Plan** (Which components/patterns to merge)
5. **Refactoring Roadmap** (Large components to break down)

## Best Practices for Execution

1. **Multi-Agent Coordination**: Let each agent focus on their domain
2. **Cross-Reference Results**: Avoid duplicate findings between agents
3. **Prioritize Critical Issues**: Address security and performance first
4. **Document Findings**: Include file paths and line numbers
5. **Create Actionable Tasks**: Each item should be clear and fixable
6. **Estimate Impact**: Note effort vs benefit for each finding

## Output Format Template

```markdown
# Repository Audit Report

## Executive Summary
- Total Issues Found: X
- Critical: X
- High: X
- Medium: X
- Low: X

## 🔴 Critical Issues
### Security Vulnerabilities
- [ ] [SEC001] Hardcoded API key in src/config.ts:42
- [ ] [SEC002] Missing input validation in src/api/booking.ts

## 🟠 High Priority Issues
### Performance
- [ ] [PERF001] Large component src/components/BookingWizard.tsx (523 lines)
- [ ] [PERF002] Missing index on bookings.user_id

### Code Quality
- [ ] [QUAL001] TypeScript any usage in src/types/index.ts:15
- [ ] [QUAL002] Unused imports in src/pages/Admin.tsx

## 🟡 Medium Priority Issues
### Consolidation Opportunities
- [ ] [CONS001] 5 similar Form components could be unified
- [ ] [CONS002] Duplicate API calls in services/

## 🟢 Low Priority Issues
### Documentation
- [ ] [DOC001] Missing JSDoc in utils/formatDate.ts

## Recommendations
1. Address all critical security issues immediately
2. Focus on high-impact performance improvements
3. Plan consolidation work for next sprint
4. Improve documentation incrementally
```

Remember: The goal is continuous improvement, not perfect cleanup in one go. Focus on high-impact changes first and maintain momentum throughout the process.