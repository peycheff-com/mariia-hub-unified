#!/bin/bash

# Domain and DNS Optimization Script
# Configures optimal DNS settings for production deployment

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
ADMIN_DOMAIN=${ADMIN_DOMAIN:-"admin.mariaborysevych.com"}
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

# Create DNS zone configuration
create_dns_zone_config() {
    log "Creating DNS zone configuration for $DOMAIN..."

    mkdir -p config/dns

    cat > config/dns/zone-config.json << EOF
{
  "dns_zone": {
    "domain": "$DOMAIN",
    "ttl": 300,
    "records": {
      "apex": {
        "type": "A",
        "name": "@",
        "values": [
          "76.76.19.19",
          "76.76.21.21"
        ],
        "ttl": 300,
        "description": "Vercel Anycast IPs - Global CDN"
      },
      "ipv6": {
        "type": "AAAA",
        "name": "@",
        "values": [
          "2600:1f18:24c5:ca00::1",
          "2600:1f18:24c5:ca01::1"
        ],
        "ttl": 300,
        "description": "Vercel IPv6 Anycast"
      },
      "www": {
        "type": "CNAME",
        "name": "www",
        "value": "cname.vercel-dns.com",
        "ttl": 300,
        "description": "WWW subdomain pointing to Vercel"
      },
      "cdn": {
        "type": "CNAME",
        "name": "cdn",
        "value": "cname.vercel-dns.com",
        "ttl": 300,
        "description": "CDN subdomain for static assets"
      },
      "api": {
        "type": "CNAME",
        "name": "api",
        "value": "cname.vercel-dns.com",
        "ttl": 300,
        "description": "API subdomain for edge functions"
      },
      "admin": {
        "type": "CNAME",
        "name": "admin",
        "value": "cname.vercel-dns.com",
        "ttl": 300,
        "description": "Admin subdomain for dashboard"
      },
      "blog": {
        "type": "CNAME",
        "name": "blog",
        "value": "cname.vercel-dns.com",
        "ttl": 300,
        "description": "Blog subdomain"
      },
      "mx": {
        "type": "MX",
        "name": "@",
        "values": [
          {
            "preference": 10,
            "exchange": "aspmx.l.google.com"
          },
          {
            "preference": 20,
            "exchange": "alt1.aspmx.l.google.com"
          },
          {
            "preference": 30,
            "exchange": "alt2.aspmx.l.google.com"
          },
          {
            "preference": 40,
            "exchange": "alt3.aspmx.l.google.com"
          },
          {
            "preference": 50,
            "exchange": "alt4.aspmx.l.google.com"
          }
        ],
        "ttl": 3600,
        "description": "Google Workspace MX records"
      },
      "txt_spf": {
        "type": "TXT",
        "name": "@",
        "value": "\"v=spf1 include:_spf.google.com include:_spf.vercel.me ~all\"",
        "ttl": 3600,
        "description": "SPF record for email validation"
      },
      "txt_dmarc": {
        "type": "TXT",
        "name": "_dmarc",
        "value": "\"v=DMARC1; p=quarantine; rua=mailto:dmarc@$DOMAIN; ruf=mailto:dmarc@$DOMAIN; fo=1; adkim=r; aspf=r\"",
        "ttl": 3600,
        "description": "DMARC record for email authentication"
      },
      "txt_dkim": {
        "type": "TXT",
        "name": "google._domainkey",
        "value": "\"v=DKIM1; k=rsa; p=REPLACE_WITH_DIM_KEY\"",
        "ttl": 3600,
        "description": "DKIM record for Gmail (replace with actual key)"
      },
      "txt_verification": {
        "type": "TXT",
        "name": "vercel-domain-verification",
        "value": "\"REPLACE_WITH_VERCEL_VERIFICATION_CODE\"",
        "ttl": 3600,
        "description": "Vercel domain verification"
      },
      "caa": {
        "type": "CAA",
        "name": "@",
        "values": [
          {
            "flags": 0,
            "tag": "issue",
            "value": "letsencrypt.org"
          },
          {
            "flags": 0,
            "tag": "issuewild",
            "value": "letsencrypt.org"
          },
          {
            "flags": 0,
            "tag": "iodef",
            "value": "mailto:admin@$DOMAIN"
          }
        ],
        "ttl": 86400,
        "description": "CAA records for certificate authorities"
      },
      "srv_autodiscover": {
        "type": "SRV",
        "name": "_autodiscover._tcp",
        "values": [
          {
            "priority": 10,
            "weight": 5,
            "port": 443,
            "target": "autodiscover.$DOMAIN"
          }
        ],
        "ttl": 3600,
        "description": "Autodiscover for email clients"
      },
      "txt_spf_dmarc_reporting": {
        "type": "TXT",
        "name": "_report._dmarc",
        "value": "\"v=DMARC1; rua=mailto:dmarc@$DOMAIN; ruf=mailto:dmarc@$DOMAIN\"",
        "ttl": 3600,
        "description": "DMARC reporting subdomain"
      }
    }
  }
}
EOF

    success "DNS zone configuration created"
}

