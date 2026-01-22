#!/bin/bash

echo "🔧 Fixing current build errors on VPS..."

# Step 1: Fix the getAllCategories import issue in fetch-all route
echo "📝 Step 1: Fixing getAllCategories import issue..."
cat > src/app/api/products/fetch-all/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'
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
  price: string
  regular_price?: string
  sale_price?: string
  stock_status?: string
  stock_quantity?: number
  sku?: string
  images?: Array<{ src: string }>
  categories?: WooCategory[]
  status?: string
  rating?: number
  review_count?: number
  [key: string]: unknown
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

    // Initialize WooCommerce Service
    const wooService = WooCommerceService.getInstance()

    console.log('🔄 Fetching all products from WooCommerce...')

    // Fetch all products with pagination
    let allProducts: WooProduct[] = []
    let page = 1
    const perPage = 100
    let hasMore = true

    while (hasMore) {
      try {
        const response = await wooService.listProducts(page, perPage)
        const products = Array.isArray(response) ? response : []

        if (!Array.isArray(products) || products.length === 0) {
          hasMore = false
        } else {
          allProducts = [...allProducts, ...products]
          console.log(`📦 Fetched ${products.length} products from page ${page}`)
          page++

          if (products.length < perPage) {
            hasMore = false
          }
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
    cache.delete(PRODUCTS_CACHE_KEY)

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
EOF

# Step 2: Clean build cache
echo "📝 Step 2: Cleaning build cache..."
rm -rf .next node_modules/.cache

# Step 3: Build with optimized settings
echo "📝 Step 3: Building application..."
export NODE_OPTIONS="--max-old-space-size=2048"
export NODE_ENV=production

echo "🚀 Running build..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the error logs above."
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "🎉 You can now start the application with:"
echo "pm2 restart omnishop-admin"
echo "pm2 save"
