#!/bin/bash
# Test Runner - Unified testing automation
# Replaces: intelligent-test-selection.js, master-test-orchestrator.js, enhanced-test-automation.js, continuous-performance-testing.js, visual-regression-testing.js

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default values
ACTION="run"
SUITE="all"
BROWSER="chromium"
HEADLESS=true
COVERAGE=true
PARALLEL=true
OUTPUT_DIR="$PROJECT_ROOT/test-results"
REPORT_FORMAT="html"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
  cat << 'EOF'
Test Runner - Unified Testing Automation

Usage: $0 [OPTIONS]

Options:
  --action ACTION      Action (run, coverage, visual, performance, watch, debug)
  --suite SUITE       Test suite (unit, e2e, visual, performance, accessibility, all)
  --browser BROWSER   Browser for e2e tests (chromium, firefox, webkit)
  --headed            Run in headed mode (not headless)
  --parallel          Run tests in parallel
  --output DIR        Output directory for reports
  --format FORMAT     Report format (html, json, junit)
  --grep PATTERN      Run tests matching pattern
  --help              Show this help message

Examples:
  $0 --action run --suite unit --grep "booking"
  $0 --action visual --browser chromium
  $0 --action performance --suite e2e

EOF
}

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
  [[ "$VERBOSE" == true ]] && echo -e "${BLUE}[DEBUG]${NC} $1"
}

setup_directories() {
  mkdir -p "$OUTPUT_DIR"
}

# Run unit tests
run_unit_tests() {
  log_info "Running unit tests..."

  cd "$PROJECT_ROOT"

  if [[ "$PARALLEL" == true ]]; then
    vitest run --reporter=verbose --coverage=$COVERAGE --outputFile="$OUTPUT_DIR/unit-tests.json"
  else
    vitest run --reporter=verbose --coverage=$COVERAGE --no-parallel --outputFile="$OUTPUT_DIR/unit-tests.json"
  fi

  if [[ $? -eq 0 ]]; then
    log_info "✓ Unit tests passed"
  else
    log_error "✗ Unit tests failed"
    return 1
  fi
}

# Run e2e tests
run_e2e_tests() {
  log_info "Running e2e tests on $BROWSER..."

  cd "$PROJECT_ROOT"

  local headed_flag=""
  if [[ "$HEADLESS" == false ]]; then
    headed_flag="--headed"
  fi

  playwright test --project="$BROWSER" $headed_flag --reporter=html,json --output="$OUTPUT_DIR/e2e-results.html"

  if [[ $? -eq 0 ]]; then
    log_info "✓ E2E tests passed"
  else
    log_error "✗ E2E tests failed"
    return 1
  fi
}

# Run visual regression tests
run_visual_tests() {
  log_info "Running visual regression tests..."

  cd "$PROJECT_ROOT"

  # Update snapshots
  if [[ "$UPDATE_SNAPSHOTS" == true ]]; then
    log_info "Updating visual snapshots..."
    PLAYWRIGHT_UPDATE_SNAPSHOTS=1 playwright test --project="$BROWSER" --update-snapshots
  else
    # Run visual tests
    PLAYWRIGHT_UPDATE_SNAPSHOTS=0 playwright test --project="$BROWSER" --grep="@visual"
  fi

  if [[ $? -eq 0 ]]; then
    log_info "✓ Visual tests passed"
  else
    log_error "✗ Visual tests failed"
    return 1
  fi
}

# Run performance tests
run_performance_tests() {
  log_info "Running performance tests..."

  cd "$PROJECT_ROOT"

  # Run Lighthouse CI
  if command -v lhci &> /dev/null; then
    lhci autorun --upload.target=temporary-public-storage
  elif command -v lighthouse &> /dev/null; then
    lighthouse http://localhost:8080 --output=json --output-path="$OUTPUT_DIR/lighthouse.json"
  else
    log_warn "Lighthouse not found, skipping performance tests"
  fi

  # Run bundle analysis
  if [[ -f "$PROJECT_ROOT/dist/stats.html" ]]; then
    log_info "Bundle size: $(du -sh "$PROJECT_ROOT/dist" | cut -f1)"
  fi
}

