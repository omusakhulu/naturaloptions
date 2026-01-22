import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

interface BOQItem {
  itemNo: string
  description: string
  unit: string
  quantity: number
  cost: number
  rate: number
  amount: number
  costAmount: number
  remarks?: string
}

interface BOQSection {
  sectionNo: string
  sectionTitle: string
  items: BOQItem[]
  subtotal: number
  costSubtotal: number
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params

    console.log('Project BOQ Generation Request:', { projectId })

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 })
    }

    // Fetch the project from database
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

    if (project.orderId) {
      order = await prisma.order.findUnique({
        where: { id: String(project.orderId) }
      })
    }

    // Generate BOQ number
    const currentYear = new Date().getFullYear()

    const existingBOQs = await prisma.bOQ.findMany({
      where: {
        boqNumber: {
          startsWith: `BOQ-${currentYear}-`
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    let nextNumber = 1

    if (existingBOQs.length > 0) {
      const lastNumber = parseInt(existingBOQs[0].boqNumber.split('-')[2])

      nextNumber = lastNumber + 1
    }

    const boqNumber = `BOQ-${currentYear}-${String(nextNumber).padStart(5, '0')}`

    // Create BOQ sections from project data
    const sections: BOQSection[] = []
    let itemCounter = 1

    // 1. PROJECT LABOR SECTION
    if (project.crewDetails && project.crewDetails.length > 0) {
      const items: BOQItem[] = project.crewDetails.map(crew => {
        const qty = crew.numberOfCrew * crew.shiftsNeeded
        const rate = crew.fare
        const cost = rate * 0.8 // Default 80% cost for labor

        return {
          itemNo: `1.${itemCounter++}`,
          description: `${crew.workType} - ${crew.numberOfCrew} crew x ${crew.shiftsNeeded} shifts`,
          unit: 'Shift',
          quantity: qty,
          cost: cost,
          rate: rate,
          amount: qty * rate,
          costAmount: qty * cost,
          remarks: crew.accommodation ? `Accommodation: ${crew.accommodation}` : ''
        }
      })

      sections.push({
        sectionNo: '1',
        sectionTitle: 'LABOR & CREW',
        items,
        subtotal: items.reduce((sum, item) => sum + item.amount, 0),
        costSubtotal: items.reduce((sum, item) => sum + item.costAmount, 0)
      })

      itemCounter = 1 // Reset for next section
    }

    // 2. TRANSPORTATION SECTION
    if (project.transport && project.transport.length > 0) {
      const items: BOQItem[] = project.transport.map((trans: any) => {
        const qty = trans.numberOfTrips
        const rate = trans.pricePerTrip
        const cost = rate * 0.85 // Default 85% cost for transport

        return {
          itemNo: `2.${itemCounter++}`,
          description: `${trans.vehicleType} - ${trans.numberOfTrips} trip(s)`,
          unit: 'Trip',
          quantity: qty,
          cost: cost,
          rate: rate,
          amount: qty * rate,
          costAmount: qty * cost,
          remarks: trans.contingency ? `Contingency: KES ${trans.contingency}` : ''
        }
      })

      sections.push({
        sectionNo: '2',
        sectionTitle: 'TRANSPORTATION',
        items,
        subtotal: items.reduce((sum, item) => sum + item.amount, 0),
        costSubtotal: items.reduce((sum, item) => sum + item.costAmount, 0)
      })

      itemCounter = 1
    }

    // 3. MATERIALS & EQUIPMENT SECTION (if from order)
    if (order && order.lineItems) {
      const orderItems = typeof order.lineItems === 'string' ? JSON.parse(order.lineItems) : order.lineItems

      if (orderItems && orderItems.length > 0) {
        const items: BOQItem[] = orderItems.map((item: any) => {
          const qty = item.quantity || 1
          const rate = parseFloat(item.price || 0)
          const cost = rate * 0.7 // Default 70% cost for materials

          return {
            itemNo: `3.${itemCounter++}`,
            description: item.name || 'Item',
            unit: 'No',
            quantity: qty,
            cost: cost,
            rate: rate,
            amount: qty * rate,
            costAmount: qty * cost,
            remarks: ''
          }
        })

        sections.push({
          sectionNo: '3',
          sectionTitle: 'MATERIALS & EQUIPMENT',
          items,
          subtotal: items.reduce((sum, item) => sum + item.amount, 0),
          costSubtotal: items.reduce((sum, item) => sum + item.costAmount, 0)
        })
      }
    }

    // Calculate totals
    const subtotal = sections.reduce((sum, section) => sum + section.subtotal, 0)
    const vat = subtotal * 0.16
    const total = subtotal + vat

    // Calculate internal costs and profit
    const internalCost = sections.reduce((sum, section) => sum + section.costSubtotal, 0)
    const profitAmount = total - internalCost
    const profitMargin = total > 0 ? ((profitAmount / total) * 100).toFixed(2) : '0'

    // Create BOQ in database
    const boq = await prisma.bOQ.create({
      data: {
        boqNumber,
        projectId: project.id,
        projectName: project.name,
        projectLocation: order?.shippingAddress || 'TBD',
        clientName: (() => {
          try {
            const customer = order?.customer ? JSON.parse(order.customer) : null

            return customer?.name || customer?.first_name || 'Project Client'
          } catch {
            return 'Project Client'
          }
        })(),
        clientEmail: (() => {
          try {
            const customer = order?.customer ? JSON.parse(order.customer) : null

            return customer?.email || ''
          } catch {
            return ''
          }
        })(),
        clientPhone: (() => {
          try {
            const billing = order?.billingAddress ? JSON.parse(order.billingAddress) : null

            return billing?.phone || ''
          } catch {
            return ''
          }
        })(),
        eventDate: order?.dateCreated || null,
        duration: 1,
        sections: JSON.stringify(sections),
        subtotal: subtotal.toString(),
        vat: vat.toString(),
        total: total.toString(),
        internalCost: internalCost.toString(),
        profitAmount: profitAmount.toString(),
        profitMargin: profitMargin,
        status: 'draft',
        remarks: `Generated from Project: ${project.name}`,
        validityDays: 30
      }
    })

    return NextResponse.json({
      success: true,
      boq: {
        id: boq.id,
        boqNumber,
        projectName: boq.projectName,
        sections,
        subtotal,
        vat,
        total,
        profitMargin
      },
      message: `BOQ ${boqNumber} generated successfully`
    })
  } catch (error: any) {
    console.error('Error generating project BOQ:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate BOQ'
      },
      { status: 500 }
    )
  }
}
