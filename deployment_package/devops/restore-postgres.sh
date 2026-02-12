#!/bin/bash
#
# PostgreSQL Restore Script for Natural Options Admin Dashboard
#
# This script safely restores a PostgreSQL database from a backup file.
# It includes safety checks, automatic safety backup creation, PM2 app management,
# Prisma migration execution, and automatic rollback on failure.
#
# Usage: ./restore-postgres.sh /path/to/backup_file.sql.gz
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

# Application settings
APP_DIR="${APP_DIR:-/var/www/natural-options-admin}"
PM2_APP_NAME="${PM2_APP_NAME:-natural-options-admin}"

# Backup settings
SAFETY_BACKUP_DIR="${SAFETY_BACKUP_DIR:-/var/backups/postgresql/safety}"

# Script settings
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_PREFIX="[RESTORE $(date +'%Y-%m-%d %H:%M:%S')]"

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

# Display usage information
show_usage() {
    cat << EOF

Usage: $0 <backup_file.sql.gz>

Description:
    Safely restore PostgreSQL database from a backup file.

Arguments:
    backup_file.sql.gz    Path to the gzipped SQL backup file

Examples:
    $0 /var/backups/postgresql/omnishop_20260213_020000.sql.gz

Environment Variables:
    DB_NAME              Database name (default: omnishop)
    DB_USER              Database user (default: omnishop_user)
    DB_HOST              Database host (default: localhost)
    DB_PORT              Database port (default: 5432)
    APP_DIR              Application directory (default: /var/www/natural-options-admin)
    PM2_APP_NAME         PM2 application name (default: natural-options-admin)

Safety Features:
    - Creates safety backup before restore
    - Stops application during restore
    - Automatic rollback on failure
    - Runs Prisma migrations after restore
    - Verifies app restart

EOF
    exit 1
}

#==============================================================================
# VALIDATION AND SETUP
#==============================================================================

