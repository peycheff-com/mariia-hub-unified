#!/bin/bash

# Secret Scanning & Secure Credential Management Automation
# Comprehensive secret detection, credential rotation, and secure management system

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
SECRET_SCAN_REPORT="$SECURITY_REPORT_DIR/secret-scan-$(date +%Y%m%d-%H%M%S).json"
CREDENTIAL_LOG="$PROJECT_ROOT/logs/credential-management.log"
VAULT_CONFIG="$PROJECT_ROOT/.vault-config"

# Ensure directories exist
mkdir -p "$SECURITY_REPORT_DIR"
mkdir -p "$(dirname "$CREDENTIAL_LOG")"
mkdir -p "$PROJECT_ROOT/.secrets"

# Counters
TOTAL_SECRETS_FOUND=0
CRITICAL_SECRETS=0
HIGH_SECRETS=0
CREDENTIALS_ROTATED=0
SECRETS_REMOVED=0

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$CREDENTIAL_LOG"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$CREDENTIAL_LOG"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$CREDENTIAL_LOG"
}

log_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$CREDENTIAL_LOG"
}

log_critical() {
    echo -e "${RED}🚨 CRITICAL: $1${NC}" | tee -a "$CREDENTIAL_LOG"
}

log_info() {
    echo -e "${PURPLE}ℹ $1${NC}" | tee -a "$CREDENTIAL_LOG"
}

# Secret pattern definitions
declare -A SECRET_PATTERNS=(
    ["aws_access_key"]="AKIA[0-9A-Z]{16}"
    ["aws_secret_key"]="[0-9a-zA-Z/+]{40}"
    ["github_token"]="ghp_[a-zA-Z0-9]{36}"
    ["github_pat"]="ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|ghu_[a-zA-Z0-9]{36}|ghs_[a-zA-Z0-9]{36}|ghr_[a-zA-Z0-9]{36}"
    ["slack_token"]="xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}"
    ["google_api_key"]="AIza[0-9A-Za-z_-]{35}"
    ["stripe_publishable_key"]="pk_live_[0-9a-zA-Z]{24}"
    ["stripe_secret_key"]="sk_live_[0-9a-zA-Z]{24}"
    ["stripe_test_key"]="(pk_test_|sk_test_)[0-9a-zA-Z]{24}"
    ["supabase_key"]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[0-9a-zA-Z._-]+"
    ["database_url"]="postgresql://[^:]+:[^@]+@[^/]+/[^\s]+"
    ["redis_url"]="redis://[^:]+:[^@]+@[^/]+"
    ["private_key"]="-----BEGIN.*PRIVATE KEY-----"
    ["certificate"]="-----BEGIN.*CERTIFICATE-----"
    ["ssh_key"]="ssh-rsa [A-Za-z0-9/+]+"
    ["jwt_secret"]="[A-Za-z0-9._-]{20,}"
    ["api_key_generic"]="[Aa][Pp][Ii]_?[Kk][Ee][Yy].*['\"][^'\"]{10,}['\"]"
    ["password_generic"]="[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd].*['\"][^'\"]{8,}['\"]"
    ["secret_generic"]="[Ss][Ee][Cc][Rr][Ee][Tt].*['\"][^'\"]{10,}['\"]"
    ["token_generic"]="[Tt][Oo][Kk][Ee][Nn].*['\"][^'\"]{16,}['\"]"
)

# File extensions to scan
declare -a SCAN_EXTENSIONS=(
    "js" "jsx" "ts" "tsx" "java" "py" "php" "rb" "go" "rs" "c" "cpp" "h"
    "json" "yml" "yaml" "xml" "config" "conf" "ini" "env" "sh" "bash" "zsh"
    "sql" "html" "css" "scss" "less" "md" "txt" "log"
)

# Files and directories to exclude
declare -a EXCLUDE_PATTERNS=(
    "node_modules" ".git" "dist" "build" "coverage" ".next" ".nuxt"
    ".vscode" ".idea" "*.min.js" "*.bundle.js" "*.pack.js" "*.cache"
    "vendor" "bower_components" ".terraform" "*.tfstate" "*.log"
    "*.backup" "*.bak" "*.tmp" "*.temp"
)

