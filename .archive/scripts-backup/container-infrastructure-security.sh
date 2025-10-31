#!/bin/bash

# Container & Infrastructure Security Automation Script
# Provides comprehensive container scanning, infrastructure security checks, and automated hardening

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
CONTAINER_REPORT="$SECURITY_REPORT_DIR/container-security-$(date +%Y%m%d-%H%M%S).json"
INFRA_REPORT="$SECURITY_REPORT_DIR/infra-security-$(date +%Y%m%d-%H%M%S).json"
HARDENING_LOG="$PROJECT_ROOT/logs/security-hardening.log"

# Ensure directories exist
mkdir -p "$SECURITY_REPORT_DIR"
mkdir -p "$(dirname "$HARDENING_LOG")"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0
CONTAINER_VULNS=0
INFRA_VULNS=0

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$HARDENING_LOG"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$HARDENING_LOG"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$HARDENING_LOG"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$HARDENING_LOG"
    ((FAILED_CHECKS++))
}

log_critical() {
    echo -e "${RED}🚨 CRITICAL: $1${NC}" | tee -a "$HARDENING_LOG"
}

log_info() {
    echo -e "${PURPLE}ℹ $1${NC}" | tee -a "$HARDENING_LOG"
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

# Container Security Functions
run_container_image_analysis() {
    log "🐳 Running Container Image Security Analysis..."

    # Initialize container security report
    local container_report=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "scan_type": "container_security",
  "project": "$PROJECT_ROOT",
  "images": {},
  "findings": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "recommendations": []
}
EOF
)
    echo "$container_report" > "$CONTAINER_REPORT"

    # Check if Dockerfile exists
    if [[ ! -f "$PROJECT_ROOT/Dockerfile" ]]; then
        log_info "No Dockerfile found, skipping container analysis"
        return
    fi

    log_info "Analyzing Dockerfile security configuration..."

    # Check Dockerfile security best practices
    local dockerfile_issues=()

    # Base image security
    if grep -q "^FROM.*latest" "$PROJECT_ROOT/Dockerfile"; then
        dockerfile_issues+=("Using 'latest' tag is not recommended for production")
    fi

    if ! grep -q "^FROM.*:" "$PROJECT_ROOT/Dockerfile"; then
        dockerfile_issues+=("Use specific image tags instead of latest")
    fi

    # User security
    if grep -q "^USER root" "$PROJECT_ROOT/Dockerfile"; then
        dockerfile_issues+=("Container runs as root user - security risk")
    fi

    if ! grep -q "^USER " "$PROJECT_ROOT/Dockerfile"; then
        dockerfile_issues+=("No user specified - container may run as root")
    fi

    # Sensitive data exposure
    if grep -E "(password|secret|key|token)" "$PROJECT_ROOT/Dockerfile"; then
        dockerfile_issues+=("Potential sensitive data in Dockerfile")
    fi

    # Layer optimization
    local layer_count=$(grep -c "^RUN\|^COPY\|^ADD" "$PROJECT_ROOT/Dockerfile")
    if [[ $layer_count -gt 10 ]]; then
        dockerfile_issues+=("Consider reducing layer count for better security")
    fi

    # Package management
    if grep -E "apt-get.*update.*&&.*apt-get.*install" "$PROJECT_ROOT/Dockerfile"; then
        log_success "Package caching properly cleaned in Dockerfile"
    else
        dockerfile_issues+=("Package cache should be cleaned in Dockerfile")
    fi

    # Report Dockerfile findings
    if [[ ${#dockerfile_issues[@]} -eq 0 ]]; then
        log_success "Dockerfile follows security best practices"
    else
        log_warning "Dockerfile security issues found:"
        for issue in "${dockerfile_issues[@]}"; do
            log_warning "  • $issue"
        done
    fi

    # Build and scan container image
    if command -v docker &> /dev/null; then
        scan_container_image
    else
        log_warning "Docker not available for container image scanning"
    fi
}

scan_container_image() {
    log_info "Building and scanning container image..."

    local image_name="mariia-hub-security-scan-$$"
    local build_success=false

    # Attempt to build the image
    if docker build -t "$image_name" "$PROJECT_ROOT" > /tmp/docker-build.log 2>&1; then
        build_success=true
        log_success "Container image built successfully"

        # Run container security scans
        scan_with_trivy "$image_name"
        scan_with_docker_scout "$image_name"
        run_container_runtime_checks "$image_name"

        # Extract and analyze image layers
        analyze_image_layers "$image_name"

    else
        log_error "Failed to build container image"
        log_info "Build log: /tmp/docker-build.log"
    fi

    # Cleanup
    if [[ $build_success == true ]]; then
        docker rmi "$image_name" 2>/dev/null || true
    fi
}

scan_with_trivy() {
    local image_name="$1"

    if ! command -v trivy &> /dev/null; then
        log_info "Trivy not found - install for comprehensive container vulnerability scanning"
        return
    fi

    log_info "Running Trivy container vulnerability scan..."

    # Scan for vulnerabilities
    if trivy image --format json --output /tmp/trivy-scan.json "$image_name" 2>/dev/null; then
        log_success "Trivy scan completed successfully"

        if command -v jq &> /dev/null && [[ -f /tmp/trivy-scan.json ]]; then
            # Parse vulnerability counts
            local critical=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' /tmp/trivy-scan.json)
            local high=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH")] | length' /tmp/trivy-scan.json)
            local medium=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "MEDIUM")] | length' /tmp/trivy-scan.json)
            local low=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "LOW")] | length' /tmp/trivy-scan.json)

            ((CONTAINER_VULNS += critical + high + medium + low))

            log_info "Container vulnerabilities found: $critical critical, $high high, $medium medium, $low low"

            # Update report
            if [[ -f "$CONTAINER_REPORT" ]]; then
                jq ".findings.critical = $critical | .findings.high = $high | .findings.medium = $medium | .findings.low = $low" "$CONTAINER_REPORT" > /tmp/temp-container-report.json
                mv /tmp/temp-container-report.json "$CONTAINER_REPORT"
            fi

            # Generate detailed vulnerability report
            if [[ $critical -gt 0 || $high -gt 0 ]]; then
                log_critical "Critical or high vulnerabilities found in container image"
                generate_vulnerability_details /tmp/trivy-scan.json
            fi

            check "[[ $critical -eq 0 ]]" "No critical container vulnerabilities"
            check_warning "[[ $high -eq 0 ]]" "No high container vulnerabilities"
        fi

        # Run additional security checks
        log_info "Running Trivy configuration checks..."
        if trivy image --security-checks config,secret --format json --output /tmp/trivy-config.json "$image_name" 2>/dev/null; then
            log_success "Trivy configuration checks completed"
        fi
    else
        log_warning "Trivy scan failed"
    fi
}

