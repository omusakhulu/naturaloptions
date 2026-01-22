import { NextRequest, NextResponse } from 'next/server'

// Pricing Data Structures
const COCKTAIL_RATES: Record<number, number> = {
  10: 125,
  15: 188,
  20: 250,
  25: 313,
  30: 375,
  40: 500,
  50: 625,
  60: 750,
  70: 875,
  80: 1000,
  90: 1125,
  100: 1250,
  110: 1375,
  120: 1500,
  130: 1625,
  140: 1750,
  150: 1875,
  160: 2000
}

const THEATER_RATES: Record<number, number> = {
  10: 100,
  15: 150,
  20: 200,
  25: 250,
  30: 300,
  40: 400,
  50: 500,
  60: 600,
  70: 700,
  80: 800,
  90: 900,
  100: 1000,
  110: 1100,
  120: 1200,
  130: 1300,
  140: 1400,
  150: 1500,
  160: 1600
}

const BANQUET_RATES: Record<number, number> = {
  10: 71,
  15: 107,
  20: 143,
  25: 179,
  30: 214,
  40: 286,
  50: 357,
  60: 429,
  70: 500,
  80: 571,
  90: 643,
  100: 714,
  110: 786,
  120: 857,
  130: 929,
  140: 1000,
  150: 1071,
  160: 1143
}

const CLASSROOM_RATES: Record<number, number> = {
  10: 54,
  15: 81,
  20: 108,
  25: 135,
  30: 162,
  40: 216,
  50: 270,
  60: 324
}

// Garden Cottage Pricing (PVC, Lighting, Drapery)
const GARDEN_COTTAGE_PRICING: Record<string, { pvc: number; lighting: number; drapery: number }> = {
  '3m': { pvc: 5000, lighting: 500, drapery: 125 },
  '4m': { pvc: 6000, lighting: 600, drapery: 150 },
  '5m': { pvc: 7000, lighting: 700, drapery: 175 },
  '6m': { pvc: 9000, lighting: 900, drapery: 225 }
}

// Pagoda Tent Pricing (Hard Wall, Lighting, Drapery)
const PAGODA_PRICING: Record<string, { hardWall: number; lighting: number; drapery: number; softWall?: number }> = {
  '3m': { hardWall: 10000, lighting: 1500, drapery: 2500, softWall: 5000 },
  '4m': { hardWall: 12000, lighting: 1800, drapery: 3000 },
  '5m': { hardWall: 15000, lighting: 2250, drapery: 3750, softWall: 9000 },
  '6m': { hardWall: 20000, lighting: 3000, drapery: 5000, softWall: 12000 },
  '10m B line': { hardWall: 28000, lighting: 0, drapery: 0, softWall: 28000 }
}

const RONDO_PRICING: Record<string, { cost: number; sqm: number }> = {
  'Rondo 15m': { cost: 200000, sqm: 177 },
  'Rondo 20m': { cost: 350000, sqm: 314 }
}

const APSE_PRICING: Record<string, { cost: number }> = {
  'Apse End 15m': { cost: 150000 },
  'Apse End 20m': { cost: 200000 }
}

const SEGMENT_5M_COST = 50000 // Cost per 5m segment

const FLOORING_COSTS: Record<string, number> = {
  'Vinyl/Mkeka wa Mbao': 3000,
  Carpeting: 250,
  'With white sticker': 750
}

const PARTITION_PRICING: Record<string, { hardWall: number; softWall: number }> = {
  '10m': { hardWall: 20000, softWall: 15000 },
  '15m': { hardWall: 25000, softWall: 20000 },
  '20m': { hardWall: 30000, softWall: 25000 },
  '25m': { hardWall: 40000, softWall: 30000 },
  '40m': { hardWall: 60000, softWall: 45000 },
  '50m': { hardWall: 75000, softWall: 55000 }
}

const ACCESSORIES_PRICING: Record<string, number> = {
  'Hand Wash Station': 9000,
  'Double Hand Wash Station': 12000,
  'Single Trailer Toilets': 15000,
  'Double Trailer Toilets': 25000,
  'Presidential Toilets': 45000,
  'Portaloos (single)': 8000
}

interface QuoteRequest {
  // Contact Information
  contactName?: string
  contactEmail?: string
  contactPhone?: string

