# Repository Cleanup Audit Prompt

## Overview
You are conducting a comprehensive audit of the Mariia Hub repository to identify all cleaning opportunities and create a complete todo list for cleanup. This is a critical task to maintain code quality, reduce technical debt, and improve maintainability.

## Context
- **Project**: Mariia Hub - Premium beauty and fitness booking platform
- **Tech Stack**: React 18, TypeScript, Vite, Supabase, shadcn/ui, Tailwind CSS
- **Current State**: Active development with multiple phases implemented
- **Goal**: Identify and catalog ALL areas that need cleanup

## Audit Instructions

### 1. **Initial Assessment**
- Use the `Task` tool with subagent_type="Explore" to systematically analyze the codebase
- Focus on finding patterns of technical debt, duplication, and maintenance issues
- Check both frontend and backend code

### 2. **Code Quality Issues to Look For**

#### **A. Unused Code & Dead Code**
- Unused imports and dependencies
- Dead code paths and unreachable code
- Commented out code blocks
- Unused variables and functions
- Obsolete error handling

#### **B. Duplicate Code**
- Copy-pasted components or functions
- Similar API patterns that could be abstracted
- Repeated utility functions
- Duplicate type definitions
- Similar test patterns

#### **C. Outdated Dependencies & Configuration**
- Outdated npm packages with security vulnerabilities
- Unused dependencies in package.json
- Deprecated API usage
- Old configuration files
- Outdated build scripts

#### **D. Inconsistent Patterns**
- Inconsistent naming conventions
- Mixed code styles
- Inconsistent error handling
- Variable file structures
- Mixed TypeScript patterns

#### **E. Performance Issues**
- Inefficient database queries
- Missing indexes
- Unoptimized images
- Bundle size issues
- Memory leaks potential

#### **F. Security Concerns**
- Hardcoded secrets or keys
- Insecure API endpoints
- Missing validation
- Outdated security dependencies
- Improper CORS configuration

#### **G. Documentation & Comments**
- Missing or outdated README files
- Uncommented complex logic
- Outdated API documentation
- Missing component prop documentation
- Inconsistent commit messages

#### **H. Testing Issues**
- Missing test coverage
- Outdated test files
- Broken test dependencies
- Tests not following best practices
- Missing test data cleanup

#### **I. Build & Tooling**
- Complex or outdated build configuration
- Missing scripts in package.json
- Inefficient linting rules
- Missing pre-commit hooks
- Outdated CI/CD configuration

#### **J. File Organization**
- Misplaced files
- Inconsistent folder structures
- Large files that should be split
- Missing index files
- Poor naming of directories

#### **K. Refactoring Opportunities**
- Long functions that should be broken down
- Complex components with multiple responsibilities
- Repeated patterns that could be abstracted
- Hard-coded values that should be configurable
- Nested ternary operators or complex conditionals
- Magic numbers and strings
- Deeply nested JSX that needs simplification
- Classes that could be converted to functions/hooks
- Large switch statements that could be strategy patterns
- Complex state management that needs simplification

#### **L. Consolidation Opportunities**
- Multiple similar components that could be unified
- Duplicate API calls that could be batched
- Similar state management patterns
- Repeated validation logic across forms
- Multiple utility libraries doing similar tasks
- Duplicate type definitions or interfaces
- Similar error handling patterns
- Multiple authentication/authorization checks
- Repeated data transformation logic
- Similar loading states and error components

### 3. **Special Areas to Investigate**

#### **Frontend (src/)**
- Components in src/components/ for unused UI elements
- Pages in src/pages/ for deprecated routes
- Hooks in src/hooks/ for unused or duplicate logic
- Services in src/services/ for redundant API calls
- Context providers for unused state management
- **Refactoring targets**: Large components (>300 lines), complex hooks, deeply nested JSX
- **Consolidation targets**: Similar form components, duplicate data fetching patterns

