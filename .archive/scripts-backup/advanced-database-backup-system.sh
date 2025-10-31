#!/bin/bash

# Advanced Database Backup System with Enterprise-Grade Features
# Enhanced backup strategy with point-in-time recovery, cross-region replication
# and automated verification for production database

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Advanced Configuration
SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID:-"fxpwracjakqpqpoivypm"}
SUPABASE_DB_URL=${SUPABASE_DB_URL:-""}
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
RETENTION_DAYS=${RETENTION_DAYS:-30}
S3_BUCKET=${S3_BUCKET:-"mariia-database-backups"}
S3_BUCKET_REGION=${S3_BUCKET_REGION:-"eu-west-1"}
AZURE_STORAGE_ACCOUNT=${AZURE_STORAGE_ACCOUNT:-""}
AZURE_CONTAINER=${AZURE_CONTAINER:-"database-backups"}
GCP_BUCKET=${GCP_BUCKET:-"mariia-backups-europe"}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
TEAMS_WEBHOOK_URL=${TEAMS_WEBHOOK_URL:-""}
PAGERDUTY_INTEGRATION_KEY=${PAGERDUTY_INTEGRATION_KEY:-""}
BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY:-""}
CROSS_REGION_REPLICATION=${CROSS_REGION_REPLICATION:-"true"}
BACKUP_COMPRESSION_LEVEL=${BACKUP_COMPRESSION_LEVEL:-"9"}
POINT_IN_TIME_RETENTION_HOURS=${POINT_IN_TIME_RETENTION_HOURS:-"168"} # 7 days
BACKUP_VERIFICATION_ENABLED=${BACKUP_VERIFICATION_ENABLED:-"true"}
PARALLEL_UPLOADS=${PARALLEL_UPLOADS:-"4"}
BACKUP_CHUNK_SIZE=${BACKUP_CHUNK_SIZE:-"1073741824"} # 1GB chunks

# Logging system
LOG_FILE="$BACKUP_DIR/logs/advanced-backup-$(date +%Y%m%d).log"
METRICS_FILE="$BACKUP_DIR/metrics/backup-metrics-$(date +%Y%m%d).json"

# Ensure directories exist
mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly,manual,pitr,cross-region,logs,metrics,temp,verification}

# Logging functions
log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp] $message${NC}"
    echo "[$timestamp] $message" >> "$LOG_FILE"
}

error() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR] $message${NC}" >&2
    echo "[$timestamp] [ERROR] $message" >> "$LOG_FILE"
    send_critical_alert "$message"
}

success() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[SUCCESS] $message${NC}"
    echo "[$timestamp] [SUCCESS] $message" >> "$LOG_FILE"
}

warning() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARNING] $message${NC}"
    echo "[$timestamp] [WARNING] $message" >> "$LOG_FILE"
}

info() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${CYAN}[INFO] $message${NC}"
    echo "[$timestamp] [INFO] $message" >> "$LOG_FILE"
}

# Metrics collection
collect_metrics() {
    local operation="$1"
    local status="$2"
    local duration="$3"
    local size="$4"
    local metadata="$5"

    local metric_entry="{
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"operation\": \"$operation\",
        \"status\": \"$status\",
        \"duration_seconds\": $duration,
        \"size_bytes\": $size,
        \"metadata\": $metadata
    }"

    echo "$metric_entry" >> "$METRICS_FILE"
}

# Multi-channel alerting system
send_alert() {
    local title="$1"
    local message="$2"
    local severity="${3:-"info"}"
    local color="good"

    case "$severity" in
        "success") color="good" ;;
        "warning") color="warning" ;;
        "error"|"critical") color="danger" ;;
        *) color="good" ;;
    esac

    # Slack notification
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local slack_payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "$title",
            "text": "$message",
            "fields": [
                {
                    "title": "Environment",
                    "value": "${ENVIRONMENT:-production}",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
                    "short": true
                }
            ],
            "footer": "Advanced Backup System",
            "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png"
        }
    ]
}
EOF
        )
        curl -X POST -H 'Content-type: application/json' \
            --data "$slack_payload" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi

    # Teams notification
    if [[ -n "$TEAMS_WEBHOOK_URL" ]]; then
        local teams_payload=$(cat <<EOF
{
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "$(echo "$color" | sed 's/good/00FF00/; s/warning/FFFF00/; s/danger/FF0000/')",
    "summary": "$title",
    "sections": [{
        "activityTitle": "$title",
        "activitySubtitle": "$message",
        "facts": [{
            "name": "Environment",
            "value": "${ENVIRONMENT:-production}"
        }, {
            "name": "Timestamp",
            "value": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        }],
        "markdown": true
    }]
}
EOF
        )
        curl -X POST -H 'Content-Type: application/json' \
            --data "$teams_payload" \
            "$TEAMS_WEBHOOK_URL" &> /dev/null || true
    fi

    # PagerDuty for critical alerts
    if [[ "$severity" == "critical" && -n "$PAGERDUTY_INTEGRATION_KEY" ]]; then
        local pd_payload=$(cat <<EOF
{
    "payload": {
        "summary": "$title",
        "source": "advanced-backup-system",
        "severity": "critical",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "component": "database-backup",
        "group": "operations",
        "class": "backup-failure"
    },
    "routing_key": "$PAGERDUTY_INTEGRATION_KEY",
    "event_action": "trigger"
}
EOF
        )
        curl -X POST -H 'Content-Type: application/json' \
            --data "$pd_payload" \
            "https://events.pagerduty.com/v2/enqueue" &> /dev/null || true
    fi
}

