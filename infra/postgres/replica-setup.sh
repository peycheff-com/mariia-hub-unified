#!/bin/bash

# PostgreSQL Read Replica Setup Script
# Configures read replica for high-availability PostgreSQL cluster
# Author: Production Infrastructure Team
# Version: 1.0.0

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="/var/log/postgres-replica-setup.log"
readonly PG_VERSION="15"
readonly PG_DATA_DIR="/var/lib/postgresql/${PG_VERSION}/main"
readonly BACKUP_DIR="/var/lib/postgresql/backups"
readonly WAL_ARCHIVE_DIR="/var/lib/postgresql/wal_archive"
readonly RECOVERY_CONF="${PG_DATA_DIR}/recovery.conf"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

# Configuration variables
PRIMARY_HOST="${POSTGRES_PRIMARY_HOST:-postgres-primary.cluster-abcdefg12345.eu-west-1.rds.amazonaws.com}"
REPLICA_USER="${POSTGRES_REPLICATION_USER:-replicator}"
REPLICA_PASSWORD="${POSTGRES_REPLICATION_PASSWORD:-}"
PG_PORT="${POSTGRES_PORT:-5432}"
PG_DATABASE="${POSTGRES_DB:-mariia_production}"

# Validate required variables
validate_config() {
    log "Validating configuration..."

    if [[ -z "$PRIMARY_HOST" ]]; then
        log_error "POSTGRES_PRIMARY_HOST is required"
        exit 1
    fi

    if [[ -z "$REPLICA_USER" ]]; then
        log_error "POSTGRES_REPLICATION_USER is required"
        exit 1
    fi

    if [[ -z "$REPLICA_PASSWORD" ]]; then
        log_error "POSTGRES_REPLICATION_PASSWORD is required"
        exit 1
    fi

    log_success "Configuration validation completed"
}

# Test connectivity to primary server
test_primary_connectivity() {
    log "Testing connectivity to primary server: $PRIMARY_HOST"

    if ! ping -c 3 "$PRIMARY_HOST" &>/dev/null; then
        log_error "Cannot reach primary server: $PRIMARY_HOST"
        exit 1
    fi

    if ! nc -z -w5 "$PRIMARY_HOST" "$PG_PORT"; then
        log_error "Cannot connect to PostgreSQL on primary server"
        exit 1
    fi

    log_success "Primary server connectivity verified"
}

# Create .pgpass file for authentication
create_pgpass() {
    log "Creating .pgpass file for authentication"

    local pgpass_file="/var/lib/postgresql/.pgpass"
    cat > "$pgpass_file" << EOF
${PRIMARY_HOST}:${PG_PORT}:${PG_DATABASE}:${REPLICA_USER}:${REPLICA_PASSWORD}
EOF

    chmod 600 "$pgpass_file"
    chown postgres:postgres "$pgpass_file"

    log_success ".pgpass file created"
}

# Test replication authentication
test_replication_auth() {
    log "Testing replication authentication"

    if sudo -u postgres psql \
        -h "$PRIMARY_HOST" \
        -p "$PG_PORT" \
        -U "$REPLICA_USER" \
        -d "$PG_DATABASE" \
        -c "SELECT 1" &>/dev/null; then
        log_success "Replication authentication successful"
    else
        log_error "Replication authentication failed"
        exit 1
    fi
}

# Stop PostgreSQL service
stop_postgresql() {
    log "Stopping PostgreSQL service"

    if systemctl is-active --quiet postgresql; then
        systemctl stop postgresql
        log_success "PostgreSQL service stopped"
    else
        log_warning "PostgreSQL service is not running"
    fi
}

# Backup existing data directory
backup_existing_data() {
    if [[ -d "$PG_DATA_DIR" ]] && [[ "$(ls -A "$PG_DATA_DIR" 2>/dev/null)" ]]; then
        log "Backing up existing PostgreSQL data directory"

        local backup_timestamp=$(date +%Y%m%d_%H%M%S)
        local backup_path="${BACKUP_DIR}/data_backup_${backup_timestamp}"

        mkdir -p "$BACKUP_DIR"
        mv "$PG_DATA_DIR" "$backup_path"

        log_success "Existing data backed up to: $backup_path"
    else
        log "No existing data directory found"
    fi
}

# Create clean data directory
create_data_directory() {
    log "Creating new PostgreSQL data directory"

    mkdir -p "$PG_DATA_DIR"
    chown postgres:postgres "$PG_DATA_DIR"
    chmod 700 "$PG_DATA_DIR"

    log_success "Data directory created: $PG_DATA_DIR"
}

# Base backup from primary
create_base_backup() {
    log "Creating base backup from primary server"

    # Use pg_basebackup to create base backup
    sudo -u postgres pg_basebackup \
        -h "$PRIMARY_HOST" \
        -p "$PG_PORT" \
        -U "$REPLICA_USER" \
        -D "$PG_DATA_DIR" \
        -Fp \
        -Xs \
        -z \
        -P \
        -W \
        -v

    log_success "Base backup completed"
}

