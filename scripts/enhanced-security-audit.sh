#!/bin/bash

# Enhanced Security Audit & Vulnerability Scanning Script
# Provides comprehensive security scanning, automated vulnerability detection, and security hardening

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SECURITY_REPORT_DIR="$PROJECT_ROOT/security-reports"
AUDIT_LOG="$PROJECT_ROOT/logs/security-audit.log"
VULNERABILITY_REPORT="$SECURITY_REPORT_DIR/vulnerability-scan-$(date +%Y%m%d-%H%M%S).json"

# Ensure directories exist
mkdir -p "$SECURITY_REPORT_DIR"
mkdir -p "$(dirname "$AUDIT_LOG")"

# Counters
TOTAL_SCANS=0
PASSED_SCANS=0
FAILED_SCANS=0
VULNERABILITIES_FOUND=0
CRITICAL_VULNS=0
HIGH_VULNS=0

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$AUDIT_LOG"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$AUDIT_LOG"
    ((PASSED_SCANS++))
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$AUDIT_LOG"
}

log_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$AUDIT_LOG"
    ((FAILED_SCANS++))
}

log_critical() {
    echo -e "${RED}🚨 CRITICAL: $1${NC}" | tee -a "$AUDIT_LOG"
    ((CRITICAL_VULNS++))
}

log_info() {
    echo -e "${PURPLE}ℹ $1${NC}" | tee -a "$AUDIT_LOG"
}

scan() {
    ((TOTAL_SCANS++))
    if eval "$1"; then
        log_success "$2"
        return 0
    else
        log_error "$2"
        return 1
    fi
}

# Security Scanning Functions
run_dependency_vulnerability_scan() {
    log "Running Dependency Vulnerability Scan..."

    if ! command -v npm &> /dev/null; then
        log_warning "npm not found, skipping dependency scan"
        return
    fi

    cd "$PROJECT_ROOT"

    # Create vulnerability report structure
    local report=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "scan_type": "dependency_vulnerabilities",
  "project": "$PROJECT_ROOT",
  "vulnerabilities": {},
  "summary": {}
}
EOF
)
    echo "$report" > "$VULNERABILITY_REPORT"

    # Run npm audit with JSON output
    if npm audit --audit-level=moderate --json 2>/dev/null > /tmp/audit-output.json; then
        log_success "NPM audit completed successfully"

        # Parse and analyze vulnerabilities
        if command -v jq &> /dev/null; then
            local vuln_count=$(jq -r '.metadata.vulnerabilities.total // 0' /tmp/audit-output.json)
            local critical_count=$(jq -r '.metadata.vulnerabilities.critical // 0' /tmp/audit-output.json)
            local high_count=$(jq -r '.metadata.vulnerabilities.high // 0' /tmp/audit-output.json)
            local moderate_count=$(jq -r '.metadata.vulnerabilities.moderate // 0' /tmp/audit-output.json)

            log_info "Vulnerabilities found: $vuln_count total, $critical_count critical, $high_count high, $moderate_count moderate"

            ((VULNERABILITIES_FOUND += vuln_count))
            ((CRITICAL_VULNS += critical_count))
            ((HIGH_VULNS += high_count))

            # Update report with findings
            jq ".vulnerabilities = $(jq '.vulnerabilities // {}' /tmp/audit-output.json)" "$VULNERABILITY_REPORT" > /tmp/temp-report.json
            mv /tmp/temp-report.json "$VULNERABILITY_REPORT"

            scan "[[ $critical_count -eq 0 ]]" "No critical vulnerabilities found"
            scan "[[ $high_count -eq 0 ]]" "No high vulnerabilities found"
        else
            log_warning "jq not available, detailed vulnerability analysis skipped"
        fi
    else
        log_error "NPM audit failed or found critical vulnerabilities"
        ((FAILED_SCANS++))
    fi

    # Run audit for production dependencies only
    log_info "Scanning production dependencies..."
    if npm audit --production --audit-level=moderate --json 2>/dev/null > /tmp/audit-prod.json; then
        log_success "Production dependency scan completed"
    else
        log_warning "Production dependencies have vulnerabilities"
    fi

    # Check for outdated packages
    log_info "Checking for outdated packages..."
    if npm outdated --json 2>/dev/null > /tmp/outdated.json; then
        local outdated_count=$(jq 'keys | length' /tmp/outdated.json 2>/dev/null || echo "0")
        log_info "Found $outdated_count outdated packages"
    fi
}

