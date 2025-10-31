#!/bin/bash

# Deployment Script for Mariia Hub
# Usage: ./scripts/deploy.sh [environment] [options]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
FORCE_DEPLOY=false
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false
VERSION=""
BRANCH=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -f|--force)
      FORCE_DEPLOY=true
      shift
      ;;
    -s|--skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    -b|--skip-build)
      SKIP_BUILD=true
      shift
      ;;
    -n|--dry-run)
      DRY_RUN=true
      shift
      ;;
    -v|--version)
      VERSION="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  -e, --env ENVIRONMENT    Target environment (staging|production|preview)"
      echo "  -f, --force             Force deployment without checks"
      echo "  -s, --skip-tests        Skip running tests before deployment"
      echo "  -b, --skip-build        Skip build step (use existing build)"
      echo "  -n, --dry-run           Show what would be deployed without deploying"
      echo "  -v, --version VERSION   Specify version tag"
      echo "  --branch BRANCH         Source branch to deploy"
      echo "  -h, --help              Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Get current git information
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CURRENT_SHA=$(git rev-parse HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")
COMMIT_AUTHOR=$(git log -1 --pretty=format:"%an")

# Set defaults if not provided
if [[ -z "$ENVIRONMENT" ]]; then
  if [[ "$CURRENT_BRANCH" == "main" ]]; then
    ENVIRONMENT="production"
  elif [[ "$CURRENT_BRANCH" == "develop" ]]; then
    ENVIRONMENT="staging"
  else
    echo -e "${RED}Error: Cannot determine environment. Please specify with -e flag${NC}"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
  fi
fi

if [[ -z "$BRANCH" ]]; then
  BRANCH="$CURRENT_BRANCH"
fi

if [[ -z "$VERSION" ]]; then
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  VERSION="v0.0.0-${TIMESTAMP}-${CURRENT_SHA:0:7}"
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production|preview)$ ]]; then
  echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'. Must be one of: staging, production, preview${NC}"
  exit 1
fi

