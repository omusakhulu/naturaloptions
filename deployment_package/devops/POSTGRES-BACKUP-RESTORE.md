# PostgreSQL Backup and Restore Scripts

Production-ready backup and restore scripts for the Natural Options Admin Dashboard PostgreSQL database.

## Files Created

- `backup-postgres.sh` - Automated database backup with retention management
- `restore-postgres.sh` - Safe database restoration with automatic rollback

## Features

### Backup Script (`backup-postgres.sh`)

- **Automated Backups**: Create compressed SQL dumps with timestamp-based naming
- **Retention Management**: Automatically delete backups older than configured days (default: 30)
- **Compression**: Uses gzip for space-efficient storage
- **Verification**: Ensures backup file is valid and non-empty
- **Error Handling**: Cleanup incomplete backups on failure
- **Detailed Logging**: Comprehensive logging with timestamps and summary reports
- **Secure Storage**: Sets proper file permissions (600) on backups

### Restore Script (`restore-postgres.sh`)

- **Safety First**: Creates automatic safety backup before restore
- **PM2 Integration**: Stops app before restore, restarts after completion
- **Prisma Migration**: Automatically runs `prisma migrate deploy` after restore
- **Automatic Rollback**: Restores from safety backup if restore fails
- **Confirmation Prompt**: Requires explicit "yes" confirmation before proceeding
- **Validation Checks**: Verifies backup file exists and is valid
- **Status Verification**: Confirms app is running after restore

## Installation on VPS (167.86.108.197)

### 1. Upload Scripts to Server

```bash
# From your local machine
scp deployment_package/devops/backup-postgres.sh root@167.86.108.197:/var/www/natural-options-admin/devops/
scp deployment_package/devops/restore-postgres.sh root@167.86.108.197:/var/www/natural-options-admin/devops/
```

### 2. Set Execute Permissions

```bash
# SSH into server
ssh root@167.86.108.197

# Set permissions
cd /var/www/natural-options-admin/devops
chmod +x backup-postgres.sh restore-postgres.sh
chown root:root backup-postgres.sh restore-postgres.sh
```

### 3. Configure PostgreSQL Password File

Create `~/.pgpass` file for passwordless authentication:

```bash
# Create .pgpass file
nano ~/.pgpass

# Add this line (replace YOUR_PASSWORD with actual password):
localhost:5432:omnishop:omnishop_user:YOUR_PASSWORD

# Set secure permissions
chmod 600 ~/.pgpass
```

### 4. Test Backup Script

```bash
# Run backup manually
./backup-postgres.sh

# Check backup was created
ls -lh /var/backups/postgresql/
```

### 5. Setup Automated Daily Backups

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /var/www/natural-options-admin/devops/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1

# Verify cron job
crontab -l
```

## Usage

### Manual Backup

```bash
# Basic usage (uses default configuration)
./backup-postgres.sh

# Custom configuration
DB_NAME=omnishop \
DB_USER=omnishop_user \
BACKUP_DIR=/custom/backup/path \
RETENTION_DAYS=60 \
./backup-postgres.sh
```

### Restore from Backup

```bash
# List available backups
ls -lh /var/backups/postgresql/

# Restore from specific backup
./restore-postgres.sh /var/backups/postgresql/omnishop_20260213_020000.sql.gz

# The script will:
# 1. Show backup details and ask for confirmation
# 2. Stop the PM2 app
# 3. Create a safety backup
# 4. Restore the database
# 5. Run Prisma migrations
# 6. Restart the PM2 app
# 7. Verify app is running
```

## Configuration Variables

Both scripts support environment variable configuration:

### Database Settings
- `DB_NAME` - Database name (default: `omnishop`)
- `DB_USER` - Database user (default: `omnishop_user`)
- `DB_HOST` - Database host (default: `localhost`)
- `DB_PORT` - Database port (default: `5432`)

### Backup Settings
- `BACKUP_DIR` - Backup directory (default: `/var/backups/postgresql`)
- `RETENTION_DAYS` - Days to keep backups (default: `30`)

### Application Settings
- `APP_DIR` - Application directory (default: `/var/www/natural-options-admin`)
- `PM2_APP_NAME` - PM2 app name (default: `natural-options-admin`)

## Backup Strategy Recommendations

### Frequency
- **Daily**: Automated backups at 2 AM (low traffic period)
- **Pre-deployment**: Manual backup before any deployment
- **Weekly**: Full backup with extended retention (90 days)
- **Monthly**: Archive backup stored offsite

### Retention Policy
- **Daily backups**: 30 days (configurable)
- **Weekly backups**: 90 days
- **Monthly backups**: 1 year
- **Safety backups**: Delete after verifying restore

### Storage Requirements

For database size estimation:
```bash
# Check current database size
psql -U omnishop_user -d omnishop -c "SELECT pg_size_pretty(pg_database_size('omnishop'));"