# Create DNS performance optimization
create_dns_performance_config() {
    log "Creating DNS performance optimization configuration..."

    cat > config/dns/performance-optimization.json << EOF
{
  "dns_performance": {
    "optimization_goals": [
      "reduce_dns_lookup_time",
      "improve_cache_hit_ratio",
      "enable_geo_dns_routing",
      "implement_dnssec",
      "optimize_ttl_values"
    ],
    "configuration": {
      "ttl_strategy": {
        "static_assets": {
          "domains": ["cdn.$DOMAIN", "assets.$DOMAIN"],
          "ttl": 31536000,
          "reasoning": "Static assets rarely change - maximum caching"
        },
        "api_endpoints": {
          "domains": ["api.$DOMAIN"],
          "ttl": 300,
          "reasoning": "API endpoints may change - moderate caching"
        },
        "main_site": {
          "domains": ["$DOMAIN", "www.$DOMAIN"],
          "ttl": 300,
          "reasoning": "Main site may be updated frequently - low caching"
        },
        "verification_records": {
          "domains": ["_dmarc.$DOMAIN", "google._domainkey.$DOMAIN"],
          "ttl": 3600,
          "reasoning": "Authentication records - longer caching"
        }
      },
      "dnssec": {
        "enabled": true,
        "algorithm": "RSASHA256",
        "key_size": 2048,
        "signature_validity": 30,
        "description": "DNSSEC for DNS integrity verification"
      },
      "geo_dns": {
        "enabled": true,
        "provider": "Vercel Edge Network",
        "regions": [
          {
            "region": "us-east",
            "ips": ["76.76.19.19"],
            "countries": ["US", "CA"]
          },
          {
            "region": "eu-central",
            "ips": ["76.76.21.21"],
            "countries": ["PL", "DE", "FR", "GB", "IT", "ES"]
          },
          {
            "region": "asia-pacific",
            "ips": ["76.76.23.23"],
            "countries": ["JP", "SG", "AU", "IN"]
          }
        ]
      },
      "dns_caching": {
        "browser_cache": "enabled",
        "recursive_resolver_cache": "enabled",
        "authoritative_cache": "enabled",
        "cdn_cache": "enabled"
      }
    },
    "monitoring": {
      "dns_lookup_time": {
        "target": "< 50ms",
        "warning_threshold": "100ms",
        "critical_threshold": "200ms"
      },
      "cache_hit_ratio": {
        "target": "> 95%",
        "warning_threshold": "< 90%",
        "critical_threshold": "< 80%"
      },
      "dns_propagation_time": {
        "target": "< 5 minutes",
        "warning_threshold": "< 15 minutes",
        "critical_threshold": "< 30 minutes"
      }
    }
  }
}
EOF

    success "DNS performance optimization configuration created"
}

# Create DNS monitoring script
create_dns_monitoring() {
    log "Creating DNS monitoring script..."

    mkdir -p scripts/monitoring

    cat > scripts/monitoring/dns-monitor.js << 'EOF'
// DNS Monitoring Script
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

async function dnsLookup(hostname, dnsServer = '8.8.8.8') {
  const startTime = performance.now();

  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const dig = spawn('dig', [
      `@${dnsServer}`,
      hostname,
      '+noall',
      '+answer',
      '+stats'
    ]);

    let output = '';
    let error = '';

    dig.stdout.on('data', (data) => {
      output += data.toString();
    });

    dig.stderr.on('data', (data) => {
      error += data.toString();
    });

    dig.on('close', (code) => {
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      if (code === 0) {
        resolve({
          hostname,
          dnsServer,
          queryTime: Math.round(queryTime),
          output,
          success: true
        });
      } else {
        reject(new Error(`DNS lookup failed: ${error}`));
      }
    });

    dig.on('error', (err) => {
      reject(err);
    });
  });
}

