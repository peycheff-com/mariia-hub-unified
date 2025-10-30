#!/bin/bash

# Production Readiness Verification Script
# Automates the verification of production infrastructure readiness

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${DOMAIN:-"mariaborysevych.com"}
API_DOMAIN=${API_DOMAIN:-"api.mariaborysevych.com"}
CDN_DOMAIN=${CDN_DOMAIN:-"cdn.mariaborysevych.com"}
REPORT_FILE="production-readiness-report-$(date +%Y%m%d-%H%M%S).json"

# Track verification results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Verification results array
declare -a VERIFICATION_RESULTS=()

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check result function
check_result() {
    local check_name="$1"
    local result="$2"
    local message="$3"
    local severity="${4:-"error"}"

    ((TOTAL_CHECKS++))

    if [[ "$result" == "pass" ]]; then
        ((PASSED_CHECKS++))
        success "✅ $check_name: $message"
        VERIFICATION_RESULTS+=("{\"name\":\"$check_name\",\"result\":\"pass\",\"message\":\"$message\"}")
    elif [[ "$result" == "warning" ]]; then
        ((WARNINGS++))
        warning "⚠️ $check_name: $message"
        VERIFICATION_RESULTS+=("{\"name\":\"$check_name\",\"result\":\"warning\",\"message\":\"$message\"}")
    else
        ((FAILED_CHECKS++))
        error "❌ $check_name: $message"
        VERIFICATION_RESULTS+=("{\"name\":\"$check_name\",\"result\":\"fail\",\"message\":\"$message\"}")
    fi
}

# Verify Vercel configuration
verify_vercel_config() {
    log "Verifying Vercel configuration..."

    # Check if vercel.json exists
    if [[ -f "vercel.json" ]]; then
        check_result "Vercel Config File" "pass" "vercel.json exists"
    else
        check_result "Vercel Config File" "fail" "vercel.json not found"
        return 1
    fi

    # Check production build command
    if grep -q "build:production" package.json; then
        check_result "Production Build Command" "pass" "Production build command found"
    else
        check_result "Production Build Command" "fail" "Production build command not found"
    fi

    # Check edge functions configuration
    if grep -q "runtime.*edge" vercel.json; then
        check_result "Edge Functions" "pass" "Edge functions configured"
    else
        check_result "Edge Functions" "warning" "Edge functions not configured"
    fi

    # Check regions configuration
    if grep -q "regions" vercel.json; then
        check_result "Edge Regions" "pass" "Edge regions configured"
    else
        check_result "Edge Regions" "warning" "Edge regions not specified"
    fi
}

# Verify Supabase configuration
verify_supabase_config() {
    log "Verifying Supabase configuration..."

    # Check environment variables
    if [[ -n "${VITE_SUPABASE_URL:-}" ]]; then
        check_result "Supabase URL" "pass" "Supabase URL configured"
    else
        check_result "Supabase URL" "fail" "Supabase URL not configured"
    fi

    if [[ -n "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
        check_result "Supabase Anon Key" "pass" "Supabase anonymous key configured"
    else
        check_result "Supabase Anon Key" "fail" "Supabase anonymous key not configured"
    fi

    if [[ -n "${VITE_SUPABASE_PROJECT_ID:-}" ]]; then
        check_result "Supabase Project ID" "pass" "Supabase project ID configured"
    else
        check_result "Supabase Project ID" "fail" "Supabase project ID not configured"
    fi

    # Test database connection
    if command -v curl &> /dev/null; then
        local http_status
        http_status=$(curl -s -o /dev/null -w "%{http_code}" "${VITE_SUPABASE_URL}/rest/v1/" 2>/dev/null || echo "000")

        if [[ "$http_status" == "200" ]]; then
            check_result "Supabase Connection" "pass" "Supabase database accessible"
        else
            check_result "Supabase Connection" "fail" "Supabase database not accessible (HTTP $http_status)"
        fi
    fi
}

# Verify SSL/TLS configuration
verify_ssl_config() {
    log "Verifying SSL/TLS configuration..."

    # Check main domain SSL
    if command -v curl &> /dev/null; then
        local ssl_info
        ssl_info=$(curl -s -I "https://$DOMAIN" 2>/dev/null | head -1)

        if [[ "$ssl_info" == *"200"* ]]; then
            check_result "HTTPS Main Domain" "pass" "HTTPS working on main domain"
        else
            check_result "HTTPS Main Domain" "fail" "HTTPS not working on main domain"
        fi

        # Check SSL certificate
        local cert_info
        cert_info=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

        if [[ -n "$cert_info" ]]; then
            check_result "SSL Certificate" "pass" "SSL certificate valid"

            # Check expiry
            local expiry_date
            expiry_date=$(echo "$cert_info" | grep "notAfter=" | cut -d= -f2)
            local expiry_timestamp
            expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
            local current_timestamp
            current_timestamp=$(date +%s)
            local days_until_expiry
            days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))

            if [[ $days_until_expiry -gt 30 ]]; then
                check_result "SSL Certificate Expiry" "pass" "Certificate valid for $days_until_expiry days"
            elif [[ $days_until_expiry -gt 7 ]]; then
                check_result "SSL Certificate Expiry" "warning" "Certificate expires in $days_until_expiry days"
            else
                check_result "SSL Certificate Expiry" "fail" "Certificate expires in $days_until_expiry days"
            fi
        else
            check_result "SSL Certificate" "fail" "Unable to retrieve SSL certificate"
        fi
    fi
}

