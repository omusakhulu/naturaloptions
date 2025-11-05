import { NextRequest, NextResponse } from 'next/server'
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'

const CATEGORIES_CACHE_KEY = 'woocommerce_categories'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const requiredEnvVars = ['WOO_STORE_URL', 'WOO_CONSUMER_KEY', 'WOO_CONSUMER_SECRET']
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

    if (missingVars.length > 0) {
      return NextResponse.json(
        { error: `Missing environment variables: ${missingVars.join(', ')}` },
        { status: 400 }
      )
    }

    // Initialize WooCommerce REST API client
    const wooApi = new WooCommerceRestApi({
      url: process.env.WOO_STORE_URL || '',
      consumerKey: process.env.WOO_CONSUMER_KEY || '',
      consumerSecret: process.env.WOO_CONSUMER_SECRET || '',
      version: 'wc/v3',
      queryStringAuth: true,
      timeout: 60000,
      // Force IPv4 to avoid potential IPv6 issues
      axiosConfig: {
        family: 4,
        httpsAgent: new (require('https').Agent)({  
          rejectUnauthorized: false
        })
      }
    })

    console.log('🔄 Fetching all categories from WooCommerce...')

    // Fetch all categories with pagination using WooCommerce REST API
    let allCategories: any[] = []
    let page = 1
    const perPage = 100
    let hasMore = true

    while (hasMore) {
      try {
        // Get categories for current page
        const response = await wooApi.get('products/categories', {
          per_page: perPage,
          page: page,
          orderby: 'count',
          order: 'desc',
          hide_empty: true
        })

        const categories = Array.isArray(response.data) ? response.data : []
        
        if (categories.length === 0) {
          hasMore = false
        } else {
          allCategories = [...allCategories, ...categories]
          console.log(`📄 Fetched ${categories.length} categories from page ${page}`)
          page++
        }
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error)
        hasMore = false
      }
    }

    console.log(`✅ Total categories fetched: ${allCategories.length}`)

    return NextResponse.json({
      success: true,
      message: `Successfully fetched ${allCategories.length} categories`,
      count: allCategories.length,
      data: allCategories,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error in fetch-all categories endpoint:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