# Configure replication settings
configure_replication() {
    log "Configuring replication settings"

    # Create recovery signal file (PostgreSQL 12+)
    touch "${PG_DATA_DIR}/standby.signal"

    # Create standby.signal file for replica mode
    chown postgres:postgres "${PG_DATA_DIR}/standby.signal"

    # Create custom configuration for replica
    cat >> "${PG_DATA_DIR}/custom.conf" << EOF

# REPLICA CONFIGURATION
# --------------------
standby_mode = 'on'
primary_conninfo = 'host=${PRIMARY_HOST} port=${PG_PORT} user=${REPLICA_USER} dbname=${PG_DATABASE} sslmode=require'
recovery_min_apply_delay = 0
hot_standby = on
max_standby_streaming_delay = 30s
max_standby_archive_delay = 30s

# PERFORMANCE TUNING FOR REPLICA
# ------------------------------
# Reduced memory usage since we're read-only
shared_buffers = 4GB
work_mem = 32MB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9

# Read-heavy optimization
random_page_cost = 1.1
effective_cache_size = 20GB
seq_page_cost = 1.0

# Logging specific to replica
log_min_duration_statement = 2000
log_line_prefix = 'replica %t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
EOF

    chown postgres:postgres "${PG_DATA_DIR}/custom.conf"

    log_success "Replication configuration completed"
}

# Set proper permissions
set_permissions() {
    log "Setting proper permissions on PostgreSQL data"

    chown -R postgres:postgres "$PG_DATA_DIR"
    chmod 700 "$PG_DATA_DIR"

    log_success "Permissions set correctly"
}

# Start PostgreSQL service
start_postgresql() {
    log "Starting PostgreSQL replica service"

    systemctl start postgresql

    # Wait for PostgreSQL to start
    local max_wait=30
    local wait_count=0

    while ! pg_isready -q && [ $wait_count -lt $max_wait ]; do
        sleep 1
        ((wait_count++))
    done

    if pg_isready -q; then
        log_success "PostgreSQL replica started successfully"
    else
        log_error "PostgreSQL replica failed to start"
        exit 1
    fi
}

# Verify replication status
verify_replication() {
    log "Verifying replication status"

    # Check if replica is in recovery mode
    local recovery_status=$(sudo -u postgres psql \
        -tAX \
        -c "SELECT pg_is_in_recovery()")

    if [[ "$recovery_status" == "t" ]]; then
        log_success "Replica is in recovery mode"
    else
        log_error "Replica is not in recovery mode"
        return 1
    fi

    # Check replication lag
    local replication_lag=$(sudo -u postgres psql \
        -tAX \
        -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::BIGINT")

    if [[ -n "$replication_lag" ]] && [[ "$replication_lag" -lt 30 ]]; then
        log_success "Replication lag is acceptable: ${replication_lag}s"
    else
        log_warning "Replication lag is high: ${replication_lag}s"
    fi

    # Check if replication is active
    local wal_receiver_status=$(sudo -u postgres psql \
        -tAX \
        -c "SELECT COUNT(*) FROM pg_stat_wal_receiver WHERE status = 'streaming'")

    if [[ "$wal_receiver_status" == "1" ]]; then
        log_success "WAL receiver is active and streaming"
    else
        log_warning "WAL receiver may not be streaming"
    fi
}

# Setup monitoring for replica
setup_monitoring() {
    log "Setting up monitoring for replica"

    # Create monitoring user
    sudo -u postgres psql << EOF
CREATE USER IF NOT EXISTS monitoring_user WITH PASSWORD 'USE_KMS_MANAGED_PASSWORD';
GRANT CONNECT ON DATABASE ${PG_DATABASE} TO monitoring_user;
GRANT USAGE ON SCHEMA public TO monitoring_user;
GRANT SELECT ON pg_stat_activity TO monitoring_user;
GRANT SELECT ON pg_stat_replication TO monitoring_user;
GRANT SELECT ON pg_stat_wal_receiver TO monitoring_user;
GRANT SELECT ON pg_stat_database TO monitoring_user;
EOF

    log_success "Monitoring user configured"
}

# Create systemd override for replica
create_systemd_override() {
    log "Creating systemd override for PostgreSQL replica"

    local override_dir="/etc/systemd/system/postgresql.service.d"
    mkdir -p "$override_dir"

    cat > "${override_dir}/replica-override.conf" << EOF
[Service]
Environment=PGOPTIONS="-c config_file=${PG_DATA_DIR}/custom.conf"
Environment=PGSTARTTIMEOUT=300
LimitNOFILE=65536
LimitMEMLOCK=infinity
EOF

    systemctl daemon-reload
    log_success "Systemd override created"
}

# Main execution function
main() {
    log "Starting PostgreSQL read replica setup"

    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi

    # Execute setup steps
    validate_config
    test_primary_connectivity
    create_pgpass
    test_replication_auth
    stop_postgresql
    backup_existing_data
    create_data_directory
    create_base_backup
    configure_replication
    set_permissions
    create_systemd_override
    start_postgresql
    verify_replication
    setup_monitoring

    log_success "PostgreSQL read replica setup completed successfully"

    # Display replication status information
    echo
    echo "=== REPLICATION STATUS ==="
    sudo -u postgres psql << EOF
-- Replication status
SELECT
    pg_is_in_recovery() AS in_recovery,
    pg_last_xact_replay_timestamp() AS last_replay,
    EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds;

-- WAL receiver status
SELECT * FROM pg_stat_wal_receiver;

-- Database connections
SELECT
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database
WHERE datname = '${PG_DATABASE}';
EOF

    echo
    log "Replica is now ready for read-only queries"
}

# Error handling
trap 'log_error "Script failed at line $LINENO"' ERR

# Run main function
main "$@"