# Check backup size vs database size
du -sh /var/backups/postgresql/
```

Typical compression ratio: 5:1 to 10:1 (compressed backup is 10-20% of database size)

## Monitoring and Alerts

### Check Backup Logs

```bash
# View recent backup logs
tail -n 50 /var/log/backup-postgres.log

# Check for errors
grep -i error /var/log/backup-postgres.log

# Check backup summary
grep "Backup Summary" /var/log/backup-postgres.log -A 10
```

### Setup Backup Monitoring

Consider implementing:
1. **Email alerts** on backup failures
2. **Disk space monitoring** for backup directory
3. **Backup size monitoring** to detect issues
4. **Restoration testing** quarterly

### Backup Health Check Script

```bash
#!/bin/bash
# Quick backup health check
BACKUP_DIR="/var/backups/postgresql"
LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/omnishop_*.sql.gz | head -n1)

if [[ -n "${LATEST_BACKUP}" ]]; then
    BACKUP_AGE=$(($(date +%s) - $(stat -c %Y "${LATEST_BACKUP}")))
    BACKUP_HOURS=$((BACKUP_AGE / 3600))

    if [[ ${BACKUP_HOURS} -lt 25 ]]; then
        echo "OK: Latest backup is ${BACKUP_HOURS} hours old"
        exit 0
    else
        echo "WARNING: Latest backup is ${BACKUP_HOURS} hours old"
        exit 1
    fi
else
    echo "CRITICAL: No backups found"
    exit 2
fi
```

## Disaster Recovery Procedures

### Scenario 1: Database Corruption

```bash
# 1. Stop the application
pm2 stop natural-options-admin

# 2. Restore from latest backup
./restore-postgres.sh /var/backups/postgresql/omnishop_LATEST.sql.gz

# 3. Verify application functionality
# Check logs: pm2 logs natural-options-admin
```

### Scenario 2: Accidental Data Deletion

```bash
# 1. Identify the backup before the deletion
ls -lh /var/backups/postgresql/ | grep "2026021[2-3]"

# 2. Restore from that backup
./restore-postgres.sh /var/backups/postgresql/omnishop_20260212_020000.sql.gz

# 3. Verify data is restored correctly
```

### Scenario 3: Server Migration

```bash
# On old server - create backup
./backup-postgres.sh

# Copy backup to new server
scp /var/backups/postgresql/omnishop_LATEST.sql.gz new-server:/tmp/

# On new server - restore
./restore-postgres.sh /tmp/omnishop_LATEST.sql.gz
```

## Testing Restore Procedure

**IMPORTANT**: Test restore procedure quarterly to ensure backups are valid.

### Test Restore on Staging/Development

```bash
# 1. Copy production backup to dev server
scp root@167.86.108.197:/var/backups/postgresql/omnishop_LATEST.sql.gz /tmp/

# 2. Restore on dev server
DB_NAME=omnishop_dev ./restore-postgres.sh /tmp/omnishop_LATEST.sql.gz

# 3. Verify data integrity
# - Check record counts
# - Test critical queries
# - Verify relationships
```

## Troubleshooting

### Backup Fails: "Database not accessible"
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test database connection
psql -U omnishop_user -d omnishop -c "SELECT version();"

# Check ~/.pgpass permissions
ls -la ~/.pgpass
```

### Restore Fails: "Permission denied"
```bash
# Ensure user has restore privileges
psql -U postgres -c "ALTER USER omnishop_user WITH SUPERUSER;"

# Or restore as postgres user
DB_USER=postgres ./restore-postgres.sh /path/to/backup.sql.gz
```

### Backup Directory Full
```bash
# Check disk space
df -h /var/backups/postgresql/

# Reduce retention period temporarily
RETENTION_DAYS=7 ./backup-postgres.sh

# Or move old backups to archive storage
mv /var/backups/postgresql/omnishop_202601*.sql.gz /archive/
```

### PM2 App Won't Restart After Restore
```bash
# Check PM2 logs
pm2 logs natural-options-admin --lines 50

# Try manual restart
cd /var/www/natural-options-admin
pm2 restart natural-options-admin

# Check Prisma migrations
npx prisma migrate status
```

## Security Best Practices

1. **Secure .pgpass file**: Always set permissions to 600
2. **Encrypt backups**: Consider using gpg for sensitive data
3. **Offsite storage**: Copy critical backups to remote location
4. **Access control**: Restrict backup directory to root only
5. **Audit logs**: Regularly review backup and restore logs
6. **Test restores**: Verify backups can be restored successfully

## Support

For issues or questions:
- Check logs: `/var/log/backup-postgres.log`
- Review script output for detailed error messages
- Contact database administrator

## Changelog

### Version 1.0.0 (2026-02-13)
- Initial release
- Automated backup with retention management
- Safe restore with automatic rollback
- PM2 and Prisma integration
- Comprehensive error handling and logging
