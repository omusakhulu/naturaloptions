# Activity Log System - Complete Implementation

## Overview
A comprehensive activity logging system that tracks user actions across the entire application, including invoices, orders, users, warehouses, packing slips, projects, and BOQs.

## ✅ Implementation Status: READY TO USE

---

## 🗄️ Database Schema

### ActivityLog Model
Tracks all user activities in the system with full context and metadata.

**Fields:**
- `id` - Unique identifier
- `performedById` - User who performed the action
- `relatedUserId` - User the activity is about (optional)
- `entityType` - Type of entity (Invoice, Order, User, etc.)
- `entityId` - ID of the related entity
- `action` - Action performed (created, updated, deleted, etc.)
- `description` - Human-readable description
- `icon` - Tabler icon name for visual display
- `color` - Color for timeline (primary, success, warning, error, info)
- `metadata` - JSON metadata for additional context
- `createdAt` - Timestamp

**Entity Types:**
- USER
- INVOICE
- ORDER
- PRODUCT
- CUSTOMER
- PACKING_SLIP
- WAREHOUSE
- INVENTORY
- PROJECT
- BOQ
- QUOTE
- NOTIFICATION

---

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add_activity_logs
npx prisma generate
```

---

## 📡 API Endpoints

### GET /api/activity-logs
Fetch activity logs with optional filters.

**Query Parameters:**
- `userId` - Filter by user (shows activities performed by or related to this user)
- `entityType` - Filter by entity type (INVOICE, ORDER, etc.)
- `entityId` - Filter by specific entity ID
- `limit` - Number of results (default: 50)

**Example:**
```javascript
// Get all activities for a user
const response = await fetch(`/api/activity-logs?userId=${userId}&limit=100`)

// Get all invoice activities
const response = await fetch(`/api/activity-logs?entityType=INVOICE`)

// Get activities for specific invoice
const response = await fetch(`/api/activity-logs?entityType=INVOICE&entityId=${invoiceId}`)
```

**Response:**
```json
{
  "success": true,
  "activities": [
    {
      "id": "abc123",
      "action": "created",
      "description": "Created invoice INV-2025-00123",
      "icon": "tabler-file-plus",
      "color": "success",
      "createdAt": "2025-10-30T10:00:00Z",
      "performedBy": {
        "id": "user123",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "ADMIN"
      }
    }
  ]
}
```

### POST /api/activity-logs
Create a new activity log entry.

**Request Body:**
```json
{
  "relatedUserId": "user123",
  "entityType": "INVOICE",
  "entityId": "inv123",
  "action": "created",
  "description": "Created invoice INV-2025-00123",
  "icon": "tabler-file-plus",
  "color": "success",
  "metadata": {
    "invoiceNumber": "INV-2025-00123",
    "amount": "1000.00"
  }
}
```

---

## 🛠️ Utility Functions

### Invoice Activities

```javascript
import { logInvoiceActivity } from '@/utils/activityLogger'

// Log invoice creation
await logInvoiceActivity(
  session.user.id,        // performedById
  invoice.id,             // invoiceId
  'created',              // action
  invoice.invoiceNumber,  // invoiceNumber
  { amount: invoice.amount, status: invoice.status } // metadata (optional)
)

// Actions: 'created', 'updated', 'sent', 'paid', 'deleted'
```

### Order Activities

```javascript
import { logOrderActivity } from '@/utils/activityLogger'

// Log order completion
await logOrderActivity(
  session.user.id,
  order.id,
  'completed',
  order.orderNumber,
  { total: order.total, items: order.lineItems.length }
)

// Actions: 'created', 'updated', 'completed', 'cancelled', 'refunded'
```

### User Activities

```javascript
import { logUserActivity } from '@/utils/activityLogger'

// Log role change
await logUserActivity(
  session.user.id,
  targetUser.id,
  'role_changed',
  targetUser.name,
  { oldRole: 'USER', newRole: 'MANAGER' }
)

// Actions: 'created', 'updated', 'role_changed', 'activated', 'deactivated', 'deleted'
```

### Warehouse Activities

```javascript
import { logWarehouseActivity } from '@/utils/activityLogger'

// Log stock addition
await logWarehouseActivity(
  session.user.id,
  warehouse.id,
  'stock_added',
  `Added 50 units of Product XYZ`,
  { sku: 'PROD-XYZ', quantity: 50, location: 'A-1-R1' }
)

