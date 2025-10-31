#!/bin/bash

# Container Lifecycle Management Script for Mariia Hub
# ===================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
ENHANCED_COMPOSE_FILE="$PROJECT_DIR/docker-compose.enhanced-prod.yml"
BLUE_GREEN_COMPOSE_FILE="$PROJECT_DIR/docker-compose.blue-green.yml"

# Default values
ENVIRONMENT="production"
COMPOSE_TYPE="enhanced"  # basic, enhanced, blue-green
ACTION="deploy"
VERBOSE=false
FORCE=false
TIMEOUT=300
BACKUP_ENABLED=true
HEALTH_CHECK_ENABLED=true
MONITORING_ENABLED=true

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} [$timestamp] $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} [$timestamp] $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} [$timestamp] $message"
            ;;
        "DEBUG")
            if [[ "$VERBOSE" == true ]]; then
                echo -e "${BLUE}[DEBUG]${NC} [$timestamp] $message"
            fi
            ;;
        *)
            echo "[$timestamp] $message"
            ;;
    esac
}

# Help function
show_help() {
    cat << EOF
Usage: $(basename "$0") [ACTION] [OPTIONS]

Manage container lifecycle for Mariia Hub

ACTIONS:
    deploy                  Deploy containers
    update                  Update containers (rolling update)
    rollback                Rollback to previous version
    scale                   Scale services
    backup                  Backup data
    restore                 Restore data
    cleanup                 Cleanup unused resources
    health                  Health check
    logs                    Show logs
    stop                    Stop containers
    restart                 Restart containers

OPTIONS:
    -e, --environment ENV       Environment (production|staging|development) [default: production]
    -t, --type TYPE             Compose type (basic|enhanced|blue-green) [default: enhanced]
    -f, --force                 Force operation without confirmation
    -v, --verbose               Enable verbose output
    -t, --timeout SECONDS       Operation timeout [default: 300]
    --no-backup                 Skip backup before operations
    --no-health-check           Skip health checks
    --no-monitoring             Disable monitoring
    -h, --help                  Show this help message

ENVIRONMENT VARIABLES:
    BUILD_VERSION               Docker image version
    BUILD_SHA                   Git SHA for build
    DEPLOYMENT_COLOR            Blue/green deployment color
    ACTIVE_COLOR                Active deployment color
    CANARY_ENABLED              Enable canary deployment

EXAMPLES:
    # Deploy with enhanced compose
    $(basename "$0") deploy --type enhanced

    # Update with rolling update
    $(basename "$0") update --environment production

    # Scale services
    $(basename "$0") scale --replicas 5

    # Blue-green deployment
    $(basename "$0") deploy --type blue-green --deployment-color green

    # Backup data
    $(basename "$0") backup --environment production

EOF
}

# Parse command line arguments
parse_args() {
    ACTION=${1:-deploy}
    shift

    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--type)
                COMPOSE_TYPE="$2"
                shift 2
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --no-backup)
                BACKUP_ENABLED=false
                shift
                ;;
            --no-health-check)
                HEALTH_CHECK_ENABLED=false
                shift
                ;;
            --no-monitoring)
                MONITORING_ENABLED=false
                shift
                ;;
            --replicas)
                REPLICAS="$2"
                shift 2
                ;;
            --deployment-color)
                DEPLOYMENT_COLOR="$2"
                shift 2
                ;;
            --active-color)
                ACTIVE_COLOR="$2"
                shift 2
                ;;
            --canary-enabled)
                CANARY_ENABLED="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Get compose file based on type
get_compose_file() {
    case $COMPOSE_TYPE in
        "basic")
            echo "$COMPOSE_FILE"
            ;;
        "enhanced")
            echo "$ENHANCED_COMPOSE_FILE"
            ;;
        "blue-green")
            echo "$BLUE_GREEN_COMPOSE_FILE"
            ;;
        *)
            log "ERROR" "Invalid compose type: $COMPOSE_TYPE"
            exit 1
            ;;
    esac
}