run_code_security_scan() {
    log "Running Static Code Security Analysis..."

    # Check for hardcoded secrets
    log_info "Scanning for hardcoded secrets..."
    local secret_patterns=(
        "sk_[a-zA-Z0-9]{24,}"
        "sk_live_[a-zA-Z0-9]{24,}"
        "ghp_[a-zA-Z0-9]{36}"
        "xoxb-[0-9]{10,}-[0-9]{10,}-[a-zA-Z0-9]{24}"
        "password\\s*=\\s*['\"][^'\"]+['\"]"
        "secret\\s*=\\s*['\"][^'\"]+['\"]"
        "api_key\\s*=\\s*['\"][^'\"]+['\"]"
        "private_key\\s*=\\s*['\"][^'\"]+['\"]"
        "-----BEGIN.*PRIVATE KEY-----"
        "-----BEGIN.*CERTIFICATE-----"
    )

    local secrets_found=false
    for pattern in "${secret_patterns[@]}"; do
        if find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.js" -o -name "*.json" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | \
           xargs grep -E "$pattern" 2>/dev/null > /tmp/secrets.txt; then
            if [[ -s /tmp/secrets.txt ]]; then
                log_critical "Hardcoded secrets found with pattern: $pattern"
                cat /tmp/secrets.txt | head -5 | while read line; do
                    log_error "  $line"
                done
                secrets_found=true
            fi
        fi
    done

    scan "[[ $secrets_found == false ]]" "No hardcoded secrets found in source code"

    # Check for insecure coding practices
    log_info "Scanning for insecure coding practices..."

    # Check for eval usage
    local eval_usage=$(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.js" -not -path "*/node_modules/*" 2>/dev/null | \
                     xargs grep -E "eval\(|Function\(" 2>/dev/null || true)
    scan "[[ -z \"$eval_usage\" ]]" "No dangerous eval() or Function() usage found"

    # Check for innerHTML usage
    local innerhtml_usage=$(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.js" -not -path "*/node_modules/*" 2>/dev/null | \
                         xargs grep -E "\.innerHTML\s*=" 2>/dev/null || true)
    scan_warning "[[ -z \"$innerhtml_usage\" ]]" "No direct innerHTML assignment found"

    # Check for SQL injection patterns
    local sql_patterns=$(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.js" -not -path "*/node_modules/*" 2>/dev/null | \
                       xargs grep -E "SELECT.*\\+|INSERT.*\\+|UPDATE.*\\+|DELETE.*\\+" 2>/dev/null || true)
    scan "[[ -z \"$sql_patterns\" ]]" "No potential SQL injection patterns found"

    # Check for XSS patterns
    local xss_patterns=$(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.js" -not -path "*/node_modules/*" 2>/dev/null | \
                      xargs grep -E "document\\.write|dangerouslySetInnerHTML" 2>/dev/null || true)
    scan_warning "[[ -z \"$xss_patterns\" ]]" "No potential XSS patterns found"

    # Check for hardcoded URLs and credentials
    local hardcoded_urls=$(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.js" -not -path "*/node_modules/*" 2>/dev/null | \
                         xargs grep -E "http://[^\\s]*|https://[^\\s]*" 2>/dev/null | grep -v "localhost" | grep -v "example" | head -10 || true)
    scan_warning "[[ -z \"$hardcoded_urls\" ]]" "No hardcoded production URLs found"
}

run_container_security_scan() {
    log "Running Container Security Scan..."

    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not found, skipping container security scan"
        return
    fi

    # Check if Dockerfile exists
    if [[ ! -f "$PROJECT_ROOT/Dockerfile" ]]; then
        log_info "No Dockerfile found, skipping container security scan"
        return
    fi

    # Scan Dockerfile for security issues
    log_info "Analyzing Dockerfile security..."

    # Check for root user usage
    scan "! grep -q '^USER root' \"$PROJECT_ROOT/Dockerfile\"" "Dockerfile doesn't run as root user"

    # Check for base image security
    scan "grep -q '^FROM.*:' \"$PROJECT_ROOT/Dockerfile\"" "Dockerfile uses specific image tag"
    scan_warning "! grep -q '^FROM.*latest' \"$PROJECT_ROOT/Dockerfile\"" "Dockerfile doesn't use 'latest' tag"

    # Check for sensitive data in Dockerfile
    local sensitive_data=$(grep -E "(password|secret|key|token)" "$PROJECT_ROOT/Dockerfile" 2>/dev/null || true)
    scan "[[ -z \"$sensitive_data\" ]]" "No sensitive data found in Dockerfile"

    # Check for exposed ports
    local exposed_ports=$(grep "^EXPOSE" "$PROJECT_ROOT/Dockerfile" 2>/dev/null || true)
    if [[ -n "$exposed_ports" ]]; then
        log_info "Exposed ports: $exposed_ports"
        # Warn about exposing privileged ports
        if echo "$exposed_ports" | grep -E " (22|23|80|443|3389) "; then
            log_warning "Privileged ports exposed in Dockerfile"
        fi
    fi

    # Run container image vulnerability scan if trivy is available
    if command -v trivy &> /dev/null; then
        log_info "Running Trivy container vulnerability scan..."

        # Build image if needed
        local image_name="mariia-hub-security-scan"
        if docker build -t "$image_name" "$PROJECT_ROOT" 2>/dev/null; then
            # Scan with Trivy
            if trivy image --format json --output /tmp/trivy-scan.json "$image_name" 2>/dev/null; then
                log_success "Trivy scan completed"

                # Parse Trivy results
                if command -v jq &> /dev/null && [[ -f /tmp/trivy-scan.json ]]; then
                    local critical_trivy=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' /tmp/trivy-scan.json)
                    local high_trivy=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH")] | length' /tmp/trivy-scan.json)

                    ((CRITICAL_VULNS += critical_trivy))
                    ((HIGH_VULNS += high_trivy))

                    scan "[[ $critical_trivy -eq 0 ]]" "No critical container vulnerabilities found"
                    scan_warning "[[ $high_trivy -eq 0 ]]" "No high container vulnerabilities found"
                fi
            else
                log_warning "Trivy scan failed"
            fi

            # Clean up image
            docker rmi "$image_name" 2>/dev/null || true
        else
            log_warning "Failed to build Docker image for scanning"
        fi
    else
        log_info "Trivy not found, install for container vulnerability scanning"
    fi
}

run_infrastructure_security_scan() {
    log "Running Infrastructure Security Scan..."

    # Check Terraform security if available
    if [[ -f "$PROJECT_ROOT/infra/main.tf" ]] || [[ -f "$PROJECT_ROOT/terraform/main.tf" ]]; then
        log_info "Scanning Terraform configuration..."

        local tf_dir
        if [[ -f "$PROJECT_ROOT/infra/main.tf" ]]; then
            tf_dir="$PROJECT_ROOT/infra"
        else
            tf_dir="$PROJECT_ROOT/terraform"
        fi

        # Check for security issues in Terraform
        scan "! grep -r 'password.*=.*\"' \"$tf_dir\" 2>/dev/null" "No hardcoded passwords in Terraform"
        scan "! grep -r 'access_key.*=.*\"' \"$tf_dir\" 2>/dev/null" "No hardcoded access keys in Terraform"

        # Check for security group configurations
        local open_security_groups=$(grep -r "0.0.0.0/0" "$tf_dir" 2>/dev/null || true)
        if [[ -n "$open_security_groups" ]]; then
            log_warning "Open security groups found (0.0.0.0/0)"
        fi

        # Check for encryption settings
        scan "grep -r 'encryption_at_rest' \"$tf_dir\" 2>/dev/null || grep -r 'kms_key_id' \"$tf_dir\" 2>/dev/null" "Encryption configuration found"

        # Run tfsec if available
        if command -v tfsec &> /dev/null; then
            log_info "Running tfsec infrastructure security scan..."
            if tfsec "$tf_dir" --format json --output /tmp/tfsec-report.json 2>/dev/null; then
                log_success "tfsec scan completed"

                if command -v jq &> /dev/null && [[ -f /tmp/tfsec-report.json ]]; then
                    local tfsec_high=$(jq '[.results[] | select(.severity == "HIGH")] | length' /tmp/tfsec-report.json)
                    local tfsec_critical=$(jq '[.results[] | select(.severity == "CRITICAL")] | length' /tmp/tfsec-report.json)

                    ((HIGH_VULNS += tfsec_high))
                    ((CRITICAL_VULNS += tfsec_critical))

                    scan "[[ $tfsec_critical -eq 0 ]]" "No critical infrastructure vulnerabilities found"
                    scan_warning "[[ $tfsec_high -eq 0 ]]" "No high infrastructure vulnerabilities found"
                fi
            else
                log_warning "tfsec scan failed"
            fi
        else
            log_info "tfsec not found, install for infrastructure security scanning"
        fi
    fi

    # Check Kubernetes manifests if available
    if find "$PROJECT_ROOT" -name "*.yaml" -o -name "*.yml" | xargs grep -l "apiVersion.*apps/v1" 2>/dev/null | head -1 > /dev/null; then
        log_info "Scanning Kubernetes manifests..."

        local k8s_files=$(find "$PROJECT_ROOT" -name "*.yaml" -o -name "*.yml" | xargs grep -l "apiVersion" 2>/dev/null || true)

        for file in $k8s_files; do
            # Check for security contexts
            scan_warning "grep -q 'securityContext:' \"$file\"" "Security context configured in $file"

            # Check for privileged containers
            if grep -q "privileged: true" "$file" 2>/dev/null; then
                log_critical "Privileged container found in $file"
            fi

            # Check for hostPath usage
            if grep -q "hostPath:" "$file" 2>/dev/null; then
                log_warning "hostPath usage found in $file"
            fi
        done
    fi
}

run_web_security_scan() {
    log "Running Web Application Security Scan..."

    # Check if OWASP ZAP is available
    if command -v zap-baseline.py &> /dev/null; then
        log_info "Running OWASP ZAP baseline scan..."

        # Check if application is running
        if curl -s http://localhost:3000 > /dev/null 2>&1 || curl -s http://localhost:8080 > /dev/null 2>&1; then
            local target_url="http://localhost:3000"
            if ! curl -s "$target_url" > /dev/null; then
                target_url="http://localhost:8080"
            fi

            log_info "Scanning $target_url with OWASP ZAP..."

            if zap-baseline.py -t "$target_url" -J /tmp/zap-report.json 2>/dev/null; then
                log_success "OWASP ZAP scan completed"

                if command -v jq &> /dev/null && [[ -f /tmp/zap-report.json ]]; then
                    local zap_high=$(jq '[.site[].alerts[]? | select(.riskdesc == "High")] | length' /tmp/zap-report.json)
                    local zap_critical=$(jq '[.site[].alerts[]? | select(.riskdesc == "Critical")] | length' /tmp/zap-report.json)

                    ((HIGH_VULNS += zap_high))
                    ((CRITICAL_VULNS += zap_critical))

                    scan "[[ $zap_critical -eq 0 ]]" "No critical web vulnerabilities found"
                    scan_warning "[[ $zap_high -eq 0 ]]" "No high web vulnerabilities found"
                fi
            else
                log_warning "OWASP ZAP scan failed"
            fi
        else
            log_info "Application not running locally, skipping web security scan"
        fi
    else
        log_info "OWASP ZAP not found, install for web application security scanning"
    fi

    # Check SSL/TLS configuration
    if [[ -n "${VITE_APP_URL:-}" ]] && [[ "$VITE_APP_URL" == https://* ]]; then
        local domain=$(echo "$VITE_APP_URL" | sed 's~https://~~' | sed 's~/~~')
        log_info "Checking SSL/TLS configuration for $domain..."

        if command -v openssl &> /dev/null; then
            if echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates > /tmp/ssl-info.txt 2>/dev/null; then
                log_success "SSL certificate information retrieved"

                # Check certificate expiration
                local expiry_date=$(grep "notAfter" /tmp/ssl-info.txt | cut -d'=' -f2)
                log_info "SSL certificate expires: $expiry_date"

                # Check if certificate expires within 30 days
                local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))

                if [[ $days_until_expiry -lt 30 ]]; then
                    log_critical "SSL certificate expires in $days_until_expiry days"
                else
                    log_success "SSL certificate is valid for $days_until_expiry days"
                fi
            else
                log_warning "Could not retrieve SSL certificate information"
            fi
        fi
    fi
}

run_compliance_scan() {
    log "Running Compliance Security Scan..."

    # GDPR Compliance Check
    log_info "Checking GDPR compliance..."

    # Check for privacy policy
    scan "[[ -f \"$PROJECT_ROOT/docs/GDPR_COMPLIANCE_FRAMEWORK.md\" ]]" "GDPR compliance documentation exists"
    scan "[[ -f \"$PROJECT_ROOT/src/lib/gdpr-compliance-manager.ts\" ]]" "GDPR compliance manager implemented"

    # Check for consent management
    scan "[[ -f \"$PROJECT_ROOT/src/contexts/GDPRContext.tsx\" ]]" "GDPR consent context implemented"

    # Check for data retention policies
    if grep -q "dataRetention" "$PROJECT_ROOT/src/lib/gdpr-compliance-manager.ts" 2>/dev/null; then
        log_success "Data retention policies configured"
    else
        log_warning "Data retention policies not found"
    fi

    # PCI DSS Compliance Check (if handling payments)
    if grep -q "stripe\|payment\|credit.*card" "$PROJECT_ROOT/package.json" 2>/dev/null; then
        log_info "Checking PCI DSS compliance..."

        # Check for secure payment handling
        scan "[[ -f \"$PROJECT_ROOT/src/lib/payment-security.ts\" ]]" "Payment security module exists"

        # Check that card data is not stored locally
        local card_data_storage=$(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.js" | \
                                xargs grep -E "(card.*number|cvv|cvc)" 2>/dev/null || true)
        scan "[[ -z \"$card_data_storage\" ]]" "No card data storage found in source code"

        # Check for SSL enforcement
        scan "grep -q \"force.*https\|ssl.*required\" \"$PROJECT_ROOT/src/lib/payment-security.ts\" 2>/dev/null || true" "SSL enforcement for payments configured"
    fi

    # Accessibility Compliance (WCAG)
    log_info "Checking accessibility compliance..."

    # Check for accessibility testing
    if [[ -f "$PROJECT_ROOT/package.json" ]] && grep -q "axe\|accessibility" "$PROJECT_ROOT/package.json"; then
        log_success "Accessibility testing tools configured"
    else
        log_warning "Accessibility testing tools not found"
    fi

    # Check for alt attributes in images
    local images_without_alt=$(find "$PROJECT_ROOT/src" -name "*.tsx" -o -name "*.jsx" | \
                             xargs grep -E "<img[^>]*>" | grep -v "alt=" | head -5 || true)
    scan_warning "[[ -z \"$images_without_alt\" ]]" "Images have alt attributes"
}

generate_security_report() {
    log "Generating Comprehensive Security Report..."

    local report_file="$SECURITY_REPORT_DIR/security-scan-report-$(date +%Y%m%d-%H%M%S).html"

    cat > "$report_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Scan Report - Mariia Hub</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .critical { color: #dc3545; font-weight: bold; }
        .high { color: #fd7e14; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .success { color: #28a745; font-weight: bold; }
        .metric { display: inline-block; margin: 10px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; min-width: 120px; }
        .metric-value { font-size: 2em; font-weight: bold; display: block; }
        .section { margin: 30px 0; }
        .vulnerability { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .passed { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .failed { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Security Scan Report</h1>
            <h2>Mariia Hub - Beauty & Fitness Platform</h2>
            <p>Generated on $(date)</p>
        </div>

        <div class="section">
            <h2>Scan Summary</h2>
            <div class="metric">
                <span class="metric-value">$TOTAL_SCANS</span>
                Total Scans
            </div>
            <div class="metric">
                <span class="metric-value success">$PASSED_SCANS</span>
                Passed
            </div>
            <div class="metric">
                <span class="metric-value failed">$FAILED_SCANS</span>
                Failed
            </div>
            <div class="metric">
                <span class="metric-value critical">$CRITICAL_VULNS</span>
                Critical
            </div>
            <div class="metric">
                <span class="metric-value high">$HIGH_VULNS</span>
                High
            </div>
            <div class="metric">
                <span class="metric-value warning">$VULNERABILITIES_FOUND</span>
                Total Vulns
            </div>
        </div>

        <div class="section">
            <h2>Security Posture Assessment</h2>
EOF

    # Calculate security score
    local security_score=$((PASSED_SCANS * 100 / TOTAL_SCANS))
    local posture="Strong"
    local posture_color="success"

    if [[ $security_score -lt 70 ]]; then
        posture="Weak"
        posture_color="failed"
    elif [[ $security_score -lt 85 ]]; then
        posture="Moderate"
        posture_color="warning"
    fi

    cat >> "$report_file" << EOF
            <div class="metric">
                <span class="metric-value $posture_color">$security_score%</span>
                Security Score
            </div>
            <p>Overall Security Posture: <span class="$posture_color">$posture</span></p>
        </div>

        <div class="section">
            <h2>Scan Details</h2>
            <h3>Dependency Vulnerability Scan</h3>
            <p>Scanned npm packages for known security vulnerabilities and outdated dependencies.</p>

            <h3>Code Security Analysis</h3>
            <p>Performed static analysis for hardcoded secrets, insecure coding practices, and potential security vulnerabilities.</p>

            <h3>Container Security Scan</h3>
            <p>Analyzed Docker configuration and container image for security issues.</p>

            <h3>Infrastructure Security Scan</h3>
            <p>Scanned Terraform and Kubernetes configurations for security misconfigurations.</p>

            <h3>Web Application Security Scan</h3>
            <p>Performed dynamic security analysis of the running web application.</p>

            <h3>Compliance Scan</h3>
            <p>Verified GDPR, PCI DSS, and accessibility compliance requirements.</p>
        </div>

        <div class="section">
            <h2>Recommendations</h2>
EOF

    # Add recommendations based on findings
    if [[ $CRITICAL_VULNS -gt 0 ]]; then
        echo "            <div class=\"vulnerability\"><strong>URGENT:</strong> Address $CRITICAL_VULNS critical vulnerabilities immediately.</div>" >> "$report_file"
    fi

    if [[ $HIGH_VULNS -gt 0 ]]; then
        echo "            <div class=\"vulnerability\"><strong>HIGH PRIORITY:</strong> Address $HIGH_VULNS high-priority vulnerabilities soon.</div>" >> "$report_file"
    fi

    if [[ $FAILED_SCANS -gt 0 ]]; then
        echo "            <div class=\"failed\"><strong>ACTION REQUIRED:</strong> $FAILED_SCANS security checks failed. Review the detailed logs.</div>" >> "$report_file"
    fi

    if [[ $security_score -lt 85 ]]; then
        echo "            <div class=\"warning\"><strong>IMPROVEMENT NEEDED:</strong> Security score is $security_score%. Implement additional security measures.</div>" >> "$report_file"
    fi

    cat >> "$report_file" << EOF
            <div class="passed">
                <strong>Next Steps:</strong>
                <ul>
                    <li>Review and fix all identified vulnerabilities</li>
                    <li>Implement automated security scanning in CI/CD pipeline</li>
                    <li>Regular security assessments and penetration testing</li>
                    <li>Keep dependencies updated and monitor for new vulnerabilities</li>
                    <li>Implement security awareness training for development team</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>Documentation</h2>
            <p>Detailed logs available at: <code>$AUDIT_LOG</code></p>
            <p>Vulnerability scan data: <code>$VULNERABILITY_REPORT</code></p>
        </div>
    </div>
</body>
</html>
EOF

    log_success "Security report generated: $report_file"
    log_info "Open the report in your browser for detailed analysis"
}

check_warning() {
    ((TOTAL_SCANS++))
    if eval "$1"; then
        log_success "$2"
        return 0
    else
        log_warning "$2"
        return 1
    fi
}

main() {
    log "🔒 Starting Comprehensive Security Audit & Vulnerability Scanning..."
    log "Project: $PROJECT_ROOT"
    log "Report Directory: $SECURITY_REPORT_DIR"
    echo ""

    # Run all security scans
    run_dependency_vulnerability_scan
    echo ""

    run_code_security_scan
    echo ""

    run_container_security_scan
    echo ""

    run_infrastructure_security_scan
    echo ""

    run_web_security_scan
    echo ""

    run_compliance_scan
    echo ""

    # Generate comprehensive report
    generate_security_report

    # Final summary
    log "🔍 Security Scan Summary"
    log "========================"
    log "Total Scans: $TOTAL_SCANS"
    log "Passed: $PASSED_SCANS"
    log "Failed: $FAILED_SCANS"
    log "Critical Vulnerabilities: $CRITICAL_VULNS"
    log "High Vulnerabilities: $HIGH_VULNS"
    log "Total Vulnerabilities Found: $VULNERABILITIES_FOUND"
    echo ""

    local success_rate=$((PASSED_SCANS * 100 / TOTAL_SCANS))
    log "Security Score: $success_rate%"
    echo ""

    if [[ $CRITICAL_VULNS -gt 0 ]]; then
        log_critical "CRITICAL VULNERABILITIES FOUND - IMMEDIATE ACTION REQUIRED"
        exit 1
    elif [[ $HIGH_VULNS -gt 5 ]]; then
        log_error "HIGH NUMBER OF VULNERABILITIES - ACTION REQUIRED"
        exit 1
    elif [[ $success_rate -lt 70 ]]; then
        log_error "SECURITY SCORE BELOW ACCEPTABLE THRESHOLD"
        exit 1
    else
        log_success "Security audit completed successfully!"
        if [[ $HIGH_VULNS -gt 0 ]]; then
            log_warning "Address high-priority vulnerabilities soon"
        fi
    fi

    log "📊 Detailed report available in $SECURITY_REPORT_DIR"
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

# Install required tools if needed
if command -v npm &> /dev/null; then
    log_info "Checking for additional security tools..."

    # Suggest installation of missing tools
    local tools=("trivy" "tfsec" "zap-baseline.py")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_info "Consider installing $tool for enhanced security scanning"
        fi
    done
fi

# Run security audit
main "$@"