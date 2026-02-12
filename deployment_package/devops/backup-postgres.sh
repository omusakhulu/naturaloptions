#!/bin/bash
#
# PostgreSQL Backup Script for Natural Options Admin Dashboard
#
# This script creates compressed database backups with automatic retention management.
# It uses pg_dump to create SQL dumps, compresses them with gzip, and automatically
# removes old backups based on the retention policy.
#
# Cron: 0 2 * * * /var/www/natural-options-admin/devops/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1
#
# Author: Database Administrator Agent
# Version: 1.0.0
# Last Updated: 2026-02-13

set -euo pipefail

#==============================================================================
# CONFIGURATION VARIABLES
#==============================================================================

# Database connection settings
DB_NAME="${DB_NAME:-omnishop}"
DB_USER="${DB_USER:-omnishop_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Backup settings
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Application settings
APP_DIR="${APP_DIR:-/var/www/natural-options-admin}"

# Script settings
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILENAME="${DB_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
LOG_PREFIX="[BACKUP $(date +'%Y-%m-%d %H:%M:%S')]"

#==============================================================================
# HELPER FUNCTIONS
#==============================================================================

# Log message with timestamp
log() {
    echo "${LOG_PREFIX} $1"
}

# Log error message and exit
error_exit() {
    echo "${LOG_PREFIX} ERROR: $1" >&2
    exit 1
}

# Cleanup function for error handling
cleanup_on_error() {
    log "Backup failed! Cleaning up incomplete backup file..."
    if [[ -f "${BACKUP_PATH}" ]]; then
        rm -f "${BACKUP_PATH}"
        log "Removed incomplete backup: ${BACKUP_PATH}"
    fi
}

# Format bytes to human-readable size
format_size() {
    local size=$1
    if [[ $size -lt 1024 ]]; then
        echo "${size}B"
    elif [[ $size -lt 1048576 ]]; then
        echo "$((size / 1024))KB"
    elif [[ $size -lt 1073741824 ]]; then
        echo "$((size / 1048576))MB"
    else
        echo "$((size / 1073741824))GB"
    fi
}

#==============================================================================
# MAIN BACKUP PROCESS
#==============================================================================

# Set error trap
trap cleanup_on_error ERR

log "=========================================="
log "PostgreSQL Backup Started"
log "=========================================="
log "Database: ${DB_NAME}"
log "Host: ${DB_HOST}:${DB_PORT}"
log "User: ${DB_USER}"
log "Backup Directory: ${BACKUP_DIR}"
log "Retention: ${RETENTION_DAYS} days"

# Step 1: Create backup directory if it doesn't exist
if [[ ! -d "${BACKUP_DIR}" ]]; then
    log "Creating backup directory: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}" || error_exit "Failed to create backup directory"
    chmod 700 "${BACKUP_DIR}"
fi

# Step 2: Verify database connectivity
log "Verifying database connectivity..."
if ! pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" > /dev/null 2>&1; then
    error_exit "Database ${DB_NAME} is not accessible at ${DB_HOST}:${DB_PORT}"
fi
log "Database connectivity verified"

# Step 3: Create backup
log "Creating backup: ${BACKUP_FILENAME}"
log "Running pg_dump..."

# Use PGPASSFILE or .pgpass if available, otherwise pg_dump will use peer auth or prompt
# For production, ensure ~/.pgpass exists with: hostname:port:database:username:password
# Format: localhost:5432:omnishop:omnishop_user:your_password
# Permissions: chmod 600 ~/.pgpass

pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --verbose \
    2>&1 | gzip > "${BACKUP_PATH}"

# Step 4: Verify backup file
if [[ ! -f "${BACKUP_PATH}" ]]; then
    error_exit "Backup file was not created: ${BACKUP_PATH}"
fi

BACKUP_SIZE=$(stat -c%s "${BACKUP_PATH}" 2>/dev/null || stat -f%z "${BACKUP_PATH}" 2>/dev/null)

if [[ "${BACKUP_SIZE}" -eq 0 ]]; then
    error_exit "Backup file is empty (0 bytes). Backup failed!"
fi

log "Backup created successfully"
log "File: ${BACKUP_PATH}"
log "Size: $(format_size ${BACKUP_SIZE})"

# Step 5: Set secure permissions
chmod 600 "${BACKUP_PATH}"

# Step 6: Cleanup old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days..."

OLD_BACKUP_COUNT=0
while IFS= read -r old_backup; do
    if [[ -f "${old_backup}" ]]; then
        log "Deleting old backup: $(basename ${old_backup})"
        rm -f "${old_backup}"
        ((OLD_BACKUP_COUNT++))
    fi
done < <(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -mtime +${RETENTION_DAYS})

if [[ ${OLD_BACKUP_COUNT} -gt 0 ]]; then
    log "Deleted ${OLD_BACKUP_COUNT} old backup(s)"
else
    log "No old backups to delete"
fi

# Step 7: Summary
REMAINING_BACKUPS=$(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f | wc -l)
TOTAL_BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)

log "=========================================="
log "Backup Summary"
log "=========================================="
log "Latest Backup: ${BACKUP_FILENAME}"
log "Backup Size: $(format_size ${BACKUP_SIZE})"
log "Total Backups: ${REMAINING_BACKUPS}"
log "Total Size: ${TOTAL_BACKUP_SIZE}"
log "Oldest Backup: $(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -printf '%T+ %p\n' 2>/dev/null | sort | head -n1 | awk '{print $2}' | xargs basename 2>/dev/null || echo 'N/A')"
log "Backup completed successfully!"
log "=========================================="

exit 0
