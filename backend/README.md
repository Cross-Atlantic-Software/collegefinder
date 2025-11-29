# College Finder Backend

Authentication backend for College Finder application built with Node.js, Express, and PostgreSQL.

## Features

- 🔐 Email-based authentication with OTP
- 📧 OTP email delivery
- 🗄️ PostgreSQL database with Docker
- 🏗️ MVC architecture
- 🔒 JWT token-based authentication
- ✅ Input validation
- 🚦 Rate limiting for OTP requests

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Authentication**: JWT
- **Email**: Nodemailer

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and update the following:
- Database credentials (if different from defaults)
- JWT_SECRET (use a strong random string)
- Email configuration (for sending OTPs)

### 3. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This will start a PostgreSQL container on port 5432.

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## API Endpoints

### Authentication

#### Send OTP
```
POST /api/auth/send-otp
Body: { "email": "user@example.com" }
```

#### Verify OTP
```
POST /api/auth/verify-otp
Body: { "email": "user@example.com", "code": "123456" }
Response: { "success": true, "data": { "user": {...}, "token": "..." } }
```

#### Resend OTP
```
POST /api/auth/resend-otp
Body: { "email": "user@example.com" }
```

#### Get Current User
```
GET /api/auth/me
Headers: { "Authorization": "Bearer <token>" }
```

## Database Schema

### Users Table
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR, UNIQUE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `last_login` (TIMESTAMP)
- `is_active` (BOOLEAN)

### OTPs Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, FOREIGN KEY)
- `email` (VARCHAR)
- `code` (VARCHAR)
- `expires_at` (TIMESTAMP)
- `used` (BOOLEAN)
- `created_at` (TIMESTAMP)

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection and initialization
├── controllers/
│   └── authController.js    # Authentication logic
├── database/
│   └── schema.sql           # Database schema
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── validators.js        # Input validation rules
├── models/
│   ├── User.js              # User model
│   └── Otp.js               # OTP model
├── routes/
│   └── authRoutes.js        # Authentication routes
├── utils/
│   ├── emailService.js      # Email sending utility
│   ├── jwt.js               # JWT token utilities
│   └── otpGenerator.js      # OTP generation utility
├── .env.example             # Environment variables template
├── docker-compose.yml       # PostgreSQL Docker setup
├── server.js                # Express server entry point
└── package.json             # Dependencies and scripts
```

## Development Notes

### Email Configuration

For development, if you don't configure email credentials, the system will log OTPs to the console instead of sending emails.

For production, configure your email provider in `.env`:
- Gmail: Use an App Password (not your regular password)
- Other providers: Update `EMAIL_HOST` and `EMAIL_PORT` accordingly

### OTP Configuration

- Default OTP length: 6 digits
- Default expiry: 10 minutes
- Rate limit: 3 OTPs per 10 minutes per email

### Database

The database schema is automatically created on first run. If you need to reset the database:

```bash
docker-compose down -v  # Remove volumes
docker-compose up -d    # Recreate container
```

## License

ISC

