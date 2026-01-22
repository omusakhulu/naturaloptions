# 🌱 Database Seed - Test Users

## Overview

The seed script creates 15 test users across all role groups to help you test and develop the staff management features.

---

## 🚀 How to Run

### Run the seed script:
```bash
npm run seed
```

Or with Prisma directly:
```bash
npx prisma db seed
```

---

## 👥 Test Users Created

### **Super Admin (1 user)**
- 🛡️ **Super Admin User**
  - Email: `superadmin@omnishop.com`
  - Password: `password123`
  - Full system access

### **Admins (2 users)**
- 🔐 **Admin User**
  - Email: `admin@omnishop.com`
  - Password: `password123`

- 🔐 **John Administrator**
  - Email: `john.admin@omnishop.com`
  - Password: `password123`

### **Managers (3 users)**
- 💼 **Sarah Manager**
  - Email: `sarah.manager@omnishop.com`
  - Password: `password123`

- 💼 **Mike Operations**
  - Email: `mike.ops@omnishop.com`
  - Password: `password123`

- 💼 **Lisa Project Manager**
  - Email: `lisa.pm@omnishop.com`
  - Password: `password123`

### **Sales Staff (4 users)**
- 💰 **David Sales**
  - Email: `david.sales@omnishop.com`
  - Password: `password123`

- 💰 **Emma Thompson**
  - Email: `emma.sales@omnishop.com`
  - Password: `password123`

- 💰 **Robert Wilson**
  - Email: `robert.sales@omnishop.com`
  - Password: `password123`

- 💰 **Jennifer Brown**
  - Email: `jennifer.sales@omnishop.com`
  - Password: `password123`

### **Regular Users (5 users)**
- 👤 **Tom Field Worker**
  - Email: `tom.field@omnishop.com`
  - Password: `password123`

- 👤 **James Driver**
  - Email: `james.driver@omnishop.com`
  - Password: `password123`

- 👤 **Maria Garcia**
  - Email: `maria.user@omnishop.com`
  - Password: `password123`

- 👤 **Carlos Martinez**
  - Email: `carlos.user@omnishop.com`
  - Password: `password123`

- 👤 **Ana Rodriguez**
  - Email: `ana.user@omnishop.com`
  - Password: `password123`

---

## 🎯 Use Cases

### Testing Role Management
- View all users in the Roles page: `/en/apps/roles`
- Filter by role using the tabs (All Staff, Ground Staff, Admin Staff)
- Test role assignment from the role cards
- Change user roles from the table dropdown

### Testing Staff Assignments
- Assign users to:
  - eCommerce Operations
  - Project Management
  - Warehouse Operations
  - Financial Operations
  - Customer Management

### Testing Notifications
- Create notifications for specific users
- Test role assignment notifications
- Test staff assignment notifications

### Testing Access Control
- Login as different roles to see permission differences
- Super Admin sees everything
- Admin has most access
- Manager can manage operations
- Sales can create quotes
- Users have basic access

---

## 📊 User Distribution

| Role | Count | Use Case |
|------|-------|----------|
| SUPER_ADMIN | 1 | System administration |
| ADMIN | 2 | Admin operations |
| MANAGER | 3 | Project & operations management |
| SALES | 4 | Sales & customer management |
| USER | 5 | Field workers, drivers, basic users |

---

## 🔐 Default Password

**All users have the same password for testing:**
```
password123
```

⚠️ **Important:** Change this in production! This is only for development/testing.

---

## 🔄 Re-seeding

The seed script uses `upsert`, so you can run it multiple times safely. It will:
- Create users if they don't exist
- Skip users if they already exist (by email)
- Not duplicate users

To reset and re-seed:
```bash
# Reset database (careful - deletes all data!)
npx prisma migrate reset

# This will automatically run the seed script
```

Or just update existing users:
```bash
npm run seed
```

---

## 🧪 Testing Scenarios

### Scenario 1: Role Management
1. Login as `superadmin@omnishop.com`
2. Go to Roles page
3. Test assigning users to different roles
4. Check notifications for those users

### Scenario 2: Staff Categories
1. Filter by "Ground Staff" tab
2. See only SALES and USER roles
3. Filter by "Admin Staff" tab
4. See only SUPER_ADMIN, ADMIN, MANAGER roles

### Scenario 3: Bulk Assignment
1. Click "Assign Users" on a role card (e.g., Manager)
2. Select multiple users from other roles
3. Assign them all at once
4. Check notifications

### Scenario 4: Customer Assignment
1. Go to Roles page
2. Click assignments menu (⋮) for a sales person
3. Select "Assign to Customer"
4. Use autocomplete to search customers
5. Assign multiple customers

---

## 📝 Notes

- All users have avatars (`/images/avatars/1-8.png`)
- All users are active by default
- Passwords are hashed with bcrypt
- Email addresses follow a consistent pattern
- Names are descriptive of their roles

---

## 🔧 Customization

To add more users, edit `prisma/seed.js` and add them to the `users` array:

```javascript
{
  name: 'Your Name',
  email: 'your.email@omnishop.com',
  password,
  role: 'MANAGER', // SUPER_ADMIN, ADMIN, MANAGER, SALES, USER
  active: true,
  image: '/images/avatars/1.png'
}
```

Then run `npm run seed` again.

---

## ✅ Verification

After seeding, verify in your database or run:
```bash
npx prisma studio
```

Then check the User table to see all created users.

---

**Happy Testing! 🎉**
