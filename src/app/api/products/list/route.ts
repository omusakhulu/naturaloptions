import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import { getAllProducts } from '@/lib/db/products'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all products from database
    const products = await getAllProducts()

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        message: 'No products found'
      })
    }

    // Transform products for autocomplete
    const transformedProducts = products.map(product => {
      // Parse categories from JSON if they exist
      let categories = []

      try {
        categories = product.categories ? JSON.parse(product.categories as string) : []
      } catch (e) {
        categories = []
      }

      return {
        id: product.wooId,
        name: product.name,
        price: product.price,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        sku: product.sku,
        image: product.image,
        categories: categories
      }
    })

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      count: transformedProducts.length
    })
  } catch (error) {
    console.error('Error fetching products:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
