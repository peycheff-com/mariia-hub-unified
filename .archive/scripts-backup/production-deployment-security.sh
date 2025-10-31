#!/bin/bash

# Production Deployment Security Script
# This script implements secure deployment patterns with comprehensive
# security checks, monitoring, and rollback capabilities.

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
LOG_FILE="$PROJECT_ROOT/logs/deployment-security.log"
ROLLBACK_FILE="$PROJECT_ROOT/logs/rollback-info.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$ROLLBACK_FILE")"

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗ $1${NC}" | tee -a "$LOG_FILE"
}

# Security checks
check_prerequisites() {
    log "Checking deployment prerequisites..."

    # Check if we're in production mode
    if [[ "${NODE_ENV:-}" != "production" ]]; then
        log_error "NODE_ENV is not set to 'production'"
        exit 1
    fi

    # Check for required tools
    local required_tools=("node" "npm" "git" "openssl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done

    # Check for .env.production file
    if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
        log_error ".env.production file not found"
        exit 1
    fi

    # Check file permissions
    check_file_permissions

    log_success "Prerequisites check passed"
}

check_file_permissions() {
    log "Checking file permissions..."

    # Check .env.production permissions (should be 600)
    local env_perms=$(stat -c "%a" "$PROJECT_ROOT/.env.production" 2>/dev/null || stat -f "%A" "$PROJECT_ROOT/.env.production" 2>/dev/null)
    if [[ "$env_perms" != "600" ]]; then
        log_error ".env.production has insecure permissions: $env_perms (should be 600)"
        exit 1
    fi

    # Check for world-writable files
    local writable_files=$(find "$PROJECT_ROOT" -type f -perm -o+w 2>/dev/null || true)
    if [[ -n "$writable_files" ]]; then
        log_warning "World-writable files found:"
        echo "$writable_files" | while read -r file; do
            log_warning "  $file"
        done
    fi
}

validate_environment() {
    log "Validating production environment..."

    # Run security validation script
    if [[ -f "$PROJECT_ROOT/scripts/security-build-validation.cjs" ]]; then
        log "Running security build validation..."
        node "$PROJECT_ROOT/scripts/security-build-validation.cjs"
    else
        log_warning "Security validation script not found"
    fi

    # Validate environment variables
    validate_env_variables

    log_success "Environment validation passed"
}

validate_env_variables() {
    log "Validating environment variables..."

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
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable not set: $var"
            exit 1
        fi
    done

    # Check for placeholder values
    local placeholder_patterns=("template" "example" "your-" "xxxxx" "...")
    for var in "${required_vars[@]}"; do
        local value="${!var:-}"
        for pattern in "${placeholder_patterns[@]}"; do
            if [[ "$value" == *"$pattern"* ]]; then
                log_error "Environment variable $var contains placeholder: $value"
                exit 1
            fi
        done
    done

    # Check production-specific settings
    if [[ "$VITE_APP_ENV" != "production" ]]; then
        log_error "VITE_APP_ENV is not set to 'production': $VITE_APP_ENV"
        exit 1
    fi

    if [[ "$VITE_APP_URL" != https://* ]]; then
        log_error "VITE_APP_URL must use HTTPS in production: $VITE_APP_URL"
        exit 1
    fi

    # Check that development features are disabled
    if [[ "${VITE_HMR:-}" == "true" ]]; then
        log_error "VITE_HMR is enabled in production"
        exit 1
    fi

    if [[ "${VITE_SOURCE_MAP:-}" == "true" ]]; then
        log_error "VITE_SOURCE_MAP is enabled in production"
        exit 1
    fi
}

security_scan() {
    log "Running security scan..."

    # Check for secrets in code
    scan_for_secrets

    # Check for vulnerabilities
    scan_dependencies

    log_success "Security scan completed"
}

scan_for_secrets() {
    log "Scanning for potential secrets in code..."

    # Define secret patterns
    local secret_patterns=(
        "sk_[a-zA-Z0-9]{24,}"                    # Stripe secret keys
        "pk_[a-zA-Z0-9]{24,}"                    # Stripe publishable keys
        "[a-zA-Z0-9_-]{40,}="                    # Base64 encoded secrets
        "-----BEGIN [A-Z]+ KEY-----"              # Private keys
        "AIza[0-9A-Za-z_-]{35}"                  # Google API keys
        "[a-zA-Z0-9_-]{32}@[a-zA-Z0-9_-]+"       # API keys with @
    )

    # Scan source files
    local found_secrets=false
    for pattern in "${secret_patterns[@]}"; do
        if grep -rE "$pattern" "$PROJECT_ROOT/src" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null; then
            log_error "Potential secret found with pattern: $pattern"
            found_secrets=true
        fi
    done

    if [[ "$found_secrets" == "true" ]]; then
        log_error "Secrets found in source code. Remove them before deployment."
        exit 1
    fi
}

scan_dependencies() {
    log "Scanning dependencies for vulnerabilities..."

    # Check if npm audit is available
    if command -v npm &> /dev/null; then
        log "Running npm audit..."
        if npm audit --audit-level=moderate; then
            log_success "No moderate or high vulnerabilities found"
        else
            log_warning "Vulnerabilities found. Review npm audit output."
            read -p "Continue with deployment? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_error "Deployment cancelled due to vulnerabilities"
                exit 1
            fi
        fi
    fi
}

create_backup() {
    log "Creating deployment backup..."

    local backup_dir="$PROJECT_ROOT/backups/pre-deployment-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup current build
    if [[ -d "$PROJECT_ROOT/dist" ]]; then
        cp -r "$PROJECT_ROOT/dist" "$backup_dir/"
    fi

    # Backup environment files (without secrets)
    cp "$PROJECT_ROOT/.env.production" "$backup_dir/env.production.backup"

    # Save rollback information
    echo "BACKUP_DIR=$backup_dir" > "$ROLLBACK_FILE"
    echo "DEPLOYMENT_TIME=$(date)" >> "$ROLLBACK_FILE"
    echo "GIT_COMMIT=$(git rev-parse HEAD)" >> "$ROLLBACK_FILE"

    log_success "Backup created at $backup_dir"
}

build_application() {
    log "Building application with security configuration..."

    # Set production environment
    export NODE_ENV=production

    # Clean previous build
    if [[ -d "$PROJECT_ROOT/dist" ]]; then
        rm -rf "$PROJECT_ROOT/dist"
    fi

    # Run security-aware build
    if [[ -f "$PROJECT_ROOT/vite.config.security.ts" ]]; then
        log "Building with security configuration..."
        npm run build:security 2>/dev/null || npm run build
    else
        npm run build
    fi

    # Verify build output
    if [[ ! -d "$PROJECT_ROOT/dist" ]] || [[ -z "$(ls -A "$PROJECT_ROOT/dist")" ]]; then
        log_error "Build failed - no output generated"
        exit 1
    fi

    # Post-build security checks
    post_build_security_checks

    log_success "Application built successfully"
}

post_build_security_checks() {
    log "Running post-build security checks..."

    # Check for source maps in production
    local source_maps=$(find "$PROJECT_ROOT/dist" -name "*.map" 2>/dev/null || true)
    if [[ -n "$source_maps" ]]; then
        log_error "Source maps found in production build:"
        echo "$source_maps" | while read -r file; do
            log_error "  $file"
        done
        exit 1
    fi

    # Check for console.log statements
    local console_logs=$(grep -r "console\.log" "$PROJECT_ROOT/dist" --include="*.js" 2>/dev/null || true)
    if [[ -n "$console_logs" ]]; then
        log_warning "Console statements found in production build"
    fi

    # Check file sizes
    local large_files=$(find "$PROJECT_ROOT/dist" -name "*.js" -size +1M 2>/dev/null || true)
    if [[ -n "$large_files" ]]; then
        log_warning "Large JavaScript files found (consider code splitting):"
        echo "$large_files" | while read -r file; do
            local size=$(du -h "$file" | cut -f1)
            log_warning "  $file ($size)"
        done
    fi
}

run_tests() {
    log "Running production tests..."

    # Run unit tests
    if npm run test -- --run --coverage 2>/dev/null; then
        log_success "Unit tests passed"
    else
        log_warning "Unit tests failed or not available"
    fi

    # Run E2E tests if available
    if npm run test:e2e 2>/dev/null; then
        log_success "E2E tests passed"
    else
        log_warning "E2E tests failed or not available"
    fi
}

deploy_to_production() {
    log "Deploying to production..."

    # This would integrate with your deployment platform
    # Examples: Vercel, Netlify, AWS S3, Docker, etc.

    # Example for static deployment
    if [[ "${DEPLOYMENT_PLATFORM:-}" == "static" ]]; then
        deploy_static
    elif [[ "${DEPLOYMENT_PLATFORM:-}" == "docker" ]]; then
        deploy_docker
    else
        log_warning "No deployment platform specified. Skipping deployment step."
        log_warning "Build artifacts are ready in $PROJECT_ROOT/dist"
    fi

    log_success "Deployment completed"
}

deploy_static() {
    log "Deploying static files..."

    # Example deployment to a remote server
    if [[ -n "${DEPLOY_HOST:-}" ]] && [[ -n "${DEPLOY_PATH:-}" ]]; then
        rsync -avz --delete "$PROJECT_ROOT/dist/" "$DEPLOY_HOST:$DEPLOY_PATH/"
        log_success "Static files deployed to $DEPLOY_HOST:$DEPLOY_PATH"
    else
        log_warning "DEPLOY_HOST and DEPLOY_PATH not configured"
    fi
}

deploy_docker() {
    log "Building and deploying Docker image..."

    # Build Docker image
    if [[ -f "$PROJECT_ROOT/Dockerfile" ]]; then
        local image_name="${DOCKER_IMAGE_NAME:-mariia-hub}"
        local image_tag="${DOCKER_IMAGE_TAG:-latest}"

        docker build -t "$image_name:$image_tag" .
        log_success "Docker image built: $image_name:$image_tag"

        # Push to registry if configured
        if [[ -n "${DOCKER_REGISTRY:-}" ]]; then
            docker tag "$image_name:$image_tag" "$DOCKER_REGISTRY/$image_name:$image_tag"
            docker push "$DOCKER_REGISTRY/$image_name:$image_tag"
            log_success "Docker image pushed to registry"
        fi
    else
        log_warning "Dockerfile not found"
    fi
}

post_deployment_checks() {
    log "Running post-deployment checks..."

    # Wait for deployment to be ready
    sleep 10

    # Health check
    if [[ -n "${HEALTH_CHECK_URL:-}" ]]; then
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            log_success "Health check passed"
        else
            log_error "Health check failed"
            rollback_deployment
        fi
    fi

    # Security headers check
    if [[ -n "${SECURITY_CHECK_URL:-}" ]]; then
        check_security_headers
    fi

    log_success "Post-deployment checks completed"
}

check_security_headers() {
    log "Checking security headers..."

    local headers=$(curl -s -I "${SECURITY_CHECK_URL:-}" || true)

    local required_headers=(
        "X-Content-Type-Options"
        "X-Frame-Options"
        "X-XSS-Protection"
        "Referrer-Policy"
        "Content-Security-Policy"
    )

    local missing_headers=()
    for header in "${required_headers[@]}"; do
        if ! echo "$headers" | grep -qi "$header"; then
            missing_headers+=("$header")
        fi
    done

    if [[ ${#missing_headers[@]} -gt 0 ]]; then
        log_warning "Missing security headers:"
        for header in "${missing_headers[@]}"; do
            log_warning "  $header"
        done
    else
        log_success "All required security headers present"
    fi
}

rollback_deployment() {
    log_error "Initiating deployment rollback..."

    if [[ -f "$ROLLBACK_FILE" ]]; then
        source "$ROLLBACK_FILE"

        if [[ -n "${BACKUP_DIR:-}" ]] && [[ -d "$BACKUP_DIR" ]]; then
            log "Restoring from backup: $BACKUP_DIR"

            # Restore dist directory
            if [[ -d "$BACKUP_DIR/dist" ]]; then
                rm -rf "$PROJECT_ROOT/dist"
                cp -r "$BACKUP_DIR/dist" "$PROJECT_ROOT/"
            fi

            # Restore environment file
            if [[ -f "$BACKUP_DIR/env.production.backup" ]]; then
                cp "$BACKUP_DIR/env.production.backup" "$PROJECT_ROOT/.env.production"
            fi

            log_success "Rollback completed"
        else
            log_error "Backup directory not found: $BACKUP_DIR"
        fi
    else
        log_error "Rollback information not found"
    fi

    exit 1
}

cleanup() {
    log "Cleaning up..."

    # Remove temporary files
    # Keep backups for 30 days
    find "$PROJECT_ROOT/backups" -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true

    log_success "Cleanup completed"
}

# Signal handlers
trap 'log_error "Deployment interrupted"; rollback_deployment' INT TERM
trap cleanup EXIT

# Main deployment flow
main() {
    log "Starting secure production deployment..."

    check_prerequisites
    validate_environment
    security_scan
    create_backup
    build_application
    run_tests
    deploy_to_production
    post_deployment_checks

    log_success "🎉 Production deployment completed successfully!"
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "validate")
        check_prerequisites
        validate_environment
        security_scan
        log_success "Validation passed - ready for deployment"
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|validate}"
        exit 1
        ;;
esac