# Run accessibility tests
run_accessibility_tests() {
  log_info "Running accessibility tests..."

  cd "$PROJECT_ROOT"

  # Run axe accessibility tests
  playwright test --project="$BROWSER" --grep="@a11y"

  if [[ $? -eq 0 ]]; then
    log_info "✓ Accessibility tests passed"
  else
    log_error "✗ Accessibility tests failed"
    return 1
  fi
}

# Watch mode
watch_tests() {
  log_info "Starting test watcher..."

  cd "$PROJECT_ROOT"
  vitest
}

# Debug mode
debug_tests() {
  log_info "Starting test debug mode..."

  cd "$PROJECT_ROOT"

  if [[ "$GREP_PATTERN" ]]; then
    vitest --inspect-brk --reporter=verbose --grep="$GREP_PATTERN"
  else
    vitest --inspect-brk --reporter=verbose
  fi
}

# Generate coverage report
generate_coverage() {
  log_info "Generating coverage report..."

  cd "$PROJECT_ROOT"

  # Generate coverage from vitest
  if [[ -d "$PROJECT_ROOT/coverage" ]]; then
    cp -r "$PROJECT_ROOT/coverage" "$OUTPUT_DIR/coverage"

    # Generate HTML report
    npx nyc report --reporter=html --report-dir="$OUTPUT_DIR/coverage/html"

    log_info "Coverage report generated in $OUTPUT_DIR/coverage"
  else
    log_warn "No coverage data found"
  fi
}

# Intelligent test selection based on changes
select_tests() {
  log_info "Selecting tests based on changes..."

  # Get changed files
  local changed_files=$(git diff --name-only HEAD~1 2>/dev/null || echo "")

  if [[ -z "$changed_files" ]]; then
    log_info "No git changes detected, running all tests"
    run_all_tests
    return
  fi

  log_debug "Changed files: $changed_files"

  # Determine which test suites to run
  local run_unit=false
  local run_e2e=false
  local run_visual=false

  echo "$changed_files" | while read -r file; do
    case "$file" in
      src/**/*)
        run_unit=true
        ;;
      tests/e2e/**/*|tests/**/*)
        run_e2e=true
        ;;
      *visual*|*screenshot*|*snap*|*image*)
        run_visual=true
        ;;
    esac
  done

  if [[ "$run_unit" == true ]]; then
    run_unit_tests || return 1
  fi

  if [[ "$run_e2e" == true ]]; then
    run_e2e_tests || return 1
  fi

  if [[ "$run_visual" == true ]]; then
    run_visual_tests || return 1
  fi
}

# Run all tests
run_all_tests() {
  log_info "Running all test suites..."

  local status=0

  # Run unit tests
  run_unit_tests || status=1

  # Run e2e tests
  run_e2e_tests || status=1

  # Run accessibility tests
  run_accessibility_tests || status=1

  if [[ $status -eq 0 ]]; then
    log_info "✓ All tests passed"
  else
    log_error "✗ Some tests failed"
  fi

  return $status
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --action)
      ACTION="$2"
      shift 2
      ;;
    --suite)
      SUITE="$2"
      shift 2
      ;;
    --browser)
      BROWSER="$2"
      shift 2
      ;;
    --headed)
      HEADLESS=false
      shift
      ;;
    --parallel)
      PARALLEL=true
      shift
      ;;
    --no-parallel)
      PARALLEL=false
      shift
      ;;
    --output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --format)
      REPORT_FORMAT="$2"
      shift 2
      ;;
    --grep)
      GREP_PATTERN="$2"
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

# Setup
setup_directories

# Execute action
case "$ACTION" in
  "run")
    case "$SUITE" in
      "unit")
        run_unit_tests
        ;;
      "e2e")
        run_e2e_tests
        ;;
      "visual")
        run_visual_tests
        ;;
      "performance")
        run_performance_tests
        ;;
      "accessibility")
        run_accessibility_tests
        ;;
      "all")
        run_all_tests
        ;;
      *)
        log_error "Unknown test suite: $SUITE"
        show_help
        exit 1
        ;;
    esac
    ;;

  "coverage")
    generate_coverage
    ;;

  "visual")
    run_visual_tests
    ;;

  "performance")
    run_performance_tests
    ;;

  "watch")
    watch_tests
    ;;

  "debug")
    debug_tests
    ;;

  "smart")
    select_tests
    ;;

  *)
    log_error "Unknown action: $ACTION"
    show_help
    exit 1
    ;;
esac
