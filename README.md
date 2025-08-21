# TimeTracker - Work Time Management App

A modern web application for tracking work time, managing team relationships, and calculating earnings. Built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## Features

### 🕒 Time Tracking
- **Clock In/Out**: Simple one-click time tracking
- **Real-time Duration**: See your current work session time
- **Time History**: View all your past work sessions
- **Automatic Calculations**: Earnings calculated based on your hourly wage

### 👥 Team Management
- **Work Requests**: Send requests to connect with managers or workers
- **Boss-Worker Relationships**: Establish reporting relationships
- **Team Overview**: Managers can see their team members' work hours
- **Role-based Access**: Different features for workers and managers

### 💰 Earnings Management
- **Hourly Wage Settings**: Set your own hourly rate
- **Automatic Calculations**: Earnings calculated for each work session
- **Financial Overview**: See total earnings over time periods

### 🎨 Modern UI
- **Responsive Design**: Works on desktop and mobile
- **Clean Interface**: Modern, intuitive user experience
- **Real-time Updates**: Live time tracking and status updates
- **Professional Design**: Beautiful and functional interface

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT-based auth with HTTP-only cookies
- **Icons**: Lucide React
- **Validation**: Zod schema validation
- **Password Security**: bcryptjs hashing

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd tootunnid
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```
Update the `.env` file with your configuration:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Getting Started
1. **Create Account**: Register as either a Worker or Manager
2. **Set Hourly Wage**: Update your profile with your hourly rate
3. **Connect with Team**: Send work requests to establish relationships
4. **Start Tracking**: Use the time clock to track your work hours

### For Workers
- Clock in when you start working
- Clock out when you finish
- View your time entries and earnings
- Send work requests to your manager

### For Managers
- Accept work requests from team members
- View your workers' time entries
- Monitor team productivity
- Manage work relationships

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── time/         # Time tracking endpoints
│   │   ├── user/         # User management endpoints
│   │   └── work-requests/ # Work request endpoints
│   ├── clock/            # Time clock page
│   ├── dashboard/        # Main dashboard
│   ├── login/            # Login page
│   ├── profile/          # User profile page
│   └── register/         # Registration page
├── components/           # Reusable React components
├── lib/                  # Utility functions and database
└── middleware.ts         # Authentication middleware
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login  
- `POST /api/auth/logout` - User logout

### Time Tracking
- `POST /api/time/clock` - Clock in
- `PUT /api/time/clock` - Clock out
- `GET /api/time/clock` - Get clock status
- `GET /api/time/entries` - Get time entries

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile

### Work Requests
- `POST /api/work-requests` - Send work request
- `GET /api/work-requests` - Get requests
- `PUT /api/work-requests/[id]` - Accept/reject request

## Database Schema

The app uses the following main models:
- **User**: User accounts with roles and wage information
- **TimeEntry**: Individual work sessions with clock in/out times
- **WorkRequest**: Requests to establish work relationships  
- **WorkerBoss**: Established boss-worker relationships

## Development

### Build for Production
```bash
npm run build
```

### Database Commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push  

# Reset database
npx prisma db push --force-reset

# View database
npx prisma studio
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email [your-email] or create an issue on GitHub.
