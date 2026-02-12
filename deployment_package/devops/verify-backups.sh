#!/bin/bash
#
# PostgreSQL Backup Verification Script
#
# This script verifies the health and integrity of PostgreSQL backups.
# It checks backup age, size, and can optionally test restore capability.
#
# Usage: ./verify-backups.sh [--test-restore]
#
# Author: Database Administrator Agent
# Version: 1.0.0
# Last Updated: 2026-02-13

set -euo pipefail

#==============================================================================
# CONFIGURATION VARIABLES
#==============================================================================

DB_NAME="${DB_NAME:-omnishop}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql}"
MAX_BACKUP_AGE_HOURS="${MAX_BACKUP_AGE_HOURS:-25}"
MIN_BACKUP_SIZE_KB="${MIN_BACKUP_SIZE_KB:-100}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

#==============================================================================
# HELPER FUNCTIONS
#==============================================================================

log_ok() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

format_size() {
    local size=$1
    if [[ $size -lt 1024 ]]; then
        echo "${size}KB"
    elif [[ $size -lt 1048576 ]]; then
        echo "$((size / 1024))MB"
    else
        echo "$((size / 1048576))GB"
    fi
}

#==============================================================================
# VERIFICATION PROCESS
#==============================================================================

echo "=========================================="
echo "PostgreSQL Backup Verification"
echo "=========================================="
echo "Database: ${DB_NAME}"
echo "Backup Directory: ${BACKUP_DIR}"
echo "Timestamp: $(date +'%Y-%m-%d %H:%M:%S')"
echo ""

EXIT_CODE=0

# Check 1: Backup directory exists
echo "Checking backup directory..."
if [[ ! -d "${BACKUP_DIR}" ]]; then
    log_error "Backup directory does not exist: ${BACKUP_DIR}"
    exit 2
fi
log_ok "Backup directory exists"

# Check 2: Find backups
echo "Searching for backups..."
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f | wc -l)

if [[ ${BACKUP_COUNT} -eq 0 ]]; then
    log_error "No backups found in ${BACKUP_DIR}"
    exit 2
fi
log_ok "Found ${BACKUP_COUNT} backup(s)"

# Check 3: Latest backup age
echo "Checking latest backup age..."
LATEST_BACKUP=$(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -printf '%T+ %p\n' | sort -r | head -n1 | awk '{print $2}')

if [[ -z "${LATEST_BACKUP}" ]]; then
    log_error "Could not determine latest backup"
    exit 2
fi

LATEST_BACKUP_TIME=$(stat -c %Y "${LATEST_BACKUP}" 2>/dev/null || stat -f %m "${LATEST_BACKUP}" 2>/dev/null)
CURRENT_TIME=$(date +%s)
BACKUP_AGE_SECONDS=$((CURRENT_TIME - LATEST_BACKUP_TIME))
BACKUP_AGE_HOURS=$((BACKUP_AGE_SECONDS / 3600))

echo "Latest backup: $(basename ${LATEST_BACKUP})"
echo "Backup age: ${BACKUP_AGE_HOURS} hours"

if [[ ${BACKUP_AGE_HOURS} -gt ${MAX_BACKUP_AGE_HOURS} ]]; then
    log_warn "Latest backup is older than ${MAX_BACKUP_AGE_HOURS} hours"
    EXIT_CODE=1
else
    log_ok "Backup age is acceptable"
fi

# Check 4: Latest backup size
echo "Checking latest backup size..."
BACKUP_SIZE_BYTES=$(stat -c%s "${LATEST_BACKUP}" 2>/dev/null || stat -f%z "${LATEST_BACKUP}" 2>/dev/null)
BACKUP_SIZE_KB=$((BACKUP_SIZE_BYTES / 1024))

echo "Backup size: $(format_size ${BACKUP_SIZE_KB})"

if [[ ${BACKUP_SIZE_KB} -lt ${MIN_BACKUP_SIZE_KB} ]]; then
    log_error "Backup size is too small (< ${MIN_BACKUP_SIZE_KB}KB)"
    EXIT_CODE=2
else
    log_ok "Backup size is acceptable"
