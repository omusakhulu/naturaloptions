# Database Setup Guide

## Overview
This application uses Prisma ORM with PostgreSQL to store WooCommerce products.

## Configuration

### 1. Environment Variables
Add the following to your `.env.local` file:

```env
# PostgreSQL Database
DATABASE_URL=postgresql://postgres:Jomusakhulu1!@localhost:5433/omnishop?schema=public

# WooCommerce API
WOO_STORE_URL=https://omnishop.omnispace3d.com
WOO_CONSUMER_KEY=your_key_here
WOO_CONSUMER_SECRET=your_secret_here
```

### 2. Database Connection
- **Provider**: PostgreSQL
- **Host**: localhost
- **Port**: 5433
- **Database**: omnishop
- **Schema**: public

## Features

### Product Storage
When products are fetched from WooCommerce API, they are automatically:
- Saved to the `Product` table in PostgreSQL
- Upserted (updated if exists, created if new)
- Timestamped with sync information

### Product Fields Stored
- `wooId` - WooCommerce product ID (unique)
- `name` - Product name
- `slug` - URL-friendly name (unique)
- `description` - Full description
- `shortDescription` - Short description
- `price`, `regularPrice`, `salePrice` - Pricing
- `stockStatus`, `stockQuantity` - Stock info
- `sku` - Product SKU (unique)
- `image` - Primary image URL
- `images` - JSON array of all images
- `categories` - JSON array of categories
- `rating`, `ratingCount` - Review ratings
- `status` - Product status (publish, draft, etc.)
- `createdAt`, `updatedAt`, `syncedAt` - Timestamps

## Database Functions

Located in `src/lib/db/products.ts`:

### Save Functions
- `saveProduct(productData)` - Save/update single product
- `saveProducts(productsData)` - Batch save multiple products

### Retrieve Functions
- `getAllProducts()` - Get all products
- `getProductByWooId(wooId)` - Get specific product

### Delete Functions
- `deleteProduct(wooId)` - Delete by WooCommerce ID
- `clearAllProducts()` - Clear entire table

## Error Handling

If `DATABASE_URL` is not configured:
- Database operations will be skipped gracefully
- Warnings will be logged to console
- Application will continue to work with mock data
- Products won't be persisted to database

## Troubleshooting

### DATABASE_URL Not Found
**Error**: `You must provide a nonempty URL. The environment variable DATABASE_URL resolved to an empty string.`

**Solution**: 
1. Ensure `.env.local` has `DATABASE_URL` set
2. Restart the dev server after adding the variable
3. Check that PostgreSQL is running on localhost:5433

### Connection Refused
**Error**: `connect ECONNREFUSED 127.0.0.1:5433`

**Solution**:
1. Verify PostgreSQL is running
2. Check the port is correct (5433)
3. Verify credentials in DATABASE_URL

### Migration Issues
To reset and re-apply migrations:
```bash
npx prisma migrate reset --force
npx prisma db push
```

## Prisma Commands

```bash
# Apply migrations
npx prisma migrate dev --name <migration_name>

# Push schema to database (no migration history)
npx prisma db push

# Open Prisma Studio (GUI for database)
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset --force
```

## Files

- **Schema**: `src/prisma/schema.prisma`
- **Database Service**: `src/lib/db/products.ts`
- **Products Page**: `src/app/[lang]/(dashboard)/(private)/apps/ecommerce/products/list/page.jsx`
- **Migrations**: `src/prisma/migrations/`