#### **Backend (supabase/)**
- Migration files for unused tables
- Database functions for deprecated features
- Unused RLS policies
- Orphaned stored procedures
- Unoptimized SQL queries
- **Refactoring targets**: Complex SQL functions, repetitive migrations
- **Consolidation targets**: Similar RLS policies, duplicate validation logic

#### **Configuration Files**
- package.json for unused dependencies
- tsconfig files for inconsistent rules
- vite.config.ts for outdated plugins
- eslint configs for conflicting rules
- Docker files for optimization opportunities

#### **Documentation (docs/)**
- Outdated documentation files
- Duplicate or conflicting documentation
- Missing architecture documentation
- Outdated API specs
- Obsolete deployment guides

#### **Assets (public/)**
- Unused images, icons, or media files
- Unoptimized image formats
- Large files that should be CDN-hosted
- Duplicate assets
- Temporary or test assets

### 4. **Output Format**

Create a comprehensive todo list organized by categories:

```markdown
## Repository Cleanup Todo List

### 🗑️ **Phase 1: Remove Dead/Unused Code**
- [ ] Remove unused import: `xyz` from component `abc.tsx`
- [ ] Delete unused component: `src/components/OldComponent.tsx`
- [ ] Remove unused API endpoint: `/api/legacy-endpoint`
- [ ] Clean up unused SCSS/CSS classes

### 🔄 **Phase 2: Refactor Duplicate Code**
- [ ] Extract common pattern from `ComponentA` and `ComponentB` into shared hook
- [ ] Consolidate duplicate API calls in service layer
- [ ] Create shared utility for repeated validation logic
- [ ] Merge similar type definitions

### 🔧 **Phase 2.5: Code Refactoring**
- [ ] Break down large component: `BigComponent.tsx` (>300 lines)
- [ ] Extract complex logic from `useComplexHook` into smaller hooks
- [ ] Simplify nested JSX in `NestedComponent.tsx`
- [ ] Replace magic numbers with constants in `constants.ts`
- [ ] Convert class component to functional: `LegacyClassComponent`
- [ ] Extract strategy pattern from large switch statement
- [ ] Simplify complex state management in `StatefulComponent`
- [ ] Break down long function in `utils.ts` (>50 lines)

### 📦 **Phase 2.75: Code Consolidation**
- [ ] Unify similar form components: `FormA`, `FormB`, `FormC` → `GenericForm`
- [ ] Batch duplicate API calls: `fetchUserData`, `fetchUserSettings` → `fetchUserProfile`
- [ ] Consolidate state patterns: `bookingStore`, `appointmentStore` → unified store
- [ ] Merge duplicate type definitions in `types/`
- [ ] Unify error handling across services
- [ ] Consolidate validation logic in `validators/`
- [ ] Merge similar loading components: `LoadingSpinner`, `PageLoader` → `Loading`
- [ ] Batch similar mutation operations in database

### 📦 **Phase 3: Update Dependencies**
- [ ] Update package.json: remove unused dependency `package-name`
- [ ] Update outdated package: `react` from v17 to v18
- [ ] Fix security vulnerability in `npm-package`
- [ ] Migrate from deprecated API to new version

### 🧹 **Phase 4: Code Organization**
- [ ] Move component to proper directory: `src/components/ui/`
- [ ] Split large file: `BigComponent.tsx` → multiple smaller components
- [ ] Rename file for clarity: `confusing-name.tsx` → `clear-name.tsx`
- [ ] Create barrel exports for component directory

### 🔒 **Phase 5: Security Improvements**
- [ ] Remove hardcoded API key from `config.js`
- [ ] Add input validation to API endpoint
- [ ] Implement proper CORS configuration
- [ ] Add rate limiting to sensitive endpoints

### 📚 **Phase 6: Documentation Updates**
- [ ] Update README.md with current architecture
- [ ] Add JSDoc comments to complex functions
- [ ] Document API endpoints in OpenAPI format
- [ ] Create component prop documentation

### ⚡ **Phase 7: Performance Optimizations**
- [ ] Add database index to slow query
- [ ] Implement lazy loading for heavy component
- [ ] Optimize bundle size by code splitting
- [ ] Add caching to expensive operations

### 🧪 **Phase 8: Testing Improvements**
- [ ] Add unit tests for uncovered function
- [ ] Update broken test after API change
- [ ] Add integration tests for critical flow
- [ ] Remove obsolete test file

### 🔧 **Phase 9: Build & Tooling**
- [ ] Update Vite configuration for better HMR
- [ ] Add pre-commit hooks for code quality
- [ ] Optimize webpack bundle analysis
- [ ] Configure ESLint auto-fix on save

### 📁 **Phase 10: Asset Management**
- [ ] Remove unused images in public/assets/
- [ ] Convert PNG images to WebP format
- [ ] Compress large media files
- [ ] Move static assets to CDN
```