async function checkDNSPropagation(hostname, expectedRecords) {
  const dnsServers = [
    '8.8.8.8',      // Google
    '1.1.1.1',      // Cloudflare
    '208.67.222.222', // OpenDNS
    '9.9.9.9'       // Quad9
  ];

  const results = [];

  for (const dnsServer of dnsServers) {
    try {
      const result = await dnsLookup(hostname, dnsServer);
      results.push(result);

      console.log(`\n${hostname} via ${dnsServer}:`);
      console.log(`  Query time: ${result.queryTime}ms`);
      console.log(`  Records found: ${result.output.split('\n').filter(line => line.trim()).length}`);

      // Check if expected records are present
      let foundRecords = 0;
      for (const expectedRecord of expectedRecords) {
        if (result.output.includes(expectedRecord)) {
          foundRecords++;
        }
      }

      if (foundRecords === expectedRecords.length) {
        console.log(`  ✅ All expected records found`);
      } else {
        console.log(`  ⚠️ Only ${foundRecords}/${expectedRecords.length} expected records found`);
      }

    } catch (error) {
      console.log(`\n❌ ${hostname} via ${dnsServer}: ${error.message}`);
      results.push({
        hostname,
        dnsServer,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

async function measureDNSPerformance(hostnames) {
  console.log('Measuring DNS Performance...');
  console.log('============================');

  const results = [];

  for (const hostname of hostnames) {
    console.log(`\nTesting ${hostname}...`);

    // Test multiple times for average
    const measurements = [];
    for (let i = 0; i < 5; i++) {
      try {
        const result = await dnsLookup(hostname);
        measurements.push(result.queryTime);
      } catch (error) {
        console.log(`  ❌ Lookup ${i + 1} failed: ${error.message}`);
      }
    }

    if (measurements.length > 0) {
      const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const minTime = Math.min(...measurements);
      const maxTime = Math.max(...measurements);

      results.push({
        hostname,
        measurements: measurements.length,
        averageTime: Math.round(avgTime),
        minTime,
        maxTime,
        success: true
      });

      console.log(`  Average: ${Math.round(avgTime)}ms`);
      console.log(`  Min: ${minTime}ms`);
      console.log(`  Max: ${maxTime}ms`);
      console.log(`  ✅ Performance: ${avgTime < 50 ? 'Excellent' : avgTime < 100 ? 'Good' : 'Needs improvement'}`);
    } else {
      results.push({
        hostname,
        success: false,
        error: 'All measurements failed'
      });
      console.log(`  ❌ All DNS lookups failed`);
    }
  }

  return results;
}

async function checkDNSSEC(hostname) {
  console.log(`\nChecking DNSSEC for ${hostname}...`);

  try {
    const output = execSync(`dig +dnssec ${hostname}`, { encoding: 'utf8' });

    if (output.includes('RRSIG')) {
      console.log('  ✅ DNSSEC is enabled');
      return { hostname, dnssec: true };
    } else {
      console.log('  ⚠️ DNSSEC is not enabled');
      return { hostname, dnssec: false };
    }
  } catch (error) {
    console.log(`  ❌ DNSSEC check failed: ${error.message}`);
    return { hostname, dnssec: false, error: error.message };
  }
}

async function generateDNSReport() {
  const hostnames = [
    'mariaborysevych.com',
    'www.mariaborysevych.com',
    'cdn.mariaborysevych.com',
    'api.mariaborysevych.com',
    'admin.mariaborysevych.com'
  ];

  console.log('DNS Monitoring Report');
  console.log('====================');

  // Performance testing
  const performanceResults = await measureDNSPerformance(hostnames);

  // DNSSEC checking
  const dnssecResults = [];
  for (const hostname of hostnames) {
    const result = await checkDNSSEC(hostname);
    dnssecResults.push(result);
  }

  // DNS propagation checking
  console.log('\n\nDNS Propagation Check');
  console.log('=====================');
  const propagationResults = await checkDNSPropagation('mariaborysevych.com', [
    'A',
    'AAAA',
    'MX',
    'TXT'
  ]);

  // Generate summary
  console.log('\n\nSummary');
  console.log('=======');

  const successfulPerformance = performanceResults.filter(r => r.success);
  const dnssecEnabled = dnssecResults.filter(r => r.dnssec);
  const successfulPropagation = propagationResults.filter(r => r.success);

  console.log(`Performance Tests: ${successfulPerformance.length}/${hostnames.length} successful`);
  console.log(`DNSSEC Enabled: ${dnssecEnabled.length}/${hostnames.length} domains`);
  console.log(`DNS Propagation: ${successfulPropagation.length}/${propagationResults.length} servers`);

  if (successfulPerformance.length > 0) {
    const avgPerformance = successfulPerformance
      .reduce((sum, r) => sum + r.averageTime, 0) / successfulPerformance.length;
    console.log(`Average DNS Query Time: ${Math.round(avgPerformance)}ms`);
  }

  const report = {
    timestamp: new Date().toISOString(),
    performance: performanceResults,
    dnssec: dnssecResults,
    propagation: propagationResults,
    summary: {
      performanceSuccess: successfulPerformance.length,
      dnssecEnabled: dnssecEnabled.length,
      propagationSuccess: successfulPropagation.length,
      totalDomains: hostnames.length
    }
  };

  return report;
}

// Export functions
module.exports = {
  dnsLookup,
  checkDNSPropagation,
  measureDNSPerformance,
  checkDNSSEC,
  generateDNSReport
};

// Run monitoring if called directly
if (require.main === module) {
  generateDNSReport()
    .then(report => {
      // Save report to file
      const fs = require('fs');
      const reportFile = `dns-report-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved to: ${reportFile}`);
    })
    .catch(error => {
      console.error('Error generating DNS report:', error);
      process.exit(1);
    });
}
EOF

    success "DNS monitoring script created"
}

# Create DNS record management script
create_dns_management() {
    log "Creating DNS record management script..."

    cat > scripts/manage-dns.sh << 'EOF'
#!/bin/bash

# DNS Record Management Script
# Manages DNS records for production deployment

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN=${1:-"mariaborysevych.com"}
DNS_PROVIDER=${DNS_PROVIDER:-"vercel"}

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

# Add DNS record
add_dns_record() {
    local type="$1"
    local name="$2"
    local value="$3"
    local ttl="${4:-300}"

    log "Adding DNS record: $type $name $value (TTL: $ttl)"

    case "$DNS_PROVIDER" in
        "vercel")
            if command -v vercel &> /dev/null; then
                vercel dns add "$DOMAIN" "$type" "$name" "$value" --ttl "$ttl"
                success "DNS record added via Vercel CLI"
            else
                error "Vercel CLI not found. Please install it: npm i -g vercel"
                return 1
            fi
            ;;
        "cloudflare")
            warning "Cloudflare integration not implemented. Please add manually."
            ;;
        *)
            warning "DNS provider '$DNS_PROVIDER' not supported. Please add record manually."
            echo "Record to add:"
            echo "  Type: $type"
            echo "  Name: $name"
            echo "  Value: $value"
            echo "  TTL: $ttl"
            ;;
    esac
}

# Remove DNS record
remove_dns_record() {
    local type="$1"
    local name="$2"

    log "Removing DNS record: $type $name"

    case "$DNS_PROVIDER" in
        "vercel")
            if command -v vercel &> /dev/null; then
                local record_id=$(vercel dns ls "$DOMAIN" --json | jq -r ".[] | select(.type==\"$type\" and .name==\"$name\") | .id")
                if [[ -n "$record_id" && "$record_id" != "null" ]]; then
                    vercel dns rm "$record_id"
                    success "DNS record removed via Vercel CLI"
                else
                    warning "DNS record not found"
                fi
            else
                error "Vercel CLI not found"
                return 1
            fi
            ;;
        *)
            warning "Please remove DNS record manually: $type $name"
            ;;
    esac
}