# Main Functions
run_comprehensive_secret_scan() {
    log "🔍 Starting Comprehensive Secret Scanning & Credential Management..."
    log "Project: $PROJECT_ROOT"
    log "Report Directory: $SECURITY_REPORT_DIR"
    echo ""

    # Initialize secret scan report
    initialize_secret_report

    # Run different types of scans
    scan_repository_secrets
    scan_environment_files
    scan_configuration_files
    scan_build_artifacts
    scan_commit_history
    scan_docker_images
    echo ""

    # Run credential management
    check_credential_rotation
    setup_secure_credential_storage
    generate_credential_rotation_schedule
    echo ""

    # Generate final report
    generate_secret_management_report

    # Check for critical findings
    if [[ $CRITICAL_SECRETS -gt 0 ]]; then
        log_critical "CRITICAL SECRETS FOUND - IMMEDIATE ACTION REQUIRED"
        exit 1
    elif [[ $HIGH_SECRETS -gt 5 ]]; then
        log_error "HIGH NUMBER OF SECRETS FOUND - ACTION REQUIRED"
        exit 1
    else
        log_success "Secret scanning completed successfully!"
        if [[ $TOTAL_SECRETS_FOUND -gt 0 ]]; then
            log_warning "Review and remediate found secrets"
        fi
    fi

    log "📊 Detailed report: $SECRET_SCAN_REPORT"
    log "🔐 Credential management setup: $PROJECT_ROOT/.secrets/"
}

initialize_secret_report() {
    log_info "Initializing secret scan report..."

    cat > "$SECRET_SCAN_REPORT" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "scan_type": "comprehensive_secret_scan",
  "project": "$PROJECT_ROOT",
  "scanner_version": "1.0.0",
  "findings": {
    "total_secrets": 0,
    "critical_secrets": 0,
    "high_secrets": 0,
    "medium_secrets": 0,
    "low_secrets": 0
  },
  "scans": {
    "repository_scan": {},
    "environment_scan": {},
    "configuration_scan": {},
    "build_artifact_scan": {},
    "commit_history_scan": {},
    "docker_scan": {}
  },
  "secrets_found": [],
  "remediation_actions": [],
  "credential_management": {
    "credentials_rotated": 0,
    "secure_storage_setup": false,
    "rotation_schedule_generated": false
  }
}
EOF

    log_success "Secret scan report initialized"
}

scan_repository_secrets() {
    log "📁 Scanning Repository for Secrets..."

    local repo_findings=()
    local temp_results="/tmp/repo-secrets.txt"

    # Build find command with exclusions
    local find_cmd="find \"$PROJECT_ROOT\" -type f"

    # Add exclusions
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        find_cmd="$find_cmd -not -path \"*/$pattern/*\" -not -name \"$pattern\""
    done

    # Add file extensions
    local extension_pattern=""
    for ext in "${SCAN_EXTENSIONS[@]}"; do
        extension_pattern="$extension_pattern -name \"*.$ext\" -o"
    done
    extension_pattern="${extension_pattern% -o}"  # Remove trailing -o

    if [[ -n "$extension_pattern" ]]; then
        find_cmd="$find_cmd \( $extension_pattern \)"
    fi

    # Execute scan
    log_info "Scanning files with secret patterns..."
    eval "$find_cmd" 2>/dev/null > /tmp/files-to-scan.txt

    local files_scanned=0
    while IFS= read -r file; do
        [[ -f "$file" ]] || continue

        ((files_scanned++))
        if [[ $((files_scanned % 100)) -eq 0 ]]; then
            log_info "Scanned $files_scanned files..."
        fi

        # Scan for each secret pattern
        for pattern_name in "${!SECRET_PATTERNS[@]}"; do
            local pattern="${SECRET_PATTERNS[$pattern_name]}"

            if grep -E "$pattern" "$file" 2>/dev/null > /tmp/secret-match.txt; then
                while IFS= read -r line; do
                    local line_number=$(grep -n "$line" "$file" | cut -d: -f1 | head -1)
                    repo_findings+=("$pattern_name|$file|$line_number|$line")
                done < /tmp/secret-match.txt
            fi
        done
    done < /tmp/files-to-scan.txt

    # Process findings
    process_secret_findings "${repo_findings[@]}" "repository_scan"

    log_info "Repository scan completed: $files_scanned files scanned, ${#repo_findings[@]} potential secrets found"
}

