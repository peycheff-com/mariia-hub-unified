#!/bin/sh

# Entrypoint script for Nginx container
# This script handles initialization, configuration, and startup

set -e

# Configuration
NGINX_HOST=${NGINX_HOST:-0.0.0.0}
NGINX_PORT=${NGINX_PORT:-8080}
NODE_ENV=${NODE_ENV:-production}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[mariia-hub] ${message}${NC}"
}

# Function to log startup information
log_startup_info() {
    print_message "$BLUE" "Starting Mariia Hub application..."
    print_message "$BLUE" "Environment: $NODE_ENV"
    print_message "$BLUE" "Nginx Host: $NGINX_HOST"
    print_message "$BLUE" "Nginx Port: $NGINX_PORT"
    print_message "$BLUE" "Container started at: $(date)"
}

# Function to check if required environment variables are set
check_environment() {
    local missing_vars=""

    if [ -z "$NODE_ENV" ]; then
        missing_vars="$missing_vars NODE_ENV"
    fi

    if [ -z "$NGINX_HOST" ]; then
        missing_vars="$missing_vars NGINX_HOST"
    fi

    if [ -z "$NGINX_PORT" ]; then
        missing_vars="$missing_vars NGINX_PORT"
    fi

    if [ -n "$missing_vars" ]; then
        print_message "$YELLOW" "Warning: Missing environment variables:$missing_vars"
        print_message "$YELLOW" "Using default values..."
    fi
}

# Function to create necessary directories
create_directories() {
    local dirs="/var/cache/nginx /var/log/nginx /var/run"

    for dir in $dirs; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_message "$GREEN" "Created directory: $dir"
        fi
    done

    # Set proper permissions
    chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /var/run
}

# Function to generate Nginx configuration with environment variables
generate_nginx_config() {
    # Replace variables in nginx.conf if needed
    if [ -f /etc/nginx/nginx.conf.template ]; then
        envsubst '$NGINX_HOST $NGINX_PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
        print_message "$GREEN" "Generated Nginx configuration from template"
    fi
}