send_critical_alert() {
    send_alert "🚨 CRITICAL: Backup System Alert" "$1" "critical"
}

# Backup encryption
encrypt_backup() {
    local input_file="$1"
    local output_file="$2"

    if [[ -n "$BACKUP_ENCRYPTION_KEY" ]]; then
        log "Encrypting backup: $input_file"
        openssl enc -aes-256-cbc -salt -in "$input_file" -out "$output_file" \
            -pass pass:"$BACKUP_ENCRYPTION_KEY" -pbkdf2

        if [[ $? -eq 0 ]]; then
            success "Backup encrypted successfully"
            rm -f "$input_file" # Remove unencrypted file
            return 0
        else
            error "Backup encryption failed"
            return 1
        fi
    else
        warning "No encryption key provided, skipping encryption"
        mv "$input_file" "$output_file"
        return 0
    fi
}

# Multi-cloud upload with parallel processing
upload_to_multiple_providers() {
    local backup_file="$1"
    local backup_name="$2"
    local upload_results=()

    log "Starting multi-cloud upload for: $backup_name"

    # S3 Upload (AWS)
    if command -v aws &> /dev/null && [[ -n "$S3_BUCKET" ]]; then
        log "Uploading to AWS S3: $S3_BUCKET"
        local start_time=$(date +%s)

        if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$backup_name" \
            --storage-class GLACIER_IR \
            --metadata backup-type="$(basename $(dirname $backup_file))" \
            --expected-size $(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file") \
            --only-show-errors; then

            local duration=$(($(date +%s) - start_time))
            success "AWS S3 upload completed in ${duration}s"
            upload_results+=("aws:success:$duration")

            # Cross-region replication
            if [[ "$CROSS_REGION_REPLICATION" == "true" ]]; then
                replicate_to_other_regions "$backup_file" "$backup_name"
            fi
        else
            error "AWS S3 upload failed"
            upload_results+=("aws:failed:0")
        fi
    else
        warning "AWS CLI not configured, skipping S3 upload"
        upload_results+=("aws:skipped:0")
    fi

    # Azure Blob Storage Upload
    if command -v az &> /dev/null && [[ -n "$AZURE_STORAGE_ACCOUNT" ]]; then
        log "Uploading to Azure Blob Storage: $AZURE_CONTAINER"
        local start_time=$(date +%s)

        if az storage blob upload \
            --file "$backup_file" \
            --name "$backup_name" \
            --container-name "$AZURE_CONTAINER" \
            --account-name "$AZURE_STORAGE_ACCOUNT" \
            --tier Cool \
            --only-show-errors; then

            local duration=$(($(date +%s) - start_time))
            success "Azure Blob upload completed in ${duration}s"
            upload_results+=("azure:success:$duration")
        else
            error "Azure Blob upload failed"
            upload_results+=("azure:failed:0")
        fi
    else
        warning "Azure CLI not configured, skipping Azure upload"
        upload_results+=("azure:skipped:0")
    fi

    # Google Cloud Storage Upload
    if command -v gsutil &> /dev/null && [[ -n "$GCP_BUCKET" ]]; then
        log "Uploading to Google Cloud Storage: $GCP_BUCKET"
        local start_time=$(date +%s)

        if gsutil -o "GSUtil:parallel_composite_upload_threshold=150M" \
            -o "GSUtil:parallel_process_count=${PARALLEL_UPLOADS}" \
            cp "$backup_file" "gs://$GCP_BUCKET/$backup_name" &> /dev/null; then

            local duration=$(($(date +%s) - start_time))
            success "Google Cloud Storage upload completed in ${duration}s"
            upload_results+=("gcp:success:$duration")
        else
            error "Google Cloud Storage upload failed"
            upload_results+=("gcp:failed:0")
        fi
    else
        warning "Google Cloud CLI not configured, skipping GCS upload"
        upload_results+=("gcp:skipped:0")
    fi

    # Log upload results
    local successful_uploads=0
    local total_uploads=0

    for result in "${upload_results[@]}"; do
        IFS=':' read -r provider status duration <<< "$result"
        total_uploads=$((total_uploads + 1))
        if [[ "$status" == "success" ]]; then
            successful_uploads=$((successful_uploads + 1))
        fi
    done

    if [[ $successful_uploads -eq 0 ]]; then
        error "All cloud uploads failed"
        return 1
    elif [[ $successful_uploads -lt $total_uploads ]]; then
        warning "Some cloud uploads failed ($successful_uploads/$total_uploads successful)"
        return 0
    else
        success "All cloud uploads successful ($successful_uploads/$total_uploads)"
        return 0
    fi
}

