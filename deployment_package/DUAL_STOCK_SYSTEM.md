# Dual Stock System Documentation

## Overview

The dual stock system separates **actual physical inventory** from **website display stock**, allowing you to manage POS inventory independently from your WooCommerce store.

## Key Concepts

### Stock Types

1. **Actual Stock** (`actualStock`)
   - Physical inventory in your warehouse/store
   - What you actually have on hand
   - Updated by: POS sales, purchases, stock adjustments, physical counts

2. **Website Stock** (`websiteStock`)
   - What's displayed on WooCommerce
   - What customers see and can purchase online
   - Can be different from actual stock for various reasons

3. **Reserved Stock** (`reservedStock`)
   - Stock allocated to pending orders
   - Not available for new sales
   - Released when order is completed or cancelled

4. **Available Stock** (calculated)
   - Formula: `actualStock - reservedStock`
   - What's actually available for sale

## Database Schema

### Product Model Additions

```prisma
model Product {
  // ... existing fields ...
  
  // Dual Stock System
  actualStock      Int      @default(0) // Physical inventory
  websiteStock     Int      @default(0) // WooCommerce display
  reservedStock    Int      @default(0) // Pending orders
  lowStockAlert    Int      @default(10) // Alert threshold
  autoSyncStock    Boolean  @default(false) // Auto-sync setting
  lastStockSync    DateTime? // Last sync timestamp
  
  // Relations
  stockMovements   StockMovement[] @relation("StockMovements")
}
```

### StockMovement Model

Tracks all stock changes with full audit trail:

```prisma
model StockMovement {
  id             String   @id @default(cuid())
  productId      String
  type           StockMovementType
  quantity       Int // +/- change
  
  beforeActual   Int
  afterActual    Int
  beforeWebsite  Int?
  afterWebsite   Int?
  
  reference      String? // Order ID, etc.
  locationId     String?
  reason         String?
  notes          String?
  
  userId         String?
  userName       String?
  createdAt      DateTime @default(now())
}
```

### Movement Types

- `SALE` - Stock sold via POS or online
- `PURCHASE` - Stock received from supplier
- `ADJUSTMENT` - Manual stock adjustment
- `TRANSFER` - Transfer between locations
- `SYNC` - Synced to/from WooCommerce
- `RETURN` - Customer return
- `DAMAGE` - Damaged/lost stock
- `RECOUNT` - Physical stock count correction

## API Endpoints

### 1. Adjust Stock

**POST** `/api/stock/adjust`

Adjust actual stock for a product.

```json
{
  "productId": "clxxx...",
  "quantity": 10,  // positive to add, negative to remove
  "reason": "RECOUNT",
  "notes": "Physical inventory count",
  "locationId": "loc123" // optional
}
```

**Response:**
```json
{
  "success": true,
  "product": { ... },
  "movement": { ... },
  "message": "Stock adjusted: +10"
}
```

### 2. Sync Stock to Website

**POST** `/api/stock/sync`

Sync actual stock to WooCommerce.

```json
{
  "productId": "clxxx...",  // single product
  // OR
  "syncAll": true  // all products
}
```

**Response:**
```json
{
  "success": true,
  "message": "Synced 5 product(s)",
  "results": [
    {
      "productId": "...",
      "name": "Product Name",
      "success": true,
      "actualStock": 100,
      "websiteStock": 95,
      "reserved": 5
    }
  ]
}
```

### 3. Reserve Stock

**POST** `/api/stock/reserve`

Reserve stock for an order (doesn't reduce actual stock).

```json
{
  "productId": "clxxx...",
  "quantity": 5,
  "orderId": "order123"
}
```

**DELETE** `/api/stock/reserve`

Release reserved stock.

```json
{
  "productId": "clxxx...",
  "quantity": 5,
  "orderId": "order123"
}
```

### 4. Get Stock Movements

**GET** `/api/stock/movements?productId=xxx&limit=50&type=SALE`

Get stock movement history.

## UI Components

### Stock Management Page

**URL:** `/en/apps/stock-management`

Features:
- ✅ View all products with stock levels
- ✅ See actual vs website stock
- ✅ Identify products needing sync (⚠️ indicator)
- ✅ Adjust stock with reason tracking
- ✅ Sync individual or all products
- ✅ Stock status indicators (In Stock, Low Stock, Out of Stock)
- ✅ Reserved stock visibility

## Workflows

### 1. Receiving New Stock

```javascript
// When receiving supplier delivery
await axios.post('/api/stock/adjust', {
  productId: 'prod123',
  quantity: 100,  // received 100 units
  reason: 'PURCHASE',
  notes: 'PO-2024-001 from Supplier XYZ'
})

// Optionally sync to website immediately
await axios.post('/api/stock/sync', {
  productId: 'prod123'
})
```

### 2. POS Sale

```javascript
// When selling via POS
// 1. Check available stock
const product = await getProduct(productId)
const available = product.actualStock - product.reservedStock

if (available >= quantity) {
  // 2. Reduce actual stock
  await axios.post('/api/stock/adjust', {
    productId,
    quantity: -quantity,
    reason: 'SALE',
    notes: `POS Sale #${saleId}`
  })
  
  // 3. Optionally sync to website
  if (product.autoSyncStock) {
    await axios.post('/api/stock/sync', { productId })
  }
}
```

### 3. Online Order

```javascript
// When customer places online order
// 1. Reserve stock
await axios.post('/api/stock/reserve', {
  productId,
  quantity,
  orderId
})