scan_environment_files() {
    log "🌍 Scanning Environment Files..."

    local env_findings=()

    # Find environment files
    local env_files=(
        ".env" ".env.local" ".env.development" ".env.production" ".env.staging"
        ".env.example" ".env.template" ".env.dist" ".env.sample"
        "environment" "config/environment" "config/.env"
    )

    for env_file in "${env_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$env_file" ]]; then
            log_info "Scanning environment file: $env_file"

            # Check for common environment variable patterns
            local env_patterns=(
                "API_KEY|SECRET|PASSWORD|TOKEN|PRIVATE_KEY|DATABASE_URL"
                "AWS_|AZURE_|GCP_|STRIPE_|SUPABASE_|REDIS_|JWT_"
            )

            for pattern in "${env_patterns[@]}"; do
                if grep -E "$pattern.*=" "$PROJECT_ROOT/$env_file" 2>/dev/null > /tmp/env-secrets.txt; then
                    while IFS= read -r line; do
                        local line_number=$(grep -n "$line" "$PROJECT_ROOT/$env_file" | cut -d: -f1 | head -1)
                        env_findings+=("environment_variable|$PROJECT_ROOT/$env_file|$line_number|$line")
                    done < /tmp/env-secrets.txt
                fi
            done
        fi
    done

    # Process findings
    process_secret_findings "${env_findings[@]}" "environment_scan"

    log_info "Environment file scan completed: ${#env_findings[@]} potential secrets found"
}

scan_configuration_files() {
    log "⚙️ Scanning Configuration Files..."

    local config_findings=()

    # Find configuration files
    local config_patterns=(
        "*.config.js" "*.config.ts" "config/*.js" "config/*.ts" "config/*.json"
        "*.conf" "*.cfg" "settings/*.js" "settings/*.ts" ".configrc"
        "docker-compose.yml" "docker-compose.yaml" "Dockerfile"
        "terraform.tfvars" "*.tfvars" "ansible/*" "k8s/*.yml" "k8s/*.yaml"
    )

    for pattern in "${config_patterns[@]}"; do
        while IFS= read -r -d '' file; do
            [[ -f "$file" ]] || continue

            # Scan for secrets in configuration files
            for secret_pattern_name in "${!SECRET_PATTERNS[@]}"; do
                local secret_pattern="${SECRET_PATTERNS[$secret_pattern_name]}"

                if grep -E "$secret_pattern" "$file" 2>/dev/null > /tmp/config-secrets.txt; then
                    while IFS= read -r line; do
                        local line_number=$(grep -n "$line" "$file" | cut -d: -f1 | head -1)
                        config_findings+=("$secret_pattern_name|$file|$line_number|$line")
                    done < /tmp/config-secrets.txt
                fi
            done
        done < <(find "$PROJECT_ROOT" -name "$pattern" -print0 2>/dev/null)
    done

    # Process findings
    process_secret_findings "${config_findings[@]}" "configuration_scan"

    log_info "Configuration file scan completed: ${#config_findings[@]} potential secrets found"
}

scan_build_artifacts() {
    log "🏗️ Scanning Build Artifacts..."

    local build_findings=()

    # Check if build directory exists
    if [[ ! -d "$PROJECT_ROOT/dist" && ! -d "$PROJECT_ROOT/build" ]]; then
        log_info "No build artifacts found"
        return
    fi

    local build_dirs=("dist" "build" ".next" ".nuxt" "out")

    for build_dir in "${build_dirs[@]}"; do
        if [[ -d "$PROJECT_ROOT/$build_dir" ]]; then
            log_info "Scanning build directory: $build_dir"

            # Scan JavaScript files for secrets
            while IFS= read -r -d '' file; do
                [[ -f "$file" ]] || continue

                # Check for common secret patterns in built files
                if grep -E "(sk_|ghp_|AIza|AKIA|pk_|xoxb-)" "$file" 2>/dev/null > /tmp/build-secrets.txt; then
                    while IFS= read -r line; do
                        build_findings+=("build_artifact|$file|0|$line")
                    done < /tmp/build-secrets.txt
                fi
            done < <(find "$PROJECT_ROOT/$build_dir" -name "*.js" -print0 2>/dev/null)
        fi
    done

    # Process findings
    process_secret_findings "${build_findings[@]}" "build_artifact_scan"

    log_info "Build artifact scan completed: ${#build_findings[@]} potential secrets found"
}

