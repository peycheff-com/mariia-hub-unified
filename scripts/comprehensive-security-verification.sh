#!/bin/bash

# Comprehensive Security Verification Script
# This script performs end-to-end verification of all security configurations
# before production deployment.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERIFICATION_LOG="$PROJECT_ROOT/logs/security-verification.log"

# Ensure log directory exists
mkdir -p "$(dirname "$VERIFICATION_LOG")"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$VERIFICATION_LOG"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$VERIFICATION_LOG"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$VERIFICATION_LOG"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$VERIFICATION_LOG"
    ((FAILED_CHECKS++))
}

check() {
    ((TOTAL_CHECKS++))
    if eval "$1"; then
        log_success "$2"
        return 0
    else
        log_error "$2"
        return 1
    fi
}

check_warning() {
    ((TOTAL_CHECKS++))
    if eval "$1"; then
        log_success "$2"
        return 0
    else
        log_warning "$2"
        return 1
    fi
}

# Verification functions
verify_environment_security() {
    log "Verifying Environment Security Configuration..."

    # Check production environment
    check_warning "[[ \"${NODE_ENV:-}\" == \"production\" ]]" \
        "NODE_ENV is set to 'production'"

    # Check .env.production exists
    check "[[ -f \"$PROJECT_ROOT/.env.production\" ]]" \
        ".env.production file exists"

    # Check .env file doesn't exist in production
    check_warning "[[ ! -f \"$PROJECT_ROOT/.env\" ]]" \
        "Development .env file is not present"

    # Check file permissions
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        local perms=$(stat -c "%a" "$PROJECT_ROOT/.env.production" 2>/dev/null || stat -f "%A" "$PROJECT_ROOT/.env.production" 2>/dev/null)
        check "[[ \"$perms\" == \"600\" ]]" \
            ".env.production has secure permissions (600)"
    fi

    # Validate environment variables
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        check_env_variables
    fi
}

check_env_variables() {
    log "Validating Environment Variables..."

    # Source production environment
    set -a
    source "$PROJECT_ROOT/.env.production"
    set +a

    # Check required variables
    local required_vars=(
        "VITE_APP_ENV"
        "VITE_APP_URL"
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_PUBLISHABLE_KEY"
        "VITE_STRIPE_PUBLISHABLE_KEY"
        "VITE_SECURITY_HEADERS_ENABLED"
        "VITE_CSP_NONCE_GENERATION"
    )

    for var in "${required_vars[@]}"; do
        check "[[ -n \"${!var:-}\" ]]" \
            "Required environment variable $var is set"
    done

    # Check production-specific values
    check "[[ \"$VITE_APP_ENV\" == \"production\" ]]" \
        "VITE_APP_ENV is set to 'production'"

    check "[[ \"$VITE_APP_URL\" == https://* ]]" \
        "VITE_APP_URL uses HTTPS"

    check "[[ \"$VITE_SECURITY_HEADERS_ENABLED\" == \"true\" ]]" \
        "Security headers are enabled"

    check "[[ \"$VITE_CSP_NONCE_GENERATION\" == \"true\" ]]" \
        "CSP nonce generation is enabled"

    # Check development features are disabled
    check "[[ \"${VITE_HMR:-false}\" != \"true\" ]]" \
        "HMR is disabled in production"

    check "[[ \"${VITE_SOURCE_MAP:-false}\" != \"true\" ]]" \
        "Source maps are disabled in production"

    # Check for placeholder values
    local placeholder_patterns=("template" "example" "your-" "xxxxx" "...")
    for var in "${required_vars[@]}"; do
        local value="${!var:-}"
        local has_placeholder=false
        for pattern in "${placeholder_patterns[@]}"; do
            if [[ "$value" == *"$pattern"* ]]; then
                has_placeholder=true
                break
            fi
        done
        check "[[ \"$has_placeholder\" == \"false\" ]]" \
            "$var does not contain placeholder values"
    done
}

verify_build_security() {
    log "Verifying Build Security..."

    # Check if build exists
    check "[[ -d \"$PROJECT_ROOT/dist\" ]]" \
        "Build directory exists"

    check "[[ -n \"$(ls -A \"$PROJECT_ROOT/dist\" 2>/dev/null)\" ]]" \
        "Build directory is not empty"

    # Check for security issues in build
    if [[ -d "$PROJECT_ROOT/dist" ]]; then
        # Check for source maps
        check "! find \"$PROJECT_ROOT/dist\" -name \"*.map\" | grep -q \".\"" \
            "No source maps found in production build"

        # Check for console.log statements
        local console_logs=$(find "$PROJECT_ROOT/dist" -name "*.js" -exec grep -l "console\.log" {} \; 2>/dev/null || true)
        check_warning "[[ -z \"$console_logs\" ]]" \
            "No console statements found in production build"

        # Check for potential secrets
        local secret_patterns="sk_[a-zA-Z0-9]{24,}|[a-zA-Z0-9_-]{40,}=|-----BEGIN"
        local secrets=$(find "$PROJECT_ROOT/dist" -name "*.js" -exec grep -E "$secret_patterns" {} \; 2>/dev/null || true)
        check "[[ -z \"$secrets\" ]]" \
            "No potential secrets found in build output"

        # Check file sizes
        local large_files=$(find "$PROJECT_ROOT/dist" -name "*.js" -size +1M 2>/dev/null || true)
        check_warning "[[ -z \"$large_files\" ]]" \
            "No large JavaScript files found"
    fi
}

