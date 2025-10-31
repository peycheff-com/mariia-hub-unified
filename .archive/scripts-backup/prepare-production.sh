#!/bin/bash

# Production Preparation Script
# This script prepares the repository for production deployment

set -e

echo "🚀 Preparing Mariia Hub for production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're on main branch
if [ "$(git branch --show-current)" != "main" ]; then
    print_error "Not on main branch. Please switch to main first."
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Working directory not clean. Staging changes..."
    git add -A
    git commit -m "chore: stage changes before production prep"
fi

# 1. Create backup branch
echo ""
echo "📦 Creating backup branch..."
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH"
print_status "Created backup branch: $BACKUP_BRANCH"

# 2. Run pre-production cleanup
echo ""
echo "🧹 Running pre-production cleanup..."
if [ -f "scripts/pre-production-cleanup.sh" ]; then
    ./scripts/pre-production-cleanup.sh
else
    print_error "Cleanup script not found"
    exit 1
fi

# 3. Install production dependencies
echo ""
echo "📦 Installing production dependencies..."
rm -rf node_modules
npm ci --production
print_status "Production dependencies installed"

# 4. Run production build
echo ""
echo "🔨 Building for production..."
npm run build
print_status "Build completed successfully"

# 5. Verify build
echo ""
echo "🔍 Verifying build..."
if [ ! -d "dist" ]; then
    print_error "Build directory not found"
    exit 1
fi

# Check bundle size
BUNDLE_SIZE=$(du -sh dist | cut -f1)
print_status "Bundle size: $BUNDLE_SIZE"

# 6. Run security audit
echo ""
echo "🔒 Running security audit..."
npm audit --audit-level moderate || print_warning "Security vulnerabilities found"

# 7. Run type check
echo ""
echo "📝 Running type check..."
npx tsc --noEmit || print_error "TypeScript errors found"

# 8. Create production tag
echo ""
echo "🏷️ Creating production tag..."
VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION-$(date +%Y%m%d-%H%M%S)"
git add -A
git commit -m "chore: production release $TAG"
git tag -a "$TAG" -m "Production release $TAG"
print_status "Created tag: $TAG"

# 9. Generate deployment manifest
echo ""
echo "📋 Generating deployment manifest..."
cat > deployment-manifest.json << EOF
{
  "version": "$TAG",
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "bundleSize": "$BUNDLE_SIZE",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "gitCommit": "$(git rev-parse HEAD)",
  "gitBranch": "$(git branch --show-current)",
  "environment": "production"
}
EOF
print_status "Deployment manifest created"

# 10. Create .env.production.example
echo ""
echo "📝 Creating .env.production.example..."
cat > .env.production.example << EOF
# Production Environment Variables
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=your-production-stripe-key
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SENTRY_DSN=your-production-sentry-dsn
VITE_GA_TRACKING_ID=your-production-ga-id
VITE_ENVIRONMENT=production
EOF
print_status "Production environment template created"

# 11. Final summary
echo ""
echo "🎉 Production preparation complete!"
echo ""
echo "📊 Summary:"
echo "  - Backup branch: $BACKUP_BRANCH"
echo "  - Production tag: $TAG"
echo "  - Bundle size: $BUNDLE_SIZE"
echo "  - Build output: ./dist"
echo ""
echo "📋 Next steps:"
echo "  1. Review changes: git diff main $BACKUP_BRANCH"
echo "  2. Push to remote: git push && git push --tags"
echo "  3. Deploy using your preferred method:"
echo "     - Docker: docker build -t mariia-hub:$TAG ."
echo "     - Vercel: vercel --prod"
echo "     - Static hosting: Deploy ./dist directory"
echo ""
echo "🔍 To verify deployment:"
echo "  - Check health endpoint: /health"
echo "  - Verify bundle size"
echo "  - Monitor error rates"
echo "  - Test critical user journeys"
echo ""
echo "📚 Documentation:"
echo "  - Deployment checklist: docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md"
echo "  - Deployment manifest: deployment-manifest.json"
echo ""
echo "✨ Ready for production launch!"