  // Event Details
  eventStartDate?: string
  eventEndDate?: string
  eventVenue?: string
  eventType: string
  customEventType?: string
  numberOfGuests: number
  duration?: number
  tentType: 'gardenCottage' | 'pagoda' | 'rondo' | 'apse' | null

  // Garden Cottage specific
  gardenCottageSize?: string

  // Pagoda specific
  pagodaSize?: string
  pagodaWallType?: 'soft' | 'hard'

  // Rondo/Ellipse specific
  rondoStructure?: string
  rondoSegments?: number

  // Apse specific
  apseStructure?: string
  apseSegments?: number

  // Optional additions
  flooringType?: string
  flooringArea?: number

  partitions?: Array<{ width: string; wallType: 'soft' | 'hard'; quantity: number }>

  accessoryQuantities?: Record<string, number>
}

interface QuoteLineItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface QuoteResponse {
  success: boolean
  quote?: {
    contactInfo: {
      name: string
      email: string
      phone: string
    }
    eventDetails: {
      eventType: string
      numberOfGuests: number
      startDate?: string
      endDate?: string
      duration: number
      venue?: string
    }
    structureSummary?: string
    recommendedStructure?: string
    recommendedSpecs?: {
      size: string
      areaSqm: number
      ridgeHeight: string
      sideHeight: string
      reasoning: string
    }
    lineItems: QuoteLineItem[]
    subtotal: number
    vat: number
    total: number
  }
  error?: string
}

function findNearestPaxRate(pax: number, rates: Record<number, number>): number {
  const availablePax = Object.keys(rates)
    .map(Number)
    .sort((a, b) => a - b)

  // Check if exact match exists
  if (rates[pax]) return rates[pax]

  // Find nearest higher pax
  const nearestHigher = availablePax.find(p => p >= pax)

  if (nearestHigher) return rates[nearestHigher]

  // If larger than all options, use highest rate
  return rates[availablePax[availablePax.length - 1]]
}

// Space requirements per pax based on event type (sqm per person)
const SPACE_PER_PAX: Record<string, number> = {
  Cocktail: 0.8,
  Theater: 0.8,
  Banquet: 1.21,
  Classroom: 1.44,
  Exhibition: 18.0 // per booth
}

interface StructureSpecs {
  size: string
  areaSqm: number
  ridgeHeight: string
  sideHeight: string
  description: string
  reasoning: string
}