// Actions: 'stock_added', 'stock_removed', 'stock_adjusted', 'inventory_updated'
```

### Packing Slip Activities

```javascript
import { logPackingSlipActivity } from '@/utils/activityLogger'

// Log packing slip assignment
await logPackingSlipActivity(
  session.user.id,
  packingSlip.id,
  'assigned',
  packingSlip.packingSlipNumber,
  { assignedTo: user.name, boothNumber: packingSlip.boothNumber }
)

// Actions: 'created', 'assigned', 'status_updated', 'collected', 'delivered'
```

### Project/BOQ Activities

```javascript
import { logProjectActivity } from '@/utils/activityLogger'

// Log BOQ creation
await logProjectActivity(
  session.user.id,
  boq.id,
  'created',
  boq.projectName,
  'BOQ',
  { total: boq.total, client: boq.clientName }
)

// Actions: 'created', 'updated', 'submitted', 'approved', 'completed'
// Entity types: 'PROJECT' or 'BOQ'
```

---

## 🎨 UI Component: ActivityTimeline

### Basic Usage

```tsx
'use client'

import { useState } from 'react'
import Button from '@mui/material/Button'
import ActivityTimeline from '@/components/ActivityTimeline'

export default function MyComponent() {
  const [timelineOpen, setTimelineOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setTimelineOpen(true)}
        startIcon={<i className="tabler-timeline" />}
      >
        View Activity Log
      </Button>

      <ActivityTimeline
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        userId={userId}  // Optional: filter by user
        title="User Activity Log"
      />
    </>
  )
}
```

### Props

| Prop | Type | Description | Required |
|------|------|-------------|----------|
| `open` | boolean | Controls modal visibility | Yes |
| `onClose` | () => void | Close handler | Yes |
| `userId` | string | Filter by user ID | No |
| `entityType` | string | Filter by entity type | No |
| `entityId` | string | Filter by entity ID | No |
| `title` | string | Modal title | No (default: "Activity Log") |
| `limit` | number | Max activities to fetch | No (default: 50) |

### Examples

**User-specific timeline:**
```tsx
<ActivityTimeline
  open={open}
  onClose={() => setOpen(false)}
  userId={user.id}
  title={`Activity Log - ${user.name}`}
/>
```

**Invoice-specific timeline:**
```tsx
<ActivityTimeline
  open={open}
  onClose={() => setOpen(false)}
  entityType="INVOICE"
  entityId={invoice.id}
  title={`Invoice ${invoice.invoiceNumber} - Activity Log`}
/>
```

**Warehouse-specific timeline:**
```tsx
<ActivityTimeline
  open={open}
  onClose={() => setOpen(false)}
  entityType="WAREHOUSE"
  entityId={warehouse.id}
  title={`Warehouse ${warehouse.name} - Activity Log`}
/>
```

---

## 📝 Integration Examples

### 1. User Profile Page

```tsx
// src/app/[lang]/(dashboard)/(private)/apps/user/view/[id]/page.tsx
'use client'

import { useState } from 'react'
import Button from '@mui/material/Button'
import ActivityTimeline from '@/components/ActivityTimeline'

export default function UserProfile({ params }: { params: { id: string } }) {
  const [timelineOpen, setTimelineOpen] = useState(false)

  return (
    <div>
      {/* User Profile Content */}
      
      <Button
        variant="outlined"
        onClick={() => setTimelineOpen(true)}
        startIcon={<i className="tabler-timeline" />}
      >
        View Activity History
      </Button>

      <ActivityTimeline
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        userId={params.id}
        title="User Activity Log"
        limit={100}
      />
    </div>
  )
}
```

### 2. Roles Management Page

Add activity logging when roles are changed:

```tsx
// src/views/apps/roles/RolesTable.jsx

import { logUserActivity } from '@/utils/activityLogger'
import { useSession } from 'next-auth/react'

const handleRoleChange = async (user, newRole) => {
  const session = await getSession()
  
  try {
    // Update role in database
    await updateUserRole(user.id, newRole)
    
    // Log the activity
    await logUserActivity(
      session.user.id,
      user.id,
      'role_changed',
      user.name,
      { oldRole: user.role, newRole: newRole }
    )
    
    // Show success message
  } catch (error) {
    console.error('Error changing role:', error)
  }
}
```

### 3. Invoice Page

```tsx
// When creating an invoice
import { logInvoiceActivity } from '@/utils/activityLogger'

