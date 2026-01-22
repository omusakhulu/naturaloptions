# Notifications System Setup Guide

## 🎉 System Complete - Ready to Use!

Your notification system is fully implemented and ready to use. Here's everything you need to know.

---

## 📋 What's Been Created

### 1. **Database Schema** ✅
Added to `src/prisma/schema.prisma`:
- `Notification` model with all fields
- `NotificationType` enum (INFO, SUCCESS, WARNING, ERROR, ORDER, PROJECT, WAREHOUSE, CUSTOMER, FINANCIAL)
- Relations to User model

### 2. **API Routes** ✅
Created 4 API endpoints:

#### `GET /api/notifications`
Fetch notifications for logged-in user
- Query params: `limit` (default 50), `unreadOnly` (true/false)
- Returns formatted notifications with time ago
- Sorted by creation date (newest first)

#### `POST /api/notifications`
Create a new notification
- Requires: `userId`, `title`
- Optional: `subtitle`, `message`, `type`, `avatarIcon`, `avatarColor`, `link`, `metadata`

#### `PATCH /api/notifications/[id]`
Mark notification as read/unread
- Body: `{ "read": true/false }`
- Only updates user's own notifications

#### `POST /api/notifications/mark-all-read`
Mark all notifications as read or unread
- Body: `{ "read": true/false }`

#### `DELETE /api/notifications/[id]`
Delete a notification
- Only deletes user's own notifications

### 3. **Frontend Component** ✅
Updated `src/components/layout/shared/NotificationsDropdown.jsx`:
- ✅ Fetches real notifications from database
- ✅ Shows loading spinner while fetching
- ✅ Empty state when no notifications
- ✅ Mark as read/unread with API sync
- ✅ Delete notifications with API sync
- ✅ Mark all as read/unread
- ✅ Badge shows unread count
- ✅ Auto-refresh when dropdown opens

### 4. **Utility Functions** ✅
Created `src/utils/notifications.js` with helper functions:

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration
```bash
npx prisma migrate dev --name add_notifications
```

This creates the Notification table in your database.

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### Step 3: Test the System
The notification bell icon in your navbar is now live! Click it to see notifications.

---

## 💡 How to Use Notifications

### Example 1: Role Assignment Notification
```javascript
import { notifyRoleAssignment } from '@/utils/notifications'

// When assigning a role
await notifyRoleAssignment(
  userId,           // User receiving the role
  'Manager',        // Role name
  'Admin User'      // Who assigned it
)
```

### Example 2: Staff Assignment Notification
```javascript
import { notifyStaffAssignment } from '@/utils/notifications'

// When assigning to eCommerce, projects, warehouse, etc.
await notifyStaffAssignment(
  userId,
  'projects',                  // Type: ecommerce, projects, warehouse, financial, customers
  'Event Setup Q1 2025',       // Name of what they're assigned to
  'Manager Name'               // Who assigned them
)
```

### Example 3: Order Status Notification
```javascript
import { notifyOrderStatus } from '@/utils/notifications'

// When order status changes
await notifyOrderStatus(
  userId,
  '12345',        // Order number
  'completed'     // Status
)
```

### Example 4: Custom Notification
```javascript
import { createNotification } from '@/utils/notifications'

await createNotification(userId, {
  title: 'System Update',
  subtitle: 'New features have been deployed',
  type: 'SUCCESS',
  avatarIcon: 'tabler-rocket',
  avatarColor: 'success',
  link: '/changelog'
})
```

---

## 🎨 Available Helper Functions

### Staff & Roles
- `notifyRoleAssignment(userId, roleName, assignedBy)`
- `notifyStaffAssignment(userId, type, name, assignedBy)`

### Operations
- `notifyOrderStatus(userId, orderNumber, status)`
- `notifyProject(userId, projectName, message, link?)`
- `notifyWarehouse(userId, warehouseName, message, type?)`
- `notifyCustomer(userId, customerName, message)`
- `notifyFinancial(userId, title, message, type?)`

### System
- `notifySystem(userId, title, message, type)`
- `createNotification(userId, notificationData)` - Custom notifications

---

## 🎯 Notification Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| INFO | info-circle | blue | General information |
| SUCCESS | circle-check | green | Success messages |
| WARNING | alert-triangle | orange | Warnings |
| ERROR | alert-circle | red | Errors |
| ORDER | shopping-bag | primary | Order updates |
| PROJECT | briefcase | info | Project notifications |
| WAREHOUSE | building-warehouse | warning | Warehouse alerts |
| CUSTOMER | user-check | secondary | Customer updates |
| FINANCIAL | file-invoice | success | Financial notifications |

