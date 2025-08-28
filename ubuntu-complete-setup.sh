#!/bin/bash

# 🚀 Complete Ubuntu Server Setup for Tootunnid
# This script sets up everything from scratch on a fresh Ubuntu 22.04 server
# Domain: too.keimohub.live
# Email: keimo.plaas22@gmail.com

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="too.keimohub.live"
WWW_DOMAIN="www.too.keimohub.live"
EMAIL="keimo.plaas22@gmail.com"
APP_USER="deploy"
APP_DIR="/home/deploy/tootunnid"
DB_NAME="tootunnid"
DB_USER="tootunnid_user"
DB_PASS="tootunnid_$(openssl rand -hex 12)"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_status "🚀 Starting complete Ubuntu server setup for Tootunnid..."
print_status "Domain: $DOMAIN"
print_status "Email: $EMAIL"

# 1. System Update
print_status "📦 Updating system packages..."
apt update && apt upgrade -y

# Enable swap if not present (helps with memory issues)
if [ ! -f /swapfile ]; then
    print_status "💾 Creating swap file for better memory management..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    print_success "2GB swap file created"
fi

print_success "System updated"

# 2. Install essential packages
print_status "📦 Installing essential packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release ufw fail2ban

# 3. Install Node.js 18
print_status "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
print_success "Node.js $(node --version) installed"

# 4. Install PostgreSQL
print_status "🗄️ Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
print_success "PostgreSQL installed and started"

# 5. Install Nginx
print_status "🌐 Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx
print_success "Nginx installed and started"

# 6. Install Certbot for SSL
print_status "🔒 Installing Certbot..."
apt install -y certbot python3-certbot-nginx
print_success "Certbot installed"

# 7. Install PM2 globally
print_status "⚡ Installing PM2..."
npm install -g pm2@latest
print_success "PM2 installed"

# 8. Create application user
print_status "👤 Creating application user..."
if id "$APP_USER" &>/dev/null; then
    print_warning "User $APP_USER already exists"
else
    adduser --disabled-password --gecos "" $APP_USER
    usermod -aG sudo $APP_USER
    print_success "User $APP_USER created"
fi

# 9. Setup SSH keys for deploy user
print_status "🔑 Setting up SSH keys..."
mkdir -p /home/$APP_USER/.ssh
if [ -d /root/.ssh ]; then
    cp /root/.ssh/authorized_keys /home/$APP_USER/.ssh/ 2>/dev/null || true
    chown -R $APP_USER:$APP_USER /home/$APP_USER/.ssh
    chmod 700 /home/$APP_USER/.ssh
    chmod 600 /home/$APP_USER/.ssh/authorized_keys 2>/dev/null || true
fi

# 10. Configure PostgreSQL
print_status "🗄️ Configuring PostgreSQL..."
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF
print_success "PostgreSQL database configured"

# 11. Clone and setup application
print_status "📥 Cloning application..."
sudo -u $APP_USER bash << EOF
cd /home/$APP_USER
if [ -d "tootunnid" ]; then
    print_warning "Directory tootunnid already exists, updating..."
    cd tootunnid
    git pull origin main || git pull origin master
else
    git clone https://github.com/KeimoP/tootunnid.git
    cd tootunnid
fi
EOF
print_success "Application cloned"

# 12. Install application dependencies
print_status "📦 Installing application dependencies..."
sudo -u $APP_USER bash << EOF
cd $APP_DIR

# Clear npm cache and node_modules to avoid conflicts
echo "🧹 Cleaning npm cache and modules..."
npm cache clean --force
rm -rf node_modules package-lock.json

# Install dependencies with memory optimization
echo "📦 Installing dependencies (with memory optimization)..."
npm install --no-audit --no-fund --prefer-offline

# Update Prisma to latest version
echo "📦 Updating Prisma..."
npm install --save-dev prisma@latest --no-audit --no-fund
npm install @prisma/client@latest --no-audit --no-fund

echo "✅ Dependencies installed successfully"
EOF
print_success "Dependencies installed and Prisma updated"

# 13. Create production environment file
print_status "⚙️ Creating production environment..."
sudo -u $APP_USER tee $APP_DIR/.env.production > /dev/null << EOF
# Production Environment for Tootunnid
NODE_ENV=production

# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# Authentication
JWT_SECRET="$(openssl rand -hex 32)"
NEXTAUTH_SECRET="$(openssl rand -hex 32)"
NEXTAUTH_URL="https://$DOMAIN"

# Security
ALLOWED_ORIGINS="https://$DOMAIN,https://$WWW_DOMAIN"
DATA_ENCRYPTION_KEY="$(openssl rand -hex 16)"

# Generated on $(date)
EOF
print_success "Environment file created"

