#!/bin/bash

# SSL/TLS Security Configuration Script
# Configures enterprise-grade SSL/TLS security for production

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${DOMAIN:-"mariaborysevych.com"}
CDN_DOMAIN=${CDN_DOMAIN:-"cdn.mariaborysevych.com"}
API_DOMAIN=${API_DOMAIN:-"api.mariaborysevych.com"}
EMAIL=${EMAIL:-"admin@mariaborysevych.com"}

# Logging functions
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

# Generate SSL certificate configuration
generate_ssl_config() {
    log "Generating SSL/TLS configuration for $DOMAIN..."

    mkdir -p config/ssl

    cat > config/ssl/nginx-ssl.conf << EOF
# SSL/TLS Configuration for Nginx (Reference for Vercel)
# These settings are implemented via Vercel's edge network

# Modern SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;

# Strong cipher suites
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

# Disable weak ciphers
ssl_ciphers "!aNULL:!MD5:!DSS:!3DES";
ssl_ecdh_curve secp384r1;

# SSL session settings
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;

# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Other security headers
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(self)" always;

# Certificate configuration
ssl_certificate /etc/ssl/certs/$DOMAIN.crt;
ssl_certificate_key /etc/ssl/private/$DOMAIN.key;
ssl_trusted_certificate /etc/ssl/certs/$DOMAIN.chain.crt;
EOF

    success "SSL configuration generated"
}

