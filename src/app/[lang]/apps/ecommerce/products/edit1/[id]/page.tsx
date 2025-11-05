import { notFound } from 'next/navigation'

import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/config/auth'
import { getProductByWooId } from '@/lib/db/products'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'
import ProductForm from '@/components/products/ProductForm'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false
      }
    }
  }

  const productId = parseInt(resolvedParams.id, 10)

  if (isNaN(productId)) {
    return notFound()
  }

  try {
    // Try to get the product from the local database first
    let product = await getProductByWooId(productId)

    // If not found locally, try to fetch from WooCommerce
    if (!product) {
      const wooService = WooCommerceService.getInstance()
      const wooProduct = await wooService.getProduct(productId)

      if (!wooProduct) {
        return notFound()
      }

      // Format the product for the form
      product = {
        id: wooProduct.id.toString(),
        name: wooProduct.name,
        slug: wooProduct.slug,
        sku: wooProduct.sku || null,
        price: wooProduct.price || null,
        regularPrice: wooProduct.regular_price || null,
        salePrice: wooProduct.sale_price || null,
        stockStatus: wooProduct.stock_status || 'instock',
        stockQuantity: wooProduct.stock_quantity || 0,
        description: wooProduct.description || null,
        shortDescription: wooProduct.short_description || null,
        rating: 0,
        ratingCount: 0,
        image: wooProduct.images?.[0]?.src || null,
        images: JSON.stringify(wooProduct.images || []),
        categories: JSON.stringify(wooProduct.categories || []),
        status: wooProduct.status || 'publish',
        wooId: wooProduct.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncedAt: new Date()
      }
    }

    return (
      <div className='p-6'>
        <h1 className='text-2xl font-semibold mb-6'>Edit Product</h1>
        <ProductForm product={product as any} />
      </div>
    )
  } catch (error) {
    console.error('Error fetching product:', error)

    return notFound()
  }
}

// Generate static params for better performance
export async function generateStaticParams() {
  // In a real app, you might want to pre-render the most popular products
  // For now, we'll return an empty array and rely on server-side rendering
  return []
}
