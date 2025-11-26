# Quick Start: Dual Stock System

## Step 1: Run Database Migration

```bash
npx prisma migrate dev --name add_dual_stock_system
npx prisma generate
```

This creates:
- New fields in Product table: `actualStock`, `websiteStock`, `reservedStock`, etc.
- New `StockMovement` table for audit trail
- New `StockMovementType` enum

## Step 2: Initialize Existing Products

Create a script to set initial values:

```bash
node scripts/initialize-dual-stock.js
```

Or run manually in Prisma Studio or via API.

## Step 3: Access Stock Management

Navigate to: **http://localhost:3000/en/apps/stock-management**

You'll see:
- All products with actual vs website stock
- Stock status indicators
- Adjust and Sync buttons

## Step 4: Test the System

### Test 1: Adjust Stock

1. Click "Adjust" on any product
2. Enter quantity (e.g., +50 or -10)
3. Select reason
4. Add notes
5. Click "Adjust Stock"

Result: `actualStock` updated, movement recorded

### Test 2: Sync to Website

1. After adjusting, click "Sync"
2. Check WooCommerce - stock should update

Result: `websiteStock` matches `actualStock - reservedStock`

### Test 3: Reserve Stock

```bash
curl -X POST http://localhost:3000/api/stock/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "your-product-id",
    "quantity": 5,
    "orderId": "test-order-123"
  }'
```

Result: `reservedStock` increases by 5

## API Quick Reference

### Adjust Stock
```javascript
POST /api/stock/adjust
{
  "productId": "xxx",
  "quantity": 10,
  "reason": "PURCHASE",
  "notes": "Received from supplier"
}
```

### Sync to WooCommerce
```javascript
POST /api/stock/sync
{ "productId": "xxx" }
// or
{ "syncAll": true }
```

### Reserve Stock
```javascript
POST /api/stock/reserve
{
  "productId": "xxx",
  "quantity": 5,
  "orderId": "order123"
}
```

### View Movements
```javascript
GET /api/stock/movements?productId=xxx&limit=50
```

## Common Workflows

### Receiving Stock
1. Adjust stock: `+100` units, reason: `PURCHASE`
2. Sync to website (optional)

### POS Sale
1. Adjust stock: `-1` unit, reason: `SALE`
2. Auto-sync if enabled

### Physical Count
1. Count actual inventory
2. Adjust to match: `actual - current`
3. Reason: `RECOUNT`

### End of Day
1. Click "Sync All to Website"
2. Review stock movements
3. Check low stock alerts

## Troubleshooting

**Stock not syncing?**
- Check WooCommerce credentials in `.env.local`
- Check browser console for errors
- Verify product has `wooId`

**Negative stock?**
- Use adjustment to correct
- Check stock movements for cause

**Reserved stock stuck?**
- Manually release via API
- Check for cancelled orders

## Next Steps

1. Set up low stock alerts per product
2. Enable auto-sync for high-turnover items
3. Schedule daily sync (cron job)
4. Train staff on stock management page
5. Implement physical count schedule

## Support

See full documentation: `DUAL_STOCK_SYSTEM.md`
