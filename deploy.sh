#!/bin/bash

# DigitalOcean Deployment Script for Tootunnid
# Run this script on your server for deployments

set -e

echo "🚀 Starting deployment..."

# Configuration
APP_DIR="/home/deploy/tootunnid"
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Navigate to app directory
cd $APP_DIR

echo "📦 Creating backup..."
# Backup current version
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz --exclude=node_modules --exclude=.git --exclude=logs .

# Backup database
pg_dump tootunnid > $BACKUP_DIR/db_backup_$DATE.sql

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci

echo "🗄️ Running database migrations..."
npx prisma migrate deploy
npx prisma generate

echo "🔨 Building application..."
npm run build

echo "♻️ Reloading application..."
pm2 reload tootunnid

echo "🧹 Cleaning old backups (keeping last 7 days)..."
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "✅ Deployment completed successfully!"
echo "📊 Application status:"
pm2 status tootunnid
