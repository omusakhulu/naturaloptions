import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const units = [
      { id: 1, name: 'Piece', shortName: 'pc', description: 'Individual piece' },
      { id: 2, name: 'Kilogram', shortName: 'kg', description: 'Weight in kilograms' },
      { id: 3, name: 'Gram', shortName: 'g', description: 'Weight in grams' },
      { id: 4, name: 'Liter', shortName: 'L', description: 'Volume in liters' },
      { id: 5, name: 'Milliliter', shortName: 'ml', description: 'Volume in milliliters' },
      { id: 6, name: 'Meter', shortName: 'm', description: 'Length in meters' },
      { id: 7, name: 'Centimeter', shortName: 'cm', description: 'Length in centimeters' },
      { id: 8, name: 'Box', shortName: 'box', description: 'Boxed items' },
      { id: 9, name: 'Pack', shortName: 'pack', description: 'Packed items' },
      { id: 10, name: 'Dozen', shortName: 'doz', description: 'Set of 12 items' }
    ]

    return NextResponse.json(units)
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json(
      { error: 'Failed to fetch units', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, shortName, description } = body

    if (!name || !shortName) {
      return NextResponse.json(
        { error: 'Unit name and short name are required' },
        { status: 400 }
      )
    }

    const newUnit = {
      id: Date.now(),
      name,
      shortName,
      description: description || ''
    }

    return NextResponse.json(newUnit)
  } catch (error) {
    console.error('Error creating unit:', error)
    return NextResponse.json(
      { error: 'Failed to create unit', details: error.message },
      { status: 500 }
    )
  }
}