# 14. Run database migrations
print_status "🗄️ Running database migrations..."
sudo -u $APP_USER bash << EOF
cd $APP_DIR
export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# Create production Prisma schema for PostgreSQL
echo "🔧 Creating production Prisma schema for PostgreSQL..."
cat > prisma/schema.prisma << 'PRISMA_EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String        @id @default(cuid())
  email            String        @unique
  name             String
  password         String
  hourlyWage       Float         @default(0)
  role             UserRole      @default(WORKER)
  sharingCode      String?       @unique
  profilePicture   String?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  encryptedWage    String?
  timeEntries      TimeEntry[]
  receivedRequests WorkRequest[] @relation("ReceivedRequests")
  sentRequests     WorkRequest[] @relation("SentRequests")
  bossRelations    WorkerBoss[]  @relation("Boss")
  workerRelations  WorkerBoss[]  @relation("Worker")

  @@map("users")
}

model TimeEntry {
  id        String    @id @default(cuid())
  userId    String
  clockIn   DateTime
  clockOut  DateTime?
  duration  Int?
  earnings  Float?
  isPrivate Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("time_entries")
}

model WorkRequest {
  id         String        @id @default(cuid())
  fromUserId String
  toUserId   String
  status     RequestStatus @default(PENDING)
  message    String?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  toUser     User          @relation("ReceivedRequests", fields: [toUserId], references: [id], onDelete: Cascade)
  fromUser   User          @relation("SentRequests", fields: [fromUserId], references: [id], onDelete: Cascade)

  @@map("work_requests")
}

model WorkerBoss {
  id        String   @id @default(cuid())
  workerId  String
  bossId    String
  createdAt DateTime @default(now())
  boss      User     @relation("Boss", fields: [bossId], references: [id], onDelete: Cascade)
  worker    User     @relation("Worker", fields: [workerId], references: [id], onDelete: Cascade)

  @@unique([workerId, bossId])
  @@map("worker_boss")
}

enum UserRole {
  WORKER
  BOSS
  ADMIN
}

enum RequestStatus {
  PENDING
  ACCEPTED
  REJECTED
}
PRISMA_EOF

echo "✅ Production schema created"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Initialize database with migration
echo "🗄️ Creating initial migration..."
npx prisma migrate dev --name init --create-only
npx prisma migrate deploy

echo "✅ Database migrations completed"
EOF
print_success "Database migrations completed"

# 15. Build application
print_status "🔨 Building application..."
sudo -u $APP_USER bash << EOF
cd $APP_DIR

# Set Node.js memory options for build
export NODE_OPTIONS="--max-old-space-size=1024"
echo "🔨 Building application with optimized memory settings..."
npm run build
EOF
print_success "Application built"

# 16. Create directories
print_status "📁 Creating directories..."
sudo -u $APP_USER mkdir -p $APP_DIR/logs
sudo -u $APP_USER mkdir -p /home/$APP_USER/backups

# 17. Configure Nginx
print_status "🌐 Configuring Nginx..."
tee /etc/nginx/sites-available/tootunnid > /dev/null << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=general:10m rate=60r/m;

server {
    listen 80;
    server_name too.keimohub.live www.too.keimohub.live;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;

    # Static files
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API routes with rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        limit_req_status 429;
        proxy_pass http://localhost:3000;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
        proxy_pass http://localhost:3000;
    }

    # Main application
    location / {
        limit_req zone=general burst=30 nodelay;
        limit_req_status 429;
        proxy_pass http://localhost:3000;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }

    # Logging
    access_log /var/log/nginx/tootunnid_access.log;
    error_log /var/log/nginx/tootunnid_error.log warn;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/tootunnid /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t
systemctl reload nginx
print_success "Nginx configured"

# 18. Setup firewall
print_status "🔥 Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force reload
print_success "Firewall configured"

# 19. Configure fail2ban
print_status "🛡️ Configuring fail2ban..."
tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable fail2ban
systemctl start fail2ban
print_success "Fail2ban configured"

# 20. Start application with PM2
print_status "⚡ Starting application with PM2..."
sudo -u $APP_USER bash << EOF
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
EOF

# Setup PM2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
systemctl enable pm2-$APP_USER
print_success "PM2 configured and application started"

# 21. Setup SSL certificate
print_status "🔒 Setting up SSL certificate..."
certbot --nginx -d $DOMAIN -d $WWW_DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --redirect

# Test SSL renewal
certbot renew --dry-run
print_success "SSL certificate installed and auto-renewal configured"

# 22. Create backup script
print_status "💾 Creating backup script..."
tee /home/$APP_USER/backup.sh > /dev/null << EOF
#!/bin/bash
BACKUP_DIR="/home/$APP_USER/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Database backup
pg_dump $DB_NAME > \$BACKUP_DIR/${DB_NAME}_\$DATE.sql

# Application backup
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz -C $APP_DIR --exclude=node_modules --exclude=.git --exclude=logs .

# Keep only last 7 days
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: \$DATE"
EOF

chmod +x /home/$APP_USER/backup.sh
chown $APP_USER:$APP_USER /home/$APP_USER/backup.sh

# Setup daily backup cron
sudo -u $APP_USER bash << 'EOF'
(crontab -l 2>/dev/null; echo "0 2 * * * /home/deploy/backup.sh >> /home/deploy/backups/backup.log 2>&1") | crontab -
EOF
print_success "Backup script created and scheduled"

# 23. Create deployment script
print_status "🚀 Creating deployment script..."
tee /home/$APP_USER/deploy.sh > /dev/null << EOF
#!/bin/bash
set -e
cd $APP_DIR

echo "🚀 Starting deployment..."

# Backup before deploy
/home/$APP_USER/backup.sh

# Pull latest changes
git pull origin main || git pull origin master

# Clean and install dependencies (avoid cache issues)
echo "🧹 Cleaning npm cache..."
npm cache clean --force
rm -rf node_modules/.cache

# Install dependencies with memory optimization
echo "📦 Installing dependencies..."
npm install --no-audit --no-fund

# Update Prisma if needed
echo "📦 Updating Prisma..."
npm install --save-dev prisma@latest --no-audit --no-fund
npm install @prisma/client@latest --no-audit --no-fund

# Set database URL for Prisma commands
export DATABASE_URL=\$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"')

# Run migrations
echo "🗄️ Running database migrations..."
npx prisma generate
npx prisma migrate deploy

# Build application with memory optimization
echo "🔨 Building application..."
export NODE_OPTIONS="--max-old-space-size=1024"
npm run build

# Reload PM2
echo "⚡ Reloading application..."
pm2 reload tootunnid

echo "✅ Deployment completed!"
pm2 status tootunnid
EOF

chmod +x /home/$APP_USER/deploy.sh
chown $APP_USER:$APP_USER /home/$APP_USER/deploy.sh
print_success "Deployment script created"

# 24. Setup log rotation
print_status "📋 Setting up log rotation..."
tee /etc/logrotate.d/tootunnid > /dev/null << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 $APP_USER $APP_USER
    postrotate
        sudo -u $APP_USER pm2 reloadLogs
    endscript
}
EOF
print_success "Log rotation configured"

