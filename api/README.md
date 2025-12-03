# API Module - Modular Architecture

This directory contains all API client code organized in a clean, modular architecture following industry best practices.

## 📁 Structure

```
api/
├── types.ts                    # Shared TypeScript types & interfaces
├── client.ts                   # Shared API client (apiRequest function)
├── constants.ts                # Centralized API endpoint paths
├── auth/                       # User authentication APIs
│   ├── index.ts               # Main export (re-exports from subfolders)
│   ├── login/                 # Login & OTP endpoints
│   │   └── index.ts           # sendOTP, verifyOTP, resendOTP
│   └── profile/               # User profile endpoints
│       └── index.ts           # getCurrentUser, updateProfile
├── admin/                      # Admin dashboard APIs
│   ├── index.ts               # Main export (re-exports from subfolders)
│   ├── login/                 # Admin login endpoints
│   │   └── index.ts           # adminLogin, getCurrentAdmin
│   ├── admins/                # Admin users management
│   │   └── index.ts           # getAllAdmins, createAdmin, updateAdmin, deleteAdmin
│   ├── users/                 # Site users management
│   │   └── index.ts           # getAllUsers
│   └── email-templates/       # Email templates management
│       └── index.ts           # getAllEmailTemplates, createEmailTemplate, etc.
├── index.ts                    # Main export (re-exports everything)
└── README.md                   # This file
```

## 🚀 Usage

### Import from main entry point (Recommended)
```typescript
import { sendOTP, verifyOTP, getCurrentUser, User, AdminUser } from '@/api';
```

### Import from specific modules
```typescript
// Auth APIs
import { sendOTP, verifyOTP } from '@/api/auth/login';
import { getCurrentUser, updateProfile } from '@/api/auth/profile';

// Admin APIs
import { adminLogin } from '@/api/admin/login';
import { getAllAdmins, createAdmin } from '@/api/admin/admins';
import { getAllUsers } from '@/api/admin/users';
import { getAllEmailTemplates } from '@/api/admin/email-templates';

// Types
import { User, ApiResponse, AdminUser } from '@/api/types';

// Constants
import { API_ENDPOINTS } from '@/api/constants';
```

## 📝 Adding New APIs

### 1. Add to existing domain
If adding to an existing domain (e.g., auth), add to the appropriate subfolder:
```typescript
// api/auth/login/index.ts
export async function newLoginFunction() { ... }
```

### 2. Create new domain
If creating a new domain (e.g., colleges, exams):
```typescript
// api/colleges/index.ts
export async function getAllColleges() { ... }

// api/index.ts - Add export
export * from './colleges';
```

### 3. Add new types
Add to `api/types.ts`:
```typescript
export interface College {
  id: number;
  name: string;
  // ...
}
```

### 4. Add new endpoints
Add to `api/constants.ts`:
```typescript
export const API_ENDPOINTS = {
  // ... existing
  COLLEGES: {
    LIST: '/colleges',
    DETAIL: '/colleges/:id',
  },
};
```

## 🏗️ Architecture Principles

- ✅ **Modular**: Each domain has its own folder with subfolders for related endpoints
- ✅ **Type-safe**: All functions are typed with TypeScript
- ✅ **Centralized**: Shared utilities in `client.ts`, types in `types.ts`, endpoints in `constants.ts`
- ✅ **Scalable**: Easy to add new API domains without cluttering
- ✅ **DRY**: No code duplication, shared utilities
- ✅ **Clean imports**: Use `index.ts` for clean import paths

## 📋 File Naming Convention

- **`index.ts`**: Entry point files (allows clean imports like `@/api/auth/login`)
- **`types.ts`**: TypeScript type definitions
- **`client.ts`**: Shared API client utilities
- **`constants.ts`**: API endpoint constants

## 🔄 API Client Flow

1. **Import function** from `@/api` or specific module
2. **Function calls** `apiRequest()` from `client.ts`
3. **`apiRequest`** uses `API_ENDPOINTS` from `constants.ts`
4. **Returns typed** `ApiResponse<T>` from `types.ts`

## 🎯 Best Practices

1. Always use `API_ENDPOINTS` constants instead of hardcoded strings
2. Export types from `types.ts`, not individual files
3. Use `index.ts` files for clean import paths
4. Group related endpoints in subfolders
5. Keep functions focused and single-purpose