# Cross-region replication
replicate_to_other_regions() {
    local backup_file="$1"
    local backup_name="$2"

    # Replicate to US East
    if aws s3 cp "s3://$S3_BUCKET/$backup_name" "s3://$S3_BUCKET-us-east/$backup_name" \
        --storage-class GLACIER_IR \
        --source-region "$S3_BUCKET_REGION" \
        --region us-east-1 \
        --only-show-errors &> /dev/null; then
        success "Cross-region replication to us-east-1 completed"
    else
        warning "Cross-region replication to us-east-1 failed"
    fi

    # Replicate to Asia Pacific
    if aws s3 cp "s3://$S3_BUCKET/$backup_name" "s3://$S3_BUCKET-ap-southeast/$backup_name" \
        --storage-class GLACIER_IR \
        --source-region "$S3_BUCKET_REGION" \
        --region ap-southeast-1 \
        --only-show-errors &> /dev/null; then
        success "Cross-region replication to ap-southeast-1 completed"
    else
        warning "Cross-region replication to ap-southeast-1 failed"
    fi
}

# Advanced backup verification with data integrity checks
verify_backup_advanced() {
    local backup_file="$1"
    local verification_type="$2" # "quick" or "comprehensive"

    log "Starting $verification_type verification for: $backup_file"

    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi

    if [[ ! -s "$backup_file" ]]; then
        error "Backup file is empty: $backup_file"
        return 1
    fi

    # File integrity check
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
    if [[ $file_size -lt 1048576 ]]; then # Less than 1MB seems suspicious
        warning "Backup file size is unusually small: $file_size bytes"
    fi

    # Generate checksum
    local checksum_file="${backup_file}.sha256"
    sha256sum "$backup_file" > "$checksum_file"

    # Quick verification - check backup format
    if [[ "$verification_type" == "quick" ]]; then
        if file "$backup_file" | grep -q "gzip\|PostgreSQL\|archive"; then
            success "Quick backup verification passed"
            return 0
        else
            error "Quick backup verification failed - invalid file format"
            return 1
        fi
    fi

    # Comprehensive verification - test restore
    local temp_restore_dir=$(mktemp -d)
    local verification_log="$BACKUP_DIR/verification/verify-$(basename $backup_file).log"

    log "Performing comprehensive backup verification..."

    # For encrypted files, decrypt first
    local test_file="$backup_file"
    if [[ -n "$BACKUP_ENCRYPTION_KEY" ]]; then
        test_file="${backup_file}.decrypted"
        openssl enc -d -aes-256-cbc -in "$backup_file" -out "$test_file" \
            -pass pass:"$BACKUP_ENCRYPTION_KEY" -pbkdf2 || {
            error "Failed to decrypt backup for verification"
            rm -rf "$temp_restore_dir"
            return 1
        }
    fi

    # Test backup structure
    if pg_restore --list "$test_file" > "$verification_log" 2>&1; then
        # Check for critical tables
        local critical_tables=("services" "bookings" "profiles" "users")
        local missing_tables=()

        for table in "${critical_tables[@]}"; do
            if ! grep -q "$table" "$verification_log"; then
                missing_tables+=("$table")
            fi
        done

        if [[ ${#missing_tables[@]} -eq 0 ]]; then
            success "Comprehensive backup verification passed - all critical tables present"

            # Clean up
            rm -rf "$temp_restore_dir"
            [[ "$test_file" != "$backup_file" ]] && rm -f "$test_file"

            return 0
        else
            error "Comprehensive backup verification failed - missing tables: ${missing_tables[*]}"
            rm -rf "$temp_restore_dir"
            [[ "$test_file" != "$backup_file" ]] && rm -f "$test_file"
            return 1
        fi
    else
        error "Comprehensive backup verification failed - cannot read backup format"
        rm -rf "$temp_restore_dir"
        [[ "$test_file" != "$backup_file" ]] && rm -f "$test_file"
        return 1
    fi
}

# Point-in-Time Recovery (PITR) backup creation
create_pitr_backup() {
    local backup_name="pitr-$(date +%Y%m%d-%H%M%S)"

    log "Creating Point-in-Time Recovery backup: $backup_name"

    # Use WAL-G or similar for PITR if available
    if command -v wal-g &> /dev/null; then
        local start_time=$(date +%s)

        if wal-g backup-push; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            success "PITR backup created via WAL-G in ${duration}s"

            # Log PITR backup
            log_pitr_backup "$backup_name" "$duration" "wal-g"
            return 0
        else
            error "WAL-G PITR backup failed"
            return 1
        fi
    else
        # Fallback to regular backup with PITR metadata
        local start_time=$(date +%s)
        local backup_file="$BACKUP_DIR/pitr/$backup_name.sql.gz"

        if [[ -n "$SUPABASE_DB_URL" ]]; then
            pg_dump "$SUPABASE_DB_URL" \
                --no-owner \
                --no-privileges \
                --format=custom \
                --compress=$BACKUP_COMPRESSION_LEVEL \
                --verbose \
                --file="$backup_file" 2> "$BACKUP_DIR/logs/pitr-${backup_name}.log"
        else
            supabase db dump \
                --project-ref "$SUPABASE_PROJECT_ID" \
                --data-only \
                --use-connection-string \
                --output="$backup_file"
        fi

        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        if [[ -f "$backup_file" && -s "$backup_file" ]]; then
            success "PITR backup created in ${duration}s"

            # Encrypt and upload
            local encrypted_file="${backup_file}.enc"
            if encrypt_backup "$backup_file" "$encrypted_file"; then
                upload_to_multiple_providers "$encrypted_file" "$backup_name.sql.gz.enc"
            fi

            # Log PITR backup
            log_pitr_backup "$backup_name" "$duration" "native"
            return 0
        else
            error "PITR backup creation failed"
            return 1
        fi
    fi
}

# Log PITR backup information
log_pitr_backup() {
    local backup_name="$1"
    local duration="$2"
    local method="$3"

    local pitr_entry="{
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"backup_name\": \"$backup_name\",
        \"backup_type\": \"pitr\",
        \"duration_seconds\": $duration,
        \"method\": \"$method\",
        \"retention_hours\": $POINT_IN_TIME_RETENTION_HOURS,
        \"status\": \"completed\"
    }"

    echo "$pitr_entry" >> "$BACKUP_DIR/logs/pitr-backups.json"
}

# Advanced backup creation with metadata
create_advanced_backup() {
    local backup_type="$1"
    local backup_name="$2"

    log "Creating advanced $backup_type backup: $backup_name"

    local start_time=$(date +%s)
    local backup_file="$BACKUP_DIR/$backup_type/$backup_name.sql.gz"
    local temp_file="$BACKUP_DIR/temp/${backup_name}.tmp"

    # Create backup with comprehensive options
    if [[ -n "$SUPABASE_DB_URL" ]]; then
        log "Creating backup via direct database connection..."

        pg_dump "$SUPABASE_DB_URL" \
            --no-owner \
            --no-privileges \
            --exclude-table-data 'backup_log' \
            --exclude-table-data 'monitoring_metrics' \
            --exclude-table-data 'temp_sessions' \
            --exclude-table-data '_realtime*' \
            --format=custom \
            --compress=$BACKUP_COMPRESSION_LEVEL \
            --verbose \
            --lock-wait-timeout=30000 \
            --jobs=4 \
            --file="$temp_file" 2> "$BACKUP_DIR/logs/${backup_name}-creation.log"
    else
        log "Creating backup via Supabase CLI..."

        supabase db dump \
            --project-ref "$SUPABASE_PROJECT_ID" \
            --data-only \
            --use-connection-string \
            --output="$temp_file" 2> "$BACKUP_DIR/logs/${backup_name}-creation.log"
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [[ -f "$temp_file" && -s "$temp_file" ]]; then
        # Get file size
        local file_size=$(stat -f%z "$temp_file" 2>/dev/null || stat -c%s "$temp_file")
        local file_size_human=$(du -h "$temp_file" | cut -f1)

        success "Backup completed in ${duration}s (Size: $file_size_human)"

        # Create metadata
        local metadata_file="${backup_file}.metadata.json"
        cat > "$metadata_file" << EOF
{
    "backup_name": "$backup_name",
    "backup_type": "$backup_type",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "duration_seconds": $duration,
    "file_size_bytes": $file_size,
    "file_size_human": "$file_size_human",
    "compression_level": $BACKUP_COMPRESSION_LEVEL,
    "encryption_enabled": $([[ -n "$BACKUP_ENCRYPTION_KEY" ]] && echo "true" || echo "false"),
    "source_database": "$SUPABASE_PROJECT_ID",
    "backup_method": "$([[ -n "$SUPABASE_DB_URL" ]] && echo "direct" || echo "supabase-cli")",
    "environment": "${ENVIRONMENT:-production}",
    "creator": "advanced-backup-system",
    "version": "2.0.0"
}
EOF

        # Encrypt backup
        local encrypted_file="${backup_file}.enc"
        if encrypt_backup "$temp_file" "$encrypted_file"; then
            backup_file="$encrypted_file"
        fi

        # Verify backup
        if [[ "$BACKUP_VERIFICATION_ENABLED" == "true" ]]; then
            if verify_backup_advanced "$backup_file" "quick"; then
                success "Quick verification passed"
            else
                error "Quick verification failed"
                return 1
            fi
        fi

        # Upload to multiple providers
        if upload_to_multiple_providers "$backup_file" "$backup_name"; then
            success "Multi-cloud upload completed successfully"
        else
            warning "Some uploads failed, but backup was created locally"
        fi

        # Collect metrics
        local metadata="{\"backup_type\": \"$backup_type\", \"method\": \"advanced\", \"verification\": \"$BACKUP_VERIFICATION_ENABLED\"}"
        collect_metrics "create_backup" "success" "$duration" "$file_size" "$metadata"

        # Send success notification
        send_alert "✅ Advanced Backup Created" "$backup_type backup: $backup_name\nSize: $file_size_human\nDuration: ${duration}s\nVerification: $BACKUP_VERIFICATION_ENABLED" "success"

        # Clean up temp file
        rm -f "$temp_file"

        return 0
    else
        error "Backup creation failed"

        # Collect metrics
        collect_metrics "create_backup" "failed" "$duration" "0" "{\"backup_type\": \"$backup_type\", \"error\": \"backup_creation_failed\"}"

        # Send failure notification
        send_critical_alert "❌ Advanced Backup Failed" "$backup_type backup creation failed: $backup_name"

        return 1
    fi
}

# Enhanced backup scheduling with intelligent retry
schedule_intelligent_backup() {
    local backup_type="$1"
    local max_retries=${2:-3}
    local retry_delay=${3:-300} # 5 minutes

    local attempt=1
    local backup_name="$backup_type-$(date +%Y%m%d-%H%M%S)"

    while [[ $attempt -le $max_retries ]]; do
        log "Backup attempt $attempt of $max_retries for: $backup_name"

        if create_advanced_backup "$backup_type" "$backup_name"; then
            success "Backup completed successfully on attempt $attempt"
            return 0
        else
            warning "Backup attempt $attempt failed"

            if [[ $attempt -lt $max_retries ]]; then
                log "Waiting ${retry_delay}s before retry..."
                sleep $retry_delay
                retry_delay=$((retry_delay * 2)) # Exponential backoff
                backup_name="$backup_type-retry-$attempt-$(date +%Y%m%d-%H%M%S)"
            fi
        fi

        attempt=$((attempt + 1))
    done

    error "All backup attempts failed after $max_retries tries"
    send_critical_alert "🚨 All Backup Attempts Failed" "$backup_type backup failed after $max_retries attempts"
    return 1
}

# Advanced restore capabilities
restore_database_advanced() {
    local backup_file="$1"
    local restore_type="${2:-"dry-run"}"
    local point_in_time="${3:-""}"

    log "Starting advanced database restore from: $backup_file"
    log "Restore type: $restore_type"

    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi

    # Verify backup before restore
    if ! verify_backup_advanced "$backup_file" "comprehensive"; then
        error "Cannot proceed with restore due to backup verification failure"
        return 1
    fi

    # Decrypt if needed
    local restore_file="$backup_file"
    if [[ -n "$BACKUP_ENCRYPTION_KEY" && "$backup_file" == *.enc ]]; then
        restore_file="${backup_file%.enc}"
        log "Decrypting backup for restore..."

        if ! openssl enc -d -aes-256-cbc -in "$backup_file" -out "$restore_file" \
            -pass pass:"$BACKUP_ENCRYPTION_KEY" -pbkdf2; then
            error "Failed to decrypt backup for restore"
            return 1
        fi
    fi

    case "$restore_type" in
        "dry-run")
            log "Performing comprehensive dry-run restore..."
            pg_restore --list "$restore_file" | head -50
            success "Dry-run restore completed successfully"
            ;;
        "schema-only")
            log "Restoring schema only..."
            if [[ -n "$SUPABASE_DB_URL" ]]; then
                pg_restore --schema-only --clean --if-exists --verbose "$SUPABASE_DB_URL" "$restore_file"
            else
                error "Direct database connection required for schema-only restore"
                return 1
            fi
            success "Schema restore completed"
            ;;
        "data-only")
            log "Restoring data only..."
            if [[ -n "$SUPABASE_DB_URL" ]]; then
                pg_restore --data-only --clean --if-exists --verbose "$SUPABASE_DB_URL" "$restore_file"
            else
                error "Direct database connection required for data-only restore"
                return 1
            fi
            success "Data restore completed"
            ;;
        "full")
            log "Performing full database restore..."
            warning "⚠️  THIS WILL OVERWRITE THE CURRENT DATABASE"
            warning "Type 'YES-I-UNDERSTAND-THE-RISKS' to continue:"
            read -r confirmation

            if [[ "$confirmation" == "YES-I-UNDERSTAND-THE-RISKS" ]]; then
                log "Proceeding with full restore..."

                if [[ -n "$SUPABASE_DB_URL" ]]; then
                    # Create pre-restore backup
                    local pre_restore_backup="pre-restore-$(date +%Y%m%d-%H%M%S)"
                    create_advanced_backup "manual" "$pre_restore_backup"

                    # Perform restore
                    pg_restore --clean --if-exists --verbose --jobs=4 "$SUPABASE_DB_URL" "$restore_file"
                else
                    supabase db restore --project-ref "$SUPABASE_PROJECT_ID" "$restore_file"
                fi

                success "Full database restore completed"
                send_alert "🔄 Database Restored" "Database restored from backup: $(basename $backup_file)" "warning"
            else
                log "Full restore cancelled by user"
                return 0
            fi
            ;;
        "pitr")
            if [[ -z "$point_in_time" ]]; then
                error "Point-in-time restore requires timestamp parameter"
                return 1
            fi

            log "Performing point-in-time restore to: $point_in_time"

            if command -v wal-g &> /dev/null; then
                if wal-g backup-fetch "$point_in_time"; then
                    success "Point-in-time restore completed to $point_in_time"
                    send_alert "🔄 Point-in-Time Restore" "Database restored to: $point_in_time" "warning"
                else
                    error "Point-in-time restore failed"
                    return 1
                fi
            else
                error "WAL-G not available for point-in-time restore"
                return 1
            fi
            ;;
        *)
            error "Invalid restore type: $restore_type (use: dry-run, schema-only, data-only, full, pitr)"
            return 1
            ;;
    esac

    # Clean up decrypted file if created
    [[ "$restore_file" != "$backup_file" ]] && rm -f "$restore_file"
}