// When order is fulfilled
await axios.post('/api/stock/adjust', {
  productId,
  quantity: -quantity,
  reason: 'SALE',
  notes: `Order #${orderId}`
})

// Release reservation
await axios.delete('/api/stock/reserve', {
  data: { productId, quantity, orderId }
})
```

### 4. Physical Stock Count

```javascript
// After physical count
const actualCount = 95  // what you counted
const currentStock = product.actualStock

const adjustment = actualCount - currentStock

await axios.post('/api/stock/adjust', {
  productId,
  quantity: adjustment,
  reason: 'RECOUNT',
  notes: 'Monthly stock count'
})
```

### 5. Bulk Sync to Website

```javascript
// Sync all products (e.g., end of day)
await axios.post('/api/stock/sync', {
  syncAll: true
})
```

## Use Cases

### Why Separate Actual and Website Stock?

1. **Buffer Stock**
   - Keep some stock for walk-in customers
   - Don't show all inventory online
   - Example: Actual: 100, Website: 80

2. **Reserved for Events**
   - Stock allocated for upcoming events
   - Not available for online purchase
   - Example: 50 units reserved for trade show

3. **Quality Control**
   - Stock received but not yet inspected
   - Example: 100 received, only 90 approved for sale

4. **Multi-Channel Sales**
   - Selling on multiple platforms
   - Prevent overselling
   - Example: Reserve stock for Amazon, eBay

5. **Gradual Release**
   - Release stock gradually to create urgency
   - Example: Have 500, show 50 online

## Migration Steps

### Step 1: Run Prisma Migration

```bash
npx prisma migrate dev --name add_dual_stock_system
```

This will:
- Add new fields to Product model
- Create StockMovement model
- Add indexes for performance

### Step 2: Initialize Stock Values

```javascript
// Set initial values for existing products
const products = await prisma.product.findMany()

for (const product of products) {
  await prisma.product.update({
    where: { id: product.id },
    data: {
      actualStock: product.stockQuantity || 0,
      websiteStock: product.stockQuantity || 0,
      reservedStock: 0,
      lowStockAlert: 10,
      autoSyncStock: false
    }
  })
}
```

### Step 3: Update Import Process

Modify bulk-import to set both stock types:

```typescript
await saveProduct({
  // ... other fields ...
  actualStock: openingStock,
  websiteStock: openingStock,
  stockQuantity: openingStock, // legacy field
})
```

### Step 4: Update POS Integration

Modify POS sales to:
1. Reduce actualStock
2. Create StockMovement record
3. Optionally sync to website

## Best Practices

1. **Always Use API Routes**
   - Don't update stock directly in database
   - Use `/api/stock/adjust` for audit trail

2. **Regular Syncing**
   - Sync at least daily
   - Enable auto-sync for high-turnover items

3. **Physical Counts**
   - Monthly stock counts
   - Use RECOUNT movement type
   - Document discrepancies

4. **Monitor Reserved Stock**
   - Release reservations for cancelled orders
   - Set timeout for pending orders

5. **Low Stock Alerts**
   - Set appropriate thresholds per product
   - Monitor dashboard daily

6. **Stock Movements**
   - Review movement history regularly
   - Investigate unusual patterns

## Troubleshooting

### Stock Out of Sync

```javascript
// Check current state
const product = await prisma.product.findUnique({
  where: { id: productId },
  include: { stockMovements: { take: 10, orderBy: { createdAt: 'desc' } } }
})

console.log({
  actual: product.actualStock,
  website: product.websiteStock,
  reserved: product.reservedStock,
  available: product.actualStock - product.reservedStock,
  recentMovements: product.stockMovements
})

// Force sync
await axios.post('/api/stock/sync', { productId })
```

### Negative Stock

```javascript
// Find products with negative stock
const negativeStock = await prisma.product.findMany({
  where: {
    OR: [
      { actualStock: { lt: 0 } },
      { websiteStock: { lt: 0 } }
    ]
  }
})

// Correct each one
for (const product of negativeStock) {
  await axios.post('/api/stock/adjust', {
    productId: product.id,
    quantity: Math.abs(product.actualStock),
    reason: 'ADJUSTMENT',
    notes: 'Correcting negative stock'
  })
}
```

## Future Enhancements

- [ ] Auto-sync scheduling (cron job)
- [ ] Stock alerts via email/SMS
- [ ] Multi-location stock tracking
- [ ] Batch stock adjustments via CSV
- [ ] Stock forecasting
- [ ] Reorder point automation
- [ ] Supplier integration
- [ ] Barcode scanning for stock counts