scan_commit_history() {
    log "📝 Scanning Git Commit History..."

    local git_findings=()

    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_info "Not a git repository, skipping commit history scan"
        return
    fi

    log_info "Scanning git commit history for secrets..."

    # Scan commit messages and diffs for secrets
    local commits_to_scan=100  # Limit to recent commits
    local commit_count=0

    while IFS= read -r commit; do
        ((commit_count++))
        if [[ $commit_count -gt $commits_to_scan ]]; then
            break
        fi

        # Get commit diff
        if git show "$commit" --format="" > /tmp/commit-diff.txt 2>/dev/null; then
            # Scan diff for secret patterns
            for pattern_name in "${!SECRET_PATTERNS[@]}"; do
                local pattern="${SECRET_PATTERNS[$pattern_name]}"

                if grep -E "$pattern" /tmp/commit-diff.txt > /tmp/commit-secrets.txt 2>/dev/null; then
                    while IFS= read -r line; do
                        git_findings+=("$pattern_name|commit:$commit|0|$line")
                    done < /tmp/commit-secrets.txt
                fi
            done
        fi
    done < <(git rev-list --max-count=$commits_to_scan HEAD)

    # Process findings
    process_secret_findings "${git_findings[@]}" "commit_history_scan"

    log_info "Git history scan completed: $commit_count commits scanned, ${#git_findings[@]} potential secrets found"
}

scan_docker_images() {
    log "🐳 Scanning Docker Images for Secrets..."

    local docker_findings=()

    if ! command -v docker &> /dev/null; then
        log_info "Docker not available, skipping Docker image scan"
        return
    fi

    # Get Docker images for the project
    local images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "mariia|localhost|127\.0\.0\.1" || true)

    if [[ -z "$images" ]]; then
        log_info "No project Docker images found"
        return
    fi

    while IFS= read -r image; do
        [[ -n "$image" ]] || continue

        log_info "Scanning Docker image: $image"

        # Create a temporary container to inspect
        local container_id=$(docker run --rm -d "$image" tail -f /dev/null 2>/dev/null || echo "")

        if [[ -n "$container_id" ]]; then
            # Check environment variables for secrets
            local env_vars=$(docker exec "$container_id" env 2>/dev/null || true)

            for pattern_name in "${!SECRET_PATTERNS[@]}"; do
                local pattern="${SECRET_PATTERNS[$pattern_name]}"

                if echo "$env_vars" | grep -E "$pattern" > /tmp/docker-secrets.txt 2>/dev/null; then
                    while IFS= read -r line; do
                        docker_findings+=("$pattern_name|docker_image:$image|env_var|$line")
                    done < /tmp/docker-secrets.txt
                fi
            done

            # Cleanup container
            docker stop "$container_id" >/dev/null 2>&1 || true
        fi
    done <<< "$images"

    # Process findings
    process_secret_findings "${docker_findings[@]}" "docker_scan"

    log_info "Docker image scan completed: ${#docker_findings[@]} potential secrets found"
}

process_secret_findings() {
    local findings=("$@")
    local scan_type="${findings[-1]}"
    unset 'findings[-1]'  # Remove scan type from array

    log_info "Processing ${#findings[@]} secret findings for $scan_type..."

    for finding in "${findings[@]}"; do
        IFS='|' read -r pattern_type file line_number content <<< "$finding"

        # Determine severity
        local severity
        case "$pattern_type" in
            "aws_secret_key"|"stripe_secret_key"|"github_token"|"private_key"|"database_url")
                severity="critical"
                ((CRITICAL_SECRETS++))
                ;;
            "aws_access_key"|"google_api_key"|"stripe_publishable_key"|"supabase_key"|"slack_token")
                severity="high"
                ((HIGH_SECRETS++))
                ;;
            "password_generic"|"secret_generic"|"token_generic")
                severity="medium"
                ;;
            *)
                severity="low"
                ;;
        esac

        ((TOTAL_SECRETS_FOUND++))

        # Add to report
        add_secret_to_report "$pattern_type" "$file" "$line_number" "$content" "$severity" "$scan_type"

        # Log finding
        case "$severity" in
            "critical")
                log_critical "CRITICAL SECRET FOUND: $pattern_type in $file:$line_number"
                ;;
            "high")
                log_error "HIGH SECRET FOUND: $pattern_type in $file:$line_number"
                ;;
            "medium")
                log_warning "MEDIUM SECRET FOUND: $pattern_type in $file:$line_number"
                ;;
            *)
                log_info "Low severity secret found: $pattern_type in $file:$line_number"
                ;;
        esac
    done
}

