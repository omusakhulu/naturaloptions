# 🔐 Authentication & Authorization Setup Guide

## Overview
Complete authentication system with login, logout, and role-based access control (RBAC) using NextAuth.js, Prisma, and bcrypt.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

### 2. Run Database Migration
```bash
npx prisma db push
npx prisma generate
```

### 3. Set Environment Variables
Add to your `.env` file:
```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

---

## 👥 User Roles & Permissions

### Role Hierarchy

| Role | Access Level | Permissions |
|------|-------------|-------------|
| **SUPER_ADMIN** | Full System Access | • Everything below<br>• User management<br>• System settings<br>• Role assignment |
| **ADMIN** | Administrative | • Project management<br>• Order management<br>• Inventory control<br>• Reports & analytics<br>• Cost reports |
| **MANAGER** | Management | • Create/edit projects<br>• Manage inventory<br>• View reports<br>• BOQ generation |
| **SALES** | Sales Operations | • Create quotes<br>• View projects<br>• Generate BOQs<br>• Basic reports |
| **USER** | Basic Access | • View own data<br>• Basic operations |

---

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          # NextAuth API route
│   │   ├── users/
│   │   │   ├── route.ts              # User CRUD endpoints
│   │   │   └── [id]/
│   │   │       └── route.ts          # Single user operations
│   │   └── register/
│   │       └── route.ts              # User registration
│   ├── [lang]/
│   │   └── (blank-layout-pages)/
│   │       └── (guest-only)/
│   │           ├── login/
│   │           │   └── page.tsx      # Login page
│   │           └── register/
│   │               └── page.tsx      # Registration page
│   └── (dashboard)/
│       └── (private)/
│           └── users/
│               ├── list/
│               │   └── page.tsx      # User management
│               └── [id]/
│                   └── page.tsx      # User profile
├── lib/
│   ├── auth.js                       # NextAuth configuration
│   └── auth-utils.ts                 # Auth helper functions
├── middleware.ts                      # Route protection
├── components/
│   ├── AuthProvider.jsx              # Auth context provider
│   └── RoleGuard.tsx                 # Component-level protection
└── prisma/
    └── schema.prisma                  # Database schema
```

---

## 🔑 API Endpoints

### Authentication

#### **POST** `/api/register`
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "USER"  // Optional, defaults to USER
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

#### **POST** `/api/auth/signin`
Login with credentials (handled by NextAuth).

#### **POST** `/api/auth/signout`
Logout user (handled by NextAuth).

### User Management

#### **GET** `/api/users`
List all users (ADMIN+ only).

**Query Parameters:**
- `role`: Filter by role
- `active`: Filter by active status
- `search`: Search by name or email

#### **POST** `/api/users`
Create a new user (SUPER_ADMIN only).

#### **GET** `/api/users/[id]`
Get user details.

#### **PUT** `/api/users/[id]`
Update user (ADMIN+ or own profile).

#### **DELETE** `/api/users/[id]`
Delete user (SUPER_ADMIN only).

---

## 🛡️ Route Protection

### Middleware Protection
All routes under `/dashboard` are automatically protected.

```typescript
// middleware.ts
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/projects/:path*",
    "/api/orders/:path*"
  ]
}
```

### Role-Based Protection

```tsx
// Component-level
import { RoleGuard } from '@/components/RoleGuard'

<RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
  <AdminComponent />
</RoleGuard>
```

```typescript
// API Route-level
import { checkRole } from '@/lib/auth-utils'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  
  if (!checkRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  // Your code here
}
```

---

## 📝 Usage Examples

### Client-Side Auth Check

```tsx
'use client'

import { useSession } from 'next-auth/react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <Loading />
  }
  
  if (status === 'unauthenticated') {
    redirect('/login')
  }
  
  return (
    <div>
      <h1>Welcome {session.user.name}</h1>
      <p>Role: {session.user.role}</p>
    </div>
  )
}
```

### Server-Side Auth Check

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return <NotAuthorized />
  }
  
  return <AdminDashboard />
}
```

### Login

```tsx
import { signIn } from 'next-auth/react'

const handleLogin = async (email, password) => {
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false
  })
  
  if (result?.error) {
    console.error('Login failed:', result.error)
  } else {
    router.push('/dashboard')
  }
}
```

### Logout

```tsx
import { signOut } from 'next-auth/react'

const handleLogout = async () => {
  await signOut({
    redirect: true,
    callbackUrl: '/login'
  })
}
```

---

## 🔒 Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Password Hashing
- Uses bcrypt with salt rounds of 12
- Passwords are never stored in plain text
- Passwords are never returned in API responses

### Session Security
- JWT tokens with 30-day expiration
- Secure cookies in production
- HTTP-only cookies
- Auto token refresh

### Role Verification
- Always verify roles on server-side
- Never trust client-side role checks
- Use middleware for route protection
- Check permissions in API endpoints

---

## 🧪 Testing

### Create First Admin User

```typescript
// Run this script once: npm run create-admin
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('AdminPass123!', 12)
  
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@omnishop.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      emailVerified: new Date()
    }
  })
  
  console.log('Admin created:', admin.email)
}

createAdmin()
```

### Test Login
1. Navigate to: `http://localhost:3000/login`
2. Enter credentials:
   - Email: `admin@omnishop.com`
   - Password: `AdminPass123!`
3. Should redirect to dashboard

---

## 📊 Database Schema

### User Model

```prisma
model User {
  id            String         @id @default(cuid())
  name          String?
  email         String?        @unique
  emailVerified DateTime?
  password      String?        // Hashed with bcrypt
  image         String?
  role          UserRole       @default(USER)
  active        Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  accounts      Account[]
  sessions      Session[]
  packingSlips  PackingSlip[]
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  MANAGER
  SALES
  USER
}
```

---

## 🐛 Troubleshooting

### "Session not found" Error
- Check `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain
- Clear browser cookies

### "Invalid credentials" Error
- Verify password is hashed in database
- Check bcrypt is installed
- Ensure email is correct

### "Unauthorized" on Protected Routes
- Check middleware configuration
- Verify session is active
- Check role permissions

### Database Migration Issues
```bash
# Reset and recreate database
npx prisma migrate reset
npx prisma db push
npx prisma generate
```

---

## 🚀 Next Steps

1. ✅ Run database migration
2. ✅ Install bcrypt
3. ✅ Set environment variables
4. ✅ Create admin user
5. ✅ Test login/logout
6. ✅ Implement role checks in your app
7. ✅ Create user management UI

---

## 📚 Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated:** October 29, 2025
