import { NextResponse } from 'next/server';
import { verifyWebhook } from '@/lib/webhooks';
import { saveProduct } from '@/lib/db/products';

export async function POST(request) {
  try {
    const payload = await request.json();
    const signature = request.headers.get('x-wc-webhook-signature');
    const topic = request.headers.get('x-wc-webhook-topic');
    
    // Verify the webhook signature
    if (!verifyWebhook(JSON.stringify(payload), signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log(`[Webhook] Received ${topic} event`);

    // Handle different webhook events
    switch (topic) {
      case 'product.created':
      case 'product.updated':
        await handleProductWebhook(payload);
        break;
      case 'order.created':
      case 'order.updated':
        await handleOrderWebhook(payload);
        break;
      // Add more event handlers as needed
      default:
        console.log(`[Webhook] Unhandled event type: ${topic}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}

async function handleProductWebhook(productData) {
  console.log(`[Webhook] Processing product: ${productData.id} - ${productData.name}`);
  // Save or update product in database
  await saveProduct({
    wooId: productData.id.toString(),
    name: productData.name,
    slug: productData.slug,
    description: productData.description || '',
    shortDescription: productData.short_description || '',
    price: parseFloat(productData.price || '0'),
    regularPrice: parseFloat(productData.regular_price || '0'),
    salePrice: productData.sale_price ? parseFloat(productData.sale_price) : null,
    stockStatus: productData.stock_status || 'instock',
    stockQuantity: productData.stock_quantity || 0,
    sku: productData.sku || '',
    image: productData.images?.[0]?.src || '',
    images: productData.images || [],
    categories: productData.categories || [],
    status: productData.status || 'publish',
  });
  console.log(`[Webhook] Product ${productData.id} processed successfully`);
}

async function handleOrderWebhook(orderData) {
  console.log(`[Webhook] Processing order: ${orderData.id}`);
  // Add order processing logic here
  // e.g., update inventory, send notifications, etc.
}
