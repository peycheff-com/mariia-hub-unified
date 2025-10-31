#!/bin/bash

# Application and Asset Backup System
# Comprehensive backup automation for application assets, user-generated content,
# configuration files, and service assets with multi-cloud synchronization

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME=${PROJECT_NAME:-"mariia-hub-unified"}
BACKUP_DIR=${BACKUP_DIR:-"./application-backups"}
SOURCE_DIR=${SOURCE_DIR:-"$(pwd)"}
ASSET_BACKUP_RETENTION_DAYS=${ASSET_BACKUP_RETENTION_DAYS:-"90"}
CONFIG_BACKUP_RETENTION_DAYS=${CONFIG_BACKUP_RETENTION_DAYS:-"180"}
S3_BUCKET=${S3_BUCKET:-"mariia-asset-backups"}
S3_BUCKET_REGION=${S3_BUCKET_REGION:-"eu-west-1"}
AZURE_STORAGE_ACCOUNT=${AZURE_STORAGE_ACCOUNT:-""}
AZURE_CONTAINER=${AZURE_CONTAINER:-"application-backups"}
GCP_BUCKET=${GCP_BUCKET:-"mariia-assets-backups"}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY:-""}
CDN_BACKUP_ENABLED=${CDN_BACKUP_ENABLED:-"true"}
USER_CONTENT_BACKUP_ENABLED=${USER_CONTENT_BACKUP_ENABLED:-"true}
CONFIG_BACKUP_ENABLED=${CONFIG_BACKUP_ENABLED:-"true"}
SERVICE_IMAGES_BACKUP_ENABLED=${SERVICE_IMAGES_BACKUP_ENABLED:-"true"}
BACKUP_COMPRESSION_LEVEL=${BACKUP_COMPRESSION_LEVEL:-"6"}
MAX_PARALLEL_UPLOADS=${MAX_PARALLEL_UPLOADS:-"8"}
CHUNK_SIZE_MB=${CHUNK_SIZE_MB:-"100"}
INCREMENTAL_BACKUP_ENABLED=${INCREMENTAL_BACKUP_ENABLED:-"true"}

# Asset directories to backup
ASSET_DIRECTORIES=(
    "public/assets"
    "public/images"
    "src/assets"
    "supabase/storage"
    "uploads"
    "user-content"
    "service-images"
    "profile-images"
)

# Configuration files to backup
CONFIG_FILES=(
    ".env.production"
    ".env.staging"
    "vercel.json"
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    "vite.config.ts"
    "tailwind.config.js"
    ".env.example"
    "infrastructure/terraform/"
    "k8s/"
    "docker-compose*.yml"
    "Dockerfile*"
    ".github/workflows/"
    "supabase/migrations/"
    "scripts/"
)

# Service configuration files
SERVICE_CONFIGS=(
    "supabase/config.toml"
    "lighthouserc.js"
    "vitest.config.ts"
    ".eslintrc*"
    ".prettierrc*"
    "jest.config.*"
    "playwright.config.*"
)

# Logging
LOG_FILE="$BACKUP_DIR/logs/asset-backup-$(date +%Y%m%d).log"
METRICS_FILE="$BACKUP_DIR/metrics/asset-metrics-$(date +%Y%m%d).json"

# Ensure directories exist
mkdir -p "$BACKUP_DIR"/{assets,config,user-content,service-images,logs,metrics,temp,verification,incremental}

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
collect_asset_metrics() {
    local operation="$1"
    local asset_type="$2"
    local status="$3"
    local duration="$4"
    local size="$5"
    local count="$6"
    local metadata="$7"

    local metric_entry="{
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"operation\": \"$operation\",
        \"asset_type\": \"$asset_type\",
        \"status\": \"$status\",
        \"duration_seconds\": $duration,
        \"size_bytes\": $size,
        \"file_count\": $count,
        \"metadata\": $metadata
    }"

    echo "$metric_entry" >> "$METRICS_FILE"
}

# Send notification
send_asset_alert() {
    local title="$1"
    local message="$2"
    local severity="${3:-"info"}"

    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local color="good"
        case "$severity" in
            "success") color="good" ;;
            "warning") color="warning" ;;
            "error") color="danger" ;;
            *) color="good" ;;
        esac

        local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "$title",
            "text": "$message",
            "fields": [
                {
                    "title": "Project",
                    "value": "$PROJECT_NAME",
                    "short": true
                },
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
            "footer": "Application Asset Backup System",
            "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png"
        }
    ]
}
EOF
        )
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
}

# Create file hash for incremental backups
create_file_hash() {
    local directory="$1"
    local hash_file="$2"

    log "Creating file hash for incremental backup: $directory"

    if [[ -d "$directory" ]]; then
        find "$directory" -type f -exec sha256sum {} \; | sort > "$hash_file"
        success "File hash created: $hash_file"
    else
        warning "Directory not found: $directory"
    fi
}

# Compare file hashes for incremental backup
compare_file_hashes() {
    local current_hash="$1"
    local previous_hash="$2"
    local changed_files_list="$3"

    if [[ ! -f "$previous_hash" ]]; then
        log "No previous hash found, performing full backup"
        return 1
    fi

    log "Comparing file hashes for incremental backup..."

    # Find changed files
    diff "$previous_hash" "$current_hash" | grep "^< " | cut -d' ' -f3- > "$changed_files_list"

    local changed_count=$(wc -l < "$changed_files_list")
    if [[ $changed_count -gt 0 ]]; then
        log "Found $changed_count changed files for incremental backup"
        return 0
    else
        log "No changes detected"
        return 1
    fi
}

