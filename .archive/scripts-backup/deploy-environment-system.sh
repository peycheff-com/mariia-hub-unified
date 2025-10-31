#!/bin/bash

# Environment Management System Deployment Script
# This script sets up the complete environment management system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi

    # Check kubectl (optional but recommended)
    if ! command -v kubectl &> /dev/null; then
        warn "kubectl is not installed. Kubernetes features will not be available"
    fi

    log "Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."

    # Install Node.js dependencies
    npm install

    # Install additional dependencies for environment management
    npm install handlebars joi node-fetch yaml fs-extra cron

    log "Dependencies installed successfully"
}

# Create directory structure
create_directories() {
    log "Creating directory structure..."

    # Main directories
    mkdir -p config/{environments,monitoring,testing,lifecycle,templates}
    mkdir -p config/monitoring/{health,alerts,rules,metrics}
    mkdir -p config/testing/{suites,reports,fixtures}
    mkdir -p config/lifecycle/{policies,workflows,backups}
    mkdir -p config/templates/{environments,services,infrastructure}

    # State and logs
    mkdir -p logs/{environments,configs,optimization,health,testing,lifecycle}
    mkdir -p .state/{environments,configs,workflows,metrics}

    # Backup directories
    mkdir -p backups/{configs,databases,files,metadata}

    # Scripts executables
    chmod +x scripts/environment/*.js

    log "Directory structure created"
}

# Create default configurations
create_default_configs() {
    log "Creating default configurations..."

    # Environment manager config
    if [[ ! -f config/environment/manager.yml ]]; then
        cp config/environment/manager.yml config/environment/manager.yml.backup 2>/dev/null || true
    fi

    # Monitoring configuration
    cat > config/monitoring/config.yml << EOF
# Monitoring Configuration
health:
  enabled: true
  interval: 30
  timeout: 10
  retries: 3

alerts:
  enabled: true
  channels: ["email", "slack"]

metrics:
  enabled: true
  collectionInterval: 15
  retention: 30
EOF

    # Testing configuration
    cat > config/testing/config.yml << EOF
# Testing Configuration
automated:
  enabled: true
  schedules:
    smoke: "*/5 * * * *"
    integration: "*/15 * * * *"
    performance: "0 */2 * * *"

thresholds:
  responseTime: 1000
  errorRate: 1
  availability: 99.9
EOF

    # Lifecycle configuration
    cat > config/lifecycle/config.yml << EOF
# Lifecycle Configuration
backup:
  enabled: true
  defaultSchedule: "0 2 * * *"
  defaultRetention: 7

autoCleanup:
  enabled: true
  inactiveThreshold: 720
  backupBeforeDelete: true
EOF

    log "Default configurations created"
}

# Create default templates
create_default_templates() {
    log "Creating default templates..."

    # Development template
    cat > config/templates/environments/development.hbs << EOF
# Development Environment Configuration
name: {{name}}
type: development
namespace: {{namespace}}
domain: {{domain}}

resources:
  cpu: "500m"
  memory: "512Mi"
  storage: "5Gi"
  replicas: 1

features:
  debug: true
  hotReload: true
  verboseLogs: true

monitoring:
  enabled: false
EOF

    # Production template
    cat > config/templates/environments/production.hbs << EOF
# Production Environment Configuration
name: {{name}}
type: production
namespace: {{namespace}}
domain: {{domain}}

resources:
  cpu: "2000m"
  memory: "2Gi"
  storage: "20Gi"
  replicas: 2

features:
  debug: false
  hotReload: false
  verboseLogs: false

security:
  ssl: true
  authentication: true
  firewall: true

monitoring:
  enabled: true
  metrics: true
  alerts: true

backup:
  enabled: true
  schedule: "0 1 * * *"
  retention: 30
EOF

    log "Default templates created"
}