scan_with_docker_scout() {
    local image_name="$1"

    if ! docker scout version &> /dev/null; then
        log_info "Docker Scout not available - install for enhanced container security"
        return
    fi

    log_info "Running Docker Scout vulnerability analysis..."

    if docker scout cves --format json "$image_name" 2>/dev/null > /tmp/docker-scout.json; then
        log_success "Docker Scout analysis completed"

        if command -v jq &> /dev/null && [[ -f /tmp/docker-scout.json ]]; then
            local scout_critical=$(jq '[.vulnerabilities[] | select(.severity == "CRITICAL")] | length' /tmp/docker-scout.json)
            local scout_high=$(jq '[.vulnerabilities[] | select(.severity == "HIGH")] | length' /tmp/docker-scout.json)

            log_info "Docker Scout found: $scout_critical critical, $scout_high high vulnerabilities"
        fi
    else
        log_warning "Docker Scout analysis failed"
    fi
}

run_container_runtime_checks() {
    local image_name="$1"

    log_info "Running container runtime security checks..."

    # Check if we can run the container for analysis
    local container_id
    container_id=$(docker run -d --rm "$image_name" tail -f /dev/null 2>/dev/null || echo "")

    if [[ -n "$container_id" ]]; then
        log_success "Container started for runtime analysis"

        # Check file permissions
        docker exec "$container_id" find / -perm /4000 -type f 2>/dev/null | head -10 > /tmp/setuid-files.txt || true
        local setuid_count=$(wc -l < /tmp/setuid-files.txt 2>/dev/null || echo "0")

        if [[ $setuid_count -gt 0 ]]; then
            log_warning "Found $setuid_count files with SUID permissions"
        else
            log_success "No problematic SUID files found"
        fi

        # Check for open ports
        local open_ports=$(docker exec "$container_id" netstat -tln 2>/dev/null | grep LISTEN || echo "")
        if [[ -n "$open_ports" ]]; then
            log_info "Container listening ports:"
            echo "$open_ports" | while read line; do
                log_info "  $line"
            done
        fi

        # Check process list
        local running_processes=$(docker exec "$container_id" ps aux 2>/dev/null || echo "")
        if [[ -n "$running_processes" ]]; then
            log_info "Container running processes:"
            echo "$running_processes" | head -10
        fi

        # Cleanup
        docker stop "$container_id" >/dev/null 2>&1 || true
    else
        log_warning "Could not start container for runtime analysis"
    fi
}

