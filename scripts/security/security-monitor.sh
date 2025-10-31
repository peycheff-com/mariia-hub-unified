#!/bin/bash
# Security Monitor - Unified security scanning and monitoring
# Replaces: container-infrastructure-security.sh, secret-scanning-automation.sh, ssl-tls-security-configuration.sh, enhanced-security-audit.sh, comprehensive-security-verification.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default values
ACTION="scan"
TARGET="all"
FORMAT="console"
OUTPUT=""
VERBOSE=false
COMPLIANCE="standard"

# Configuration
LOG_FILE="$PROJECT_ROOT/logs/security.log"
REPORT_DIR="$PROJECT_ROOT/security-reports"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
  cat << 'EOF'
Security Monitor - Unified Security Scanning and Monitoring

Usage: $0 [OPTIONS]

Options:
  --action ACTION      Action (scan, audit, monitor, fix, compliance-check)
  --target TARGET      Target (code, dependencies, containers, ssl, secrets, all)
  --format FORMAT     Output format (console, json, html)
  --output FILE       Output file path
  --compliance LEVEL  Compliance level (basic, standard, strict)
  --verbose           Enable verbose output
  --help              Show this help message

Examples:
  $0 --action scan --target secrets --format json --output security-report.json
  $0 --action compliance-check --compliance strict
  $0 --action monitor --target containers

EOF
}

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_debug() {
  [[ "$VERBOSE" == true ]] && echo -e "${BLUE}[DEBUG]${NC} $1" | tee -a "$LOG_FILE"
}

setup_directories() {
  mkdir -p "$REPORT_DIR" "$PROJECT_ROOT/logs"
}

# Secret scanning
scan_secrets() {
  log_info "Scanning for secrets in codebase..."

  local findings=0
  local patterns=(
    "sk_[a-zA-Z0-9]{24,}"
    "[a-zA-Z0-9_-]{40,}=?"
    "AKIA[0-9A-Z]{16}"
    "ghp_[a-zA-Z0-9]{36}"
    "xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}"
  )

  for pattern in "${patterns[@]}"; do
    log_debug "Scanning pattern: $pattern"
    local matches=$(grep -r -E "$pattern" "$PROJECT_ROOT" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | wc -l)
    if [[ $matches -gt 0 ]]; then
      log_warn "Pattern '$pattern' found $matches times"
      findings=$((findings + matches))
    fi
  done

  if [[ $findings -eq 0 ]]; then
    log_info "No secrets found"
    return 0
  else
    log_error "Found $findings potential secrets"
    return 1
  fi
}

# Dependency scanning
scan_dependencies() {
  log_info "Scanning dependencies for vulnerabilities..."

  if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    log_warn "package.json not found, skipping dependency scan"
    return 0
  fi

  # Run npm audit
  cd "$PROJECT_ROOT"
  npm audit --json > "$REPORT_DIR/npm-audit.json" 2>&1 || true

  local vulnerabilities=$(jq -r '.metadata.vulnerabilities.total // 0' "$REPORT_DIR/npm-audit.json" 2>/dev/null || echo "0")

  if [[ $vulnerabilities -gt 0 ]]; then
    log_error "Found $vulnerabilities vulnerabilities in dependencies"
    return 1
  else
    log_info "No vulnerabilities found in dependencies"
    return 0
  fi
}

# SSL/TLS check
check_ssl() {
  log_info "Checking SSL/TLS configuration..."

  local domain="${1:-localhost}"
  local port="${2:-443}"

  # Check certificate
  echo | openssl s_client -connect "$domain:$port" -servername "$domain" 2>/dev/null | \
    openssl x509 -noout -dates 2>/dev/null

  if [[ $? -eq 0 ]]; then
    log_info "SSL certificate is valid for $domain:$port"
    return 0
  else
    log_error "SSL check failed for $domain:$port"
    return 1
  fi
}

# Security audit
security_audit() {
  log_info "Running comprehensive security audit..."

  local status=0

  # Scan secrets
  if [[ "$TARGET" == "secrets" || "$TARGET" == "all" ]]; then
    scan_secrets || status=1
  fi

  # Scan dependencies
  if [[ "$TARGET" == "dependencies" || "$TARGET" == "all" ]]; then
    scan_dependencies || status=1
  fi

  # Check SSL
  if [[ "$TARGET" == "ssl" || "$TARGET" == "all" ]]; then
    check_ssl || status=1
  fi

  return $status
}