# Verify DNS configuration
verify_dns_config() {
    log "Verifying DNS configuration..."

    # Check A record
    if command -v dig &> /dev/null; then
        local a_record
        a_record=$(dig +short "$DOMAIN" A 2>/dev/null)

        if [[ -n "$a_record" ]]; then
            check_result "DNS A Record" "pass" "A record found: $a_record"
        else
            check_result "DNS A Record" "fail" "A record not found"
        fi

        # Check CNAME records
        local www_record
        www_record=$(dig +short "www.$DOMAIN" CNAME 2>/dev/null)

        if [[ -n "$www_record" ]]; then
            check_result "DNS WWW Record" "pass" "WWW CNAME found: $www_record"
        else
            check_result "DNS WWW Record" "warning" "WWW CNAME not found"
        fi

        # Check MX records
        local mx_records
        mx_records=$(dig +short "$DOMAIN" MX 2>/dev/null)

        if [[ -n "$mx_records" ]]; then
            check_result "DNS MX Records" "pass" "MX records found"
        else
            check_result "DNS MX Records" "warning" "MX records not found"
        fi

        # Check SPF record
        local spf_record
        spf_record=$(dig +short "$DOMAIN" TXT 2>/dev/null | grep "v=spf1")

        if [[ -n "$spf_record" ]]; then
            check_result "DNS SPF Record" "pass" "SPF record found"
        else
            check_result "DNS SPF Record" "warning" "SPF record not found"
        fi
    fi
}

# Verify security headers
verify_security_headers() {
    log "Verifying security headers..."

    if command -v curl &> /dev/null; then
        local headers
        headers=$(curl -s -I "https://$DOMAIN" 2>/dev/null)

        # Check HSTS
        if echo "$headers" | grep -qi "strict-transport-security"; then
            check_result "HSTS Header" "pass" "HSTS header present"
        else
            check_result "HSTS Header" "fail" "HSTS header missing"
        fi

        # Check X-Frame-Options
        if echo "$headers" | grep -qi "x-frame-options"; then
            check_result "X-Frame-Options Header" "pass" "X-Frame-Options header present"
        else
            check_result "X-Frame-Options Header" "warning" "X-Frame-Options header missing"
        fi

        # Check X-Content-Type-Options
        if echo "$headers" | grep -qi "x-content-type-options"; then
            check_result "X-Content-Type-Options Header" "pass" "X-Content-Type-Options header present"
        else
            check_result "X-Content-Type-Options Header" "warning" "X-Content-Type-Options header missing"
        fi

        # Check CSP
        if echo "$headers" | grep -qi "content-security-policy"; then
            check_result "CSP Header" "pass" "Content Security Policy header present"
        else
            check_result "CSP Header" "warning" "Content Security Policy header missing"
        fi
    fi
}

# Verify performance metrics
verify_performance() {
    log "Verifying performance metrics..."

    # Check if Lighthouse is available
    if command -v lighthouse &> /dev/null; then
        log "Running Lighthouse performance audit..."

        # Create temporary directory for lighthouse output
        local temp_dir
        temp_dir=$(mktemp -d)
        local lighthouse_output="$temp_dir/lighthouse-report.json"

        # Run Lighthouse
        if lighthouse "https://$DOMAIN" \
            --output=json \
            --output-path="$lighthouse_output" \
            --chrome-flags="--headless" \
            --quiet &> /dev/null; then

            if [[ -f "$lighthouse_output" ]]; then
                # Parse performance metrics
                local performance_score
                performance_score=$(jq -r '.categories.performance.score * 100' "$lighthouse_output" 2>/dev/null || echo "0")

                if (( $(echo "$performance_score >= 90" | bc -l) )); then
                    check_result "Lighthouse Performance" "pass" "Performance score: ${performance_score%.*}"
                elif (( $(echo "$performance_score >= 70" | bc -l) )); then
                    check_result "Lighthouse Performance" "warning" "Performance score: ${performance_score%.*} (needs improvement)"
                else
                    check_result "Lighthouse Performance" "fail" "Performance score: ${performance_score%.*} (poor)"
                fi

                # Check other metrics
                local lcp
                lcp=$(jq -r '.audits["largest-contentful-paint"].numericValue / 1000' "$lighthouse_output" 2>/dev/null || echo "999")

                if (( $(echo "$lcp <= 2.5" | bc -l) )); then
                    check_result "LCP Metric" "pass" "LCP: ${lcp%.*}s"
                else
                    check_result "LCP Metric" "warning" "LCP: ${lcp%.*}s (above 2.5s threshold)"
                fi
            fi
        else
            check_result "Lighthouse Test" "warning" "Lighthouse test failed"
        fi

        # Cleanup
        rm -rf "$temp_dir"
    else
        check_result "Lighthouse Tool" "warning" "Lighthouse CLI not installed - skipping performance tests"
    fi

    # Simple response time test
    if command -v curl &> /dev/null; then
        local response_time
        response_time=$(curl -o /dev/null -s -w "%{time_total}" "https://$DOMAIN" 2>/dev/null || echo "999")

        # Convert to milliseconds
        local response_time_ms
        response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "999000")

        if (( $(echo "$response_time_ms <= 3000" | bc -l) )); then
            check_result "Response Time" "pass" "Response time: ${response_time_ms%.*}ms"
        else
            check_result "Response Time" "warning" "Response time: ${response_time_ms%.*}ms (above 3s)"
        fi
    fi
}