analyze_image_layers() {
    local image_name="$1"

    log_info "Analyzing container image layers..."

    # Get image history
    local layer_count=$(docker history "$image_name" --format "table {{.CreatedBy}}" | wc -l)
    log_info "Container has $layer_count layers"

    # Check for large layers
    local large_layers=$(docker history "$image_name" --format "table {{.Size}}" | grep -E "MB|GB" | grep -v "0B" | head -5 || true)
    if [[ -n "$large_layers" ]]; then
        log_info "Large layers found:"
        echo "$large_layers" | while read size; do
            log_info "  $size"
        done
    fi

    # Check image size
    local image_size=$(docker images "$image_name" --format "{{.Size}}")
    log_info "Container image size: $image_size"

    # Convert size to MB for comparison
    local size_mb=$(echo "$image_size" | sed 's/MB//' | sed 's/GB/*1024/' | bc 2>/dev/null || echo "0")
    if [[ ${size_mb%.*} -gt 500 ]]; then
        log_warning "Container image is large (${image_size}) - consider optimization"
    fi
}

# Infrastructure Security Functions
run_infrastructure_security_scan() {
    log "🏗️ Running Infrastructure Security Scan..."

    # Initialize infrastructure security report
    local infra_report=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "scan_type": "infrastructure_security",
  "project": "$PROJECT_ROOT",
  "findings": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "services": {},
  "recommendations": []
}
EOF
)
    echo "$infra_report" > "$INFRA_REPORT"

    # Scan different infrastructure components
    scan_terraform_infrastructure
    scan_kubernetes_manifests
    scan_cloud_configurations
    scan_network_security
    scan_monitoring_security
}

