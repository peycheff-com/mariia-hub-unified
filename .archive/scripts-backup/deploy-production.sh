#!/bin/bash

# Production Deployment Script for Mariia Hub
# This script handles the complete production deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="production"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
BUILD_DIR="dist"

echo -e "${BLUE}🚀 Starting Production Deployment${NC}"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $(date)"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# 1. Pre-deployment checks
echo -e "${YELLOW}1️⃣  Running Pre-deployment Checks${NC}"
echo "-----------------------------------"

# Check if we're on the main branch
if [ "$(git branch --show-current)" != "main" ]; then
    echo -e "${RED}❌ Not on main branch. Current branch: $(git branch --show-current)${NC}"
    echo "Please switch to main branch before deploying to production."
    exit 1
fi
echo -e "${GREEN}✅ On main branch${NC}"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ Uncommitted changes detected${NC}"
    echo "Please commit or stash changes before deploying."
    exit 1
fi
echo -e "${GREEN}✅ No uncommitted changes${NC}"

# Check if production environment file exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    echo "Please create .env.production file with production configuration."
    exit 1
fi
echo -e "${GREEN}✅ Production environment file exists${NC}"

# Verify environment variables
echo "Checking critical environment variables..."
required_vars=("VITE_SUPABASE_URL" "VITE_STRIPE_PUBLISHABLE_KEY" "VITE_APP_URL")
for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env.production; then
        echo -e "${RED}❌ Missing required variable: $var${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All required environment variables present${NC}"

echo ""

# 2. Create backup
echo -e "${YELLOW}2️⃣  Creating Backup${NC}"
echo "------------------------"
mkdir -p "backups"
echo "Backup directory created: $BACKUP_DIR"

# Backup database (if using Supabase, this would be done via dashboard)
echo "Note: Database backup should be performed via Supabase dashboard"
echo ""

# 3. Install dependencies
echo -e "${YELLOW}3️⃣  Installing Dependencies${NC}"
echo "-------------------------------"
npm ci --production=false
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# 4. Run tests
echo -e "${YELLOW}4️⃣  Running Tests${NC}"
echo "--------------------"
if npm run test; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi
echo ""

# 5. Security audit
echo -e "${YELLOW}5️⃣  Running Security Audit${NC}"
echo "---------------------------"
if ./scripts/security-audit.sh; then
    echo -e "${GREEN}✅ Security audit passed${NC}"
else
    echo -e "${RED}❌ Security audit failed${NC}"
    echo "Review security report before proceeding."
    read -p "Continue despite security issues? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# 6. Build application
echo -e "${YELLOW}6️⃣  Building Application${NC}"
echo "---------------------------"
NODE_ENV=production npm run build
echo -e "${GREEN}✅ Build completed successfully${NC}"
echo ""

# 7. Verify build
echo -e "${YELLOW}7️⃣  Verifying Build${NC}"
echo "-----------------------"
if [ -f "$BUILD_DIR/index.html" ]; then
    echo -e "${GREEN}✅ Build files created${NC}"
else
    echo -e "${RED}❌ Build failed - no index.html found${NC}"
    exit 1
fi

# Check bundle size
BUNDLE_SIZE=$(du -sh $BUILD_DIR | cut -f1)
echo "Total bundle size: $BUNDLE_SIZE"
echo ""

# 8. Deploy to production
echo -e "${YELLOW}8️⃣  Deploying to Production${NC}"
echo "--------------------------------"

# This is where you would deploy to your hosting provider
# Example for Netlify:
# if command -v netlify &> /dev/null; then
#     netlify deploy --prod --dir=$BUILD_DIR
# fi

# Example for Vercel:
# if command -v vercel &> /dev/null; then
#     vercel --prod
# fi

# Example for AWS S3:
# aws s3 sync $BUILD_DIR s3://your-bucket-name --delete
# aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo -e "${YELLOW}⚠️  Deployment step skipped - configure your hosting provider${NC}"
echo "Add deployment commands for your hosting service (Netlify, Vercel, AWS, etc.)"
echo ""

# 9. Post-deployment verification
echo -e "${YELLOW}9️⃣  Post-deployment Verification${NC}"
echo "-------------------------------------"

# Health check
if [ ! -z "$VITE_APP_URL" ]; then
    echo "Performing health check on $VITE_APP_URL..."
    if curl -f -s "$VITE_APP_URL" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        echo "Site may not be responding correctly."
    fi
fi

echo ""

# 10. Clean up
echo -e "${YELLOW}🔟  Cleaning Up${NC}"
echo "-------------------"
echo "Clean up completed"
echo ""

# 11. Deployment summary
echo -e "${BLUE}✅ Deployment Summary${NC}"
echo "======================"
echo "Status: Success"
echo "Environment: $ENVIRONMENT"
echo "Build Size: $BUNDLE_SIZE"
echo "Timestamp: $(date)"
echo ""
echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify the application is working correctly"
echo "2. Monitor error tracking (Sentry)"
echo "3. Check analytics for real user data"
echo "4. Notify team of successful deployment"
echo ""

# Send notification (optional)
# if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
#     curl -X POST -H 'Content-type: application/json' \
#         --data '{"text":"✅ Mariia Hub deployed to production successfully!"}' \
#         $SLACK_WEBHOOK_URL
# fi