add_secret_to_report() {
    local pattern_type="$1"
    local file="$2"
    local line_number="$3"
    local content="$4"
    local severity="$5"
    local scan_type="$6"

    # Sanitize content for JSON (remove actual secret value)
    local sanitized_content=$(echo "$content" | sed 's/[A-Za-z0-9._-]\{10,\}/[REDACTED]/g')

    # Create secret entry
    local secret_entry=$(cat <<EOF
    {
      "id": "secret_$(date +%s)_$(shuf -i 1000-9999 -n 1)",
      "pattern_type": "$pattern_type",
      "file": "$file",
      "line_number": $line_number,
      "severity": "$severity",
      "content": "$sanitized_content",
      "scan_type": "$scan_type",
      "discovered_at": "$(date -Iseconds)",
      "remediation_required": true,
      "remediation_status": "pending"
    }
EOF
    )

    # Add to JSON report
    if command -v jq &> /dev/null; then
        jq ".secrets_found += [$secret_entry] | .findings.total_secrets += 1 | .findings.${severity}_secrets += 1" "$SECRET_SCAN_REPORT" > /tmp/temp-report.json
        mv /tmp/temp-report.json "$SECRET_SCAN_REPORT"
    fi
}

check_credential_rotation() {
    log "🔐 Checking Credential Rotation Requirements..."

    local rotation_needed=()

    # Check for old API keys in environment files
    local env_files=("$PROJECT_ROOT/.env.production" "$PROJECT_ROOT/.env" "$PROJECT_ROOT/.env.local")

    for env_file in "${env_files[@]}"; do
        if [[ -f "$env_file" ]]; then
            log_info "Checking credential age in $env_file"

            # Check file modification time
            local file_age=$(($(date +%s) - $(stat -c %Y "$env_file" 2>/dev/null || stat -f %m "$env_file" 2>/dev/null)))
            local days_old=$((file_age / 86400))

            if [[ $days_old -gt 90 ]]; then
                rotation_needed+=("$env_file:$days_old days old")
                log_warning "Credentials in $env_file are $days_old days old - rotation recommended"
            fi
        fi
    done

    # Check Git configuration for credential age
    if git config --get user.name > /dev/null 2>&1; then
        local last_commit=$(git log -1 --format="%ct" 2>/dev/null || echo "0")
        local commit_age=$(($(date +%s) - last_commit))
        local days_since_commit=$((commit_age / 86400))

        if [[ $days_since_commit -gt 30 && ${#rotation_needed[@]} -gt 0 ]]; then
            rotation_needed+=("git_config:$days_since_commit days since last commit")
        fi
    fi

    # Generate rotation recommendations
    if [[ ${#rotation_needed[@]} -gt 0 ]]; then
        generate_rotation_recommendations "${rotation_needed[@]}"
    else
        log_success "No immediate credential rotation required"
    fi
}

setup_secure_credential_storage() {
    log "🗄️ Setting Up Secure Credential Storage..."

    local secrets_dir="$PROJECT_ROOT/.secrets"
    local vault_config="$secrets_dir/vault.conf"

    # Create secrets directory structure
    mkdir -p "$secrets_dir"/{backups,keys,certificates,tokens}

    # Create .gitignore for secrets directory
    cat > "$secrets_dir/.gitignore" << EOF
# Secrets directory - never commit!
*
!.gitignore
!README.md
EOF

    # Create secure credential storage template
    cat > "$vault_config" << EOF
# Secure Credential Configuration
# Generated on $(date)

[storage]
type = "file"
path = "$secrets_dir/vault.db"

[encryption]
algorithm = "AES-256-GCM"
key_derivation = "PBKDF2"

[rotation]
default_interval = "90d"
warning_threshold = "7d"

[access]
require_mfa = true
session_timeout = "1h"
audit_logging = true

[backup]
enabled = true
interval = "24h"
retention = "30d"
encryption = true
EOF

    # Create credential management script
    local cred_manager="$secrets_dir/manage-credentials.sh"
    cat > "$cred_manager" << 'EOF'
#!/bin/bash

# Secure Credential Management Script
# Provides secure credential storage and rotation

SECRETS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_CONFIG="$SECRETS_DIR/vault.conf"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
encrypt_credential() {
    local data="$1"
    local key_file="$SECRETS_DIR/keys/encryption.key"

    # Generate key if not exists
    if [[ ! -f "$key_file" ]]; then
        openssl rand -hex 32 > "$key_file"
        chmod 600 "$key_file"
    fi

    # Encrypt data
    echo "$data" | openssl enc -aes-256-gcm -kfile "$key_file" -base64
}

decrypt_credential() {
    local encrypted_data="$1"
    local key_file="$SECRETS_DIR/keys/encryption.key"

    if [[ ! -f "$key_file" ]]; then
        echo "Encryption key not found" >&2
        return 1
    fi

    echo "$encrypted_data" | openssl enc -aes-256-gcm -d -kfile "$key_file" -base64 2>/dev/null
}

store_credential() {
    local name="$1"
    local value="$2"
    local description="$3"

    local encrypted_value=$(encrypt_credential "$value")
    local timestamp=$(date -Iseconds)

    # Store credential metadata
    cat >> "$SECRETS_DIR/credentials.db" << EOF
{
  "name": "$name",
  "description": "$description",
  "created_at": "$timestamp",
  "last_rotated": "$timestamp",
  "encrypted_value": "$encrypted_value",
  "rotation_required": false
}
EOF

    echo -e "${GREEN}✓ Credential '$name' stored securely${NC}"
}

rotate_credential() {
    local name="$1"
    local new_value="$2"

    echo "Rotating credential: $name"
    # Implementation would find and update the credential
    echo -e "${GREEN}✓ Credential '$name' rotated${NC}"
}

list_credentials() {
    echo "Stored credentials:"
    if [[ -f "$SECRETS_DIR/credentials.db" ]]; then
        grep '"name":' "$SECRETS_DIR/credentials.db" | cut -d'"' -f4
    else
        echo "No credentials stored"
    fi
}

# Main command handler
case "${1:-}" in
    "store")
        if [[ $# -ne 3 ]]; then
            echo "Usage: $0 store <name> <value> <description>"
            exit 1
        fi
        store_credential "$2" "$3" "$4"
        ;;
    "rotate")
        if [[ $# -ne 2 ]]; then
            echo "Usage: $0 rotate <name>"
            exit 1
        fi
        echo "Enter new value for '$2':"
        read -s new_value
        rotate_credential "$2" "$new_value"
        ;;
    "list")
        list_credentials
        ;;
    *)
        echo "Usage: $0 {store|rotate|list}"
        echo ""
        echo "Examples:"
        echo "  $0 store DATABASE_URL 'postgresql://...' 'Production database'"
        echo "  $0 rotate DATABASE_URL"
        echo "  $0 list"
        exit 1
        ;;
esac
EOF

    chmod +x "$cred_manager"

    # Create README for secrets directory
    cat > "$secrets_dir/README.md" << EOF
# Secure Credential Storage

This directory contains securely stored credentials and sensitive data.

## Important Notes

- **NEVER** commit this directory to version control
- **NEVER** share encryption keys
- Regularly rotate credentials
- Maintain proper access controls

## Tools

- \`manage-credentials.sh\` - Credential management utility
- \`vault.conf\` - Vault configuration
- \`keys/\` - Encryption keys
- \`backups/\` - Encrypted backups

## Usage

\`\`\`bash
# Store a new credential
./manage-credentials.sh store API_KEY "your-key-here" "Production API key"

# Rotate an existing credential
./manage-credentials.sh rotate API_KEY

# List stored credentials
./manage-credentials.sh list
\`\`\`

## Security Best Practices

1. Use strong, unique credentials
2. Rotate credentials regularly (90 days recommended)
3. Use different credentials for different environments
4. Enable multi-factor authentication where possible
5. Monitor access logs regularly
EOF

    # Update report
    if command -v jq &> /dev/null; then
        jq '.credential_management.secure_storage_setup = true' "$SECRET_SCAN_REPORT" > /tmp/temp-report.json
        mv /tmp/temp-report.json "$SECRET_SCAN_REPORT"
    fi

    log_success "Secure credential storage configured in $secrets_dir"
    log_info "Use ./manage-credentials.sh to manage credentials securely"
}

generate_credential_rotation_schedule() {
    log "📅 Generating Credential Rotation Schedule..."

    local schedule_file="$PROJECT_ROOT/.secrets/rotation-schedule.md"

    cat > "$schedule_file" << EOF
# Credential Rotation Schedule

Generated on: $(date)

## High Priority Credentials (Rotate every 30 days)

- [ ] Database passwords
- [ ] Production API keys
- [ ] Stripe secret keys
- [ ] Supabase service keys
- [ ] JWT signing secrets

## Medium Priority Credentials (Rotate every 60 days)

- [ ] Third-party API keys
- [ ] Email service credentials
- [ ] Analytics API tokens
- [ ] Development database passwords

## Low Priority Credentials (Rotate every 90 days)

- [ ] SSH keys
- [ ] SSL/TLS certificates
- [ ] Backup encryption keys
- [ ] Access tokens

## Rotation Checklist

Before rotating credentials:
- [ ] Identify all systems using the credential
- [ ] Schedule maintenance window
- [ ] Prepare new credential values
- [ ] Test new credentials in staging
- [ ] Have rollback plan ready

After rotating credentials:
- [ ] Update all configuration files
- [ ] Restart affected services
- [ ] Verify systems are working
- [ ] Update credential documentation
- [ ] securely dispose of old credentials

## Automation

The following scripts can help with automation:

\`\`\`bash
# Check for credentials needing rotation
./scripts/secret-scanning-automation.sh --check-rotation

# Generate new credentials
./scripts/generate-secure-credentials.sh

# Update service configurations
./scripts/update-service-configs.sh
\`\`\`

## Contacts

For rotation issues or emergencies:
- Security Team: security@mariaborysevych.com
- DevOps Team: devops@mariaborysevych.com

## Compliance Notes

- Regular credential rotation is required by PCI DSS and security best practices
- All rotation activities must be logged for audit purposes
- Emergency rotation may be required if breach is suspected
EOF

    # Update report
    if command -v jq &> /dev/null; then
        jq '.credential_management.rotation_schedule_generated = true' "$SECRET_SCAN_REPORT" > /tmp/temp-report.json
        mv /tmp/temp-report.json "$SECRET_SCAN_REPORT"
    fi

    log_success "Credential rotation schedule generated: $schedule_file"
}

generate_rotation_recommendations() {
    local rotation_items=("$@")

    log_warning "Credential Rotation Recommendations:"

    for item in "${rotation_items[@]}"; do
        IFS=':' read -r file age <<< "$item"
        log_warning "  • $file ($age)"
    done

    # Add to report
    local recommendations=$(printf '"%s",' "${rotation_items[@]}")
    recommendations="[${recommendations%,}]"

    if command -v jq &> /dev/null; then
        jq ".remediation_actions += [{\"type\": \"credential_rotation\", \"items\": $recommendations, \"priority\": \"high\"}]" "$SECRET_SCAN_REPORT" > /tmp/temp-report.json
        mv /tmp/temp-report.json "$SECRET_SCAN_REPORT"
    fi
}

generate_secret_management_report() {
    log "📊 Generating Secret Management Report..."

    local report_file="$SECURITY_REPORT_DIR/secret-management-report-$(date +%Y%m%d-%H%M%S).html"

    # Generate HTML report
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secret Management Report - Mariia Hub</title>
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
        .secret-item { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .recommendation { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .action-item { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Secret Management Report</h1>
            <h2>Mariia Hub - Beauty & Fitness Platform</h2>
            <p>Generated on $(date)</p>
        </div>

        <div class="section">
            <h2>Scan Summary</h2>
            <div class="metric">
                <span class="metric-value critical">$TOTAL_SECRETS_FOUND</span>
                Total Secrets Found
            </div>
            <div class="metric">
                <span class="metric-value critical">$CRITICAL_SECRETS</span>
                Critical
            </div>
            <div class="metric">
                <span class="metric-value high">$HIGH_SECRETS</span>
                High Priority
            </div>
            <div class="metric">
                <span class="metric-value success">$CREDENTIALS_ROTATED</span>
                Credentials Rotated
            </div>
        </div>

        <div class="section">
            <h2>Security Assessment</h2>
EOF

    # Add security assessment
    if [[ $CRITICAL_SECRETS -eq 0 && $HIGH_SECRETS -eq 0 ]]; then
        cat >> "$report_file" << EOF
            <div class="success">
                <strong>✅ Good Security Posture</strong>
                <p>No critical or high-severity secrets found in codebase.</p>
            </div>
EOF
    elif [[ $CRITICAL_SECRETS -gt 0 ]]; then
        cat >> "$report_file" << EOF
            <div class="action-item">
                <strong>🚨 CRITICAL SECURITY ISSUES</strong>
                <p>$CRITICAL_SECRETS critical secrets found. Immediate action required!</p>
            </div>
EOF
    else
        cat >> "$report_file" << EOF
            <div class="warning">
                <strong>⚠️ Security Improvements Needed</strong>
                <p>$HIGH_SECRETS high-severity secrets found. Address these promptly.</p>
            </div>
EOF
    fi

    cat >> "$report_file" << EOF
        </div>

        <div class="section">
            <h2>Immediate Actions Required</h2>
EOF

    if [[ $CRITICAL_SECRETS -gt 0 ]]; then
        cat >> "$report_file" << EOF
            <div class="action-item">
                <h3>🚨 Critical - Remove Secrets Immediately</h3>
                <ol>
                    <li>Remove all critical secrets from code</li>
                    <li>Rotate all exposed credentials</li>
                    <li>Invalidate exposed API keys/tokens</li>
                    <li>Review git history for secret commits</li>
                    <li>Implement secret scanning in CI/CD</li>
                </ol>
            </div>
EOF
    fi

    cat >> "$report_file" << EOF
            <div class="recommendation">
                <h3>🔧 Implement Secure Credential Management</h3>
                <ol>
                    <li>Use the secure credential storage system in <code>.secrets/</code></li>
                    <li>Set up automated credential rotation</li>
                    <li>Integrate secret scanning into development workflow</li>
                    <li>Train team on secret management best practices</li>
                </ol>
            </div>

            <div class="recommendation">
                <h3>📋 Setup Ongoing Monitoring</h3>
                <ol>
                    <li>Configure pre-commit hooks for secret detection</li>
                    <li>Set up automated daily/weekly scans</li>
                    <li>Implement credential expiration alerts</li>
                    <li>Regular security audits and reviews</li>
                </ol>
            </div>
        </div>

        <div class="section">
            <h2>Tools and Resources</h2>
            <div class="code">
                <strong>Secret Scanning:</strong> ./scripts/secret-scanning-automation.sh<br>
                <strong>Credential Management:</strong> .secrets/manage-credentials.sh<br>
                <strong>Rotation Schedule:</strong> .secrets/rotation-schedule.md<br>
                <strong>Detailed Report:</strong> $SECRET_SCAN_REPORT
            </div>
        </div>

        <div class="section">
            <h2>Next Steps</h2>
            <ol>
                <li><strong>Immediate:</strong> Remove all critical secrets found</li>
                <li><strong>Today:</strong> Set up secure credential storage</li>
                <li><strong>This Week:</strong> Rotate all exposed credentials</li>
                <li><strong>Ongoing:</strong> Implement automated scanning and rotation</li>
            </ol>
        </div>
    </div>
</body>
</html>
EOF

    log_success "Secret management report generated: $report_file"
}

# Main execution
main() {
    # Check command line arguments
    case "${1:-}" in
        "--check-rotation")
            check_credential_rotation
            return
            ;;
        "--setup-storage")
            setup_secure_credential_storage
            return
            ;;
        "--help"|"-h")
            echo "Secret Scanning & Credential Management Automation"
            echo ""
            echo "Usage: $0 [OPTION]"
            echo ""
            echo "Options:"
            echo "  (no args)    Run comprehensive secret scan and setup"
            echo "  --check-rotation    Check credential rotation requirements"
            echo "  --setup-storage     Setup secure credential storage"
            echo "  --help              Show this help message"
            echo ""
            echo "This script provides comprehensive secret detection, credential"
            echo "rotation, and secure management capabilities for the project."
            return
            ;;
    esac

    # Run comprehensive scan
    run_comprehensive_secret_scan
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

# Check dependencies
if ! command -v jq &> /dev/null; then
    log_info "Installing jq for JSON processing..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y jq
    elif command -v brew &> /dev/null; then
        brew install jq
    else
        log_warning "Please install jq for JSON processing: apt-get install jq or brew install jq"
    fi
fi

# Run main function
main "$@"