# Encrypt backup file
encrypt_asset_backup() {
    local input_file="$1"
    local output_file="$2"

    if [[ -n "$BACKUP_ENCRYPTION_KEY" ]]; then
        log "Encrypting asset backup: $input_file"

        if openssl enc -aes-256-cbc -salt -in "$input_file" -out "$output_file" \
            -pass pass:"$BACKUP_ENCRYPTION_KEY" -pbkdf2; then
            success "Asset backup encrypted successfully"
            rm -f "$input_file"
            return 0
        else
            error "Asset backup encryption failed"
            return 1
        fi
    else
        warning "No encryption key provided, skipping encryption"
        mv "$input_file" "$output_file"
        return 0
    fi
}

# Multi-cloud upload for assets
upload_assets_to_cloud() {
    local backup_file="$1"
    local backup_name="$2"
    local asset_type="$3"

    log "Starting multi-cloud upload for $asset_type: $backup_name"

    local success_count=0
    local total_attempts=0

    # AWS S3 Upload
    if command -v aws &> /dev/null && [[ -n "$S3_BUCKET" ]]; then
        total_attempts=$((total_attempts + 1))
        log "Uploading $asset_type to AWS S3: $S3_BUCKET/$asset_type/"

        local start_time=$(date +%s)
        if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$asset_type/$backup_name" \
            --storage-class STANDARD_IA \
            --metadata asset-type="$asset_type" \
            --metadata project="$PROJECT_NAME" \
            --expected-size $(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file") \
            --only-show-errors; then

            local duration=$(($(date +%s) - start_time))
            success "AWS S3 upload completed in ${duration}s"
            success_count=$((success_count + 1))
        else
            error "AWS S3 upload failed for $asset_type"
        fi
    fi

    # Azure Blob Storage Upload
    if command -v az &> /dev/null && [[ -n "$AZURE_STORAGE_ACCOUNT" ]]; then
        total_attempts=$((total_attempts + 1))
        log "Uploading $asset_type to Azure Blob Storage: $AZURE_CONTAINER/$asset_type/"

        local start_time=$(date +%s)
        if az storage blob upload \
            --file "$backup_file" \
            --name "$asset_type/$backup_name" \
            --container-name "$AZURE_CONTAINER" \
            --account-name "$AZURE_STORAGE_ACCOUNT" \
            --tier Cool \
            --only-show-errors; then

            local duration=$(($(date +%s) - start_time))
            success "Azure Blob upload completed in ${duration}s"
            success_count=$((success_count + 1))
        else
            error "Azure Blob upload failed for $asset_type"
        fi
    fi

    # Google Cloud Storage Upload
    if command -v gsutil &> /dev/null && [[ -n "$GCP_BUCKET" ]]; then
        total_attempts=$((total_attempts + 1))
        log "Uploading $asset_type to Google Cloud Storage: $GCP_BUCKET/$asset_type/"

        local start_time=$(date +%s)
        if gsutil -o "GSUtil:parallel_composite_upload_threshold=150M" \
            -o "GSUtil:parallel_process_count=${MAX_PARALLEL_UPLOADS}" \
            cp "$backup_file" "gs://$GCP_BUCKET/$asset_type/$backup_name" &> /dev/null; then

            local duration=$(($(date +%s) - start_time))
            success "Google Cloud Storage upload completed in ${duration}s"
            success_count=$((success_count + 1))
        else
            error "Google Cloud Storage upload failed for $asset_type"
        fi
    fi

    if [[ $success_count -eq 0 ]]; then
        error "All cloud uploads failed for $asset_type"
        return 1
    elif [[ $success_count -lt $total_attempts ]]; then
        warning "Some cloud uploads failed for $asset_type ($success_count/$total_attempts successful)"
        return 0
    else
        success "All cloud uploads successful for $asset_type ($success_count/$total_attempts)"
        return 0
    fi
}

