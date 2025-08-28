@echo off
echo 🚀 Setting up local development environment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Update Prisma to latest version
echo 📦 Updating Prisma to latest version...
call npm i --save-dev prisma@latest
call npm i @prisma/client@latest

REM Create local environment file if it doesn't exist
if not exist ".env.local" (
    echo ⚙️ Creating local environment file...
    echo # Local Development Environment > .env.local
    echo NODE_ENV=development >> .env.local
    echo. >> .env.local
    echo # Local SQLite Database >> .env.local
    echo DATABASE_URL="file:./dev.db" >> .env.local
    echo. >> .env.local
    echo # Development secrets (not for production!) >> .env.local
    echo JWT_SECRET="dev-jwt-secret-key-not-for-production-use" >> .env.local
    echo NEXTAUTH_SECRET="dev-nextauth-secret-not-for-production" >> .env.local
    echo NEXTAUTH_URL="http://localhost:3000" >> .env.local
    echo. >> .env.local
    echo # Local development >> .env.local
    echo ALLOWED_ORIGINS="http://localhost:3000" >> .env.local
    echo DATA_ENCRYPTION_KEY="dev-encryption-key-32-chars-long" >> .env.local
    echo ✅ Created .env.local for development
) else (
    echo ✅ .env.local already exists
)

REM Generate Prisma client
echo 🗄️ Generating Prisma client...
call npx prisma generate

REM Run database migrations for local development
echo 🗄️ Running database migrations...
call npx prisma migrate dev --name init

REM Install all dependencies
echo 📦 Installing dependencies...
call npm install

REM Build the application
echo 🔨 Building application...
call npm run build

echo.
echo ✅ Local development setup completed!
echo.
echo 🎯 Next steps:
echo    1. Run 'npm run dev' to start development server
echo    2. Open http://localhost:3000 in your browser
echo    3. The local database is stored in ./dev.db
echo.
echo 🔧 Available commands:
echo    npm run dev      - Start development server
echo    npm run build    - Build for production  
echo    npm run start    - Start production server
echo    npx prisma studio - Open database browser
echo.
echo 📝 Database commands:
echo    npx prisma migrate dev    - Create and run new migration
echo    npx prisma db push        - Push schema changes without migration
echo    npx prisma generate       - Regenerate Prisma client
echo    npx prisma db seed        - Run database seeding (if configured)
echo.
pause