const createInvoice = async (invoiceData) => {
  const session = await getSession()
  
  const invoice = await prisma.invoice.create({
    data: invoiceData
  })
  
  // Log the creation
  await logInvoiceActivity(
    session.user.id,
    invoice.id,
    'created',
    invoice.invoiceNumber,
    { amount: invoice.amount, customer: invoice.customerName }
  )
  
  return invoice
}

// When marking as paid
const markInvoiceAsPaid = async (invoiceId) => {
  const session = await getSession()
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'paid' }
  })
  
  await logInvoiceActivity(
    session.user.id,
    invoice.id,
    'paid',
    invoice.invoiceNumber,
    { amount: invoice.amount, paidDate: new Date() }
  )
}
```

### 4. Add to Roles Page (Users Tab)

```tsx
// src/views/apps/roles/index.jsx

import { useState } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ActivityTimeline from '@/components/ActivityTimeline'

// Add to each user row
<Tooltip title="View Activity Log">
  <IconButton
    size="small"
    onClick={() => {
      setSelectedUserId(user.id)
      setTimelineOpen(true)
    }}
  >
    <i className="tabler-timeline" />
  </IconButton>
</Tooltip>

{/* Add at bottom of component */}
<ActivityTimeline
  open={timelineOpen}
  onClose={() => setTimelineOpen(false)}
  userId={selectedUserId}
  title="User Activity Log"
/>
```

---

## 🎯 Features

✅ **Comprehensive Tracking**
- Track all user actions across the application
- Full audit trail with timestamps
- User context (who performed, who was affected)

✅ **Rich Metadata**
- Store additional context as JSON
- Flexible for any data structure
- Expandable details view in timeline

✅ **Beautiful Timeline UI**
- Material-UI Timeline component
- Color-coded by action type
- Icons for visual clarity
- Time ago formatting
- User avatars and role chips

✅ **Flexible Filtering**
- Filter by user
- Filter by entity type
- Filter by specific entity
- Limit results

✅ **Easy Integration**
- Simple utility functions
- Predefined action types
- Automatic icon and color assignment
- Works with existing auth system

✅ **Performance**
- Database indexes for fast queries
- Limit results to prevent overload
- Efficient JSON metadata storage

---

## 🔧 Advanced Usage

### Custom Activity Types

```javascript
import { logActivity } from '@/utils/activityLogger'

// Log custom activity
await logActivity({
  performedById: session.user.id,
  entityType: 'CUSTOM_ENTITY',
  entityId: entity.id,
  action: 'custom_action',
  description: 'Custom description',
  icon: 'tabler-custom-icon',
  color: 'primary',
  metadata: { customField: 'customValue' }
})
```

### Fetching Activities Programmatically

```javascript
const fetchUserActivities = async (userId: string) => {
  const response = await fetch(`/api/activity-logs?userId=${userId}&limit=100`)
  const data = await response.json()
  
  if (data.success) {
    return data.activities
  }
  
  return []
}
```

---

## 📊 Use Cases

1. **User Management** - Track role changes, account activations, profile updates
2. **Invoice Management** - Track creation, updates, payments, deletions
3. **Order Management** - Track status changes, completions, cancellations
4. **Warehouse Management** - Track stock movements, inventory adjustments
5. **Packing Slips** - Track assignments, status updates, deliveries
6. **Projects/BOQ** - Track creation, approvals, completions
7. **Audit Compliance** - Complete audit trail for regulatory requirements
8. **User Behavior Analysis** - Understand how users interact with the system

---

## 🛡️ Security

- All activities require authentication
- User context automatically captured
- Cannot be modified after creation
- Full audit trail maintained
- Cascade delete on user deletion

---

## 📈 Next Steps

1. **Run Migration**: `npx prisma migrate dev --name add_activity_logs`
2. **Add to User Page**: Integrate ActivityTimeline modal
3. **Add Logging**: Integrate activity loggers into existing features
4. **Test**: Create activities and view in timeline
5. **Extend**: Add custom activity types as needed

---

## 📁 Files Created

**Database:**
- `src/prisma/schema.prisma` - ActivityLog model and EntityType enum

**API:**
- `src/app/api/activity-logs/route.ts` - GET and POST endpoints

**Utilities:**
- `src/utils/activityLogger.ts` - Helper functions for logging

**Components:**
- `src/components/ActivityTimeline.tsx` - Timeline modal component

**Documentation:**
- `ACTIVITY_LOG_SYSTEM.md` - This file

---

## ✅ Ready to Use!

The activity log system is fully implemented and ready to use. Simply run the migration and start integrating the timeline modal and activity loggers into your pages!
