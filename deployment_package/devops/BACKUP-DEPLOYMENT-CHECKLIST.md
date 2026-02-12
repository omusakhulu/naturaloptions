# PostgreSQL Backup System Deployment Checklist

Use this checklist when deploying the backup system to production.

## Pre-Deployment

- [ ] Review server specifications (disk space, memory, CPU)
- [ ] Verify PostgreSQL is installed and running
- [ ] Confirm database name and credentials
- [ ] Check PM2 app name and status
- [ ] Estimate database size and growth rate
- [ ] Calculate backup storage requirements

## Deployment Steps

### 1. Upload Scripts to Server

```bash
# From local machine
scp deployment_package/devops/backup-postgres.sh root@167.86.108.197:/var/www/natural-options-admin/devops/
scp deployment_package/devops/restore-postgres.sh root@167.86.108.197:/var/www/natural-options-admin/devops/
scp deployment_package/devops/verify-backups.sh root@167.86.108.197:/var/www/natural-options-admin/devops/
scp deployment_package/devops/POSTGRES-BACKUP-RESTORE.md root@167.86.108.197:/var/www/natural-options-admin/devops/
scp deployment_package/devops/BACKUP-QUICK-REFERENCE.md root@167.86.108.197:/var/www/natural-options-admin/devops/
```

- [ ] Scripts uploaded successfully
- [ ] No errors during upload

### 2. Configure Server Environment

```bash
# SSH into server
ssh root@167.86.108.197

# Create backup directories
mkdir -p /var/backups/postgresql
mkdir -p /var/backups/postgresql/safety
chmod 700 /var/backups/postgresql
chmod 700 /var/backups/postgresql/safety

# Create log file
touch /var/log/backup-postgres.log
chmod 644 /var/log/backup-postgres.log
```

- [ ] Backup directories created
- [ ] Permissions set correctly (700)
- [ ] Log file created

### 3. Set Script Permissions

```bash
cd /var/www/natural-options-admin/devops
chmod +x backup-postgres.sh
chmod +x restore-postgres.sh
chmod +x verify-backups.sh
chown root:root *.sh
ls -la *.sh
```

- [ ] Scripts are executable
- [ ] Owner is root
- [ ] Permissions verified

### 4. Configure PostgreSQL Authentication

```bash
# Create .pgpass file
nano ~/.pgpass

# Add this line (replace YOUR_PASSWORD):
localhost:5432:omnishop:omnishop_user:YOUR_PASSWORD

# Set permissions
chmod 600 ~/.pgpass

# Test connection
psql -U omnishop_user -d omnishop -c "SELECT version();"
```

- [ ] .pgpass file created
- [ ] Permissions set to 600
- [ ] Database connection successful

### 5. Test Backup Script

```bash
cd /var/www/natural-options-admin/devops

# Run first backup manually
./backup-postgres.sh

# Verify backup was created
ls -lh /var/backups/postgresql/

# Check backup log
tail -50 /var/log/backup-postgres.log
```

- [ ] Backup script runs without errors
- [ ] Backup file created (*.sql.gz)
- [ ] Backup file size is reasonable (>100KB)
- [ ] Log shows success message

### 6. Test Verification Script

```bash
cd /var/www/natural-options-admin/devops

# Run verification
./verify-backups.sh

# Check exit code
echo $?  # Should be 0 for success
```

- [ ] Verification script runs without errors
- [ ] All checks pass (green status)
- [ ] Exit code is 0

### 7. Test Restore Script (Development First!)

**IMPORTANT**: Test on development/staging server first, NOT production!

```bash
# On DEV server only
cd /var/www/natural-options-admin/devops
LATEST=$(ls -t /var/backups/postgresql/omnishop_*.sql.gz | head -1)
./restore-postgres.sh $LATEST
```

- [ ] Restore script runs without errors
- [ ] Safety backup created automatically
- [ ] Database restored successfully
- [ ] Prisma migrations executed
- [ ] PM2 app restarted successfully
- [ ] Application works correctly after restore

### 8. Setup Automated Backups

```bash
# Edit root crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /var/www/natural-options-admin/devops/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1

# Add this line for weekly verification on Sundays at 3 AM
0 3 * * 0 /var/www/natural-options-admin/devops/verify-backups.sh >> /var/log/backup-verify.log 2>&1

# Save and exit, then verify
crontab -l
```

