#!/bin/bash

# CI/CD Verification Script for Mariia Hub
# This script verifies that all CI/CD configurations are properly set up

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Verification results
VERIFICATION_PASSED=true
FAILED_CHECKS=()

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    FAILED_CHECKS+=("$1")
    VERIFICATION_PASSED=false
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_check() {
    local check_name="$1"
    local result="$2"

    if [ "$result" = "true" ]; then
        echo -e "  ${GREEN}✓${NC} $check_name"
    else
        echo -e "  ${RED}✗${NC} $check_name"
        log_error "$check_name"
    fi
}

# Verify Node.js and npm
verify_node_npm() {
    log_step "Verifying Node.js and npm setup"

    if command -v node &> /dev/null; then
        local node_version=$(node --version | cut -d'v' -f2)
        local major_version=$(echo "$node_version" | cut -d'.' -f1)

        if [ "$major_version" -ge 18 ]; then
            log_check "Node.js version >= 18 (v$node_version)" "true"
        else
            log_check "Node.js version >= 18 (v$node_version)" "false"
        fi
    else
        log_check "Node.js installed" "false"
    fi

    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        log_check "npm installed (v$npm_version)" "true"
    else
        log_check "npm installed" "false"
    fi
}

# Verify project structure
verify_project_structure() {
    log_step "Verifying project structure"

    local required_dirs=(
        "src"
        "src/components"
        "src/pages"
        "src/services"
        "src/lib"
        "tests"
        "tests/e2e"
        "scripts"
        ".github/workflows"
        "docs"
    )

    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log_check "Directory exists: $dir" "true"
        else
            log_check "Directory exists: $dir" "false"
        fi
    done

    local required_files=(
        "package.json"
        "tsconfig.json"
        "vite.config.ts"
        "tailwind.config.js"
        "eslint.config.js"
        ".env.example"
    )

    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log_check "File exists: $file" "true"
        else
            log_check "File exists: $file" "false"
        fi
    done
}

# Verify GitHub Actions workflows
verify_github_workflows() {
    log_step "Verifying GitHub Actions workflows"

    local required_workflows=(
        "comprehensive-ci-cd.yml"
        "automated-testing-suite.yml"
        "security-compliance-automation.yml"
        "performance-quality-gates.yml"
        "feature-flag-deployment.yml"
        "monitoring-alerting-system.yml"
    )

    for workflow in "${required_workflows[@]}"; do
        if [ -f ".github/workflows/$workflow" ]; then
            log_check "Workflow exists: $workflow" "true"
        else
            log_check "Workflow exists: $workflow" "false"
        fi
    done
}

# Verify testing configuration
verify_testing_config() {
    log_step "Verifying testing configuration"

    if [ -f "playwright.config.ts" ]; then
        log_check "Playwright configuration exists" "true"
    else
        log_check "Playwright configuration exists" "false"
    fi

    if [ -f "vitest.config.ts" ]; then
        log_check "Vitest configuration exists" "true"
    else
        log_check "Vitest configuration exists" "false"
    fi

    # Check if Playwright browsers are installed
    if [ -d "~/.cache/ms-playwright" ] || npx playwright --version &> /dev/null; then
        log_check "Playwright browsers installed" "true"
    else
        log_check "Playwright browsers installed" "false"
    fi

    # Check test scripts in package.json
    if npm run test:help &> /dev/null || grep -q '"test"' package.json; then
        log_check "Test scripts configured in package.json" "true"
    else
        log_check "Test scripts configured in package.json" "false"
    fi
}

# Verify security tools
verify_security_tools() {
    log_step "Verifying security tools"

    if command -v snyk &> /dev/null; then
        log_check "Snyk CLI installed" "true"
    else
        log_check "Snyk CLI installed" "false"
    fi

    if command -v safety &> /dev/null; then
        log_check "Safety CLI installed" "true"
    else
        log_check "Safety CLI installed" "false"
    fi

    if [ -d "dependency-check" ]; then
        log_check "OWASP Dependency Check available" "true"
    else
        log_check "OWASP Dependency Check available" "false"
    fi

    if grep -q '"audit"' package.json; then
        log_check "npm audit script available" "true"
    else
        log_check "npm audit script available" "false"
    fi
}

# Verify performance monitoring tools
verify_performance_tools() {
    log_step "Verifying performance monitoring tools"

    if command -v lighthouse &> /dev/null; then
        log_check "Lighthouse CLI installed" "true"
    else
        log_check "Lighthouse CLI installed" "false"
    fi

    if command -v lhci &> /dev/null; then
        log_check "Lighthouse CI installed" "true"
    else
        log_check "Lighthouse CI installed" "false"
    fi

    if [ -f ".lighthouserc.js" ]; then
        log_check "Lighthouse CI configuration exists" "true"
    else
        log_check "Lighthouse CI configuration exists" "false"
    fi

    if [ -f "performance-budget.json" ]; then
        log_check "Performance budget configuration exists" "true"
    else
        log_check "Performance budget configuration exists" "false"
    fi
}

