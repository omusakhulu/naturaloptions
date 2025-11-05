# 🎉 Authentication System Setup - Complete Guide

## ✅ What's Been Done

### 1. Database Schema Updated
- ✅ Added `password` field (hashed with bcrypt)
- ✅ Added `role` field with enum (SUPER_ADMIN, ADMIN, MANAGER, SALES, USER)
- ✅ Added `active` field for account status
- ✅ Added timestamps (`createdAt`, `updatedAt`)

### 2. Files Created

**Auth Utilities** - `src/lib/auth-utils.ts`
- Password hashing and verification
- Password validation (strength requirements)
- Role checking functions
- Permission helpers

**Registration API** - `src/app/api/register/route.ts`
- User registration endpoint
- Password validation
- Email validation
- Duplicate checking

**Role Guard Component** - `src/components/RoleGuard.tsx`
- Component-level route protection
- HOC wrapper for pages
- Unauthorized fallback UI

**Admin Setup Script** - `scripts/create-admin.ts`
- Interactive admin user creation
- Password hashing
- Email validation

### 3. NextAuth Configuration Updated
- ✅ Replaced test user with real database authentication
- ✅ Added bcrypt password verification
- ✅ Added active user checking
- ✅ Enhanced error messages

---

## 🚀 Setup Steps

### Step 1: Install Dependencies

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

### Step 2: Run Database Migration

```bash
npx prisma db push
npx prisma generate
```

### Step 3: Set Environment Variables

Add to your `.env` or `.env.local`:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this

# Database (already configured)
DATABASE_URL="postgresql://postgres:Jomusakhulu1!@localhost:5433/omnishop?schema=public"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### Step 4: Create Your First Admin User

```bash
npx ts-node scripts/create-admin.ts
```

Follow the prompts:
- Admin Name: `Your Name`
- Admin Email: `admin@omnishop.com`
- Admin Password: `YourSecurePassword123!`

---

## 🔐 User Roles

| Role | Level | Description |
|------|-------|-------------|
| **SUPER_ADMIN** | 5 | Full system access, can manage all users |
| **ADMIN** | 4 | Admin access, can manage most features |
| **MANAGER** | 3 | Manage projects, orders, inventory |
| **SALES** | 2 | Create quotes, view basic reports |
| **USER** | 1 | Basic access only |

---

## 📝 Usage Examples

### Protect a Page (Client Component)

```tsx
'use client'

import { RoleGuard } from '@/components/RoleGuard'

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div>
        <h1>Admin Dashboard</h1>
        {/* Admin content here */}
      </div>
    </RoleGuard>
  )
}
```

### Protect a Page (Server Component)

```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { checkRole } from '@/lib/auth-utils'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  if (!checkRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
    return <div>Access Denied</div>
  }
  
  return <div>Admin Content</div>
}
```

### Protect an API Route

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Your code here
}
```

### Check User Session Client-Side

```tsx
'use client'

import { useSession, signOut } from 'next-auth/react'

export default function UserProfile() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (!session) {
    return <div>Please login</div>
  }
  
  return (
    <div>
      <h1>Welcome {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  )
}
```

---

## 🧪 Testing the System

### Test Login
1. Navigate to: `http://localhost:3000/login`
2. Enter admin credentials
3. Should redirect to dashboard

### Test Logout
```tsx
import { signOut } from 'next-auth/react'

// In your component
<button onClick={() => signOut({ callbackUrl: '/login' })}>
  Logout
</button>
```

### Test Role Protection
1. Login as USER role
2. Try to access admin page
3. Should see "Access Denied" message

---

## 🛡️ Security Features

### Password Requirements
✅ Minimum 8 characters
✅ At least one uppercase letter
✅ At least one lowercase letter
✅ At least one number
✅ At least one special character

### Security Measures
✅ Passwords hashed with bcrypt (12 salt rounds)
✅ Never store plain text passwords
✅ Never return passwords in API responses
✅ JWT tokens with 30-day expiration
✅ Secure HTTP-only cookies
✅ Active user status checking
✅ Server-side role verification

---

## 📋 Next Steps

### 1. Create User Management UI

You'll need pages for:
- `/apps/users/list` - List all users
- `/apps/users/create` - Create new user
- `/apps/users/[id]` - Edit user

### 2. Add Role Checks to Your Features

**Cost Reports** - Only ADMIN+ can:
- Generate cost reports
- View profit margins
- Access financial data

**User Management** - Only SUPER_ADMIN can:
- Create/delete users
- Change user roles
- Deactivate accounts

**Projects** - MANAGER+ can:
- Create projects
- Generate BOQs
- Access project data

**Quotes** - SALES+ can:
- Create quotes
- View pricing
- Generate proposals

### 3. Add Middleware Protection

Create `middleware.ts` in root:

```typescript
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/apps/:path*",
    "/api/projects/:path*",
    "/api/cost-reports/:path*"
  ]
}
```

### 4. Add Role-Based Navigation

Hide menu items based on user role:

```tsx
{isAdmin(session) && (
  <MenuItem href="/apps/users/list">
    User Management
  </MenuItem>
)}
```

---

## 🐛 Troubleshooting

### "Invalid email or password"
- Check password is correct
- Verify email is lowercase in database
- Ensure user exists and is active

### "Session not found"
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

### "Access Denied"
- Check user role in database
- Verify role permissions in code
- Check session is valid

### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check database exists

---

## 📚 API Endpoints Reference

### **POST** `/api/register`
Register new user (public)

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "USER"
}
```

### **POST** `/api/auth/signin`
Login (handled by NextAuth)

### **POST** `/api/auth/signout`
Logout (handled by NextAuth)

### **GET** `/api/auth/session`
Get current session (handled by NextAuth)

---

## ✨ Success Checklist

- [ ] Database migrated
- [ ] bcrypt installed
- [ ] Environment variables set
- [ ] Admin user created
- [ ] Can login successfully
- [ ] Can logout successfully
- [ ] Role protection works
- [ ] Session persists across pages
- [ ] Password validation works
- [ ] User registration works

---

## 🎓 Learning Resources

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Prisma Docs](https://www.prisma.io/docs)
- [bcrypt NPM](https://www.npmjs.com/package/bcrypt)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated:** October 29, 2025
**Version:** 1.0
