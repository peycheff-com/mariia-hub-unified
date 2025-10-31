#!/bin/bash
# Build Manager - Unified build and optimization tool
# Replaces: analyze-bundle.js, check-bundle-size.js, optimize-assets.js, performance-budget-validation.js

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ACTION="build"
TARGET="all"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_help() {
  cat << 'EOF'
Build Manager - Unified Build and Optimization Tool

Usage: $0 [OPTIONS]

Options:
  --action ACTION      Action (build, analyze, optimize, check)
  --target TARGET      Target (bundle, assets, all)
  --help               Show this help

Actions:
  build              Build the application
  analyze            Analyze build output
  optimize           Optimize build artifacts
  check              Check build health

EOF
}

build_app() {
  log_info "Building application..."
  cd "$PROJECT_ROOT"
  npm ci --legacy-peer-deps
  npm run build
  log_info "Build complete"
}

analyze_build() {
  log_info "Analyzing build..."

  if [[ ! -d "$PROJECT_ROOT/dist" ]]; then
    log_error "Build directory not found"
    return 1
  fi

  local total_size=$(du -sh "$PROJECT_ROOT/dist" | cut -f1)
  log_info "Build size: $total_size"

  # List JS files
  echo "JavaScript files:"
  find "$PROJECT_ROOT/dist" -name "*.js" -exec ls -lh {} \; | awk '{print "  " $9 " - " $5}' || true

  # List CSS files
  echo "CSS files:"
  find "$PROJECT_ROOT/dist" -name "*.css" -exec ls -lh {} \; | awk '{print "  " $9 " - " $5}' || true
}

optimize_build() {
  log_info "Optimizing build..."

  # Minify CSS
  find "$PROJECT_ROOT/dist" -name "*.css" -type f | while read -r css_file; do
    if command -v cssnano &> /dev/null; then
      cssnano "$css_file" "${css_file%.css}.min.css" 2>/dev/null || true
    fi
  done

  # Compress with gzip
  find "$PROJECT_ROOT/dist" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) | while read -r file; do
    if [[ ! -f "${file}.gz" ]]; then
      gzip -k -9 "$file" 2>/dev/null || true
    fi
  done

  log_info "Optimization complete"
}

check_build() {
  log_info "Checking build health..."

  local errors=0

  # Check for required files
  if [[ ! -f "$PROJECT_ROOT/dist/index.html" ]]; then
    log_error "Missing index.html"
    errors=$((errors + 1))
  fi

  # Check for JS files
  local js_count=$(find "$PROJECT_ROOT/dist" -name "*.js" -type f | wc -l)
  if [[ $js_count -eq 0 ]]; then
    log_error "No JavaScript files found"
    errors=$((errors + 1))
  fi

  # Check bundle size
  local size_kb=$(du -sk "$PROJECT_ROOT/dist" | cut -f1)
  if [[ $size_kb -gt 5120 ]]; then
    log_warn "Large bundle size: $((size_kb * 1024)) bytes"
  fi

  if [[ $errors -eq 0 ]]; then
    log_info "✓ Build health check passed"
    return 0
  else
    log_error "✗ Build health check failed with $errors error(s)"
    return 1
  fi
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
  "build")
    build_app
    ;;
  "analyze")
    analyze_build
    ;;
  "optimize")
    optimize_build
    ;;
  "check")
    check_build
    ;;
  *)
    log_error "Unknown action: $ACTION"
    show_help
    exit 1
    ;;
esac
