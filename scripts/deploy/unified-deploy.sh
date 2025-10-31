#!/bin/bash
# Unified Deploy - All deployment operations in one script
# Replaces: deploy.sh, deploy-production.sh, deploy/deploy.sh, infrastructure/deploy.sh, kubernetes/deploy-k8s.sh, deployment/service-mesh-manager.sh, cdn-edge-optimization.sh, docker/container-lifecycle.sh

set -e

ACTION="deploy"
TARGET="vercel"
ENVIRONMENT="staging"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_help() {
  cat << 'EOF'
Unified Deploy - All Deployment Operations

Usage: $0 [OPTIONS]

Options:
  --action ACTION      Action (deploy, rollback, status, lifecycle)
  --target TARGET      Target (vercel, docker, k8s)
  --env ENV           Environment (staging, production)
  --help               Show this help

Actions:
  deploy              Deploy application
  rollback            Rollback deployment
  status              Check deployment status
  lifecycle           Manage container lifecycle

Targets:
  vercel              Deploy to Vercel
  docker              Deploy to Docker
  k8s                 Deploy to Kubernetes

EOF
}

deploy_vercel() {
  log_info "Deploying to Vercel ($ENVIRONMENT)..."

  if [[ "$ENVIRONMENT" == "production" ]]; then
    vercel deploy --prod --yes
  else
    vercel deploy --yes
  fi

  log_info "✓ Deployment to Vercel complete"
}

deploy_docker() {
  log_info "Deploying to Docker ($ENVIRONMENT)..."

  # Build image
  local image_tag="mariia-hub:$ENVIRONMENT"
  docker build -t "$image_tag" .

  log_info "✓ Docker image built: $image_tag"

  # Stop existing container
  docker stop "mariia-hub-$ENVIRONMENT" 2>/dev/null || true
  docker rm "mariia-hub-$ENVIRONMENT" 2>/dev/null || true

  # Start new container
  docker run -d -p 8080:8080 --name "mariia-hub-$ENVIRONMENT" "$image_tag"

  log_info "✓ Container started"
}

deploy_k8s() {
  log_info "Deploying to Kubernetes ($ENVIRONMENT)..."

  # Check if kubeconfig exists
  if ! kubectl cluster-info &> /dev/null; then
    log_error "Kubernetes cluster not accessible"
    return 1
  fi

  # Apply manifests
  if [[ -d "infra/k8s" ]]; then
    kubectl apply -f infra/k8s/base
    kubectl apply -f "infra/k8s/overlays/$ENVIRONMENT"

    log_info "✓ Kubernetes deployment complete"
  else
    log_warn "Kubernetes manifests not found"
  fi
}

rollback() {
  log_info "Rolling back deployment ($TARGET, $ENVIRONMENT)..."

  case "$TARGET" in
    "vercel")
      vercel rollback
      ;;
    "docker")
      # Get previous image
      local prev_image=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "mariia-hub:$ENVIRONMENT" | head -2 | tail -1)
      if [[ -n "$prev_image" ]]; then
        docker stop "mariia-hub-$ENVIRONMENT" 2>/dev/null || true
        docker rm "mariia-hub-$ENVIRONMENT" 2>/dev/null || true
        docker run -d -p 8080:8080 --name "mariia-hub-$ENVIRONMENT" "$prev_image"
        log_info "✓ Rolled back to $prev_image"
      fi
      ;;
    "k8s")
      kubectl rollout undo deployment/mariia-hub
      ;;
  esac
}

check_status() {
  log_info "Checking deployment status ($TARGET, $ENVIRONMENT)..."

  case "$TARGET" in
    "vercel")
      vercel ls
      ;;
    "docker")
      docker ps --filter "name=mariia-hub-$ENVIRONMENT"
      ;;
    "k8s")
      kubectl get pods -l app=mariia-hub
      ;;
  esac
}

manage_lifecycle() {
  log_info "Managing container lifecycle..."

  case "$ACTION" in
    "start")
      docker start "mariia-hub-$ENVIRONMENT" 2>/dev/null || log_warn "Container not found"
      ;;
    "stop")
      docker stop "mariia-hub-$ENVIRONMENT" 2>/dev/null || log_warn "Container not found"
      ;;
    "restart")
      docker restart "mariia-hub-$ENVIRONMENT" 2>/dev/null || log_warn "Container not found"
      ;;
    "logs")
      docker logs -f "mariia-hub-$ENVIRONMENT" 2>/dev/null || log_warn "Container not found"
      ;;
  esac
}

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
    --env)
      ENVIRONMENT="$2"
      shift 2
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

case "$ACTION" in
  "deploy")
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
        log_error "Unknown target: $TARGET"
        exit 1
        ;;
    esac
    ;;
  "rollback")
    rollback
    ;;
  "status")
    check_status
    ;;
  "lifecycle")
    manage_lifecycle
    ;;
  *)
    log_error "Unknown action: $ACTION"
    show_help
    exit 1
    ;;
esac
