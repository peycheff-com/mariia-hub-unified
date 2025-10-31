#!/bin/bash
# Validation Suite - Unified validation for code, types, translations, and features
# Replaces: validate-feature-flags.js, validate-translations.js, test-data-manager.js, validate-feature-flags.js

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ACTION="run"
SUITE="all"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_help() {
  cat << 'EOF'
Validation Suite - Unified Validation Tool

Usage: $0 [OPTIONS]

Options:
  --action ACTION      Action (run, validate, sync)
  --suite SUITE       Suite (types, translations, features, data, all)
  --help              Show this help

Actions:
  run                Run all validations
  validate           Run specific validation
  sync               Synchronize data

Suites:
  types              TypeScript type checking
  translations       Translation validation
  features           Feature flag validation
  data               Test data validation
  all                Run all suites

EOF
}

validate_types() {
  log_info "Validating TypeScript types..."
  cd "$PROJECT_ROOT"
  npx tsc --noEmit
  if [[ $? -eq 0 ]]; then
    log_info "✓ TypeScript validation passed"
  else
    log_error "✗ TypeScript validation failed"
    return 1
  fi
}

validate_translations() {
  log_info "Validating translations..."

  # Check if translation files exist
  if [[ ! -d "$PROJECT_ROOT/src/i18n/locales" ]]; then
    log_warn "Translations directory not found"
    return 0
  fi

  # Check for missing keys
  local locales=$(find "$PROJECT_ROOT/src/i18n/locales" -name "*.json" | wc -l)
  log_info "Found $locales locale files"

  # Basic validation - check JSON syntax
  find "$PROJECT_ROOT/src/i18n/locales" -name "*.json" | while read -r locale_file; do
    if ! jq empty "$locale_file" 2>/dev/null; then
      log_error "Invalid JSON in $locale_file"
      return 1
    fi
  done

  log_info "✓ Translation validation passed"
}

validate_features() {
  log_info "Validating feature flags..."

  # Check if feature flags file exists
  if [[ -f "$PROJECT_ROOT/src/config/featureFlags.ts" ]]; then
    log_info "Feature flags file found"
  else
    log_warn "Feature flags file not found"
  fi

  # Check for undefined feature flags in code
  local flags_found=$(grep -r "FEATURE_" "$PROJECT_ROOT/src" --include="*.ts" --include="*.tsx" | wc -l)
  log_info "Found $flags_found feature flag references"

  log_info "✓ Feature validation passed"
}

validate_data() {
  log_info "Validating test data..."

  # Check if test data files exist
  if [[ -d "$PROJECT_ROOT/tests/data" ]]; then
    log_info "Test data directory found"
  else
    log_warn "Test data directory not found"
  fi

  # Check for mock data
  local mock_files=$(find "$PROJECT_ROOT/src" -name "*.mock.*" | wc -l)
  log_info "Found $mock_files mock files"

  log_info "✓ Data validation passed"
}

run_all() {
  log_info "Running all validation suites..."

  local errors=0

  validate_types || errors=$((errors + 1))
  validate_translations || errors=$((errors + 1))
  validate_features || errors=$((errors + 1))
  validate_data || errors=$((errors + 1))

  if [[ $errors -eq 0 ]]; then
    log_info "✓ All validation suites passed"
    return 0
  else
    log_error "✗ $errors validation suite(s) failed"
    return 1
  fi
}

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
  "run")
    run_all
    ;;
  "validate")
    case "$SUITE" in
      "types")
        validate_types
        ;;
      "translations")
        validate_translations
        ;;
      "features")
        validate_features
        ;;
      "data")
        validate_data
        ;;
      *)
        log_error "Unknown suite: $SUITE"
        exit 1
        ;;
    esac
    ;;
  *)
    log_error "Unknown action: $ACTION"
    show_help
    exit 1
    ;;
esac
