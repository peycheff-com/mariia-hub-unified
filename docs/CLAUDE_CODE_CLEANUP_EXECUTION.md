# Claude Code Multi-Agent Repository Cleanup Execution

## Quick Start Command

Run this in Claude Code to initiate the repository cleanup audit:

```
/task "Execute comprehensive repository cleanup audit" "Please run a comprehensive audit of the Mariia Hub repository to identify all cleaning opportunities. Use the cleanup audit prompt at docs/REPOSITORY_CLEANUP_AUDIT_PROMPT.md as your guide.

Key requirements:
1. Deploy multiple specialized agents to analyze different parts of the codebase in parallel
2. Use the Explore agent extensively to understand the codebase structure
3. Focus on finding: dead code, duplicates, unused dependencies, security issues, performance problems
4. Create a detailed todo list organized by priority and category
5. Include file paths and line numbers for each issue found
6. Estimate effort and impact for each cleanup task

Start by reading the audit prompt, then deploy agents to analyze:
- Frontend code (src/)
- Backend code (supabase/)
- Configuration files
- Documentation
- Assets
- Tests

Report back with a comprehensive cleanup plan." subagent_type=general-purpose
```

## Detailed Execution Plan

### Phase 1: Initial Reconnaissance (Parallel Agents)

Deploy these agents simultaneously:

```bash
# Agent 1: Frontend Analysis
/task "Frontend cleanup audit" "Analyze all frontend code in src/ directory for cleanup opportunities:
- Unused components and hooks
- Duplicate code patterns
- Performance issues
- Missing or outdated tests
- Inconsistent patterns
- REFACTORING TARGETS: Large components (>300 lines), complex hooks, deeply nested JSX
- CONSOLIDATION TARGETS: Similar forms, duplicate API calls, repeated patterns
Focus on: src/components/, src/pages/, src/hooks/, src/services/, src/utils/" subagent_type=Explore

# Agent 2: Backend Analysis
/task "Backend cleanup audit" "Analyze backend code for cleanup opportunities:
- Unused database tables/migrations
- Inefficient SQL queries
- Missing indexes
- Unused Supabase functions
- Duplicate database logic
Focus on: supabase/migrations/, supabase/functions/" subagent_type=Explore

# Agent 3: Configuration & Dependencies
/task "Configuration cleanup audit" "Check all configuration files for issues:
- Unused dependencies in package.json
- Outdated packages
- Security vulnerabilities
- Conflicting configurations
- Optimized build settings
Focus on: package.json, tsconfig files, vite.config.ts, eslint configs" subagent_type=general-purpose

# Agent 4: Documentation & Assets
/task "Docs and assets cleanup" "Review documentation and assets for cleanup:
- Outdated documentation
- Unused images/assets
- Large files that need optimization
- Duplicate or conflicting docs
Focus on: docs/, public/assets/, README files" subagent_type=Explore
```

### Phase 2: Deep Dive Analysis

After initial reconnaissance, run targeted analysis:

```bash
# Agent 5: Security Audit
/task "Security cleanup audit" "Perform security-focused cleanup analysis:
- Hardcoded secrets or API keys
- Insecure API endpoints
- Missing input validation
- Outdated security dependencies
- CORS configuration issues
Search patterns: API_KEY, PASSWORD, SECRET, process.env" subagent_type=general-purpose

# Agent 6: Performance Audit
/task "Performance cleanup audit" "Identify performance cleanup opportunities:
- Bundle size issues
- Unoptimized images
- Missing code splitting
- Inefficient React patterns
- Database query optimization
Focus on: large components, missing lazy loading, expensive operations" subagent_type=general-purpose
```

### Phase 3: Synthesis and Reporting

```bash
# Agent 7: Report Generation
/task "Generate cleanup report" "Synthesize all findings into a comprehensive cleanup report:
1. Consolidate all issues found by other agents
2. Remove duplicates and prioritize
3. Organize by category (dead code, duplicates, security, etc.)
4. Create actionable todo list with file paths
5. Estimate effort and impact for each item
6. Suggest order of operations
Output format: Markdown with clear sections and priorities" subagent_type=general-purpose
```

## Manual Execution Steps

If you prefer to run the audit manually:

### 1. Read the Audit Prompt
First, familiarize yourself with the comprehensive audit plan:
```bash
Read /Users/ivan/Code/mariia-hub-unified/docs/REPOSITORY_CLEANUP_AUDIT_PROMPT.md
```

### 2. Deploy Explore Agent for Codebase Understanding
```bash
/task "Map codebase structure" "Create a comprehensive map of the Mariia Hub codebase structure. Identify:
- Main directories and their purposes
- Key components and their relationships
- Areas with potential technical debt
- Recent changes that might have left cleanup opportunities
Focus on understanding the architecture to identify cleanup targets." subagent_type=Explore
```

### 3. Run Targeted Searches

#### Find Unused Imports
```bash
Grep --pattern "^import.*from" --path src --glob "*.tsx" --output_mode files_with_matches | head -20
```

#### Find Commented Out Code
```bash
Grep --pattern "^\s*//.*" --path src --glob "*.{ts,tsx}" --output_mode content | grep -E "(TODO|FIXME|DEPRECATED|XXX)" | head -20
```

#### Find Large Files
```bash
Bash --command "find . -type f -size +500k -not -path './node_modules/*' -not -path './.git/*' | head -20"
```

