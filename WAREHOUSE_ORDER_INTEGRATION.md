# Warehouse Order Integration

## Overview
Automatic warehouse stock reduction when WooCommerce orders are completed, with order number tracking for full audit trail.

## How It Works

### 1. Order Completion Webhook
When an order status changes to "completed" in WooCommerce:
- Webhook triggers: `/api/webhooks/order-updated`
- System automatically reduces warehouse stock
- Creates "outbound" stock movements
- Associates movements with order number

### 2. Stock Reduction Process
For each line item in the order:
1. **Match by SKU** - Finds inventory item in warehouse by SKU
2. **Check Stock** - Verifies available quantity (warns if insufficient)
3. **Create Movement** - Creates outbound stock movement with order reference
4. **Update Inventory** - Reduces warehouse quantity
5. **Log Results** - Records success/errors for each item

### 3. Order Cancellation/Refund
When an order is cancelled or refunded:
- System automatically reverses stock movements
- Creates "return" stock movements
- Restores warehouse quantities
- Links return movements to original order

## Files Created

### Service Layer
**`src/lib/services/warehouseStockService.ts`**
- `processOrderCompletion()` - Reduce stock when order completed
- `reverseOrderStockMovements()` - Restore stock on cancellation/refund
- `getOrderStockMovements()` - Retrieve movements for an order

### API Endpoints
**`src/app/api/warehouses/process-order/route.ts`**
- `POST` - Manually process stock for an order
- `GET` - Get stock movements for a specific order

### Updated Files
**`src/app/api/webhooks/order-updated/route.ts`**
- Added automatic stock processing on order completion
- Added automatic stock reversal on cancellation/refund

**`src/app/[lang]/(dashboard)/(private)/apps/warehouses/[id]/movements/page.tsx`**
- Enhanced UI to highlight order references
- Color-coded chips for ORDER-xxx and RETURN-xxx references

## Features

### ✅ Automatic Stock Reduction
- Triggered when order status = "completed"
- Processes all line items in order
- Matches products by SKU
- Creates outbound movements with order reference

### ✅ Order Reference Tracking
- Stock movements include reference: `ORDER-{orderNumber}`
- Easy to trace which order caused stock reduction
- Full audit trail maintained

### ✅ Insufficient Stock Handling
- Warns if insufficient stock available
- Continues processing (allows negative inventory)
- Logs warnings for manual review

### ✅ Automatic Stock Returns
- Reverses stock on order cancellation
- Reverses stock on order refund
- Creates return movements: `RETURN-{orderNumber}`

### ✅ Manual Processing
- API endpoint to manually process orders
- Useful for historical orders or re-processing
- Supports both reduce and reverse actions

## Usage Examples

### View Stock Movements for Order
```bash
GET /api/warehouses/process-order?orderId=123
```

Response:
```json
{
  "success": true,
  "orderNumber": "12345",
  "movements": [
    {
      "type": "outbound",
      "quantity": 2,
      "referenceNumber": "ORDER-12345",
      "inventory": {
        "sku": "PROD-001",
        "productName": "Sample Product"
      }
    }
  ],
  "count": 1
}
```

### Manually Process Order Stock
```bash
POST /api/warehouses/process-order
Content-Type: application/json

{
  "orderId": 123,
  "action": "reduce"
}
```

Response:
```json
{
  "success": true,
  "message": "Successfully reduced warehouse stock for order 12345",
  "result": {
    "orderNumber": "12345",
    "processedItems": 3,
    "skippedItems": 0,
    "movements": 3,
    "errors": []
  }
}
```

### Reverse Order Stock (Cancellation)
```bash
POST /api/warehouses/process-order
Content-Type: application/json

{
  "orderId": 123,
  "action": "reverse"
}
```

## Warehouse Selection

**Current Logic:**
- Uses first active warehouse (ordered by creation date)
- You may want to customize this based on your needs

**Customization Options:**
1. Add warehouse field to products
2. Add warehouse field to orders (customer location)
3. Implement multi-warehouse routing logic
4. Use default warehouse per product category

To customize, edit `warehouseStockService.ts`:
```typescript
// Find warehouse by custom logic
const warehouse = await prisma.warehouse.findFirst({
  where: { 
    status: 'active',
    // Add your custom criteria here
    // e.g., location: customerLocation
  }
})
```

## Stock Movement Reference Formats

- **Order Fulfillment**: `ORDER-{orderNumber}`
  - Example: `ORDER-12345`
  - Type: outbound
  - Created when order completed

- **Order Return**: `RETURN-{orderNumber}`
  - Example: `RETURN-12345`
  - Type: return
  - Created when order cancelled/refunded

## UI Features

### Stock Movements Page
Navigate to: `/en/apps/warehouses/{id}/movements`

**Displays:**
- Color-coded movement types
- Order reference chips (blue for ORDER, orange for RETURN)
- Detailed order information
- Complete audit trail

**Filters:**
- All movements
- By type (inbound, outbound, transfer, adjustment, return)

## Monitoring & Logs

### Console Logs
```
📦 Processing order 12345 for warehouse stock reduction
Using warehouse: Main Warehouse (WH-001)
✅ Reduced stock for PROD-001: 50 → 48 (-2)
✅ Order 12345 processing complete: 3 items processed, 0 skipped
```

### Error Handling
- SKU not found in warehouse → Skipped with warning
- Insufficient stock → Warning logged, continues processing
- Database errors → Transaction rolled back, order fails safely

## Requirements

### Product Setup
1. Products must have SKU field populated
2. Products must exist in warehouse inventory
3. SKU must match exactly between WooCommerce and warehouse

### Warehouse Setup
1. At least one active warehouse must exist
2. Products must be added to warehouse inventory
3. Initial stock quantities must be set

### Webhook Setup
1. WooCommerce webhook configured for "order.updated"
2. Webhook pointing to: `{your-domain}/api/webhooks/order-updated`
3. Webhook secret configured in environment variables

## Testing

### Test Order Completion
1. Create test order in WooCommerce
2. Add products with SKUs matching warehouse inventory
3. Complete the order
4. Check warehouse stock movements page
5. Verify stock quantity reduced
6. Verify movement shows ORDER reference

### Test Order Cancellation
1. Complete an order (creates stock movements)
2. Cancel the order in WooCommerce
3. Check warehouse stock movements
4. Verify return movements created
5. Verify stock quantity restored

## Troubleshooting

### Stock Not Reducing
**Check:**
- [ ] Webhook is triggered (check WooCommerce logs)
- [ ] Order status is "completed"
- [ ] Products have SKU field
- [ ] SKU matches warehouse inventory
- [ ] Active warehouse exists
- [ ] Console logs for errors

### SKU Not Found
**Solutions:**
- Ensure product SKU matches exactly (case-sensitive)
- Add products to warehouse inventory first
- Check for extra spaces in SKU field

### Insufficient Stock Warning
**Action:**
- System still processes (allows negative inventory)
- Review inventory levels
- Adjust stock or reorder levels
- Consider implementing stock reservations

## Future Enhancements

Potential improvements:
- [ ] Multi-warehouse support with routing rules
- [ ] Stock reservation on order placement
- [ ] Low stock notifications
- [ ] Automatic reorder point alerts
- [ ] Warehouse allocation by customer location
- [ ] Backorder management
- [ ] Stock forecasting based on orders

## Related Documentation
- [Warehouse Management System](./WAREHOUSE_MANAGEMENT.md)
- [WooCommerce Webhooks Setup](./WOOCOMMERCE_WEBHOOKS_SETUP.md)
- [Stock Movement Types](./STOCK_MOVEMENTS.md)
