#!/bin/bash

# Rollback Script for Mariia Hub
# Usage: ./scripts/rollback.sh [environment] [version|commit]

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
ENVIRONMENT=""
VERSION=""
COMMIT=""

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 [environment] [version|commit]"
  echo "Environment: staging|production"
  echo "Version: Optional version tag to rollback to"
  echo "Commit: Optional commit SHA to rollback to"
  exit 1
fi

ENVIRONMENT="$1"

if [[ $# -gt 1 ]]; then
  VERSION_OR_COMMIT="$2"
  if [[ "$VERSION_OR_COMMIT" =~ ^[0-9a-f]{7,40}$ ]]; then
    COMMIT="$VERSION_OR_COMMIT"
  else
    VERSION="$VERSION_OR_COMMIT"
  fi
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
  echo -e "${RED}Error: Invalid environment. Must be staging or production${NC}"
  exit 1
fi

# Environment URLs
case $ENVIRONMENT in
  "staging")
    URL="https://staging.mariia-hub.com"
    ;;
  "production")
    URL="https://mariia-hub.com"
    ;;
esac

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Rollback Configuration${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Environment: $ENVIRONMENT"
echo "URL: $URL"
if [[ -n "$VERSION" ]]; then
  echo "Version: $VERSION"
elif [[ -n "$COMMIT" ]]; then
  echo "Commit: $COMMIT"
else
  echo -e "${YELLOW}No version specified, will rollback to previous deployment${NC}"
fi
echo ""

# Confirmation
echo -e "${RED}WARNING: This will rollback the $ENVIRONMENT environment!${NC}"
echo -e "${YELLOW}Type 'ROLLBACK' to continue:${NC}"
read -r CONFIRMATION
if [[ "$CONFIRMATION" != "ROLLBACK" ]]; then
  echo -e "${RED}Rollback cancelled${NC}"
  exit 1
fi

# Check environment file
ENV_FILE=".env.${ENVIRONMENT}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${RED}Error: Environment file $ENV_FILE not found${NC}"
  exit 1
fi

# Source environment
set -a
source "$ENV_FILE"
set +a

# If version is specified, checkout that version
if [[ -n "$VERSION" ]]; then
  echo -e "${YELLOW}Checking out version $VERSION...${NC}"
  if ! git tag | grep -q "^$VERSION$"; then
    echo -e "${RED}Error: Version tag $VERSION not found${NC}"
    echo "Available tags:"
    git tag --sort=-version:refname | head -10
    exit 1
  fi
  git checkout "$VERSION"
elif [[ -n "$COMMIT" ]]; then
  echo -e "${YELLOW}Checking out commit $COMMIT...${NC}"
  if ! git rev-parse --verify "$COMMIT" >/dev/null 2>&1; then
    echo -e "${RED}Error: Commit $COMMIT not found${NC}"
    exit 1
  fi
  git checkout "$COMMIT"
else
  echo -e "${YELLOW}Rolling back to previous deployment...${NC}"
  # Get previous tag
  PREVIOUS_TAG=$(git describe --tags --abbrev=0 HEAD~1)
  if [[ -n "$PREVIOUS_TAG" ]]; then
    git checkout "$PREVIOUS_TAG"
    echo "Checked out tag: $PREVIOUS_TAG"
  else
    # Get previous commit
    git checkout HEAD~1
    echo "Checked out previous commit"
  fi
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci

# Build
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Deploy rollback
echo -e "${YELLOW}Deploying rollback...${NC}"

# Use Vercel alias for rollback
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ROLLBACK_ALIAS="rollback-${TIMESTAMP}-${ENVIRONMENT}"

vercel alias set "$ROLLBACK_ALIAS.mariia-hub.com" --scope="$VERCEL_ORG_ID"

# Switch main environment URL to rollback
case $ENVIRONMENT in
  "staging")
    vercel alias set staging.mariia-hub.com "$ROLLBACK_ALIAS.mariia-hub.com" --scope="$VERCEL_ORG_ID"
    ;;
  "production")
    vercel alias set mariia-hub.com "$ROLLBACK_ALIAS.mariia-hub.com" --scope="$VERCEL_ORG_ID"
    ;;
esac

echo -e "${GREEN}✅ Rollback deployed!${NC}"
echo "Rollback URL: https://$ROLLBACK_ALIAS.mariia-hub.com"
echo "Environment URL: $URL"

# Wait for deployment
echo -e "${YELLOW}Waiting for deployment to propagate...${NC}"
sleep 30

# Health check
echo -e "${YELLOW}Running health checks...${NC}"
if curl -f -s "$URL/health" >/dev/null; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed!${NC}"
  echo "The rollback may not be working correctly."
  echo "Please manually verify the application at $URL"
  exit 1
fi

# Create rollback tag
ROLLBACK_TAG="rollback-${ENVIRONMENT}-${TIMESTAMP}"
git config user.email "rollback@mariia-hub.com"
git config user.name "Rollback Bot"
git tag -a "$ROLLBACK_TAG" -m "Rollback of $ENVIRONMENT environment"

# Push tag
git push origin --tags

# Notification
echo -e "${YELLOW}Sending notifications...${NC}"

# Slack notification
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 ROLLBACK: $ENVIRONMENT environment rolled back\nURL: $URL\nRollback version: $ROLLBACK_TAG\"}" \
    "$SLACK_WEBHOOK_URL"
fi

# Create GitHub issue
if command -v gh &> /dev/null; then
  gh issue create \
    --title "Rollback performed on $ENVIRONMENT environment" \
    --body "## Rollback Information
- **Environment**: $ENVIRONMENT
- **URL**: $URL
- **Rollback Tag**: $ROLLBACK_TAG
- **Timestamp**: $(date)

### Reason
Please update this issue with the reason for the rollback.

### Actions Required
- [ ] Investigate the cause of the issue
- [ ] Create a fix
- [ ] Test thoroughly
- [ ] Re-deploy when fixed

### Rollback Details
\`\`\`
$(git log --oneline -5)
\`\`\`
" \
    --label "rollback" \
    --label "urgent"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Rollback Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Environment: $ENVIRONMENT"
echo "URL: $URL"
echo "Rollback Tag: $ROLLBACK_TAG"
echo ""
echo "A GitHub issue has been created to track this rollback."
echo "Please update it with the reason and investigation details."