---

## 📱 UI Features

### Bell Icon
- Shows red dot when there are unread notifications
- Click to open notification dropdown
- Auto-fetches latest notifications

### Notification Dropdown
- Shows last 50 notifications
- Displays "X New" chip for unread count
- Click notification to mark as read
- Hover over notification to see delete button (×)
- "Mark all as read/unread" button at top
- "View All Notifications" button at bottom
- Loading spinner while fetching
- Empty state when no notifications

### Notification Item
- Avatar with icon
- Title (bold)
- Subtitle (description)
- Time ago (e.g., "5m ago", "2h ago")
- Blue dot for unread, gray for read
- Click × to delete
- Click notification to mark as read

---

## 🔧 Integration Examples

### In Role Assignment (RolesTable.jsx)
```javascript
import { notifyRoleAssignment } from '@/utils/notifications'

// After successful role update
await notifyRoleAssignment(userId, newRole, session.user.name)
```

### In Staff Assignment Dialog
```javascript
import { notifyStaffAssignment } from '@/utils/notifications'

// When assigning staff to customers
selectedCustomers.forEach(async (customer) => {
  await notifyStaffAssignment(
    staffUserId,
    'customers',
    customer.fullName,
    currentUser.name
  )
})
```

### In Order Processing
```javascript
import { notifyOrderStatus } from '@/utils/notifications'

// When order is completed
await notifyOrderStatus(
  assignedUserId,
  order.number,
  'completed'
)
```

---

## 🎨 Customization

### Adding Custom Avatar Images
```javascript
await createNotification(userId, {
  title: 'Welcome!',
  subtitle: 'Your account is ready',
  avatarImage: '/images/welcome.png',  // Custom image
  type: 'SUCCESS'
})
```

### Adding Custom Text Avatars
```javascript
await createNotification(userId, {
  title: 'New Message',
  subtitle: 'From John Doe',
  avatarText: 'JD',  // Initials
  avatarColor: 'primary',
  type: 'INFO'
})
```

### Adding Links
```javascript
await createNotification(userId, {
  title: 'New Invoice',
  subtitle: 'Invoice #INV-001 created',
  link: '/apps/invoice/preview/001',  // Click to navigate
  type: 'FINANCIAL'
})
```

---

## 🔐 Security

- ✅ Authentication required for all API endpoints
- ✅ Users can only see/modify their own notifications
- ✅ Session validation using NextAuth
- ✅ SQL injection protected (Prisma)
- ✅ XSS protected (React escaping)

---

## 📊 Performance

- Notifications fetched on-demand (when dropdown opens)
- Limited to 50 notifications per request
- Indexed database fields for fast queries
- Efficient pagination ready for future implementation

---

## 🚀 Next Steps

1. **Run the migration** (see Step 1 above)
2. **Test the notification bell** in your navbar
3. **Add notifications to your features**:
   - Role assignments ✓ (ready to integrate)
   - Staff assignments ✓ (ready to integrate)
   - Order status changes
   - Project updates
   - Warehouse alerts
   - Financial notifications

---

## 📝 Example Integration in Existing Code

### In RolesTable Role Update Dialog:
```javascript
// Add this after successful role update (line ~520)
import { notifyRoleAssignment } from '@/utils/notifications'

// Inside the try block after successful fetch
await notifyRoleAssignment(
  confirmDialog.userId,
  confirmDialog.newRole,
  session?.user?.name || 'Admin'
)
```

### In RoleCards Bulk Assignment:
```javascript
// Add this after successful bulk assignment
import { notifyRoleAssignment } from '@/utils/notifications'

selectedUsers.forEach(async (user) => {
  await notifyRoleAssignment(
    user.id,
    roleForAssignment,
    currentUser.name
  )
})
```

---

## 🎉 You're All Set!

Your notifications system is complete and ready to use. Just run the database migration and start sending notifications!

**Questions?** Check the code in:
- `src/app/api/notifications/` - API routes
- `src/components/layout/shared/NotificationsDropdown.jsx` - UI component
- `src/utils/notifications.js` - Helper functions
- `src/prisma/schema.prisma` - Database schema
