#!/bin/bash
# Performance Optimizer - Unified performance analysis and optimization
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ACTION="analyze"
TARGET="all"
OUTPUT=""
FORMAT="console"
VERBOSE=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
  cat << 'EOF'
Performance Optimizer - Unified Performance Analysis and Optimization

Usage: $0 [OPTIONS]

Options:
  --action ACTION      Action (analyze, optimize, benchmark, budget-check)
  --target TARGET      Target (assets, bundles, images, all)
  --output FILE        Output file for results
  --format FORMAT      Output format (console, json)
  --verbose            Enable verbose output
  --help               Show this help message

Actions:
  analyze            Analyze current performance metrics
  optimize           Optimize assets and bundles
  benchmark          Run performance benchmarks
  budget-check       Check performance against budgets

Examples:
  $0 --action analyze --target bundles --format json --output perf-report.json
  $0 --action optimize --target images

EOF
}

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Analyze bundle size
analyze_bundles() {
  log_info "Analyzing bundle sizes..."

  if [[ ! -d "$PROJECT_ROOT/dist" ]]; then
    log_error "Build directory not found. Run 'npm run build' first."
    return 1
  fi

  local total_size=$(du -sk "$PROJECT_ROOT/dist" | cut -f1)
  log_info "Total bundle size: $(numfmt --to=iec $((total_size * 1024)))"

  # Analyze JS files
  find "$PROJECT_ROOT/dist" -name "*.js" -type f | while read -r js_file; do
    local size=$(stat -f%z "$js_file" 2>/dev/null || stat -c%s "$js_file")
    local filename=$(basename "$js_file")
    printf "  %-50s %8s\n" "$filename" "$(numfmt --to=iec $size)"
  done
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
    --output)
      OUTPUT="$2"
      shift 2
      ;;
    --format)
      FORMAT="$2"
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

# Execute action
case "$ACTION" in
  "analyze")
    analyze_bundles
    ;;
  *)
    log_error "Action $ACTION not implemented"
    exit 1
    ;;
esac
