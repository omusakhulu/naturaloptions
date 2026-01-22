import { NextResponse } from 'next/server'

import { addTransport, getTransportByProjectId } from '@/lib/db/projects'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const transport = await getTransportByProjectId(id)

    return NextResponse.json({ success: true, transport })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transport details' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params
    const body = await req.json()
    const { vehicleType, numberOfTrips, pricePerTrip, contingency } = body

    if (!vehicleType || !numberOfTrips || pricePerTrip === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const transport = await addTransport({
      projectId,
      vehicleType,
      numberOfTrips: parseInt(numberOfTrips),
      pricePerTrip: parseFloat(pricePerTrip),
      contingency: contingency ? parseFloat(contingency) : 0
    })

    return NextResponse.json({ success: true, transport }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to add transport' }, { status: 500 })
  }
}
