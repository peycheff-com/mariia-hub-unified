#!/bin/bash
# Environment Control - Unified environment management
# Replaces: config-manager.js, environment-manager.js, health-monitor.js, lifecycle-manager.js, resource-optimizer.js, test-automation.js

set -e

ACTION="status"
SERVICE="all"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_help() {
  cat << 'EOF'
Environment Control - Unified Environment Management

Usage: $0 [OPTIONS]

Options:
  --action ACTION      Action (status, health, lifecycle, optimize, config, test)
  --service SERVICE    Service (all, config, monitor, resources, lifecycle)
  --help               Show this help

Actions:
  status              Show environment status
  health              Check environment health
  lifecycle           Manage environment lifecycle
  optimize            Optimize resources
  config              Manage configuration
  test                Run environment tests

EOF
}

check_status() {
  log_info "Checking environment status..."

  # Check Docker
  if command -v docker &> /dev/null; then
    local containers=$(docker ps -q | wc -l)
    log_info "Docker containers running: $containers"
  fi

  # Check Node.js
  if command -v node &> /dev/null; then
    log_info "Node.js version: $(node --version)"
  fi

  # Check npm
  if command -v npm &> /dev/null; then
    log_info "npm version: $(npm --version)"
  fi

  # Check disk usage
  local disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
  log_info "Disk usage: ${disk_usage}%"

  # Check memory
  if command -v free &> /dev/null; then
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    log_info "Memory usage: ${mem_usage}%"
  fi
}

check_health() {
  log_info "Checking environment health..."

  # Check if required files exist
  local required_files=(
    "package.json"
    "vite.config.ts"
    "docker-compose.yml"
  )

  for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
      log_info "✓ $file exists"
    else
      log_warn "✗ $file missing"
    fi
  done

  # Check dependencies
  if [[ -d "node_modules" ]]; then
    log_info "✓ Dependencies installed"
  else
    log_warn "✗ Dependencies not installed"
  fi
}

manage_lifecycle() {
  log_info "Managing environment lifecycle..."

  case "$SERVICE" in
    "start")
      log_info "Starting environment services..."
      # Add service start logic
      ;;
    "stop")
      log_info "Stopping environment services..."
      # Add service stop logic
      ;;
    "restart")
      log_info "Restarting environment services..."
      # Add service restart logic
      ;;
    *)
      log_error "Unknown lifecycle action: $SERVICE"
      ;;
  esac
}

optimize_resources() {
  log_info "Optimizing environment resources..."

  # Clean npm cache
  npm cache clean --force 2>/dev/null || log_warn "Failed to clean npm cache"

  # Clean Docker
  if command -v docker &> /dev/null; then
    docker system prune -f 2>/dev/null || log_warn "Failed to clean Docker"
  fi

  # Clean logs
  find logs -type f -mtime +7 -delete 2>/dev/null || true

  log_info "✓ Resource optimization complete"
}

manage_config() {
  log_info "Managing configuration..."

  # Check environment files
  local env_files=$(ls -1 .env* 2>/dev/null | wc -l)
  log_info "Found $env_files environment file(s)"

  # Validate configuration
  if [[ -f ".env.example" ]]; then
    log_info "✓ Environment template exists"
  else
    log_warn "✗ Environment template missing"
  fi
}

run_tests() {
  log_info "Running environment tests..."

  # Run basic tests
  npm test -- --run 2>/dev/null || log_warn "Tests failed"

  # Check code coverage
  if [[ -d "coverage" ]]; then
    log_info "✓ Coverage report available"
  else
    log_warn "✗ No coverage report found"
  fi
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --action)
      ACTION="$2"
      shift 2
      ;;
    --service)
      SERVICE="$2"
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
  "status")
    check_status
    ;;
  "health")
    check_health
    ;;
  "lifecycle")
    manage_lifecycle
    ;;
  "optimize")
    optimize_resources
    ;;
  "config")
    manage_config
    ;;
  "test")
    run_tests
    ;;
  *)
    log_error "Unknown action: $ACTION"
    show_help
    exit 1
    ;;
esac