verify_security_headers() {
    log "Verifying Security Headers Configuration..."

    # Check security headers configuration file
    check "[[ -f \"$PROJECT_ROOT/src/lib/security-headers.ts\" ]]" \
        "Security headers configuration file exists"

    # Check if security headers are properly configured
    if [[ -f "$PROJECT_ROOT/src/lib/security-headers.ts" ]]; then
        # Check for required security headers
        local required_headers=(
            "X-Content-Type-Options"
            "X-Frame-Options"
            "X-XSS-Protection"
            "Content-Security-Policy"
            "Referrer-Policy"
        )

        for header in "${required_headers[@]}"; do
            check "grep -q \"$header\" \"$PROJECT_ROOT/src/lib/security-headers.ts\"" \
                "$header is configured in security headers"
        done

        # Check CSP configuration
        check "grep -q \"default-src\" \"$PROJECT_ROOT/src/lib/security-headers.ts\"" \
            "CSP default-src is configured"

        check "grep -q \"script-src\" \"$PROJECT_ROOT/src/lib/security-headers.ts\"" \
            "CSP script-src is configured"

        check "grep -q \"object-src.*none\" \"$PROJECT_ROOT/src/lib/security-headers.ts\"" \
            "CSP object-src is set to none"
    fi
}

verify_audit_logging() {
    log "Verifying Security Audit Logging..."

    # Check audit logging configuration
    check "[[ -f \"$PROJECT_ROOT/src/lib/security-audit.ts\" ]]" \
        "Security audit logging module exists"

    # Check if audit logging is properly configured
    if [[ -f "$PROJECT_ROOT/src/lib/security-audit.ts" ]]; then
        check "grep -q \"class SecurityAuditor\" \"$PROJECT_ROOT/src/lib/security-audit.ts\"" \
            "Security auditor class is implemented"

        check "grep -q \"logEvent\" \"$PROJECT_ROOT/src/lib/security-audit.ts\"" \
            "Event logging function is implemented"

        check "grep -q \"getSecurityMetrics\" \"$PROJECT_ROOT/src/lib/security-audit.ts\"" \
            "Security metrics function is implemented"
    fi

    # Check credential rotation procedures
    check "[[ -f \"$PROJECT_ROOT/scripts/secure-credential-rotation.yml\" ]]" \
        "Secure credential rotation procedures exist"
}

verify_monitoring() {
    log "Verifying Security Monitoring..."

    # Check monitoring configuration
    check "[[ -f \"$PROJECT_ROOT/src/lib/security-monitoring.ts\" ]]" \
        "Security monitoring module exists"

    # Check if monitoring is properly configured
    if [[ -f "$PROJECT_ROOT/src/lib/security-monitoring.ts" ]]; then {
        check "grep -q \"class SecurityMonitoring\" \"$PROJECT_ROOT/src/lib/security-monitoring.ts\"" \
            "Security monitoring class is implemented"

        check "grep -q \"recordAuthAttempt\" \"$PROJECT_ROOT/src/lib/security-monitoring.ts\"" \
            "Authentication monitoring is implemented"

        check "grep -q \"recordRequest\" \"$PROJECT_ROOT/src/lib/security-monitoring.ts\"" \
            "Request monitoring is implemented"

        check "grep -q \"getSecurityScore\" \"$PROJECT_ROOT/src/lib/security-monitoring.ts\"" \
            "Security scoring is implemented"
    }
    fi
}

verify_deployment_security() {
    log "Verifying Deployment Security..."

    # Check deployment script
    check "[[ -f \"$PROJECT_ROOT/scripts/production-deployment-security.sh\" ]]" \
        "Production deployment security script exists"

    check "[[ -x \"$PROJECT_ROOT/scripts/production-deployment-security.sh\" ]]" \
        "Deployment script is executable"

    # Check security validation script
    check "[[ -f \"$PROJECT_ROOT/scripts/security-build-validation.cjs\" ]]" \
        "Security build validation script exists"

    # Check security configuration for Vite
    check "[[ -f \"$PROJECT_ROOT/vite.config.security.ts\" ]]" \
        "Security-aware Vite configuration exists"
}

verify_tests() {
    log "Verifying Security Tests..."

    # Check security test files
    check "[[ -f \"$PROJECT_ROOT/src/test/security/security-verification.test.ts\" ]]" \
        "Security verification tests exist"

    # Check if tests can run (if test framework is available)
    if command -v npm &> /dev/null && [[ -f "$PROJECT_ROOT/package.json" ]]; then
        cd "$PROJECT_ROOT"
        if npm run test:security 2>/dev/null || npm run test 2>/dev/null; then
            log_success "Security tests can be executed"
            ((PASSED_CHECKS++))
        else
            log_warning "Security tests execution failed or not configured"
            ((WARNINGS++))
        fi
        ((TOTAL_CHECKS++))
    fi
}