# Verify monitoring setup
verify_monitoring() {
    log "Verifying monitoring setup..."

    # Check if Sentry DSN is configured
    if [[ -n "${VITE_SENTRY_DSN:-}" ]]; then
        check_result "Sentry Configuration" "pass" "Sentry DSN configured"
    else
        check_result "Sentry Configuration" "warning" "Sentry DSN not configured"
    fi

    # Check health endpoint
    if command -v curl &> /dev/null; then
        local health_status
        health_status=$(curl -s -o /dev/null -w "%{http_code}" "https://$API_DOMAIN/health" 2>/dev/null || echo "000")

        if [[ "$health_status" == "200" ]]; then
            check_result "Health Endpoint" "pass" "Health endpoint accessible"
        elif [[ "$health_status" == "404" ]]; then
            check_result "Health Endpoint" "warning" "Health endpoint not found (404)"
        else
            check_result "Health Endpoint" "fail" "Health endpoint not accessible (HTTP $health_status)"
        fi
    fi

    # Check monitoring directories
    if [[ -d "config/monitoring" ]]; then
        check_result "Monitoring Config" "pass" "Monitoring configuration directory exists"
    else
        check_result "Monitoring Config" "warning" "Monitoring configuration directory not found"
    fi

    # Check logging configuration
    if [[ -f "config/monitoring/logging.json" ]]; then
        check_result "Logging Config" "pass" "Logging configuration exists"
    else
        check_result "Logging Config" "warning" "Logging configuration not found"
    fi
}

# Verify CDN setup
verify_cdn_setup() {
    log "Verifying CDN setup..."

    # Check CDN domain
    if command -v curl &> /dev/null; then
        local cdn_status
        cdn_status=$(curl -s -o /dev/null -w "%{http_code}" "https://$CDN_DOMAIN" 2>/dev/null || echo "000")

        if [[ "$cdn_status" == "200" ]] || [[ "$cdn_status" == "404" ]]; then
            check_result "CDN Domain" "pass" "CDN domain accessible (HTTP $cdn_status)"
        else
            check_result "CDN Domain" "warning" "CDN domain not accessible (HTTP $cdn_status)"
        fi
    fi

    # Check service worker
    if command -v curl &> /dev/null; then
        local sw_status
        sw_status=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/sw.js" 2>/dev/null || echo "000")

        if [[ "$sw_status" == "200" ]]; then
            check_result "Service Worker" "pass" "Service worker accessible"
        else
            check_result "Service Worker" "warning" "Service worker not accessible (HTTP $sw_status)"
        fi
    fi

    # Check Web App Manifest
    if command -v curl &> /dev/null; then
        local manifest_status
        manifest_status=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/manifest.json" 2>/dev/null || echo "000")

        if [[ "$manifest_status" == "200" ]]; then
            check_result "Web App Manifest" "pass" "Web App Manifest accessible"
        else
            check_result "Web App Manifest" "warning" "Web App Manifest not accessible (HTTP $manifest_status)"
        fi
    fi
}

