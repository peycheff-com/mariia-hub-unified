#!/bin/bash

# Database Backup and Disaster Recovery Script
# Comprehensive backup strategy for production database

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID:-"fxpwracjakqpqpoivypm"}
SUPABASE_DB_URL=${SUPABASE_DB_URL:-""}
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
RETENTION_DAYS=${RETENTION_DAYS:-30}
S3_BUCKET=${S3_BUCKET:-"mariia-database-backups"}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}

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

# Send notification to Slack
send_slack_notification() {
    local message="$1"
    local status="${2:-"info"}"

    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local color="good"
        case "$status" in
            "success") color="good" ;;
            "warning") color="warning" ;;
            "error") color="danger" ;;
            *) color="good" ;;
        esac

        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\", \"color\":\"$color\"}" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
}

# Initialize backup directory
initialize_backup_directory() {
    log "Initializing backup directory..."

    mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly,manual,logs}
    mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly,manual,logs}

    success "Backup directory initialized: $BACKUP_DIR"
}

# Create database backup
create_database_backup() {
    local backup_type="$1"
    local backup_name="$2"

    log "Creating $backup_type backup: $backup_name"

    local backup_file="$BACKUP_DIR/$backup_type/$backup_name.sql.gz"
    local start_time=$(date +%s)

    # Create backup
    if [[ -n "$SUPABASE_DB_URL" ]]; then
        # Direct database backup
        pg_dump "$SUPABASE_DB_URL" \
            --no-owner \
            --no-privileges \
            --exclude-table-data 'backup_log' \
            --exclude-table-data 'monitoring_metrics' \
            --format=custom \
            --compress=9 \
            --file="$backup_file"
    else
        # Use Supabase CLI
        supabase db dump \
            --project-ref "$SUPABASE_PROJECT_ID" \
            --data-only \
            --use-connection-string \
            --output="$backup_file"
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local file_size=$(du -h "$backup_file" | cut -f1)

    success "Backup completed in ${duration}s (Size: $file_size)"
    log "Backup file: $backup_file"

    # Log backup
    log_backup_info "$backup_name" "$backup_type" "$file_size" "$duration"
}

# Log backup information
log_backup_info() {
    local backup_name="$1"
    local backup_type="$2"
    local file_size="$3"
    local duration="$4"

    local log_entry="{
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"backup_name\": \"$backup_name\",
        \"backup_type\": \"$backup_type\",
        \"file_size\": \"$file_size\",
        \"duration_seconds\": $duration,
        \"status\": \"completed\"
    }"

    echo "$log_entry" >> "$BACKUP_DIR/logs/backup_log.json"
}

# Verify backup integrity
verify_backup_integrity() {
    local backup_file="$1"

    log "Verifying backup integrity: $backup_file"

    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi

    # Check if file is not empty
    if [[ ! -s "$backup_file" ]]; then
        error "Backup file is empty: $backup_file"
        return 1
    fi

    # Test restore (dry run)
    local temp_restore_dir=$(mktemp -d)
    if pg_restore --list "$backup_file" &> /dev/null; then
        success "Backup integrity verified"
        rm -rf "$temp_restore_dir"
        return 0
    else
        error "Backup integrity check failed"
        rm -rf "$temp_restore_dir"
        return 1
    fi
}

# Upload backup to S3
upload_backup_to_s3() {
    local backup_file="$1"
    local backup_name="$2"

    log "Uploading backup to S3: $backup_name"

    if command -v aws &> /dev/null; then
        # Use AWS CLI
        aws s3 cp "$backup_file" "s3://$S3_BUCKET/$backup_name" \
            --storage-class GLACIER_IR \
            --metadata backup-type="$(basename $(dirname $backup_file))"

        if [[ $? -eq 0 ]]; then
            success "Backup uploaded to S3 successfully"
            return 0
        else
            error "Failed to upload backup to S3"
            return 1
        fi
    else
        warning "AWS CLI not found. Skipping S3 upload."
        return 1
    fi
}

