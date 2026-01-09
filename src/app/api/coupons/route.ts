import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
      const coupon = await prisma.coupon.findUnique({
        where: { code }
      })
      return NextResponse.json({ success: true, coupon })
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { dateCreated: 'desc' }
    })

    return NextResponse.json({ success: true, coupons })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const wooService = WooCommerceService.getInstance()

    // 1. Create in WooCommerce
    const wooCoupon = await wooService.createCoupon(body)

    // 2. Save to local DB (though webhook will also trigger this, doing it here ensures immediate UI update)
    const coupon = await prisma.coupon.create({
      data: {
        wooId: wooCoupon.id,
        code: wooCoupon.code,
        amount: wooCoupon.amount,
        dateCreated: new Date(wooCoupon.date_created),
        dateModified: new Date(wooCoupon.date_modified),
        discountType: wooCoupon.discount_type,
        description: wooCoupon.description || null,
        expiryDate: wooCoupon.date_expires ? new Date(wooCoupon.date_expires) : null,
        usageLimit: wooCoupon.usage_limit || null,
        usageCount: wooCoupon.usage_count || 0,
        individualUse: wooCoupon.individual_use || false,
        productIds: JSON.stringify(wooCoupon.product_ids || []),
        excludeProductIds: JSON.stringify(wooCoupon.excluded_product_ids || [])
      }
    })

    return NextResponse.json({ success: true, coupon })
  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json({ success: false, error: 'Failed to create coupon' }, { status: 500 })
  }
}
