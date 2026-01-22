import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

interface BOQItem {
  itemNo: string
  description: string
  unit: string
  quantity: number
  cost: number // Internal cost per unit
  rate: number // Selling price per unit
  amount: number // Total selling price (quantity * rate)
  costAmount: number // Total cost (quantity * cost)
  remarks?: string
}

interface BOQSection {
  sectionNo: string
  sectionTitle: string
  items: BOQItem[]
  subtotal: number
  costSubtotal: number // Total internal cost for this section
}

interface QuoteLineItem {
  description: string
  quantity?: number
  unitPrice?: number
  totalPrice?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const quoteId = body.quoteId

    console.log('BOQ Generation Request:', { quoteId, bodyType: typeof quoteId })

    if (!quoteId) {
      return NextResponse.json({ success: false, error: 'Quote ID is required' }, { status: 400 })
    }

    // Fetch the quote from database (ID is a string/cuid)
    const quote = await prisma.eventTentQuote.findUnique({
      where: { id: String(quoteId) }
    })

    if (!quote) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    }

    // Parse line items
    const lineItems: QuoteLineItem[] = typeof quote.lineItems === 'string' ? JSON.parse(quote.lineItems) : quote.lineItems || []

    // Generate BOQ number
    const boqNumber = `BOQ-${new Date().getFullYear()}-${String(quoteId).padStart(5, '0')}`

    // Categorize line items into sections
    const sections: BOQSection[] = []
    let itemCounter = 1

    // 1. STRUCTURES SECTION
    const structureItems = lineItems.filter(
      (item: QuoteLineItem) =>
        item.description.includes('Garden Cottage') ||
        item.description.includes('Pagoda') ||
        item.description.includes('Rondo') ||
        item.description.includes('Apse')
    )

    if (structureItems.length > 0) {
      const items: BOQItem[] = structureItems.map((item: QuoteLineItem) => {
        const qty = item.quantity || 1
        const rate = item.unitPrice || 0
        const cost = rate * 0.7 // Default 70% cost estimate

        return {
          itemNo: `1.${itemCounter++}`,
          description: item.description,
          unit: 'No',
          quantity: qty,
          cost: cost,
          rate: rate,
          amount: item.totalPrice || 0,
          costAmount: qty * cost,
          remarks: 'Complete with installation'
        }
      })

      sections.push({
        sectionNo: '1',
        sectionTitle: 'EVENT STRUCTURES',
        items,
        subtotal: items.reduce((sum, item) => sum + item.amount, 0),
        costSubtotal: items.reduce((sum, item) => sum + item.costAmount, 0)
      })
    }

    // Reset counter for next section
    itemCounter = 1

    // 2. FLOORING SECTION
    const flooringItems = lineItems.filter((item: QuoteLineItem) => item.description.includes('Flooring'))

    if (flooringItems.length > 0) {
      const items: BOQItem[] = flooringItems.map((item: QuoteLineItem) => {
        const qty = item.quantity || 1
        const rate = item.unitPrice || 0
        const cost = rate * 0.7

        return {
          itemNo: `2.${itemCounter++}`,
          description: item.description,
          unit: 'sqm',
          quantity: qty,
          cost: cost,
          rate: rate,
          amount: item.totalPrice || 0,
          costAmount: qty * cost,
          remarks: 'Supply and installation'
        }
      })

      sections.push({
        sectionNo: '2',
        sectionTitle: 'FLOORING & CARPETING',
        items,
        subtotal: items.reduce((sum, item) => sum + item.amount, 0),
        costSubtotal: items.reduce((sum, item) => sum + item.costAmount, 0)
      })
    }

    // Reset counter
    itemCounter = 1

    // 3. PARTITIONS SECTION
    const partitionItems = lineItems.filter((item: QuoteLineItem) => item.description.includes('Partition'))

    if (partitionItems.length > 0) {
      const items: BOQItem[] = partitionItems.map((item: QuoteLineItem) => {
        const qty = item.quantity || 1
        const rate = item.unitPrice || 0
        const cost = rate * 0.7

        return {
          itemNo: `3.${itemCounter++}`,
          description: item.description,
          unit: 'No',
          quantity: qty,
          cost: cost,
          rate: rate,
          amount: item.totalPrice || 0,
          costAmount: qty * cost,
          remarks: 'With installation'
        }
      })

      sections.push({
        sectionNo: '3',
        sectionTitle: 'INTERNAL PARTITIONS',
        items,
        subtotal: items.reduce((sum, item) => sum + item.amount, 0),
        costSubtotal: items.reduce((sum, item) => sum + item.costAmount, 0)
      })
    }

    // Reset counter
    itemCounter = 1

    // 4. LIGHTING & DRAPERY SECTION
    const decorItems = lineItems.filter(
      (item: QuoteLineItem) => item.description.includes('Lighting') || item.description.includes('Drapery')
    )

    if (decorItems.length > 0) {
      const items: BOQItem[] = decorItems.map((item: QuoteLineItem) => {
        const qty = item.quantity || 1
        const rate = item.unitPrice || 0
        const cost = rate * 0.7

        return {
          itemNo: `4.${itemCounter++}`,
          description: item.description,
          unit: 'No',
          quantity: qty,
          cost: cost,
          rate: rate,
          amount: item.totalPrice || 0,
          costAmount: qty * cost,
          remarks: 'Complete installation'
        }
      })

      sections.push({
        sectionNo: '4',
        sectionTitle: 'LIGHTING & DRAPERY',
        items,
        subtotal: items.reduce((sum, item) => sum + item.amount, 0),
        costSubtotal: items.reduce((sum, item) => sum + item.costAmount, 0)
      })
    }

    // Reset counter
    itemCounter = 1

    // 5. FURNITURE & SETUP SECTION
    const setupItems = lineItems.filter(
      (item: QuoteLineItem) =>
        item.description.includes('Setup') ||
        item.description.includes('Cocktail') ||
        item.description.includes('Theater') ||
        item.description.includes('Banquet') ||
        item.description.includes('Classroom')
    )

    if (setupItems.length > 0) {
      const items: BOQItem[] = setupItems.map((item: QuoteLineItem) => {
        const qty = item.quantity || 1
        const rate = item.unitPrice || 0
        const cost = rate * 0.7

        return {
          itemNo: `5.${itemCounter++}`,
          description: item.description,
          unit: 'No',
          quantity: qty,
          cost: cost,
          rate: rate,
          amount: item.totalPrice || 0,
          costAmount: qty * cost,
          remarks: 'Complete arrangement'
        }
      })

      sections.push({
        sectionNo: '5',
        sectionTitle: 'FURNITURE & EVENT SETUP',
        items,
        subtotal: items.reduce((sum, item) => sum + item.amount, 0),
        costSubtotal: items.reduce((sum, item) => sum + item.costAmount, 0)
      })
    }

    // Reset counter
    itemCounter = 1

    // 6. SANITARY & ACCESSORIES SECTION
    const accessoryItems = lineItems.filter(
      (item: QuoteLineItem) =>
        item.description.includes('Wash') ||
        item.description.includes('Toilet') ||
        item.description.includes('Portaloo') ||
        (!item.description.includes('Garden Cottage') &&
          !item.description.includes('Pagoda') &&
          !item.description.includes('Rondo') &&
          !item.description.includes('Apse') &&
          !item.description.includes('Flooring') &&
          !item.description.includes('Partition') &&
          !item.description.includes('Lighting') &&
          !item.description.includes('Drapery') &&
          !item.description.includes('Setup'))
    )

    if (accessoryItems.length > 0) {
      const items: BOQItem[] = accessoryItems.map((item: QuoteLineItem) => {
        const qty = item.quantity || 1
        const rate = item.unitPrice || 0
        const cost = rate * 0.7

        return {
          itemNo: `6.${itemCounter++}`,
          description: item.description,
          unit: 'No',
          quantity: qty,
          cost: cost,
          rate: rate,
          amount: item.totalPrice || 0,
          costAmount: qty * cost,
          remarks: 'Rental and service'
        }
      })

      sections.push({
        sectionNo: '6',
        sectionTitle: 'SANITARY FACILITIES & ACCESSORIES',
        items,
        subtotal: items.reduce((sum, item) => sum + item.amount, 0),
        costSubtotal: items.reduce((sum, item) => sum + item.costAmount, 0)
      })
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
        quoteId: quote.id,
        projectName: `${quote.eventType || 'Event'} - ${quote.contactName || 'Client'}`,
        projectLocation: quote.eventVenue || 'TBD',
        clientName: quote.contactName || '',
        clientEmail: quote.contactEmail || '',
        clientPhone: quote.contactPhone || '',
        eventDate: quote.eventStartDate || null,
        duration: quote.duration || 1,
        sections: JSON.stringify(sections),
        subtotal: subtotal.toString(),
        vat: vat.toString(),
        total: total.toString(),
        internalCost: internalCost.toString(),
        profitAmount: profitAmount.toString(),
        profitMargin: profitMargin,
        status: 'draft',
        remarks: `Generated from Quote ${quote.quoteNumber || quoteId}`,
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
        quoteReference: quote.quoteNumber
      }
    })
  } catch (error) {
    console.error('Error generating BOQ:', error)

    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to generate BOQ' },
      { status: 500 }
    )
  }
}
