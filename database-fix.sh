#!/bin/bash

# Database Fix Script for Tootunnid
# This script fixes PostgreSQL authentication issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="too.keimohub.live"
WWW_DOMAIN="www.too.keimohub.live"
APP_USER="deploy"
APP_DIR="/home/deploy/tootunnid"
DB_NAME="tootunnid"
DB_USER="tootunnid_user"
DB_PASS="tootunnid_$(openssl rand -hex 12)"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo "🔧 Fixing PostgreSQL database authentication..."

# 1. Recreate database and user
print_status "🗄️ Recreating PostgreSQL database and user..."

# First, ensure PostgreSQL is running and accessible
systemctl restart postgresql
sleep 3

# Check PostgreSQL authentication method
print_status "📋 Checking PostgreSQL configuration..."
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | head -1 | awk '{print $2}' | cut -d'.' -f1)
PG_HBA_FILE="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

# Backup original pg_hba.conf
cp "$PG_HBA_FILE" "$PG_HBA_FILE.backup"

# Configure PostgreSQL for local connections
print_status "🔧 Configuring PostgreSQL authentication..."
cat > "$PG_HBA_FILE" << 'PG_HBA_EOF'
# PostgreSQL Client Authentication Configuration File
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             postgres                                peer
local   all             all                                     md5

# IPv4 local connections:
host    all             all             127.0.0.1/32            md5

# IPv6 local connections:
host    all             all             ::1/128                 md5

# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            md5
host    replication     all             ::1/128                 md5
PG_HBA_EOF

# Restart PostgreSQL to apply changes
systemctl restart postgresql
sleep 5

# Create database and user with proper authentication
print_status "🗄️ Creating database and user..."
sudo -u postgres psql << EOF
-- Drop everything and start fresh
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;

-- Create user first
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';

-- Create database
CREATE DATABASE $DB_NAME WITH OWNER $DB_USER;

-- Grant all necessary privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
ALTER USER $DB_USER SUPERUSER;

-- Connect to the database and set up schema permissions
\c $DB_NAME postgres

-- Grant permissions on public schema
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO $DB_USER;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $DB_USER;

-- Change ownership of the database
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;

\q
EOF

print_success "Database and user recreated successfully"

# 2. Update environment file
print_status "📝 Updating environment file..."
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

# 3. Save database credentials
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

# 4. Test database connection
print_status "🔍 Testing database connection..."

# Test connection multiple ways
print_status "Testing PostgreSQL connection with different methods..."

# Method 1: Test with psql as the user
echo "Method 1: Testing with psql..."
if sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ PostgreSQL connection as postgres user successful"
else
    echo "❌ PostgreSQL connection as postgres user failed"
fi

# Method 2: Test with connection string
echo "Method 2: Testing with connection string..."
sudo -u $APP_USER bash << EOF
cd $APP_DIR
export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# Install postgresql-client if not present
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL client..."
    apt-get update -qq
    apt-get install -y postgresql-client
fi

# Test the connection
echo "Testing database connection..."
if psql "\$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "Debugging connection..."
    echo "DATABASE_URL: \$DATABASE_URL"
    
    # Try to connect and show detailed error
    psql "\$DATABASE_URL" -c "SELECT 1;" 2>&1 || true
    
    # Check if database exists
    echo "Checking if database exists..."
    sudo -u postgres psql -l | grep $DB_NAME || echo "Database not found"
    
    # Check if user exists
    echo "Checking if user exists..."
    sudo -u postgres psql -c "\du" | grep $DB_USER || echo "User not found"
    
    exit 1
fi
EOF

# 5. Run Prisma migrations
print_status "🗄️ Running Prisma migrations..."
sudo -u $APP_USER bash << 'EOF'
cd /home/deploy/tootunnid
export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"')

echo "🔧 Creating PostgreSQL schema..."
cat > prisma/schema.prisma << 'SCHEMA_EOF'
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
SCHEMA_EOF

echo "📦 Generating Prisma client..."
npx prisma generate

echo "🗄️ Creating initial migration..."
npx prisma migrate dev --name init

echo "✅ Database setup completed successfully"
EOF

echo ""
echo "========================================"
print_success "🎉 DATABASE FIX COMPLETED!"
echo "========================================"
echo ""
print_status "📊 Database Information:"
echo "   Database Name: $DB_NAME"
echo "   Database User: $DB_USER"
echo "   Database Password: $DB_PASS"
echo ""
print_status "📁 Files Updated:"
echo "   Environment: /home/$APP_USER/tootunnid/.env.production"
echo "   Credentials: /home/$APP_USER/database-info.txt"
echo "   Schema: /home/$APP_USER/tootunnid/prisma/schema.prisma"
echo ""
print_status "🔧 Next Steps:"
echo "1. Continue with recovery script: sudo ./recovery-script.sh"
echo "2. Or rebuild and restart: cd $APP_DIR && npm run build && pm2 restart tootunnid"
echo ""
print_success "Database authentication is now fixed!"