fi

# Check 5: Backup file integrity (gzip)
echo "Checking backup file integrity..."
if gunzip -t "${LATEST_BACKUP}" 2>/dev/null; then
    log_ok "Backup file is valid gzip archive"
else
    log_error "Backup file is corrupted or invalid"
    EXIT_CODE=2
fi

# Check 6: Backup content
echo "Checking backup content..."
BACKUP_LINES=$(gunzip -c "${LATEST_BACKUP}" 2>/dev/null | head -n 20 | wc -l)

if [[ ${BACKUP_LINES} -gt 0 ]]; then
    log_ok "Backup file contains SQL data"
else
    log_error "Backup file appears to be empty"
    EXIT_CODE=2
fi

# Check 7: Disk space
echo "Checking disk space..."
BACKUP_DIR_USAGE=$(df "${BACKUP_DIR}" | awk 'NR==2 {print $5}' | sed 's/%//')
TOTAL_BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)

echo "Backup directory usage: ${BACKUP_DIR_USAGE}%"
echo "Total backup size: ${TOTAL_BACKUP_SIZE}"

if [[ ${BACKUP_DIR_USAGE} -gt 90 ]]; then
    log_warn "Backup directory is over 90% full"
    EXIT_CODE=1
elif [[ ${BACKUP_DIR_USAGE} -gt 80 ]]; then
    log_warn "Backup directory is over 80% full"
else
    log_ok "Sufficient disk space available"
fi

# Check 8: List all backups with details
echo ""
echo "Backup History (most recent first):"
echo "=========================================="
printf "%-30s %-15s %-10s\n" "Filename" "Size" "Age"
echo "------------------------------------------"

find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -printf '%T+ %p\n' | sort -r | while read -r timestamp filepath; do
    filename=$(basename "${filepath}")
    size_bytes=$(stat -c%s "${filepath}" 2>/dev/null || stat -f%z "${filepath}" 2>/dev/null)
    size_kb=$((size_bytes / 1024))
    file_time=$(stat -c %Y "${filepath}" 2>/dev/null || stat -f %m "${filepath}" 2>/dev/null)
    age_hours=$(( (CURRENT_TIME - file_time) / 3600 ))

    printf "%-30s %-15s %-10s\n" "${filename}" "$(format_size ${size_kb})" "${age_hours}h"
done

# Optional: Test restore
if [[ "${1:-}" == "--test-restore" ]]; then
    echo ""
    echo "=========================================="
    echo "Testing Restore Capability"
    echo "=========================================="

    # Create temporary test database
    TEST_DB="${DB_NAME}_test_$(date +%s)"
    DB_USER="${DB_USER:-omnishop_user}"
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"

    log_warn "Creating test database: ${TEST_DB}"

    # Create test database
    if createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TEST_DB}" 2>/dev/null; then
        log_ok "Test database created"

        # Attempt restore
        if gunzip -c "${LATEST_BACKUP}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TEST_DB}" -v ON_ERROR_STOP=1 > /dev/null 2>&1; then
            log_ok "Test restore successful"
        else
            log_error "Test restore failed"
            EXIT_CODE=2
        fi

        # Cleanup test database
        dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TEST_DB}" 2>/dev/null || true
        log_ok "Test database removed"
    else
        log_warn "Could not create test database (may require additional permissions)"
    fi
fi

# Summary
echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo "Total backups: ${BACKUP_COUNT}"
echo "Latest backup: $(basename ${LATEST_BACKUP})"
echo "Backup age: ${BACKUP_AGE_HOURS} hours"
echo "Backup size: $(format_size ${BACKUP_SIZE_KB})"
echo "Disk usage: ${BACKUP_DIR_USAGE}%"
echo "Status: $(if [[ ${EXIT_CODE} -eq 0 ]]; then echo -e "${GREEN}HEALTHY${NC}"; elif [[ ${EXIT_CODE} -eq 1 ]]; then echo -e "${YELLOW}WARNING${NC}"; else echo -e "${RED}CRITICAL${NC}"; fi)"
echo "=========================================="

exit ${EXIT_CODE}
