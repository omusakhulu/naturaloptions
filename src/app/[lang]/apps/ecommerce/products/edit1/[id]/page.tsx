import { notFound } from 'next/navigation'

import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/config/auth'
import { getProductByWooId } from '@/lib/db/products'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'
import ProductForm from '@/components/products/ProductForm'

 type ProductFormProduct = {
   id: string
   name: string
   slug?: string
   sku?: string | null
   price?: string | null
   regular_price?: string | null
   sale_price?: string | null
   stock_status?: string
   stock_quantity?: number
   description?: string | null
   short_description?: string | null
   status?: string
   wooId?: number
 }

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
    const dbProduct = await getProductByWooId(productId)
    let product: ProductFormProduct | null = dbProduct
      ? {
          id: dbProduct.id,
          name: dbProduct.name,
          slug: dbProduct.slug,
          sku: dbProduct.sku,
          price: dbProduct.price,
          regular_price: dbProduct.regularPrice,
          sale_price: dbProduct.salePrice,
          stock_status: dbProduct.stockStatus,
          stock_quantity: dbProduct.stockQuantity,
          description: dbProduct.description,
          short_description: dbProduct.shortDescription,
          status: dbProduct.status,
          wooId: dbProduct.wooId
        }
      : null

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
        regular_price: wooProduct.regular_price || null,
        sale_price: wooProduct.sale_price || null,
        stock_status: wooProduct.stock_status || 'instock',
        stock_quantity: wooProduct.stock_quantity || 0,
        description: wooProduct.description || null,
        short_description: wooProduct.short_description || null,
        status: wooProduct.status || 'publish',
        wooId: wooProduct.id
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
