import { NextRequest, NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'
import { saveOrders } from '@/lib/db/orders'
import cache from '@/lib/utils/cache'

const ORDERS_CACHE_KEY = 'woocommerce_orders'
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

    console.log('🔄 Fetching all orders from WooCommerce...')

    // Fetch all orders with pagination
    let allOrders: any[] = []
    let page = 1
    const perPage = 100

    let hasMore = true

    while (hasMore) {
      try {
        // Fetch orders using WooCommerce Service
        const orders = await wooService.listOrders({
          status: 'any',
          per_page: perPage,
          page: page,
          orderby: 'date',
          order: 'desc'
        })

        if (!Array.isArray(orders) || orders.length === 0) {
          hasMore = false
        } else {
          allOrders = [...allOrders, ...orders]
          console.log(`📦 Fetched ${orders.length} orders from page ${page}`)
          page++
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error)
        hasMore = false
      }
    }

    console.log(`✅ Total orders fetched: ${allOrders.length}`)

    // Save all orders to database
    if (allOrders.length > 0) {
      try {
        await saveOrders(allOrders)
        console.log(`💾 Saved ${allOrders.length} orders to database`)
      } catch (dbError) {
        console.warn('⚠️ Failed to save orders to database:', dbError)
      }
    }

    // Clear cache to force refresh
    cache.delete(ORDERS_CACHE_KEY)

    return NextResponse.json({
      success: true,
      message: `Successfully fetched and saved ${allOrders.length} orders`,
      count: allOrders.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in fetch-all endpoint:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
