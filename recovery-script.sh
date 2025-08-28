#!/bin/bash

# Recovery script for when ubuntu-complete-setup.sh fails
# This script continues from where the setup failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration (should match main script)
DOMAIN="too.keimohub.live"
WWW_DOMAIN="www.too.keimohub.live"
EMAIL="keimo.plaas22@gmail.com"
APP_USER="deploy"
APP_DIR="/home/deploy/tootunnid"
DB_NAME="tootunnid"
DB_USER="tootunnid_user"

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

echo "🔧 Starting recovery and cleanup..."

# 1. Clean up npm cache and modules
print_status "🧹 Cleaning up npm cache and corrupted modules..."
sudo -u $APP_USER bash << 'EOF'
cd /home/deploy/tootunnid
echo "Cleaning npm cache..."
npm cache clean --force

echo "Removing corrupted node_modules..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf .npm

echo "Cleaning npm cache directory..."
rm -rf ~/.npm/_cacache
rm -rf ~/.npm/_logs
EOF

# 2. Add more swap if needed
print_status "💾 Checking swap space..."
SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_SIZE" -lt 2000 ]; then
    print_status "Adding more swap space..."
    
    # Remove existing swap if it's too small
    if [ -f /swapfile ]; then
        swapoff /swapfile
        rm /swapfile
    fi
    
    # Create 4GB swap file
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    print_success "4GB swap file created"
fi

# 3. Install dependencies with maximum memory optimization
print_status "📦 Installing dependencies with memory optimization..."
sudo -u $APP_USER bash << 'EOF'
cd /home/deploy/tootunnid

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=1536"
export NPM_CONFIG_MAXSOCKETS=1
export NPM_CONFIG_PROGRESS=false

echo "Installing dependencies one by one to avoid memory issues..."

# Install production dependencies first
npm install --production --no-audit --no-fund --prefer-offline

# Install dev dependencies separately
npm install --save-dev prisma@latest --no-audit --no-fund
npm install @prisma/client@latest --no-audit --no-fund

echo "✅ Dependencies installed successfully"
EOF

# 4. Run database setup
print_status "🗄️ Setting up database..."

# Get or create database password
if [ -f /home/$APP_USER/database-info.txt ]; then
    DB_PASS=$(grep 'Database Password:' /home/$APP_USER/database-info.txt | cut -d ':' -f2 | xargs)
    print_status "Using existing database password"
else
    DB_PASS="tootunnid_$(openssl rand -hex 12)"
    print_status "Creating new database password"
fi

# Recreate PostgreSQL database and user
print_status "🗄️ Recreating PostgreSQL database and user..."
sudo -u postgres psql << EOF
-- Drop existing database and user if they exist
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;

-- Create fresh database and user
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;

-- Grant additional permissions
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
\q
EOF

print_success "PostgreSQL database and user recreated"

# Save database credentials
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

# Update environment file with correct credentials
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

print_success "Environment file updated with correct credentials"

sudo -u $APP_USER bash << EOF
cd $APP_DIR
export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
export NODE_OPTIONS="--max-old-space-size=1024"

# Create production Prisma schema for PostgreSQL
echo "🔧 Creating production Prisma schema..."
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

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate dev --name init --create-only
npx prisma migrate deploy
EOF

# 5. Build application with memory optimization
print_status "🔨 Building application..."
sudo -u $APP_USER bash << 'EOF'
cd /home/deploy/tootunnid
export NODE_OPTIONS="--max-old-space-size=1536"
export GENERATE_SOURCEMAP=false

echo "Building application..."
npm run build
EOF

# 6. Start with PM2
print_status "⚡ Starting application with PM2..."
sudo -u $APP_USER bash << 'EOF'
cd /home/deploy/tootunnid

# Kill any existing PM2 processes
pm2 kill

# Start fresh
pm2 start ecosystem.config.js
pm2 save
EOF

# Setup PM2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
systemctl enable pm2-$APP_USER

# 7. Test the application
print_status "🔍 Testing application..."
sleep 10

if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    print_success "✅ Application is running successfully!"
else
    print_warning "⚠️ Application may not be responding yet, check logs:"
    print_status "sudo -u $APP_USER pm2 logs tootunnid"
fi

echo ""
echo "========================================"
print_success "🎉 RECOVERY COMPLETED!"
echo "========================================"
echo ""
print_status "🔧 Next steps:"
echo "1. Check application status: sudo -u $APP_USER pm2 status"
echo "2. View logs: sudo -u $APP_USER pm2 logs tootunnid"
echo "3. If SSL isn't set up, run: sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --email $EMAIL --agree-tos --non-interactive"
echo "4. Test your site: curl -I http://localhost:3000"
echo ""
print_status "📊 Memory usage after recovery:"
free -h
echo ""
print_status "💾 Disk usage:"
df -h /
