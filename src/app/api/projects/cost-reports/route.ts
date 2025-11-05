import { NextRequest, NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { reportNumber: { contains: search, mode: 'insensitive' } },
        { projectName: { contains: search, mode: 'insensitive' } }
      ]
    }

    const costReports = await prisma.projectCostReport.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Parse JSON fields and calculate summary
    const reports = costReports.map(report => {
      const parseLaborCosts = report.laborCosts ? JSON.parse(report.laborCosts) : null
      const parseTransportCosts = report.transportCosts ? JSON.parse(report.transportCosts) : null

      return {
        ...report,
        laborCosts: parseLaborCosts,
        transportCosts: parseTransportCosts,
        materialCosts: report.materialCosts ? JSON.parse(report.materialCosts) : null,
        equipmentCosts: report.equipmentCosts ? JSON.parse(report.equipmentCosts) : null,
        overheadCosts: report.overheadCosts ? JSON.parse(report.overheadCosts) : null,
        otherCosts: report.otherCosts ? JSON.parse(report.otherCosts) : null
      }
    })

    // Calculate summary statistics
    const totalRevenue = reports.reduce((sum, r) => sum + parseFloat(r.revenue || '0'), 0)
    const totalProfit = reports.reduce((sum, r) => sum + parseFloat(r.profit || '0'), 0)

    const avgProfitMargin =
      reports.length > 0 ? reports.reduce((sum, r) => sum + parseFloat(r.profitMargin || '0'), 0) / reports.length : 0

    return NextResponse.json({
      success: true,
      costReports: reports,
      summary: {
        total: reports.length,
        totalRevenue,
        totalProfit,
        avgProfitMargin: avgProfitMargin.toFixed(2)
      }
    })
  } catch (error: any) {
    console.error('Error fetching cost reports:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch cost reports'
      },
      { status: 500 }
    )
  }
}