# Validate prerequisites
validate_prerequisites() {
    log "INFO" "Validating prerequisites..."

    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker is not installed or not in PATH"
        exit 1
    fi

    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log "ERROR" "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    # Check if compose file exists
    local compose_file
    compose_file=$(get_compose_file)
    if [[ ! -f "$compose_file" ]]; then
        log "ERROR" "Compose file not found: $compose_file"
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log "ERROR" "Docker daemon is not running"
        exit 1
    fi

    log "INFO" "Prerequisites validation completed successfully"
}

# Prepare environment variables
prepare_env() {
    log "INFO" "Preparing environment variables..."

    # Export required environment variables
    export BUILD_VERSION=${BUILD_VERSION:-$(date +%Y%m%d-%H%M%S)}
    export BUILD_SHA=${BUILD_SHA:-$(git rev-parse HEAD 2>/dev/null || echo "unknown")}
    export BUILD_DATE=${BUILD_DATE:-$(date -u +'%Y-%m-%dT%H:%M:%SZ')}
    export BUILD_TIME=${BUILD_TIME:-$(date -u +'%H:%M:%S')}
    export ENVIRONMENT=$ENVIRONMENT
    export DEPLOYMENT_COLOR=${DEPLOYMENT_COLOR:-blue}
    export ACTIVE_COLOR=${ACTIVE_COLOR:-blue}
    export CANARY_ENABLED=${CANARY_ENABLED:-false}

    # Log environment variables (without secrets)
    log "INFO" "Environment configuration:"
    log "INFO" "  BUILD_VERSION: $BUILD_VERSION"
    log "INFO" "  BUILD_SHA: $BUILD_SHA"
    log "INFO" "  BUILD_DATE: $BUILD_DATE"
    log "INFO" "  ENVIRONMENT: $ENVIRONMENT"
    log "INFO" "  COMPOSE_TYPE: $COMPOSE_TYPE"
    log "INFO" "  DEPLOYMENT_COLOR: $DEPLOYMENT_COLOR"
    log "INFO" "  ACTIVE_COLOR: $ACTIVE_COLOR"
}

# Create backup before operations
create_backup() {
    if [[ "$BACKUP_ENABLED" == true ]] && [[ "$ACTION" =~ ^(deploy|update|rollback)$ ]]; then
        log "INFO" "Creating backup before operation..."

        local backup_dir="$PROJECT_DIR/backups/$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"

        # Backup volumes
        local volumes
        volumes=$(docker volume ls --filter "label=com.docker.compose.project=mariia-hub" --format "{{.Name}}" 2>/dev/null || true)

        for volume in $volumes; do
            log "INFO" "Backing up volume: $volume"
            docker run --rm \
                -v "$volume":/source:ro \
                -v "$backup_dir":/backup \
                alpine tar czf "/backup/${volume}.tar.gz" -C /source .
        done

        # Backup database
        if docker-compose -f "$(get_compose_file)" ps postgres | grep -q "Up"; then
            log "INFO" "Backing up database..."
            docker-compose -f "$(get_compose_file)" exec postgres pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-mariia_hub}" > "$backup_dir/database.sql"
        fi

        log "INFO" "Backup created at: $backup_dir"
    fi
}