# Print deployment information
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deployment Configuration${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "Branch: ${BRANCH}"
echo "Version: ${VERSION}"
echo "Commit: ${CURRENT_SHA}"
echo "Author: ${COMMIT_AUTHOR}"
echo "Message: ${COMMIT_MESSAGE}"
echo ""

# Pre-deployment checks
echo -e "${YELLOW}Running pre-deployment checks...${NC}"

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
  echo -e "${RED}Error: Working directory is not clean. Please commit or stash changes.${NC}"
  git status --short
  exit 1
fi

# Check environment file
ENV_FILE=".env.${ENVIRONMENT}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${RED}Error: Environment file $ENV_FILE not found${NC}"
  exit 1
fi

# Source environment file
set -a
source "$ENV_FILE"
set +a

# Check required variables
check_env_var() {
  if [[ -z "${!1}" ]]; then
    echo -e "${RED}Error: Required environment variable $1 is not set${NC}"
    exit 1
  fi
}

# Basic required variables
check_env_var "NODE_VERSION"
check_env_var "VITE_SUPABASE_URL"
check_env_var "VITE_SUPABASE_ANON_KEY"

# Production-specific checks
if [[ "$ENVIRONMENT" == "production" ]]; then
  check_env_var "VITE_STRIPE_PUBLIC_KEY"
  echo -e "${YELLOW}Production deployment requires manual approval${NC}"
  echo "Please ensure you have approval in GitHub before continuing"
fi

# Run tests unless skipped
if [[ "$SKIP_TESTS" == false ]]; then
  echo -e "${YELLOW}Running tests...${NC}"

  # Install dependencies
  npm ci

  # Run linting
  npm run lint
  echo -e "${GREEN}✅ Linting passed${NC}"

  # Run type check
  npx tsc --noEmit
  echo -e "${GREEN}✅ Type check passed${NC}"

  # Run unit tests
  npm run test:coverage
  echo -e "${GREEN}✅ Unit tests passed${NC}"

  # Run integration tests if production
  if [[ "$ENVIRONMENT" == "production" ]]; then
    npm run test:integration
    echo -e "${GREEN}✅ Integration tests passed${NC}"
  fi
else
  echo -e "${YELLOW}Skipping tests as requested${NC}"
fi

# Build application unless skipped
if [[ "$SKIP_BUILD" == false ]]; then
  echo -e "${YELLOW}Building application...${NC}"
  npm run build
  echo -e "${GREEN}✅ Build successful${NC}"
else
  if [[ ! -d "dist" ]]; then
    echo -e "${RED}Error: Skip build requested but dist directory not found${NC}"
    exit 1
  fi
  echo -e "${YELLOW}Using existing build${NC}"
fi

# Run build verification
if [[ -d "dist" ]]; then
  echo -e "${YELLOW}Verifying build...${NC}"

  # Check if index.html exists
  if [[ ! -f "dist/index.html" ]]; then
    echo -e "${RED}Error: dist/index.html not found${NC}"
    exit 1
  fi

  # Check build size
  BUILD_SIZE=$(du -sh dist | cut -f1)
  echo "Build size: $BUILD_SIZE"

  # Check for critical files
  CRITICAL_FILES=("dist/assets/index-*.js" "dist/assets/index-*.css")
  for pattern in "${CRITICAL_FILES[@]}"; do
    if ! ls $pattern 1> /dev/null 2>&1; then
      echo -e "${RED}Error: No files found matching $pattern${NC}"
      exit 1
    fi
  done
  echo -e "${GREEN}✅ Build verification passed${NC}"
fi

# Dry run mode
if [[ "$DRY_RUN" == true ]]; then
  echo -e "${YELLOW}DRY RUN MODE - No actual deployment will occur${NC}"
  echo -e "${BLUE}Would deploy:${NC}"
  echo "  Environment: $ENVIRONMENT"
  echo "  Version: $VERSION"
  echo "  Branch: $BRANCH"
  echo "  Commit: $CURRENT_SHA"
  exit 0
fi

# Deploy based on environment
echo -e "${YELLOW}Starting deployment to $ENVIRONMENT...${NC}"

case $ENVIRONMENT in
  "staging"|"preview")
    # Deploy to Vercel
    echo "Deploying to Vercel..."
    if [[ "$ENVIRONMENT" == "staging" ]]; then
      vercel --prod --scope=$VERCEL_ORG_ID
    else
      vercel --scope=$VERCEL_ORG_ID
    fi
    ;;

  "production")
    # Production deployment requires special handling
    if [[ "$FORCE_DEPLOY" != true ]]; then
      echo -e "${YELLOW}Production deployment requires confirmation.${NC}"
      echo "Please type 'DEPLOY' to continue:"
      read -r CONFIRMATION
      if [[ "$CONFIRMATION" != "DEPLOY" ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
      fi
    fi

    # Deploy to Vercel production
    echo "Deploying to Vercel production..."
    vercel --prod --scope=$VERCEL_ORG_ID

    # Create deployment tag
    git config user.email "deploy@mariia-hub.com"
    git config user.name "Deployment Bot"
    git tag -a "$VERSION" -m "Production deployment $VERSION"
    git push origin --tags
    ;;
esac

echo -e "${GREEN}✅ Deployment successful!${NC}"

# Post-deployment health checks
echo -e "${YELLOW}Running post-deployment health checks...${NC}"

# Determine URL to check
case $ENVIRONMENT in
  "production")
    URL="https://mariia-hub.com"
    ;;
  "staging")
    URL="https://staging.mariia-hub.com"
    ;;
  "preview")
    URL="https://vercel.app"  # This will be replaced with actual URL
    ;;
esac

# Wait a bit for deployment to propagate
echo "Waiting for deployment to be ready..."
sleep 30

# Health check endpoints
ENDPOINTS=("/health" "/" "/api/health")
for endpoint in "${ENDPOINTS[@]}"; do
  echo -n "Checking $endpoint... "
  if curl -f -s "$URL$endpoint" > /dev/null; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAILED${NC}"
    echo -e "${RED}Health check failed for $URL$endpoint${NC}"
    exit 1
  fi
done

# Run smoke tests
echo -e "${YELLOW}Running smoke tests...${NC}"
if command -v npx &> /dev/null; then
  npx playwright test --config=playwright.config.ts --grep="smoke" --project=chromium --baseUrl="$URL"
  echo -e "${GREEN}✅ Smoke tests passed${NC}"
else
  echo -e "${YELLOW}Playwright not found, skipping smoke tests${NC}"
fi

# Final success message
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Environment: $ENVIRONMENT"
echo "URL: $URL"
echo "Version: $VERSION"
echo ""
echo "View deployment details: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\)\.git/\1/')/actions"

# Send notification if configured
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
  echo -e "${YELLOW}Sending Slack notification...${NC}"
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"✅ Deployment to $ENVIRONMENT successful\nURL: $URL\nVersion: $VERSION\"}" \
    "$SLACK_WEBHOOK_URL"
fi

exit 0