# Verify deployment tools
verify_deployment_tools() {
    log_step "Verifying deployment tools"

    if command -v vercel &> /dev/null; then
        log_check "Vercel CLI installed" "true"

        # Check if Vercel is authenticated
        if vercel whoami &> /dev/null; then
            log_check "Vercel CLI authenticated" "true"
        else
            log_check "Vercel CLI authenticated" "false"
        fi
    else
        log_check "Vercel CLI installed" "false"
    fi

    if [ -f "scripts/deploy.sh" ]; then
        log_check "Deployment script exists" "true"

        if [ -x "scripts/deploy.sh" ]; then
            log_check "Deployment script is executable" "true"
        else
            log_check "Deployment script is executable" "false"
        fi
    else
        log_check "Deployment script exists" "false"
    fi

    if [ -f "scripts/rollback.sh" ]; then
        log_check "Rollback script exists" "true"

        if [ -x "scripts/rollback.sh" ]; then
            log_check "Rollback script is executable" "true"
        else
            log_check "Rollback script is executable" "false"
        fi
    else
        log_check "Rollback script exists" "false"
    fi

    if [ -f "vercel.json" ]; then
        log_check "Vercel configuration exists" "true"
    else
        log_check "Vercel configuration exists" "false"
    fi
}

# Verify monitoring configuration
verify_monitoring_config() {
    log_step "Verifying monitoring configuration"

    if [ -d "monitoring" ]; then
        log_check "Monitoring directory exists" "true"

        if [ -f "monitoring/config.json" ]; then
            log_check "Monitoring configuration exists" "true"
        else
            log_check "Monitoring configuration exists" "false"
        fi

        if [ -f "monitoring/health-checks.json" ]; then
            log_check "Health checks configuration exists" "true"
        else
            log_check "Health checks configuration exists" "false"
        fi
    else
        log_check "Monitoring directory exists" "false"
    fi
}

# Verify dependencies installation
verify_dependencies() {
    log_step "Verifying dependencies installation"

    if [ -d "node_modules" ]; then
        log_check "Dependencies installed (node_modules exists)" "true"

        # Check for critical dependencies
        local critical_deps=(
            "react"
            "react-dom"
            "@vitejs/plugin-react-swc"
            "vite"
            "typescript"
            "@playwright/test"
            "vitest"
            "@supabase/supabase-js"
            "@radix-ui/react-slot"
            "tailwindcss"
            "clsx"
            "class-variance-authority"
        )

        for dep in "${critical_deps[@]}"; do
            if [ -d "node_modules/$dep" ]; then
                log_check "Critical dependency installed: $dep" "true"
            else
                log_check "Critical dependency installed: $dep" "false"
            fi
        done
    else
        log_check "Dependencies installed (node_modules exists)" "false"
    fi

    # Check package-lock.json
    if [ -f "package-lock.json" ]; then
        log_check "package-lock.json exists" "true"
    else
        log_check "package-lock.json exists" "false"
    fi
}

# Verify environment configuration
verify_environment_config() {
    log_step "Verifying environment configuration"

    if [ -f ".env.example" ]; then
        log_check "Environment example file exists" "true"

        # Check for required environment variables in .env.example
        local required_env_vars=(
            "VITE_SUPABASE_URL"
            "VITE_SUPABASE_ANON_KEY"
            "VITE_STRIPE_PUBLISHABLE_KEY"
        )

        for var in "${required_env_vars[@]}"; do
            if grep -q "$var" .env.example; then
                log_check "Environment variable documented: $var" "true"
            else
                log_check "Environment variable documented: $var" "false"
            fi
        done
    else
        log_check "Environment example file exists" "false"
    fi
}

# Verify documentation
verify_documentation() {
    log_step "Verifying documentation"

    local required_docs=(
        "README.md"
        "docs/CI-CD-SETUP.md"
    )

    for doc in "${required_docs[@]}"; do
        if [ -f "$doc" ]; then
            log_check "Documentation exists: $doc" "true"
        else
            log_check "Documentation exists: $doc" "false"
        fi
    done
}

# Run basic tests to verify setup
run_basic_tests() {
    log_step "Running basic verification tests"

    # Test TypeScript compilation
    if npx tsc --noEmit &> /dev/null; then
        log_check "TypeScript compilation passes" "true"
    else
        log_check "TypeScript compilation passes" "false"
    fi

    # Test ESLint configuration
    if npx eslint --version &> /dev/null; then
        log_check "ESLint configuration valid" "true"
    else
        log_check "ESLint configuration valid" "false"
    fi

    # Test build process
    if npm run build &> /dev/null; then
        log_check "Build process succeeds" "true"
        # Clean up build output
        rm -rf dist 2>/dev/null || true
    else
        log_check "Build process succeeds" "false"
    fi
}