# Health check function
health_check() {
    if [[ "$HEALTH_CHECK_ENABLED" == true ]]; then
        log "INFO" "Performing health check..."

        local compose_file
        compose_file=$(get_compose_file)
        local max_attempts=30
        local attempt=1

        while [[ $attempt -le $max_attempts ]]; do
            log "INFO" "Health check attempt $attempt/$max_attempts"

            # Check if main app is healthy
            if docker-compose -f "$compose_file" ps app | grep -q "Up (healthy)"; then
                log "INFO" "Application is healthy"
                return 0
            fi

            # Check individual services
            local services=("postgres" "redis" "app")
            local all_healthy=true

            for service in "${services[@]}"; do
                if docker-compose -f "$compose_file" ps "$service" | grep -q "Up"; then
                    local health_status
                    health_status=$(docker-compose -f "$compose_file" ps "$service" --format "table {{.Status}}" | tail -n +2 | grep -o "(healthy\|unhealthy\|starting)" || echo "unknown")

                    if [[ "$health_status" != "(healthy)" ]]; then
                        log "WARN" "Service $service is not healthy: $health_status"
                        all_healthy=false
                    fi
                else
                    log "WARN" "Service $service is not running"
                    all_healthy=false
                fi
            done

            if [[ "$all_healthy" == true ]]; then
                log "INFO" "All services are healthy"
                return 0
            fi

            sleep 10
            ((attempt++))
        done

        log "ERROR" "Health check failed after $max_attempts attempts"
        return 1
    fi
}

# Deploy containers
deploy_containers() {
    log "INFO" "Deploying containers..."

    local compose_file
    compose_file=$(get_compose_file)

    # Pull latest images
    log "INFO" "Pulling latest images..."
    docker-compose -f "$compose_file" pull

    # Start services
    log "INFO" "Starting services..."
    if [[ "$VERBOSE" == true ]]; then
        docker-compose -f "$compose_file" up -d --build
    else
        docker-compose -f "$compose_file" up -d --build --quiet-pull
    fi

    # Wait for services to be ready
    log "INFO" "Waiting for services to be ready..."
    sleep 30

    # Perform health check
    if ! health_check; then
        log "ERROR" "Deployment failed health check"
        if [[ "$FORCE" != true ]]; then
            log "INFO" "Rolling back..."
            rollback_containers
        fi
        exit 1
    fi

    log "INFO" "Deployment completed successfully"
}

# Update containers with rolling update
update_containers() {
    log "INFO" "Updating containers with rolling update..."

    local compose_file
    compose_file=$(get_compose_file)

    # Pull new images
    log "INFO" "Pulling new images..."
    docker-compose -f "$compose_file" pull

    # Update services one by one
    local services=("app" "postgres" "redis")

    for service in "${services[@]}"; do
        log "INFO" "Updating service: $service"

        if docker-compose -f "$compose_file" ps "$service" | grep -q "Up"; then
            # Scale up to ensure availability
            log "INFO" "Scaling up $service for update..."
            docker-compose -f "$compose_file" up -d --scale "$service=2" "$service"
            sleep 10

            # Update the service
            log "INFO" "Updating $service..."
            docker-compose -f "$compose_file" up -d --no-deps "$service"
            sleep 20

            # Scale back down
            log "INFO" "Scaling down $service..."
            docker-compose -f "$compose_file" up -d --scale "$service=1" "$service"
            sleep 10
        else
            log "WARN" "Service $service is not running, starting it..."
            docker-compose -f "$compose_file" up -d "$service"
        fi
    done

    # Perform health check
    if ! health_check; then
        log "ERROR" "Update failed health check"
        if [[ "$FORCE" != true ]]; then
            log "INFO" "Rolling back..."
            rollback_containers
        fi
        exit 1
    fi

    log "INFO" "Update completed successfully"
}

# Rollback containers
rollback_containers() {
    log "INFO" "Rolling back containers..."

    local compose_file
    compose_file=$(get_compose_file)

    # Get previous image tag
    local previous_tag
    previous_tag=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep "mariia-hub" | head -2 | tail -1 || echo "latest")

    log "INFO" "Rolling back to image: $previous_tag"

    # Update compose file to use previous tag
    sed -i.bak "s/mariia-hub:.*/mariia-hub:$previous_tag/g" "$compose_file"

    # Restart with previous image
    log "INFO" "Restarting with previous image..."
    docker-compose -f "$compose_file" up -d

    # Wait for services to be ready
    sleep 30

    # Perform health check
    if health_check; then
        log "INFO" "Rollback completed successfully"
    else
        log "ERROR" "Rollback failed"
        exit 1
    fi

    # Restore original compose file
    if [[ -f "$compose_file.bak" ]]; then
        mv "$compose_file.bak" "$compose_file"
    fi
}