# Create daily backup
create_daily_backup() {
    local backup_name="daily-$(date +%Y%m%d-%H%M%S)"

    log "Creating daily backup..."
    create_database_backup "daily" "$backup_name"

    local backup_file="$BACKUP_DIR/daily/$backup_name.sql.gz"

    if verify_backup_integrity "$backup_file"; then
        upload_backup_to_s3 "$backup_file" "$backup_name"
        send_slack_notification "✅ Daily backup created: $backup_name" "success"
        return 0
    else
        send_slack_notification "❌ Daily backup failed: $backup_name" "error"
        return 1
    fi
}

# Create weekly backup
create_weekly_backup() {
    local backup_name="weekly-$(date +%Y%m%d-%H%M%S)"

    log "Creating weekly backup..."
    create_database_backup "weekly" "$backup_name"

    local backup_file="$BACKUP_DIR/weekly/$backup_name.sql.gz"

    if verify_backup_integrity "$backup_file"; then
        upload_backup_to_s3 "$backup_file" "$backup_name"
        send_slack_notification "✅ Weekly backup created: $backup_name" "success"
        return 0
    else
        send_slack_notification "❌ Weekly backup failed: $backup_name" "error"
        return 1
    fi
}

# Create monthly backup
create_monthly_backup() {
    local backup_name="monthly-$(date +%Y%m%d-%H%M%S)"

    log "Creating monthly backup..."
    create_database_backup "monthly" "$backup_name"

    local backup_file="$BACKUP_DIR/monthly/$backup_name.sql.gz"

    if verify_backup_integrity "$backup_file"; then
        upload_backup_to_s3 "$backup_file" "$backup_name"
        send_slack_notification "✅ Monthly backup created: $backup_name" "success"
        return 0
    else
        send_slack_notification "❌ Monthly backup failed: $backup_name" "error"
        return 1
    fi
}

# Create manual backup
create_manual_backup() {
    local backup_name="manual-$(date +%Y%m%d-%H%M%S)"

    log "Creating manual backup..."
    create_database_backup "manual" "$backup_name"

    local backup_file="$BACKUP_DIR/manual/$backup_name.sql.gz"

    if verify_backup_integrity "$backup_file"; then
        upload_backup_to_s3 "$backup_file" "$backup_name"
        success "Manual backup created successfully: $backup_name"
        send_slack_notification "✅ Manual backup created: $backup_name" "success"
        return 0
    else
        error "Manual backup failed: $backup_name"
        send_slack_notification "❌ Manual backup failed: $backup_name" "error"
        return 1
    fi
}

# Restore database from backup
restore_database_from_backup() {
    local backup_file="$1"
    local restore_type="${2:-"dry-run"}"

    log "Restoring database from backup: $backup_file"
    log "Restore type: $restore_type"

    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi

    # Verify backup before restore
    if ! verify_backup_integrity "$backup_file"; then
        error "Cannot proceed with restore due to backup integrity issues"
        return 1
    fi

    case "$restore_type" in
        "dry-run")
            log "Performing dry-run restore..."
            pg_restore --list "$backup_file" | head -20
            success "Dry-run restore completed"
            ;;
        "full")
            log "Performing full restore..."
            warning "This will overwrite the current database. Type 'yes' to continue:"
            read -r confirmation

            if [[ "$confirmation" == "yes" ]]; then
                if [[ -n "$SUPABASE_DB_URL" ]]; then
                    pg_restore --clean --if-exists --verbose "$SUPABASE_DB_URL" "$backup_file"
                else
                    supabase db restore --project-ref "$SUPABASE_PROJECT_ID" "$backup_file"
                fi
                success "Database restored successfully"
                send_slack_notification "🔄 Database restored from backup: $(basename $backup_file)" "warning"
            else
                log "Restore cancelled"
            fi
            ;;
        *)
            error "Invalid restore type: $restore_type (use: dry-run, full)"
            return 1
            ;;
    esac
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."

    # Clean up daily backups
    find "$BACKUP_DIR/daily" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    log "Cleaned up old daily backups"

    # Clean up weekly backups (keep 4 weeks)
    find "$BACKUP_DIR/weekly" -name "*.sql.gz" -mtime +28 -delete
    log "Cleaned up old weekly backups"

    # Clean up monthly backups (keep 12 months)
    find "$BACKUP_DIR/monthly" -name "*.sql.gz" -mtime +365 -delete
    log "Cleaned up old monthly backups"

    # Clean up manual backups (keep 90 days)
    find "$BACKUP_DIR/manual" -name "*.sql.gz" -mtime +90 -delete
    log "Cleaned up old manual backups"

    success "Backup cleanup completed"
}

