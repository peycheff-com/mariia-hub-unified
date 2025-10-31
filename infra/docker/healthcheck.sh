#!/bin/sh

# Health check script for Nginx container
# This script verifies that the application is healthy and ready to serve traffic

set -e

# Configuration
NGINX_HOST=${NGINX_HOST:-0.0.0.0}
NGINX_PORT=${NGINX_PORT:-8080}
HEALTH_ENDPOINT="http://${NGINX_HOST}:${NGINX_PORT}/health"
TIMEOUT=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if nginx process is running
check_nginx_process() {
    if pgrep nginx > /dev/null; then
        print_status "$GREEN" "✓ Nginx process is running"
        return 0
    else
        print_status "$RED" "✗ Nginx process is not running"
        return 1
    fi
}

# Check if nginx is listening on the correct port
check_nginx_listening() {
    if netstat -ln | grep ":${NGINX_PORT}" > /dev/null; then
        print_status "$GREEN" "✓ Nginx is listening on port ${NGINX_PORT}"
        return 0
    else
        print_status "$RED" "✗ Nginx is not listening on port ${NGINX_PORT}"
        return 1
    fi
}

# Check if the health endpoint is responding
check_health_endpoint() {
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$HEALTH_ENDPOINT" || echo "000")

    if [ "$response_code" = "200" ]; then
        print_status "$GREEN" "✓ Health endpoint is responding (HTTP $response_code)"
        return 0
    else
        print_status "$RED" "✗ Health endpoint is not responding (HTTP $response_code)"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$disk_usage" -lt 90 ]; then
        print_status "$GREEN" "✓ Disk usage is at ${disk_usage}%"
        return 0
    else
        print_status "$YELLOW" "⚠ Disk usage is high at ${disk_usage}%"
        return 1
    fi
}

# Check memory usage
check_memory_usage() {
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')

    if [ "$memory_usage" -lt 90 ]; then
        print_status "$GREEN" "✓ Memory usage is at ${memory_usage}%"
        return 0
    else
        print_status "$YELLOW" "⚠ Memory usage is high at ${memory_usage}%"
        return 1
    fi
}

# Check if critical files exist
check_critical_files() {
    local critical_files="/usr/share/nginx/html/index.html /usr/share/nginx/html/manifest.json"
    local all_files_exist=true

    for file in $critical_files; do
        if [ -f "$file" ]; then
            print_status "$GREEN" "✓ Critical file exists: $(basename $file)"
        else
            print_status "$RED" "✗ Critical file missing: $(basename $file)"
            all_files_exist=false
        fi
    done

    if [ "$all_files_exist" = true ]; then
        return 0
    else
        return 1
    fi
}

# Check if static assets are accessible
check_static_assets() {
    local test_urls=(
        "/manifest.json"
        "/favicon.ico"
    )

    for url in "${test_urls[@]}"; do
        local full_url="http://${NGINX_HOST}:${NGINX_PORT}${url}"
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$full_url" || echo "000")

        if [ "$response_code" = "200" ] || [ "$response_code" = "404" ]; then
            print_status "$GREEN" "✓ Static asset accessible: $url (HTTP $response_code)"
        else
            print_status "$YELLOW" "⚠ Static asset issue: $url (HTTP $response_code)"
        fi
    done

    return 0
}

# Main health check logic
main() {
    print_status "$GREEN" "Starting health check..."

    local exit_code=0

    # Run all checks
    check_nginx_process || exit_code=1
    check_nginx_listening || exit_code=1
    check_health_endpoint || exit_code=1
    check_disk_space || exit_code=1
    check_memory_usage || exit_code=1
    check_critical_files || exit_code=1
    check_static_assets || exit_code=1

    # Summary
    if [ $exit_code -eq 0 ]; then
        print_status "$GREEN" "✓ All health checks passed"
        echo "healthy"
    else
        print_status "$RED" "✗ Some health checks failed"
        echo "unhealthy"
    fi

    exit $exit_code
}

# Execute main function
main "$@"