import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params
    const body = await request.json()

    console.log('Project Cost Report Generation:', { projectId })

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 })
    }

    // Fetch the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        crewDetails: true,
        transport: true
      }
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Get linked order if exists
    let order = null
    let revenue = 0

    if (project.orderId) {
      order = await prisma.order.findUnique({
        where: { id: String(project.orderId) }
      })
      revenue = parseFloat(order?.total || '0')
    }

    // Generate report number
    const currentYear = new Date().getFullYear()

    const existingReports = await prisma.projectCostReport.findMany({
      where: {
        reportNumber: {
          startsWith: `CR-${currentYear}-`
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    let nextNumber = 1

    if (existingReports.length > 0) {
      const lastNumber = parseInt(existingReports[0].reportNumber.split('-')[2])

      nextNumber = lastNumber + 1
    }

    const reportNumber = `CR-${currentYear}-${String(nextNumber).padStart(5, '0')}`

    // Calculate estimated costs from project data
    const estimatedLaborCost = project.crewDetails.reduce((sum, crew) => {
      return sum + crew.numberOfCrew * crew.shiftsNeeded * crew.fare
    }, 0)

    const estimatedTransportCost = project.transport.reduce((sum, trans) => {
      return sum + trans.numberOfTrips * trans.pricePerTrip
    }, 0)

    // Estimate material costs from order if linked
    let estimatedMaterialCost = 0

    if (order && order.lineItems) {
      const orderItems = typeof order.lineItems === 'string' ? JSON.parse(order.lineItems) : order.lineItems

      if (orderItems && orderItems.length > 0) {
        estimatedMaterialCost = orderItems.reduce((sum: number, item: any) => {
          const qty = item.quantity || 1
          const price = parseFloat(item.price || 0)

          return sum + qty * price
        }, 0)
      }
    }

    const estimatedEquipmentCost = 0 // Can be set from project data if available
    const estimatedOverheadCost = 0 // Can be calculated as % of other costs if needed
    const estimatedOtherCost = 0

    // Get actual costs from body (if provided) or use estimates as defaults
    const actualLaborCost = body.actualLaborCost !== undefined ? parseFloat(body.actualLaborCost) : estimatedLaborCost

    const actualTransportCost =
      body.actualTransportCost !== undefined ? parseFloat(body.actualTransportCost) : estimatedTransportCost

    const actualMaterialCost =
      body.actualMaterialCost !== undefined ? parseFloat(body.actualMaterialCost) : estimatedMaterialCost

    const actualEquipmentCost =
      body.actualEquipmentCost !== undefined ? parseFloat(body.actualEquipmentCost) : estimatedEquipmentCost

    const actualOverheadCost =
      body.actualOverheadCost !== undefined ? parseFloat(body.actualOverheadCost) : estimatedOverheadCost

    const actualOtherCost = body.actualOtherCost !== undefined ? parseFloat(body.actualOtherCost) : estimatedOtherCost

    // Calculate totals - include ALL cost categories
    const estimatedCost =
      estimatedLaborCost +
      estimatedTransportCost +
      estimatedMaterialCost +
      estimatedEquipmentCost +
      estimatedOverheadCost +
      estimatedOtherCost

    const actualCost =
      actualLaborCost +
      actualTransportCost +
      actualMaterialCost +
      actualEquipmentCost +
      actualOverheadCost +
      actualOtherCost

    const variance = actualCost - estimatedCost
    const variancePercent = estimatedCost > 0 ? ((variance / estimatedCost) * 100).toFixed(2) : '0'
    const profit = revenue - actualCost
    const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : '0'

    // Cost breakdowns
    const laborCosts = JSON.stringify({
      estimated: estimatedLaborCost,
      actual: actualLaborCost,
      variance: actualLaborCost - estimatedLaborCost
    })

    const transportCosts = JSON.stringify({
      estimated: estimatedTransportCost,
      actual: actualTransportCost,
      variance: actualTransportCost - estimatedTransportCost
    })

    const materialCosts = JSON.stringify({
      estimated: estimatedMaterialCost,
      actual: actualMaterialCost,
      variance: actualMaterialCost - estimatedMaterialCost
    })

    const equipmentCosts = JSON.stringify({
      estimated: estimatedEquipmentCost,
      actual: actualEquipmentCost,
      variance: actualEquipmentCost - estimatedEquipmentCost
    })

    const overheadCosts = JSON.stringify({
      estimated: estimatedOverheadCost,
      actual: actualOverheadCost,
      variance: actualOverheadCost - estimatedOverheadCost
    })

    const otherCosts = JSON.stringify({
      estimated: estimatedOtherCost,
      actual: actualOtherCost,
      variance: actualOtherCost - estimatedOtherCost
    })

    // Create cost report
    const costReport = await prisma.projectCostReport.create({
      data: {
        reportNumber,
        projectId: project.id,
        projectName: project.name,
        estimatedCost: estimatedCost.toString(),
        actualCost: actualCost.toString(),
        variance: variance.toString(),
        variancePercent: variancePercent,
        revenue: revenue.toString(),
        profit: profit.toString(),
        profitMargin: profitMargin,
        laborCosts,
        materialCosts,
        equipmentCosts,
        transportCosts,
        overheadCosts,
        otherCosts,
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        status: body.status || 'draft',
        remarks: body.remarks || `Generated for Project: ${project.name}`,
        generatedBy: body.generatedBy || null
      }
    })

    return NextResponse.json({
      success: true,
      costReport: {
        id: costReport.id,
        reportNumber,
        projectName: costReport.projectName,
        estimatedCost,
        actualCost,
        variance,
        variancePercent,
        revenue,
        profit,
        profitMargin
      },
      message: `Cost Report ${reportNumber} generated successfully`
    })
  } catch (error: any) {
    console.error('Error generating cost report:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate cost report'
      },
      { status: 500 }
    )
  }
}
