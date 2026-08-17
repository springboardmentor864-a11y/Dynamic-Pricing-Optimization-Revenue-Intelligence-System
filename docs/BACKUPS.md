# PostgreSQL Backup & Restore Procedures Guide

This guide outlines standard administration operations for backing up and restoring the PricePilot AI PostgreSQL database.

---

## 💾 Backing Up the Database

To create a complete backup dump of the database (containing table schemas, indexes, and row entries), use the standard `pg_dump` utility.

### 1. Simple SQL Schema + Data Dump
Saves backup as a plain-text SQL script file containing all instructions:
```bash
pg_dump -h localhost -U postgres -d pricepilot_ai -F p -f pricepilot_backup_date.sql
```

### 2. Compressed Custom Binary Format (Recommended for Production)
Saves backup in compressed binary format, compatible with high-speed parallel restoring:
```bash
pg_dump -h localhost -U postgres -d pricepilot_ai -F c -b -v -f pricepilot_backup_date.dump
```

### 3. Running inside Docker Compose Container
If your PostgreSQL instance is running inside the Compose container stack:
```bash
docker exec -t pricepilot-db pg_dump -U postgres -d pricepilot_ai -F c > pricepilot_backup_date.dump
```

---

## 🔄 Restoring the Database

### 1. Restore Plain-Text SQL script
Run this command to feed standard SQL statements back into a target database:
```bash
psql -h localhost -U postgres -d pricepilot_ai -f pricepilot_backup_date.sql
```

### 2. Restore Custom Compressed Binary dump
Use `pg_restore` to load compressed binary files:
```bash
pg_restore -h localhost -U postgres -d pricepilot_ai -v pricepilot_backup_date.dump
```

### 3. Restore inside Docker Compose Container
```bash
docker exec -i pricepilot-db pg_restore -U postgres -d pricepilot_ai -v < pricepilot_backup_date.dump
```

---

## ⏰ Automated Daily Backup Script (Cron / task scheduler)

Below is a standard bash cron job script to run daily at 02:00 AM:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/pricepilot"
DB_NAME="pricepilot_ai"
DB_USER="postgres"
DATE=$(date +%Y-%m-%d_%H%M%S)

# Ensure backup folder exists
mkdir -p $BACKUP_DIR

# Run pg_dump
pg_dump -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_DIR/${DB_NAME}_backup_${DATE}.dump"

# Delete backups older than 14 days to preserve disk space
find $BACKUP_DIR -type f -name "*.dump" -mtime +14 -delete
```
To register this script in Linux cron:
1. Run `crontab -e`.
2. Append: `0 2 * * * /usr/local/bin/pricepilot_backup.sh`.