# Function to create custom error pages
create_error_pages() {
    local html_dir="/usr/share/nginx/html"

    # Create 404 error page if it doesn't exist
    if [ ! -f "$html_dir/404.html" ]; then
        cat > "$html_dir/404.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - Mariia Hub</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #f8f9fa; color: #333; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        h1 { color: #8B4513; margin-bottom: 20px; }
        p { margin-bottom: 20px; line-height: 1.6; }
        a { color: #8B4513; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .home-link { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; border-radius: 6px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Page Not Found</h1>
        <p>Sorry, the page you're looking for doesn't exist or has been moved.</p>
        <p>This might be because:</p>
        <ul style="text-align: left; max-width: 300px; margin: 20px auto;">
            <li>The URL was typed incorrectly</li>
            <li>The page has been moved or deleted</li>
            <li>You clicked on a broken link</li>
        </ul>
        <a href="/" class="home-link">Go to Homepage</a>
    </div>
</body>
</html>
EOF
        print_message "$GREEN" "Created custom 404 error page"
    fi

    # Create 50x error page if it doesn't exist
    if [ ! -f "$html_dir/50x.html" ]; then
        cat > "$html_dir/50x.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Temporarily Unavailable - Mariia Hub</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #f8f9fa; color: #333; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        h1 { color: #dc3545; margin-bottom: 20px; }
        p { margin-bottom: 20px; line-height: 1.6; }
        a { color: #8B4513; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .home-link { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; border-radius: 6px; margin-top: 20px; }
        .retry-btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; border-radius: 6px; margin: 10px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Service Temporarily Unavailable</h1>
        <p>We're sorry, but the service is temporarily unavailable. Please try again in a few moments.</p>
        <p>Our team has been notified and is working on resolving this issue.</p>
        <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        <a href="/" class="home-link">Go to Homepage</a>
    </div>
    <script>
        // Auto-retry after 30 seconds
        setTimeout(function() {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>
EOF
        print_message "$GREEN" "Created custom 50x error page"
    fi
}

# Function to create maintenance page
create_maintenance_page() {
    local html_dir="/usr/share/nginx/html"
    local maintenance_file="$html_dir/maintenance.html"

    if [ ! -f "$maintenance_file" ]; then
        cat > "$maintenance_file" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance - Mariia Hub</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #8B4513 0%, #F5DEB3 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { max-width: 600px; text-align: center; padding: 40px; background: rgba(0,0,0,0.3); border-radius: 15px; backdrop-filter: blur(10px); }
        h1 { margin-bottom: 20px; font-size: 2.5em; }
        p { margin-bottom: 20px; line-height: 1.6; font-size: 1.1em; }
        .icon { font-size: 4em; margin-bottom: 20px; }
        .progress { width: 100%; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden; margin: 20px 0; }
        .progress-bar { height: 100%; background: white; border-radius: 2px; animation: progress 10s ease-in-out infinite; }
        @keyframes progress { 0% { width: 0%; } 50% { width: 80%; } 100% { width: 100%; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔧</div>
        <h1>Maintenance in Progress</h1>
        <p>We're currently performing scheduled maintenance to improve our services.</p>
        <p>This should only take a few minutes. Thank you for your patience!</p>
        <div class="progress">
            <div class="progress-bar"></div>
        </div>
        <p>We'll be back online shortly. Please check back in a few minutes.</p>
    </div>
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(function() {
            window.location.href = '/';
        }, 30000);
    </script>
</body>
</html>
EOF
        print_message "$GREEN" "Created maintenance page"
    fi
}

# Function to validate Nginx configuration
validate_nginx_config() {
    if nginx -t; then
        print_message "$GREEN" "Nginx configuration is valid"
        return 0
    else
        print_message "$RED" "Nginx configuration is invalid"
        return 1
    fi
}

# Function to handle graceful shutdown
handle_shutdown() {
    print_message "$YELLOW" "Received shutdown signal, gracefully stopping Nginx..."
    nginx -s quit
    # Wait for nginx to stop
    while pgrep nginx > /dev/null; do
        sleep 1
    done
    print_message "$GREEN" "Nginx stopped gracefully"
    exit 0
}

# Function to setup signal handlers
setup_signal_handlers() {
    trap 'handle_shutdown' SIGTERM SIGINT
}

# Function to start Nginx
start_nginx() {
    print_message "$GREEN" "Starting Nginx..."
    nginx -g "daemon off;"
}

# Function to check for maintenance mode
check_maintenance_mode() {
    local maintenance_file="/usr/share/nginx/html/.maintenance"

    if [ -f "$maintenance_file" ]; then
        print_message "$YELLOW" "Maintenance mode detected"

        # Replace nginx config for maintenance mode
        if [ -f /etc/nginx/nginx.maintenance.conf ]; then
            cp /etc/nginx/nginx.maintenance.conf /etc/nginx/nginx.conf
            print_message "$GREEN" "Applied maintenance mode configuration"
        fi
    fi
}

# Main startup sequence
main() {
    print_message "$BLUE" "=========================================="
    print_message "$BLUE" "Mariia Hub Container Starting"
    print_message "$BLUE" "=========================================="

    # Run startup functions
    log_startup_info
    check_environment
    create_directories
    generate_nginx_config
    create_error_pages
    create_maintenance_page
    check_maintenance_mode

    # Validate configuration
    if ! validate_nginx_config; then
        print_message "$RED" "Failed to validate Nginx configuration"
        exit 1
    fi

    # Setup signal handlers for graceful shutdown
    setup_signal_handlers

    print_message "$GREEN" "Initialization complete. Starting application..."
    print_message "$BLUE" "=========================================="

    # Start Nginx (this will block)
    start_nginx
}

# Execute main function
main "$@"