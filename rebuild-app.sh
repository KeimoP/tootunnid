#!/bin/bash

# 🔄 Quick Production Rebuild Script
# This script rebuilds and restarts the app on the server

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

APP_USER="deploy"
APP_DIR="/home/deploy/tootunnid"

echo -e "${BLUE}🔄 Rebuilding Tootunnid App${NC}"

# Switch to app user and directory
sudo -u $APP_USER bash << 'EOF'
cd /home/deploy/tootunnid

echo -e "\033[0;34m📦 Installing dependencies...\033[0m"
npm install

echo -e "\033[0;34m🏗️ Building application (without turbopack)...\033[0m"
npm run build

echo -e "\033[0;32m✅ Build completed successfully!\033[0m"
EOF

echo -e "${BLUE}🔄 Restarting PM2 process...${NC}"
sudo -u $APP_USER pm2 restart tootunnid || sudo -u $APP_USER pm2 start ecosystem.config.js

echo -e "${BLUE}📊 Checking PM2 status...${NC}"
sudo -u $APP_USER pm2 status

echo -e "${BLUE}📋 Recent logs...${NC}"
sudo -u $APP_USER pm2 logs tootunnid --lines 10

echo ""
echo -e "${GREEN}🎉 REBUILD COMPLETED!${NC}"
echo -e "${BLUE}🌐 Website: https://too.keimohub.live${NC}"
echo -e "${BLUE}📊 Monitor: pm2 logs tootunnid${NC}"
echo ""
