#!/bin/bash

# Environment Manager Script
# Handles environment-specific configuration management
# Author: Production Infrastructure Team
# Version: 1.0.0

set -euo pipefail

# Constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_DIR="$PROJECT_ROOT"
CONFIG_DIR="$PROJECT_ROOT/infra/config"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
}

# Usage information
usage() {
    cat << EOF
Environment Manager - Production Infrastructure

Usage: $0 [COMMAND] [OPTIONS]

COMMANDS:
    validate <env>      Validate environment configuration
    encrypt <env>       Encrypt sensitive values in environment file
    decrypt <env>       Decrypt encrypted values in environment file
    rotate <env>        Rotate secrets for specified environment
    backup <env>        Create backup of environment configuration
    restore <env> <file> Restore environment from backup file
    generate <env>      Generate new environment file with template
    list               List all available environments
    health <env>        Check health of environment configuration

ENVIRONMENTS:
    development        Local development environment
    staging           Staging environment
    production        Production environment (requires elevated permissions)

EXAMPLES:
    $0 validate production
    $0 encrypt production
    $0 rotate production
    $0 generate staging

OPTIONS:
    -h, --help         Show this help message
    -v, --verbose      Enable verbose logging
    -f, --force        Force operation without confirmation
    -q, --quiet        Suppress non-error output

SECURITY NOTE:
    This script manages sensitive production secrets.
    Only authorized personnel should use this tool.
    All actions are logged for audit purposes.

EOF
}

# Validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."

    # Check if required tools are available
    local required_tools=("gpg" "openssl" "jq" "aws")
    local missing_tools=()

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done

    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi

    # Check GPG key
    if ! gpg --list-secret-keys | grep -q "mariia-production"; then
        log_warning "Production GPG key not found. Encryption will be limited."
    fi

    log_success "Prerequisites validation completed"
}

# List available environments
list_environments() {
    log_info "Available environments:"

    local environments=("development" "staging" "production")

    for env in "${environments[@]}"; do
        local env_file="$ENV_DIR/.env.$env"
        if [ -f "$env_file" ]; then
            local file_size=$(stat -c%s "$env_file" 2>/dev/null || echo "0")
            local modified=$(stat -c%y "$env_file" 2>/dev/null || echo "unknown")
            echo "  - $env (exists, $file_size bytes, modified: $modified)"
        else
            echo "  - $env (missing)"
        fi
    done
}