# Backup application assets
backup_application_assets() {
    local backup_type="${1:-full}" # full or incremental
    local backup_name="assets-${backup_type}-$(date +%Y%m%d-%H%M%S).tar.gz"

    log "Starting ${backup_type} backup of application assets..."

    local start_time=$(date +%s)
    local backup_file="$BACKUP_DIR/assets/$backup_name"
    local temp_dir="$BACKUP_DIR/temp/assets-$(date +%Y%m%d-%H%M%S)"
    local current_hash_file="$BACKUP_DIR/incremental/assets-current.hash"
    local previous_hash_file="$BACKUP_DIR/incremental/assets-previous.hash"
    local changed_files_list="$BACKUP_DIR/temp/assets-changed-files.txt"

    mkdir -p "$temp_dir"

    # Determine backup mode
    local backup_mode="full"
    if [[ "$backup_type" == "incremental" && "$INCREMENTAL_BACKUP_ENABLED" == "true" ]]; then
        # Create current hash
        create_file_hash "$SOURCE_DIR" "$current_hash_file"

        # Compare with previous hash
        if compare_file_hashes "$current_hash_file" "$previous_hash_file" "$changed_files_list"; then
            backup_mode="incremental"

            # Create backup with only changed files
            while IFS= read -r file; do
                if [[ -f "$SOURCE_DIR/$file" ]]; then
                    local dir_path=$(dirname "$temp_dir/$file")
                    mkdir -p "$dir_path"
                    cp "$SOURCE_DIR/$file" "$dir_path/"
                fi
            done < "$changed_files_list"
        else
            log "Falling back to full backup"
        fi
    fi

    # For full backup or fallback
    if [[ "$backup_mode" == "full" ]]; then
        # Copy all asset directories
        for asset_dir in "${ASSET_DIRECTORIES[@]}"; do
            if [[ -d "$SOURCE_DIR/$asset_dir" ]]; then
                log "Copying asset directory: $asset_dir"
                cp -r "$SOURCE_DIR/$asset_dir" "$temp_dir/"
            else
                warning "Asset directory not found: $asset_dir"
            fi
        done
    fi

    # Create compressed archive
    log "Creating compressed archive..."
    tar -czf "$backup_file" -C "$temp_dir" . 2> "$BACKUP_DIR/logs/assets-${backup_name}.log"

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
        local file_size_human=$(du -h "$backup_file" | cut -f1)
        local file_count=$(find "$temp_dir" -type f | wc -l)

        success "Asset backup completed in ${duration}s (Size: $file_size_human, Files: $file_count)"

        # Create metadata
        local metadata_file="${backup_file}.metadata.json"
        cat > "$metadata_file" << EOF
{
    "backup_name": "$backup_name",
    "backup_type": "assets",
    "backup_mode": "$backup_mode",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "duration_seconds": $duration,
    "file_size_bytes": $file_size,
    "file_size_human": "$file_size_human",
    "file_count": $file_count,
    "directories": [$(printf '"%s",' "${ASSET_DIRECTORIES[@]}" | sed 's/,$//')],
    "compression_level": $BACKUP_COMPRESSION_LEVEL,
    "encryption_enabled": $([[ -n "$BACKUP_ENCRYPTION_KEY" ]] && echo "true" || echo "false"),
    "project": "$PROJECT_NAME",
    "environment": "${ENVIRONMENT:-production}",
    "backup_system": "application-asset-backup",
    "version": "1.0.0"
}
EOF

        # Encrypt backup
        local encrypted_file="${backup_file}.enc"
        if encrypt_asset_backup "$backup_file" "$encrypted_file"; then
            backup_file="$encrypted_file"
        fi

        # Upload to cloud storage
        if upload_assets_to_cloud "$backup_file" "$backup_name" "assets"; then
            success "Asset backup uploaded to cloud storage"
        else
            warning "Cloud upload failed, but local backup succeeded"
        fi

        # Update hash files for incremental backups
        if [[ "$backup_type" == "incremental" && "$INCREMENTAL_BACKUP_ENABLED" == "true" ]]; then
            mv "$current_hash_file" "$previous_hash_file"
        fi

        # Collect metrics
        local metadata="{\"backup_mode\": \"$backup_mode\", \"directories\": ${#ASSET_DIRECTORIES[@]}}"
        collect_asset_metrics "backup_assets" "application_assets" "success" "$duration" "$file_size" "$file_count" "$metadata"

        # Send notification
        send_asset_alert "✅ Application Assets Backed Up" "Asset backup: $backup_name\nMode: $backup_mode\nSize: $file_size_human\nFiles: $file_count" "success"

        # Clean up temp directory
        rm -rf "$temp_dir"

        return 0
    else
        error "Asset backup creation failed"

        # Collect metrics
        collect_asset_metrics "backup_assets" "application_assets" "failed" "$duration" "0" "0" "{\"error\": \"backup_creation_failed\"}"

        # Send alert
        send_asset_alert "❌ Asset Backup Failed" "Application asset backup failed: $backup_name" "error"

        # Clean up temp directory
        rm -rf "$temp_dir"

        return 1
    fi
}

# Backup configuration files
backup_configuration_files() {
    local backup_name="config-$(date +%Y%m%d-%H%M%S).tar.gz"

    log "Starting backup of configuration files..."

    local start_time=$(date +%s)
    local backup_file="$BACKUP_DIR/config/$backup_name"
    local temp_dir="$BACKUP_DIR/temp/config-$(date +%Y%m%d-%H%M%S)"

    mkdir -p "$temp_dir"

    # Copy configuration files
    for config_pattern in "${CONFIG_FILES[@]}"; do
        log "Copying configuration files: $config_pattern"
        find "$SOURCE_DIR" -name "$config_pattern" -exec cp -r --parents {} "$temp_dir/" \; 2>/dev/null || true
    done

    # Copy service configuration files
    for config_pattern in "${SERVICE_CONFIGS[@]}"; do
        log "Copying service configuration: $config_pattern"
        find "$SOURCE_DIR" -name "$config_pattern" -exec cp -r --parents {} "$temp_dir/" \; 2>/dev/null || true
    done

    # Create compressed archive
    log "Creating configuration archive..."
    tar -czf "$backup_file" -C "$temp_dir" . 2> "$BACKUP_DIR/logs/config-${backup_name}.log"

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
        local file_size_human=$(du -h "$backup_file" | cut -f1)
        local file_count=$(find "$temp_dir" -type f | wc -l)

        success "Configuration backup completed in ${duration}s (Size: $file_size_human, Files: $file_count)"

        # Create metadata
        local metadata_file="${backup_file}.metadata.json"
        cat > "$metadata_file" << EOF
{
    "backup_name": "$backup_name",
    "backup_type": "config",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "duration_seconds": $duration,
    "file_size_bytes": $file_size,
    "file_size_human": "$file_size_human",
    "file_count": $file_count,
    "config_patterns": [$(printf '"%s",' "${CONFIG_FILES[@]}" "${SERVICE_CONFIGS[@]}" | sed 's/,$//')],
    "compression_level": $BACKUP_COMPRESSION_LEVEL,
    "encryption_enabled": $([[ -n "$BACKUP_ENCRYPTION_KEY" ]] && echo "true" || echo "false"),
    "project": "$PROJECT_NAME",
    "environment": "${ENVIRONMENT:-production}",
    "backup_system": "application-asset-backup",
    "version": "1.0.0"
}
EOF

        # Encrypt backup
        local encrypted_file="${backup_file}.enc"
        if encrypt_asset_backup "$backup_file" "$encrypted_file"; then
            backup_file="$encrypted_file"
        fi

        # Upload to cloud storage
        if upload_assets_to_cloud "$backup_file" "$backup_name" "config"; then
            success "Configuration backup uploaded to cloud storage"
        else
            warning "Cloud upload failed, but local backup succeeded"
        fi

        # Collect metrics
        local metadata="{\"config_patterns\": $((${#CONFIG_FILES[@]} + ${#SERVICE_CONFIGS[@]}))}"
        collect_asset_metrics "backup_config" "configuration" "success" "$duration" "$file_size" "$file_count" "$metadata"

        # Send notification
        send_asset_alert "✅ Configuration Backed Up" "Configuration backup: $backup_name\nSize: $file_size_human\nFiles: $file_count" "success"

        # Clean up temp directory
        rm -rf "$temp_dir"

        return 0
    else
        error "Configuration backup creation failed"

        # Collect metrics
        collect_asset_metrics "backup_config" "configuration" "failed" "$duration" "0" "0" "{\"error\": \"backup_creation_failed\"}"

        # Send alert
        send_asset_alert "❌ Configuration Backup Failed" "Configuration backup failed: $backup_name" "error"

        # Clean up temp directory
        rm -rf "$temp_dir"

        return 1
    fi
}