# Create comprehensive Content Security Policy
create_csp_configuration() {
    log "Creating Content Security Policy configuration..."

    mkdir -p config/security

    cat > config/security/csp.json << EOF
{
  "content_security_policies": {
    "default": {
      "default-src": ["'self'"],
      "base-uri": ["'self'"],
      "frame-ancestors": ["'none'"],
      "form-action": ["'self'", "https://js.stripe.com"],
      "script-src": [
        "'self'",
        "'unsafe-inline'",
        "'sha256-Fz5Kmm3O62MYX5rZJBjiwvEn8/xdrvXGwj9g7W4N3mY='",
        "'sha256-31fQF/g9KGmEnutu6M7cTHdK4cN5J5z5NRerO5mFMfQ='",
        "'sha256-v/A0YLD5IwKQNhMmvqqZhFG/VgGpkYk5HwQGk8lYFqQ='",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://js.stripe.com",
        "https://cdn.jsdelivr.net"
      ],
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      "img-src": [
        "'self'",
        "data:",
        "blob:",
        "https://cdn.mariaborysevych.com",
        "https://*.supabase.co",
        "https://*.stripe.com",
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com"
      ],
      "font-src": [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      "connect-src": [
        "'self'",
        "https://api.mariaborysevych.com",
        "https://fxpwracjakqpqpoivypm.supabase.co",
        "https://fxpwracjakqpqpoivypm.supabase.in",
        "https://api.stripe.com",
        "https://www.google-analytics.com",
        "https://region1.google-analytics.com",
        "https://www.googletagmanager.com"
      ],
      "frame-src": ["'self'", "https://js.stripe.com"],
      "object-src": ["'none'"],
      "worker-src": ["'self'", "blob:"],
      "manifest-src": ["'self'"],
      "upgrade-insecure-requests": [],
      "block-all-mixed-content": [],
      "require-trusted-types-for": ["'script'"],
      "report-to": ["csp-endpoint"],
      "report-uri": ["https://csp-report.mariaborysevych.com/report"]
    },
    "development": {
      "default-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "connect-src": ["'self'", "ws:", "wss:", "https://localhost:*", "http://localhost:*"]
    }
  },
  "nonce_generator": {
    "length": 16,
    "characters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  },
  "reporting": {
    "endpoint": "https://csp-report.mariaborysevych.com/report",
    "max_reports": 100,
    "retention_days": 30
  }
}
EOF

    success "CSP configuration created"
}

# Create security headers configuration
create_security_headers() {
    log "Creating security headers configuration..."

    cat > config/security/headers.json << EOF
{
  "security_headers": {
    "strict_transport_security": {
      "max_age": 31536000,
      "include_subdomains": true,
      "preload": true
    },
    "x_frame_options": "DENY",
    "x_content_type_options": "nosniff",
    "x_xss_protection": "1; mode=block",
    "referrer_policy": "strict-origin-when-cross-origin",
    "permissions_policy": {
      "geolocation": [],
      "microphone": [],
      "camera": [],
      "payment": ["self"],
      "usb": [],
      "magnetometer": [],
      "gyroscope": [],
      "accelerometer": [],
      "ambient_light_sensor": [],
      "autoplay": ["self"],
      "encrypted_media": ["self"],
      "fullscreen": ["self"],
      "picture_in_picture": ["self"],
      "speaker": ["self"],
      "sync_xhr": ["self"],
      "unload": ["self"]
    },
    "cross_origin_opener_policy": "same-origin",
    "cross_origin_resource_policy": "same-origin",
    "cross_origin_embedder_policy": "require-corp",
    "content_security_policy": {
      "enabled": true,
      "report_only": false,
      "report_endpoint": "https://csp-report.mariaborysevych.com/report"
    },
    "dns_prefetch_control": "on",
    "expect_ct": {
      "max_age": 86400,
      "enforce": true
    },
    "feature_policy": {
      "vibrate": ["none"],
      "geolocation": ["none"],
      "midi": ["none"],
      "push": ["none"],
      "sync_xhr": ["self"],
      "microphone": ["none"],
      "camera": ["none"],
      "magnetometer": ["none"],
      "gyroscope": ["none"],
      "speaker": ["none"],
      "vr": ["none"],
      "ambient_light_sensor": ["none"],
      "accelerometer": ["none"]
    }
  },
  "api_specific_headers": {
    "/api/*": {
      "access_control_allow_origin": "https://mariaborysevych.com",
      "access_control_allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      "access_control_allow_headers": ["Content-Type", "Authorization", "X-Client-Info", "X-Request-ID"],
      "access_control_max_age": 86400,
      "access_control_allow_credentials": true
    }
  }
}
EOF

    success "Security headers configuration created"
}

# Create TLS monitoring script
create_tls_monitoring() {
    log "Creating TLS monitoring script..."

    mkdir -p scripts/monitoring

    cat > scripts/monitoring/tls-monitor.js << 'EOF'
// TLS/SSL Monitoring Script
const https = require('https');
const { performance } = require('perf_hooks');

async function checkTLSConfiguration(hostname, port = 443) {
  const startTime = performance.now();

  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      method: 'GET',
      path: '/',
      headers: {
        'User-Agent': 'TLS-Monitor/1.0'
      },
      // Enable detailed TLS information
      servername: hostname,
      rejectUnauthorized: false, // We'll handle certificate validation manually
      checkServerIdentity: () => undefined // Skip hostname verification for monitoring
    };

    const req = https.request(options, (res) => {
      const endTime = performance.now();
      const connectionTime = endTime - startTime;

      // Get TLS connection information
      const socket = res.socket;
      const tlsInfo = socket.getPeerCertificate ? socket.getPeerCertificate() : {};
      const cipher = socket.getCipher ? socket.getCipher() : {};

      const result = {
        hostname,
        port,
        connectionTime: Math.round(connectionTime),
        statusCode: res.statusCode,
        tlsVersion: socket.getProtocol ? socket.getProtocol() : 'Unknown',
        cipher: {
          name: cipher.name || 'Unknown',
          version: cipher.version || 'Unknown'
        },
        certificate: {
          subject: tlsInfo.subject || {},
          issuer: tlsInfo.issuer || {},
          validFrom: tlsInfo.valid_from || 'Unknown',
          validTo: tlsInfo.valid_to || 'Unknown',
          fingerprint: tlsInfo.fingerprint || 'Unknown',
          serialNumber: tlsInfo.serialNumber || 'Unknown'
        },
        headers: res.headers
      };

      // Check security headers
      const securityHeaders = [
        'strict-transport-security',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'referrer-policy',
        'content-security-policy',
        'permissions-policy'
      ];

      result.securityHeaders = {};
      securityHeaders.forEach(header => {
        result.securityHeaders[header] = res.headers[header] || false;
      });

      resolve(result);
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function checkCertificateExpiry(hostname) {
  const { execSync } = require('child_process');

  try {
    const output = execSync(`echo | openssl s_client -servername ${hostname} -connect ${hostname}:443 2>/dev/null | openssl x509 -noout -dates`, { encoding: 'utf8' });

    const notBefore = output.match(/notBefore=(.+)/)?.[1]?.trim();
    const notAfter = output.match(/notAfter=(.+)/)?.[1]?.trim();

    if (notBefore && notAfter) {
      const expiryDate = new Date(notAfter);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      return {
        hostname,
        notBefore,
        notAfter,
        expiryDate: expiryDate.toISOString(),
        daysUntilExpiry,
        isExpiringSoon: daysUntilExpiry <= 30,
        isExpired: daysUntilExpiry <= 0
      };
    }
  } catch (error) {
    return {
      hostname,
      error: error.message
    };
  }
}

async function generateTLSReport(hostnames) {
  console.log('Generating TLS Security Report...');
  console.log('================================');

  const results = [];

  for (const hostname of hostnames) {
    try {
      console.log(`\nChecking ${hostname}...`);

      const tlsInfo = await checkTLSConfiguration(hostname);
      const certInfo = await checkCertificateExpiry(hostname);

      results.push({
        ...tlsInfo,
        ...certInfo
      });

      console.log(`✅ ${hostname} - TLS Version: ${tlsInfo.tlsVersion}`);
      console.log(`   Cipher: ${tlsInfo.cipher.name} ${tlsInfo.cipher.version}`);
      console.log(`   Connection Time: ${tlsInfo.connectionTime}ms`);

      if (certInfo.daysUntilExpiry !== undefined) {
        if (certInfo.isExpired) {
          console.log(`   ❌ Certificate EXPIRED!`);
        } else if (certInfo.isExpiringSoon) {
          console.log(`   ⚠️ Certificate expires in ${certInfo.daysUntilExpiry} days`);
        } else {
          console.log(`   ✅ Certificate valid for ${certInfo.daysUntilExpiry} days`);
        }
      }

      // Check security headers
      const missingHeaders = Object.entries(tlsInfo.securityHeaders)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingHeaders.length > 0) {
        console.log(`   ⚠️ Missing security headers: ${missingHeaders.join(', ')}`);
      } else {
        console.log(`   ✅ All security headers present`);
      }

    } catch (error) {
      console.log(`❌ ${hostname} - Error: ${error.message}`);
      results.push({
        hostname,
        error: error.message
      });
    }
  }

  // Generate summary
  console.log('\n\nTLS Security Summary');
  console.log('====================');

  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  const expiringSoon = results.filter(r => r.isExpiringSoon);
  const expired = results.filter(r => r.isExpired);

  console.log(`Total hosts checked: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⚠️ Certificates expiring soon: ${expiringSoon.length}`);
  console.log(`🚨 Certificates expired: ${expired.length}`);

  // Average connection time
  const avgConnectionTime = successful
    .filter(r => r.connectionTime)
    .reduce((sum, r) => sum + r.connectionTime, 0) / successful.length;

  console.log(`📊 Average connection time: ${Math.round(avgConnectionTime)}ms`);

  return results;
}

// Export functions
module.exports = {
  checkTLSConfiguration,
  checkCertificateExpiry,
  generateTLSReport
};

// Run monitoring if called directly
if (require.main === module) {
  const hostnames = [
    'mariaborysevych.com',
    'cdn.mariaborysevych.com',
    'api.mariaborysevych.com'
  ];

  generateTLSReport(hostnames)
    .then(results => {
      // Save results to file
      const fs = require('fs');
      const reportFile = `tls-report-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
      console.log(`\n📄 Report saved to: ${reportFile}`);
    })
    .catch(error => {
      console.error('Error generating TLS report:', error);
      process.exit(1);
    });
}
EOF

    success "TLS monitoring script created"
}

# Create certificate management script
create_certificate_management() {
    log "Creating certificate management script..."

    cat > scripts/manage-certificates.sh << 'EOF'
#!/bin/bash

# SSL Certificate Management Script
# Handles certificate monitoring, renewal, and deployment

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN=${1:-"mariaborysevych.com"}
EMAIL=${2:-"admin@mariaborysevych.com"}
CERT_DIR=${CERT_DIR:-"./certificates"}

# Logging
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

# Check certificate expiry
check_certificate_expiry() {
    local hostname="$1"
    local port="${2:-443}"

    log "Checking certificate expiry for $hostname:$port"

    local expiry_info
    expiry_info=$(echo | openssl s_client -servername "$hostname" -connect "$hostname:$port" 2>/dev/null | openssl x509 -noout -dates)

    if [[ -z "$expiry_info" ]]; then
        error "Failed to get certificate information for $hostname"
        return 1
    fi

    local not_before not_after days_until_expiry
    not_before=$(echo "$expiry_info" | grep "notBefore=" | cut -d= -f2)
    not_after=$(echo "$expiry_info" | grep "notAfter=" | cut -d= -f2)

    # Convert dates to comparable format
    local expiry_date not_before_date
    expiry_date=$(date -d "$not_after" +%s)
    not_before_date=$(date -d "$not_before" +%s)
    local current_date=$(date +%s)

    days_until_expiry=$(( (expiry_date - current_date) / 86400 ))

    echo "Certificate for $hostname:"
    echo "  Valid from: $not_before"
    echo "  Valid until: $not_after"
    echo "  Days until expiry: $days_until_expiry"

    if [[ $days_until_expiry -le 0 ]]; then
        error "Certificate has EXPIRED!"
        return 2
    elif [[ $days_until_expiry -le 7 ]]; then
        warning "Certificate expires in $days_until_expiry days (CRITICAL)"
        return 1
    elif [[ $days_until_expiry -le 30 ]]; then
        warning "Certificate expires in $days_until_expiry days (WARNING)"
        return 0
    else
        success "Certificate is valid for $days_until_expiry days"
        return 0
    fi
}

# Generate self-signed certificate for development
generate_self_signed_cert() {
    local hostname="$1"
    local cert_dir="$CERT_DIR/$hostname"

    log "Generating self-signed certificate for $hostname"

    mkdir -p "$cert_dir"

    # Generate private key
    openssl genrsa -out "$cert_dir/private.key" 2048

    # Generate CSR
    openssl req -new -key "$cert_dir/private.key" -out "$cert_dir/cert.csr" -subj "/C=PL/ST=Warsaw/L=Warsaw/O=Mariia Hub/OU=IT/CN=$hostname"

    # Generate self-signed certificate
    openssl x509 -req -in "$cert_dir/cert.csr" -signkey "$cert_dir/private.key" -out "$cert_dir/certificate.crt" -days 365 -extensions v3_req -config <(
        cat /etc/ssl/openssl.cnf
        echo "[v3_req]"
        echo "subjectAltName=@alt_names"
        echo "[alt_names]"
        echo "DNS.1=$hostname"
        echo "DNS.2=*.$hostname"
    )

    # Generate full chain
    cp "$cert_dir/certificate.crt" "$cert_dir/fullchain.crt"

    # Set permissions
    chmod 600 "$cert_dir/private.key"
    chmod 644 "$cert_dir/certificate.crt" "$cert_dir/fullchain.crt"

    success "Self-signed certificate generated for $hostname"
    echo "Files created in: $cert_dir"
}

# Test SSL/TLS configuration
test_ssl_configuration() {
    local hostname="$1"
    local port="${2:-443}"

    log "Testing SSL/TLS configuration for $hostname:$port"

    # Test with OpenSSL
    echo "Testing with OpenSSL..."
    openssl s_client -connect "$hostname:$port" -servername "$hostname" -showcerts < /dev/null

    # Test TLS versions
    echo -e "\nTesting TLS versions..."

    for version in tls1 tls1_1 tls1_2 tls1_3; do
        if openssl s_client -connect "$hostname:$port" -servername "$hostname" -$version < /dev/null 2>&1 | grep -q "Verify return code: 0"; then
            success "✅ TLS $version supported"
        else
            error "❌ TLS $version not supported"
        fi
    done

    # Test cipher suites
    echo -e "\nTesting cipher suites..."
    local strong_ciphers=(
        "ECDHE-ECDSA-AES128-GCM-SHA256"
        "ECDHE-RSA-AES128-GCM-SHA256"
        "ECDHE-ECDSA-AES256-GCM-SHA384"
        "ECDHE-RSA-AES256-GCM-SHA384"
        "ECDHE-ECDSA-CHACHA20-POLY1305"
        "ECDHE-RSA-CHACHA20-POLY1305"
    )

    for cipher in "${strong_ciphers[@]}"; do
        if openssl s_client -connect "$hostname:$port" -servername "$hostname" -cipher "$cipher" < /dev/null 2>&1 | grep -q "Verify return code: 0"; then
            success "✅ Cipher $cipher supported"
        else
            warning "⚠️ Cipher $cipher not supported"
        fi
    done
}

# Generate certificate monitoring configuration
generate_monitoring_config() {
    log "Generating certificate monitoring configuration..."

    cat > config/ssl/certificate-monitoring.json << EOF
{
  "certificate_monitoring": {
    "monitored_domains": [
      {
        "hostname": "$DOMAIN",
        "port": 443,
        "warning_days": 30,
        "critical_days": 7
      },
      {
        "hostname": "www.$DOMAIN",
        "port": 443,
        "warning_days": 30,
        "critical_days": 7
      },
      {
        "hostname": "api.$DOMAIN",
        "port": 443,
        "warning_days": 30,
        "critical_days": 7
      }
    ],
    "notifications": {
      "email": {
        "enabled": true,
        "recipients": ["admin@$DOMAIN", "security@$DOMAIN"],
        "smtp_server": "smtp.$DOMAIN",
        "smtp_port": 587
      },
      "slack": {
        "enabled": true,
        "webhook_url": "\$SLACK_WEBHOOK_URL"
      }
    },
    "checks": {
      "frequency_hours": 6,
      "timeout_seconds": 10,
      "retry_attempts": 3
    }
  }
}
EOF

    success "Certificate monitoring configuration generated"
}

# Show usage
show_usage() {
    cat << EOF
SSL Certificate Management Script

Usage: $0 [DOMAIN] [EMAIL] [COMMAND]

Commands:
  check [hostname]         Check certificate expiry
  generate [hostname]       Generate self-signed certificate (development only)
  test [hostname]          Test SSL/TLS configuration
  monitor                  Generate monitoring configuration
  help                     Show this help message

Examples:
  $0 mariaborysevych.com admin@mariaborysevych.com check
  $0 mariaborysevych.com admin@mariaborysevych.com generate
  $0 mariaborysevych.com admin@mariaborysevych.com test
  $0 mariaborysevych.com admin@mariaborysevych.com monitor

Note: For production, use Let's Encrypt or your CA for certificates.
This script is primarily for testing and development environments.

EOF
}

# Main execution
main() {
    local command="${3:-check}"

    case "$command" in
        "check")
            check_certificate_expiry "$DOMAIN"
            ;;
        "generate")
            generate_self_signed_cert "$DOMAIN"
            ;;
        "test")
            test_ssl_configuration "$DOMAIN"
            ;;
        "monitor")
            generate_monitoring_config
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"
EOF

    chmod +x scripts/manage-certificates.sh

    success "Certificate management script created"
}

# Create HSTS preload configuration
create_hsts_preload() {
    log "Creating HSTS preload configuration..."

    cat > config/security/hsts-preload.json << EOF
{
  "hsts_configuration": {
    "enabled": true,
    "max_age": 31536000,
    "include_subdomains": true,
    "preload": true,
    "preload_submitted": false,
    "domain": "$DOMAIN",
    "requirements": {
      "valid_certificate": true,
      "redirect_http_to_https": true,
      "hsts_header": "max-age=31536000; includeSubDomains; preload",
      "subdomains_support": true
    },
    "submission": {
      "url": "https://hstspreload.org/",
      "status": "pending",
      "submission_date": null,
      "approval_date": null
    }
  },
  "verification_steps": [
    "Ensure valid SSL certificate is installed",
    "Configure HTTP to HTTPS redirects",
    "Implement HSTS header with max-age=31536000",
    "Add includeSubDomains directive",
    "Add preload directive",
    "Test configuration with hstspreload.org",
    "Submit domain for preload consideration"
  ]
}
EOF

    success "HSTS preload configuration created"
}

# Main execution
main() {
    local command="${1:-configure}"

    case "$command" in
        "configure")
            log "Starting SSL/TLS security configuration..."
            generate_ssl_config
            create_csp_configuration
            create_security_headers
            create_tls_monitoring
            create_certificate_management
            create_hsts_preload
            success "SSL/TLS security configuration completed!"
            ;;
        "test")
            log "Testing SSL/TLS configuration..."
            node scripts/monitoring/tls-monitor.js
            ;;
        "monitor")
            log "Starting certificate monitoring..."
            node scripts/monitoring/tls-monitor.js
            ;;
        "help"|"--help"|"-h")
            echo "SSL/TLS Security Configuration Script"
            echo ""
            echo "Usage: $0 [COMMAND]"
            echo ""
            echo "Commands:"
            echo "  configure    Run full SSL/TLS configuration (default)"
            echo "  test         Test SSL/TLS configuration"
            echo "  monitor      Monitor certificates"
            echo "  help         Show this help message"
            ;;
        *)
            error "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"