# List available backups
list_backups() {
    local backup_type="${1:-"all"}"

    log "Available backups:"

    case "$backup_type" in
        "daily"|"weekly"|"monthly"|"manual")
            if [[ -d "$BACKUP_DIR/$backup_type" ]]; then
                ls -la "$BACKUP_DIR/$backup_type"/*.sql.gz 2>/dev/null | while read -r line; do
                    local file=$(echo "$line" | awk '{print $9}')
                    local size=$(echo "$line" | awk '{print $5}')
                    local date=$(echo "$line" | awk '{print $6, $7, $8}')
                    echo "$(basename "$file") - $size - $date"
                done
            fi
            ;;
        "all")
            for type in daily weekly monthly manual; do
                echo -e "\n${YELLOW}$type backups:${NC}"
                if [[ -d "$BACKUP_DIR/$type" ]] && [[ -n "$(ls -A "$BACKUP_DIR/$type" 2>/dev/null)" ]]; then
                    ls -la "$BACKUP_DIR/$type"/*.sql.gz 2>/dev/null | while read -r line; do
                        local file=$(echo "$line" | awk '{print $9}')
                        local size=$(echo "$line" | awk '{print $5}')
                        echo "  $(basename "$file") - $size"
                    done
                else
                    echo "  No backups found"
                fi
            done
            ;;
        *)
            error "Invalid backup type: $backup_type (use: daily, weekly, monthly, manual, all)"
            return 1
            ;;
    esac
}

# Test disaster recovery procedures
test_disaster_recovery() {
    log "Testing disaster recovery procedures..."

    # 1. Test backup creation
    local test_backup_name="test-$(date +%Y%m%d-%H%M%S)"
    create_database_backup "manual" "$test_backup_name"
    local test_backup_file="$BACKUP_DIR/manual/$test_backup_name.sql.gz"

    # 2. Test backup integrity
    if verify_backup_integrity "$test_backup_file"; then
        success "✅ Backup integrity test passed"
    else
        error "❌ Backup integrity test failed"
        return 1
    fi

    # 3. Test restore capability (dry run)
    if restore_database_from_backup "$test_backup_file" "dry-run"; then
        success "✅ Restore capability test passed"
    else
        error "❌ Restore capability test failed"
        return 1
    fi

    # 4. Test S3 upload
    if upload_backup_to_s3 "$test_backup_file" "$test_backup_name"; then
        success "✅ S3 upload test passed"
    else
        warning "⚠️ S3 upload test failed (may be expected if AWS not configured)"
    fi

    # Clean up test backup
    rm -f "$test_backup_file"

    success "Disaster recovery test completed successfully"
    send_slack_notification "✅ Disaster recovery test completed successfully" "success"
}

# Generate backup report
generate_backup_report() {
    log "Generating backup report..."

    local report_file="backup-report-$(date +%Y%m%d-%H%M%S).json"

    # Count backups
    local daily_count=$(find "$BACKUP_DIR/daily" -name "*.sql.gz" | wc -l)
    local weekly_count=$(find "$BACKUP_DIR/weekly" -name "*.sql.gz" | wc -l)
    local monthly_count=$(find "$BACKUP_DIR/monthly" -name "*.sql.gz" | wc -l)
    local manual_count=$(find "$BACKUP_DIR/manual" -name "*.sql.gz" | wc -l)

    # Calculate total size
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)

    cat > "$report_file" << EOF
{
  "backup_report": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "backup_directory": "$BACKUP_DIR",
    "retention_days": $RETENTION_DAYS,
    "backup_counts": {
      "daily": $daily_count,
      "weekly": $weekly_count,
      "monthly": $monthly_count,
      "manual": $manual_count
    },
    "total_size": "$total_size",
    "s3_bucket": "$S3_BUCKET",
    "last_backup": "$(find "$BACKUP_DIR" -name "*.sql.gz" -printf "%T@ %p\n" | sort -n | tail -1 | cut -d' ' -f2- | xargs basename)"
  }
}
EOF

    success "Backup report generated: $report_file"
}

# Schedule backups using cron
setup_cron_jobs() {
    log "Setting up cron jobs for automated backups..."

    # Create cron entries
    local cron_entry_daily="0 2 * * * $(pwd)/$(basename $0) daily"
    local cron_entry_weekly="0 3 * * 0 $(pwd)/$(basename $0) weekly"
    local cron_entry_monthly="0 4 1 * * $(pwd)/$(basename $0) monthly"
    local cron_entry_cleanup="0 5 * * * $(pwd)/$(basename $0) cleanup"

    # Add to crontab
    (crontab -l 2>/dev/null; echo "$cron_entry_daily") | crontab -
    (crontab -l 2>/dev/null; echo "$cron_entry_weekly") | crontab -
    (crontab -l 2>/dev/null; echo "$cron_entry_monthly") | crontab -
    (crontab -l 2>/dev/null; echo "$cron_entry_cleanup") | crontab -

    success "Cron jobs configured successfully"
    log "Daily backup: 2:00 AM"
    log "Weekly backup: 3:00 AM on Sunday"
    log "Monthly backup: 4:00 AM on 1st of month"
    log "Cleanup: 5:00 AM daily"
}

# Show usage information
show_usage() {
    cat << EOF
Database Backup and Disaster Recovery Script

Usage: $(basename $0) [COMMAND] [OPTIONS]

Commands:
  daily              Create daily backup
  weekly             Create weekly backup
  monthly            Create monthly backup
  manual             Create manual backup
  restore <file>     Restore from backup (use --full for full restore)
  list [type]        List backups (daily|weekly|monthly|manual|all)
  cleanup            Clean up old backups
  test               Test disaster recovery procedures
  report             Generate backup report
  setup-cron         Setup automated backup cron jobs
  help               Show this help message

Examples:
  $(basename $0) daily                    # Create daily backup
  $(basename $0) restore backup.sql.gz    # Dry-run restore
  $(basename $0) restore backup.sql.gz --full  # Full restore
  $(basename $0) list daily               # List daily backups
  $(basename $0) test                     # Test disaster recovery

Environment Variables:
  SUPABASE_PROJECT_ID    Supabase project ID
  SUPABASE_DB_URL        Database connection string
  BACKUP_DIR            Backup directory (default: ./backups)
  RETENTION_DAYS        Backup retention days (default: 30)
  S3_BUCKET             S3 bucket for offsite backups
  SLACK_WEBHOOK_URL     Slack webhook for notifications

EOF
}

# Main execution
main() {
    local command="${1:-help}"

    case "$command" in
        "daily")
            initialize_backup_directory
            create_daily_backup
            ;;
        "weekly")
            initialize_backup_directory
            create_weekly_backup
            ;;
        "monthly")
            initialize_backup_directory
            create_monthly_backup
            ;;
        "manual")
            initialize_backup_directory
            create_manual_backup
            ;;
        "restore")
            if [[ -z "${2:-}" ]]; then
                error "Please provide backup file path"
                exit 1
            fi
            local restore_type="dry-run"
            if [[ "${3:-}" == "--full" ]]; then
                restore_type="full"
            fi
            restore_database_from_backup "$2" "$restore_type"
            ;;
        "list")
            list_backups "${2:-all}"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "test")
            initialize_backup_directory
            test_disaster_recovery
            ;;
        "report")
            generate_backup_report
            ;;
        "setup-cron")
            setup_cron_jobs
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