# Backup user-generated content
backup_user_content() {
    local backup_name="user-content-$(date +%Y%m%d-%H%M%S).tar.gz"

    log "Starting backup of user-generated content..."

    local start_time=$(date +%s)
    local backup_file="$BACKUP_DIR/user-content/$backup_name"
    local temp_dir="$BACKUP_DIR/temp/user-content-$(date +%Y%m%d-%H%M%S)"

    mkdir -p "$temp_dir"

    # Backup Supabase storage if available
    if command -v supabase &> /dev/null && [[ -n "${SUPABASE_PROJECT_ID:-}" ]]; then
        log "Downloading user content from Supabase storage..."

        # Create storage buckets backup
        local buckets=("service-images" "profile-images" "documents")
        for bucket in "${buckets[@]}"; do
            log "Downloading bucket: $bucket"
            supabase storage download --project-ref "$SUPABASE_PROJECT_ID" --bucket "$bucket" --recursive \
                --output "$temp_dir/$bucket" 2> "$BACKUP_DIR/logs/supabase-${bucket}-${backup_name}.log" || true
        done
    fi

    # Backup local user content directories
    local user_content_dirs=("uploads" "user-content" "user-generated")
    for content_dir in "${user_content_dirs[@]}"; do
        if [[ -d "$SOURCE_DIR/$content_dir" ]]; then
            log "Copying user content directory: $content_dir"
            cp -r "$SOURCE_DIR/$content_dir" "$temp_dir/"
        fi
    done

    # Create compressed archive
    log "Creating user content archive..."
    tar -czf "$backup_file" -C "$temp_dir" . 2> "$BACKUP_DIR/logs/user-content-${backup_name}.log"

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
        local file_size_human=$(du -h "$backup_file" | cut -f1)
        local file_count=$(find "$temp_dir" -type f | wc -l)

        success "User content backup completed in ${duration}s (Size: $file_size_human, Files: $file_count)"

        # Create metadata
        local metadata_file="${backup_file}.metadata.json"
        cat > "$metadata_file" << EOF
{
    "backup_name": "$backup_name",
    "backup_type": "user-content",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "duration_seconds": $duration,
    "file_size_bytes": $file_size,
    "file_size_human": "$file_size_human",
    "file_count": $file_count,
    "content_types": ["uploads", "user-content", "user-generated", "supabase-storage"],
    "compression_level": $BACKUP_COMPRESSION_LEVEL,
    "encryption_enabled": $([[ -n "$BACKUP_ENCRYPTION_KEY" ]] && echo "true" || echo "false"),
    "project": "$PROJECT_NAME",
    "environment": "${ENVIRONMENT:-production}",
    "backup_system": "application-asset-backup",
    "version": "1.0.0"
}
EOF

        # Encrypt backup
        local encrypted_file="${backup_file}.enc"
        if encrypt_asset_backup "$backup_file" "$encrypted_file"; then
            backup_file="$encrypted_file"
        fi

        # Upload to cloud storage
        if upload_assets_to_cloud "$backup_file" "$backup_name" "user-content"; then
            success "User content backup uploaded to cloud storage"
        else
            warning "Cloud upload failed, but local backup succeeded"
        fi

        # Collect metrics
        local metadata="{\"content_types\": 4}"
        collect_asset_metrics "backup_user_content" "user_content" "success" "$duration" "$file_size" "$file_count" "$metadata"

        # Send notification
        send_asset_alert "✅ User Content Backed Up" "User content backup: $backup_name\nSize: $file_size_human\nFiles: $file_count" "success"

        # Clean up temp directory
        rm -rf "$temp_dir"

        return 0
    else
        error "User content backup creation failed"

        # Collect metrics
        collect_asset_metrics "backup_user_content" "user_content" "failed" "$duration" "0" "0" "{\"error\": \"backup_creation_failed\"}"

        # Send alert
        send_asset_alert "❌ User Content Backup Failed" "User content backup failed: $backup_name" "error"

        # Clean up temp directory
        rm -rf "$temp_dir"

        return 1
    fi
}