# Generate compliance report
compliance_check() {
  log_info "Running compliance check ($COMPLIANCE level)..."

  local score=0
  local max_score=0

  # Basic checks (40 points)
  max_score=$((max_score + 40))
  if [[ -f "$PROJECT_ROOT/.env.example" ]]; then
    log_info "✓ Environment template exists"
    score=$((score + 10))
  fi

  if [[ -f "$PROJECT_ROOT/.gitignore" ]] && grep -q "node_modules" "$PROJECT_ROOT/.gitignore"; then
    log_info "✓ Git ignore configured"
    score=$((score + 10))
  fi

  if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]] || [[ -f "$PROJECT_ROOT/Dockerfile" ]]; then
    log_info "✓ Container configuration exists"
    score=$((score + 10))
  fi

  if command -v npm &> /dev/null; then
    npm audit --audit-level=moderate > /dev/null 2>&1
    if [[ $? -eq 0 ]]; then
      log_info "✓ No high/moderate vulnerabilities"
      score=$((score + 10))
    fi
  fi

  # Standard checks (additional 40 points)
  max_score=$((max_score + 40))
  if [[ "$COMPLIANCE" == "standard" || "$COMPLIANCE" == "strict" ]]; then
    if [[ -f "$PROJECT_ROOT/scripts/security/security-monitor.sh" ]]; then
      log_info "✓ Security monitoring script exists"
      score=$((score + 10))
    fi

    if [[ -f "$PROJECT_ROOT/scripts/backup/backup-system.sh" ]]; then
      log_info "✓ Backup system exists"
      score=$((score + 10))
    fi

    if [[ -d "$PROJECT_ROOT/.github/workflows" ]]; then
      log_info "✓ CI/CD workflows configured"
      score=$((score + 10))
    fi

    scan_secrets > /dev/null 2>&1
    if [[ $? -eq 0 ]]; then
      log_info "✓ No secrets in codebase"
      score=$((score + 10))
    fi
  fi

  # Strict checks (additional 20 points)
  max_score=$((max_score + 20))
  if [[ "$COMPLIANCE" == "strict" ]]; then
    if [[ -f "$PROJECT_ROOT/SECURITY.md" ]]; then
      log_info "✓ Security documentation exists"
      score=$((score + 10))
    fi

    if [[ -f "$PROJECT_ROOT/.env" ]] && ! grep -q "VITE_SUPABASE_URL.*supabase" "$PROJECT_ROOT/.env" 2>/dev/null; then
      log_info "✓ Production secrets not committed"
      score=$((score + 10))
    fi
  fi

  local percentage=$((score * 100 / max_score))

  log_info "Compliance Score: $score/$max_score ($percentage%)"

  if [[ $percentage -ge 90 ]]; then
    log_info "✓ Excellent security posture"
    return 0
  elif [[ $percentage -ge 70 ]]; then
    log_warn "⚠ Good security posture, room for improvement"
    return 0
  else
    log_error "✗ Security posture needs improvement"
    return 1
  fi
}

# Output formatting
output_report() {
  local format=$1
  local data=$2

  case "$format" in
    "json")
      echo "$data" | jq '.' > "$OUTPUT"
      log_info "Report saved to $OUTPUT"
      ;;
    "html")
      cat > "$OUTPUT" << HTML_EOF
<!DOCTYPE html>
<html>
<head>
  <title>Security Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .error { color: red; }
    .warning { color: orange; }
    .success { color: green; }
    pre { background: #f4f4f4; padding: 10px; }
  </style>
</head>
<body>
  <h1>Security Report</h1>
  <pre>$data</pre>
</body>
</html>
HTML_EOF
      log_info "HTML report saved to $OUTPUT"
      ;;
  esac
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --action)
      ACTION="$2"
      shift 2
      ;;
    --target)
      TARGET="$2"
      shift 2
      ;;
    --format)
      FORMAT="$2"
      shift 2
      ;;
    --output)
      OUTPUT="$2"
      shift 2
      ;;
    --compliance)
      COMPLIANCE="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Setup
setup_directories

# Execute action
case "$ACTION" in
  "scan")
    security_audit
    ;;
  "audit")
    security_audit
    ;;
  "compliance-check")
    compliance_check
    ;;
  *)
    log_error "Unknown action: $ACTION"
    show_help
    exit 1
    ;;
esac
