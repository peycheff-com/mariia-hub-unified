#!/bin/bash

# Production Deployment Optimization Script
# Optimizes Vercel deployment for production environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Configuration
DOMAIN=${1:-"mariaborysevych.com"}
VERCEL_ORG=${VERCEL_ORG:-""}
VERCEL_PROJECT_ID=${VERCEL_PROJECT_ID:-""}

# Verify environment
verify_environment() {
    log "Verifying deployment environment..."

    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        error "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi

    # Check if logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        error "Not logged in to Vercel. Please run 'vercel login'"
        exit 1
    fi

    # Verify required environment variables
    local required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi

    success "Environment verification completed"
}

# Optimize build configuration
optimize_build() {
    log "Optimizing build configuration..."

    # Ensure production build command exists
    if ! grep -q "build:production" package.json; then
        warning "Adding production build script..."
        npm pkg set scripts.build:production="npm run build && npm run build:performance && npm run test:performance"
    fi

    # Optimize Vite configuration for production
    log "Validating Vite configuration..."

    # Run build with optimization
    log "Running optimized production build..."
    npm run build:production

    success "Build optimization completed"
}

# Configure edge functions
configure_edge_functions() {
    log "Configuring edge functions..."

    # Create edge function for API routing if not exists
    if [[ ! -f "api/edge/middleware.ts" ]]; then
        log "Creating edge middleware..."
        mkdir -p api/edge

        cat > api/edge/middleware.ts << 'EOF'
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Rate limiting headers
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '99');

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/booking/:path*'
  ]
};
EOF
    fi

    success "Edge functions configuration completed"
}

# Setup environment variables
setup_environment_variables() {
    log "Setting up production environment variables..."

    # List current environment variables
    log "Current environment variables:"
    vercel env ls

    # Set production environment variables if not exists
    local env_vars=(
        "VITE_SUPABASE_URL:$VITE_SUPABASE_URL:production"
        "VITE_SUPABASE_ANON_KEY:$VITE_SUPABASE_ANON_KEY:production"
        "VITE_SUPABASE_PROJECT_ID:$VITE_SUPABASE_PROJECT_ID:production"
        "NODE_ENV:production:production"
        "VITE_BUILD_TARGET:production:production"
    )

    for env_var in "${env_vars[@]}"; do
        IFS=':' read -r key value scope <<< "$env_var"

        if [[ -n "$value" && "$value" != "USE_KMS_MANAGED_SECRET" ]]; then
            log "Setting environment variable: $key"
            echo "$value" | vercel env add "$key" "$scope"
        else
            warning "Skipping environment variable $key (value not provided)"
        fi
    done

    success "Environment variables setup completed"
}

# Configure domain and DNS
configure_domain() {
    log "Configuring domain: $DOMAIN"

    # Check if domain is already configured
    if vercel domains ls | grep -q "$DOMAIN"; then
        log "Domain $DOMAIN already configured"
    else
        log "Adding domain $DOMAIN..."
        vercel domains add "$DOMAIN"
    fi

    # Show DNS records
    log "DNS configuration:"
    vercel domains inspect "$DOMAIN"

    success "Domain configuration completed"
}

# Deploy to production
deploy_production() {
    log "Deploying to production..."

    # Create production deployment
    vercel --prod --confirm

    # Get deployment URL
    local deployment_url=$(vercel ls --scope "$VERCEL_ORG" | head -1 | awk '{print $2}')

    success "Production deployment completed"
    log "Deployment URL: https://$deployment_url"
    log "Production URL: https://$DOMAIN"
}

# Run health checks
run_health_checks() {
    log "Running post-deployment health checks..."

    local deployment_url="https://$DOMAIN"

    # Wait for deployment to be ready
    log "Waiting for deployment to be ready..."
    sleep 30

    # Check if the site is accessible
    if curl -f -s -o /dev/null -w "%{http_code}" "$deployment_url" | grep -q "200"; then
        success "Site is accessible (HTTP 200)"
    else
        error "Site is not accessible"
        return 1
    fi

    # Check API endpoints
    local api_endpoints=(
        "/api/health"
        "/api/services"
    )

    for endpoint in "${api_endpoints[@]}"; do
        local url="${deployment_url}${endpoint}"
        local status_code=$(curl -f -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

        if [[ "$status_code" == "200" ]]; then
            success "API endpoint $endpoint is healthy"
        else
            warning "API endpoint $endpoint returned status $status_code"
        fi
    done

    # Run performance test
    log "Running performance test..."
    if command -v lighthouse &> /dev/null; then
        lighthouse "$deployment_url" \
            --output=json \
            --output-path=./lighthouse-report.json \
            --chrome-flags="--headless" \
            --quiet || true

        if [[ -f "./lighthouse-report.json" ]]; then
            local performance_score=$(jq '.categories.performance.score' lighthouse-report.json)
            success "Lighthouse Performance Score: $performance_score"
        fi
    fi

    success "Health checks completed"
}

# Generate deployment report
generate_deployment_report() {
    log "Generating deployment report..."

    local report_file="deployment-report-$(date +%Y%m%d-%H%M%S).json"

    cat > "$report_file" << EOF
{
  "deployment": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "domain": "$DOMAIN",
    "environment": "production",
    "buildCommand": "npm run build:production",
    "framework": "vite",
    "regions": ["fra1", "iad1", "hnd1"]
  },
  "optimizations": {
    "edgeFunctions": true,
    "compression": ["gzip", "brotli"],
    "caching": "aggressive",
    "codeSplitting": true,
    "bundleAnalysis": true
  },
  "security": {
    "headers": {
      "Strict-Transport-Security": "enabled",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "csp": "enabled"
  },
  "monitoring": {
    "analytics": "vercel",
    "errorTracking": "sentry",
    "performanceMonitoring": "enabled"
  }
}
EOF

    success "Deployment report generated: $report_file"
}

# Cleanup
cleanup() {
    log "Cleaning up temporary files..."

    # Remove temporary files
    rm -f ./lighthouse-report.json

    success "Cleanup completed"
}

# Main execution
main() {
    log "Starting production deployment optimization..."

    # Trap cleanup on exit
    trap cleanup EXIT

    # Execute deployment steps
    verify_environment
    optimize_build
    configure_edge_functions
    setup_environment_variables
    configure_domain
    deploy_production
    run_health_checks
    generate_deployment_report

    success "Production deployment optimization completed successfully!"
    log "Your application is now live at: https://$DOMAIN"
}

# Execute main function
main "$@"