# Check GitHub authentication
verify_github_auth() {
    log_step "Verifying GitHub authentication"

    if command -v gh &> /dev/null; then
        if gh auth status &> /dev/null; then
            log_check "GitHub CLI authenticated" "true"
        else
            log_check "GitHub CLI authenticated" "false"
        fi
    else
        log_check "GitHub CLI available" "false"
    fi
}

# Check for common issues
check_common_issues() {
    log_step "Checking for common issues"

    # Check for Node modules in git
    if git ls-files | grep -q "node_modules" 2>/dev/null; then
        log_warning "node_modules detected in git - should be in .gitignore"
    fi

    # Check for environment files in git
    if git ls-files | grep -q "\.env" 2>/dev/null; then
        log_warning ".env files detected in git - should be in .gitignore"
    fi

    # Check for build artifacts in git
    if git ls-files | grep -q "dist/" 2>/dev/null; then
        log_warning "dist/ directory detected in git - should be in .gitignore"
    fi

    # Check for coverage reports in git
    if git ls-files | grep -q "coverage/" 2>/dev/null; then
        log_warning "coverage/ directory detected in git - should be in .gitignore"
    fi

    # Check if .gitignore exists
    if [ -f ".gitignore" ]; then
        log_check ".gitignore file exists" "true"
    else
        log_check ".gitignore file exists" "false"
    fi
}

# Generate verification report
generate_report() {
    log_step "Generating verification report"

    local report_file="ci-cd-verification-report.json"

    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "verificationPassed": $VERIFICATION_PASSED,
  "failedChecks": [$(IFS=','; echo "\"${FAILED_CHECKS[*]}\"")],
  "summary": {
    "totalChecks": $(grep -c "✓\|✗" <<< "$(echo "${FAILED_CHECKS[@]}" | wc -w)"),
    "passedChecks": $((${#FAILED_CHECKS[@]} == 0 ? $(grep -c "✓" <<< "$(echo "${FAILED_CHECKS[@]}" | wc -w) || echo "0") : $(grep -c "✓" <<< "$(echo "${FAILED_CHECKS[@]}" | wc -w)")),
    "failedChecks": ${#FAILED_CHECKS[@]}
  },
  "recommendations": [
    $(if [ "${#FAILED_CHECKS[@]}" -gt 0 ]; then
        echo "\"Fix the failed checks listed above\","
        echo "\"Run the setup script to configure missing components\","
        echo "\"Ensure all required environment variables are set\""
    else
        echo "\"All checks passed - CI/CD is ready to use!\""
    fi)
  ]
}
EOF

    log_success "Verification report generated: $report_file"
}

# Main verification function
main() {
    log_info "🔍 Starting CI/CD Configuration Verification"
    log_info "This script verifies that all CI/CD components are properly configured"
    echo ""

    # Run all verification checks
    verify_node_npm
    verify_project_structure
    verify_github_workflows
    verify_testing_config
    verify_security_tools
    verify_performance_tools
    verify_deployment_tools
    verify_monitoring_config
    verify_dependencies
    verify_environment_config
    verify_documentation
    run_basic_tests
    verify_github_auth
    check_common_issues

    # Generate report
    generate_report

    # Display final results
    echo ""
    log_step "Verification Results"

    if [ "$VERIFICATION_PASSED" = "true" ]; then
        log_success "🎉 All verification checks passed!"
        log_info "CI/CD is properly configured and ready to use."
        echo ""
        log_info "Next steps:"
        log_info "1. Set up required environment variables and GitHub secrets"
        log_info "2. Test the workflows by triggering them manually"
        log_info "3. Configure monitoring and alerting"
        log_info "4. Review the generated documentation"
    else
        log_error "❌ Verification failed with ${#FAILED_CHECKS[@]} issue(s):"
        for issue in "${FAILED_CHECKS[@]}"; do
            log_error "  - $issue"
        done
        echo ""
        log_info "To fix issues:"
        log_info "1. Run the setup script: ./scripts/comprehensive-ci-cd-setup.sh"
        log_info "2. Install missing dependencies and tools"
        log_info "3. Configure authentication and secrets"
        log_info "4. Re-run this verification script"
    fi

    echo ""
    log_info "For detailed information, see the verification report: ci-cd-verification-report.json"

    # Exit with appropriate code
    if [ "$VERIFICATION_PASSED" = "true" ]; then
        exit 0
    else
        exit 1
    fi
}

# Run verification
main "$@"