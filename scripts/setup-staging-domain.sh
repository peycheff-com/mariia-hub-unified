#!/bin/bash

# =================================
# Staging Domain Setup Script
# =================================
# This script configures the staging subdomain and SSL certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="mariia-hub.com"
STAGING_DOMAIN="staging.mariia-hub.com"
STAGING_IP_ADDRESS=${STAGING_IP_ADDRESS:-""}

echo -e "${BLUE}🌐 Setting up Staging Domain${NC}"
echo "================================"

# Function to print status
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v dig; then
    print_warning "dig not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install bind
    else
        sudo apt-get update && sudo apt-get install -y dnsutils
    fi
fi

if ! command -v curl; then
    print_error "curl is required but not installed"
    exit 1
fi

print_success "Prerequisites check passed"

# Step 1: DNS Configuration
print_status "Step 1: Configuring DNS for $STAGING_DOMAIN..."

echo ""
echo -e "${BLUE}DNS Configuration Instructions:${NC}"
echo "========================================"
echo "Please add the following DNS records to your domain provider:"
echo ""
echo "1. A Record (if using Vercel):"
echo "   Type: A"
echo "   Name: staging"
echo "   Value: 76.76.21.21"
echo "   TTL: 300 (or 5 minutes)"
echo ""
echo "2. CNAME Record (alternative for Vercel):"
echo "   Type: CNAME"
echo "   Name: staging"
echo "   Value: cname.vercel-dns.com"
echo "   TTL: 300"
echo ""
echo "3. For other providers, you may need:"
echo "   - A record pointing to your staging server IP"
echo "   - CNAME record pointing to your hosting provider"
echo ""

if [ -n "$STAGING_IP_ADDRESS" ]; then
    echo "4. Custom IP Address Provided:"
    echo "   Type: A"
    echo "   Name: staging"
    echo "   Value: $STAGING_IP_ADDRESS"
    echo ""
fi

# Step 2: Verify DNS propagation
print_status "Step 2: Checking DNS propagation..."

check_dns() {
    local domain=$1
    echo "Checking $domain..."

    # Check with dig
    if dig +short "$domain" | grep -q -E "^[0-9]+\."; then
        print_success "$domain resolves correctly"
        dig +short "$domain"
        return 0
    else
        print_warning "$domain does not resolve yet"
        return 1
    fi
}

# Wait for DNS propagation
echo "Waiting for DNS to propagate..."
for i in {1..10}; do
    if check_dns "$STAGING_DOMAIN"; then
        break
    fi
    if [ $i -lt 10 ]; then
        echo "Waiting 30 seconds... (attempt $i/10)"
        sleep 30
    fi
done

# Step 3: SSL Configuration
print_status "Step 3: Setting up SSL certificate..."

echo ""
echo -e "${BLUE}SSL Certificate Setup:${NC}"
echo "==========================="
echo ""
echo "Option 1: Vercel Automatic SSL (Recommended)"
echo "------------------------------------------"
echo "If using Vercel, SSL is automatically configured:"
echo "1. Ensure $STAGING_DOMAIN is added to your Vercel project"
echo "2. Vercel will automatically provision and renew SSL certificates"
echo "3. Certificate is issued via Let's Encrypt"
echo ""
echo "Option 2: Manual Certificate Setup"
echo "--------------------------------"
echo "If not using Vercel:"
echo "1. Install Certbot:"
echo "   sudo apt-get install certbot python3-certbot-nginx"
echo ""
echo "2. Request certificate:"
echo "   sudo certbot --nginx -d $STAGING_DOMAIN"
echo ""
echo "3. Set up auto-renewal:"
echo "   sudo crontab -e"
echo "   Add: 0 12 * * * /usr/bin/certbot renew --quiet"
echo ""

# Step 4: Vercel Configuration
print_status "Step 4: Configuring Vercel project..."

echo ""
echo -e "${BLUE}Vercel Configuration:${NC}"
echo "========================="
echo ""
echo "1. Add staging domain to Vercel project:"
echo "   - Go to your Vercel dashboard"
echo "   - Select the mariia-hub project"
echo "   - Go to Settings > Domains"
echo "   - Add: $STAGING_DOMAIN"
echo ""
echo "2. Configure environment variables:"
echo "   - Go to Settings > Environment Variables"
echo "   - Add staging-specific variables"
echo ""

# Generate Vercel configuration snippet
cat > vercel.staging.json << EOF
{
  "version": 2,
  "alias": ["$STAGING_DOMAIN"],
  "env": {
    "VITE_APP_ENV": "staging",
    "VITE_APP_URL": "https://$STAGING_DOMAIN",
    "VITE_CUSTOM_DOMAIN": "https://$STAGING_DOMAIN"
  },
  "regions": ["fra1"],
  "framework": "vite"
}
EOF

print_success "Generated vercel.staging.json"

# Step 5: Health Check Configuration
print_status "Step 5: Setting up health checks..."

