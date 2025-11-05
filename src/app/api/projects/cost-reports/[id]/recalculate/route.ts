import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const reportId = parseInt(id)

    if (isNaN(reportId)) {
      return NextResponse.json({ success: false, error: 'Invalid Report ID' }, { status: 400 })
    }

    // Fetch the existing cost report
    const existingReport = await prisma.projectCostReport.findUnique({
      where: { id: reportId }
    })

    if (!existingReport) {
      return NextResponse.json({ success: false, error: 'Cost report not found' }, { status: 404 })
    }

    // Fetch the project
    const project = await prisma.project.findUnique({
      where: { id: existingReport.projectId },
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
        where: { wooId: project.orderId }
      })
      revenue = parseFloat(order?.total || '0')
    }

    // Calculate estimated costs from project data
    console.log('Project crew details:', project.crewDetails)
    console.log('Project transport:', project.transport)

    const estimatedLaborCost = project.crewDetails.reduce((sum, crew) => {
      const cost = crew.numberOfCrew * crew.shiftsNeeded * crew.fare
      console.log(`Labor: ${crew.numberOfCrew} crew x ${crew.shiftsNeeded} shifts x ${crew.fare} = ${cost}`)
      return sum + cost
    }, 0)

    const estimatedTransportCost = project.transport.reduce((sum, trans) => {
      const cost = trans.numberOfTrips * trans.pricePerTrip
      console.log(`Transport: ${trans.numberOfTrips} trips x ${trans.pricePerTrip} = ${cost}`)
      return sum + cost
    }, 0)

    console.log('Estimated labor cost:', estimatedLaborCost)
    console.log('Estimated transport cost:', estimatedTransportCost)

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

    const estimatedEquipmentCost = 0
    const estimatedOverheadCost = 0
    const estimatedOtherCost = 0

    // Get actual costs from existing report or use estimates
    const existingLaborCosts = existingReport.laborCosts ? JSON.parse(existingReport.laborCosts) : null
    const existingTransportCosts = existingReport.transportCosts ? JSON.parse(existingReport.transportCosts) : null
    const existingMaterialCosts = existingReport.materialCosts ? JSON.parse(existingReport.materialCosts) : null
    const existingEquipmentCosts = existingReport.equipmentCosts ? JSON.parse(existingReport.equipmentCosts) : null
    const existingOverheadCosts = existingReport.overheadCosts ? JSON.parse(existingReport.overheadCosts) : null
    const existingOtherCosts = existingReport.otherCosts ? JSON.parse(existingReport.otherCosts) : null

    // Use existing actual costs if they were manually entered, otherwise use new estimates
    // Always default to 0 to prevent NaN
    const actualLaborCost = typeof existingLaborCosts?.actual === 'number' 
      ? existingLaborCosts.actual 
      : estimatedLaborCost || 0
    
    const actualTransportCost = typeof existingTransportCosts?.actual === 'number' 
      ? existingTransportCosts.actual 
      : estimatedTransportCost || 0
    
    const actualMaterialCost = typeof existingMaterialCosts?.actual === 'number' 
      ? existingMaterialCosts.actual 
      : estimatedMaterialCost || 0
    
    const actualEquipmentCost = typeof existingEquipmentCosts?.actual === 'number' 
      ? existingEquipmentCosts.actual 
      : estimatedEquipmentCost || 0
    
    const actualOverheadCost = typeof existingOverheadCosts?.actual === 'number' 
      ? existingOverheadCosts.actual 
      : estimatedOverheadCost || 0
    
    const actualOtherCost = typeof existingOtherCosts?.actual === 'number' 
      ? existingOtherCosts.actual 
      : estimatedOtherCost || 0

    // Calculate totals - include ALL cost categories, ensure no NaN
    const estimatedCost =
      (estimatedLaborCost || 0) +
      (estimatedTransportCost || 0) +
      (estimatedMaterialCost || 0) +
      (estimatedEquipmentCost || 0) +
      (estimatedOverheadCost || 0) +
      (estimatedOtherCost || 0)

    const actualCost =
      (actualLaborCost || 0) + 
      (actualTransportCost || 0) + 
      (actualMaterialCost || 0) + 
      (actualEquipmentCost || 0) + 
      (actualOverheadCost || 0) + 
      (actualOtherCost || 0)

    const variance = actualCost - estimatedCost
    const variancePercent = estimatedCost > 0 ? ((variance / estimatedCost) * 100).toFixed(2) : '0'
    const profit = revenue - actualCost
    const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : '0'

    // Update cost breakdowns - ensure all values are numbers (no null/undefined)
    const laborCosts = JSON.stringify({
      estimated: estimatedLaborCost || 0,
      actual: actualLaborCost || 0,
      variance: (actualLaborCost || 0) - (estimatedLaborCost || 0)
    })

    const transportCosts = JSON.stringify({
      estimated: estimatedTransportCost || 0,
      actual: actualTransportCost || 0,
      variance: (actualTransportCost || 0) - (estimatedTransportCost || 0)
    })

    const materialCosts = JSON.stringify({
      estimated: estimatedMaterialCost || 0,
      actual: actualMaterialCost || 0,
      variance: (actualMaterialCost || 0) - (estimatedMaterialCost || 0)
    })

    const equipmentCosts = JSON.stringify({
      estimated: estimatedEquipmentCost || 0,
      actual: actualEquipmentCost || 0,
      variance: (actualEquipmentCost || 0) - (estimatedEquipmentCost || 0)
    })

    const overheadCosts = JSON.stringify({
      estimated: estimatedOverheadCost || 0,
      actual: actualOverheadCost || 0,
      variance: (actualOverheadCost || 0) - (estimatedOverheadCost || 0)
    })

    const otherCosts = JSON.stringify({
      estimated: estimatedOtherCost || 0,
      actual: actualOtherCost || 0,
      variance: (actualOtherCost || 0) - (estimatedOtherCost || 0)
    })

    // Update the cost report
    const updatedReport = await prisma.projectCostReport.update({
      where: { id: reportId },
      data: {
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
        updatedAt: new Date()
      }
    })

    // Parse JSON fields before returning
    const parsedReport = {
      ...updatedReport,
      laborCosts: updatedReport.laborCosts ? JSON.parse(updatedReport.laborCosts) : null,
      materialCosts: updatedReport.materialCosts ? JSON.parse(updatedReport.materialCosts) : null,
      equipmentCosts: updatedReport.equipmentCosts ? JSON.parse(updatedReport.equipmentCosts) : null,
      transportCosts: updatedReport.transportCosts ? JSON.parse(updatedReport.transportCosts) : null,
      overheadCosts: updatedReport.overheadCosts ? JSON.parse(updatedReport.overheadCosts) : null,
      otherCosts: updatedReport.otherCosts ? JSON.parse(updatedReport.otherCosts) : null
    }

    return NextResponse.json({
      success: true,
      costReport: parsedReport,
      message: 'Cost report recalculated successfully'
    })
  } catch (error: any) {
    console.error('Error recalculating cost report:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to recalculate cost report'
      },
      { status: 500 }
    )
  }
}
