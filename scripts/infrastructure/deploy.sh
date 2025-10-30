#!/bin/bash

# Infrastructure Deployment Script for Mariia Hub
# This script handles deployment across different environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-development}"
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
COMPOSE_OVERRIDE_FILE="docker-compose.override.yml"

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

# Help function
show_help() {
    cat << EOF
Mariia Hub Infrastructure Deployment Script

Usage: $0 [ENVIRONMENT] [OPTIONS]

ENVIRONMENTS:
  development    Deploy development environment (default)
  staging       Deploy staging environment
  production    Deploy production environment

OPTIONS:
  --build       Force rebuild of Docker images
  --no-cache     Build without cache
  --pull        Pull latest base images
  --dry-run      Show commands without executing
  --logs         Show logs after deployment
  --clean        Clean up unused containers and images
  --backup       Create backup before deployment
  --restore      Restore from backup
  --health-check Run health checks after deployment
  --rollback     Rollback to previous version

EXAMPLES:
  $0 development --build --logs
  $0 production --backup --health-check
  $0 staging --dry-run
  $0 production --rollback

EOF
}

# Parse command line arguments
BUILD=false
NO_CACHE=false
PULL=false
DRY_RUN=false
SHOW_LOGS=false
CLEAN=false
BACKUP=false
RESTORE=false
HEALTH_CHECK=false
ROLLBACK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --pull)
            PULL=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --logs)
            SHOW_LOGS=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --backup)
            BACKUP=true
            shift
            ;;
        --restore)
            RESTORE=true
            shift
            ;;
        --health-check)
            HEALTH_CHECK=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        development|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    show_help
    exit 1
fi

# Set environment-specific variables
case $ENVIRONMENT in
    development)
        COMPOSE_FILES="-f $COMPOSE_FILE -f $COMPOSE_OVERRIDE_FILE"
        ENV_FILE=".env.docker"
        ;;
    staging)
        COMPOSE_FILES="-f $COMPOSE_FILE"
        ENV_FILE=".env.staging"
        ;;
    production)
        COMPOSE_FILES="-f $COMPOSE_PROD_FILE"
        ENV_FILE=".env.production"
        ;;
esac

# Load environment file
if [[ -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
    log_info "Loading environment from $ENV_FILE"
    source "$PROJECT_ROOT/$ENV_FILE"
else
    log_warning "Environment file $ENV_FILE not found, using default values"
fi

# Change to project directory
cd "$PROJECT_ROOT"

# Function to execute Docker Compose commands
execute_compose() {
    local cmd="docker-compose $COMPOSE_FILES $*"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] $cmd"
        return 0
    fi

    log_info "Executing: $cmd"
    eval "$cmd"
}

# Function to build Docker images
build_images() {
    log_info "Building Docker images for $ENVIRONMENT environment..."

    local build_args=""
    if [[ "$NO_CACHE" == "true" ]]; then
        build_args="--no-cache"
    fi

    if [[ "$PULL" == "true" ]]; then
        build_args="$build_args --pull"
    fi

    execute_compose build $build_args

    if [[ $? -eq 0 ]]; then
        log_success "Docker images built successfully"
    else
        log_error "Failed to build Docker images"
        exit 1
    fi
}

# Function to backup current deployment
backup_deployment() {
    log_info "Creating backup of current deployment..."

    local backup_dir="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup database
    if docker-compose $COMPOSE_FILES exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$backup_dir/database.sql" 2>/dev/null; then
        log_success "Database backup created"
    else
        log_warning "Database backup failed"
    fi

    # Backup Docker volumes
    log_info "Backing up Docker volumes..."
    docker run --rm -v mariia-hub-prod-postgres-data:/data -v "$backup_dir":/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .

    # Save current Docker images
    docker-compose $COMPOSE_FILES images -q > "$backup_dir/images.txt"

    log_success "Backup created at $backup_dir"
}

# Function to restore from backup
restore_deployment() {
    log_error "Restore functionality not yet implemented"
    log_info "Please restore manually from the backup directory"
    exit 1
}

# Function to perform health checks
health_check() {
    log_info "Performing health checks..."

    local services=("app" "redis" "postgres" "nginx")
    local unhealthy_services=()

    for service in "${services[@]}"; do
        log_info "Checking health of $service service..."

        if docker-compose $COMPOSE_FILES ps "$service" | grep -q "Up (healthy)"; then
            log_success "$service is healthy"
        else
            log_warning "$service is not healthy"
            unhealthy_services+=("$service")
        fi
    done

    if [[ ${#unhealthy_services[@]} -gt 0 ]]; then
        log_error "Unhealthy services: ${unhealthy_services[*]}"

        # Show logs for unhealthy services
        log_info "Showing logs for unhealthy services..."
        for service in "${unhealthy_services[@]}"; do
            log_info "Logs for $service:"
            docker-compose $COMPOSE_FILES logs --tail=50 "$service"
        done

        return 1
    else
        log_success "All services are healthy"
        return 0
    fi
}

# Function to rollback deployment
rollback_deployment() {
    log_error "Rollback functionality not yet implemented"
    log_info "Please rollback manually using Docker Compose"
    exit 1
}

# Function to cleanup resources
cleanup_resources() {
    log_info "Cleaning up unused Docker resources..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] docker system prune -f"
        log_info "[DRY RUN] docker volume prune -f"
        return 0
    fi

    docker system prune -f
    docker volume prune -f

    log_success "Cleanup completed"
}

# Main deployment function
deploy_infrastructure() {
    log_info "Deploying Mariia Hub infrastructure in $ENVIRONMENT environment..."

    # Pre-deployment checks
    log_info "Running pre-deployment checks..."

    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    # Create backup if requested
    if [[ "$BACKUP" == "true" && "$ENVIRONMENT" == "production" ]]; then
        backup_deployment
    fi

    # Build images if requested
    if [[ "$BUILD" == "true" ]]; then
        build_images
    fi

    # Pull latest images if requested
    if [[ "$PULL" == "true" ]]; then
        log_info "Pulling latest images..."
        execute_compose pull
    fi

    # Stop existing services
    log_info "Stopping existing services..."
    execute_compose down

    # Start services
    log_info "Starting services..."
    execute_compose up -d

    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30

    # Run health checks if requested
    if [[ "$HEALTH_CHECK" == "true" ]]; then
        if ! health_check; then
            log_error "Health checks failed"
            exit 1
        fi
    fi

    # Show logs if requested
    if [[ "$SHOW_LOGS" == "true" ]]; then
        log_info "Showing logs..."
        execute_compose logs --tail=100 -f
    fi

    log_success "Deployment completed successfully"
}

# Main execution
main() {
    log_info "Mariia Hub Infrastructure Deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Project Root: $PROJECT_ROOT"

    # Handle special commands
    if [[ "$RESTORE" == "true" ]]; then
        restore_deployment
        exit 0
    fi

    if [[ "$ROLLBACK" == "true" ]]; then
        rollback_deployment
        exit 0
    fi

    # Clean resources if requested
    if [[ "$CLEAN" == "true" ]]; then
        cleanup_resources
        exit 0
    fi

    # Deploy infrastructure
    deploy_infrastructure

    log_success "Deployment process completed"
}

# Execute main function
main "$@"