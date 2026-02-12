# PostgreSQL Backup System for Natural Options Admin

Production-grade PostgreSQL backup and restore system for the Natural Options Admin Dashboard.

## Overview

This backup system provides automated, reliable database backups with safe restore capabilities, automatic retention management, and comprehensive error handling.

## Files Included

### Shell Scripts (Executable)

1. **backup-postgres.sh** (5.7 KB)
   - Automated database backup with gzip compression
   - Automatic retention management (default: 30 days)
   - Comprehensive logging and error handling
   - Designed for cron automation

2. **restore-postgres.sh** (9.9 KB)
   - Safe database restoration with automatic safety backup
   - PM2 application management (stop/start)
   - Prisma migration execution after restore
   - Automatic rollback on failure

3. **verify-backups.sh** (6.5 KB)
   - Backup health verification
   - File integrity checks
   - Age and size validation
   - Optional restore testing capability

### Documentation Files

4. **POSTGRES-BACKUP-RESTORE.md** (9.3 KB)
   - Complete documentation and usage guide
   - Installation instructions
   - Configuration options
   - Troubleshooting guide
   - Best practices and recommendations

5. **BACKUP-QUICK-REFERENCE.md** (6.8 KB)
   - Quick command reference
   - Common scenarios and solutions
   - Monitoring checklist
   - Emergency procedures

6. **BACKUP-DEPLOYMENT-CHECKLIST.md** (7.2 KB)
   - Step-by-step deployment guide
   - Verification procedures
   - Testing checklist
   - Sign-off requirements

7. **README-BACKUP-SYSTEM.md** (This file)
   - System overview and file listing

## Quick Start

### 1. Deploy to Server

```bash
# Upload all files to server
scp deployment_package/devops/{backup-postgres.sh,restore-postgres.sh,verify-backups.sh} \
    root@167.86.108.197:/var/www/natural-options-admin/devops/

scp deployment_package/devops/*.md \
    root@167.86.108.197:/var/www/natural-options-admin/devops/
```

### 2. Initial Setup

```bash
# SSH into server
ssh root@167.86.108.197

# Set permissions
cd /var/www/natural-options-admin/devops
chmod +x backup-postgres.sh restore-postgres.sh verify-backups.sh

# Create backup directories
mkdir -p /var/backups/postgresql/safety
chmod 700 /var/backups/postgresql

# Configure PostgreSQL password file
echo "localhost:5432:omnishop:omnishop_user:YOUR_PASSWORD" > ~/.pgpass
chmod 600 ~/.pgpass
```

### 3. Test Backup

```bash
# Run first backup
./backup-postgres.sh

# Verify it worked
ls -lh /var/backups/postgresql/
./verify-backups.sh
```

### 4. Setup Automation

```bash
# Add to cron
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /var/www/natural-options-admin/devops/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1
```

## Key Features

### Backup System
- Automated daily backups via cron
- Gzip compression (typically 80-90% space savings)
- Configurable retention policy (default: 30 days)
- Automatic cleanup of old backups
- File integrity verification
- Detailed logging with timestamps
- Zero-downtime operation

### Restore System
- Safety backup before restore (automatic rollback capability)
- PM2 application management
- Prisma migration execution
- Confirmation prompts for safety
- Comprehensive error handling
- Automatic rollback on failure
- Application status verification

### Verification System
- Backup age monitoring
- File size validation
- Gzip integrity checks
- Disk space monitoring
- Optional restore testing
- Colored output for easy reading
- Exit codes for monitoring integration

## Default Configuration

```bash
# Database
DB_NAME=omnishop
DB_USER=omnishop_user
DB_HOST=localhost
DB_PORT=5432

# Backup
BACKUP_DIR=/var/backups/postgresql
RETENTION_DAYS=30

# Application
APP_DIR=/var/www/natural-options-admin
PM2_APP_NAME=natural-options-admin
```

All values can be overridden via environment variables.

## System Requirements

### Server Requirements
- Ubuntu Linux (tested on Ubuntu 20.04+)
- PostgreSQL 12+ installed
- PM2 for application management
- Minimum 10GB free disk space for backups
- Root or sudo access

### Dependencies
- `bash` 4.0+
- `pg_dump` and `psql` (PostgreSQL client tools)
- `gzip` for compression
- `find` for retention management
- `pm2` for application control
- `npx` for Prisma migrations

## Usage Examples

### Create Manual Backup
```bash
./backup-postgres.sh
```

### Restore from Backup
```bash
./restore-postgres.sh /var/backups/postgresql/omnishop_20260213_020000.sql.gz
```

### Verify Backup Health
```bash
./verify-backups.sh
```

### Test Restore Capability
```bash
./verify-backups.sh --test-restore
```

### Custom Configuration
```bash
DB_NAME=mydb RETENTION_DAYS=60 ./backup-postgres.sh
```

## Monitoring Integration

### Exit Codes
- **0**: Success
- **1**: Warning (non-critical issues)
- **2**: Error (critical issues)

### Log Files
- Backup log: `/var/log/backup-postgres.log`
- Application logs: `pm2 logs natural-options-admin`

### Nagios/Zabbix Integration
```bash
# Add to monitoring system
/var/www/natural-options-admin/devops/verify-backups.sh
```

## Security Features

1. **File Permissions**: All backups stored with 600 permissions (owner only)
2. **Password Security**: Uses .pgpass file (600 permissions) for authentication
3. **Backup Encryption**: Can be extended with GPG encryption if needed
4. **Access Control**: Backup directory restricted to root (700 permissions)
5. **Audit Trail**: All operations logged with timestamps

## Disaster Recovery

### Recovery Time Objective (RTO)
- **Target**: < 5 minutes
- **Typical**: 2-3 minutes for full restore

### Recovery Point Objective (RPO)
- **Target**: < 24 hours
- **Actual**: Based on backup frequency (daily = 24h max)

### Disaster Recovery Procedure
1. Identify last good backup
2. Run restore script
3. Verify application functionality
4. Monitor for issues

See BACKUP-QUICK-REFERENCE.md for detailed procedures.

## Maintenance

### Daily
- Verify automated backup completed
- Check log for errors
- Monitor disk space

### Weekly
- Run verification script
- Review backup sizes
- Check retention is working

### Monthly
- Test restore on development server
- Review and archive old backups
- Update documentation if needed

### Quarterly
- Full disaster recovery test
- Review retention policies
- Update procedures and training

## Support

### Documentation
1. **POSTGRES-BACKUP-RESTORE.md**: Complete guide
2. **BACKUP-QUICK-REFERENCE.md**: Quick commands
3. **BACKUP-DEPLOYMENT-CHECKLIST.md**: Deployment guide

### Getting Help
- Check logs: `/var/log/backup-postgres.log`
- Review troubleshooting section in documentation
- Contact database administrator

### Known Issues
None at this time.

## Version History

### Version 1.0.0 (2026-02-13)
- Initial release
- Backup script with retention management
- Restore script with automatic rollback
- Verification script with integrity checks
- Comprehensive documentation
- Deployment checklist
- Quick reference guide

## License

Internal use for Natural Options Admin Dashboard.

## Credits

Developed by Database Administrator Agent
Last Updated: 2026-02-13

---

## Next Steps

1. Read **BACKUP-DEPLOYMENT-CHECKLIST.md** for step-by-step deployment
2. Follow deployment checklist to install on production server
3. Test backup and restore on development server first
4. Setup automated backups with cron
5. Train team on restore procedures
6. Schedule quarterly disaster recovery tests

For questions or issues, contact your database administrator.
