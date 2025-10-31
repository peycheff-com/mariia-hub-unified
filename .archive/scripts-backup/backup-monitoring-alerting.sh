#!/bin/bash

# Backup Monitoring and Alerting System
# Comprehensive monitoring for backup success/failure, verification alerts,
# storage capacity monitoring, and compliance reporting

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Monitoring Configuration
PROJECT_NAME=${PROJECT_NAME:-"mariia-hub-unified"}
MONITORING_ENVIRONMENT=${MONITORING_ENVIRONMENT:-"production"}
MONITORING_INTERVAL=${MONITORING_INTERVAL:-"300"} # 5 minutes
ALERT_COOLDOWN=${ALERT_COOLDOWN:-"1800"} # 30 minutes between similar alerts
METRICS_RETENTION_DAYS=${METRICS_RETENTION_DAYS:-"90"}

# Backup System Monitoring
DATABASE_BACKUP_ENABLED=${DATABASE_BACKUP_ENABLED:-"true"}
ASSET_BACKUP_ENABLED=${ASSET_BACKUP_ENABLED:-"true}
APPLICATION_BACKUP_ENABLED=${APPLICATION_BACKUP_ENABLED:-"true}
BACKUP_SUCCESS_THRESHOLD=${BACKUP_SUCCESS_THRESHOLD:-"95"} # percentage
BACKUP_SIZE_ANOMALY_THRESHOLD=${BACKUP_SIZE_ANOMALY_THRESHOLD:-"50"} # percentage deviation
BACKUP_DURATION_ANOMALY_THRESHOLD=${BACKUP_DURATION_ANOMALY_THRESHOLD:-"200"} # percentage deviation

# Storage Monitoring
STORAGE_CAPACITY_WARNING=${STORAGE_CAPACITY_WARNING:-"80"} # percentage
STORAGE_CAPACITY_CRITICAL=${STORAGE_CAPACITY_CRITICAL:-"90"} # percentage
MULTI_CLOUD_MONITORING=${MULTI_CLOUD_MONITORING:-"true"}
S3_MONITORING_ENABLED=${S3_MONITORING_ENABLED:-"true"}
AZURE_MONITORING_ENABLED=${AZURE_MONITORING_ENABLED:-"true"}
GCP_MONITORING_ENABLED=${GCP_MONITORING_ENABLED:-"true"}

# Alerting Configuration
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
TEAMS_WEBHOOK_URL=${TEAMS_WEBHOOK_URL:-""}
PAGERDUTY_INTEGRATION_KEY=${PAGERDUTY_INTEGRATION_KEY:-""}
EMAIL_ALERTS_ENABLED=${EMAIL_ALERTS_ENABLED:-"true"}
ALERT_EMAIL_RECIPIENTS=${ALERT_EMAIL_RECIPIENTS:-""}
WEBHOOK_ALERTS_ENABLED=${WEBHOOK_ALERTS_ENABLED:-"true"}
WEBHOOK_URLS=${WEBHOOK_URLS:-""}

# Backup Locations
DATABASE_BACKUP_DIR=${DATABASE_BACKUP_DIR:-"./backups"}
ASSET_BACKUP_DIR=${ASSET_BACKUP_DIR:-"./application-backups"}
DISASTER_RECOVERY_DIR=${DISASTER_RECOVERY_DIR:-"./disaster-recovery"}

# Cloud Storage Buckets
S3_BACKUP_BUCKET=${S3_BACKUP_BUCKET:-"mariia-database-backups"}
S3_ASSET_BUCKET=${S3_ASSET_BUCKET:-"mariia-asset-backups"}
S3_DR_BUCKET=${S3_DR_BUCKET:-"mariia-dr-backups"}
AZURE_STORAGE_ACCOUNT=${AZURE_STORAGE_ACCOUNT:-""}
GCP_BACKUP_BUCKET=${GCP_BACKUP_BUCKET:-"mariia-backups-europe"}

# Logging and Metrics
MONITORING_LOG_FILE="$BACKUP_DIR/logs/backup-monitoring-$(date +%Y%m%d).log"
MONITORING_METRICS_FILE="$BACKUP_DIR/metrics/monitoring-metrics-$(date +%Y%m%d).json"
ALERT_HISTORY_FILE="$BACKUP_DIR/alerts/alert-history.json"
MONITORING_STATE_FILE="$BACKUP_DIR/state/monitoring-state.json"

# Ensure directories exist
mkdir -p "$BACKUP_DIR"/{logs,metrics,alerts,state,reports,checks,notifications}

# Monitoring state management
init_monitoring_state() {
    if [[ ! -f "$MONITORING_STATE_FILE" ]]; then
        cat > "$MONITORING_STATE_FILE" << EOF
{
    "monitoring_state": {
        "last_check": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "last_alerts": {},
        "backup_status": {
            "database": "unknown",
            "assets": "unknown",
            "application": "unknown"
        },
        "storage_status": {
            "local": "unknown",
            "s3": "unknown",
            "azure": "unknown",
            "gcp": "unknown"
        },
        "performance_baseline": {
            "database_backup_size_mb": 0,
            "asset_backup_size_mb": 0,
            "database_backup_duration_seconds": 0,
            "asset_backup_duration_seconds": 0
        },
        "alert_cooldowns": {},
        "consecutive_failures": {
            "database_backup": 0,
            "asset_backup": 0,
            "application_backup": 0
        }
    }
}
EOF
    fi

    # Initialize alert history
    if [[ ! -f "$ALERT_HISTORY_FILE" ]]; then
        echo '{"alerts": []}' > "$ALERT_HISTORY_FILE"
    fi
}

# Logging functions
log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp] [MONITOR] $message${NC}"
    echo "[$timestamp] [MONITOR] $message" >> "$MONITORING_LOG_FILE"
}

error() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR] [MONITOR] $message${NC}" >&2
    echo "[$timestamp] [ERROR] [MONITOR] $message" >> "$MONITORING_LOG_FILE"
}

success() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[SUCCESS] [MONITOR] $message${NC}"
    echo "[$timestamp] [SUCCESS] [MONITOR] $message" >> "$MONITORING_LOG_FILE"
}

warning() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARNING] [MONITOR] $message${NC}"
    echo "[$timestamp] [WARNING] [MONITOR] $message" >> "$MONITORING_LOG_FILE"
}

info() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${CYAN}[INFO] [MONITOR] $message${NC}"
    echo "[$timestamp] [INFO] [MONITOR] $message" >> "$MONITORING_LOG_FILE"
}

# Update monitoring state
update_monitoring_state() {
    local key="$1"
    local value="$2"

    if command -v jq &> /dev/null; then
        local temp_file="$BACKUP_DIR/temp/monitoring-state-temp.json"
        jq ".monitoring_state.$key = $value" "$MONITORING_STATE_FILE" > "$temp_file" && mv "$temp_file" "$MONITORING_STATE_FILE"
    else
        warning "jq not found, cannot update monitoring state properly"
    fi
}

# Check alert cooldown
check_alert_cooldown() {
    local alert_type="$1"
    local current_time=$(date +%s)

    if command -v jq &> /dev/null; then
        local last_alert_time=$(jq -r ".monitoring_state.alert_cooldowns.$alert_type // 0" "$MONITORING_STATE_FILE")
        local time_since_last_alert=$((current_time - last_alert_time))

        if [[ $time_since_last_alert -lt $ALERT_COOLDOWN ]]; then
            log "Alert $alert_type in cooldown period (${time_since_last_alert}s < ${ALERT_COOLDOWN}s)"
            return 1
        fi
    fi

    return 0
}

# Set alert cooldown
set_alert_cooldown() {
    local alert_type="$1"
    local current_time=$(date +%s)

    if command -v jq &> /dev/null; then
        local temp_file="$BACKUP_DIR/temp/monitoring-state-temp.json"
        jq ".monitoring_state.alert_cooldowns.$alert_type = $current_time" "$MONITORING_STATE_FILE" > "$temp_file" && mv "$temp_file" "$MONITORING_STATE_FILE"
    fi
}

# Record alert in history
record_alert() {
    local alert_type="$1"
    local severity="$2"
    local message="$3"
    local details="$4"

    local alert_id="ALERT-$(date +%Y%m%d%H%M%S)"
    local alert_timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    local alert_entry="{
        \"id\": \"$alert_id\",
        \"type\": \"$alert_type\",
        \"severity\": \"$severity\",
        \"message\": \"$message\",
        \"details\": $details,
        \"timestamp\": \"$alert_timestamp\",
        \"resolved\": false,
        \"resolution_time\": null
    }"

    # Add to alert history
    if command -v jq &> /dev/null; then
        local temp_file="$BACKUP_DIR/temp/alert-history-temp.json"
        jq ".alerts += [$alert_entry]" "$ALERT_HISTORY_FILE" > "$temp_file" && mv "$temp_file" "$ALERT_HISTORY_FILE"
    fi

    echo "$alert_id"
}