# Backup service images and media
backup_service_images() {
    local backup_name="service-images-$(date +%Y%m%d-%H%M%S).tar.gz"

    log "Starting backup of service images and media..."

    local start_time=$(date +%s)
    local backup_file="$BACKUP_DIR/service-images/$backup_name"
    local temp_dir="$BACKUP_DIR/temp/service-images-$(date +%Y%m%d-%H%M%S"

    mkdir -p "$temp_dir"

    # Backup public assets
    if [[ -d "$SOURCE_DIR/public/assets" ]]; then
        log "Copying public assets..."
        cp -r "$SOURCE_DIR/public/assets" "$temp_dir/"
    fi

    # Backup optimized assets
    if [[ -d "$SOURCE_DIR/public/assets/optimized" ]]; then
        log "Copying optimized assets..."
        cp -r "$SOURCE_DIR/public/assets/optimized" "$temp_dir/"
    fi

    # Backup service-specific images
    local service_image_dirs=("service-images" "beauty-images" "fitness-images")
    for img_dir in "${service_image_dirs[@]}"; do
        if [[ -d "$SOURCE_DIR/$img_dir" ]]; then
            log "Copying service images: $img_dir"
            cp -r "$SOURCE_DIR/$img_dir" "$temp_dir/"
        fi
    done

    # Create image inventory
    log "Creating image inventory..."
    find "$temp_dir" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" -o -name "*.svg" \) -exec ls -la {} \; > "$temp_dir/image-inventory.txt" 2>/dev/null || true

    # Create compressed archive
    log "Creating service images archive..."
    tar -czf "$backup_file" -C "$temp_dir" . 2> "$BACKUP_DIR/logs/service-images-${backup_name}.log"

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
        local file_size_human=$(du -h "$backup_file" | cut -f1)
        local file_count=$(find "$temp_dir" -type f | wc -l)
        local image_count=$(find "$temp_dir" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" -o -name "*.svg" \) | wc -l)

        success "Service images backup completed in ${duration}s (Size: $file_size_human, Images: $image_count, Files: $file_count)"

        # Create metadata
        local metadata_file="${backup_file}.metadata.json"
        cat > "$metadata_file" << EOF
{
    "backup_name": "$backup_name",
    "backup_type": "service-images",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "duration_seconds": $duration,
    "file_size_bytes": $file_size,
    "file_size_human": "$file_size_human",
    "file_count": $file_count,
    "image_count": $image_count,
    "image_directories": [$(printf '"%s",' "${service_image_dirs[@]}" | sed 's/,$//')],
    "compression_level": $BACKUP_COMPRESSION_LEVEL,
    "encryption_enabled": $([[ -n "$BACKUP_ENCRYPTION_KEY" ]] && echo "true" || echo "false"),
    "project": "$PROJECT_NAME",
    "environment": "${ENVIRONMENT:-production}",
    "backup_system": "application-asset-backup",
    "version": "1.0.0"
}
EOF

        # Encrypt backup
        local encrypted_file="${backup_file}.enc"
        if encrypt_asset_backup "$backup_file" "$encrypted_file"; then
            backup_file="$encrypted_file"
        fi

        # Upload to cloud storage
        if upload_assets_to_cloud "$backup_file" "$backup_name" "service-images"; then
            success "Service images backup uploaded to cloud storage"
        else
            warning "Cloud upload failed, but local backup succeeded"
        fi

        # Collect metrics
        local metadata="{\"image_count\": $image_count, \"directories\": ${#service_image_dirs[@]}}"
        collect_asset_metrics "backup_service_images" "service_images" "success" "$duration" "$file_size" "$file_count" "$metadata"

        # Send notification
        send_asset_alert "✅ Service Images Backed Up" "Service images backup: $backup_name\nSize: $file_size_human\nImages: $image_count" "success"

        # Clean up temp directory
        rm -rf "$temp_dir"

        return 0
    else
        error "Service images backup creation failed"

        # Collect metrics
        collect_asset_metrics "backup_service_images" "service_images" "failed" "$duration" "0" "0" "{\"error\": \"backup_creation_failed\"}"

        # Send alert
        send_asset_alert "❌ Service Images Backup Failed" "Service images backup failed: $backup_name" "error"

        # Clean up temp directory
        rm -rf "$temp_dir"

        return 1
    fi
}

# CDN asset synchronization
sync_cdn_assets() {
    local backup_name="cdn-sync-$(date +%Y%m%d-%H%M%S).tar.gz"

    log "Starting CDN asset synchronization..."

    local start_time=$(date +%s)
    local backup_file="$BACKUP_DIR/assets/$backup_name"
    local temp_dir="$BACKUP_DIR/temp/cdn-sync-$(date +%Y%m%d-%H%M%S)"

    mkdir -p "$temp_dir"

    # Get CDN configuration
    if [[ -f "$SOURCE_DIR/src/lib/cdn-config.ts" ]]; then
        log "Copying CDN configuration..."
        cp "$SOURCE_DIR/src/lib/cdn-config.ts" "$temp_dir/"
    fi

    # Sync from CDN if configured
    local cdn_domains=("cdn.mariaborysevych.com" "assets.mariaborysevych.com")
    for cdn_domain in "${cdn_domains[@]}"; do
        log "Attempting to sync from CDN: $cdn_domain"

        # Create domain-specific directory
        mkdir -p "$temp_dir/$cdn_domain"

        # Try to download sitemap or manifest from CDN
        if curl -s "https://$cdn_domain/sitemap.xml" -o "$temp_dir/$cdn_domain/sitemap.xml" || \
           curl -s "https://$cdn_domain/manifest.json" -o "$temp_dir/$cdn_domain/manifest.json" || \
           curl -s "https://$cdn_domain/robots.txt" -o "$temp_dir/$cdn_domain/robots.txt"; then
            success "CDN sync successful for: $cdn_domain"
        else
            warning "CDN sync failed for: $cdn_domain"
        fi
    done

    # Create CDN inventory
    find "$temp_dir" -type f -exec ls -la {} \; > "$temp_dir/cdn-inventory.txt" 2>/dev/null || true

    # Create compressed archive
    tar -czf "$backup_file" -C "$temp_dir" . 2> "$BACKUP_DIR/logs/cdn-sync-${backup_name}.log"

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
        local file_size_human=$(du -h "$backup_file" | cut -f1)
        local file_count=$(find "$temp_dir" -type f | wc -l)

        success "CDN sync completed in ${duration}s (Size: $file_size_human, Files: $file_count)"

        # Upload to cloud storage
        if upload_assets_to_cloud "$backup_file" "$backup_name" "cdn-sync"; then
            success "CDN sync backup uploaded to cloud storage"
        fi

        # Collect metrics
        local metadata="{\"cdn_domains\": ${#cdn_domains[@]}}"
        collect_asset_metrics "sync_cdn" "cdn_assets" "success" "$duration" "$file_size" "$file_count" "$metadata"

        # Clean up temp directory
        rm -rf "$temp_dir"

        return 0
    else
        error "CDN sync failed"

        # Collect metrics
        collect_asset_metrics "sync_cdn" "cdn_assets" "failed" "$duration" "0" "0" "{\"error\": \"cdn_sync_failed\"}"

        # Clean up temp directory
        rm -rf "$temp_dir"

        return 1
    fi
}

# Restore assets from backup
restore_assets_from_backup() {
    local backup_file="$1"
    local restore_type="$2" # assets, config, user-content, service-images
    local target_dir="${3:-"$SOURCE_DIR"}"

    log "Restoring $restore_type from backup: $backup_file"

    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
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

    # Verify backup integrity
    if ! tar -tzf "$restore_file" &> /dev/null; then
        error "Backup file integrity check failed"
        [[ "$restore_file" != "$backup_file" ]] && rm -f "$restore_file"
        return 1
    fi

    # Create restore directory
    local restore_temp_dir="$BACKUP_DIR/temp/restore-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$restore_temp_dir"

    # Extract backup
    log "Extracting backup to temporary directory..."
    if tar -xzf "$restore_file" -C "$restore_temp_dir"; then
        log "Backup extracted successfully"

        # Create backup of current assets before restore
        local pre_restore_backup="pre-restore-${restore_type}-$(date +%Y%m%d-%H%M%S)"
        case "$restore_type" in
            "assets")
                if [[ "$ASSET_BACKUP_ENABLED" == "true" ]]; then
                    backup_application_assets "manual" && mv "$BACKUP_DIR/assets/assets-manual-"*".tar.gz.enc" "$BACKUP_DIR/assets/$pre_restore_backup.tar.gz.enc" || true
                fi
                ;;
            "config")
                if [[ "$CONFIG_BACKUP_ENABLED" == "true" ]]; then
                    backup_configuration_files && mv "$BACKUP_DIR/config/"*".tar.gz.enc" "$BACKUP_DIR/config/$pre_restore_backup.tar.gz.enc" || true
                fi
                ;;
        esac

        # Perform restore
        log "Restoring files to: $target_dir"
        if cp -r "$restore_temp_dir"/* "$target_dir/"; then
            success "Asset restore completed successfully"
            send_asset_alert "✅ Assets Restored" "$restore_type restored from: $(basename $backup_file)" "success"

            # Clean up
            rm -rf "$restore_temp_dir"
            [[ "$restore_file" != "$backup_file" ]] && rm -f "$restore_file"

            return 0
        else
            error "Failed to restore files to target directory"
            rm -rf "$restore_temp_dir"
            [[ "$restore_file" != "$backup_file" ]] && rm -f "$restore_file"
            return 1
        fi
    else
        error "Failed to extract backup file"
        rm -rf "$restore_temp_dir"
        [[ "$restore_file" != "$backup_file" ]] && rm -f "$restore_file"
        return 1
    fi
}

# Clean up old asset backups
cleanup_old_asset_backups() {
    log "Cleaning up old asset backups..."

    # Clean up asset backups
    find "$BACKUP_DIR/assets" -name "*.tar.gz*" -mtime +$ASSET_BACKUP_RETENTION_DAYS -delete
    log "Cleaned up asset backups older than $ASSET_BACKUP_RETENTION_DAYS days"

    # Clean up configuration backups
    find "$BACKUP_DIR/config" -name "*.tar.gz*" -mtime +$CONFIG_BACKUP_RETENTION_DAYS -delete
    log "Cleaned up configuration backups older than $CONFIG_BACKUP_RETENTION_DAYS days"

    # Clean up user content backups
    find "$BACKUP_DIR/user-content" -name "*.tar.gz*" -mtime +$ASSET_BACKUP_RETENTION_DAYS -delete
    log "Cleaned up user content backups older than $ASSET_BACKUP_RETENTION_DAYS days"

    # Clean up service images backups
    find "$BACKUP_DIR/service-images" -name "*.tar.gz*" -mtime +$ASSET_BACKUP_RETENTION_DAYS -delete
    log "Cleaned up service images backups older than $ASSET_BACKUP_RETENTION_DAYS days"

    # Clean up log files
    find "$BACKUP_DIR/logs" -name "*.log" -mtime +30 -delete
    log "Cleaned up log files older than 30 days"

    # Clean up temp files
    find "$BACKUP_DIR/temp" -name "*" -mmin +120 -delete
    log "Cleaned up temporary files older than 2 hours"

    success "Asset backup cleanup completed"
}

# Generate asset backup report
generate_asset_backup_report() {
    log "Generating asset backup report..."

    local report_file="$BACKUP_DIR/reports/asset-backup-report-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p "$BACKUP_DIR/reports"

    # Count backups by type
    local assets_count=$(find "$BACKUP_DIR/assets" -name "*.tar.gz*" | wc -l)
    local config_count=$(find "$BACKUP_DIR/config" -name "*.tar.gz*" | wc -l)
    local user_content_count=$(find "$BACKUP_DIR/user-content" -name "*.tar.gz*" | wc -l)
    local service_images_count=$(find "$BACKUP_DIR/service-images" -name "*.tar.gz*" | wc -l)

    # Calculate total size
    local total_size=$(du -sb "$BACKUP_DIR" | cut -f1)
    local total_size_human=$(du -sh "$BACKUP_DIR" | cut -f1)

    # Get latest backups
    local latest_assets=$(find "$BACKUP_DIR/assets" -name "*.tar.gz*" -printf "%T@ %p\n" | sort -n | tail -1 | cut -d' ' -f2- | xargs basename 2>/dev/null || echo "none")
    local latest_config=$(find "$BACKUP_DIR/config" -name "*.tar.gz*" -printf "%T@ %p\n" | sort -n | tail -1 | cut -d' ' -f2- | xargs basename 2>/dev/null || echo "none")

    # Asset statistics
    local total_assets=0
    for asset_dir in "${ASSET_DIRECTORIES[@]}"; do
        if [[ -d "$SOURCE_DIR/$asset_dir" ]]; then
            local dir_count=$(find "$SOURCE_DIR/$asset_dir" -type f | wc -l)
            total_assets=$((total_assets + dir_count))
        fi
    done

    cat > "$report_file" << EOF
{
    "asset_backup_report": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "project": "$PROJECT_NAME",
        "environment": "${ENVIRONMENT:-production}",
        "backup_directory": "$BACKUP_DIR",
        "backup_counts": {
            "assets": $assets_count,
            "config": $config_count,
            "user_content": $user_content_count,
            "service_images": $service_images_count
        },
        "storage_metrics": {
            "total_size_bytes": $total_size,
            "total_size_human": "$total_size_human"
        },
        "asset_statistics": {
            "total_asset_files": $total_assets,
            "monitored_directories": ${#ASSET_DIRECTORIES[@]},
            "config_patterns": $((${#CONFIG_FILES[@]} + ${#SERVICE_CONFIGS[@]}))
        },
        "latest_backups": {
            "assets": "$latest_assets",
            "config": "$latest_config"
        },
        "configuration": {
            "asset_backup_retention_days": $ASSET_BACKUP_RETENTION_DAYS,
            "config_backup_retention_days": $CONFIG_BACKUP_RETENTION_DAYS,
            "encryption_enabled": $([[ -n "$BACKUP_ENCRYPTION_KEY" ]] && echo "true" || echo "false"),
            "incremental_backup_enabled": $INCREMENTAL_BACKUP_ENABLED,
            "cdn_backup_enabled": $CDN_BACKUP_ENABLED,
            "compression_level": $BACKUP_COMPRESSION_LEVEL
        },
        "features": {
            "asset_backup_enabled": $ASSET_BACKUP_ENABLED,
            "config_backup_enabled": $CONFIG_BACKUP_ENABLED,
            "user_content_backup_enabled": $USER_CONTENT_BACKUP_ENABLED,
            "service_images_backup_enabled": $SERVICE_IMAGES_BACKUP_ENABLED
        }
    }
}
EOF

    success "Asset backup report generated: $report_file"

    # Send report summary
    local summary="📊 Asset Backup Report\n\n"
    summary+="Total Backups: $((assets_count + config_count + user_content_count + service_images_count))\n"
    summary+="Storage Used: $total_size_human\n"
    summary+="Asset Files: $total_assets\n"
    summary+="Latest Assets: $latest_assets\n"

    send_asset_alert "📊 Asset Backup Report" "$summary" "info"
}

# Setup cron jobs for asset backups
setup_asset_backup_cron() {
    log "Setting up automated asset backup schedule..."

    local script_path="$(pwd)/$(basename $0)"
    local cron_entries=()

    # Asset backups every 6 hours
    if [[ "$ASSET_BACKUP_ENABLED" == "true" ]]; then
        cron_entries+=("0 */6 * * * $script_path backup-assets")
    fi

    # Configuration backups daily at 3:00 AM
    if [[ "$CONFIG_BACKUP_ENABLED" == "true" ]]; then
        cron_entries+=("0 3 * * * $script_path backup-config")
    fi

    # User content backups every 12 hours
    if [[ "$USER_CONTENT_BACKUP_ENABLED" == "true" ]]; then
        cron_entries+=("0 */12 * * * $script_path backup-user-content")
    fi

    # Service images backups daily at 1:00 AM
    if [[ "$SERVICE_IMAGES_BACKUP_ENABLED" == "true" ]]; then
        cron_entries+=("0 1 * * * $script_path backup-service-images")
    fi

    # CDN sync every 4 hours
    if [[ "$CDN_BACKUP_ENABLED" == "true" ]]; then
        cron_entries+=("0 */4 * * * $script_path sync-cdn")
    fi

    # Cleanup daily at 4:00 AM
    cron_entries+=("0 4 * * * $script_path cleanup")

    # Report daily at 7:00 AM
    cron_entries+=("0 7 * * * $script_path report")

    # Add to crontab
    (crontab -l 2>/dev/null; printf "%s\n" "${cron_entries[@]}") | crontab -

    success "Asset backup cron schedule configured"
    log "Scheduled operations:"
    [[ "$ASSET_BACKUP_ENABLED" == "true" ]] && log "  - Asset backups: Every 6 hours"
    [[ "$CONFIG_BACKUP_ENABLED" == "true" ]] && log "  - Configuration backups: Daily 3:00 AM"
    [[ "$USER_CONTENT_BACKUP_ENABLED" == "true" ]] && log "  - User content backups: Every 12 hours"
    [[ "$SERVICE_IMAGES_BACKUP_ENABLED" == "true" ]] && log "  - Service images backups: Daily 1:00 AM"
    [[ "$CDN_BACKUP_ENABLED" == "true" ]] && log "  - CDN sync: Every 4 hours"
    log "  - Cleanup: Daily 4:00 AM"
    log "  - Reports: Daily 7:00 AM"
}

