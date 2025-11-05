# WooCommerce Webhooks Setup Guide

## Overview

This system uses **WooCommerce Webhooks** instead of direct API polling for real-time product synchronization. This approach is much more reliable and efficient than the previous timeout-prone API calls.

## Benefits of Webhooks

✅ **Real-time updates** - Products sync instantly when changed in WooCommerce
✅ **No timeouts** - WooCommerce pushes data to us instead of us polling
✅ **More reliable** - No network connectivity issues
✅ **Better performance** - Only processes changed products
✅ **Automatic sync** - Database stays in sync without manual intervention

## Setup Instructions

### Step 1: Configure Webhook Secret

Add this to your `.env.local` file:

```env
# Webhook secret for signature verification (optional but recommended)
WOOCOMMERCE_WEBHOOK_SECRET=your_unique_webhook_secret_here
```

**Note**: If you don't set a webhook secret, the system will use your consumer secret for verification.

### Step 2: Set Webhook URL

Your webhook endpoint will be:
```
https://your-domain.com/api/products/webhooks
```

Replace `your-domain.com` with your actual domain. For local development:
```
http://localhost:3000/api/products/webhooks
```

### Step 3: Configure WooCommerce Webhooks

1. **Login to WordPress Admin**
   - Go to your WooCommerce store admin panel

2. **Navigate to Webhooks**
   - Go to **WooCommerce → Settings → Advanced → Webhooks**
   - Click **Add webhook**

3. **Configure Webhook Settings**

   **Webhook Name:**
   ```
   Product Sync to Dashboard
   ```

   **Status:**
   ```
   Active
   ```

   **Topic:**
   ```
   Product updated
   ```

   **Delivery URL:**
   ```
   https://your-domain.com/api/products/webhooks
   ```

   **Secret:**
   ```
   your_unique_webhook_secret_here
   ```
   (Same as WOOCOMMERCE_WEBHOOK_SECRET in your .env.local)

   **API Version:**
   ```
   WP REST API Integration v3
   ```

4. **Add Additional Webhooks**

   Repeat the process for these additional events:
   - **Product created** (for new products)
   - **Product deleted** (for deleted products)

### Step 4: Test the Setup

1. **Verify Webhook URL**
   - Visit: `https://your-domain.com/api/products/webhooks?action=verify`
   - Should return: `{"message": "Webhook verified"}`

2. **Test Product Update**
   - Update a product in WooCommerce
   - Check your application logs for webhook activity
   - Verify the product appears in your database

## Webhook Events Supported

The webhook endpoint handles these WooCommerce events:

### Product Updated (`product.updated`)
- Updates existing products in database
- Syncs all product fields including: name, price, stock, categories, etc.

### Product Created (`product.created`)
- Creates new products in database
- Same field mapping as updates

### Product Deleted (`product.deleted`)
- Removes products from database
- Maintains referential integrity

## Security Features

### Signature Verification
- All webhooks are verified using HMAC SHA256
- Uses the webhook secret for signature validation
- Rejects requests with invalid signatures

### Request Validation
- Validates webhook payload structure
- Handles malformed or missing data gracefully
- Logs all webhook activity for debugging

### Error Handling
- Comprehensive error logging
- Graceful degradation for network issues
- Manual fallback for missing product data

## Monitoring

### Logs to Check
- **Application logs**: Webhook processing activity
- **Database logs**: Product sync operations
- **WooCommerce logs**: Webhook delivery status

### Manual Sync Fallback
If webhooks fail, you can still use the existing API endpoints:
- `POST /api/products/fetch-all` - Sync all products
- `GET /api/products/[id]` - Sync specific product

## Troubleshooting

### Webhook Not Firing
1. Check WooCommerce webhook logs
2. Verify webhook URL is accessible
3. Test webhook delivery in WooCommerce admin

### Signature Verification Failing
1. Ensure webhook secret matches in both systems
2. Check if consumer secret is being used as fallback
3. Verify payload format hasn't changed

### Products Not Updating
1. Check application logs for webhook processing
2. Verify database connectivity
3. Test manual API calls as fallback

## Migration from API Polling

### Before (API Polling)
```
❌ Manual API calls every few minutes
❌ Timeout errors with large catalogs
❌ Network connectivity issues
❌ Resource intensive
```

### After (Webhooks)
```
✅ Real-time updates when products change
✅ No timeouts or network issues
✅ Efficient and reliable
✅ Automatic sync
```

## Environment Variables Reference

```env
# Required for webhooks
WOOCOMMERCE_WEBHOOK_SECRET=your_webhook_secret

# Required for API fallback
NEXT_PUBLIC_WOOCOMMERCE_STORE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=your_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=your_consumer_secret

# Required for database
DATABASE_URL=postgresql://...
```

## Next Steps

1. ✅ **Complete webhook setup** using this guide
2. ✅ **Test webhook functionality** with a product update
3. ✅ **Monitor logs** for proper webhook processing
4. ✅ **Consider disabling** old API polling methods if webhooks work reliably

The webhook system will make your product synchronization much more reliable and efficient!