# Scale services
scale_containers() {
    log "INFO" "Scaling services to $REPLICAS replicas..."

    local compose_file
    compose_file=$(get_compose_file)

    # Scale the app service
    docker-compose -f "$compose_file" up -d --scale app="$REPLICAS"

    # Wait for scaling to complete
    log "INFO" "Waiting for scaling to complete..."
    sleep 30

    # Verify scaling
    local running_containers
    running_containers=$(docker-compose -f "$compose_file" ps app | grep -c "Up" || true)

    if [[ "$running_containers" -eq "$REPLICAS" ]]; then
        log "INFO" "Scaling completed successfully. Running containers: $running_containers"
    else
        log "WARN" "Scaling may not be complete. Expected: $REPLICAS, Running: $running_containers"
    fi
}

# Backup data
backup_data() {
    log "INFO" "Starting data backup..."

    local backup_dir="$PROJECT_DIR/backups/manual/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup volumes
    log "INFO" "Backing up Docker volumes..."
    local volumes
    volumes=$(docker volume ls --filter "label=com.docker.compose.project=mariia-hub" --format "{{.Name}}" 2>/dev/null || true)

    for volume in $volumes; do
        log "INFO" "Backing up volume: $volume"
        docker run --rm \
            -v "$volume":/source:ro \
            -v "$backup_dir":/backup \
            alpine tar czf "/backup/${volume}.tar.gz" -C /source .
    done

    # Backup database
    if docker-compose -f "$(get_compose_file)" ps postgres | grep -q "Up"; then
        log "INFO" "Backing up database..."
        docker-compose -f "$(get_compose_file)" exec postgres pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-mariia_hub}" > "$backup_dir/database.sql"
    fi

    # Backup Docker configuration
    log "INFO" "Backing up Docker configuration..."
    cp "$(get_compose_file)" "$backup_dir/docker-compose.yml"

    # Create backup manifest
    cat > "$backup_dir/backup-manifest.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "environment": "$ENVIRONMENT",
    "compose_type": "$COMPOSE_TYPE",
    "build_version": "$BUILD_VERSION",
    "build_sha": "$BUILD_SHA",
    "volumes": [$(echo "$volumes" | sed 's/ /, /g' | sed 's/^/"/;s/$/"/')],
    "files": {
        "database": "database.sql",
        "compose": "docker-compose.yml"
    }
}
EOF

    log "INFO" "Backup completed successfully: $backup_dir"
}

# Restore data
restore_data() {
    log "INFO" "Starting data restore..."

    local backup_dir="$1"
    if [[ -z "$backup_dir" ]]; then
        log "ERROR" "Backup directory required for restore"
        exit 1
    fi

    if [[ ! -d "$backup_dir" ]]; then
        log "ERROR" "Backup directory not found: $backup_dir"
        exit 1
    fi

    # Stop services
    log "INFO" "Stopping services..."
    docker-compose -f "$(get_compose_file)" down

    # Restore volumes
    log "INFO" "Restoring Docker volumes..."
    local backup_files
    backup_files=$(find "$backup_dir" -name "*.tar.gz" || true)

    for backup_file in $backup_files; do
        local volume_name
        volume_name=$(basename "$backup_file" .tar.gz)
        log "INFO" "Restoring volume: $volume_name"

        docker volume create "$volume_name"
        docker run --rm \
            -v "$volume_name":/target \
            -v "$backup_dir":/backup \
            alpine tar xzf "/backup/${volume_name}.tar.gz" -C /target
    done

    # Restore database
    if [[ -f "$backup_dir/database.sql" ]]; then
        log "INFO" "Restoring database..."
        docker-compose -f "$(get_compose_file)" up -d postgres
        sleep 30

        docker-compose -f "$(get_compose_file)" exec -T postgres psql -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-mariia_hub}" < "$backup_dir/database.sql"
    fi

    # Start all services
    log "INFO" "Starting services..."
    docker-compose -f "$(get_compose_file)" up -d

    # Wait for services to be ready
    sleep 30

    # Perform health check
    if health_check; then
        log "INFO" "Restore completed successfully"
    else
        log "ERROR" "Restore failed health check"
        exit 1
    fi
}