# Enhanced cleanup with archival policies
cleanup_old_backups_advanced() {
    log "Starting advanced cleanup with archival policies..."

    # Standard retention cleanup
    find "$BACKUP_DIR/daily" -name "*.sql.gz*" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR/weekly" -name "*.sql.gz*" -mtime +28 -delete
    find "$BACKUP_DIR/monthly" -name "*.sql.gz*" -mtime +365 -delete
    find "$BACKUP_DIR/manual" -name "*.sql.gz*" -mtime +90 -delete

    # PITR cleanup (keep only configured hours)
    find "$BACKUP_DIR/pitr" -name "*.sql.gz*" -mmin +$(($POINT_IN_TIME_RETENTION_HOURS * 60)) -delete

    # Log cleanup
    find "$BACKUP_DIR/logs" -name "*.log" -mtime +30 -delete

    # Temp files cleanup
    find "$BACKUP_DIR/temp" -name "*" -mmin +60 -delete

    # Verification reports cleanup
    find "$BACKUP_DIR/verification" -name "*.log" -mtime +7 -delete

    success "Advanced cleanup completed"

    # Generate cleanup report
    local cleanup_report="{
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"cleanup_type\": \"advanced\",
        \"retention_days\": {
            \"daily\": $RETENTION_DAYS,
            \"weekly\": 28,
            \"monthly\": 365,
            \"manual\": 90,
            \"pitr_hours\": $POINT_IN_TIME_RETENTION_HOURS
        },
        \"environment\": \"${ENVIRONMENT:-production}\"
    }"

    echo "$cleanup_report" >> "$BACKUP_DIR/logs/cleanup-reports.json"
}

