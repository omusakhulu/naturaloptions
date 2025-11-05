import { NextRequest, NextResponse } from 'next/server'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    const wooService = WooCommerceService.getInstance()

    // Get the current product data from WooCommerce
    const product = await wooService.getProduct(Number(id))

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // If regular price is set but price is 0 or empty, set price = regular_price
    const updateData: any = {}
    
    if (product.regular_price && (!product.price || product.price === '0' || product.price === '0.00')) {
      updateData.price = product.regular_price
      updateData.sale_price = ''
      updateData.on_sale = false
      
      // Update the product in WooCommerce
      const updatedProduct = await wooService.updateProduct(Number(id), {
        regular_price: product.regular_price,
        sale_price: '',
        on_sale: false
      })

      return NextResponse.json({
        success: true,
        message: 'Price synced successfully',
        data: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          regular_price: updatedProduct.regular_price,
          price: updatedProduct.price,
          sale_price: updatedProduct.sale_price,
          on_sale: updatedProduct.on_sale
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'No price sync needed',
      data: {
        id: product.id,
        name: product.name,
        regular_price: product.regular_price,
        price: product.price,
        sale_price: product.sale_price,
        on_sale: product.on_sale
      }
    })
  } catch (error: any) {
    console.error('Error syncing product price:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to sync product price',
        details: error.response?.data || {}
      },
      { status: error.status || 500 }
    )
  }
}
