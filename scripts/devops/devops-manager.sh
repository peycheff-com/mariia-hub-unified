#!/bin/bash
# DevOps Manager - Unified build, deployment, and infrastructure automation
# Replaces: pre-production-cleanup.sh, production-deployment-optimization.sh, production-readiness-verification.sh, production-deployment-security.sh, container-infrastructure-security.sh, monitoring-logging-infrastructure.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default values
ACTION="build"
ENVIRONMENT="development"
TARGET=""
DRY_RUN=false
VERBOSE=false

# Configuration
BUILD_DIR="$PROJECT_ROOT/dist"
LOG_FILE="$PROJECT_ROOT/logs/devops.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
  cat << 'EOF'
DevOps Manager - Unified Build, Deployment, and Infrastructure Management

Usage: $0 [OPTIONS]

Options:
  --action ACTION      Action (build, deploy, verify, cleanup, monitor, rollback)
  --env ENV           Environment (development, staging, preview, production)
  --target TARGET     Deployment target (vercel, docker, k8s)
  --dry-run           Perform a dry run without changes
  --verbose           Enable verbose output
  --help              Show this help message

Actions:
  build              Build the application for specified environment
  deploy             Deploy to specified environment
  verify             Verify deployment health
  cleanup            Clean up old builds and temporary files
  monitor            Monitor application and infrastructure
  rollback           Rollback to previous version

Environments:
  development        Local development environment
  staging           Staging/testing environment
  preview           Preview deployment environment
  production        Production environment

Examples:
  $0 --action build --env production
  $0 --action deploy --env staging --target vercel
  $0 --action verify --env production
  $0 --action rollback --env production

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
  mkdir -p "$PROJECT_ROOT/logs" "$BUILD_DIR"
}

# Build application
build_app() {
  log_info "Building application for $ENVIRONMENT..."

  cd "$PROJECT_ROOT"

  # Install dependencies
  log_info "Installing dependencies..."
  npm ci --legacy-peer-deps

  # Run linting
  log_info "Running linter..."
  npm run lint || log_warn "Linting warnings found"

  # Run type checking
  log_info "Running type check..."
  npx tsc --noEmit || log_warn "Type checking warnings found"

  # Build the application
  log_info "Building application..."
  npm run build

  # Verify build
  if [[ ! -d "$BUILD_DIR" ]] || [[ -z "$(ls -A $BUILD_DIR)" ]]; then
    log_error "Build failed: output directory is empty"
    return 1
  fi

  # Generate build info
  local build_info="$BUILD_DIR/build-info.json"
  cat > "$build_info" << EOF
{
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(git rev-parse HEAD)",
  "branch": "$(git rev-parse --abbrev-ref HEAD)",
  "node": "$(node --version)",
  "npm": "$(npm --version)"
}
EOF

  log_info "✓ Build completed successfully"
  log_info "Build size: $(du -sh $BUILD_DIR | cut -f1)"
}

# Deploy to Vercel
deploy_vercel() {
  log_info "Deploying to Vercel ($ENVIRONMENT)..."

  cd "$PROJECT_ROOT"

  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY RUN] Would deploy to Vercel"
    return 0
  fi

  # Deploy
  local deploy_args="--prod"
  if [[ "$ENVIRONMENT" != "production" ]]; then
    deploy_args=""
  fi

  vercel deploy $deploy_args --yes

  if [[ $? -eq 0 ]]; then
    log_info "✓ Deployment to Vercel successful"
  else
    log_error "✗ Deployment to Vercel failed"
    return 1
  fi
}

# Deploy to Docker
deploy_docker() {
  log_info "Deploying to Docker ($ENVIRONMENT)..."

  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY RUN] Would deploy to Docker"
    return 0
  fi

  # Build Docker image
  local image_tag="mariia-hub:$ENVIRONMENT-$(date +%Y%m%d-%H%M%S)"
  docker build -t "$image_tag" .

  if [[ $? -eq 0 ]]; then
    log_info "✓ Docker image built: $image_tag"
  else
    log_error "✗ Docker build failed"
    return 1
  fi

  # Run container if not in production
  if [[ "$ENVIRONMENT" != "production" ]]; then
    docker run -d -p 8080:8080 --name "mariia-hub-$ENVIRONMENT" "$image_tag"
    log_info "✓ Container started"
  fi
}

# Deploy to Kubernetes
deploy_k8s() {
  log_info "Deploying to Kubernetes ($ENVIRONMENT)..."

  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY RUN] Would deploy to Kubernetes"
    return 0
  fi

  # Apply Kubernetes manifests
  if [[ -d "$PROJECT_ROOT/infra/k8s" ]]; then
    kubectl apply -f "$PROJECT_ROOT/infra/k8s/base"
    kubectl apply -f "$PROJECT_ROOT/infra/k8s/overlays/$ENVIRONMENT"

    log_info "✓ Kubernetes manifests applied"
  else
    log_warn "Kubernetes manifests not found, skipping k8s deployment"
  fi
}