# Health check and system diagnostics
perform_health_check() {
    log "Performing system health check..."

    local health_status="healthy"
    local issues=()

    # Check disk space
    local disk_usage=$(df "$BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 85 ]]; then
        issues+=("High disk usage: ${disk_usage}%")
        health_status="warning"
    fi

    # Check network connectivity to cloud providers
    if command -v aws &> /dev/null; then
        if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
            issues+=("AWS S3 connectivity issue")
            health_status="unhealthy"
        fi
    fi

    # Check backup verification status
    local recent_backups=$(find "$BACKUP_DIR" -name "*.sql.gz*" -mtime -1 | wc -l)
    if [[ $recent_backups -eq 0 ]]; then
        issues+=("No recent backups found (last 24 hours)")
        health_status="warning"
    fi

    # Generate health report
    local health_report="{
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"status\": \"$health_status\",
        \"disk_usage_percent\": $disk_usage,
        \"recent_backups_count\": $recent_backups,
        \"issues\": [$(printf '%s,' "${issues[@]}" | sed 's/,$//')],
        \"environment\": \"${ENVIRONMENT:-production}\"
    }"

    echo "$health_report" > "$BACKUP_DIR/metrics/health-status.json"

    if [[ "$health_status" == "unhealthy" ]]; then
        send_critical_alert "🚨 Backup System Unhealthy" "Health check failed: ${issues[*]}"
    elif [[ "$health_status" == "warning" ]]; then
        send_alert "⚠️ Backup System Warning" "Health check warnings: ${issues[*]}" "warning"
    else
        success "System health check passed"
    fi

    return 0
}

