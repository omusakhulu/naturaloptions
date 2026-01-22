import { NextRequest, NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

// Import with alias paths
import { saveProducts } from '@/lib/db/products'
import cache from '@/lib/utils/cache'

// Type definitions
interface WooCategory {
  id: number
  name: string
  slug?: string
}

interface WooProduct {
  id: number
  name: string
  slug: string
  description?: string
  short_description?: string
  price?: string
  regular_price?: string
  sale_price?: string
  stock_status?: string
  stock_quantity?: number
  sku?: string
  images?: Array<{ src: string }>
  categories?: WooCategory[]
  rating?: number
  review_count?: number
  status?: string
  [key: string]: unknown // Allow other properties
}

const PRODUCTS_CACHE_KEY = 'woocommerce_products'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const requiredEnvVars = ['WOO_STORE_URL', 'WOO_CONSUMER_KEY', 'WOO_CONSUMER_SECRET']
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

    if (missingVars.length > 0) {
      return NextResponse.json({ error: `Missing environment variables: ${missingVars.join(', ')}` }, { status: 400 })
    }

    // Log environment variables (without sensitive data)
    console.log('🔧 Environment variables:', {
      WOO_STORE_URL: process.env.WOO_STORE_URL ? '✅ Set' : '❌ Missing',
      WOO_CONSUMER_KEY: process.env.WOO_CONSUMER_KEY ? '✅ Set' : '❌ Missing',
      WOO_CONSUMER_SECRET: process.env.WOO_CONSUMER_SECRET ? '✅ Set' : '❌ Missing'
    })

    if (!process.env.WOO_STORE_URL || !process.env.WOO_CONSUMER_KEY || !process.env.WOO_CONSUMER_SECRET) {
      throw new Error('Missing required WooCommerce API credentials')
    }

    // Initialize WooCommerce Service
    const wooService = WooCommerceService.getInstance()

    console.log('🔄 Preparing to fetch all products...')

    // Create category map (will be populated from WooCommerce product data)
    let categoryMap: Record<number, string> = {}

    console.log('🔄 Fetching all products from WooCommerce...')

    // Fetch all products with pagination
    let allProducts: WooProduct[] = []
    let page = 1
    const perPage = 100

    let hasMore = true

    while (hasMore) {
      try {
        // Fetch products using WooCommerce Service
        const response = await wooService.listProducts(page, perPage)

        const products: WooProduct[] = Array.isArray(response) ? response as unknown as WooProduct[] : []

        if (!Array.isArray(products) || products.length === 0) {
          hasMore = false
        } else {
          // Map categories to products
          const mappedProducts = products.map((product: WooProduct) => {
            const mappedCategories = (product.categories || []).map((cat: WooCategory) => ({
              id: cat.id,
              name: categoryMap[cat.id] || cat.name || `Category ${cat.id}`,
              slug: cat.slug || `category-${cat.id}`
            }))

            return {
              ...product,
              categories: mappedCategories
            }
          })

          allProducts = [...allProducts, ...mappedProducts]
          console.log(`📦 Fetched ${products.length} products from page ${page} (mapped categories)`)
          page++
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error)
        hasMore = false
      }
    }

    console.log(`✅ Total products fetched: ${allProducts.length}`)

    // Save all products to database
    if (allProducts.length > 0) {
      try {
        await saveProducts(allProducts)
        console.log(`💾 Saved ${allProducts.length} products to database`)
      } catch (dbError) {
        console.warn('⚠️ Failed to save products to database:', dbError)
      }
    }

    // Clear cache to force refresh
    cache?.delete?.(PRODUCTS_CACHE_KEY)

    return NextResponse.json({
      success: true,
      message: `Successfully fetched and saved ${allProducts.length} products`,
      count: allProducts.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in fetch-all endpoint:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