# Generate comprehensive report
generate_report() {
    log "Generating production readiness report..."

    local success_rate=0
    if [[ $TOTAL_CHECKS -gt 0 ]]; then
        success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    fi

    cat > "$REPORT_FILE" << EOF
{
  "production_readiness_report": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "domain": "$DOMAIN",
    "summary": {
      "total_checks": $TOTAL_CHECKS,
      "passed_checks": $PASSED_CHECKS,
      "failed_checks": $FAILED_CHECKS,
      "warnings": $WARNINGS,
      "success_rate": $success_rate,
      "ready_for_production": $([[ $FAILED_CHECKS -eq 0 ]] && echo "true" || echo "false")
    },
    "verification_results": [
$(IFS=','; echo "${VERIFICATION_RESULTS[*]}")
    ],
    "recommendations": [
      $(if [[ $FAILED_CHECKS -gt 0 ]]; then
          echo '"Address all failed checks before proceeding to production",'
      fi)
      $(if [[ $WARNINGS -gt 0 ]]; then
          echo '"Review and address warnings for optimal performance and security",'
      fi)
      "Implement continuous monitoring and alerting",
      "Schedule regular security audits",
      "Document all operational procedures",
      "Conduct regular disaster recovery testing"
    ],
    "next_steps": [
      $(if [[ $FAILED_CHECKS -gt 0 ]]; then
          echo '"Fix all failed verification checks",'
      fi)
      $(if [[ $WARNINGS -gt 0 ]]; then
          echo '"Address warning conditions",'
      fi)
      "Complete final stakeholder review",
      "Schedule production deployment window",
      "Prepare rollback procedures",
      "Conduct team briefing"
    ]
  }
}
EOF

    success "Report generated: $REPORT_FILE"
}

# Display summary
display_summary() {
    echo ""
    echo "=================================================="
    echo "PRODUCTION READINESS VERIFICATION SUMMARY"
    echo "=================================================="
    echo ""

    local success_rate=0
    if [[ $TOTAL_CHECKS -gt 0 ]]; then
        success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    fi

    echo "Total Checks:     $TOTAL_CHECKS"
    echo "Passed:          $PASSED_CHECKS"
    echo "Failed:          $FAILED_CHECKS"
    echo "Warnings:        $WARNINGS"
    echo "Success Rate:    ${success_rate}%"
    echo ""

    if [[ $FAILED_CHECKS -eq 0 ]]; then
        if [[ $success_rate -ge 90 ]]; then
            success "🎉 EXCELLENT: Ready for production deployment!"
        elif [[ $success_rate -ge 80 ]]; then
            success "✅ GOOD: Ready for production with minor optimizations"
        else
            warning "⚠️ MARGINAL: Proceed with caution, address warnings"
        fi
    else
        error "❌ NOT READY: Address failed checks before deployment"
        echo ""
        echo "Critical issues to fix:"
        for result in "${VERIFICATION_RESULTS[@]}"; do
            if echo "$result" | grep -q '"result":"fail"'; then
                local name
                name=$(echo "$result" | jq -r '.name' 2>/dev/null || echo "Unknown")
                local message
                message=$(echo "$result" | jq -r '.message' 2>/dev/null || echo "No message")
                echo "  • $name: $message"
            fi
        done
    fi

    echo ""
    echo "Full report available in: $REPORT_FILE"
    echo ""
}

# Show usage
show_usage() {
    cat << EOF
Production Readiness Verification Script

Usage: $0 [DOMAIN] [OPTIONS]

Arguments:
  DOMAIN         Domain to verify (default: mariaborysevych.com)

Options:
  --quick        Run only essential checks
  --performance  Include performance tests
  --help         Show this help message

Examples:
  $0 mariaborysevych.com
  $0 --quick
  $0 --performance

This script verifies:
- Vercel configuration
- Supabase setup
- SSL/TLS security
- DNS configuration
- Security headers
- Performance metrics
- Monitoring setup
- CDN configuration

EOF
}

# Main execution
main() {
    local domain="$1"
    local quick_mode=false
    local performance_mode=false

    # Parse arguments
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --quick)
                quick_mode=true
                shift
                ;;
            --performance)
                performance_mode=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Set domain
    if [[ -n "$domain" && "$domain" != "--quick" && "$domain" != "--performance" ]]; then
        DOMAIN="$domain"
        API_DOMAIN="api.$DOMAIN"
        CDN_DOMAIN="cdn.$DOMAIN"
    fi

    log "Starting production readiness verification for $DOMAIN"
    log "Mode: $([ "$quick_mode" == true ] && echo "Quick" || ([ "$performance_mode" == true ] && echo "Performance" || echo "Comprehensive"))"

    # Run verification checks
    verify_vercel_config

    if [[ "$quick_mode" != true ]]; then
        verify_supabase_config
        verify_ssl_config
        verify_dns_config
        verify_security_headers
        verify_monitoring
        verify_cdn_setup
    fi

    if [[ "$performance_mode" == true ]] || [[ "$quick_mode" != true ]]; then
        verify_performance
    fi

    # Generate report and summary
    generate_report
    display_summary

    # Exit with appropriate code
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        exit 1
    elif [[ $WARNINGS -gt 0 ]]; then
        exit 2
    else
        exit 0
    fi
}

# Execute main function
main "$@"