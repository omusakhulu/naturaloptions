import { NextRequest, NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const reportId = parseInt(id)

    if (isNaN(reportId)) {
      return NextResponse.json({ success: false, error: 'Invalid Report ID' }, { status: 400 })
    }

    const costReport = await prisma.projectCostReport.findUnique({
      where: { id: reportId }
    })

    if (!costReport) {
      return NextResponse.json({ success: false, error: 'Cost report not found' }, { status: 404 })
    }

    // Parse JSON fields
    const report = {
      ...costReport,
      laborCosts: costReport.laborCosts ? JSON.parse(costReport.laborCosts) : null,
      materialCosts: costReport.materialCosts ? JSON.parse(costReport.materialCosts) : null,
      equipmentCosts: costReport.equipmentCosts ? JSON.parse(costReport.equipmentCosts) : null,
      transportCosts: costReport.transportCosts ? JSON.parse(costReport.transportCosts) : null,
      overheadCosts: costReport.overheadCosts ? JSON.parse(costReport.overheadCosts) : null,
      otherCosts: costReport.otherCosts ? JSON.parse(costReport.otherCosts) : null
    }

    return NextResponse.json({
      success: true,
      costReport: report
    })
  } catch (error) {
    console.error('Error fetching cost report:', error)

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to fetch cost report'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const reportId = parseInt(id)
    const data = await request.json()

    if (isNaN(reportId)) {
      return NextResponse.json({ success: false, error: 'Invalid Report ID' }, { status: 400 })
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date()
    }

    if (data.status !== undefined) updateData.status = data.status
    if (data.remarks !== undefined) updateData.remarks = data.remarks
    if (data.startDate !== undefined) updateData.startDate = data.startDate
    if (data.endDate !== undefined) updateData.endDate = data.endDate

    // Update cost fields if provided
    if (
      data.actualLaborCost !== undefined ||
      data.actualTransportCost !== undefined ||
      data.actualMaterialCost !== undefined ||
      data.actualEquipmentCost !== undefined ||
      data.actualOverheadCost !== undefined ||
      data.actualOtherCost !== undefined
    ) {
      // Recalculate totals
      const actualCost =
        parseFloat(data.actualLaborCost || '0') +
        parseFloat(data.actualTransportCost || '0') +
        parseFloat(data.actualMaterialCost || '0') +
        parseFloat(data.actualEquipmentCost || '0') +
        parseFloat(data.actualOverheadCost || '0') +
        parseFloat(data.actualOtherCost || '0')

      updateData.actualCost = actualCost.toString()

      // Recalculate variance and profit
      if (data.estimatedCost) {
        const variance = actualCost - parseFloat(data.estimatedCost)

        const variancePercent =
          parseFloat(data.estimatedCost) > 0 ? ((variance / parseFloat(data.estimatedCost)) * 100).toFixed(2) : '0'

        updateData.variance = variance.toString()
        updateData.variancePercent = variancePercent
      }

      if (data.revenue) {
        const profit = parseFloat(data.revenue) - actualCost

        const profitMargin = parseFloat(data.revenue) > 0 ? ((profit / parseFloat(data.revenue)) * 100).toFixed(2) : '0'

        updateData.profit = profit.toString()
        updateData.profitMargin = profitMargin
      }
    }

    const costReport = await prisma.projectCostReport.update({
      where: { id: reportId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      costReport
    })
  } catch (error) {
    console.error('Error updating cost report:', error)

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to update cost report'
      },
      { status: 500 }
    )
  }
}