### 5. **Execution Strategy**

1. **Parallel Analysis**:
   - Use multiple Task agents to analyze different sections simultaneously
   - One agent for frontend code, one for backend, one for configuration
   - Cross-reference findings to avoid duplicates

2. **Prioritization**:
   - Mark items as HIGH, MEDIUM, or LOW priority
   - Identify quick wins (easy fixes with high impact)
   - Note dependencies between cleanup tasks

3. **Implementation Notes**:
   - For each item, include:
     - File path with line numbers where applicable
     - Brief explanation of why it needs cleanup
     - Suggested approach for fixing
     - Estimated effort (small/medium/large)
     - Potential risks or side effects

4. **Refactoring Specifics**:
   - Look for components with >20 hooks or >300 lines
   - Identify functions with cyclomatic complexity >10
   - Find nested ternary operators (?: ? : ?)
   - Spot repeated validation patterns
   - Locate hard-coded values that should be constants
   - Check for deeply nested conditionals (if/else chains)

5. **Consolidation Targets**:
   - Find components with similar names (e.g., *Form, *Modal, *Card)
   - Look for duplicate API endpoint calls
   - Identify similar state management patterns
   - Find repeated error handling logic
   - Locate similar data transformation functions

4. **Validation**:
   - Verify that removing code won't break existing functionality
   - Check test coverage before removing unused code
   - Identify safe rollback strategies

### 6. **Tools to Use**

- **Grep**: Search for unused imports, deprecated patterns
  - Search for: `export function`, `const`, `useState`, `useEffect`
  - Find patterns: `TODO:`, `FIXME:`, `DEPRECATED:`, `XXX:`
  - Locate: `magic numbers` (digits > 9 not in variables)
  - Find: nested ternary operators `\?[^:]*\?[^:]*\:`

- **Glob**: Find files by patterns for bulk operations
  - Large files: `src/**/*.{ts,tsx}` (check line count)
  - Similar components: `src/components/*{Form,Modal,Card}*`
  - Test files: `**/*.test.{ts,tsx}`
  - Config files: `**/*config*.{js,json,ts}`

- **Read**: Analyze specific files for issues
  - Check component complexity and line count
  - Review dependency usage
  - Validate imports vs exports

- **Task**: Deploy specialized agents for deep analysis
  - Frontend code review agent
  - Backend SQL optimization agent
  - Security vulnerability scanner
  - Performance analysis agent

- **TodoWrite**: Track progress through the audit
  - Create categorized task lists
  - Mark completion status
  - Track dependencies between tasks

### 7. **Deliverables**

1. **Comprehensive Cleanup Todo List**: All identified issues organized by category
2. **Quick Wins Report**: High-impact, low-effort cleanup tasks
3. **Technical Debt Summary**: Overview of most critical issues
4. **Cleanup Roadmap**: Suggested order of operations
5. **Risk Assessment**: Potential dangers of cleanup operations

### 8. **Success Criteria**

- All dead code identified and cataloged
- All duplicate patterns documented
- Security vulnerabilities noted
- Performance bottlenecks identified
- Clear action plan created
- Effort estimates provided for each task

Remember: The goal is to create a complete, actionable cleanup plan that can be executed systematically to improve code quality, reduce maintenance burden, and optimize the codebase for future development.