echo ""
echo -e "${BLUE}Health Check Endpoints:${NC}"
echo "============================"
echo ""
echo "Add these health check endpoints to your monitoring:"
echo ""
echo "1. Application Health:"
echo "   https://$STAGING_DOMAIN/health"
echo ""
echo "2. API Health:"
echo "   https://$STAGING_DOMAIN/api/health"
echo ""
echo "3. Database Health:"
echo "   https://$STAGING_DOMAIN/api/health/db"
echo ""

# Create health check endpoint script
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

# Staging Health Check Script
DOMAIN=${1:-"staging.mariia-hub.com"}

echo "🏥 Checking staging health..."
echo "Domain: $DOMAIN"
echo ""

# Check main site
if curl -f -s "https://$DOMAIN" > /dev/null; then
    echo "✅ Main site: OK"
else
    echo "❌ Main site: FAILED"
    exit 1
fi

# Check health endpoint
if curl -f -s "https://$DOMAIN/health" > /dev/null; then
    echo "✅ Health endpoint: OK"
else
    echo "⚠️  Health endpoint: Not found or failed"
fi

# Check API health
if curl -f -s "https://$DOMAIN/api/health" > /dev/null; then
    echo "✅ API health: OK"
else
    echo "⚠️  API health: Not found or failed"
fi

# Check SSL certificate
if echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates | grep -q "notAfter"; then
    EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
    echo "✅ SSL Certificate: Valid until $EXPIRY"
else
    echo "❌ SSL Certificate: Invalid or not found"
fi

echo ""
echo "✅ Health check completed!"
EOF

chmod +x scripts/health-check.sh
print_success "Created health check script"

# Step 6: Security Configuration
print_status "Step 6: Security configuration..."

echo ""
echo -e "${BLUE}Security Headers${NC}"
echo "=================="
echo ""
echo "Add these security headers to your staging domain:"
echo ""
echo "1. Content Security Policy (CSP):"
echo "   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:"
echo ""
echo "2. X-Frame-Options:"
echo "   X-Frame-Options: SAMEORIGIN"
echo ""
echo "3. X-Content-Type-Options:"
echo "   X-Content-Type-Options: nosniff"
echo ""
echo "4. Referrer Policy:"
echo "   Referrer-Policy: strict-origin-when-cross-origin"
echo ""

# Step 7: Monitoring Setup
print_status "Step 7: Setting up monitoring..."

echo ""
echo -e "${BLUE}Monitoring Configuration${NC}"
echo "=========================="
echo ""
echo "1. Uptime Monitoring:"
echo "   - Set up monitoring for https://$STAGING_DOMAIN/health"
echo "   - Alert on downtime > 5 minutes"
echo "   - Check every 1 minute"
echo ""
echo "2. Performance Monitoring:"
echo "   - Configure Lighthouse CI"
echo "   - Set up Web Vitals monitoring"
echo "   - Alert on performance degradation"
echo ""
echo "3. SSL Monitoring:"
echo "   - Monitor certificate expiry"
echo "   - Alert 30 days before expiry"
echo ""

# Step 8: Access Control
print_status "Step 8: Configuring access control..."

echo ""
echo -e "${BLUE}Access Control${NC}"
echo "==============="
echo ""
echo "1. IP Whitelisting (optional):"
echo "   - Restrict access to team IPs"
echo "   - Add VPN access for remote team"
echo ""
echo "2. Basic Authentication (optional):"
echo "   - Add HTTP basic auth for additional security"
echo "   - Use environment variables for credentials"
echo ""
echo "3. Environment-specific branding:"
echo "   - Add staging banner/watermark"
echo "   - Use staging-specific favicon"
echo ""

# Create staging banner component
cat > public/staging-banner.css << 'EOF'
/* Staging Environment Banner */
.staging-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, #ff6b6b, #ffd93d);
  color: #333;
  text-align: center;
  padding: 8px;
  font-weight: bold;
  z-index: 9999;
  font-family: system-ui, -apple-system, sans-serif;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.staging-banner a {
  color: #333;
  text-decoration: underline;
}

body {
  padding-top: 48px;
}

@media (max-width: 768px) {
  .staging-banner {
    font-size: 14px;
    padding: 6px;
  }
  body {
    padding-top: 40px;
  }
}
EOF

print_success "Created staging banner CSS"

# Summary
print_success "Staging domain setup completed!"
echo ""
echo -e "${GREEN}📋 Next Steps:${NC}"
echo "=================="
echo ""
echo "1. Update your DNS records with the values shown above"
echo "2. Add the domain to your Vercel project"
echo "3. Configure environment variables in Vercel"
echo "4. Set up monitoring and alerts"
echo "5. Test the staging environment:"
echo "   ./scripts/health-check.sh $STAGING_DOMAIN"
echo ""
echo -e "${GREEN}🔗 Useful Commands:${NC}"
echo "======================"
echo ""
echo "# Check DNS propagation:"
echo "dig $STAGING_DOMAIN"
echo ""
echo "# Check SSL certificate:"
echo "openssl s_client -servername $STAGING_DOMAIN -connect $STAGING_DOMAIN:443"
echo ""
echo "# Run health check:"
echo "./scripts/health-check.sh $STAGING_DOMAIN"
echo ""
echo "# Test SSL security:"
echo "curl -I https://$STAGING_DOMAIN"
echo ""

print_success "Setup complete! 🎉"