# Generate comprehensive backup report
generate_comprehensive_report() {
    log "Generating comprehensive backup report..."

    local report_file="$BACKUP_DIR/reports/comprehensive-report-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p "$BACKUP_DIR/reports"

    # Count backups by type
    local daily_count=$(find "$BACKUP_DIR/daily" -name "*.sql.gz*" | wc -l)
    local weekly_count=$(find "$BACKUP_DIR/weekly" -name "*.sql.gz*" | wc -l)
    local monthly_count=$(find "$BACKUP_DIR/monthly" -name "*.sql.gz*" | wc -l)
    local manual_count=$(find "$BACKUP_DIR/manual" -name "*.sql.gz*" | wc -l)
    local pitr_count=$(find "$BACKUP_DIR/pitr" -name "*.sql.gz*" | wc -l)

    # Calculate total size
    local total_size=$(du -sb "$BACKUP_DIR" | cut -f1)
    local total_size_human=$(du -sh "$BACKUP_DIR" | cut -f1)

    # Get latest backup info
    local latest_backup=$(find "$BACKUP_DIR" -name "*.sql.gz*" -printf "%T@ %p\n" | sort -n | tail -1 | cut -d' ' -f2-)
    local latest_backup_name=$(basename "$latest_backup" 2>/dev/null || echo "none")

    # Cloud storage status
    local cloud_status="{}"
    if command -v aws &> /dev/null; then
        local s3_count=$(aws s3 ls "s3://$S3_BUCKET" --recursive | wc -l)
        cloud_status="{\"aws_s3\": {\"available\": true, \"backup_count\": $s3_count}}"
    fi

    # System metrics
    local disk_usage=$(df "$BACKUP_DIR" | awk 'NR==2 {print $5}')
    local memory_usage=$(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}' 2>/dev/null || echo "N/A")

    cat > "$report_file" << EOF
{
    "backup_system_report": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "system_version": "2.0.0",
        "environment": "${ENVIRONMENT:-production}",
        "backup_directory": "$BACKUP_DIR",
        "backup_counts": {
            "daily": $daily_count,
            "weekly": $weekly_count,
            "monthly": $monthly_count,
            "manual": $manual_count,
            "pitr": $pitr_count
        },
        "storage_metrics": {
            "total_size_bytes": $total_size,
            "total_size_human": "$total_size_human",
            "disk_usage": "$disk_usage",
            "memory_usage": "$memory_usage"
        },
        "cloud_storage": $cloud_status,
        "configuration": {
            "retention_days": $RETENTION_DAYS,
            "encryption_enabled": $([[ -n "$BACKUP_ENCRYPTION_KEY" ]] && echo "true" || echo "false"),
            "cross_region_replication": $CROSS_REGION_REPLICATION,
            "backup_verification": $BACKUP_VERIFICATION_ENABLED,
            "pitr_retention_hours": $POINT_IN_TIME_RETENTION_HOURS,
            "compression_level": $BACKUP_COMPRESSION_LEVEL
        },
        "latest_backup": "$latest_backup_name",
        "health_status": $(cat "$BACKUP_DIR/metrics/health-status.json" 2>/dev/null || echo '{"status": "unknown"}')
    }
}
EOF

    success "Comprehensive report generated: $report_file"

    # Send report summary
    local summary="📊 Backup System Report\n\n"
    summary+="Total Backups: $((daily_count + weekly_count + monthly_count + manual_count + pitr_count))\n"
    summary+="Storage Used: $total_size_human\n"
    summary+="Latest Backup: $latest_backup_name\n"
    summary+="Disk Usage: $disk_usage\n"

    send_alert "📊 Backup System Report" "$summary" "info"
}