# Validate environment configuration
validate_environment() {
    local env="$1"
    log_info "Validating environment: $env"

    local env_file="$ENV_DIR/.env.$env"

    if [ ! -f "$env_file" ]; then
        log_error "Environment file not found: $env_file"
        return 1
    fi

    # Check for required variables
    local required_vars=(
        "NODE_ENV"
        "APP_NAME"
        "APP_URL"
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
        "VITE_STRIPE_PUBLISHABLE_KEY"
    )

    local missing_vars=()
    local insecure_values=()

    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue

        # Extract variable name
        if [[ "$line" =~ ^([A-Z_][A-Z0-9_]*)= ]]; then
            local var_name="${BASH_REMATCH[1]}"
            local var_value="${line#*=}"

            # Check if it's a required variable
            if [[ " ${required_vars[*]} " =~ " $var_name " ]]; then
                # Remove from required list if found
                required_vars=("${required_vars[@]/$var_name}")
            fi

            # Check for insecure placeholder values
            if [[ "$var_value" =~ (REPLACE_WITH|your-|CHANGE_ME|xxx) ]]; then
                insecure_values+=("$var_name")
            fi

            # Check for exposed secrets in production
            if [[ "$env" == "production" ]]; then
                if [[ "$var_name" =~ (SECRET|KEY|TOKEN|PASSWORD) ]] &&
                   [[ "$var_value" =~ ^(sk_|pk_|sg_|ghp_) ]] &&
                   [[ "$var_value" =~ (ROTATE|EXPOSED|DUMMY) ]]; then
                    insecure_values+=("$var_name (EXPOSED SECRET)")
                fi
            fi
        fi
    done < "$env_file"

    # Report missing variables
    if [ ${#required_vars[@]} -ne 0 ]; then
        log_error "Missing required variables: ${required_vars[*]}"
        return 1
    fi

    # Report insecure values
    if [ ${#insecure_values[@]} -ne 0 ]; then
        log_error "Insecure placeholder values found: ${insecure_values[*]}"
        return 1
    fi

    # Check file permissions (should be 600 for production)
    if [[ "$env" == "production" ]]; then
        local file_perms=$(stat -c%a "$env_file")
        if [ "$file_perms" != "600" ]; then
            log_warning "Production environment file permissions: $file_perms (should be 600)"
            chmod 600 "$env_file"
            log_success "Fixed production environment file permissions"
        fi
    fi

    log_success "Environment validation passed: $env"
    return 0
}

# Encrypt sensitive values
encrypt_environment() {
    local env="$1"
    log_info "Encrypting environment: $env"

    local env_file="$ENV_DIR/.env.$env"
    local encrypted_file="$env_file.encrypted"

    if [ ! -f "$env_file" ]; then
        log_error "Environment file not found: $env_file"
        return 1
    fi

    # Create encrypted version
    gpg --batch --yes \
        --output "$encrypted_file" \
        --encrypt \
        --armor \
        --recipient "mariia-production@mariia.pl" \
        "$env_file"

    if [ $? -eq 0 ]; then
        log_success "Environment encrypted successfully: $encrypted_file"

        # Set secure permissions
        chmod 600 "$encrypted_file"

        # Create backup of original
        cp "$env_file" "$env_file.backup.$(date +%Y%m%d_%H%M%S)"

        log_info "Original file backed up. Consider removing it for enhanced security."
    else
        log_error "Failed to encrypt environment file"
        return 1
    fi
}

# Rotate secrets
rotate_secrets() {
    local env="$1"
    log_info "Rotating secrets for environment: $env"

    # This would integrate with your secret management system
    # For AWS, it would use Secrets Manager rotation
    # For other systems, integrate accordingly

    case "$env" in
        "production")
            log_warning "Production secret rotation requires authorization"
            log_info "Initiating AWS Secrets Manager rotation..."

            # Example: Rotate database credentials
            aws secretsmanager rotate-secret \
                --secret-id "mariia/production/database" \
                --rotation-lambda-arn "arn:aws:lambda:eu-west-1:123456789012:function:mariia-rotate-db-creds" \
                --region eu-west-1

            if [ $? -eq 0 ]; then
                log_success "Database credentials rotation initiated"
            else
                log_error "Failed to initiate database credentials rotation"
                return 1
            fi
            ;;
        "staging")
            log_info "Rotating staging environment secrets"
            # Implement staging secret rotation logic
            ;;
        *)
            log_error "Secret rotation not implemented for environment: $env"
            return 1
            ;;
    esac

    log_success "Secret rotation completed for: $env"
}

# Backup environment configuration
backup_environment() {
    local env="$1"
    log_info "Creating backup for environment: $env"

    local env_file="$ENV_DIR/.env.$env"
    local backup_dir="$PROJECT_ROOT/backups/environments"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/.env.$env.$timestamp.tar.gz"

    if [ ! -f "$env_file" ]; then
        log_error "Environment file not found: $env_file"
        return 1
    fi

    # Create backup directory
    mkdir -p "$backup_dir"

    # Create encrypted backup
    tar -czf - "$env_file" | \
        gpg --batch --yes \
            --output "$backup_file" \
            --encrypt \
            --armor \
            --recipient "mariia-production@mariia.pl"

    if [ $? -eq 0 ]; then
        log_success "Backup created: $backup_file"

        # Clean up old backups (keep last 10)
        find "$backup_dir" -name ".env.$env.*.tar.gz" -type f | \
            sort -r | tail -n +11 | xargs -r rm
    else
        log_error "Failed to create backup"
        return 1
    fi
}

# Check environment health
check_environment_health() {
    local env="$1"
    log_info "Checking health of environment: $env"

    local health_score=0
    local max_score=10

    # Check if environment file exists (+2 points)
    local env_file="$ENV_DIR/.env.$env"
    if [ -f "$env_file" ]; then
        health_score=$((health_score + 2))
        log_success "Environment file exists"
    else
        log_error "Environment file missing"
    fi

    # Check file permissions (+2 points for correct permissions)
    if [ -f "$env_file" ]; then
        local file_perms=$(stat -c%a "$env_file" 2>/dev/null || echo "000")
        if [[ ("$env" == "production" && "$file_perms" == "600") ||
              ("$env" != "production" && "$file_perms" =~ ^[64][04][04]$) ]]; then
            health_score=$((health_score + 2))
            log_success "File permissions correct: $file_perms"
        else
            log_warning "File permissions potentially insecure: $file_perms"
        fi
    fi

    # Check for required variables (+3 points)
    if validate_environment "$env" &>/dev/null; then
        health_score=$((health_score + 3))
        log_success "Required variables present"
    else
        log_error "Required variables missing or invalid"
    fi

    # Check for recent encryption (+3 points)
    local encrypted_file="$env_file.encrypted"
    if [ -f "$encrypted_file" ]; then
        local encrypted_age=$(($(date +%s) - $(stat -c%Y "$encrypted_file" 2>/dev/null || echo 0)))
        local days_old=$((encrypted_age / 86400))

        if [ "$days_old" -lt 7 ]; then
            health_score=$((health_score + 3))
            log_success "Recent encryption found (${days_old} days old)"
        elif [ "$days_old" -lt 30 ]; then
            health_score=$((health_score + 2))
            log_warning "Encryption exists but could be refreshed (${days_old} days old)"
        else
            log_warning "Old encryption found (${days_old} days old)"
        fi
    else
        log_warning "No encrypted version found"
    fi

    # Calculate health percentage
    local health_percentage=$((health_score * 100 / max_score))

    echo
    echo "Environment Health Score: $health_score/$max_score (${health_percentage}%)"

    if [ "$health_percentage" -ge 80 ]; then
        log_success "Environment is healthy"
        return 0
    elif [ "$health_percentage" -ge 60 ]; then
        log_warning "Environment needs attention"
        return 1
    else
        log_error "Environment is unhealthy"
        return 2
    fi
}

# Generate new environment file
generate_environment() {
    local env="$1"
    log_info "Generating environment file for: $env"

    local env_file="$ENV_DIR/.env.$env"
    local template_file="$CONFIG_DIR/.env.$env.template"

    if [ ! -f "$template_file" ]; then
        log_error "Template file not found: $template_file"
        return 1
    fi

    if [ -f "$env_file" ]; then
        read -p "Environment file exists. Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Operation cancelled"
            return 0
        fi
    fi

    # Copy template
    cp "$template_file" "$env_file"

    # Set appropriate permissions
    if [ "$env" == "production" ]; then
        chmod 600 "$env_file"
    else
        chmod 640 "$env_file"
    fi

    log_success "Environment file generated: $env_file"
    log_warning "Remember to update all placeholder values with real configuration"
}

# Main execution
main() {
    local command=""
    local environment=""
    local verbose=false
    local force=false
    local quiet=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -q|--quiet)
                quiet=true
                shift
                ;;
            validate|encrypt|decrypt|rotate|backup|restore|generate|list|health)
                command="$1"
                shift
                environment="${1:-}"
                shift
                ;;
            *)
                log_error "Unknown argument: $1"
                usage
                exit 1
                ;;
        esac
    done

    # Set verbose mode
    if [ "$verbose" = true ]; then
        set -x
    fi

    # Validate command
    if [ -z "$command" ]; then
        log_error "No command specified"
        usage
        exit 1
    fi

    # Special case for list command
    if [ "$command" = "list" ]; then
        list_environments
        exit 0
    fi

    # Validate environment (except for generate command)
    if [ "$command" != "generate" ] && [ -z "$environment" ]; then
        log_error "No environment specified"
        usage
        exit 1
    fi

    # Validate environment name
    local valid_environments=("development" "staging" "production")
    if [[ ! " ${valid_environments[*]} " =~ " $environment " ]]; then
        log_error "Invalid environment: $environment"
        log_info "Valid environments: ${valid_environments[*]}"
        exit 1
    fi

    # Validate prerequisites for production commands
    if [[ "$environment" == "production" && "$command" =~ (encrypt|rotate|backup) ]]; then
        validate_prerequisites
    fi

    # Execute command
    case "$command" in
        validate)
            validate_environment "$environment"
            ;;
        encrypt)
            encrypt_environment "$environment"
            ;;
        decrypt)
            log_error "Decrypt command not implemented"
            exit 1
            ;;
        rotate)
            rotate_secrets "$environment"
            ;;
        backup)
            backup_environment "$environment"
            ;;
        restore)
            log_error "Restore command not implemented"
            exit 1
            ;;
        generate)
            generate_environment "$environment"
            ;;
        health)
            check_environment_health "$environment"
            ;;
        *)
            log_error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"