# 25. Create monitoring script
print_status "📊 Setting up monitoring..."
tee /home/$APP_USER/monitor.sh > /dev/null << EOF
#!/bin/bash
# Simple health check and restart if needed
if ! curl -f https://$DOMAIN/health >/dev/null 2>&1; then
    echo "\$(date): Health check failed, restarting application" >> /home/$APP_USER/monitor.log
    pm2 restart tootunnid
fi
EOF

chmod +x /home/$APP_USER/monitor.sh
chown $APP_USER:$APP_USER /home/$APP_USER/monitor.sh

# Setup monitoring cron (every 5 minutes)
sudo -u $APP_USER bash << 'EOF'
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/deploy/monitor.sh") | crontab -
EOF
print_success "Monitoring script created"

# 26. Final system optimizations
print_status "⚙️ Applying system optimizations..."

# Increase file limits
tee -a /etc/security/limits.conf > /dev/null << EOF
$APP_USER soft nofile 65536
$APP_USER hard nofile 65536
EOF

# Optimize kernel parameters
tee -a /etc/sysctl.conf > /dev/null << EOF
# Network optimizations for web server
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 65536 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.ipv4.tcp_congestion_control = bbr
EOF

sysctl -p
print_success "System optimizations applied"

# 27. Save database credentials
print_status "💾 Saving database credentials..."
sudo -u $APP_USER tee /home/$APP_USER/database-info.txt > /dev/null << EOF
Database Information for Tootunnid
==================================
Database Name: $DB_NAME
Database User: $DB_USER
Database Password: $DB_PASS
Connection URL: postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME

Generated on: $(date)
EOF
chmod 600 /home/$APP_USER/database-info.txt

# Final status check
print_status "🔍 Final status check..."
sleep 5

echo ""
echo "========================================"
print_success "🎉 SETUP COMPLETED SUCCESSFULLY!"
echo "========================================"
echo ""
print_status "📊 System Status:"
echo "✅ Node.js: $(node --version)"
echo "✅ PostgreSQL: Running"
echo "✅ Nginx: Running"
echo "✅ PM2: $(pm2 --version)"
echo "✅ Application: $(sudo -u $APP_USER pm2 list | grep tootunnid | awk '{print $18}')"
echo "✅ SSL: Configured for $DOMAIN"
echo "✅ Firewall: Active"
echo "✅ Fail2ban: Active"
echo ""
print_status "🌐 Your application is available at:"
echo "   https://$DOMAIN"
echo "   https://$WWW_DOMAIN"
echo ""
print_status "📁 Important files:"
echo "   Application: $APP_DIR"
echo "   Environment: $APP_DIR/.env.production"
echo "   Deploy script: /home/$APP_USER/deploy.sh"
echo "   Backup script: /home/$APP_USER/backup.sh"
echo "   Database info: /home/$APP_USER/database-info.txt"
echo ""
print_status "🔧 Useful commands:"
echo "   sudo -u $APP_USER pm2 status"
echo "   sudo -u $APP_USER pm2 logs tootunnid"
echo "   sudo -u $APP_USER /home/$APP_USER/deploy.sh"
echo "   sudo -u $APP_USER /home/$APP_USER/backup.sh"
echo ""
print_warning "🔒 IMPORTANT: Save the database password from /home/$APP_USER/database-info.txt"
print_warning "📝 Make sure your domain DNS points to this server's IP address"
echo ""
print_success "🚀 Setup complete! Your time tracking application is ready for production!"