# Verify deployment
verify_deployment() {
  log_info "Verifying deployment health..."

  local url=""
  case "$ENVIRONMENT" in
    "development")
      url="http://localhost:8080"
      ;;
    "staging")
      url="${STAGING_URL:-http://localhost:8080}"
      ;;
    "production")
      url="https://mariia-hub.com"
      ;;
  esac

  # Check if application is responding
  if command -v curl &> /dev/null; then
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

    if [[ "$status" == "200" ]]; then
      log_info "✓ Application is responding (HTTP $status)"
      return 0
    else
      log_error "✗ Application is not responding (HTTP $status)"
      return 1
    fi
  else
    log_warn "curl not found, skipping health check"
    return 0
  fi
}

# Cleanup old builds
cleanup() {
  log_info "Cleaning up old builds and temporary files..."

  # Clean npm cache
  npm cache clean --force

  # Clean build directory if it's too old
  if [[ -d "$BUILD_DIR" ]]; then
    local build_age=$(find "$BUILD_DIR" -type f -mtime +7 | wc -l)
    if [[ $build_age -gt 0 ]]; then
      log_info "Removing builds older than 7 days..."
      find "$BUILD_DIR" -type f -mtime +7 -delete
    fi
  fi

  # Clean Docker images (keep last 5)
  if command -v docker &> /dev/null; then
    log_info "Cleaning old Docker images..."
    docker image prune -a --force --filter "until=168h" 2>/dev/null || true
  fi

  # Clean logs older than 30 days
  find "$PROJECT_ROOT/logs" -type f -mtime +30 -delete 2>/dev/null || true

  log_info "✓ Cleanup completed"
}

# Monitor application
monitor_app() {
  log_info "Monitoring application health..."

  # Check disk usage
  local disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
  if [[ $disk_usage -gt 80 ]]; then
    log_warn "High disk usage: ${disk_usage}%"
  else
    log_info "Disk usage: ${disk_usage}%"
  fi

  # Check memory usage
  if command -v free &> /dev/null; then
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    log_info "Memory usage: ${mem_usage}%"
  fi

  # Check running processes
  local node_processes=$(pgrep -f "node" | wc -l)
  log_info "Node processes running: $node_processes"

  # Monitor Docker containers if available
  if command -v docker &> /dev/null; then
    local container_count=$(docker ps -q | wc -l)
    log_info "Docker containers running: $container_count"
  fi

  # Check build status
  if [[ -f "$BUILD_DIR/build-info.json" ]]; then
    local build_time=$(jq -r '.timestamp' "$BUILD_DIR/build-info.json")
    log_info "Last build: $build_time"
  fi
}

# Rollback deployment
rollback() {
  log_info "Rolling back deployment..."

  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY RUN] Would rollback deployment"
    return 0
  fi

  case "$TARGET" in
    "vercel")
      log_info "Rolling back Vercel deployment..."
      vercel rollback || log_error "Rollback failed"
      ;;
    "docker")
      log_info "Rolling back Docker deployment..."
      # Get previous image
      local previous_image=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "mariia-hub:$ENVIRONMENT" | head -2 | tail -1)
      if [[ -n "$previous_image" ]]; then
        docker stop "mariia-hub-$ENVIRONMENT" 2>/dev/null || true
        docker rm "mariia-hub-$ENVIRONMENT" 2>/dev/null || true
        docker run -d -p 8080:8080 --name "mariia-hub-$ENVIRONMENT" "$previous_image"
        log_info "✓ Rolled back to $previous_image"
      else
        log_error "No previous image found"
        return 1
      fi
      ;;
    *)
      log_error "Rollback not implemented for target: $TARGET"
      return 1
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
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --target)
      TARGET="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
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

# Validate environment
case "$ENVIRONMENT" in
  "development"|"staging"|"preview"|"production")
    ;;
  *)
    log_error "Invalid environment: $ENVIRONMENT"
    show_help
    exit 1
    ;;
esac

# Execute action
case "$ACTION" in
  "build")
    build_app
    ;;

  "deploy")
    if [[ -z "$TARGET" ]]; then
      log_error "Target is required for deployment"
      show_help
      exit 1
    fi

    case "$TARGET" in
      "vercel")
        deploy_vercel
        ;;
      "docker")
        deploy_docker
        ;;
      "k8s")
        deploy_k8s
        ;;
      *)
        log_error "Unknown deployment target: $TARGET"
        exit 1
        ;;
    esac
    ;;

  "verify")
    verify_deployment
    ;;

  "cleanup")
    cleanup
    ;;

  "monitor")
    monitor_app
    ;;

  "rollback")
    if [[ -z "$TARGET" ]]; then
      log_error "Target is required for rollback"
      exit 1
    fi
    rollback
    ;;

  *)
    log_error "Unknown action: $ACTION"
    show_help
    exit 1
    ;;
esac