function calculateStructureSpecs(eventType: string, numberOfGuests: number): StructureSpecs {
  const spacePerPax = SPACE_PER_PAX[eventType] || 1.0
  const minRequiredSqm = numberOfGuests * spacePerPax

  // Structure recommendations based on capacity with full specifications
  if (minRequiredSqm <= 9) {
    return {
      size: '3m x 3m',
      areaSqm: 9,
      ridgeHeight: '3.5m',
      sideHeight: '2.4m',
      description: `Garden Cottage 3x3 - Ideal for ${numberOfGuests} guests ${eventType} style`,
      reasoning: `Based on ${numberOfGuests} guests with ${eventType} setup (${spacePerPax} sqm/person), you need ${Math.ceil(minRequiredSqm)} sqm minimum. This 9 sqm structure provides ${Math.ceil(((9 - minRequiredSqm) / minRequiredSqm) * 100)}% extra space for comfortable movement and equipment.`
    }
  } else if (minRequiredSqm <= 16) {
    return {
      size: '4m x 4m',
      areaSqm: 16,
      ridgeHeight: '4.0m',
      sideHeight: '2.6m',
      description: `Garden Cottage 4x4 - Ideal for ${numberOfGuests} guests ${eventType} style`,
      reasoning: `Based on ${numberOfGuests} guests with ${eventType} setup (${spacePerPax} sqm/person), you need ${Math.ceil(minRequiredSqm)} sqm minimum. This 16 sqm structure provides ${Math.ceil(((16 - minRequiredSqm) / minRequiredSqm) * 100)}% buffer space for optimal guest comfort.`
    }
  } else if (minRequiredSqm <= 25) {
    return {
      size: '5m x 5m',
      areaSqm: 25,
      ridgeHeight: '4.5m',
      sideHeight: '2.8m',
      description: `Pagoda 5x5 - Suitable for ${numberOfGuests} guests ${eventType} style`,
      reasoning: `Calculated requirement: ${numberOfGuests} guests × ${spacePerPax} sqm = ${Math.ceil(minRequiredSqm)} sqm. The Pagoda 5x5 (25 sqm) offers ${Math.ceil(((25 - minRequiredSqm) / minRequiredSqm) * 100)}% additional capacity, ensuring adequate space for ${eventType} arrangements.`
    }
  } else if (minRequiredSqm <= 36) {
    return {
      size: '6m x 6m',
      areaSqm: 36,
      ridgeHeight: '5.0m',
      sideHeight: '3.0m',
      description: `Pagoda 6x6 - Perfect for ${numberOfGuests} guests ${eventType} style`,
      reasoning: `Space calculation: ${numberOfGuests} guests × ${spacePerPax} sqm/person = ${Math.ceil(minRequiredSqm)} sqm required. This 36 sqm Pagoda provides ${Math.ceil(((36 - minRequiredSqm) / minRequiredSqm) * 100)}% extra room, ideal for ${eventType} setup with comfortable circulation space.`
    }
  } else if (minRequiredSqm <= 100) {
    return {
      size: '10m x 10m',
      areaSqm: 100,
      ridgeHeight: '6.0m',
      sideHeight: '3.5m',
      description: `OmniSpace 10m x 10m - Spacious for ${numberOfGuests} guests ${eventType} style`,
      reasoning: `Required space: ${numberOfGuests} guests × ${spacePerPax} sqm/guest = ${Math.ceil(minRequiredSqm)} sqm. The OmniSpace 10x10 (100 sqm) exceeds this by ${Math.ceil(((100 - minRequiredSqm) / minRequiredSqm) * 100)}%, providing excellent space for ${eventType} layout, staging, and guest flow.`
    }
  } else if (minRequiredSqm <= 177) {
    return {
      size: '15m x 11.8m (Rondo)',
      areaSqm: 177,
      ridgeHeight: '7.5m',
      sideHeight: '4.0m',
      description: `OmniSpace Rondo 15m - Accommodates ${numberOfGuests} guests ${eventType} style`,
      reasoning: `Space requirement: ${numberOfGuests} guests at ${spacePerPax} sqm per person = ${Math.ceil(minRequiredSqm)} sqm needed. The Rondo 15m delivers 177 sqm (${Math.ceil(((177 - minRequiredSqm) / minRequiredSqm) * 100)}% surplus), perfect for large ${eventType} events with ample room for amenities.`
    }
  } else if (minRequiredSqm <= 314) {
    return {
      size: '20m x 15.7m (Rondo)',
      areaSqm: 314,
      ridgeHeight: '10.0m',
      sideHeight: '4.5m',
      description: `OmniSpace Rondo 20m - Large capacity for ${numberOfGuests} guests ${eventType} style`,
      reasoning: `Minimum space: ${Math.ceil(minRequiredSqm)} sqm (${numberOfGuests} guests × ${spacePerPax} sqm). This Rondo 20m structure (314 sqm) provides ${Math.ceil(((314 - minRequiredSqm) / minRequiredSqm) * 100)}% additional capacity for expansive ${eventType} setups, multiple zones, and premium guest experience.`
    }
  } else {
    const additionalLength = Math.ceil((minRequiredSqm - 314) / 100) * 5
    const totalLength = 20 + additionalLength
    const totalArea = 314 + additionalLength * 20

    return {
      size: `20m x ${totalLength}m (Rondo + ${additionalLength}m segments)`,
      areaSqm: totalArea,
      ridgeHeight: '10.0m',
      sideHeight: '4.5m',
      description: `OmniSpace Rondo 20m + ${additionalLength}m - Extra large for ${numberOfGuests} guests ${eventType} style`,
      reasoning: `For ${numberOfGuests} guests with ${eventType} layout at ${spacePerPax} sqm/person, you need ${Math.ceil(minRequiredSqm)} sqm. Base Rondo 20m (314 sqm) + ${additionalLength}m extension = ${totalArea} sqm total. This configuration provides ${Math.ceil(((totalArea - minRequiredSqm) / minRequiredSqm) * 100)}% buffer for large-scale ${eventType} events with multiple functional areas.`
    }
  }
}

function recommendStructure(eventType: string, numberOfGuests: number): string {
  const specs = calculateStructureSpecs(eventType, numberOfGuests)
  const spacePerPax = SPACE_PER_PAX[eventType] || 1.0
  const minRequiredSqm = numberOfGuests * spacePerPax

  return `For ${numberOfGuests} guests ${eventType} style (min ${Math.ceil(minRequiredSqm)} sqm), we recommend: ${specs.description}`
}

export async function POST(request: NextRequest) {
  try {
    const data: QuoteRequest = await request.json()

    const lineItems: QuoteLineItem[] = []
    let structureSummary = ''

    // 1. Calculate base tent/structure cost
    if (data.tentType === 'gardenCottage' && data.gardenCottageSize) {
      structureSummary = `Garden Cottage ${data.gardenCottageSize} x ${data.gardenCottageSize}`
      const pricing = GARDEN_COTTAGE_PRICING[data.gardenCottageSize]

      if (pricing) {
        // Add PVC cost
        lineItems.push({
          description: `Garden Cottage ${data.gardenCottageSize} x ${data.gardenCottageSize} (PVC)`,
          quantity: 1,
          unitPrice: pricing.pvc,
          totalPrice: pricing.pvc
        })

        // Add Lighting cost
        lineItems.push({
          description: `Garden Cottage ${data.gardenCottageSize} - Lighting`,
          quantity: 1,
          unitPrice: pricing.lighting,
          totalPrice: pricing.lighting
        })

        // Add Drapery cost
        lineItems.push({
          description: `Garden Cottage ${data.gardenCottageSize} - Drapery`,
          quantity: 1,
          unitPrice: pricing.drapery,
          totalPrice: pricing.drapery
        })
      }
    } else if (data.tentType === 'pagoda' && data.pagodaSize) {
      const wallType = data.pagodaWallType || 'soft'

      structureSummary = `Pagoda Tent ${data.pagodaSize} x ${data.pagodaSize} (${wallType === 'hard' ? 'Hard Wall' : 'Soft Wall'})`
      const pricing = PAGODA_PRICING[data.pagodaSize]

      if (pricing) {
        const wallPrice = wallType === 'hard' ? pricing.hardWall : pricing.softWall || 0

        // Add Wall cost
        lineItems.push({
          description: `Pagoda Tent ${data.pagodaSize} x ${data.pagodaSize} (${wallType === 'hard' ? 'Hard Wall' : 'Soft Wall'})`,
          quantity: 1,
          unitPrice: wallPrice,
          totalPrice: wallPrice
        })

        // Add Lighting cost (if applicable)
        if (pricing.lighting > 0) {
          lineItems.push({
            description: `Pagoda Tent ${data.pagodaSize} - Lighting`,
            quantity: 1,
            unitPrice: pricing.lighting,
            totalPrice: pricing.lighting
          })
        }

        // Add Drapery cost (if applicable)
        if (pricing.drapery > 0) {
          lineItems.push({
            description: `Pagoda Tent ${data.pagodaSize} - Drapery`,
            quantity: 1,
            unitPrice: pricing.drapery,
            totalPrice: pricing.drapery
          })
        }
      }
    } else if (data.tentType === 'rondo' && data.rondoStructure) {
      const totalLength = data.rondoSegments ? data.rondoSegments * 5 : 0

      structureSummary = `${data.rondoStructure} Structure${totalLength > 0 ? ` + ${totalLength}m (${data.rondoSegments} x 5m segments)` : ''}`
      const pricing = RONDO_PRICING[data.rondoStructure]

      if (pricing) {
        lineItems.push({
          description: `${data.rondoStructure} Structure`,
          quantity: 1,
          unitPrice: pricing.cost,
          totalPrice: pricing.cost
        })

        // Add 5m segments
        if (data.rondoSegments && data.rondoSegments > 0) {
          const segmentCost = data.rondoSegments * SEGMENT_5M_COST

          lineItems.push({
            description: `5m Segments`,
            quantity: data.rondoSegments,
            unitPrice: SEGMENT_5M_COST,
            totalPrice: segmentCost
          })
        }
      }
    } else if (data.tentType === 'apse' && data.apseStructure) {
      const totalLength = data.apseSegments ? data.apseSegments * 5 : 0

      structureSummary = `${data.apseStructure} Structure${totalLength > 0 ? ` + ${totalLength}m (${data.apseSegments} x 5m segments)` : ''}`
      const pricing = APSE_PRICING[data.apseStructure]

      if (pricing) {
        lineItems.push({
          description: `${data.apseStructure} Structure`,
          quantity: 1,
          unitPrice: pricing.cost,
          totalPrice: pricing.cost
        })

        // Add 5m segments
        if (data.apseSegments && data.apseSegments > 0) {
          const segmentCost = data.apseSegments * SEGMENT_5M_COST

          lineItems.push({
            description: `5m Segments`,
            quantity: data.apseSegments,
            unitPrice: SEGMENT_5M_COST,
            totalPrice: segmentCost
          })
        }
      }
    }

    // 2. Add event-based pricing (if applicable)
    if (data.eventType !== 'Other' && data.numberOfGuests) {
      let rate = 0

      switch (data.eventType) {
        case 'Cocktail':
          rate = findNearestPaxRate(data.numberOfGuests, COCKTAIL_RATES)
          break
        case 'Theater':
          rate = findNearestPaxRate(data.numberOfGuests, THEATER_RATES)
          break
        case 'Banquet':
          rate = findNearestPaxRate(data.numberOfGuests, BANQUET_RATES)
          break
        case 'Classroom':
          rate = findNearestPaxRate(data.numberOfGuests, CLASSROOM_RATES)
          break
      }

      if (rate > 0) {
        lineItems.push({
          description: `${data.eventType} Setup for ${data.numberOfGuests} Guests`,
          quantity: 1,
          unitPrice: rate,
          totalPrice: rate
        })
      }
    }

    // 3. Add flooring costs
    if (data.flooringType && data.flooringArea) {
      const costPerSqm = FLOORING_COSTS[data.flooringType]

      if (costPerSqm) {
        const totalFlooringCost = costPerSqm * data.flooringArea

        lineItems.push({
          description: `Flooring: ${data.flooringType} (${data.flooringArea} sqm)`,
          quantity: data.flooringArea,
          unitPrice: costPerSqm,
          totalPrice: totalFlooringCost
        })
      }
    }

    // 4. Add partition costs (multiple partitions)
    if (data.partitions && data.partitions.length > 0) {
      data.partitions.forEach((partition, index) => {
        const pricing = PARTITION_PRICING[partition.width]

        if (pricing) {
          const price = partition.wallType === 'hard' ? pricing.hardWall : pricing.softWall
          const partitionTotal = price * partition.quantity

          lineItems.push({
            description: `Internal Partition ${partition.width} (${partition.wallType === 'hard' ? 'Hard Wall' : 'Soft Wall'})`,
            quantity: partition.quantity,
            unitPrice: price,
            totalPrice: partitionTotal
          })
        }
      })
    }

    // 5. Add accessories
    if (data.accessoryQuantities) {
      Object.entries(data.accessoryQuantities).forEach(([accessory, quantity]) => {
        const price = ACCESSORIES_PRICING[accessory]

        if (price && quantity > 0) {
          lineItems.push({
            description: accessory,
            quantity,
            unitPrice: price,
            totalPrice: price * quantity
          })
        }
      })
    }

    // Apply duration multiplier
    const duration = data.duration || 1

    if (duration > 1) {
      lineItems.forEach(item => {
        item.totalPrice = item.totalPrice * duration
      })
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const vat = subtotal * 0.16 // 16% Kenya VAT
    const total = subtotal + vat

    // Generate structure recommendation with specs
    const eventTypeForCalc = data.eventType === 'Other' ? data.customEventType || 'Event' : data.eventType
    const structureSpecs = calculateStructureSpecs(eventTypeForCalc, data.numberOfGuests)
    const recommendedStructure = recommendStructure(eventTypeForCalc, data.numberOfGuests)

    const response: QuoteResponse = {
      success: true,
      quote: {
        contactInfo: {
          name: data.contactName || '',
          email: data.contactEmail || '',
          phone: data.contactPhone || ''
        },
        eventDetails: {
          eventType: data.eventType === 'Other' ? data.customEventType || 'Custom Event' : data.eventType,
          numberOfGuests: data.numberOfGuests,
          startDate: data.eventStartDate,
          endDate: data.eventEndDate,
          duration: duration,
          venue: data.eventVenue
        },
        structureSummary,
        recommendedStructure,
        recommendedSpecs: {
          size: structureSpecs.size,
          areaSqm: structureSpecs.areaSqm,
          ridgeHeight: structureSpecs.ridgeHeight,
          sideHeight: structureSpecs.sideHeight,
          reasoning: structureSpecs.reasoning
        },
        lineItems,
        subtotal,
        vat,
        total
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error calculating quote:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to calculate quote'
      },
      { status: 500 }
    )
  }
}