# Main execution
main() {
    local command="${1:-help}"

    case "$command" in
        "backup-assets")
            backup_application_assets "${2:-full}"
            ;;
        "backup-config")
            backup_configuration_files
            ;;
        "backup-user-content")
            backup_user_content
            ;;
        "backup-service-images")
            backup_service_images
            ;;
        "sync-cdn")
            sync_cdn_assets
            ;;
        "backup-all")
            log "Starting comprehensive backup of all asset types..."
            local failed_operations=()

            [[ "$ASSET_BACKUP_ENABLED" == "true" ]] && { backup_application_assets "full" || failed_operations+=("assets"); }
            [[ "$CONFIG_BACKUP_ENABLED" == "true" ]] && { backup_configuration_files || failed_operations+=("config"); }
            [[ "$USER_CONTENT_BACKUP_ENABLED" == "true" ]] && { backup_user_content || failed_operations+=("user-content"); }
            [[ "$SERVICE_IMAGES_BACKUP_ENABLED" == "true" ]] && { backup_service_images || failed_operations+=("service-images"); }
            [[ "$CDN_BACKUP_ENABLED" == "true" ]] && { sync_cdn_assets || failed_operations+=("cdn"); }

            if [[ ${#failed_operations[@]} -eq 0 ]]; then
                success "All asset backup operations completed successfully"
                send_asset_alert "✅ All Assets Backed Up" "All asset types backed up successfully" "success"
            else
                warning "Some backup operations failed: ${failed_operations[*]}"
                send_asset_alert "⚠️ Partial Asset Backup" "Failed operations: ${failed_operations[*]}" "warning"
            fi
            ;;
        "restore")
            if [[ -z "${2:-}" ]]; then
                error "Please provide backup file path"
                exit 1
            fi
            restore_assets_from_backup "$2" "${3:-assets}" "${4:-$SOURCE_DIR}"
            ;;
        "cleanup")
            cleanup_old_asset_backups
            ;;
        "report")
            generate_asset_backup_report
            ;;
        "setup-cron")
            setup_asset_backup_cron
            ;;
        "help"|"--help"|"-h")
            cat << EOF
