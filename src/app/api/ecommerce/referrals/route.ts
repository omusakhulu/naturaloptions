import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const referrals = await prisma.referral.findMany({
      orderBy: { date: 'desc' },
      take: limit
    })

    return NextResponse.json({ success: true, referrals })
  } catch (error: any) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch referrals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user, email, avatar, referredUser, status, value } = body

    const referral = await prisma.referral.create({
      data: {
        user,
        email,
        avatar,
        referredUser,
        status: status || 'Pending',
        value: parseFloat(value?.toString() || '0'),
        date: new Date()
      }
    })

    return NextResponse.json({ success: true, referral })
  } catch (error: any) {
    console.error('Error creating referral:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to create referral' }, { status: 500 })
  }
}