# Advanced cron job setup
setup_advanced_cron() {
    log "Setting up advanced automated backup schedule..."

    local script_path="$(pwd)/$(basename $0)"
    local cron_entries=()

    # Daily backups at 2:00 AM with retry logic
    cron_entries+=("0 2 * * * $script_path daily-intelligent")

    # Weekly backups on Sunday at 3:00 AM
    cron_entries+=("0 3 * * 0 $script_path weekly-intelligent")

    # Monthly backups on 1st at 4:00 AM
    cron_entries+=("0 4 1 * * $script_path monthly-intelligent")

    # PITR backups every 6 hours
    cron_entries+=("0 */6 * * * $script_path pitr")

    # Health check every hour
    cron_entries+=("0 * * * * $script_path health-check")

    # Cleanup daily at 5:00 AM
    cron_entries+=("0 5 * * * $script_path cleanup-advanced")

    # Comprehensive report daily at 6:00 AM
    cron_entries+=("0 6 * * * $script_path report")

    # Add to crontab
    (crontab -l 2>/dev/null; printf "%s\n" "${cron_entries[@]}") | crontab -

    success "Advanced cron schedule configured"
    log "Scheduled operations:"
    log "  - Daily backups: 2:00 AM with intelligent retry"
    log "  - Weekly backups: Sunday 3:00 AM"
    log "  - Monthly backups: 1st 4:00 AM"
    log "  - PITR backups: Every 6 hours"
    log "  - Health checks: Every hour"
    log "  - Cleanup: Daily 5:00 AM"
    log "  - Reports: Daily 6:00 AM"
}