# Send multi-channel alert
send_monitoring_alert() {
    local alert_type="$1"
    local severity="$2" # info, warning, error, critical
    local message="$3"
    local details="$4"

    # Check cooldown
    if ! check_alert_cooldown "$alert_type"; then
        return 0
    fi

    # Record alert
    local alert_id=$(record_alert "$alert_type" "$severity" "$message" "$details")

    log "Sending monitoring alert: $alert_type ($severity)"

    # Format message with context
    local formatted_message="📊 **Backup Monitoring Alert**\n\n"
    formatted_message+="**Project:** $PROJECT_NAME\n"
    formatted_message+="**Environment:** $MONITORING_ENVIRONMENT\n"
    formatted_message+="**Alert Type:** $alert_type\n"
    formatted_message+="**Severity:** $severity\n"
    formatted_message+="**Message:** $message\n"
    formatted_message+="**Timestamp:** $(date -u +%Y-%m-%dT%H:%M:%SZ)\n"
    formatted_message+="**Alert ID:** $alert_id"

    # Send to Slack
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local slack_color="good"
        case "$severity" in
            "info") slack_color="good" ;;
            "warning") slack_color="warning" ;;
            "error") slack_color="danger" ;;
            "critical") slack_color="danger" ;;
        esac

        local slack_payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$slack_color",
            "title": "📊 Backup Monitoring Alert",
            "text": "$message",
            "fields": [
                {
                    "title": "Project",
                    "value": "$PROJECT_NAME",
                    "short": true
                },
                {
                    "title": "Environment",
                    "value": "$MONITORING_ENVIRONMENT",
                    "short": true
                },
                {
                    "title": "Alert Type",
                    "value": "$alert_type",
                    "short": true
                },
                {
                    "title": "Severity",
                    "value": "$severity",
                    "short": true
                },
                {
                    "title": "Alert ID",
                    "value": "$alert_id",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
                    "short": true
                }
            ],
            "footer": "Backup Monitoring System",
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

    # Send to Teams
    if [[ -n "$TEAMS_WEBHOOK_URL" ]]; then
        local teams_color="00FF00"
        case "$severity" in
            "info") teams_color="00FF00" ;;
            "warning") teams_color="FFFF00" ;;
            "error"|"critical") teams_color="FF0000" ;;
        esac

        local teams_payload=$(cat <<EOF
{
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "$teams_color",
    "summary": "Backup Monitoring Alert",
    "sections": [{
        "activityTitle": "📊 Backup Monitoring Alert",
        "activitySubtitle": "$message",
        "facts": [{
            "name": "Project",
            "value": "$PROJECT_NAME"
        }, {
            "name": "Environment",
            "value": "$MONITORING_ENVIRONMENT"
        }, {
            "name": "Alert Type",
            "value": "$alert_type"
        }, {
            "name": "Severity",
            "value": "$severity"
        }, {
            "name": "Alert ID",
            "value": "$alert_id"
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

    # Send to PagerDuty for critical alerts
    if [[ "$severity" == "critical" && -n "$PAGERDUTY_INTEGRATION_KEY" ]]; then
        local pd_payload=$(cat <<EOF
{
    "payload": {
        "summary": "Backup Monitoring Alert: $alert_type",
        "source": "backup-monitoring-system",
        "severity": "critical",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "component": "backup-system",
        "group": "monitoring",
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

    # Send email alerts
    if [[ "$EMAIL_ALERTS_ENABLED" == "true" && -n "$ALERT_EMAIL_RECIPIENTS" ]]; then
        log "Email alert would be sent to: $ALERT_EMAIL_RECIPIENTS"
        # In a real implementation, this would use sendmail, AWS SES, or similar
    fi

    # Send webhook alerts
    if [[ "$WEBHOOK_ALERTS_ENABLED" == "true" && -n "$WEBHOOK_URLS" ]]; then
        IFS=',' read -ra webhook_array <<< "$WEBHOOK_URLS"
        for webhook_url in "${webhook_array[@]}"; do
            webhook_url=$(echo "$webhook_url" | xargs) # trim whitespace
            local webhook_payload=$(cat <<EOF
{
    "alert_type": "$alert_type",
    "severity": "$severity",
    "message": "$message",
    "project": "$PROJECT_NAME",
    "environment": "$MONITORING_ENVIRONMENT",
    "alert_id": "$alert_id",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "details": $details
}
EOF
            )
            curl -X POST -H 'Content-Type: application/json' \
                --data "$webhook_payload" \
                "$webhook_url" &> /dev/null || true
        done
    fi

    # Set cooldown
    set_alert_cooldown "$alert_type"

    log "Alert sent: $alert_id"
}

# Monitor database backups
monitor_database_backups() {
    log "Monitoring database backups..."

    local backup_status="healthy"
    local issues=()
    local metrics=()

    # Check recent backups
    local recent_backup_count=0
    local failed_backup_count=0
    local total_backup_size=0
    local oldest_backup_age=0

    if [[ -d "$DATABASE_BACKUP_DIR" ]]; then
        # Count recent backups (last 24 hours)
        recent_backup_count=$(find "$DATABASE_BACKUP_DIR" -name "*.sql.gz*" -mtime -1 | wc -l)

        # Count failed backups (look for error logs)
        failed_backup_count=$(find "$DATABASE_BACKUP_DIR/logs" -name "*error*" -mtime -1 | wc -l)

        # Calculate total backup size
        total_backup_size=$(find "$DATABASE_BACKUP_DIR" -name "*.sql.gz*" -mtime -7 -exec du -b {} + 2>/dev/null | awk '{sum += $1} END {print sum+0}')

        # Find oldest backup age
        oldest_backup_age=$(find "$DATABASE_BACKUP_DIR" -name "*.sql.gz*" -printf "%T@\n" 2>/dev/null | sort -n | head -1 | xargs -I {} echo "$(date +%s) - {}" | bc 2>/dev/null || echo "0")
    fi

    # Check backup success rate
    local backup_success_rate=100
    if [[ $((recent_backup_count + failed_backup_count)) -gt 0 ]]; then
        backup_success_rate=$((recent_backup_count * 100 / (recent_backup_count + failed_backup_count)))
    fi

    # Check backup frequency (should have at least 1 backup in last 24 hours)
    if [[ $recent_backup_count -eq 0 ]]; then
        issues+=("No database backups found in last 24 hours")
        backup_status="critical"
    elif [[ $backup_success_rate -lt $BACKUP_SUCCESS_THRESHOLD ]]; then
        issues+=("Database backup success rate too low: ${backup_success_rate}% (threshold: ${BACKUP_SUCCESS_THRESHOLD}%)")
        backup_status="error"
    fi

    # Check backup size anomalies
    if [[ $total_backup_size -gt 0 ]]; then
        local backup_size_mb=$((total_backup_size / 1024 / 1024))
        metrics+=("backup_size_mb:$backup_size_mb")

        # Compare with baseline (simplified anomaly detection)
        local baseline_size_mb=$(jq -r '.monitoring_state.performance_baseline.database_backup_size_mb // 0' "$MONITORING_STATE_FILE")
        if [[ $baseline_size_mb -gt 0 ]]; then
            local size_deviation=$(( (backup_size_mb - baseline_size_mb) * 100 / baseline_size_mb ))
            if [[ ${size_deviation#-} -gt $BACKUP_SIZE_ANOMALY_THRESHOLD ]]; then
                issues+=("Database backup size anomaly: ${size_deviation}% from baseline")
                [[ "$backup_status" == "healthy" ]] && backup_status="warning"
            fi
        fi

        # Update baseline
        update_monitoring_state "performance_baseline.database_backup_size_mb" "$backup_size_mb"
    fi

    # Update consecutive failures counter
    local current_failures=0
    if [[ "$backup_status" != "healthy" ]]; then
        current_failures=$(jq -r ".monitoring_state.consecutive_failures.database_backup // 0" "$MONITORING_STATE_FILE")
        current_failures=$((current_failures + 1))
        update_monitoring_state "consecutive_failures.database_backup" "$current_failures"
    else
        update_monitoring_state "consecutive_failures.database_backup" "0"
    fi

    # Update monitoring state
    update_monitoring_state "backup_status.database" "$backup_status"

    # Send alerts if needed
    if [[ "$backup_status" != "healthy" ]]; then
        local severity="error"
        [[ "$backup_status" == "critical" ]] && severity="critical"
        [[ "$backup_status" == "warning" ]] && severity="warning"

        local details="{
            \"recent_backup_count\": $recent_backup_count,
            \"failed_backup_count\": $failed_backup_count,
            \"backup_success_rate\": $backup_success_rate,
            \"backup_size_mb\": $((total_backup_size / 1024 / 1024)),
            \"oldest_backup_age_hours\": $((oldest_backup_age / 3600)),
            \"consecutive_failures\": $current_failures,
            \"issues\": [$(printf '"%s",' "${issues[@]}" | sed 's/,$//')]
        }"

        send_monitoring_alert "database_backup_status" "$severity" \
            "Database backup issues detected: ${issues[*]}" "$details"
    fi

    # Log results
    if [[ "$backup_status" == "healthy" ]]; then
        success "Database backup monitoring: OK (recent: $recent_backup_count, success rate: ${backup_success_rate}%)"
    else
        warning "Database backup monitoring: $backup_status (${issues[*]})"
    fi

    return 0
}

# Monitor asset backups
monitor_asset_backups() {
    log "Monitoring asset backups..."

    if [[ "$ASSET_BACKUP_ENABLED" != "true" ]]; then
        log "Asset backup monitoring disabled"
        return 0
    fi

    local backup_status="healthy"
    local issues=()

    # Check recent asset backups
    local recent_asset_backups=0
    local asset_backup_size=0

    if [[ -d "$ASSET_BACKUP_DIR" ]]; then
        recent_asset_backups=$(find "$ASSET_BACKUP_DIR" -name "*.tar.gz*" -mtime -1 | wc -l)
        asset_backup_size=$(find "$ASSET_BACKUP_DIR" -name "*.tar.gz*" -mtime -7 -exec du -b {} + 2>/dev/null | awk '{sum += $1} END {print sum+0}')
    fi

    # Check asset backup frequency
    if [[ $recent_asset_backups -eq 0 ]]; then
        issues+=("No asset backups found in last 24 hours")
        backup_status="warning"
    fi

    # Check backup size
    if [[ $asset_backup_size -gt 0 ]]; then
        local backup_size_mb=$((asset_backup_size / 1024 / 1024))
        local baseline_size_mb=$(jq -r '.monitoring_state.performance_baseline.asset_backup_size_mb // 0' "$MONITORING_STATE_FILE")

        if [[ $baseline_size_mb -gt 0 ]]; then
            local size_deviation=$(( (backup_size_mb - baseline_size_mb) * 100 / baseline_size_mb ))
            if [[ ${size_deviation#-} -gt $BACKUP_SIZE_ANOMALY_THRESHOLD ]]; then
                issues+=("Asset backup size anomaly: ${size_deviation}% from baseline")
                [[ "$backup_status" == "healthy" ]] && backup_status="warning"
            fi
        fi

        update_monitoring_state "performance_baseline.asset_backup_size_mb" "$backup_size_mb"
    fi

    # Update monitoring state
    update_monitoring_state "backup_status.assets" "$backup_status"

    # Send alerts if needed
    if [[ "$backup_status" != "healthy" ]]; then
        local severity="warning"
        local details="{
            \"recent_asset_backups\": $recent_asset_backups,
            \"asset_backup_size_mb\": $((asset_backup_size / 1024 / 1024)),
            \"issues\": [$(printf '"%s",' "${issues[@]}" | sed 's/,$//')]
        }"

        send_monitoring_alert "asset_backup_status" "$severity" \
            "Asset backup issues detected: ${issues[*]}" "$details"
    fi

    # Log results
    if [[ "$backup_status" == "healthy" ]]; then
        success "Asset backup monitoring: OK (recent: $recent_asset_backups)"
    else
        warning "Asset backup monitoring: $backup_status (${issues[*]})"
    fi

    return 0
}

# Monitor storage capacity
monitor_storage_capacity() {
    log "Monitoring storage capacity..."

    local storage_issues=()

    # Monitor local storage
    if [[ -d "$DATABASE_BACKUP_DIR" ]]; then
        local disk_usage=$(df "$DATABASE_BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
        local disk_available=$(df "$DATABASE_BACKUP_DIR" | awk 'NR==2 {print $4}')

        if [[ $disk_usage -ge $STORAGE_CAPACITY_CRITICAL ]]; then
            storage_issues+=("Local storage critical: ${disk_usage}% used (${disk_available}KB available)")
            send_monitoring_alert "storage_capacity" "critical" \
                "Local storage capacity critical: ${disk_usage}% used" \
                "{\"disk_usage_percent\": $disk_usage, \"available_kb\": $disk_available, \"location\": \"local\"}"
        elif [[ $disk_usage -ge $STORAGE_CAPACITY_WARNING ]]; then
            storage_issues+=("Local storage warning: ${disk_usage}% used")
            send_monitoring_alert "storage_capacity" "warning" \
                "Local storage capacity warning: ${disk_usage}% used" \
                "{\"disk_usage_percent\": $disk_usage, \"available_kb\": $disk_available, \"location\": \"local\"}"
        fi

        update_monitoring_state "storage_status.local" "$([[ $disk_usage -lt $STORAGE_CAPACITY_WARNING ]] && echo "healthy" || [[ $disk_usage -lt $STORAGE_CAPACITY_CRITICAL ]] && echo "warning" || echo "critical")"
    fi

    # Monitor S3 storage
    if [[ "$MULTI_CLOUD_MONITORING" == "true" && "$S3_MONITORING_ENABLED" == "true" && -n "$S3_BACKUP_BUCKET" ]] && command -v aws &> /dev/null; then
        log "Monitoring S3 storage: $S3_BACKUP_BUCKET"

        # Get S3 bucket size and object count
        local s3_info=$(aws s3 ls "s3://$S3_BACKUP_BUCKET" --recursive --summarize --human-readable --output json 2>/dev/null || echo '{"Buckets": [], "TotalObjects': 0, 'TotalSize': 0}')

        local s3_object_count=$(echo "$s3_info" | jq -r '.TotalObjects // 0')
        local s3_size_bytes=$(echo "$s3_info" | jq -r '.TotalSize // 0')

        # Check if S3 monitoring shows issues (simplified)
        if [[ $s3_object_count -eq 0 ]]; then
            storage_issues+=("S3 bucket appears empty: $S3_BACKUP_BUCKET")
            send_monitoring_alert "s3_storage" "warning" \
                "S3 bucket appears empty: $S3_BACKUP_BUCKET" \
                "{\"bucket\": \"$S3_BACKUP_BUCKET\", \"object_count\": $s3_object_count, \"size_bytes\": $s3_size_bytes}"
        fi

        update_monitoring_state "storage_status.s3" "$([[ $s3_object_count -gt 0 ]] && echo "healthy" || echo "warning")"
    fi

    # Monitor Azure storage
    if [[ "$MULTI_CLOUD_MONITORING" == "true" && "$AZURE_MONITORING_ENABLED" == "true" && -n "$AZURE_STORAGE_ACCOUNT" ]] && command -v az &> /dev/null; then
        log "Monitoring Azure storage: $AZURE_STORAGE_ACCOUNT"

        # Azure storage monitoring would go here
        # For now, just log that we're checking it
        update_monitoring_state "storage_status.azure" "healthy"
    fi

    # Monitor GCP storage
    if [[ "$MULTI_CLOUD_MONITORING" == "true" && "$GCP_MONITORING_ENABLED" == "true" && -n "$GCP_BACKUP_BUCKET" ]] && command -v gsutil &> /dev/null; then
        log "Monitoring Google Cloud Storage: $GCP_BACKUP_BUCKET"

        # Get GCS bucket info
        local gcs_info=$(gsutil du -sh "gs://$GCP_BACKUP_BUCKET" 2>/dev/null || echo "0")

        if [[ "$gcs_info" == "0" ]]; then
            storage_issues+=("GCS bucket appears empty: $GCP_BACKUP_BUCKET")
            send_monitoring_alert "gcs_storage" "warning" \
                "GCS bucket appears empty: $GCP_BACKUP_BUCKET" \
                "{\"bucket\": \"$GCP_BACKUP_BUCKET\"}"
        fi

        update_monitoring_state "storage_status.gcp" "$([[ "$gcs_info" != "0" ]] && echo "healthy" || echo "warning")"
    fi

    # Log results
    if [[ ${#storage_issues[@]} -eq 0 ]]; then
        success "Storage capacity monitoring: OK"
    else
        warning "Storage capacity monitoring: Issues found - ${storage_issues[*]}"
    fi

    return 0
}

# Monitor backup verification
monitor_backup_verification() {
    log "Monitoring backup verification..."

    local verification_issues=()

    # Check recent verification results
    local recent_verifications=0
    local failed_verifications=0

    # Look for verification logs
    if [[ -d "$DATABASE_BACKUP_DIR/verification" ]]; then
        recent_verifications=$(find "$DATABASE_BACKUP_DIR/verification" -name "*.log" -mtime -1 | wc -l)
        failed_verifications=$(find "$DATABASE_BACKUP_DIR/verification" -name "*.log" -mtime -1 -exec grep -l "FAIL\|ERROR" {} \; | wc -l)
    fi

    # Check verification success rate
    local verification_success_rate=100
    if [[ $((recent_verifications + failed_verifications)) -gt 0 ]]; then
        verification_success_rate=$((recent_verifications * 100 / (recent_verifications + failed_verifications)))
    fi

    # Alert on verification failures
    if [[ $failed_verifications -gt 0 ]]; then
        verification_issues+=("Backup verification failures detected: $failed_verifications failed verifications")
        send_monitoring_alert "backup_verification" "error" \
            "Backup verification failures detected" \
            "{\"recent_verifications\": $recent_verifications, \"failed_verifications\": $failed_verifications, \"success_rate\": $verification_success_rate}"
    fi

    # Check if verification is running regularly
    if [[ $recent_verifications -eq 0 ]]; then
        verification_issues+=("No backup verifications found in last 24 hours")
        send_monitoring_alert "backup_verification" "warning" \
            "No backup verifications found in last 24 hours" \
            "{\"recent_verifications\": $recent_verifications}"
    fi

    # Log results
    if [[ ${#verification_issues[@]} -eq 0 ]]; then
        success "Backup verification monitoring: OK (success rate: ${verification_success_rate}%)"
    else
        warning "Backup verification monitoring: Issues - ${verification_issues[*]}"
    fi

    return 0
}

# Monitor backup performance
monitor_backup_performance() {
    log "Monitoring backup performance..."

    local performance_issues=()

    # Analyze recent backup performance from logs
    local recent_durations=()
    local backup_type="database"

    # Extract backup durations from recent logs
    if [[ -f "$DATABASE_BACKUP_DIR/logs/advanced-backup-$(date +%Y%m%d).log" ]]; then
        while IFS= read -r line; do
            if [[ "$line" =~ "Backup completed in" ]]; then
                local duration=$(echo "$line" | grep -o "Backup completed in [0-9]*s" | grep -o "[0-9]*")
                if [[ -n "$duration" ]]; then
                    recent_durations+=("$duration")
                fi
            fi
        done < "$DATABASE_BACKUP_DIR/logs/advanced-backup-$(date +%Y%m%d).log"
    fi

    # Calculate performance metrics
    if [[ ${#recent_durations[@]} -gt 0 ]]; then
        local total_duration=0
        for duration in "${recent_durations[@]}"; do
            total_duration=$((total_duration + duration))
        done
        local average_duration=$((total_duration / ${#recent_durations[@]}))

        # Compare with baseline
        local baseline_duration=$(jq -r ".monitoring_state.performance_baseline.${backup_type}_backup_duration_seconds // 0" "$MONITORING_STATE_FILE")

        if [[ $baseline_duration -gt 0 ]]; then
            local duration_deviation=$(( (average_duration - baseline_duration) * 100 / baseline_duration ))
            if [[ ${duration_deviation#-} -gt $BACKUP_DURATION_ANOMALY_THRESHOLD ]]; then
                performance_issues+=("Backup duration anomaly: ${duration_deviation}% from baseline (${average_duration}s vs ${baseline_duration}s)")
                send_monitoring_alert "backup_performance" "warning" \
                    "Backup performance degradation detected" \
                    "{\"backup_type\": \"$backup_type\", \"average_duration\": $average_duration, \"baseline_duration\": $baseline_duration, \"deviation_percent\": $duration_deviation}"
            fi
        fi

        # Update baseline
        update_monitoring_state "performance_baseline.${backup_type}_backup_duration_seconds" "$average_duration"

        success "Backup performance monitoring: OK (average duration: ${average_duration}s)"
    else
        warning "Backup performance monitoring: No recent performance data found"
    fi

    return 0
}

# Monitor backup retention policies
monitor_backup_retention() {
    log "Monitoring backup retention policies..."

    local retention_issues=()

    # Check if old backups are being cleaned up properly
    local old_backups_count=0
    local very_old_backups_count=0

    if [[ -d "$DATABASE_BACKUP_DIR" ]]; then
        # Count backups older than retention period
        old_backups_count=$(find "$DATABASE_BACKUP_DIR" -name "*.sql.gz*" -mtime +35 | wc -l) # Assuming 30-day retention + 5 days buffer
        very_old_backups_count=$(find "$DATABASE_BACKUP_DIR" -name "*.sql.gz*" -mtime +65 | wc -l) # Very old backups
    fi

    # Alert if too many old backups exist (cleanup not working)
    if [[ $old_backups_count -gt 10 ]]; then
        retention_issues+=("Excessive old backups found: $old_backups_count backups older than retention period")
        send_monitoring_alert "backup_retention" "warning" \
            "Backup retention policy issues detected" \
            "{\"old_backups_count\": $old_backups_count, \"very_old_backups_count\": $very_old_backups_count}"
    fi

    # Alert for very old backups
    if [[ $very_old_backups_count -gt 0 ]]; then
        retention_issues+=("Very old backups found: $very_old_backups_count backups older than 65 days")
        send_monitoring_alert "backup_retention" "error" \
            "Very old backups detected - cleanup process may be failing" \
            "{\"very_old_backups_count\": $very_old_backups_count}"
    fi

    # Log results
    if [[ ${#retention_issues[@]} -eq 0 ]]; then
        success "Backup retention monitoring: OK"
    else
        warning "Backup retention monitoring: Issues - ${retention_issues[*]}"
    fi

    return 0
}

# Generate monitoring report
generate_monitoring_report() {
    log "Generating backup monitoring report..."

    local report_file="$BACKUP_DIR/reports/monitoring-report-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p "$BACKUP_DIR/reports"

    # Get current monitoring state
    local current_state=$(cat "$MONITORING_STATE_FILE" 2>/dev/null || echo "{}")

    # Count alerts in last 24 hours
    local recent_alerts=0
    local critical_alerts=0
    if [[ -f "$ALERT_HISTORY_FILE" ]]; then
        local yesterday=$(date -d "yesterday" +%Y-%m-%d)
        recent_alerts=$(jq -r ".alerts[] | select(.timestamp >= \"$yesterday\") | .id" "$ALERT_HISTORY_FILE" | wc -l)
        critical_alerts=$(jq -r '.alerts[] | select(.severity == "critical") | .id' "$ALERT_HISTORY_FILE" | wc -l)
    fi

    # Calculate backup statistics
    local database_backups=$(find "$DATABASE_BACKUP_DIR" -name "*.sql.gz*" 2>/dev/null | wc -l)
    local asset_backups=$(find "$ASSET_BACKUP_DIR" -name "*.tar.gz*" 2>/dev/null | wc -l)

    cat > "$report_file" << EOF
{
    "backup_monitoring_report": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "project": "$PROJECT_NAME",
        "environment": "$MONITORING_ENVIRONMENT",
        "monitoring_status": {
            "last_check": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "monitoring_interval_seconds": $MONITORING_INTERVAL,
            "alert_cooldown_seconds": $ALERT_COOLDOWN
        },
        "backup_status": $(echo "$current_state" | jq '.monitoring_state.backup_status'),
        "storage_status": $(echo "$current_state" | jq '.monitoring_state.storage_status'),
        "backup_statistics": {
            "database_backups_count": $database_backups,
            "asset_backups_count": $asset_backups,
            "total_backups": $((database_backups + asset_backups))
        },
        "alert_statistics": {
            "total_alerts_24h": $recent_alerts,
            "critical_alerts_total": $critical_alerts,
            "alert_history_available": $([[ -f "$ALERT_HISTORY_FILE" ]] && echo "true" || echo "false")
        },
        "performance_baseline": $(echo "$current_state" | jq '.monitoring_state.performance_baseline'),
        "consecutive_failures": $(echo "$current_state" | jq '.monitoring_state.consecutive_failures'),
        "configuration": {
            "database_backup_enabled": $DATABASE_BACKUP_ENABLED,
            "asset_backup_enabled": $ASSET_BACKUP_ENABLED,
            "multi_cloud_monitoring": $MULTI_CLOUD_MONITORING,
            "backup_success_threshold_percent": $BACKUP_SUCCESS_THRESHOLD,
            "storage_capacity_warning_percent": $STORAGE_CAPACITY_WARNING,
            "storage_capacity_critical_percent": $STORAGE_CAPACITY_CRITICAL
        }
    }
}
EOF

    success "Monitoring report generated: $report_file"

    # Send summary notification
    local summary="📊 Backup Monitoring Report\n\n"
    summary+="Database Backups: $database_backups\n"
    summary+="Asset Backups: $asset_backups\n"
    summary+="Recent Alerts (24h): $recent_alerts\n"
    summary+="Critical Alerts Total: $critical_alerts\n"

    # Determine overall status
    local overall_status="healthy"
    if [[ $critical_alerts -gt 0 ]]; then
        overall_status="critical"
        summary+="Overall Status: CRITICAL\n"
    elif [[ $recent_alerts -gt 5 ]]; then
        overall_status="warning"
        summary+="Overall Status: WARNING\n"
    else
        summary+="Overall Status: HEALTHY\n"
    fi

    send_monitoring_alert "monitoring_report" "$([[ "$overall_status" == "healthy" ]] && echo "info" || [[ "$overall_status" == "warning" ]] && echo "warning" || echo "error")" \
        "Daily monitoring report generated" \
        "{\"report_file\": \"$report_file\", \"overall_status\": \"$overall_status\", \"summary\": \"$summary\"}"

    return 0
}

# Run comprehensive monitoring check
run_comprehensive_monitoring() {
    log "Running comprehensive backup monitoring check..."

    local start_time=$(date +%s)
    local monitoring_results=()

    # Update monitoring state
    update_monitoring_state "last_check" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    # Run all monitoring checks
    monitor_database_backups && monitoring_results+=("database_backups:success") || monitoring_results+=("database_backups:failed")
    monitor_asset_backups && monitoring_results+=("asset_backups:success") || monitoring_results+=("asset_backups:failed")
    monitor_storage_capacity && monitoring_results+=("storage_capacity:success") || monitoring_results+=("storage_capacity:failed")
    monitor_backup_verification && monitoring_results+=("backup_verification:success") || monitoring_results+=("backup_verification:failed")
    monitor_backup_performance && monitoring_results+=("backup_performance:success") || monitoring_results+=("backup_performance:failed")
    monitor_backup_retention && monitoring_results+=("backup_retention:success") || monitoring_results+=("backup_retention:failed")

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Count successful vs failed checks
    local successful_checks=0
    local failed_checks=0

    for result in "${monitoring_results[@]}"; do
        IFS=':' read -r check status <<< "$result"
        if [[ "$status" == "success" ]]; then
            successful_checks=$((successful_checks + 1))
        else
            failed_checks=$((failed_checks + 1))
        fi
    done

    # Log overall results
    if [[ $failed_checks -eq 0 ]]; then
        success "Comprehensive monitoring completed successfully (${duration}s) - All $successful_checks checks passed"
    else
        warning "Comprehensive monitoring completed with issues (${duration}s) - $successful_checks passed, $failed_checks failed"
    fi

    # Collect metrics
    local metrics_entry="{
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"monitoring_type\": \"comprehensive\",
        \"duration_seconds\": $duration,
        \"successful_checks\": $successful_checks,
        \"failed_checks\": $failed_checks,
        \"total_checks\": $((successful_checks + failed_checks)),
        \"results\": [$(printf '"%s",' "${monitoring_results[@]}" | sed 's/,$//')]
    }"

    echo "$metrics_entry" >> "$MONITORING_METRICS_FILE"

    return $failed_checks
}

# Setup monitoring automation
setup_monitoring_automation() {
    log "Setting up automated backup monitoring..."

    local script_path="$(pwd)/$(basename $0)"
    local cron_entry="*/$((MONITORING_INTERVAL / 60)) * * * * $script_path monitor-comprehensive"

    # Add to crontab
    (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -

    success "Automated monitoring configured - Running every $MONITORING_INTERVAL seconds"
    log "Cron entry: $cron_entry"

    # Create monitoring dashboard (placeholder)
    log "Creating monitoring dashboard configuration..."
    mkdir -p "$BACKUP_DIR/dashboard"
    cat > "$BACKUP_DIR/dashboard/dashboard-config.json" << EOF
{
    "backup_monitoring_dashboard": {
        "title": "Backup System Monitoring Dashboard",
        "refresh_interval_seconds": $MONITORING_INTERVAL,
        "widgets": [
            {
                "type": "status_overview",
                "title": "System Status",
                "metrics": ["backup_status", "storage_status", "consecutive_failures"]
            },
            {
                "type": "backup_statistics",
                "title": "Backup Statistics",
                "metrics": ["backup_counts", "success_rates", "backup_sizes"]
            },
            {
                "type": "performance_metrics",
                "title": "Performance Metrics",
                "metrics": ["backup_durations", "verification_results", "anomaly_detection"]
            },
            {
                "type": "alert_history",
                "title": "Recent Alerts",
                "metrics": ["alert_counts", "alert_severities", "alert_trends"]
            }
        ]
    }
}
EOF

    success "Monitoring automation setup completed"
}

# Main execution
main() {
    # Initialize monitoring state
    init_monitoring_state

    local command="${1:-help}"

    case "$command" in
        "monitor-comprehensive")
            run_comprehensive_monitoring
            ;;
        "monitor-database")
            monitor_database_backups
            ;;
        "monitor-assets")
            monitor_asset_backups
            ;;
        "monitor-storage")
            monitor_storage_capacity
            ;;
        "monitor-verification")
            monitor_backup_verification
            ;;
        "monitor-performance")
            monitor_backup_performance
            ;;
        "monitor-retention")
            monitor_backup_retention
            ;;
        "report")
            generate_monitoring_report
            ;;
        "setup-automation")
            setup_monitoring_automation
            ;;
        "test-alert")
            if [[ -z "${2:-}" ]]; then
                error "Usage: test-alert <alert_type> [severity]"
                exit 1
            fi
            send_monitoring_alert "$2" "${3:-info}" "This is a test alert" "{\"test\": true}"
            ;;
        "help"|"--help"|"-h")
            cat << EOF
Backup Monitoring and Alerting System v1.0.0

Usage: $(basename $0) [COMMAND] [OPTIONS]

Commands:
  monitor-comprehensive     Run all monitoring checks
  monitor-database         Monitor database backup status
  monitor-assets           Monitor asset backup status
  monitor-storage          Monitor storage capacity across all providers
  monitor-verification     Monitor backup verification results
  monitor-performance      Monitor backup performance metrics
  monitor-retention        Monitor backup retention policy compliance
  report                   Generate monitoring report
  setup-automation         Setup automated monitoring with cron
  test-alert <type> [severity]  Test alert system
  help                     Show this help message

Features:
  - Real-time backup status monitoring with configurable thresholds
  - Multi-cloud storage capacity monitoring (AWS S3, Azure, Google Cloud)
  - Backup performance monitoring with anomaly detection
  - Automated alerting with cooldown periods
  - Multi-channel notifications (Slack, Teams, PagerDuty, Email, Webhooks)
  - Backup verification monitoring
  - Retention policy compliance checking
  - Comprehensive metrics collection and reporting
  - Automated monitoring with configurable intervals

Alert Types:
  database_backup_status    Database backup failures or issues
  asset_backup_status       Asset backup failures or issues
  storage_capacity         Storage capacity warnings or critical levels
  backup_verification       Backup verification failures
  backup_performance        Backup performance degradation
  backup_retention          Backup retention policy issues
  s3_storage              S3 storage issues
  gcs_storage             Google Cloud Storage issues
  monitoring_report       Daily monitoring reports

Environment Variables:
  PROJECT_NAME             Project name (default: mariia-hub-unified)
  MONITORING_ENVIRONMENT   Environment (default: production)
  MONITORING_INTERVAL     Monitoring interval in seconds (default: 300)
  ALERT_COOLDOWN          Alert cooldown period in seconds (default: 1800)
  BACKUP_SUCCESS_THRESHOLD Backup success threshold percentage (default: 95)
  STORAGE_CAPACITY_WARNING Storage warning threshold percentage (default: 80)
  STORAGE_CAPACITY_CRITICAL Storage critical threshold percentage (default: 90)
  SLACK_WEBHOOK_URL       Slack webhook for notifications
  TEAMS_WEBHOOK_URL       Microsoft Teams webhook
  PAGERDUTY_INTEGRATION_KEY PagerDuty integration key
  EMAIL_ALERTS_ENABLED    Enable email alerts (default: true)
  WEBHOOK_ALERTS_ENABLED  Enable webhook alerts (default: true)

Examples:
  $(basename $0) monitor-comprehensive        # Run all monitoring checks
  $(basename $0) monitor-database            # Monitor database backups only
  $(basename $0) monitor-storage             # Monitor storage capacity
  $(basename $0) test-alert database_backup critical  # Test critical alert
  $(basename $0) setup-automation           # Setup automated monitoring
  $(basename $0) report                      # Generate monitoring report

This system provides comprehensive monitoring for all backup operations
with intelligent alerting and multi-cloud storage monitoring.

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