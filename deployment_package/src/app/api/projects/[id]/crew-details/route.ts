import { NextResponse } from 'next/server'

import { addCrewDetail, getCrewDetailsByProjectId } from '@/lib/db/projects'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const crewDetails = await getCrewDetailsByProjectId(id)

    return NextResponse.json({ success: true, crewDetails })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch crew details' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params
    const body = await req.json()
    const { workType, numberOfCrew, shiftsNeeded, fare, accommodation } = body

    if (!workType || !numberOfCrew || !shiftsNeeded || fare === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const crewDetail = await addCrewDetail({
      projectId,
      workType,
      numberOfCrew: parseInt(numberOfCrew),
      shiftsNeeded: parseInt(shiftsNeeded),
      fare: parseFloat(fare),
      accommodation
    })

    return NextResponse.json({ success: true, crewDetail }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to add crew detail' }, { status: 500 })
  }
}
