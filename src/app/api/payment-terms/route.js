import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const paymentTerms = await prisma.paymentTerm.findMany({
      orderBy: { days: 'asc' }
    })

    return NextResponse.json(paymentTerms)
  } catch (error) {
    console.error('Error fetching payment terms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment terms', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    
    const paymentTerm = await prisma.paymentTerm.create({
      data: {
        name: data.name,
        days: parseInt(data.days),
        description: data.description || null
      }
    })

    return NextResponse.json(paymentTerm)
  } catch (error) {
    console.error('Error creating payment term:', error)
    return NextResponse.json(
      { error: 'Failed to create payment term', details: error.message },
      { status: 500 }
    )
  }
}