# Setup environment variables
setup_environment() {
    log "Setting up environment variables..."

    # Create .env.local if it doesn't exist
    if [[ ! -f .env.local ]]; then
        cat > .env.local << EOF
# Environment Management System Configuration
NODE_ENV=development

# Monitoring Configuration
SLACK_WEBHOOK_URL=your-slack-webhook-url
EMAIL_RECIPIENTS=admin@mariaborysevych.com

# Backup Configuration
BACKUP_PROVIDER=s3
BACKUP_BUCKET=mariaborysevych-backups
BACKUP_REGION=europe-west1

# Security Configuration
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=your-vault-token

# Git Configuration
GIT_PROVIDER=github
GIT_REPO=mariaborysevych/mariia-hub-unified
EOF

        warn "Created .env.local with placeholder values. Please update with your actual configuration."
    fi

    # Source environment variables
    if [[ -f .env.local ]]; then
        export $(cat .env.local | grep -v '^#' | xargs)
    fi

    log "Environment variables configured"
}

# Create startup scripts
create_startup_scripts() {
    log "Creating startup scripts..."

    # Main startup script
    cat > scripts/start-environment-system.sh << 'EOF'
#!/bin/bash

# Environment Management System Startup Script

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Start all services
start_services() {
    log "Starting Environment Management System..."

    # Start Environment Manager
    log "Starting Environment Manager..."
    nohup node scripts/environment/environment-manager.js start > logs/environments/environment-manager.log 2>&1 &
    echo $! > .state/environment-manager.pid

    # Start Resource Optimizer
    log "Starting Resource Optimizer..."
    nohup node scripts/environment/resource-optimizer.js start > logs/optimization/resource-optimizer.log 2>&1 &
    echo $! > .state/resource-optimizer.pid

    # Start Health Monitor
    log "Starting Health Monitor..."
    nohup node scripts/environment/health-monitor.js start > logs/health/health-monitor.log 2>&1 &
    echo $! > .state/health-monitor.pid

    # Start Test Automation
    log "Starting Test Automation..."
    nohup node scripts/environment/test-automation.js start > logs/testing/test-automation.log 2>&1 &
    echo $! > .state/test-automation.pid

    # Start Lifecycle Manager
    log "Starting Lifecycle Manager..."
    nohup node scripts/environment/lifecycle-manager.js start > logs/lifecycle/lifecycle-manager.log 2>&1 &
    echo $! > .state/lifecycle-manager.pid

    log "All services started successfully!"
    log "Check logs in the logs/ directory"
}

# Stop all services
stop_services() {
    log "Stopping Environment Management System..."

    # Kill all processes
    for pid_file in .state/*.pid; do
        if [[ -f "$pid_file" ]]; then
            pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid"
                log "Stopped process with PID $pid"
            fi
            rm "$pid_file"
        fi
    done

    log "All services stopped"
}

# Check service status
check_status() {
    log "Checking service status..."

    for service in environment-manager resource-optimizer health-monitor test-automation lifecycle-manager; do
        pid_file=".state/${service}.pid"
        if [[ -f "$pid_file" ]]; then
            pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                log "$service is running (PID: $pid)"
            else
                warn "$service is not running"
                rm "$pid_file"
            fi
        else
            warn "$service is not running"
        fi
    done
}

# Main script logic
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        ;;
    status)
        check_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF

    chmod +x scripts/start-environment-system.sh

    # Quick start script
    cat > scripts/quick-start.sh << 'EOF'
#!/bin/bash

# Quick Start Script for Environment Management System

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log "🚀 Starting Environment Management System Quick Start..."

# Check if system is already running
if [[ -f .state/environment-manager.pid ]]; then
    info "System appears to be running. Checking status..."
    ./scripts/start-environment-system.sh status
    exit 0
fi

# Start the system
log "Starting all services..."
./scripts/start-environment-system.sh start

# Wait a moment for services to start
sleep 5

# Check status
log "Checking service status..."
./scripts/start-environment-system.sh status

# Create a test environment
log "Creating a test environment..."
node scripts/environment/environment-manager.js create test-env \
    --type ephemeral \
    --template development \
    --ttl 3600 || warn "Failed to create test environment (this is expected if Kubernetes is not configured)"

log "✅ Environment Management System is ready!"
info "Documentation: ENVIRONMENT_MANAGEMENT_README.md"
info "Logs: Check the logs/ directory"
info "Commands:"
info "  ./scripts/start-environment-system.sh {start|stop|restart|status}"
info "  npm run environment:create -- name=my-env --type=staging"
info "  npm run monitor:status"
info "  npm run test:smoke"
EOF

    chmod +x scripts/quick-start.sh

    log "Startup scripts created"
}

# Create systemd service (optional)
create_systemd_service() {
    if [[ "$1" == "--systemd" ]]; then
        log "Creating systemd service..."

        sudo tee /etc/systemd/system/mariaborysevych-environment-manager.service > /dev/null << EOF
[Unit]
Description=Mariaborysevych Environment Management System
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=$(pwd)/scripts/start-environment-system.sh start
ExecStop=$(pwd)/scripts/start-environment-system.sh stop
ExecReload=$(pwd)/scripts/start-environment-system.sh restart
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

        sudo systemctl daemon-reload
        sudo systemctl enable mariaborysevych-environment-manager.service

        log "Systemd service created. Enable with: sudo systemctl start mariaborysevych-environment-manager"
    fi
}

# Run validation tests
validate_installation() {
    log "Validating installation..."

    # Test configuration validation
    node scripts/environment/config-manager.js validate || warn "Configuration validation failed"

    # Test environment manager
    node scripts/environment/environment-manager.js --help > /dev/null || error "Environment manager validation failed"

    # Test other components
    for script in config-manager resource-optimizer health-monitor test-automation lifecycle-manager; do
        node scripts/environment/${script}.js --help > /dev/null || error "${script} validation failed"
    done

    log "Installation validation completed successfully"
}

# Display next steps
show_next_steps() {
    log "🎉 Environment Management System installation completed!"
    echo
    info "Next steps:"
    echo "1. Update your configuration in .env.local"
    echo "2. Start the system:"
    echo "   ./scripts/quick-start.sh"
    echo "3. Check the documentation:"
    echo "   cat ENVIRONMENT_MANAGEMENT_README.md"
    echo "4. Create your first environment:"
    echo "   npm run environment:create -- name=staging --type=staging"
    echo "5. Monitor system health:"
    echo "   npm run monitor:status"
    echo
    info "Useful commands:"
    echo "  ./scripts/start-environment-system.sh start    # Start all services"
    echo "  ./scripts/start-environment-system.sh stop     # Stop all services"
    echo "  npm run environment:list                       # List environments"
    echo "  npm run monitor:status                         # Check health status"
    echo "  npm run test:smoke                             # Run smoke tests"
    echo "  npm run optimizer:analyze                      # Analyze costs"
    echo
    warn "Remember to update your .env.local file with your actual configuration values!"
}

# Main installation flow
main() {
    echo "🚀 Environment Management System Installation"
    echo "=================================================="
    echo

    check_root
    check_prerequisites

    info "Step 1: Installing dependencies..."
    install_dependencies

    info "Step 2: Creating directory structure..."
    create_directories

    info "Step 3: Creating default configurations..."
    create_default_configs

    info "Step 4: Creating default templates..."
    create_default_templates

    info "Step 5: Setting up environment..."
    setup_environment

    info "Step 6: Creating startup scripts..."
    create_startup_scripts

    info "Step 7: Validating installation..."
    validate_installation

    # Optional systemd service
    if [[ "$1" == "--systemd" ]]; then
        info "Step 8: Creating systemd service..."
        create_systemd_service --systemd
    fi

    show_next_steps
}

# Handle command line arguments
case "$1" in
    --help|-h)
        echo "Environment Management System Installation Script"
        echo
        echo "Usage: $0 [--systemd] [--help]"
        echo
        echo "Options:"
        echo "  --systemd    Create systemd service for auto-start"
        echo "  --help       Show this help message"
        echo
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac