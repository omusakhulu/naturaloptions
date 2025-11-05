import { NextRequest, NextResponse } from 'next/server'

import type { Product } from '@prisma/client'

import type { WooProduct } from '@/types/woocommerce'

import { prisma } from '@/lib/db/prisma'
import { saveProduct } from '@/lib/db/products'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

interface WooCommerceProduct extends WooProduct {}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const wooService = WooCommerceService.getInstance()

  try {
    const resolvedParams = await params
    const { id: wooIdParam } = resolvedParams
    const wooId = Number(wooIdParam)

    if (isNaN(wooId) || wooId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid WooCommerce product ID',
          message: 'Product ID must be a valid numeric WooCommerce ID'
        },
        { status: 400 }
      )
    }

    // Delete in WooCommerce (force=true permanently removes)
    const result = await wooService.deleteProduct(wooId, true)

    // Delete locally if exists
    try {
      await prisma.product.delete({ where: { wooId } })
    } catch (e) {
      // Ignore if not found
      console.warn('Local product delete warning:', (e as Error).message)
    }

    return NextResponse.json({ success: true, deleted: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

interface LocalProduct extends Omit<Product, 'id'> {
  id: string
  wooId: number
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log('=== PRODUCT API REQUEST STARTED ===')
  const resolvedParams = await params

  console.log('Params received:', resolvedParams)
  console.log('Request URL:', request.url)
  console.log('Request method:', request.method)

  // Set a timeout for the entire operation
  const controller = new AbortController()

  const timeout = setTimeout(() => {
    console.error('Request timed out after 45 seconds')
    controller.abort()
  }, 45000) // 45 second timeout

  // Declare variables outside try block for scope accessibility
  let id: string = ''
  let wooId: number | null = null
  let product: LocalProduct | null = null

  try {
    id = resolvedParams.id

    // Always try to find by wooId first if it's a numeric ID
    if (/^\d+$/.test(id)) {
      wooId = parseInt(id, 10)

      // First try to find by WooCommerce ID in our database
      product = (await prisma.product.findFirst({
        where: { wooId: wooId }
      })) as LocalProduct | null
    }

    // If not found by wooId or ID is not numeric, try to find by internal ID
    if (!product) {
      product = (await prisma.product.findUnique({
        where: { id }
      })) as LocalProduct | null
    }

    console.log('Checking if we need to fetch from WooCommerce...')
    console.log('Product found in DB:', product ? 'Yes' : 'No')
    console.log('WooCommerce ID:', wooId)

    // If product is still not found and we have a WooCommerce ID, try to fetch from WooCommerce
    if (!product && wooId) {
      console.log('Attempting to fetch product from WooCommerce...')

      try {
        console.log(`[${new Date().toISOString()}] Fetching product from WooCommerce API. WooCommerce ID:`, wooId)
        console.log('WooCommerce API Request:', {
          method: 'GET',
          endpoint: `/wp-json/wc/v3/products/${wooId}`,
          timestamp: new Date().toISOString()
        })

        const wooService = WooCommerceService.getInstance()
        const startTime = Date.now()
        const wooProduct = await wooService.getProduct(wooId)

        console.log(`[${new Date().toISOString()}] WooCommerce API Response (${Date.now() - startTime}ms):`, {
          status: 'success',
          productId: wooProduct?.id,
          name: wooProduct?.name,
          statusCode: 200
        })

        if (!wooProduct) {
          return NextResponse.json({ success: false, error: 'Product not found in WooCommerce' }, { status: 404 })
        }

        // Prepare product data for database
        const productData = {
          wooId: wooProduct.id,
          name: wooProduct.name,
          slug: wooProduct.slug || `product-${wooProduct.id}`,
          sku: wooProduct.sku || '',
          status: (wooProduct.status || 'publish') as 'draft' | 'pending' | 'private' | 'publish',
          price: wooProduct.price || '0',
          regularPrice: wooProduct.regular_price || '0',
          salePrice: wooProduct.sale_price || '0',
          stockStatus: wooProduct.stock_status || 'instock',
          stockQuantity: wooProduct.stock_quantity || 0,
          image: wooProduct.images?.[0]?.src || null,
          images: JSON.stringify(wooProduct.images || []),
          categories: JSON.stringify(wooProduct.categories || []),
          syncedAt: new Date(),
          description: wooProduct.description || '',
          shortDescription: wooProduct.short_description || ''
        }

        // Save to database using upsert to handle both create and update cases
        const savedProduct = await prisma.product.upsert({
          where: { wooId: wooProduct.id },
          update: productData,
          create: productData
        })

        product = savedProduct as unknown as LocalProduct
      } catch (error) {
        console.error('Error fetching from WooCommerce:', error)

        // Return a 500 error if we can't fetch from WooCommerce
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch product from WooCommerce',
            message: 'Could not retrieve product information from WooCommerce.'
          },
          { status: 500 }
        )
      }
    }

    if (!product) {
      console.error('Product not found in database or WooCommerce')

      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
          message: `No product found with ID: ${id}`
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error: unknown) {
    console.error('=== ERROR IN PRODUCT API ===')
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('Error details:', {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    })
    console.error('=== END ERROR DETAILS ===')

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Request Timeout',
          message: 'The request took too long to process. Please try again.'
        },
        {
          status: 504,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing your request.'
      },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    clearTimeout(timeout)
    console.log('=== PRODUCT API REQUEST COMPLETED ===\n')
  }
}

