#!/bin/bash

# Quick Setup Script for too.keimohub.live
# Run this after completing the basic server setup

set -e

echo "🚀 Setting up too.keimohub.live..."

# Configuration
DOMAIN="too.keimohub.live"
EMAIL="keimo.plaas22@gmail.com"
APP_DIR="/home/deploy/tootunnid"

echo "📋 Creating Nginx configuration..."
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/tootunnid > /dev/null << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=general:10m rate=60r/m;

server {
    listen 80;
    server_name too.keimohub.live www.too.keimohub.live;
    
    # Redirect HTTP to HTTPS (will be configured by Certbot)
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
    }

    # API routes with rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        limit_req_status 429;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "✅ Enabling Nginx site..."
# Enable the site
sudo ln -sf /etc/nginx/sites-available/tootunnid /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

echo "🔒 Installing SSL certificate..."
# Install SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --redirect

echo "🔥 Setting up firewall..."
# Setup firewall
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

echo "🗄️ Setting up PostgreSQL database..."
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE IF NOT EXISTS tootunnid;
CREATE USER IF NOT EXISTS tootunnid_user WITH PASSWORD 'tootunnid_secure_pass_$(openssl rand -hex 8)';
GRANT ALL PRIVILEGES ON DATABASE tootunnid TO tootunnid_user;
ALTER USER tootunnid_user CREATEDB;
\q
EOF

echo "📦 Installing application dependencies..."
cd $APP_DIR
npm ci

echo "🔨 Building application..."
npm run build

echo "⚡ Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "📊 Setting up monitoring..."
# Create simple monitoring script
sudo tee /etc/cron.d/tootunnid-monitor > /dev/null << 'EOF'
# Monitor tootunnid application every 5 minutes
*/5 * * * * deploy /usr/bin/curl -f https://too.keimohub.live/health >/dev/null 2>&1 || /usr/bin/pm2 restart tootunnid
EOF

echo "🎉 Setup completed!"
echo "🌐 Your application should be available at: https://$DOMAIN"
echo "📊 Check application status: pm2 status"
echo "📝 View logs: pm2 logs tootunnid"
echo ""
echo "🔧 Next steps:"
echo "1. Update DNS records to point $DOMAIN to this server's IP"
echo "2. Configure your .env.production file with secure secrets"
echo "3. Run database migrations: npx prisma migrate deploy"
echo "4. Test your application at https://$DOMAIN"
