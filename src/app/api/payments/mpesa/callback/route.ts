import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('📩 M-PESA Callback received:', JSON.stringify(body))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('M-PESA callback error:', error?.message || error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
