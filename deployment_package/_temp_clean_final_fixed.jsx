'use server';

import { notFound } from 'next/navigation';

// Database and API services
import { getProductByWooId, saveProduct } from '@/lib/db/products';
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service';

// Client component
import ProductEditForm from './ProductEditForm';

export const dynamic = 'force-dynamic';

export default async function ProductEditPage({ params }) {
  const { id } = params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    notFound();
  }

  // Fetch product data from database
  let productData = await getProductByWooId(productId);

  // If not found locally, try to fetch from WooCommerce
  if (!productData) {
    try {
      const wooService = new WooCommerceService();
      const wooProduct = await wooService.getProduct(productId);

      if (wooProduct) {
        // Save to local database for future use
        productData = await saveProduct(wooProduct);
      }
    } catch (error) {
      console.error('Error fetching from WooCommerce:', error);
      // Continue with null productData, will be handled by the client component
    }
  }

  return <ProductEditForm productId={productId} initialProduct={productData} />;
}