verify_documentation() {
    log "Verifying Security Documentation..."

    # Check security documentation
    local security_docs=(
        ".env.production.example"
        "src/lib/env-validation.ts"
        "src/lib/security-headers.ts"
        "src/lib/security-audit.ts"
        "src/lib/security-monitoring.ts"
        "scripts/secure-credential-rotation.yml"
    )

    for doc in "${security_docs[@]}"; do
        check "[[ -f \"$PROJECT_ROOT/$doc\" ]]" \
            "Security documentation exists: $doc"
    done
}

run_comprehensive_scan() {
    log "Running Comprehensive Security Scan..."

    # Check for common security issues
    check "! find \"$PROJECT_ROOT/src\" -name \"*.env*\" -not -path \"*/node_modules/*\" 2>/dev/null | grep -q \".\"" \
        "No environment files in source code"

    # Check for hardcoded secrets
    local secret_patterns="sk_[a-zA-Z0-9]{24,}|password.*=|secret.*=|api_key.*="
    local secrets=$(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.js" -o -name "*.json" | \
                   xargs grep -E "$secret_patterns" 2>/dev/null || true)
    check "[[ -z \"$secrets\" ]]" \
        "No hardcoded secrets found in source code"

    # Check for insecure dependencies
    if command -v npm &> /dev/null; then
        cd "$PROJECT_ROOT"
        if npm audit --audit-level=moderate --json 2>/dev/null | jq -e '.vulnerabilities | length == 0' > /dev/null 2>&1; then
            log_success "No moderate or high vulnerabilities found"
            ((PASSED_CHECKS++))
        else
            log_warning "Vulnerabilities found in dependencies"
            ((WARNINGS++))
        fi
        ((TOTAL_CHECKS++))
    fi

    # Check for executable permissions on non-executable files
    local exe_files=$(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.js" -o -name "*.json" | \
                     xargs ls -la 2>/dev/null | grep -E "^-..x" | awk '{print $9}' || true)
    check_warning "[[ -z \"$exe_files\" ]]" \
        "No unexpected executable permissions on source files"
}

generate_report() {
    log "Generating Security Verification Report..."

    echo "" | tee -a "$VERIFICATION_LOG"
    echo "======================================" | tee -a "$VERIFICATION_LOG"
    echo "SECURITY VERIFICATION REPORT" | tee -a "$VERIFICATION_LOG"
    echo "======================================" | tee -a "$VERIFICATION_LOG"
    echo "Date: $(date)" | tee -a "$VERIFICATION_LOG"
    echo "Project: $PROJECT_ROOT" | tee -a "$VERIFICATION_LOG"
    echo "" | tee -a "$VERIFICATION_LOG"
    echo "TOTAL CHECKS: $TOTAL_CHECKS" | tee -a "$VERIFICATION_LOG"
    echo "PASSED: $PASSED_CHECKS" | tee -a "$VERIFICATION_LOG"
    echo "FAILED: $FAILED_CHECKS" | tee -a "$VERIFICATION_LOG"
    echo "WARNINGS: $WARNINGS" | tee -a "$VERIFICATION_LOG"
    echo "" | tee -a "$VERIFICATION_LOG"

    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "SUCCESS RATE: ${success_rate}%" | tee -a "$VERIFICATION_LOG"
    echo "" | tee -a "$VERIFICATION_LOG"

    if [[ $FAILED_CHECKS -eq 0 ]]; then
        if [[ $WARNINGS -eq 0 ]]; then
            echo "🎉 ALL SECURITY CHECKS PASSED!" | tee -a "$VERIFICATION_LOG"
            echo "The application is ready for production deployment." | tee -a "$VERIFICATION_LOG"
        else
            echo "✅ SECURITY CHECKS PASSED WITH WARNINGS" | tee -a "$VERIFICATION_LOG"
            echo "Review warnings before production deployment." | tee -a "$VERIFICATION_LOG"
        fi
    else
        echo "❌ SECURITY CHECKS FAILED" | tee -a "$VERIFICATION_LOG"
        echo "Fix all failed checks before production deployment." | tee -a "$VERIFICATION_LOG"
        exit 1
    fi

    echo "" | tee -a "$VERIFICATION_LOG"
    echo "Detailed log saved to: $VERIFICATION_LOG" | tee -a "$VERIFICATION_LOG"
    echo "======================================" | tee -a "$VERIFICATION_LOG"
}

main() {
    log "Starting Comprehensive Security Verification..."

    verify_environment_security
    verify_build_security
    verify_security_headers
    verify_audit_logging
    verify_monitoring
    verify_deployment_security
    verify_tests
    verify_documentation
    run_comprehensive_scan
    generate_report

    log "Security verification completed successfully!"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    log_error "This script should not be run as root"
    exit 1
fi

# Check if in project directory
if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    log_error "Not in a valid Node.js project directory"
    exit 1
fi

# Run verification
main "$@"