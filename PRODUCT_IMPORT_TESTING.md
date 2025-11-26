# Product Import Testing Guide

## What Was Fixed

### Root Cause
The bulk import was failing because:
1. The `Product` database schema requires a unique `wooId` field (not nullable)
2. The old import flow tried to save products to the local database FIRST (without a `wooId`)
3. This caused database constraint violations

### Solution
Reversed the import flow:
1. **Create products in WooCommerce FIRST** → Get the `wooId`
2. **Then save to local database** with the WooCommerce ID

### Changes Made

#### 1. Fixed `/src/app/api/products/bulk-import/route.ts`
- Reordered the flow to create WooCommerce products first
- Added better error handling and status messages
- Improved logging with emoji indicators (✅, ❌, ⚠️)
- Added rate limiting (1 second delay between products)
- Properly maps WooCommerce response to local database schema

#### 2. Improved `/src/app/[lang]/(dashboard)/(private)/apps/ecommerce/products/import-products/page.jsx`
- Better user feedback with progress messages
- Increased timeout to 5 minutes for large imports
- Scrollable log display with monospace font
- Better error message display

## How to Test

### Step 1: Create a Test CSV File

Create a file named `test-products.csv` with the following content:

```csv
product_name,brand,unit,category,sub_category,sku,barcode_type,manage_stock,alert_quantity,expiration_period_days,selling_price,tax_percent,product_type,variation_attributes,opening_stock,location,image_url
Test Product 1,Test Brand,pcs,Electronics,,TEST-SKU-001,EAN13,Yes,10,365,99.99,16,simple,,50,Main Store,
Test Product 2,Test Brand,kg,Food,,TEST-SKU-002,EAN13,No,5,30,49.99,8,simple,,100,Main Store,
Test Product 3,Test Brand,pcs,Clothing,,TEST-SKU-003,EAN13,Yes,20,0,149.99,16,simple,,25,Main Store,
```

### Step 2: Access the Import Page

1. Navigate to: http://localhost:3000/en/apps/ecommerce/products/import-products
2. You should see the import form with instructions

### Step 3: Download Template (Optional)

Click "Download template file" to get the CSV template with correct headers

### Step 4: Import Products

1. Click "Choose File" and select your `test-products.csv`
2. Click "Submit"
3. Wait for the import to complete (you'll see progress messages)

### Expected Results

You should see output like:
```
✅ Created in WooCommerce: Test Product 1 (ID: 123)
✅ Saved to local DB: Test Product 1
✅ Created in WooCommerce: Test Product 2 (ID: 124)
✅ Saved to local DB: Test Product 2
✅ Created in WooCommerce: Test Product 3 (ID: 125)
✅ Saved to local DB: Test Product 3
```

### Step 5: Verify in Database

Check that products were saved:
```sql
SELECT id, "wooId", name, sku, "regularPrice", "stockQuantity" 
FROM "Product" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### Step 6: Verify in WooCommerce

1. Go to your WooCommerce admin: https://naturaloptions.co.ke/staging/wp-admin
2. Navigate to Products
3. Check that the test products appear

## Troubleshooting

### Error: "WooCommerce credentials not configured"
- Check `.env.local` has these variables:
  - `WOO_STORE_URL` or `WOOCOMMERCE_STORE_URL`
  - `WOOCOMMERCE_CONSUMER_KEY`
  - `WOOCOMMERCE_CONSUMER_SECRET`

### Error: "WooCommerce create failed"
- Check WooCommerce API credentials are valid
- Verify the store URL is accessible
- Check WooCommerce REST API is enabled

### Error: "Local save error"
- Check `DATABASE_URL` is configured in `.env.local`
- Verify PostgreSQL is running on port 5433
- Run `npx prisma generate` to ensure Prisma client is up to date

### Products created in WooCommerce but not in local DB
- Check the terminal logs for database errors
- Verify the Product schema matches the saveProduct function
- The import will continue even if local save fails (you'll see ⚠️ warnings)

## CSV Column Reference

| Column # | Column Name | Required | Description | Example |
|----------|-------------|----------|-------------|---------|
| 1 | product_name | ✅ Yes | Product name | "Wireless Mouse" |
| 2 | brand | No | Brand name | "Logitech" |
| 3 | unit | No | Unit of measure | "pcs", "kg", "liters" |
| 4 | category | No | Category name | "Electronics" |
| 5 | sub_category | No | Sub-category | "Computer Accessories" |
| 6 | sku | No | Unique SKU | "WM-001" |
| 7 | barcode_type | No | Barcode type | "EAN13", "UPC" |
| 8 | manage_stock | No | Enable stock management | "Yes" or "No" |
| 9 | alert_quantity | No | Low stock alert | "10" |
| 10 | expiration_period_days | No | Days until expiry | "365" |
| 11 | selling_price | No | Regular price | "99.99" |
| 12 | tax_percent | No | Tax percentage | "16" |
| 13 | product_type | No | Product type | "simple" or "variable" |
| 14 | variation_attributes | No | Attributes (comma-separated) | "Size,Color" |
| 15 | opening_stock | No | Initial stock quantity | "100" |
| 16 | location | No | Store location | "Main Store" |
| 17 | image_url | No | Product image URL | "https://..." |

## Performance Notes

- Import processes one product at a time (sequential)
- 1 second delay between products to avoid rate limiting
- Large imports (100+ products) may take several minutes
- The page will show progress as products are imported
- Don't close the browser during import

## Next Steps

If you need to:
1. **Add more fields** - Update the CSV template and bulk-import route
2. **Handle categories better** - Map category names to WooCommerce category IDs
3. **Add image upload** - Implement image hosting and URL generation
4. **Batch processing** - Group products for faster imports (be careful with rate limits)
5. **Update existing products** - Modify the flow to check if product exists first