# Cleanup unused resources
cleanup_resources() {
    log "INFO" "Cleaning up unused Docker resources..."

    # Remove unused containers
    log "INFO" "Removing unused containers..."
    docker container prune -f

    # Remove unused images
    log "INFO" "Removing unused images..."
    docker image prune -f

    # Remove unused networks
    log "INFO" "Removing unused networks..."
    docker network prune -f

    # Remove unused volumes (with confirmation)
    if [[ "$FORCE" == true ]] || read -p "Remove unused volumes? This may delete data! [y/N]: " -n 1 -r && echo && [[ $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Removing unused volumes..."
        docker volume prune -f
    fi

    log "INFO" "Cleanup completed"
}

# Show logs
show_logs() {
    log "INFO" "Showing logs..."

    local compose_file
    compose_file=$(get_compose_file)

    # Show logs for all services
    if [[ "$VERBOSE" == true ]]; then
        docker-compose -f "$compose_file" logs --tail=100 --follow
    else
        docker-compose -f "$compose_file" logs --tail=50
    fi
}

# Stop containers
stop_containers() {
    log "INFO" "Stopping containers..."

    local compose_file
    compose_file=$(get_compose_file)

    docker-compose -f "$compose_file" down

    log "INFO" "Containers stopped successfully"
}

# Restart containers
restart_containers() {
    log "INFO" "Restarting containers..."

    local compose_file
    compose_file=$(get_compose_file)

    docker-compose -f "$compose_file" restart

    # Wait for services to be ready
    sleep 30

    # Perform health check
    if health_check; then
        log "INFO" "Containers restarted successfully"
    else
        log "ERROR" "Container restart failed health check"
        exit 1
    fi
}

# Show status
show_status() {
    log "INFO" "Container Status:"
    echo "===================="

    local compose_file
    compose_file=$(get_compose_file)

    # Show running containers
    echo "Running Containers:"
    docker-compose -f "$compose_file" ps

    echo ""
    echo "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" || true

    echo ""
    echo "Image Versions:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | grep "mariia-hub" || true

    echo ""
    echo "Volume Usage:"
    docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}" || true
}

# Main execution function
main() {
    log "INFO" "Starting container lifecycle management for Mariia Hub"
    log "INFO" "Action: $ACTION"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Compose Type: $COMPOSE_TYPE"

    parse_args "$@"
    validate_prerequisites
    prepare_env

    # Create backup before operations
    if [[ "$ACTION" =~ ^(deploy|update|rollback)$ ]]; then
        create_backup
    fi

    case $ACTION in
        deploy)
            deploy_containers
            ;;
        update)
            update_containers
            ;;
        rollback)
            rollback_containers
            ;;
        scale)
            if [[ -z "${REPLICAS:-}" ]]; then
                log "ERROR" "Replicas count required for scale action"
                exit 1
            fi
            scale_containers
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data "$1"
            ;;
        cleanup)
            cleanup_resources
            ;;
        health)
            health_check
            ;;
        logs)
            show_logs
            ;;
        stop)
            stop_containers
            ;;
        restart)
            restart_containers
            ;;
        status)
            show_status
            ;;
        *)
            log "ERROR" "Unknown action: $ACTION"
            show_help
            exit 1
            ;;
    esac

    log "INFO" "Operation completed successfully!"
}

# Trap cleanup function
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log "ERROR" "Operation failed with exit code: $exit_code"
    fi
    exit $exit_code
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"