#!/bin/bash

# Local Development Setup Script for Windows/WSL
# This script sets up the development environment properly

set -e

echo "🚀 Setting up local development environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Update Prisma to latest version
echo "📦 Updating Prisma to latest version..."
npm i --save-dev prisma@latest
npm i @prisma/client@latest

# Create local environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "⚙️ Creating local environment file..."
    cat > .env.local << 'EOF'
# Local Development Environment
NODE_ENV=development

# Local SQLite Database
DATABASE_URL="file:./dev.db"

# Development secrets (not for production!)
JWT_SECRET="dev-jwt-secret-key-not-for-production-use"
NEXTAUTH_SECRET="dev-nextauth-secret-not-for-production"
NEXTAUTH_URL="http://localhost:3000"

# Local development
ALLOWED_ORIGINS="http://localhost:3000"
DATA_ENCRYPTION_KEY="dev-encryption-key-32-chars-long"
EOF
    echo "✅ Created .env.local for development"
else
    echo "✅ .env.local already exists"
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Run database migrations for local development
echo "🗄️ Running database migrations..."
npx prisma migrate dev --name init

# Install all dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

echo ""
echo "✅ Local development setup completed!"
echo ""
echo "🎯 Next steps:"
echo "   1. Run 'npm run dev' to start development server"
echo "   2. Open http://localhost:3000 in your browser"
echo "   3. The local database is stored in ./dev.db"
echo ""
echo "🔧 Available commands:"
echo "   npm run dev      - Start development server"
echo "   npm run build    - Build for production"
echo "   npm run start    - Start production server"
echo "   npx prisma studio - Open database browser"
echo ""
echo "📝 Database commands:"
echo "   npx prisma migrate dev    - Create and run new migration"
echo "   npx prisma db push        - Push schema changes without migration"
echo "   npx prisma generate       - Regenerate Prisma client"
echo "   npx prisma db seed        - Run database seeding (if configured)"
