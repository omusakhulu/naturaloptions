import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import { prisma } from '@/lib/prisma'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (productId) where.productId = parseInt(productId)

    // Try fetching from local DB first
    const reviews = await prisma.productReview.findMany({
      where,
      orderBy: { dateCreated: 'desc' },
      take: limit
    })

    if (reviews.length > 0) {
      return NextResponse.json({ success: true, reviews })
    }

    // Fallback: Fetch from WooCommerce if local DB is empty
    const woo = WooCommerceService.getInstance()
    const wooReviews = await woo.listReviews({ per_page: limit })

    // Sync to local DB
    for (const review of wooReviews) {
      await prisma.productReview.upsert({
        where: { wooId: review.id },
        update: {
          productId: review.product_id,
          productName: review.product_name || '',
          reviewer: review.reviewer,
          email: review.reviewer_email,
          avatar: review.reviewer_avatar_urls?.['96'] || null,
          rating: review.rating,
          status: review.status,
          content: review.review,
          dateCreated: new Date(review.date_created)
        },
        create: {
          wooId: review.id,
          productId: review.product_id,
          productName: review.product_name || '',
          reviewer: review.reviewer,
          email: review.reviewer_email,
          avatar: review.reviewer_avatar_urls?.['96'] || null,
          rating: review.rating,
          status: review.status,
          content: review.review,
          dateCreated: new Date(review.date_created)
        }
      })
    }

    const updatedReviews = await prisma.productReview.findMany({
      where,
      orderBy: { dateCreated: 'desc' },
      take: limit
    })

    return NextResponse.json({ success: true, reviews: updatedReviews })
  } catch (error: any) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const woo = WooCommerceService.getInstance()

    // 1. Create in WooCommerce
    const wooReview = await woo.createReview(body)

    // 2. Save to local DB
    const review = await prisma.productReview.create({
      data: {
        wooId: wooReview.id,
        productId: wooReview.product_id,
        productName: wooReview.product_name || '',
        reviewer: wooReview.reviewer,
        email: wooReview.reviewer_email,
        avatar: wooReview.reviewer_avatar_urls?.['96'] || null,
        rating: wooReview.rating,
        status: wooReview.status,
        content: wooReview.review,
        dateCreated: new Date(wooReview.date_created)
      }
    })

    return NextResponse.json({ success: true, review })
  } catch (error: any) {
    console.error('Error creating review:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to create review' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    const woo = WooCommerceService.getInstance()

    if (!id) return NextResponse.json({ success: false, error: 'Review ID required' }, { status: 400 })

    const localReview = await prisma.productReview.findUnique({ where: { id } })
    if (!localReview) return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })

    // 1. Update in WooCommerce
    const wooUpdated = await woo.updateReview(localReview.wooId, updateData)

    // 2. Update local DB
    const updatedReview = await prisma.productReview.update({
      where: { id },
      data: {
        rating: wooUpdated.rating,
        status: wooUpdated.status,
        content: wooUpdated.review,
        syncedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, review: updatedReview })
  } catch (error: any) {
    console.error('Error updating review:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to update review' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const woo = WooCommerceService.getInstance()

    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

    const localReview = await prisma.productReview.findUnique({ where: { id } })
    if (!localReview) return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })

    // 1. Delete in WooCommerce
    await woo.deleteReview(localReview.wooId)

    // 2. Delete from local DB
    await prisma.productReview.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete review' }, { status: 500 })
  }
}