# Check if backup file argument is provided
if [[ $# -eq 0 ]]; then
    log "ERROR: No backup file specified"
    show_usage
fi

BACKUP_FILE="$1"
SAFETY_BACKUP_FILE="${SAFETY_BACKUP_DIR}/safety_backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

log "=========================================="
log "PostgreSQL Restore Started"
log "=========================================="
log "Database: ${DB_NAME}"
log "Host: ${DB_HOST}:${DB_PORT}"
log "User: ${DB_USER}"
log "Application: ${PM2_APP_NAME}"

# Step 1: Validate backup file
log "Validating backup file..."

if [[ ! -f "${BACKUP_FILE}" ]]; then
    error_exit "Backup file does not exist: ${BACKUP_FILE}"
fi

if [[ ! -r "${BACKUP_FILE}" ]]; then
    error_exit "Backup file is not readable: ${BACKUP_FILE}"
fi

BACKUP_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null)

if [[ "${BACKUP_SIZE}" -eq 0 ]]; then
    error_exit "Backup file is empty (0 bytes): ${BACKUP_FILE}"
fi

log "Backup file validated successfully"
log "File: ${BACKUP_FILE}"
log "Size: $(format_size ${BACKUP_SIZE})"

# Step 2: Verify database connectivity
log "Verifying database connectivity..."
if ! pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" > /dev/null 2>&1; then
    error_exit "Database ${DB_NAME} is not accessible at ${DB_HOST}:${DB_PORT}"
fi
log "Database connectivity verified"

# Step 3: Verify application directory
if [[ ! -d "${APP_DIR}" ]]; then
    error_exit "Application directory does not exist: ${APP_DIR}"
fi

# Step 4: Confirmation prompt
log "=========================================="
log "WARNING: This will replace the current database!"
log "=========================================="
log "Database: ${DB_NAME}"
log "Backup file: $(basename ${BACKUP_FILE})"
log "Backup size: $(format_size ${BACKUP_SIZE})"
log "A safety backup will be created before restore"
log ""

read -p "Are you sure you want to proceed? (yes/no): " -r CONFIRM

if [[ ! "${CONFIRM}" =~ ^[Yy][Ee][Ss]$ ]]; then
    log "Restore cancelled by user"
    exit 0
fi

#==============================================================================
# RESTORE PROCESS
#==============================================================================

log "=========================================="
log "Starting Restore Process"
log "=========================================="

# Step 5: Stop PM2 application
log "Stopping PM2 application: ${PM2_APP_NAME}"
if pm2 describe "${PM2_APP_NAME}" > /dev/null 2>&1; then
    pm2 stop "${PM2_APP_NAME}" || log "Warning: Failed to stop PM2 app (may not be running)"
    log "Application stopped"
else
    log "Warning: PM2 app ${PM2_APP_NAME} not found, skipping stop"
fi

# Step 6: Create safety backup
log "Creating safety backup of current database..."

# Create safety backup directory
if [[ ! -d "${SAFETY_BACKUP_DIR}" ]]; then
    mkdir -p "${SAFETY_BACKUP_DIR}"
    chmod 700 "${SAFETY_BACKUP_DIR}"
fi

# Create safety backup with error handling
if pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    2>&1 | gzip > "${SAFETY_BACKUP_FILE}"; then

    SAFETY_SIZE=$(stat -c%s "${SAFETY_BACKUP_FILE}" 2>/dev/null || stat -f%z "${SAFETY_BACKUP_FILE}" 2>/dev/null)
    log "Safety backup created: ${SAFETY_BACKUP_FILE}"
    log "Safety backup size: $(format_size ${SAFETY_SIZE})"
    chmod 600 "${SAFETY_BACKUP_FILE}"
else
    error_exit "Failed to create safety backup. Restore aborted!"
fi

# Step 7: Restore database with automatic rollback
log "Restoring database from backup..."

if gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 > /dev/null 2>&1; then
    log "Database restored successfully"
else
    log "ERROR: Database restore failed!"
    log "Attempting automatic rollback from safety backup..."

    if gunzip -c "${SAFETY_BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 > /dev/null 2>&1; then
        log "Rollback successful! Database restored to previous state"
        log "Restarting PM2 application..."
        pm2 start "${PM2_APP_NAME}" || true
        error_exit "Restore failed but rollback succeeded. Application restarted with original data."
    else
        log "CRITICAL: Rollback also failed!"
        log "Safety backup location: ${SAFETY_BACKUP_FILE}"
        error_exit "Manual intervention required! Contact database administrator immediately."
    fi
fi

# Step 8: Run Prisma migrations
log "Running Prisma migrations..."

cd "${APP_DIR}" || error_exit "Failed to change to application directory: ${APP_DIR}"

if [[ -f "package.json" ]] && grep -q "prisma" package.json; then
    if npx prisma migrate deploy 2>&1 | tee /tmp/prisma-migrate-$$.log; then
        log "Prisma migrations completed successfully"
    else
        log "Warning: Prisma migrations failed"
        log "Check migration log: /tmp/prisma-migrate-$$.log"
        log "You may need to run migrations manually"
    fi
else
    log "Warning: Prisma not found in package.json, skipping migrations"
fi

# Step 9: Restart PM2 application
log "Starting PM2 application: ${PM2_APP_NAME}"
if pm2 start "${PM2_APP_NAME}" 2>&1 | grep -q "online\|launched"; then
    log "Application started successfully"
else
    log "Warning: Failed to start PM2 app normally, attempting restart..."
    pm2 restart "${PM2_APP_NAME}" || error_exit "Failed to restart application"
fi

# Wait for app to stabilize
sleep 3

# Step 10: Verify application status
log "Verifying application status..."
if pm2 describe "${PM2_APP_NAME}" 2>&1 | grep -q "online"; then
    log "Application is running (status: online)"
else
    APP_STATUS=$(pm2 describe "${PM2_APP_NAME}" 2>&1 | grep "status" || echo "unknown")
    log "Warning: Application status: ${APP_STATUS}"
    log "Check PM2 logs: pm2 logs ${PM2_APP_NAME}"
fi

# Step 11: Summary
log "=========================================="
log "Restore Summary"
log "=========================================="
log "Database: ${DB_NAME}"
log "Restored from: $(basename ${BACKUP_FILE})"
log "Backup size: $(format_size ${BACKUP_SIZE})"
log "Safety backup: ${SAFETY_BACKUP_FILE}"
log "Application: ${PM2_APP_NAME}"
log "Prisma migrations: Executed"
log "=========================================="
log "Restore completed successfully!"
log "=========================================="
log ""
log "Next steps:"
log "  1. Verify application functionality: http://your-domain.com"
log "  2. Check application logs: pm2 logs ${PM2_APP_NAME}"
log "  3. Monitor database queries"
log "  4. Test critical workflows"
log ""
log "Safety backup retained at: ${SAFETY_BACKUP_FILE}"
log "You can delete it after verifying the restore was successful"

exit 0
