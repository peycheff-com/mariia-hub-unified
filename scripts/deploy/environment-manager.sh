#!/bin/bash
# Environment Manager - Unified script for all environment operations
# Replaces: env-manager.sh, setup-supabase-staging.sh, setup-staging-domain.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default values
ACTION=""
ENVIRONMENT=""
SERVICE=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_help() {
  cat << EOF
Environment Manager - Unified Environment Operations

Usage: $0 [OPTIONS]

Options:
  --action ACTION      Action to perform (setup-staging, setup-domain, setup-supabase, setup-ci, teardown, list)
  --env ENV           Environment (staging, preview, production, local)
  --service SERVICE   Service to operate on (supabase, domain, ssl, all)
  --list             List available environments
  --help             Show this help message

Examples:
  $0 --action setup-staging --env staging --service supabase
  $0 --action setup-domain --env staging
  $0 --action list

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

# Source environment variables
load_env() {
  local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
  if [[ -f "$env_file" ]]; then
    source "$env_file"
    log_info "Loaded environment from $env_file"
  else
    log_warn "Environment file $env_file not found"
  fi
}

# Setup Staging Environment
setup_staging() {
  log_info "Setting up staging environment..."

  case "$SERVICE" in
    "supabase"|"all")
      log_info "Setting up Supabase staging..."
      load_env

      # Apply migrations
      if command -v supabase &> /dev/null; then
        supabase db push --project-ref "$VITE_SUPABASE_PROJECT_ID"
        log_info "Supabase migrations applied"
      else
        log_warn "Supabase CLI not found, skipping database setup"
      fi

      # Deploy functions
      if [[ -d "$PROJECT_ROOT/supabase/functions" ]]; then
        supabase functions deploy --project-ref "$VITE_SUPABASE_PROJECT_ID"
        log_info "Supabase functions deployed"
      fi
      ;;

    "domain"|"all")
      log_info "Setting up domain configuration..."
      load_env

      # Create domain configuration
      cat > "$PROJECT_ROOT/.vercel/project.json" << EOF
{
  "name": "mariia-hub-$ENVIRONMENT",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci --legacy-peer-deps",
  "devCommand": "npm run dev",
  "env": {
    "VITE_SUPABASE_URL": "$VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY": "$VITE_SUPABASE_ANON_KEY"
  }
}
EOF
      log_info "Domain configuration created"
      ;;
  esac

  log_info "Staging environment setup complete"
}

# Setup Domain
setup_domain() {
  log_info "Setting up domain for $ENVIRONMENT..."

  load_env

  # Create Vercel configuration
  cat > "$PROJECT_ROOT/vercel.json" << EOF
{
  "version": 2,
  "name": "mariia-hub-$ENVIRONMENT",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "$VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY": "$VITE_SUPABASE_ANON_KEY",
    "VITE_STRIPE_PUBLISHABLE_KEY": "$VITE_STRIPE_PUBLISHABLE_KEY"
  },
  "aliases": [
    "$ENVIRONMENT.mariia-hub.com"
  ]
}
EOF

  log_info "Domain configuration created for $ENVIRONMENT.mariia-hub.com"
}

# Setup CI/CD
setup_ci() {
  log_info "Setting up CI/CD configuration..."

  # Create GitHub Actions workflow
  mkdir -p "$PROJECT_ROOT/.github/workflows"

  cat > "$PROJECT_ROOT/.github/workflows/deploy.yml" << 'EOF'
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci --legacy-peer-deps
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
EOF

  log_info "CI/CD workflow created"
}

# List environments
list_environments() {
  echo "Available environments:"
  echo "  local     - Local development"
  echo "  staging   - Staging environment"
  echo "  preview   - Preview deployment"
  echo "  production - Production environment"
}

# Teardown environment
teardown() {
  log_info "Tearing down $ENVIRONMENT environment..."

  load_env

  case "$ENVIRONMENT" in
    "staging")
      log_warn "This will remove all staging data. Continue? (y/N)"
      read -r confirm
      if [[ $confirm =~ ^[Yy]$ ]]; then
        log_info "Tearing down staging environment..."
        # Add teardown logic here
      fi
      ;;
    *)
      log_error "Teardown not implemented for $ENVIRONMENT"
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
    --service)
      SERVICE="$2"
      shift 2
      ;;
    --list)
      list_environments
      exit 0
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

# Validate required parameters
if [[ -z "$ACTION" ]]; then
  log_error "Action is required"
  show_help
  exit 1
fi

if [[ -z "$ENVIRONMENT" ]]; then
  log_error "Environment is required"
  show_help
  exit 1
fi

if [[ -z "$SERVICE" ]]; then
  SERVICE="all"
  log_info "No service specified, using 'all'"
fi

# Execute action
case "$ACTION" in
  "setup-staging")
    setup_staging
    ;;
  "setup-domain")
    setup_domain
    ;;
  "setup-ci")
    setup_ci
    ;;
  "teardown")
    teardown
    ;;
  *)
    log_error "Unknown action: $ACTION"
    show_help
    exit 1
    ;;
esac

log_info "Environment manager completed successfully"