scan_terraform_infrastructure() {
    log_info "Scanning Terraform infrastructure..."

    local tf_dirs=()
    if [[ -d "$PROJECT_ROOT/infra" ]]; then
        tf_dirs+=("$PROJECT_ROOT/infra")
    fi
    if [[ -d "$PROJECT_ROOT/terraform" ]]; then
        tf_dirs+=("$PROJECT_ROOT/terraform")
    fi

    if [[ ${#tf_dirs[@]} -eq 0 ]]; then
        log_info "No Terraform directories found"
        return
    fi

    for tf_dir in "${tf_dirs[@]}"; do
        if [[ -f "$tf_dir/main.tf" ]]; then
            scan_terraform_directory "$tf_dir"
        fi
    done
}

scan_terraform_directory() {
    local tf_dir="$1"

    log_info "Analyzing Terraform configuration in $tf_dir..."

    # Security checks for Terraform files
    local terraform_issues=()

    # Check for hardcoded secrets
    if grep -r "password.*=.*\"" "$tf_dir" 2>/dev/null; then
        terraform_issues+=("Hardcoded passwords found in Terraform")
        log_critical "Hardcoded passwords detected in Terraform configuration"
    fi

    if grep -r "access_key.*=.*\"" "$tf_dir" 2>/dev/null; then
        terraform_issues+=("Hardcoded access keys found in Terraform")
        log_critical "Hardcoded access keys detected in Terraform configuration"
    fi

    # Check for encryption
    if ! grep -r "encryption_at_rest\|kms_key_id\|storage_encryption" "$tf_dir" 2>/dev/null; then
        terraform_issues+=("Storage encryption not configured")
    fi

    # Check security groups
    local open_security_groups=$(grep -r "0.0.0.0/0" "$tf_dir" 2>/dev/null || true)
    if [[ -n "$open_security_groups" ]]; then
        terraform_issues+=("Open security groups found (0.0.0.0/0)")
        log_warning "Open security groups detected"
    fi

    # Check for VPC configuration
    if ! grep -r "vpc_id\|vpc_cidr" "$tf_dir" 2>/dev/null; then
        terraform_issues+=("VPC configuration not found")
    fi

    # Check for SSL/TLS enforcement
    if ! grep -r "ssl_policy\|https_only\|force_ssl" "$tf_dir" 2>/dev/null; then
        terraform_issues+=("SSL/TLS enforcement not configured")
    fi

    # Run tfsec if available
    if command -v tfsec &> /dev/null; then
        log_info "Running tfsec infrastructure security scan..."
        if tfsec "$tf_dir" --format json --output /tmp/tfsec-report.json 2>/dev/null; then
            log_success "tfsec scan completed"

            if command -v jq &> /dev/null && [[ -f /tmp/tfsec-report.json ]]; then
                local tfsec_critical=$(jq '[.results[] | select(.severity == "CRITICAL")] | length' /tmp/tfsec-report.json)
                local tfsec_high=$(jq '[.results[] | select(.severity == "HIGH")] | length' /tmp/tfsec-report.json)
                local tfsec_medium=$(jq '[.results[] | select(.severity == "MEDIUM")] | length' /tmp/tfsec-report.json)
                local tfsec_low=$(jq '[.results[] | select(.severity == "LOW")] | length' /tmp/tfsec-report.json)

                ((INFRA_VULNS += tfsec_critical + tfsec_high + tfsec_medium + tfsec_low))

                log_info "Terraform vulnerabilities: $tfsec_critical critical, $tfsec_high high, $tfsec_medium medium, $tfsec_low low"

                # Generate tfsec findings summary
                if [[ $tfsec_critical -gt 0 || $tfsec_high -gt 0 ]]; then
                    generate_tfsec_summary /tmp/tfsec-report.json
                fi
            fi
        else
            log_warning "tfsec scan failed"
        fi
    else
        log_info "tfsec not found - install for Terraform security scanning"
    fi

    # Report findings
    if [[ ${#terraform_issues[@]} -eq 0 ]]; then
        log_success "Terraform configuration follows security best practices"
    else
        log_warning "Terraform security issues found:"
        for issue in "${terraform_issues[@]}"; do
            log_warning "  • $issue"
        done
    fi
}

scan_kubernetes_manifests() {
    log_info "Scanning Kubernetes manifests..."

    local k8s_files=()
    while IFS= read -r -d '' file; do
        k8s_files+=("$file")
    done < <(find "$PROJECT_ROOT" -name "*.yaml" -o -name "*.yml" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null)

    if [[ ${#k8s_files[@]} -eq 0 ]]; then
        log_info "No Kubernetes manifests found"
        return
    fi

    local k8s_issues=()

    for file in "${k8s_files[@]}"; do
        # Check for security contexts
        if grep -q "kind:.*Deployment\|kind:.*StatefulSet\|kind:.*DaemonSet" "$file"; then
            if ! grep -q "securityContext:" "$file"; then
                k8s_issues+=("Missing securityContext in $(basename "$file")")
            fi
        fi

        # Check for privileged containers
        if grep -q "privileged: true" "$file"; then
            k8s_issues+=("Privileged container found in $(basename "$file")")
            log_critical "Privileged container configuration detected"
        fi

        # Check for hostPath usage
        if grep -q "hostPath:" "$file"; then
            k8s_issues+=("hostPath usage found in $(basename "$file")")
            log_warning "hostPath volume detected - security risk"
        fi

        # Check for host network
        if grep -q "hostNetwork: true" "$file"; then
            k8s_issues+=("Host network enabled in $(basename "$file")")
            log_warning "Host network enabled - security risk"
        fi

        # Check for resource limits
        if grep -q "kind:.*Deployment\|kind:.*StatefulSet" "$file"; then
            if ! grep -q "resources:" "$file"; then
                k8s_issues+=("Missing resource limits in $(basename "$file")")
            fi
        fi

        # Check for read-only root filesystem
        if grep -q "kind:.*Deployment\|kind:.*StatefulSet" "$file"; then
            if ! grep -q "readOnlyRootFilesystem: true" "$file"; then
                k8s_issues+=("Root filesystem not read-only in $(basename "$file")")
            fi
        fi
    done

    # Run polaris if available
    if command -v polaris &> /dev/null; then
        log_info "Running Polis Kubernetes security audit..."
        if polaris audit --config /dev/null --output json > /tmp/polaris-report.json 2>/dev/null; then
            log_success "Polaris audit completed"
        else
            log_warning "Polaris audit failed"
        fi
    fi

    # Report findings
    if [[ ${#k8s_issues[@]} -eq 0 ]]; then
        log_success "Kubernetes manifests follow security best practices"
    else
        log_warning "Kubernetes security issues found:"
        for issue in "${k8s_issues[@]}"; do
            log_warning "  • $issue"
        done
    fi
}

scan_cloud_configurations() {
    log_info "Scanning cloud provider configurations..."

    # AWS configuration checks
    if [[ -f "$PROJECT_ROOT/.aws/config" ]] || [[ -f "$PROJECT_ROOT/terraform.tfvars" ]]; then
        scan_aws_configuration
    fi

    # Azure configuration checks
    if find "$PROJECT_ROOT" -name "*.azurerm" -o -name "*.azure.tf" | head -1 > /dev/null; then
        scan_azure_configuration
    fi

    # GCP configuration checks
    if find "$PROJECT_ROOT" -name "*.google" -o -name "*.gcp.tf" | head -1 > /dev/null; then
        scan_gcp_configuration
    fi
}

scan_aws_configuration() {
    log_info "Analyzing AWS security configuration..."

    local aws_issues=()

    # Check for S3 public access
    if grep -r "block_public_acls.*false\|block_public_policy.*false\|ignore_public_acls.*false\|restrict_public_buckets.*false" "$PROJECT_ROOT" 2>/dev/null; then
        aws_issues+=("S3 public access blocks disabled")
        log_warning "S3 public access may be enabled"
    fi

    # Check for RDS encryption
    if grep -r "aws_db_instance" "$PROJECT_ROOT" 2>/dev/null && ! grep -r "storage_encrypted.*true" "$PROJECT_ROOT" 2>/dev/null; then
        aws_issues+=("RDS encryption not enabled")
    fi

    # Check for CloudTrail logging
    if ! grep -r "aws_cloudtrail" "$PROJECT_ROOT" 2>/dev/null; then
        aws_issues+=("CloudTrail logging not configured")
    fi

    # Check for VPC flow logs
    if grep -r "aws_vpc" "$PROJECT_ROOT" 2>/dev/null && ! grep -r "aws_flow_log" "$PROJECT_ROOT" 2>/dev/null; then
        aws_issues+=("VPC flow logs not configured")
    fi

    # Check for security monitoring
    if ! grep -r "aws_guardduty\|aws_security_hub\|aws_macie" "$PROJECT_ROOT" 2>/dev/null; then
        aws_issues+=("Advanced security services not configured")
    fi

    if [[ ${#aws_issues[@]} -eq 0 ]]; then
        log_success "AWS configuration follows security best practices"
    else
        log_warning "AWS security issues found:"
        for issue in "${aws_issues[@]}"; do
            log_warning "  • $issue"
        done
    fi
}

scan_azure_configuration() {
    log_info "Analyzing Azure security configuration..."

    local azure_issues=()

    # Check for Azure Security Center
    if ! grep -r "azurerm_security_center" "$PROJECT_ROOT" 2>/dev/null; then
        azure_issues+=("Azure Security Center not configured")
    fi

    # Check for Key Vault
    if ! grep -r "azurerm_key_vault" "$PROJECT_ROOT" 2>/dev/null; then
        azure_issues+=("Azure Key Vault not configured")
    fi

    # Check for network security groups
    if grep -r "azurerm_network_security_group" "$PROJECT_ROOT" 2>/dev/null; then
        if grep -r "0.0.0.0/0" "$PROJECT_ROOT" 2>/dev/null; then
            azure_issues+=("Open network security group rules")
        fi
    else
        azure_issues+=("Network security groups not configured")
    fi

    if [[ ${#azure_issues[@]} -eq 0 ]]; then
        log_success "Azure configuration follows security best practices"
    else
        log_warning "Azure security issues found:"
        for issue in "${azure_issues[@]}"; do
            log_warning "  • $issue"
        done
    fi
}

scan_gcp_configuration() {
    log_info "Analyzing GCP security configuration..."

    local gcp_issues=()

    # Check for Security Command Center
    if ! grep -r "google_scc_source" "$PROJECT_ROOT" 2>/dev/null; then
        gcp_issues+=("Security Command Center not configured")
    fi

    # Check for Cloud KMS
    if ! grep -r "google_kms_crypto_key" "$PROJECT_ROOT" 2>/dev/null; then
        gcp_issues+=("Cloud KMS not configured")
    fi

    # Check for firewall rules
    if grep -r "google_compute_firewall" "$PROJECT_ROOT" 2>/dev/null; then
        if grep -r "0.0.0.0/0" "$PROJECT_ROOT" 2>/dev/null; then
            gcp_issues+=("Open firewall rules")
        fi
    else
        gcp_issues+=("Firewall rules not configured")
    fi

    if [[ ${#gcp_issues[@]} -eq 0 ]]; then
        log_success "GCP configuration follows security best practices"
    else
        log_warning "GCP security issues found:"
        for issue in "${gcp_issues[@]}"; do
            log_warning "  • $issue"
        done
    fi
}

scan_network_security() {
    log_info "Scanning network security configuration..."

    local network_issues=()

    # Check for SSL/TLS enforcement
    if ! grep -r "ssl.*required\|https.*only\|tls.*version" "$PROJECT_ROOT" 2>/dev/null; then
        network_issues+=("SSL/TLS enforcement not configured")
    fi

    # Check for WAF configuration
    if ! grep -r "waf\|web_application_firewall" "$PROJECT_ROOT" 2>/dev/null; then
        network_issues+=("Web Application Firewall not configured")
    fi

    # Check for DDoS protection
    if ! grep -r "ddos\|ddos_protection" "$PROJECT_ROOT" 2>/dev/null; then
        network_issues+=("DDoS protection not configured")
    fi

    # Check for CDN security headers
    if ! grep -r "x-frame-options\|x-content-type-options\|strict-transport-security" "$PROJECT_ROOT" 2>/dev/null; then
        network_issues+=("Security headers not configured")
    fi

    if [[ ${#network_issues[@]} -eq 0 ]]; then
        log_success "Network security configuration follows best practices"
    else
        log_warning "Network security issues found:"
        for issue in "${network_issues[@]}"; do
            log_warning "  • $issue"
        done
    fi
}

scan_monitoring_security() {
    log_info "Scanning monitoring and logging security..."

    local monitoring_issues=()

    # Check for security monitoring
    if ! grep -r "security.*monitoring\|audit.*log\|access.*log" "$PROJECT_ROOT" 2>/dev/null; then
        monitoring_issues+=("Security monitoring not configured")
    fi

    # Check for log aggregation
    if ! grep -r "cloudwatch\|logstash\|elasticsearch\|splunk" "$PROJECT_ROOT" 2>/dev/null; then
        monitoring_issues+=("Log aggregation not configured")
    fi

    # Check for alerting
    if ! grep -r "alert\|notification\|sns\|slack" "$PROJECT_ROOT" 2>/dev/null; then
        monitoring_issues+=("Security alerting not configured")
    fi

    # Check for backup configuration
    if ! grep -r "backup\|snapshot\|point_in_time_recovery" "$PROJECT_ROOT" 2>/dev/null; then
        monitoring_issues+=("Backup and recovery not configured")
    fi

    if [[ ${#monitoring_issues[@]} -eq 0 ]]; then
        log_success "Monitoring and logging security is properly configured"
    else
        log_warning "Monitoring security issues found:"
        for issue in "${monitoring_issues[@]}"; do
            log_warning "  • $issue"
        done
    fi
}

# Helper Functions
generate_vulnerability_details() {
    local scan_file="$1"

    log_info "Generating detailed vulnerability report..."

    if command -v jq &> /dev/null && [[ -f "$scan_file" ]]; then
        # Extract critical and high vulnerabilities
        jq -r '.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL" or .Severity == "HIGH") |
               "\(.Severity): \(.Title) in \(.PkgName) version \(.InstalledVersion)"' "$scan_file" 2>/dev/null | head -10 | while read vuln; do
            log_critical "$vuln"
        done
    fi
}

generate_tfsec_summary() {
    local tfsec_file="$1"

    if command -v jq &> /dev/null && [[ -f "$tfsec_file" ]]; then
        jq -r '.results[] | select(.severity == "CRITICAL" or .severity == "HIGH") |
               "\(.severity): \(.description) (\(.rule_id))"' "$tfsec_file" 2>/dev/null | head -10 | while read finding; do
            log_critical "$finding"
        done
    fi
}

# Security Hardening Functions
apply_security_hardening() {
    log "🔧 Applying Security Hardening Recommendations..."

    # Create security hardening script
    local hardening_script="$PROJECT_ROOT/scripts/auto-security-hardening.sh"
    cat > "$hardening_script" << 'EOF'
#!/bin/bash

# Auto Security Hardening Script
# Generated automatically by container-infrastructure-security.sh

set -euo pipefail

echo "🔧 Applying Security Hardening..."

# Update system packages
if command -v apt-get &> /dev/null; then
    echo "Updating system packages..."
    apt-get update && apt-get upgrade -y
fi

# Install security tools
install_security_tools() {
    local tools=("fail2ban" "ufw" "clamav" "rkhunter" "chkrootkit")

    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo "Installing $tool..."
            apt-get install -y "$tool"
        fi
    done
}

# Configure firewall
configure_firewall() {
    if command -v ufw &> /dev/null; then
        echo "Configuring firewall..."
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
    fi
}

# Configure fail2ban
configure_fail2ban() {
    if command -v fail2ban-client &> /dev/null; then
        echo "Configuring fail2ban..."
        systemctl enable fail2ban
        systemctl start fail2ban
    fi
}

# Secure SSH configuration
secure_ssh() {
    if [[ -f /etc/ssh/sshd_config ]]; then
        echo "Securing SSH configuration..."
        # Backup original config
        cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

        # Apply secure settings
        sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
        sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        sed -i 's/#PermitEmptyPasswords yes/PermitEmptyPasswords no/' /etc/ssh/sshd_config

        systemctl restart sshd || true
    fi
}

# Main execution
main() {
    install_security_tools
    configure_firewall
    configure_fail2ban
    secure_ssh

    echo "✅ Security hardening completed"
}

main "$@"
EOF

    chmod +x "$hardening_script"
    log_success "Security hardening script created: $hardening_script"
}

generate_security_recommendations() {
    log "📋 Generating Security Recommendations..."

    local recommendations_file="$SECURITY_REPORT_DIR/security-recommendations-$(date +%Y%m%d-%H%M%S).md"

    cat > "$recommendations_file" << EOF
# Security Recommendations Report

Generated on: $(date)
Project: $PROJECT_ROOT

## Executive Summary

- **Total Issues Found**: $((CONTAINER_VULNS + INFRA_VULNS))
- **Container Vulnerabilities**: $CONTAINER_VULNS
- **Infrastructure Vulnerabilities**: $INFRA_VULNS
- **Security Score**: $((PASSED_CHECKS * 100 / TOTAL_CHECKS))%

## Priority Actions

### Critical (Immediate Action Required)

EOF

    if [[ $CRITICAL_VULNS -gt 0 ]]; then
        cat >> "$recommendations_file" << EOF
- **$CRITICAL_VULNS Critical Vulnerabilities Found**
  - Address all critical vulnerabilities immediately
  - These represent immediate security threats
  - Review and update affected components

EOF
    fi

    cat >> "$recommendations_file" << EOF
### High Priority (Within 7 Days)

EOF

    if [[ $HIGH_VULNS -gt 0 ]]; then
        cat >> "$recommendations_file" << EOF
- **$HIGH_VULNS High Vulnerabilities Found**
  - Address high-priority vulnerabilities within 7 days
  - Implement compensating controls if immediate fixes aren't possible

EOF
    fi

    cat >> "$recommendations_file" << EOF
## Container Security Recommendations

1. **Use Specific Image Tags**
   - Avoid using \`latest\` tags in production
   - Pin to specific version numbers for reproducible builds

2. **Multi-stage Builds**
   - Use multi-stage Dockerfiles to reduce attack surface
   - Exclude build tools and dependencies from final image

3. **Run as Non-root User**
   - Configure containers to run as non-privileged users
   - Implement proper file permissions

4. **Image Scanning Integration**
   - Integrate container scanning into CI/CD pipeline
   - Fail builds when vulnerabilities exceed thresholds

5. **Regular Base Image Updates**
   - Update base images regularly
   - Subscribe to security notifications for base images

## Infrastructure Security Recommendations

1. **Infrastructure as Code Security**
   - Integrate security scanning into Terraform planning
   - Use tfsec or similar tools in CI/CD pipeline

2. **Network Security**
   - Implement proper network segmentation
   - Use private subnets for sensitive workloads
   - Configure security groups and NACLs properly

3. **Encryption**
   - Enable encryption at rest for all storage
   - Use TLS 1.2+ for all communications
   - Implement key rotation policies

4. **Identity and Access Management**
   - Follow principle of least privilege
   - Use role-based access control (RBAC)
   - Implement multi-factor authentication

5. **Monitoring and Logging**
   - Enable comprehensive logging
   - Implement security monitoring and alerting
   - Regular security audits and assessments

## Compliance Requirements

1. **GDPR Compliance**
   - Ensure data protection by design and by default
   - Implement proper consent management
   - Enable data subject rights

2. **Payment Security (PCI DSS)**
   - If handling payments, ensure PCI DSS compliance
   - Use tokenization for payment data
   - Regular security assessments

## Automated Security Tools

Install and configure the following tools for enhanced security:

1. **Container Security**
   - \`trivy\`: Container vulnerability scanner
   - \`docker scout\**: Docker's security scanning tool
   - \`clair\**: Open-source vulnerability scanner

2. **Infrastructure Security**
   - \`tfsec\`: Terraform security scanner
   - \`checkov\**: Infrastructure security scanner
   - \`polaris\**: Kubernetes security validation

3. **Web Application Security**
   - \`zap-baseline.py\**: OWASP ZAP baseline scanner
   - \`nuclei\**: Vulnerability scanner
   - \`nikto\**: Web server scanner

## Implementation Timeline

- **Week 1**: Address critical vulnerabilities, install scanning tools
- **Week 2**: Implement container security best practices
- **Week 3**: Configure infrastructure security monitoring
- **Week 4**: Integrate security into CI/CD pipeline

## Contact Information

For security concerns or questions:
- Security Team: security@mariaborysevych.com
- Incident Response: incident@mariaborysevych.com

---

*This report was generated automatically. Review and update based on your specific security requirements.*
EOF

    log_success "Security recommendations generated: $recommendations_file"
}

main() {
    log "🔒 Starting Container & Infrastructure Security Scan..."
    log "Project: $PROJECT_ROOT"
    log "Report Directory: $SECURITY_REPORT_DIR"
    echo ""

    # Run all security scans
    run_container_image_analysis
    echo ""

    run_infrastructure_security_scan
    echo ""

    # Generate recommendations and hardening
    generate_security_recommendations
    apply_security_hardening
    echo ""

    # Generate final summary
    log "🏁 Security Scan Summary"
    log "========================"
    log "Total Checks: $TOTAL_CHECKS"
    log "Passed: $PASSED_CHECKS"
    log "Failed: $FAILED_CHECKS"
    log "Warnings: $WARNINGS"
    log "Container Vulnerabilities: $CONTAINER_VULNS"
    log "Infrastructure Vulnerabilities: $INFRA_VULNS"
    echo ""

    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    log "Security Score: $success_rate%"
    echo ""

    # Check for critical issues
    if [[ $CRITICAL_VULNS -gt 0 ]]; then
        log_critical "CRITICAL VULNERABILITIES FOUND - IMMEDIATE ACTION REQUIRED"
        exit 1
    elif [[ $success_rate -lt 70 ]]; then
        log_error "SECURITY SCORE BELOW ACCEPTABLE THRESHOLD"
        exit 1
    else
        log_success "Container & Infrastructure security scan completed!"
        if [[ $WARNINGS -gt 0 ]]; then
            log_warning "Review warnings and implement recommendations"
        fi
    fi

    log "📊 Detailed reports available in $SECURITY_REPORT_DIR"
    log "🔧 Security hardening script: $PROJECT_ROOT/scripts/auto-security-hardening.sh"
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

# Run security scan
main "$@"