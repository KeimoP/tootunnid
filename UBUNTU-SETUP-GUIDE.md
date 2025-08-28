# 🚀 Quick Ubuntu Server Setup - Reference Card

## Prerequisites
- Fresh Ubuntu 22.04 LTS server
- Root access or sudo privileges
- Domain DNS pointing to server IP

## One-Command Setup

```bash
# Download and run the complete setup script
wget https://raw.githubusercontent.com/KeimoP/tootunnid/master/ubuntu-complete-setup.sh
chmod +x ubuntu-complete-setup.sh
sudo ./ubuntu-complete-setup.sh
```

## What the Script Does

### 📦 System Setup
- ✅ Updates all packages
- ✅ Installs Node.js 18
- ✅ Installs PostgreSQL
- ✅ Installs Nginx
- ✅ Installs PM2 process manager
- ✅ Installs SSL certificates (Let's Encrypt)

### 👤 Security Setup
- ✅ Creates deploy user
- ✅ Configures UFW firewall
- ✅ Sets up Fail2ban protection
- ✅ Configures SSH keys
- ✅ Sets up SSL/HTTPS

### 🗄️ Database Setup
- ✅ Creates PostgreSQL database
- ✅ Creates database user with secure password
- ✅ Runs all migrations
- ✅ Configures connection strings

### 🌐 Web Server Setup
- ✅ Configures Nginx reverse proxy
- ✅ Sets up rate limiting
- ✅ Configures security headers
- ✅ Sets up SSL certificate
- ✅ Configures automatic renewal

### 📱 Application Setup
- ✅ Clones your GitHub repository
- ✅ Installs all dependencies
- ✅ Builds production version
- ✅ Configures environment variables
- ✅ Starts with PM2 process manager

### 📊 Monitoring & Maintenance
- ✅ Sets up automated backups (daily)
- ✅ Configures log rotation
- ✅ Creates deployment script
- ✅ Sets up health monitoring
- ✅ Configures system optimizations

## After Setup

### Your Application URLs
- **Main**: https://too.keimohub.live
- **WWW**: https://www.too.keimohub.live

### Important Files
```bash
/home/deploy/tootunnid/              # Application directory
/home/deploy/tootunnid/.env.production  # Environment config
/home/deploy/database-info.txt       # Database credentials
/home/deploy/deploy.sh              # Deployment script
/home/deploy/backup.sh              # Backup script
```

### Useful Commands
```bash
# Check application status
sudo -u deploy pm2 status

# View application logs
sudo -u deploy pm2 logs tootunnid

# Deploy updates
sudo -u deploy /home/deploy/deploy.sh

# Manual backup
sudo -u deploy /home/deploy/backup.sh

# Restart application
sudo -u deploy pm2 restart tootunnid

# Check SSL certificate
sudo certbot certificates

# Check firewall status
sudo ufw status

# View nginx logs
sudo tail -f /var/log/nginx/tootunnid_error.log
```

## DNS Configuration Required

Before running the script, configure these DNS records:

```
A Record:     too         → YOUR_SERVER_IP
A Record:     www.too     → YOUR_SERVER_IP
```

## Security Features

- 🔒 **SSL/HTTPS**: Automatic certificates with Let's Encrypt
- 🛡️ **Firewall**: UFW configured with minimal ports open
- 🚫 **Fail2ban**: Protection against brute force attacks
- ⚡ **Rate limiting**: API endpoint protection
- 🔐 **Secure headers**: XSS, clickjacking protection
- 🔑 **SSH keys**: Key-based authentication
- 🗄️ **Database security**: Isolated user with minimal privileges

## Automated Features

- 📅 **Daily backups** at 2:00 AM
- 🔍 **Health checks** every 5 minutes
- 📋 **Log rotation** to prevent disk space issues
- 🔄 **SSL renewal** automatic
- ⚡ **Auto-restart** if application crashes

## Support

If you encounter issues:
1. Check the logs: `sudo -u deploy pm2 logs tootunnid`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system logs: `sudo journalctl -f`

## Estimated Setup Time
- **Fresh server**: 15-20 minutes
- **With good internet**: 10-15 minutes
- **Manual verification**: 5 minutes

Total: ~25 minutes for complete production setup