- [ ] Cron job added for daily backups
- [ ] Cron job added for weekly verification
- [ ] Cron jobs listed correctly

### 9. Wait for First Automated Backup

**Next day after 2 AM**:

```bash
# Check backup log
tail -100 /var/log/backup-postgres.log

# Verify backup was created
ls -lht /var/backups/postgresql/ | head -5

# Run verification
cd /var/www/natural-options-admin/devops
./verify-backups.sh
```

- [ ] Automated backup ran successfully
- [ ] Backup created at expected time
- [ ] No errors in log

### 10. Setup Monitoring and Alerts (Optional)

```bash
# Create monitoring script
nano /usr/local/bin/check-backup-health.sh

# Add monitoring to system monitoring tool
# (Nagios, Zabbix, Prometheus, etc.)
```

- [ ] Monitoring configured
- [ ] Alerts setup for backup failures
- [ ] Alerts setup for disk space warnings

## Post-Deployment Verification

### Day 1: Initial Verification
- [ ] First automated backup completed successfully
- [ ] Backup file exists and is valid
- [ ] No errors in logs
- [ ] Disk space is sufficient

### Week 1: Weekly Verification
- [ ] 7 daily backups exist
- [ ] Old backups are being retained
- [ ] Backup sizes are consistent
- [ ] No errors or warnings in logs

### Week 2-4: Retention Verification
- [ ] Backups older than 30 days are being deleted
- [ ] Retention policy is working correctly
- [ ] Disk space is stable

### Month 3: Disaster Recovery Test
- [ ] Full restore test on staging server
- [ ] Restore time documented (RTO)
- [ ] Data integrity verified after restore
- [ ] Team trained on restore procedure

## Configuration Summary

Record your configuration details:

```
Database Name: _______________
Database User: _______________
Database Host: _______________
Database Port: _______________
Backup Directory: _______________
Retention Days: _______________
Backup Time: _______________
PM2 App Name: _______________
```

## Rollback Plan

If backup system causes issues:

1. **Disable cron job**:
   ```bash
   crontab -e
   # Comment out backup line with #
   ```

2. **Remove scripts** (if necessary):
   ```bash
   cd /var/www/natural-options-admin/devops
   rm backup-postgres.sh restore-postgres.sh verify-backups.sh
   ```

3. **Keep existing backups**:
   ```bash
   # Do NOT delete /var/backups/postgresql/
   # Keep backups for manual recovery if needed
   ```

## Success Criteria

The backup system is considered successfully deployed when:

- [ ] Daily automated backups run successfully for 7 consecutive days
- [ ] Backup verification script shows "HEALTHY" status
- [ ] Disk space is sufficient for retention period
- [ ] Restore procedure has been tested successfully
- [ ] Team members are trained on backup/restore procedures
- [ ] Documentation is accessible and understood
- [ ] Monitoring and alerts are functioning

## Support and Documentation

- Full documentation: `/var/www/natural-options-admin/devops/POSTGRES-BACKUP-RESTORE.md`
- Quick reference: `/var/www/natural-options-admin/devops/BACKUP-QUICK-REFERENCE.md`
- Backup log: `/var/log/backup-postgres.log`
- Scripts location: `/var/www/natural-options-admin/devops/`

## Team Training Checklist

Ensure all team members understand:

- [ ] How to create manual backup before deployment
- [ ] How to list available backups
- [ ] How to restore from backup
- [ ] How to verify backup health
- [ ] Where to find logs and documentation
- [ ] Who to contact for escalation
- [ ] What to do in emergency situations

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Database Administrator | _______ | _______ | _______ |
| System Administrator | _______ | _______ | _______ |
| DevOps Engineer | _______ | _______ | _______ |
| Team Lead | _______ | _______ | _______ |

## Notes and Comments

Record any issues encountered during deployment or modifications made:

```
Date: _____________
Issue/Modification: _____________________________________________
Resolution: _____________________________________________________
Modified by: _______________
```

---

**Deployment Date**: ______________
**Deployed By**: ______________
**Verified By**: ______________
**Status**: [ ] Successful [ ] Needs Attention [ ] Failed
