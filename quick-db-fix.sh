#!/bin/bash

# Simple Database Authentication Fix for Tootunnid
# This script directly addresses PostgreSQL authentication issues

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
APP_USER="deploy"
APP_DIR="/home/deploy/tootunnid"
DB_NAME="tootunnid"
DB_USER="tootunnid_user"
DB_PASS="secure_$(openssl rand -hex 16)"

echo -e "${BLUE}🔧 Quick Database Authentication Fix${NC}"

# 1. Stop any running services
systemctl stop postgresql || true
sleep 2
systemctl start postgresql
sleep 3

echo -e "${BLUE}📋 Resetting PostgreSQL for local development${NC}"

# 2. Reset PostgreSQL authentication to trust locally (temporary)
PG_VERSION=$(ls /etc/postgresql/ | head -1)
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

# Backup original
cp "$PG_HBA" "$PG_HBA.original"

# Create simple trust-based config for setup
cat > "$PG_HBA" << 'EOF'
# Temporary trust configuration for setup
local   all             postgres                                trust
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
EOF

# Restart PostgreSQL
systemctl restart postgresql
sleep 5

echo -e "${BLUE}🗄️ Creating database and user${NC}"

# 3. Create database and user with trust authentication
sudo -u postgres psql << EOF
-- Clean slate
DROP DATABASE IF EXISTS $DB_NAME CASCADE;
DROP USER IF EXISTS $DB_USER;

-- Create user and database
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' CREATEDB SUPERUSER;
CREATE DATABASE $DB_NAME WITH OWNER $DB_USER ENCODING 'UTF8';

-- Verify creation
\l
\du

\q
EOF

echo -e "${GREEN}✅ Database created${NC}"

# 4. Update environment with new credentials
echo -e "${BLUE}📝 Updating environment file${NC}"

sudo -u $APP_USER tee $APP_DIR/.env.production > /dev/null << EOF
NODE_ENV=production
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
JWT_SECRET="$(openssl rand -hex 32)"
NEXTAUTH_SECRET="$(openssl rand -hex 32)"
NEXTAUTH_URL="https://too.keimohub.live"
ALLOWED_ORIGINS="https://too.keimohub.live,https://www.too.keimohub.live"
DATA_ENCRYPTION_KEY="$(openssl rand -hex 16)"
EOF

# 5. Save credentials
sudo -u $APP_USER tee /home/$APP_USER/db-credentials.txt > /dev/null << EOF
Database: $DB_NAME
User: $DB_USER
Password: $DB_PASS
URL: postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
Created: $(date)
EOF
chmod 600 /home/$APP_USER/db-credentials.txt

# 6. Test connection before proceeding
echo -e "${BLUE}🔍 Testing connection${NC}"

if sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection works${NC}"
else
    echo -e "${RED}❌ Connection test failed${NC}"
    exit 1
fi

# 7. Fix Prisma schema and run migrations
echo -e "${BLUE}🔧 Setting up Prisma${NC}"

sudo -u $APP_USER bash << 'EOF'
cd /home/deploy/tootunnid

# Update schema for PostgreSQL
cat > prisma/schema.prisma << 'PRISMA_SCHEMA'
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
PRISMA_SCHEMA

# Set the database URL
export DATABASE_URL="postgresql://'$DB_USER':'$DB_PASS'@localhost:5432/'$DB_NAME'"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Create and run migration
echo "Creating database migration..."
npx prisma migrate dev --name "initial_setup"

echo "✅ Prisma setup completed"
EOF

# 8. Restore more secure PostgreSQL config
echo -e "${BLUE}🔒 Securing PostgreSQL configuration${NC}"

cat > "$PG_HBA" << 'EOF'
# PostgreSQL Client Authentication Configuration File
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            md5
host    replication     all             ::1/128                 md5
EOF

systemctl restart postgresql

echo ""
echo -e "${GREEN}🎉 DATABASE FIX COMPLETED SUCCESSFULLY!${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "   Database Name: $DB_NAME"  
echo "   Database User: $DB_USER"
echo "   Password saved to: /home/$APP_USER/db-credentials.txt"
echo "   Environment updated: $APP_DIR/.env.production"
echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "   1. Build the app: cd $APP_DIR && npm run build"
echo "   2. Start with PM2: pm2 restart tootunnid"
echo "   3. Check status: pm2 status"
echo ""
echo -e "${GREEN}✅ Ready to continue with your application setup!${NC}"
