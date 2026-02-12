# PostgreSQL Backup Quick Reference

Quick reference guide for common backup and restore operations.

## Emergency Contacts

- **Database Administrator**: [Your contact]
- **System Administrator**: [Your contact]
- **Emergency Escalation**: [Your contact]

## Quick Commands

### Create Manual Backup

```bash
cd /var/www/natural-options-admin/devops
./backup-postgres.sh
```

### List Available Backups

```bash
ls -lht /var/backups/postgresql/ | head -10
```

### Verify Backup Health

```bash
cd /var/www/natural-options-admin/devops
./verify-backups.sh
```

### Restore from Latest Backup

```bash
cd /var/www/natural-options-admin/devops
LATEST=$(ls -t /var/backups/postgresql/omnishop_*.sql.gz | head -1)
./restore-postgres.sh $LATEST
```

### Restore from Specific Backup

```bash
cd /var/www/natural-options-admin/devops
./restore-postgres.sh /var/backups/postgresql/omnishop_20260213_020000.sql.gz
```

## Common Scenarios

### Before Deployment

```bash
# 1. Create backup
./backup-postgres.sh

# 2. Note the backup filename (in case rollback needed)
ls -lht /var/backups/postgresql/ | head -1

# 3. Proceed with deployment
```

### After Problematic Deployment

```bash
# 1. Stop the app
pm2 stop natural-options-admin

# 2. Restore from pre-deployment backup
./restore-postgres.sh /var/backups/postgresql/omnishop_TIMESTAMP.sql.gz

# 3. App will be automatically restarted
```

### Data Corruption Detected

```bash
# 1. Identify last known good backup
ls -lht /var/backups/postgresql/

# 2. Restore from that backup
./restore-postgres.sh /var/backups/postgresql/omnishop_TIMESTAMP.sql.gz

# 3. Verify data integrity after restore
```

### Weekly Backup Verification

```bash
# Run verification with restore test
./verify-backups.sh --test-restore

# Check the exit code
echo $?  # 0=healthy, 1=warning, 2=critical
```

### Copy Backup to Remote Location

```bash
# Copy latest backup to remote server
LATEST=$(ls -t /var/backups/postgresql/omnishop_*.sql.gz | head -1)
scp $LATEST backup-server:/backups/natural-options/
```

## Monitoring Checklist

### Daily (Automated)
- [ ] Backup runs successfully at 2 AM
- [ ] Backup log shows no errors
- [ ] Backup size is reasonable (not 0 bytes)

### Weekly (Manual)
- [ ] Verify backup exists and is recent (<25 hours)
- [ ] Check backup directory disk space (<80%)
- [ ] Run backup verification script
- [ ] Review backup logs for warnings

### Monthly (Manual)
- [ ] Test restore on development server
- [ ] Verify Prisma migrations work after restore
- [ ] Check backup retention is working
- [ ] Archive old backups to offsite storage

### Quarterly (Manual)
- [ ] Full disaster recovery test
- [ ] Document restore time (RTO)
- [ ] Verify backup documentation is current
- [ ] Review and update retention policies

## Log Locations

- **Backup logs**: `/var/log/backup-postgres.log`
- **Application logs**: `pm2 logs natural-options-admin`
- **PostgreSQL logs**: `/var/log/postgresql/postgresql-*.log`
- **System logs**: `/var/log/syslog`

## Check Commands

```bash
# Check last backup
tail -20 /var/log/backup-postgres.log

# Check backup errors
grep -i error /var/log/backup-postgres.log | tail -10

# Check disk space
df -h /var/backups/postgresql/

# Check database size
psql -U omnishop_user -d omnishop -c "SELECT pg_size_pretty(pg_database_size('omnishop'));"

# Check backup count
ls /var/backups/postgresql/omnishop_*.sql.gz | wc -l

# Check oldest backup
ls -lt /var/backups/postgresql/omnishop_*.sql.gz | tail -1

# Check PM2 app status
pm2 status natural-options-admin

# Check PostgreSQL status
systemctl status postgresql
```

## Troubleshooting

### Backup Failed: No Space Left

```bash
# Check disk space
df -h

# Delete old backups manually
cd /var/backups/postgresql
rm omnishop_202601*.sql.gz

# Or reduce retention temporarily
RETENTION_DAYS=7 ./backup-postgres.sh
```

### Backup Failed: Database Not Accessible

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Restart if needed
systemctl restart postgresql

# Test connection
psql -U omnishop_user -d omnishop -c "SELECT 1;"
```

### Restore Failed: Permission Denied

```bash
# Check .pgpass file
ls -la ~/.pgpass
cat ~/.pgpass

# Fix permissions if needed
chmod 600 ~/.pgpass
```

### App Won't Start After Restore

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs natural-options-admin --lines 50

# Try manual restart
pm2 restart natural-options-admin

# Check database connection in .env
cat /var/www/natural-options-admin/.env | grep DATABASE_URL
```

## Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Backup age | >25 hours | >48 hours | Investigate cron job |
| Backup size | <100KB | <10KB | Check database connectivity |
| Disk usage | >80% | >90% | Clean old backups or expand disk |
| Backup failures | 1 in 7 days | 2 consecutive | Check logs and fix issue |

## Backup File Naming Convention

Format: `omnishop_YYYYMMDD_HHMMSS.sql.gz`

Example: `omnishop_20260213_020000.sql.gz`
- Date: February 13, 2026
- Time: 02:00:00 (2 AM)

## Security Notes

1. **File Permissions**: All backups have 600 permissions (owner read/write only)
2. **Password File**: ~/.pgpass must have 600 permissions
3. **Backup Directory**: /var/backups/postgresql should have 700 permissions
4. **Safety Backups**: Automatically created before restore, stored in /var/backups/postgresql/safety/

## Performance Impact

- **Backup duration**: Typically 30-120 seconds (depends on database size)
- **CPU impact**: Moderate during pg_dump
- **I/O impact**: High during backup creation
- **Application impact**: None (backup runs while app is live)
- **Restore duration**: 2-5 minutes including app restart
- **Downtime during restore**: 2-5 minutes (app is stopped)

## Retention Policy

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Daily | 2 AM | 30 days | /var/backups/postgresql/ |
| Pre-deployment | Manual | 7 days | /var/backups/postgresql/ |
| Safety (restore) | Automatic | Until verified | /var/backups/postgresql/safety/ |
| Archive | Monthly | 1 year | Offsite storage |

## Support Escalation

1. **Level 1**: Check logs, verify backup exists
2. **Level 2**: Run verification script, attempt restore on dev
3. **Level 3**: Contact database administrator
4. **Level 4**: Emergency escalation for data loss

## Additional Resources

- Full documentation: `POSTGRES-BACKUP-RESTORE.md`
- Script source: `backup-postgres.sh`, `restore-postgres.sh`
- Verification tool: `verify-backups.sh`