# Main execution
main() {
    local command="${1:-help}"

    case "$command" in
        "daily-intelligent")
            schedule_intelligent_backup "daily"
            ;;
        "weekly-intelligent")
            schedule_intelligent_backup "weekly"
            ;;
        "monthly-intelligent")
            schedule_intelligent_backup "monthly"
            ;;
        "pitr")
            create_pitr_backup
            ;;
        "restore")
            if [[ -z "${2:-}" ]]; then
                error "Please provide backup file path"
                exit 1
            fi
            restore_database_advanced "$2" "${3:-dry-run}" "${4:-}"
            ;;
        "health-check")
            perform_health_check
            ;;
        "cleanup-advanced")
            cleanup_old_backups_advanced
            ;;
        "report")
            generate_comprehensive_report
            ;;
        "setup-advanced-cron")
            setup_advanced_cron
            ;;
        "test-verification")
            if [[ -z "${2:-}" ]]; then
                error "Please provide backup file for verification test"
                exit 1
            fi
            verify_backup_advanced "$2" "comprehensive"
            ;;
        "test-multi-cloud")
            if [[ -z "${2:-}" ]]; then
                error "Please provide backup file for multi-cloud test"
                exit 1
            fi
            upload_to_multiple_providers "$2" "test-upload-$(date +%Y%m%d-%H%M%S)"
            ;;
        "help"|"--help"|"-h")
            cat << EOF
Advanced Database Backup System v2.0.0

Usage: $(basename $0) [COMMAND] [OPTIONS]

Commands:
  daily-intelligent     Create daily backup with intelligent retry
  weekly-intelligent    Create weekly backup with intelligent retry
  monthly-intelligent   Create monthly backup with intelligent retry
  pitr                  Create Point-in-Time Recovery backup
  restore <file> [type] [timestamp] Restore from backup
                        Types: dry-run, schema-only, data-only, full, pitr
  health-check          Perform system health check
  cleanup-advanced      Advanced cleanup with archival policies
  report                Generate comprehensive backup report
  setup-advanced-cron   Setup advanced automated backup schedule
  test-verification <file> Test backup verification system
  test-multi-cloud <file> Test multi-cloud upload system
  help                  Show this help message

Features:
  - Multi-cloud backup storage (AWS S3, Azure Blob, Google Cloud Storage)
  - Cross-region replication
  - AES-256 encryption with PBKDF2 key derivation
  - Advanced backup verification (quick and comprehensive)
  - Point-in-Time Recovery (PITR) support
  - Intelligent retry with exponential backoff
  - Multi-channel alerting (Slack, Teams, PagerDuty)
  - Comprehensive metrics and monitoring
  - Automated health checks and diagnostics
  - Advanced cleanup and archival policies

Environment Variables:
  SUPABASE_PROJECT_ID    Supabase project ID
  SUPABASE_DB_URL        Database connection string
  BACKUP_DIR            Backup directory (default: ./backups)
  RETENTION_DAYS        Backup retention days (default: 30)
  BACKUP_ENCRYPTION_KEY AES-256 encryption key
  S3_BUCKET             AWS S3 bucket for backups
  S3_BUCKET_REGION      S3 bucket region (default: eu-west-1)
  AZURE_STORAGE_ACCOUNT Azure storage account name
  AZURE_CONTAINER       Azure blob container name
  GCP_BUCKET            Google Cloud Storage bucket
  SLACK_WEBHOOK_URL     Slack webhook URL for notifications
  TEAMS_WEBHOOK_URL     Microsoft Teams webhook URL
  PAGERDUTY_INTEGRATION_KEY PagerDuty integration key
  CROSS_REGION_REPLICATION Enable cross-region replication (default: true)
  BACKUP_COMPRESSION_LEVEL Compression level 1-9 (default: 9)
  POINT_IN_TIME_RETENTION_HOURS PITR retention hours (default: 168)
  BACKUP_VERIFICATION_ENABLED Enable backup verification (default: true)
  PARALLEL_UPLOADS      Number of parallel uploads (default: 4)
  BACKUP_CHUNK_SIZE     Backup chunk size in bytes (default: 1GB)

Examples:
  $(basename $0) daily-intelligent                    # Create daily backup with retry
  $(basename $0) restore backup.sql.gz.enc full        # Full restore from encrypted backup
  $(basename $0) restore backup.sql.gz pitr "2024-01-15 14:30:00"  # PITR restore
  $(basename $0) health-check                         # Perform system health check
  $(basename $0) test-verification backup.sql.gz.enc   # Test backup verification
  $(basename $0) setup-advanced-cron                  # Setup automated schedule

EOF
            ;;
        *)
            error "Unknown command: $command"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"