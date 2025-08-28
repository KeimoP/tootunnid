#!/bin/bash

# 🚀 Deploy Latest Changes to Production
# Run this on your server to update the app

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_USER="deploy"
APP_DIR="/home/deploy/tootunnid"

echo -e "${BLUE}🚀 Deploying Latest Changes - Hydration Bug Fix${NC}"

# Switch to app user and update
sudo -u $APP_USER bash << 'EOF'
cd /home/deploy/tootunnid

echo -e "\033[0;34m📥 Pulling latest changes...\033[0m"
git pull origin master

echo -e "\033[0;34m📦 Installing dependencies...\033[0m"
npm install

echo -e "\033[0;34m🧹 Clearing Next.js cache...\033[0m"
rm -rf .next
npm run build 2>&1 | tee /tmp/build.log

if [ $? -eq 0 ]; then
    echo -e "\033[0;32m✅ Build completed successfully!\033[0m"
else
    echo -e "\033[0;31m❌ Build failed! Check logs:\033[0m"
    tail -20 /tmp/build.log
    exit 1
fi
EOF

echo -e "${BLUE}🔄 Restarting application...${NC}"
sudo -u $APP_USER pm2 restart tootunnid

echo -e "${BLUE}📊 Application status:${NC}"
sudo -u $APP_USER pm2 status

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED!${NC}"
echo -e "${BLUE}🌐 Website: https://too.keimohub.live${NC}"
echo -e "${YELLOW}⚡ The dark mode flashing issue should now be fixed!${NC}"
echo ""
echo -e "${BLUE}📋 To monitor logs: pm2 logs tootunnid${NC}"
