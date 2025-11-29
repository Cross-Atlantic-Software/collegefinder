# Frontend-Backend Integration Guide

This guide explains how the frontend and backend are integrated for authentication.

## Setup

### 1. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Start PostgreSQL with Docker:
```bash
docker-compose up -d
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5001`

### 2. Frontend Setup

1. Create `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

2. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Authentication Flow

1. **Login Page** (`/login`):
   - User enters email and agrees to terms
   - Frontend calls `POST /api/auth/send-otp`
   - On success, redirects to `/otpverification?email=user@example.com`

2. **OTP Verification Page** (`/otpverification`):
   - User enters 6-digit OTP code
   - Frontend calls `POST /api/auth/verify-otp`
   - On success:
     - JWT token is stored in localStorage
     - User data is stored in localStorage
     - User is redirected to onboarding (`/(auth)/(onboard)/step-1`)

3. **Protected Routes**:
   - Dashboard routes are protected by `ProtectedRoute` component
   - If user is not authenticated, they are redirected to `/login`
   - Auth routes redirect authenticated users to `/dashboard`

## API Integration

### API Utilities (`lib/api.ts`)

- `sendOTP(email)` - Send OTP to email
- `verifyOTP(email, code)` - Verify OTP and get JWT token
- `resendOTP(email)` - Resend OTP
- `getCurrentUser()` - Get current authenticated user

### Authentication Context (`contexts/AuthContext.tsx`)

Provides:
- `user` - Current user object
- `isAuthenticated` - Boolean indicating auth status
- `isLoading` - Loading state
- `login(token, user)` - Login function
- `logout()` - Logout function
- `refreshUser()` - Refresh user data

### Usage Example

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';

export function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Protected Routes

Use the `ProtectedRoute` component to protect routes:

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

## Token Storage

- JWT token is stored in `localStorage` with key `auth_token`
- User data is stored in `localStorage` with key `auth_user`
- Both are cleared on logout

## Error Handling

All API calls include error handling:
- Network errors are caught and displayed to users
- Validation errors from the backend are shown
- Invalid tokens automatically log users out

## Development Notes

- In development mode, OTP emails are logged to the console if email is not configured
- Backend CORS is configured to allow requests from `http://localhost:3000`
- Update `FRONTEND_URL` in backend `.env` if using a different frontend URL