Application and Asset Backup System v1.0.0

Usage: $(basename $0) [COMMAND] [OPTIONS]

Commands:
  backup-assets [type]     Backup application assets (full/incremental)
  backup-config            Backup configuration files
  backup-user-content      Backup user-generated content
  backup-service-images    Backup service images and media
  sync-cdn                 Synchronize CDN assets
  backup-all               Backup all asset types
  restore <file> [type] [dir] Restore assets from backup
                          Types: assets, config, user-content, service-images
  cleanup                  Clean up old backups
  report                   Generate backup report
  setup-cron               Setup automated backup schedule
  help                     Show this help message

Features:
  - Multi-cloud asset storage (AWS S3, Azure Blob, Google Cloud Storage)
  - Incremental backup support with file hashing
  - AES-256 encryption for sensitive assets
  - User-generated content backup from Supabase storage
  - CDN asset synchronization
  - Service image and media backup
  - Configuration file backup
  - Comprehensive metadata tracking
  - Automated retention policies
  - Multi-channel notifications

Environment Variables:
  PROJECT_NAME                  Project name (default: mariia-hub-unified)
  BACKUP_DIR                   Backup directory (default: ./application-backups)
  SOURCE_DIR                   Source directory to backup (default: current directory)
  ASSET_BACKUP_RETENTION_DAYS  Asset backup retention (default: 90)
  CONFIG_BACKUP_RETENTION_DAYS Config backup retention (default: 180)
  BACKUP_ENCRYPTION_KEY        AES-256 encryption key
  S3_BUCKET                   AWS S3 bucket for assets
  AZURE_STORAGE_ACCOUNT        Azure storage account
  GCP_BUCKET                  Google Cloud Storage bucket
  SLACK_WEBHOOK_URL           Slack webhook for notifications
  INCREMENTAL_BACKUP_ENABLED  Enable incremental backups (default: true)
  BACKUP_COMPRESSION_LEVEL    Compression level 1-9 (default: 6)
  MAX_PARALLEL_UPLOADS        Max parallel uploads (default: 8)
  CDN_BACKUP_ENABLED          Enable CDN backup (default: true)
  USER_CONTENT_BACKUP_ENABLED Enable user content backup (default: true)
  CONFIG_BACKUP_ENABLED       Enable config backup (default: true)
  SERVICE_IMAGES_BACKUP_ENABLED Enable service images backup (default: true)

Examples:
  $(basename $0) backup-assets full        # Full asset backup
  $(basename $0) backup-assets incremental  # Incremental asset backup
  $(basename $0) backup-all                # Backup all asset types
  $(basename $0) restore backup.tar.gz.enc assets ./restored  # Restore assets
  $(basename $0) setup-cron                # Setup automated schedule

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