# List DNS records
list_dns_records() {
    log "Listing DNS records for $DOMAIN"

    case "$DNS_PROVIDER" in
        "vercel")
            if command -v vercel &> /dev/null; then
                vercel dns ls "$DOMAIN"
            else
                error "Vercel CLI not found"
                return 1
            fi
            ;;
        *)
            error "Listing not supported for DNS provider '$DNS_PROVIDER'"
            return 1
            ;;
    esac
}

# Verify DNS propagation
verify_dns_propagation() {
    local hostname="$1"
    local expected_value="$2"
    local record_type="${3:-A}"

    log "Verifying DNS propagation for $hostname ($record_type)"

    local dns_servers=("8.8.8.8" "1.1.1.1" "208.67.222.222" "9.9.9.9")
    local success_count=0

    for dns_server in "${dns_servers[@]}"; do
        local result
        result=$(dig "@$dns_server" "$hostname" "$record_type" +short)

        if [[ -n "$result" ]]; then
            if [[ "$result" == *"$expected_value"* ]]; then
                success "✅ $dns_server: $result"
                ((success_count++))
            else
                warning "⚠️ $dns_server: $result (expected: $expected_value)"
            fi
        else
            error "❌ $dns_server: No result"
        fi
    done

    local total_servers=${#dns_servers[@]}
    log "Propagation: $success_count/$total_servers servers"

    if [[ $success_count -eq $total_servers ]]; then
        success "DNS propagation complete"
        return 0
    else
        warning "DNS propagation in progress"
        return 1
    fi
}

# Setup complete DNS configuration
setup_dns_configuration() {
    log "Setting up complete DNS configuration for $DOMAIN"

    # A records for main domain
    add_dns_record "A" "@" "76.76.19.19" 300
    add_dns_record "A" "@" "76.76.21.21" 300

    # AAAA records for IPv6
    add_dns_record "AAAA" "@" "2600:1f18:24c5:ca00::1" 300
    add_dns_record "AAAA" "@" "2600:1f18:24c5:ca01::1" 300

    # CNAME records for subdomains
    add_dns_record "CNAME" "www" "cname.vercel-dns.com" 300
    add_dns_record "CNAME" "cdn" "cname.vercel-dns.com" 300
    add_dns_record "CNAME" "api" "cname.vercel-dns.com" 300
    add_dns_record "CNAME" "admin" "cname.vercel-dns.com" 300
    add_dns_record "CNAME" "blog" "cname.vercel-dns.com" 300

    # MX records for email (Google Workspace)
    add_dns_record "MX" "@" "10 aspmx.l.google.com" 3600
    add_dns_record "MX" "@" "20 alt1.aspmx.l.google.com" 3600
    add_dns_record "MX" "@" "30 alt2.aspmx.l.google.com" 3600
    add_dns_record "MX" "@" "40 alt3.aspmx.l.google.com" 3600
    add_dns_record "MX" "@" "50 alt4.aspmx.l.google.com" 3600

    # TXT records
    add_dns_record "TXT" "@" "\"v=spf1 include:_spf.google.com include:_spf.vercel.me ~all\"" 3600
    add_dns_record "TXT" "_dmarc" "\"v=DMARC1; p=quarantine; rua=mailto:dmarc@$DOMAIN; ruf=mailto:dmarc@$DOMAIN\"" 3600

    # CAA records
    add_dns_record "CAA" "@" "0 issue letsencrypt.org" 86400
    add_dns_record "CAA" "@" "0 issuewild letsencrypt.org" 86400

    success "DNS configuration setup completed"
}

# Test DNS configuration
test_dns_configuration() {
    log "Testing DNS configuration for $DOMAIN"

    # Test main domain
    local main_ip
    main_ip=$(dig +short "$DOMAIN")
    if [[ -n "$main_ip" ]]; then
        success "✅ Main domain resolves to: $main_ip"
    else
        error "❌ Main domain does not resolve"
        return 1
    fi

    # Test subdomains
    local subdomains=("www" "cdn" "api" "admin")
    for subdomain in "${subdomains[@]}"; do
        local full_domain="${subdomain}.${DOMAIN}"
        local result
        result=$(dig +short "$full_domain")

        if [[ -n "$result" ]]; then
            success "✅ $full_domain resolves to: $result"
        else
            error "❌ $full_domain does not resolve"
        fi
    done

    # Test email records
    local mx_records
    mx_records=$(dig +short "$DOMAIN" MX)
    if [[ -n "$mx_records" ]]; then
        success "✅ MX records found: $mx_records"
    else
        error "❌ No MX records found"
    fi

    # Test SPF record
    local spf_record
    spf_record=$(dig +short "$DOMAIN" TXT | grep "v=spf1")
    if [[ -n "$spf_record" ]]; then
        success "✅ SPF record found: $spf_record"
    else
        error "❌ No SPF record found"
    fi

    success "DNS configuration test completed"
}

# Show usage
show_usage() {
    cat << EOF
DNS Management Script

Usage: $0 [DOMAIN] [DNS_PROVIDER] [COMMAND]

Commands:
  setup                   Setup complete DNS configuration
  add <type> <name> <value> [ttl]  Add DNS record
  remove <type> <name>    Remove DNS record
  list                    List DNS records
  test                    Test DNS configuration
  verify <hostname> <expected> [type]  Verify DNS propagation
  help                    Show this help message

Examples:
  $0 mariaborysevych.com vercel setup
  $0 mariaborysevych.com vercel add CNAME www cname.vercel-dns.com
  $0 mariaborysevych.com vercel list
  $0 mariaborysevych.com vercel test
  $0 mariaborysevych.com vercel verify www.mariaborysevych.com cname.vercel-dns.com CNAME

Supported DNS providers: vercel, cloudflare

EOF
}

# Main execution
main() {
    local command="${3:-help}"

    case "$command" in
        "setup")
            setup_dns_configuration
            ;;
        "add")
            if [[ $# -lt 5 ]]; then
                error "Insufficient arguments for add command"
                show_usage
                exit 1
            fi
            add_dns_record "$4" "$5" "$6" "${7:-300}"
            ;;
        "remove")
            if [[ $# -lt 5 ]]; then
                error "Insufficient arguments for remove command"
                show_usage
                exit 1
            fi
            remove_dns_record "$4" "$5"
            ;;
        "list")
            list_dns_records
            ;;
        "test")
            test_dns_configuration
            ;;
        "verify")
            if [[ $# -lt 5 ]]; then
                error "Insufficient arguments for verify command"
                show_usage
                exit 1
            fi
            verify_dns_propagation "$4" "$5" "${6:-A}"
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

    chmod +x scripts/manage-dns.sh

    success "DNS management script created"
}

# Create domain verification configuration
create_domain_verification() {
    log "Creating domain verification configuration..."

    cat > config/dns/domain-verification.json << EOF
{
  "domain_verification": {
    "domain": "$DOMAIN",
    "providers": {
      "vercel": {
        "required": true,
        "verification_method": "dns_txt",
        "record_name": "vercel-domain-verification",
        "instructions": [
          "1. Go to Vercel dashboard",
          "2. Add domain to project",
          "3. Copy verification code from Vercel",
          "4. Add TXT record with the verification code",
          "5. Wait for DNS propagation",
          "6. Verify domain in Vercel dashboard"
        ]
      },
      "google_workspace": {
        "required": false,
        "verification_method": "dns_txt",
        "record_name": "google-site-verification",
        "instructions": [
          "1. Go to Google Admin Console",
          "2. Navigate to Domain verification",
          "3. Copy verification code",
          "4. Add TXT record with the verification code",
          "5. Verify domain in Google Admin Console"
        ]
      },
      "google_analytics": {
        "required": false,
        "verification_method": "dns_txt",
        "record_name": "google-site-verification",
        "instructions": [
          "1. Go to Google Analytics",
          "2. Navigate to Admin > Property > Property Settings",
          "3. Copy verification code",
          "4. Add TXT record with the verification code",
          "5. Verify in Google Analytics"
        ]
      },
      "facebook_domain": {
        "required": false,
        "verification_method": "dns_txt",
        "record_name": "facebook-domain-verification",
        "instructions": [
          "1. Go to Facebook Business Settings",
          "2. Navigate to Domains",
          "3. Add domain and copy verification code",
          "4. Add TXT record with the verification code",
          "5. Verify in Facebook Business Manager"
        ]
      }
    },
    "email_verification": {
      "required": true,
      "providers": ["google_workspace"],
      "steps": [
        "1. Configure MX records for email provider",
        "2. Set up SPF record",
        "3. Configure DKIM",
        "4. Set up DMARC",
        "5. Test email delivery"
      ]
    }
  }
}
EOF

    success "Domain verification configuration created"
}

# Main execution
main() {
    local command="${1:-configure}"

    case "$command" in
        "configure")
            log "Starting domain and DNS optimization..."
            create_dns_zone_config
            create_dns_performance_config
            create_dns_monitoring
            create_dns_management
            create_domain_verification
            success "Domain and DNS optimization completed!"
            ;;
        "test")
            log "Testing DNS configuration..."
            ./scripts/manage-dns.sh "$DOMAIN" vercel test
            ;;
        "monitor")
            log "Starting DNS monitoring..."
            node scripts/monitoring/dns-monitor.js
            ;;
        "setup")
            log "Setting up DNS records..."
            ./scripts/manage-dns.sh "$DOMAIN" vercel setup
            ;;
        "help"|"--help"|"-h")
            echo "Domain and DNS Optimization Script"
            echo ""
            echo "Usage: $0 [COMMAND]"
            echo ""
            echo "Commands:"
            echo "  configure    Run full DNS configuration (default)"
            echo "  setup        Set up DNS records"
            echo "  test         Test DNS configuration"
            echo "  monitor      Monitor DNS performance"
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