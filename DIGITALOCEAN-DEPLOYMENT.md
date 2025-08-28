# 🚀 DigitalOcean Linux Server Deployment Guide

## Prerequisites
- DigitalOcean account
- Domain name (recommended)
- SSH key pair for secure access

## 1. Create DigitalOcean Droplet

### Recommended Specifications
```bash
# For production use:
- OS: Ubuntu 22.04 LTS
- Plan: Basic ($6/month minimum, $12/month recommended)
- CPU: 1-2 vCPUs
- Memory: 1-2 GB RAM
- Storage: 25-50 GB SSD

# For high traffic:
- Plan: General Purpose ($18/month+)
- CPU: 2+ vCPUs  
- Memory: 4+ GB RAM
- Storage: 80+ GB SSD
```

### Create Droplet
1. Log into DigitalOcean
2. Click "Create" → "Droplets"
3. Choose Ubuntu 22.04 LTS
4. Select your plan
5. Add your SSH key
6. Name your droplet (e.g., "tootunnid-prod")
7. Click "Create Droplet"

## 2. Initial Server Setup

### Connect to Server
```bash
ssh root@YOUR_DROPLET_IP
```

### Update System
```bash
apt update && apt upgrade -y
```

### Create Non-Root User
```bash
adduser deploy
usermod -aG sudo deploy
# Copy SSH keys to new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

### Install Required Software
```bash
# Install Node.js 18+ (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install PM2 (Process Manager)
npm install -g pm2

# Install Nginx (Reverse Proxy)
apt install nginx -y

# Install Certbot (SSL Certificates)
apt install certbot python3-certbot-nginx -y
```

## 3. Database Setup

### Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE tootunnid;
CREATE USER tootunnid_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE tootunnid TO tootunnid_user;
ALTER USER tootunnid_user CREATEDB;
\q
```

### Configure PostgreSQL for remote connections
```bash
# Edit PostgreSQL config
nano /etc/postgresql/14/main/postgresql.conf
# Find and uncomment:
# listen_addresses = 'localhost'

# Edit access config
nano /etc/postgresql/14/main/pg_hba.conf
# Add this line for local app access:
# local   all   tootunnid_user   md5

# Restart PostgreSQL
systemctl restart postgresql
```

## 4. Application Deployment

### Switch to deploy user
```bash
su - deploy
```

### Clone and setup application
```bash
# Clone your repository
git clone https://github.com/KeimoP/tootunnid.git
cd tootunnid

# Install dependencies
npm install

# Create production environment file
cp .env.production.template .env.production
```

### Configure Environment Variables
```bash
nano .env.production
```

Update with your production values:
```env
# Database
DATABASE_URL="postgresql://tootunnid_user:your_secure_password_here@localhost:5432/tootunnid"

# Authentication
JWT_SECRET="your_super_secure_jwt_secret_64_chars_long_random_string_here"
NEXTAUTH_SECRET="your_super_secure_nextauth_secret_64_chars_long_random_here"
NEXTAUTH_URL="https://too.keimohub.live"

# Security
ALLOWED_ORIGINS="https://too.keimohub.live,https://www.too.keimohub.live"

# Optional: Email/Monitoring
# SMTP_HOST="your.smtp.server"
# SMTP_PORT=587
# SMTP_USER="keimo.plaas22@gmail.com"  
# SMTP_PASS="your_gmail_app_password"
# SENTRY_DSN="your_sentry_dsn_for_error_tracking"
```

### Generate Secure Secrets
```bash
# Generate JWT secret (64 characters)
openssl rand -hex 32

# Generate NextAuth secret (64 characters)  
openssl rand -hex 32
```

### Setup Database
```bash
# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Build Application
```bash
npm run build
```

### Configure PM2
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add this configuration:
```javascript
module.exports = {
  apps: [{
    name: 'tootunnid',
    script: 'npm',
    args: 'start',
    cwd: '/home/deploy/tootunnid',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### Start Application with PM2
```bash
# Create logs directory
mkdir logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it provides
```

## 5. Nginx Configuration

### Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/tootunnid
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name too.keimohub.live www.too.keimohub.live;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Rate limit API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Stricter rate limit for auth endpoints
    location ~ /api/auth/(login|register) {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable the site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/tootunnid /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 6. SSL Certificate Setup

### Install SSL certificate with Certbot
```bash
# Get SSL certificate for too.keimohub.live
sudo certbot --nginx -d too.keimohub.live -d www.too.keimohub.live --email keimo.plaas22@gmail.com --agree-tos --non-interactive

# Test automatic renewal
sudo certbot renew --dry-run
```

## 7. Firewall Configuration

### Setup UFW firewall
```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

## 8. Monitoring and Maintenance

### Setup log rotation
```bash
sudo nano /etc/logrotate.d/tootunnid
```

Add:
```
/home/deploy/tootunnid/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 deploy deploy
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Useful PM2 commands
```bash
# Check application status
pm2 status

# View logs
pm2 logs tootunnid

# Restart application
pm2 restart tootunnid

# Monitor resources
pm2 monit

# Reload application (zero downtime)
pm2 reload tootunnid
```

## 9. Domain Configuration

### DNS Settings
Point your domain too.keimohub.live to your DigitalOcean droplet:
```
A Record:     too        → YOUR_DROPLET_IP
A Record:     www.too    → YOUR_DROPLET_IP
```

## 10. Deployment Script

Create an automated deployment script:
```bash
nano deploy.sh
```

```bash
#!/bin/bash
cd /home/deploy/tootunnid

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build

# Reload PM2 (zero downtime)
pm2 reload tootunnid

echo "✅ Deployment completed successfully!"
```

```bash
chmod +x deploy.sh
```

## 11. Security Checklist

- ✅ Non-root user created
- ✅ SSH key authentication
- ✅ Firewall configured
- ✅ SSL certificate installed
- ✅ Nginx security headers
- ✅ Rate limiting configured
- ✅ Database password secured
- ✅ JWT secrets randomized
- ✅ PM2 process monitoring

## 12. Backup Strategy

### Database Backups
```bash
# Create backup script
nano /home/deploy/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
pg_dump tootunnid > $BACKUP_DIR/tootunnid_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "✅ Backup completed: tootunnid_$DATE.sql"
```

```bash
chmod +x /home/deploy/backup.sh

# Setup daily backup cron job
crontab -e
# Add: 0 2 * * * /home/deploy/backup.sh
```

## 🎉 Your application is now live!

Visit your domain to see your time tracking application running on DigitalOcean!

### Next Steps:
1. Set up monitoring (Uptime Robot, Pingdom)
2. Configure error tracking (Sentry)
3. Set up email notifications
4. Consider setting up a staging environment
5. Implement automated backups to DigitalOcean Spaces

### Troubleshooting:
- Check PM2 logs: `pm2 logs tootunnid`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check system logs: `sudo journalctl -f`
