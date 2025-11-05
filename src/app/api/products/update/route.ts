import { NextRequest, NextResponse } from 'next/server'

import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'

import { saveProduct } from '@/lib/db/products'

export async function PUT(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.WOO_STORE_URL || !process.env.WOO_CONSUMER_KEY || !process.env.WOO_CONSUMER_SECRET) {
      return NextResponse.json({ error: 'Missing required WooCommerce API credentials' }, { status: 500 })
    }

    // Parse the request body
    const productData = await request.json()

    if (!productData.id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Initialize WooCommerce REST API client
    const wooApi = new WooCommerceRestApi({
      url: process.env.WOO_STORE_URL,
      consumerKey: process.env.WOO_CONSUMER_KEY,
      consumerSecret: process.env.WOO_CONSUMER_SECRET,
      version: 'wc/v3',
      queryStringAuth: true,
      timeout: 30000,
      axiosConfig: {
        family: 4,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      }
    })

    console.log(`🔄 Updating product ${productData.id} in WooCommerce...`)

    // Update the product in WooCommerce
    const { data: updatedProduct } = await wooApi.put(`products/${productData.id}`, productData)

    if (!updatedProduct) {
      throw new Error('Failed to update product in WooCommerce')
    }

    console.log(`✅ Successfully updated product ${productData.id} in WooCommerce`)

    // Update the local database
    await saveProduct(updatedProduct)
    console.log(`💾 Updated product ${productData.id} in local database`)

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    })
  } catch (error) {
    console.error('Error updating product:', error)

    return NextResponse.json(
      {
        error: 'Failed to update product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
