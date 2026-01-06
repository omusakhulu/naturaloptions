import { NextResponse } from 'next/server'
import { wooClient } from '@/lib/woocommerce'

export async function GET() {
  try {
    const coupons = await wooClient.get('coupons', {
      params: {
        per_page: 100,
        orderby: 'date',
        order: 'desc'
      }
    })

    return NextResponse.json(coupons || [])
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    
    const couponData = {
      code: data.code,
      discount_type: data.discount_type || 'percent',
      amount: data.amount?.toString() || '0',
      description: data.description || '',
      date_expires: data.date_expires || null,
      individual_use: data.individual_use || false,
      product_ids: data.product_ids || [],
      excluded_product_ids: data.excluded_product_ids || [],
      usage_limit: data.usage_limit || null,
      usage_limit_per_user: data.usage_limit_per_user || null,
      limit_usage_to_x_items: data.limit_usage_to_x_items || null,
      free_shipping: data.free_shipping || false,
      product_categories: data.product_categories || [],
      excluded_product_categories: data.excluded_product_categories || [],
      exclude_sale_items: data.exclude_sale_items || false,
      minimum_amount: data.minimum_amount || '0',
      maximum_amount: data.maximum_amount || '0',
      email_restrictions: data.email_restrictions || []
    }

    const newCoupon = await wooClient.post('coupons', couponData)
    
    return NextResponse.json(newCoupon)
  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to create coupon', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 })
    }

    const couponData = {
      code: updateData.code,
      discount_type: updateData.discount_type,
      amount: updateData.amount?.toString(),
      description: updateData.description,
      date_expires: updateData.date_expires,
      individual_use: updateData.individual_use,
      product_ids: updateData.product_ids,
      excluded_product_ids: updateData.excluded_product_ids,
      usage_limit: updateData.usage_limit,
      usage_limit_per_user: updateData.usage_limit_per_user,
      limit_usage_to_x_items: updateData.limit_usage_to_x_items,
      free_shipping: updateData.free_shipping,
      product_categories: updateData.product_categories,
      excluded_product_categories: updateData.excluded_product_categories,
      exclude_sale_items: updateData.exclude_sale_items,
      minimum_amount: updateData.minimum_amount,
      maximum_amount: updateData.maximum_amount,
      email_restrictions: updateData.email_restrictions
    }

    const updatedCoupon = await wooClient.put(`coupons/${id}`, couponData)
    
    return NextResponse.json(updatedCoupon)
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to update coupon', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 })
    }

    await wooClient.delete(`coupons/${id}`, { params: { force: true } })
    
    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { error: 'Failed to delete coupon', details: error.message },
      { status: 500 }
    )
  }
}