#### Find Duplicate Components
```bash
Glob --pattern "src/components/**/*" | grep -i test
Grep --pattern "export.*function" --path src/components --glob "*.tsx" | cut -d: -f1 | sort | uniq -c | sort -nr | head -10
```

#### Find Refactoring Targets
```bash
# Find large components (>300 lines)
Bash --command "find src -name '*.tsx' -exec wc -l {} + | awk '$1 > 300 {print}' | sort -nr"

# Find components with many hooks
Grep --pattern "useState|useEffect|useCallback|useMemo" --path src --glob "*.tsx" | cut -d: -f1 | sort | uniq -c | sort -nr | head -10

# Find nested ternary operators
Grep --pattern "\\?[^:]*\\?[^:]*:" --path src --glob "*.{ts,tsx}" --output_mode content | head -20

# Find magic numbers (hard-coded values)
Grep --pattern "[^a-zA-Z][0-9]{2,}[^a-zA-Z0-9]" --path src --glob "*.{ts,tsx}" --output_mode content | grep -v "//" | head -20

# Find long functions (>50 lines)
Bash --command "find src -name '*.{ts,tsx}' -exec awk '/^(function|const).*=.*=>|function/ {func=$2; line=NR; next} /^}/ {if(NR-line > 50) print FILENAME\":\"func\":\"line\":\"(NR-line)}' {} \; 2>/dev/null | head -20"
```

#### Find Consolidation Opportunities
```bash
# Find similar form components
Glob --pattern "src/components/**/*Form*.tsx"
Glob --pattern "src/components/**/*Modal*.tsx"
Glob --pattern "src/components/**/*Card*.tsx"

# Find duplicate API calls
Grep --pattern "fetch\\(|axios\\(|supabase\\.from" --path src/services --glob "*.ts" | cut -d: -f2 | sort | uniq -c | sort -nr | head -10

# Find similar validation patterns
Grep --pattern "validation|validator|validate" --path src --glob "*.{ts,tsx}" --output_mode files_with_matches

# Find duplicate error handling
Grep --pattern "catch.*error|\\.catch\\(|try.*catch" --path src --glob "*.{ts,tsx}" --output_mode files_with_matches
```

#### Check Package Dependencies
```bash
Read /Users/ivan/Code/mariia-hub-unified/package.json
Bash --command "npm outdated 2>/dev/null || echo 'No outdated packages found'"
```

### 4. Analyze Specific Areas

#### Unused Routes
```bash
Grep --pattern "path=" src/routes/* | head -20
Grep --pattern "createBrowserRouter|Routes|Route" src/App.tsx
```

#### Unused Environment Variables
```bash
Grep --pattern "process\.env\." src --glob "*.{ts,tsx,js}" | sort | uniq
```

#### Dead SQL Functions
```bash
Grep --pattern "CREATE OR REPLACE FUNCTION" supabase/migrations/*.sql
Grep --pattern "SELECT.*\(" supabase/migrations/*.sql | grep -v "CREATE"
```

### 5. Create Todo List

Use the TodoWrite tool to track findings:

```bash
/todo "Remove unused component: OldComponent.tsx (src/components/OldComponent.tsx)" status pending
/todo "Update deprecated API usage in bookingService.ts" status pending
/todo "Remove unused dependency: old-package" status pending
/todo "Add missing index to bookings table for performance" status pending
```

## Cleanup Priority Matrix

| Priority | Type | Examples | Action |
|----------|------|----------|---------|
| **CRITICAL** | Security | Hardcoded secrets, vulnerable dependencies | Immediate |
| **HIGH** | Dead Code | Unused components, imports | This sprint |
| **HIGH** | Performance | Missing indexes, large bundles | This sprint |
| **HIGH** | Refactoring | Large components (>300 lines), complex functions | This sprint |
| **MEDIUM** | Duplicates | Similar components, repeated logic | Next sprint |
| **MEDIUM** | Consolidation | Duplicate API calls, similar forms | Next sprint |
| **MEDIUM** | Organization | File structure, naming | Next sprint |
| **LOW** | Documentation | Outdated comments, missing docs | When time allows |

## Output Template

Your final report should include:

```markdown
# Repository Cleanup Report

## Executive Summary
- Total Issues: X
- Critical: X
- High: X
- Medium: X
- Low: X

## Quick Wins (This Week)
1. [ ] Remove unused import in Component.tsx
2. [ ] Delete deprecated endpoint
3. [ ] Update package version

## Phase 1: Dead Code Removal (Week 1)
- List all dead code items with locations

## Phase 2: Security Fixes (Week 1-2)
- List all security issues

## Phase 3: Performance (Week 2-3)
- List performance optimizations

## Phase 4: Organization (Week 3-4)
- Code organization improvements

## Phase 5: Documentation (Ongoing)
- Documentation updates needed
```

## Tips for Effective Cleanup

1. **Start Small**: Begin with clearly unused code
2. **Test Everything**: Run tests after each cleanup batch
3. **Commit Often**: Create logical commits for each cleanup category
4. **Communicate**: Let team know what you're cleaning up
5. **Measure**: Track improvement in bundle size, build time, etc.

## Automation Opportunities

After manual cleanup, consider automating:
- Pre-commit hooks for unused imports
- CI/CD checks for bundle size
- Dependency update bots
- Security vulnerability scanning
- Code quality linting rules

Remember: The goal is continuous improvement, not perfect cleanup in one go.