// Helper function to safely serialize error objects
function safeStringify(obj: unknown): string {
  const seen = new WeakSet()

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }

      seen.add(value)
    }

    return value
  })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Initialize WooCommerce service at the start
  const wooService = WooCommerceService.getInstance()

  try {
    // await wooService.initialize()
    console.log('WooCommerce service initialized')

    // Get the WooCommerce ID from the URL - await params first
    const resolvedParams = await params
    const { id: wooIdParam } = resolvedParams

    // Convert to number and validate
    const wooId = Number(wooIdParam)

    if (isNaN(wooId) || wooId <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid WooCommerce product ID',
          message: 'Product ID must be a valid numeric WooCommerce ID',
          receivedId: wooIdParam
        },
        { status: 400 }
      )
    }

    console.log('🔍 Processing update for WooCommerce product ID:', wooId)

    // Find the product by WooCommerce ID
    const product = await prisma.product.findFirst({
      where: { wooId: wooId }
    })

    if (!product) {
      console.log('ℹ️ No local product found for WooCommerce ID:', wooId)
      console.log('ℹ️ Will update product in WooCommerce using WooCommerce ID:', wooId)
    } else {
      console.log('✅ Found existing product:', { id: product.id, wooId })
    }

    // Parse the request body
    let updateData

    try {
      updateData = await request.json()
      console.log('📝 Update data received:', JSON.stringify(updateData, null, 2))
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)

      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: 'Could not parse JSON data',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate product data
    if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
      console.error('Invalid product data received:', updateData)

      return NextResponse.json(
        {
          error: 'Invalid product data',
          details: 'Expected a non-empty object with product properties',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    console.log(`🔄 Updating product ${wooId} in WooCommerce...`)

    // Prepare product data for WooCommerce
    const wooCommerceData: any = {
      ...updateData,

      // Only include price fields if explicitly provided
      regular_price: updateData.regular_price !== undefined ? String(updateData.regular_price) : undefined,
      sale_price:
        updateData.sale_price !== undefined && updateData.sale_price !== '' ? String(updateData.sale_price) : undefined,
      price: updateData.regular_price !== undefined ? String(updateData.regular_price) : undefined,

      // Remove any non-WooCommerce fields
      regularPrice: undefined,
      salePrice: undefined
    }

    // Strip undefined keys to avoid overwriting existing values
    Object.keys(wooCommerceData).forEach(k => wooCommerceData[k] === undefined && delete wooCommerceData[k])

    console.log('📊 Sending to WooCommerce:', JSON.stringify(wooCommerceData, null, 2))

    // Update the product in WooCommerce
    const updatedProduct = await wooService.updateProduct(wooId, wooCommerceData)

    if (!updatedProduct) {
      throw new Error('Failed to update product in WooCommerce')
    }

    // Prepare product data for database update
    const dbProductData = {
      wooId: updatedProduct.id,
      name: updatedProduct.name,
      slug: updatedProduct.slug || `product-${updatedProduct.id}`,
      sku: updatedProduct.sku || '',
      status: (updatedProduct.status || 'publish') as 'draft' | 'pending' | 'private' | 'publish',
      price: updatedProduct.price || '0',
      regularPrice: updatedProduct.regular_price || '0',
      salePrice: updatedProduct.sale_price || '0',
      stockStatus: (updatedProduct.stock_status || 'instock') as 'instock' | 'outofstock' | 'onbackorder',
      stockQuantity: updatedProduct.stock_quantity || 0,
      image: updatedProduct.images?.[0]?.src || null,
      images: JSON.stringify(updatedProduct.images || []),
      categories: JSON.stringify(updatedProduct.categories || []),
      description: updatedProduct.description || '',
      shortDescription: updatedProduct.short_description || '',
      rating:
        typeof updatedProduct.average_rating === 'string'
          ? parseFloat(updatedProduct.average_rating) || 0
          : Number(updatedProduct.average_rating) || 0,
      ratingCount:
        typeof updatedProduct.rating_count === 'string'
          ? parseInt(updatedProduct.rating_count, 10) || 0
          : Number(updatedProduct.rating_count) || 0,
      syncedAt: new Date()
    }

    // Save or update the product in our database
    try {
      if (product) {
        // Update existing product
        await prisma.product.update({
          where: { id: product.id },
          data: dbProductData
        })
        console.log(`✅ Updated existing product in database: ${product.id}`)
      } else {
        // Create new product
        await prisma.product.create({
          data: {
            ...dbProductData,
            id: `woo-${wooId}` // Generate a consistent ID for new products
          }
        })
        console.log(`✅ Created new product in database: woo-${wooId}`)
      }

      console.log(`💾 Successfully updated product ${wooId} in both WooCommerce and local database`)

      return NextResponse.json({
        success: true,
        product: updatedProduct
      })
    } catch (dbError) {
      console.error('❌ Database error:', dbError)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update product in local database',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'

    console.error('❌ Error in product update API:', errorMessage, {
      error: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
