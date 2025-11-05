'use client'

import { useState, useMemo, useEffect } from 'react'

import { useSearchParams, useRouter } from 'next/navigation'

// PDF Export

import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  FormLabel,
  Box,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import CalculateIcon from '@mui/icons-material/Calculate'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PrintIcon from '@mui/icons-material/Print'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import SaveAltIcon from '@mui/icons-material/SaveAlt'
import DescriptionIcon from '@mui/icons-material/Description'

import { printAsPDF, downloadAsPDF } from '@/utils/pdfExport'

// Custom Select Icon Component
const SelectIcon = () => <i className='tabler-chevron-down' />

// Custom Radio Icon Components
const IconChecked = () => {
  return (
    <svg width='1em' height='1em' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M5.5 12a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Z'
        fill='var(--mui-palette-common-white)'
        stroke='currentColor'
        strokeWidth='5'
      />
    </svg>
  )
}

const UncheckedIcon = () => {
  return (
    <svg width='1em' height='1em' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Z' stroke='var(--mui-palette-text-disabled)' strokeWidth='2' />
    </svg>
  )
}

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface QuoteResult {
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
  lineItems: LineItem[]
  subtotal: number
  vat: number
  total: number
}

export default function EventTentQuoteForm() {
  const searchParams = useSearchParams()
  const editQuoteId = searchParams.get('edit')

  console.log('Edit Quote ID from URL:', editQuoteId)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(false)

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  const [editableLineItems, setEditableLineItems] = useState<LineItem[]>([])
  const [originalQuote, setOriginalQuote] = useState<QuoteResult | null>(null)

  // Notification state
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  // Save quote state
  const [saving, setSaving] = useState(false)
  const [savedQuoteNumber, setSavedQuoteNumber] = useState<string | null>(null)
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null)

  // BOQ generation state
  const [boqDialogOpen, setBOQDialogOpen] = useState(false)
  const [generatingBOQ, setGeneratingBOQ] = useState(false)

  const router = useRouter()

  // Contact Information
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Event Details
  const [eventStartDate, setEventStartDate] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventVenue, setEventVenue] = useState('')
  const [eventType, setEventType] = useState('Cocktail')
  const [customEventType, setCustomEventType] = useState('')
  const [numberOfGuests, setNumberOfGuests] = useState(50)
  const [tentType, setTentType] = useState<'gardenCottage' | 'pagoda' | 'rondo' | 'apse'>('gardenCottage')

  // Garden Cottage fields
  const [gardenCottageSize, setGardenCottageSize] = useState('3m')

  // Pagoda fields
  const [pagodaSize, setPagodaSize] = useState('5m')
  const [pagodaWallType, setPagodaWallType] = useState<'soft' | 'hard'>('soft')

  // Rondo fields
  const [rondoStructure, setRondoStructure] = useState('Rondo 15m')
  const [rondoSegments, setRondoSegments] = useState(0)

  // Apse fields
  const [apseStructure, setApseStructure] = useState('Apse End 15m')
  const [apseSegments, setApseSegments] = useState(0)

  // Optional fields
  const [includeFlooring, setIncludeFlooring] = useState(false)
  const [flooringType, setFlooringType] = useState('Vinyl/Mkeka wa Mbao')
  const [flooringArea, setFlooringArea] = useState(100)

  const [partitions, setPartitions] = useState<Array<{ width: string; wallType: 'soft' | 'hard'; quantity: number }>>(
    []
  )

  const [accessoryQuantities, setAccessoryQuantities] = useState<Record<string, number>>({})

  const availableAccessories = [
    'Hand Wash Station',
    'Double Hand Wash Station',
    'Single Trailer Toilets',
    'Double Trailer Toilets',
    'Presidential Toilets',
    'Portaloos (single)'
  ]

  // Load existing quote if edit parameter is present
  useEffect(() => {
    const loadExistingQuote = async (quoteId: string) => {
      try {
        console.log('Loading existing quote:', quoteId)
        setLoadingExisting(true)
        const response = await fetch(`/api/quotes/event-tent/${quoteId}`)
        const data = await response.json()

        console.log('Quote data received:', data)

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load quote')
        }

        const existingQuote = data.quote

        // Populate contact information
        setContactName(existingQuote.contactName || '')
        setContactEmail(existingQuote.contactEmail || '')
        setContactPhone(existingQuote.contactPhone || '')

        // Populate event details
        if (existingQuote.eventStartDate) setEventStartDate(existingQuote.eventStartDate.split('T')[0])
        if (existingQuote.eventEndDate) setEventEndDate(existingQuote.eventEndDate.split('T')[0])
        setEventVenue(existingQuote.eventVenue || '')
        setEventType(existingQuote.eventType)
        setNumberOfGuests(existingQuote.numberOfGuests)

        // Parse and set tent type from structureSummary or tentType
        const tentTypeStr = existingQuote.tentType.toLowerCase()
        const structureSummary = existingQuote.structureSummary || ''

        // lineItems might already be an array or a JSON string, handle both cases
        const lineItems =
          typeof existingQuote.lineItems === 'string' ? JSON.parse(existingQuote.lineItems) : existingQuote.lineItems

        if (tentTypeStr.includes('cottage')) {
          setTentType('gardenCottage')

          // Parse Garden Cottage size
          if (structureSummary.includes('3m')) setGardenCottageSize('3m')
          else if (structureSummary.includes('4m')) setGardenCottageSize('4m')
          else if (structureSummary.includes('5m')) setGardenCottageSize('5m')
          else if (structureSummary.includes('6m')) setGardenCottageSize('6m')
        } else if (tentTypeStr.includes('pagoda')) {
          setTentType('pagoda')

          // Parse Pagoda details
          if (structureSummary.includes('3m')) setPagodaSize('3m')
          else if (structureSummary.includes('4m')) setPagodaSize('4m')
          else if (structureSummary.includes('5m')) setPagodaSize('5m')
          else if (structureSummary.includes('6m')) setPagodaSize('6m')
          else if (structureSummary.includes('10m')) setPagodaSize('10m B line')

          // Check for wall type in line items
          const hasHardWall = lineItems.some((item: LineItem) => item.description.toLowerCase().includes('hard'))

          setPagodaWallType(hasHardWall ? 'hard' : 'soft')
        } else if (tentTypeStr.includes('rondo')) {
          setTentType('rondo')

          // Parse Rondo structure
          if (structureSummary.includes('Rondo 15m')) {
            setRondoStructure('Rondo 15m')
          } else if (structureSummary.includes('Rondo 20m')) {
            setRondoStructure('Rondo 20m')
          }

          // Parse segments
          const segmentItem = lineItems.find((item: LineItem) => item.description.toLowerCase().includes('5m segment'))

          if (segmentItem) {
            setRondoSegments(segmentItem.quantity || 0)
          }
        } else if (tentTypeStr.includes('apse')) {
          setTentType('apse')

          // Parse Apse structure
          if (structureSummary.includes('Apse End 15m')) {
            setApseStructure('Apse End 15m')
          } else if (structureSummary.includes('Apse End 20m')) {
            setApseStructure('Apse End 20m')
          }

          // Parse segments
          const apseSegmentItem = lineItems.find((item: LineItem) =>
            item.description.toLowerCase().includes('5m segment')
          )

          if (apseSegmentItem) {
            setApseSegments(apseSegmentItem.quantity || 0)
          }
        }

        // Parse flooring
        const flooringItem = lineItems.find((item: LineItem) => item.description.toLowerCase().includes('flooring'))

        if (flooringItem) {
          setIncludeFlooring(true)
          const desc = flooringItem.description

          if (desc.includes('Vinyl/Mkeka wa Mbao')) {
            setFlooringType('Vinyl/Mkeka wa Mbao')
          } else if (desc.includes('Carpeting')) {
            setFlooringType('Carpeting')
          } else if (desc.includes('white sticker')) {
            setFlooringType('With white sticker')
          }

          // Extract area from description or quantity
          const areaMatch = desc.match(/(\d+)\s*sqm/)

          if (areaMatch) {
            setFlooringArea(parseInt(areaMatch[1]))
          }
        }

        // Parse accessories
        const newAccessoryQuantities: Record<string, number> = {}

        lineItems.forEach((item: LineItem) => {
          const desc = item.description

          if (desc.includes('Hand Wash Station') && !desc.includes('Double')) {
            newAccessoryQuantities['Hand Wash Station'] = item.quantity
          } else if (desc.includes('Double Hand Wash Station')) {
            newAccessoryQuantities['Double Hand Wash Station'] = item.quantity
          } else if (desc.includes('Single Trailer Toilets')) {
            newAccessoryQuantities['Single Trailer Toilets'] = item.quantity
          } else if (desc.includes('Double Trailer Toilets')) {
            newAccessoryQuantities['Double Trailer Toilets'] = item.quantity
          } else if (desc.includes('Presidential Toilets')) {
            newAccessoryQuantities['Presidential Toilets'] = item.quantity
          } else if (desc.includes('Portaloos')) {
            newAccessoryQuantities['Portaloos (single)'] = item.quantity
          }
        })
        setAccessoryQuantities(newAccessoryQuantities)

        // Show success message
        setSnackbarMessage(`✓ Loaded quote #${existingQuote.quoteNumber} for editing`)
        setSnackbarOpen(true)
      } catch (error) {
        console.error('Error loading quote:', error)
        setError((error as Error).message || 'Failed to load existing quote')
      } finally {
        setLoadingExisting(false)
      }
    }

    console.log('useEffect triggered, editQuoteId:', editQuoteId)

    if (editQuoteId) {
      loadExistingQuote(editQuoteId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editQuoteId])

  // Pricing constants
  const GARDEN_COTTAGE_PRICING: Record<string, { pvc: number; lighting: number; drapery: number }> = {
    '3m': { pvc: 5000, lighting: 500, drapery: 125 },
    '4m': { pvc: 6000, lighting: 600, drapery: 150 },
    '5m': { pvc: 7000, lighting: 700, drapery: 175 },
    '6m': { pvc: 9000, lighting: 900, drapery: 225 }
  }

  const PAGODA_PRICING: Record<string, { hardWall: number; lighting: number; drapery: number; softWall?: number }> = {
    '3m': { hardWall: 10000, lighting: 1500, drapery: 2500, softWall: 5000 },
    '4m': { hardWall: 12000, lighting: 1800, drapery: 3000 },
    '5m': { hardWall: 15000, lighting: 2250, drapery: 3750, softWall: 9000 },
    '6m': { hardWall: 20000, lighting: 3000, drapery: 5000, softWall: 12000 },
    '10m B line': { hardWall: 28000, lighting: 0, drapery: 0, softWall: 28000 }
  }

  const RONDO_PRICING: Record<string, number> = {
    'Rondo 15m': 200000,
    'Rondo 20m': 350000
  }

  const APSE_PRICING: Record<string, number> = {
    'Apse End 15m': 150000,
    'Apse End 20m': 200000
  }

  const SEGMENT_5M_COST = 50000

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

  const findNearestPaxRate = (pax: number, rates: Record<number, number>): number => {
    const availablePax = Object.keys(rates)
      .map(Number)
      .sort((a, b) => a - b)

    if (rates[pax]) return rates[pax]
    const nearestHigher = availablePax.find(p => p >= pax)

    if (nearestHigher) return rates[nearestHigher]

    return rates[availablePax[availablePax.length - 1]]
  }

  const handleAccessoryQuantityChange = (accessory: string, quantity: number) => {
    setAccessoryQuantities(prev => {
      const updated = { ...prev }

      if (quantity > 0) {
        updated[accessory] = quantity
      } else {
        delete updated[accessory]
      }

      return updated
    })
  }

  const addPartition = () => {
    setPartitions(prev => [...prev, { width: '10m', wallType: 'soft', quantity: 1 }])
  }

  const removePartition = (index: number) => {
    setPartitions(prev => prev.filter((_, i) => i !== index))
  }

  const updatePartition = (index: number, field: 'width' | 'wallType' | 'quantity', value: string | number) => {
    setPartitions(prev => prev.map((partition, i) => (i === index ? { ...partition, [field]: value } : partition)))
  }

  const calculateDuration = () => {
    if (!eventStartDate || !eventEndDate) return 1
    const start = new Date(eventStartDate)
    const end = new Date(eventEndDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return days > 0 ? days : 1
  }

  // Dynamic price calculation
  const livePrice = useMemo(() => {
    let total = 0
    const breakdown: Array<{ label: string; amount: number }> = []

    // 1. Tent/Structure cost
    if (tentType === 'gardenCottage') {
      const pricing = GARDEN_COTTAGE_PRICING[gardenCottageSize]

      if (pricing) {
        breakdown.push({ label: `Garden Cottage ${gardenCottageSize} (PVC)`, amount: pricing.pvc })
        total += pricing.pvc
        breakdown.push({ label: `Lighting`, amount: pricing.lighting })
        total += pricing.lighting
        breakdown.push({ label: `Drapery`, amount: pricing.drapery })
        total += pricing.drapery
      }
    } else if (tentType === 'pagoda') {
      const pricing = PAGODA_PRICING[pagodaSize]

      if (pricing) {
        const wallPrice = pagodaWallType === 'hard' ? pricing.hardWall : pricing.softWall || 0

        if (wallPrice > 0) {
          breakdown.push({
            label: `Pagoda ${pagodaSize} (${pagodaWallType === 'hard' ? 'Hard' : 'Soft'} Wall)`,
            amount: wallPrice
          })
          total += wallPrice
        }

        if (pricing.lighting > 0) {
          breakdown.push({ label: `Lighting`, amount: pricing.lighting })
          total += pricing.lighting
        }

        if (pricing.drapery > 0) {
          breakdown.push({ label: `Drapery`, amount: pricing.drapery })
          total += pricing.drapery
        }
      }
    } else if (tentType === 'rondo') {
      const price = RONDO_PRICING[rondoStructure]

      if (price) {
        breakdown.push({ label: rondoStructure, amount: price })
        total += price
      }

      if (rondoSegments > 0) {
        const segmentCost = rondoSegments * SEGMENT_5M_COST

        breakdown.push({ label: `${rondoSegments}x 5m Segments`, amount: segmentCost })
        total += segmentCost
      }
    } else if (tentType === 'apse') {
      const price = APSE_PRICING[apseStructure]

      if (price) {
        breakdown.push({ label: apseStructure, amount: price })
        total += price
      }

      if (apseSegments > 0) {
        const segmentCost = apseSegments * SEGMENT_5M_COST

        breakdown.push({ label: `${apseSegments}x 5m Segments`, amount: segmentCost })
        total += segmentCost
      }
    }

    // 2. Event setup cost
    if (eventType !== 'Other' && numberOfGuests > 0) {
      let rate = 0

      switch (eventType) {
        case 'Cocktail':
          rate = findNearestPaxRate(numberOfGuests, COCKTAIL_RATES)
          break
        case 'Theater':
          rate = findNearestPaxRate(numberOfGuests, THEATER_RATES)
          break
        case 'Banquet':
          rate = findNearestPaxRate(numberOfGuests, BANQUET_RATES)
          break
        case 'Classroom':
          rate = findNearestPaxRate(numberOfGuests, CLASSROOM_RATES)
          break
      }

      if (rate > 0) {
        breakdown.push({ label: `${eventType} Setup`, amount: rate })
        total += rate
      }
    }

    // 3. Flooring
    if (includeFlooring && flooringArea > 0) {
      const costPerSqm = FLOORING_COSTS[flooringType]

      if (costPerSqm) {
        const flooringCost = costPerSqm * flooringArea

        breakdown.push({ label: `Flooring (${flooringArea}sqm)`, amount: flooringCost })
        total += flooringCost
      }
    }

    // 4. Partitions (multiple)
    partitions.forEach((partition, index) => {
      const pricing = PARTITION_PRICING[partition.width]

      if (pricing) {
        const price = partition.wallType === 'hard' ? pricing.hardWall : pricing.softWall
        const partitionTotal = price * partition.quantity

        breakdown.push({
          label: `Partition ${partition.width} (${partition.wallType === 'hard' ? 'Hard' : 'Soft'} Wall) x${partition.quantity}`,
          amount: partitionTotal
        })
        total += partitionTotal
      }
    })

    // 5. Accessories
    Object.entries(accessoryQuantities).forEach(([accessory, quantity]) => {
      const price = ACCESSORIES_PRICING[accessory]

      if (price && quantity > 0) {
        const itemTotal = price * quantity

        breakdown.push({ label: `${accessory} (x${quantity})`, amount: itemTotal })
        total += itemTotal
      }
    })

    return { total, breakdown }
  }, [
    tentType,
    gardenCottageSize,
    pagodaSize,
    pagodaWallType,
    rondoStructure,
    rondoSegments,
    apseStructure,
    apseSegments,
    eventType,
    numberOfGuests,
    includeFlooring,
    flooringType,
    flooringArea,
    partitions,
    accessoryQuantities,
    ACCESSORIES_PRICING,
    APSE_PRICING,
    BANQUET_RATES,
    CLASSROOM_RATES,
    COCKTAIL_RATES,
    FLOORING_COSTS,
    GARDEN_COTTAGE_PRICING,
    PAGODA_PRICING,
    PARTITION_PRICING,
    RONDO_PRICING,
    SEGMENT_5M_COST,
    THEATER_RATES,
    findNearestPaxRate
  ])

  const handlePrint = async () => {
    try {
      const element = document.getElementById('printable-quote')

      if (!element) {
        throw new Error('Quote element not found')
      }

      const fileName = `Event-Tent-Quote-${contactName.replace(/\s+/g, '-') || 'quote'}-${new Date().toISOString().split('T')[0]}.pdf`

      await printAsPDF(element, fileName)
    } catch (error) {
      console.error('Error printing quote:', error)
      setError('Error generating PDF. Please try again.')
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const element = document.getElementById('printable-quote')

      if (!element) {
        throw new Error('Quote element not found')
      }

      const fileName = `Event-Tent-Quote-${contactName.replace(/\s+/g, '-') || 'quote'}-${new Date().toISOString().split('T')[0]}.pdf`

      await downloadAsPDF(element, fileName)
      setSnackbarMessage('PDF downloaded successfully!')
      setSnackbarOpen(true)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      setError('Error generating PDF. Please try again.')
    }
  }

  const saveQuote = async () => {
    if (!quote) return

    try {
      setSaving(true)

      const payload = {
        contactName,
        contactEmail,
        contactPhone,
        eventType,
        eventStartDate,
        eventEndDate,
        eventVenue,
        numberOfGuests,
        duration: calculateDuration(),
        tentType,
        structureSummary: quote.structureSummary,
        lineItems: quote.lineItems,
        subtotal: quote.subtotal,
        vat: quote.vat,
        total: quote.total
      }

      const response = await fetch('/api/quotes/event-tent/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save quote')
      }

      setSavedQuoteNumber(data.quote.quoteNumber)
      setSavedQuoteId(data.quote.id)
      setSnackbarMessage(`✓ Quote saved successfully! Quote #${data.quote.quoteNumber}`)
      setSnackbarOpen(true)

      // Show BOQ generation dialog
      setBOQDialogOpen(true)
    } catch (err) {
      console.error('Error saving quote:', err)
      setSnackbarMessage(`✗ Error: ${(err as Error).message}`)
      setSnackbarOpen(true)
    } finally {
      setSaving(false)
    }
  }

  const updateQuote = async () => {
    if (!quote || !editQuoteId) return

    try {
      setSaving(true)

      const payload = {
        contactName,
        contactEmail,
        contactPhone,
        eventType,
        eventStartDate,
        eventEndDate,
        eventVenue,
        numberOfGuests,
        duration: calculateDuration(),
        tentType,
        structureSummary: quote.structureSummary,
        lineItems: quote.lineItems,
        subtotal: quote.subtotal,
        vat: quote.vat,
        total: quote.total
      }

      const response = await fetch(`/api/quotes/event-tent/${editQuoteId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update quote')
      }

      setSavedQuoteNumber(data.quote.quoteNumber)
      setSavedQuoteId(editQuoteId)
      setSnackbarMessage(`✓ Quote updated successfully! Quote #${data.quote.quoteNumber}`)
      setSnackbarOpen(true)

      // Show BOQ generation dialog
      setBOQDialogOpen(true)
    } catch (err) {
      console.error('Error updating quote:', err)
      setSnackbarMessage(`✗ Error: ${(err as Error).message}`)
      setSnackbarOpen(true)
    } finally {
      setSaving(false)
    }
  }

  const generateBOQ = async () => {
    if (!savedQuoteId) return

    try {
      setGeneratingBOQ(true)

      const response = await fetch('/api/boq/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quoteId: savedQuoteId })
      })

      const data = await response.json()

      if (data.success) {
        setSnackbarMessage(`✓ BOQ ${data.boq.boqNumber} generated successfully!`)
        setSnackbarOpen(true)
        setBOQDialogOpen(false)

        // Navigate to BOQ view page after a short delay
        setTimeout(() => {
          router.push(`/en/apps/boq/view/${data.boq.id}`)
        }, 1500)
      } else {
        setSnackbarMessage(`✗ Error: ${data.error || 'Failed to generate BOQ'}`)
        setSnackbarOpen(true)
      }
    } catch (err) {
      console.error('Error generating BOQ:', err)
      setSnackbarMessage(`✗ Error: ${(err as Error).message}`)
      setSnackbarOpen(true)
    } finally {
      setGeneratingBOQ(false)
    }
  }

  const enableEditMode = () => {
    if (quote) {
      setOriginalQuote({ ...quote })
      setEditableLineItems([...quote.lineItems])
      setIsEditMode(true)
    }
  }

  const cancelEditMode = () => {
    if (originalQuote) {
      setQuote(originalQuote)
      setOriginalQuote(null)
    }

    setEditableLineItems([])
    setIsEditMode(false)
  }

  const saveEditedQuote = () => {
    if (quote) {
      const newSubtotal = editableLineItems.reduce((sum, item) => sum + item.totalPrice, 0)
      const newVat = newSubtotal * 0.16
      const newTotal = newSubtotal + newVat

      setQuote({
        ...quote,
        lineItems: editableLineItems,
        subtotal: newSubtotal,
        vat: newVat,
        total: newTotal
      })
      setIsEditMode(false)
      setOriginalQuote(null)
    }
  }

  const updateLineItem = (index: number, field: 'description' | 'quantity' | 'unitPrice', value: string | number) => {
    const updatedItems = [...editableLineItems]

    if (field === 'description') {
      updatedItems[index].description = value as string
    } else if (field === 'quantity') {
      updatedItems[index].quantity = Number(value) || 0
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice
    } else if (field === 'unitPrice') {
      updatedItems[index].unitPrice = Number(value) || 0
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice
    }

    setEditableLineItems(updatedItems)
  }

  const addCustomLineItem = () => {
    setEditableLineItems([
      ...editableLineItems,
      {
        description: 'Custom Item',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }
    ])
  }

  const removeLineItem = (index: number) => {
    setEditableLineItems(editableLineItems.filter((_, i) => i !== index))
  }

  const applyRecommendation = () => {
    if (!quote?.recommendedSpecs) return

    const specs = quote.recommendedSpecs
    const size = specs.size.toLowerCase()

    // Determine tent type and apply settings
    if (size.includes('garden cottage') || size.includes('cottage')) {
      setTentType('gardenCottage')
      if (size.includes('3m')) setGardenCottageSize('3m')
      else if (size.includes('4m')) setGardenCottageSize('4m')
      else if (size.includes('5m')) setGardenCottageSize('5m')
    } else if (size.includes('pagoda')) {
      setTentType('pagoda')
      if (size.includes('3m')) setPagodaSize('3m')
      else if (size.includes('4m')) setPagodaSize('4m')
      else if (size.includes('5m')) setPagodaSize('5m')
      else if (size.includes('6m')) setPagodaSize('6m')
      else if (size.includes('10m')) setPagodaSize('10m')
    } else if (size.includes('rondo')) {
      setTentType('rondo')
      if (size.includes('10m')) setRondoStructure('Rondo 10m')
      else if (size.includes('15m')) setRondoStructure('Rondo 15m')
      else if (size.includes('20m')) setRondoStructure('Rondo 20m')
      else if (size.includes('25m')) setRondoStructure('Rondo 25m')

      // Extract segments if mentioned
      const segmentMatch = size.match(/(\d+)m\s+segments/)

      if (segmentMatch) {
        const additionalLength = parseInt(segmentMatch[1])

        setRondoSegments(additionalLength / 5)
      } else {
        setRondoSegments(0)
      }
    } else if (size.includes('apse')) {
      setTentType('apse')
      if (size.includes('10m')) setApseStructure('Apse End 10m')
      else if (size.includes('15m')) setApseStructure('Apse End 15m')
      else if (size.includes('20m')) setApseStructure('Apse End 20m')
      else if (size.includes('25m')) setApseStructure('Apse End 25m')

      // Extract segments if mentioned
      const segmentMatch = size.match(/(\d+)m\s+segments/)

      if (segmentMatch) {
        const additionalLength = parseInt(segmentMatch[1])

        setApseSegments(additionalLength / 5)
      } else {
        setApseSegments(0)
      }
    }

    // Show success message and regenerate quote
    setSnackbarMessage('✓ Recommendation applied! Regenerating quote...')
    setSnackbarOpen(true)

    // Wait for state updates to complete, then regenerate quote
    setTimeout(() => {
      calculateQuote()
    }, 500)
  }

  const calculateQuote = async () => {
    try {
      setLoading(true)
      setError(null)
      setQuote(null)

      const payload: Record<string, any> = {
        // Contact Information
        contactName,
        contactEmail,
        contactPhone,

        // Event Details
        eventStartDate,
        eventEndDate,
        eventVenue,
        eventType,
        customEventType: eventType === 'Other' ? customEventType : undefined,
        numberOfGuests,
        duration: calculateDuration(),

        // Structure
        tentType
      }

      // Add tent-specific data
      if (tentType === 'gardenCottage') {
        payload.gardenCottageSize = gardenCottageSize
      } else if (tentType === 'pagoda') {
        payload.pagodaSize = pagodaSize
        payload.pagodaWallType = pagodaWallType
      } else if (tentType === 'rondo') {
        payload.rondoStructure = rondoStructure
        payload.rondoSegments = rondoSegments
      } else if (tentType === 'apse') {
        payload.apseStructure = apseStructure
        payload.apseSegments = apseSegments
      }

      // Add optional fields
      if (includeFlooring) {
        payload.flooringType = flooringType
        payload.flooringArea = flooringArea
      }

      if (partitions.length > 0) {
        payload.partitions = partitions
      }

      if (Object.keys(accessoryQuantities).length > 0) {
        payload.accessoryQuantities = accessoryQuantities
      }

      const response = await fetch('/api/quotes/event-tent/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to calculate quote')
      }

      setQuote(data.quote)
    } catch (err) {
      console.error('Error calculating quote:', err)
      setError((err as Error).message || 'Failed to calculate quote')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the quote */
          body * {
            visibility: hidden;
          }

          /* Show only the quote and its children */
          #printable-quote,
          #printable-quote * {
            visibility: visible;
          }

          /* Position quote at top of page */
          #printable-quote {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          /* Hide navigation, headers, and other UI elements */
          nav,
          header,
          .MuiAppBar-root,
          .print-hide {
            display: none !important;
          }

          /* Ensure proper page breaks */
          table {
            page-break-inside: avoid;
          }

          /* Clean print layout */
          @page {
            margin: 2cm;
          }
        }
      `}</style>

      <Grid container spacing={6}>
        {/* Header */}
        <Grid size={{ xs: 12 }} className='print-hide'>
          <Card>
            <CardHeader
              title={
                <Box display='flex' alignItems='center' gap={2}>
                  <ReceiptIcon sx={{ fontSize: 32 }} />
                  <Typography variant='h4'>Event Tent Rental Quote Generator</Typography>
                </Box>
              }
              subheader='Generate instant quotes for event tent rentals with detailed pricing breakdown'
            />
          </Card>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Grid size={{ xs: 12 }} className='print-hide'>
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Loading Existing Quote */}
        {loadingExisting && (
          <Grid size={{ xs: 12 }} className='print-hide'>
            <Card>
              <CardContent>
                <Box display='flex' alignItems='center' justifyContent='center' gap={2} py={4}>
                  <CircularProgress />
                  <Typography variant='h6'>Loading existing quote...</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Live Price Summary */}
        <Grid size={{ xs: 12 }} className='print-hide'>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'sticky',
              top: 80,
              zIndex: 100
            }}
          >
            <CardContent>
              <Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={2}>
                <Box>
                  <Typography variant='overline' sx={{ opacity: 0.9 }}>
                    Live Estimate
                  </Typography>
                  <Typography variant='h3' fontWeight='bold'>
                    KSh {livePrice.total.toLocaleString()}
                  </Typography>
                  {livePrice.breakdown.length > 0 && (
                    <Typography variant='body2' sx={{ mt: 1, opacity: 0.9 }}>
                      {livePrice.breakdown.length} item(s) selected
                    </Typography>
                  )}
                </Box>
                <Box textAlign='right'>
                  {livePrice.breakdown.slice(0, 3).map((item, idx) => (
                    <Typography key={idx} variant='body2' sx={{ opacity: 0.9 }}>
                      {item.label}: KSh {item.amount.toLocaleString()}
                    </Typography>
                  ))}
                  {livePrice.breakdown.length > 3 && (
                    <Typography variant='body2' sx={{ opacity: 0.8, fontStyle: 'italic' }}>
                      +{livePrice.breakdown.length - 3} more items
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Information */}
        <Grid size={{ xs: 12 }} className='print-hide'>
          <Card>
            <CardHeader title='Contact Information' />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label='Name'
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type='email'
                    label='Email'
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type='tel'
                    label='Phone'
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Event Details */}
        <Grid size={{ xs: 12, md: 6 }} className='print-hide'>
          <Card>
            <CardHeader title='Event Details' />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type='date'
                    label='Event Start Date'
                    value={eventStartDate}
                    onChange={e => setEventStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type='date'
                    label='Event End Date'
                    value={eventEndDate}
                    onChange={e => setEventEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText={
                      eventStartDate && eventEndDate
                        ? `Duration: ${calculateDuration()} day${calculateDuration() > 1 ? 's' : ''}`
                        : ''
                    }
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label='Event Venue / Location (Optional)'
                    value={eventVenue}
                    onChange={e => setEventVenue(e.target.value)}
                  />
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>Event Type</InputLabel>
                    <Select
                      value={eventType}
                      label='Event Type'
                      onChange={e => setEventType(e.target.value)}
                      IconComponent={SelectIcon}
                    >
                      <MenuItem value='Cocktail'>Cocktail</MenuItem>
                      <MenuItem value='Theater'>Theater</MenuItem>
                      <MenuItem value='Banquet'>Banquet</MenuItem>
                      <MenuItem value='Classroom'>Classroom</MenuItem>
                      <MenuItem value='Exhibition'>Exhibition</MenuItem>
                      <MenuItem value='Other'>Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {eventType === 'Other' && (
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label='Custom Event Type'
                      value={customEventType}
                      onChange={e => setCustomEventType(e.target.value)}
                      placeholder='Enter event type'
                    />
                  </Grid>
                )}

                <Grid size={12}>
                  <TextField
                    fullWidth
                    label='Number of Guests (Pax)'
                    type='number'
                    value={numberOfGuests}
                    onChange={e => setNumberOfGuests(parseInt(e.target.value))}
                    inputProps={{ min: 10, max: 160 }}
                    helperText='Range: 10-160 guests'
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Tent Selection */}
        <Grid size={{ xs: 12, md: 6 }} className='print-hide'>
          <Card>
            <CardHeader title='Tent/Structure Selection' />
            <CardContent>
              <FormControl component='fieldset'>
                <FormLabel component='legend'>Select Tent Type</FormLabel>
                <RadioGroup
                  value={tentType}
                  onChange={e => setTentType(e.target.value as 'gardenCottage' | 'pagoda' | 'rondo' | 'apse')}
                >
                  <FormControlLabel
                    value='gardenCottage'
                    control={<Radio icon={<UncheckedIcon />} checkedIcon={<IconChecked />} />}
                    label='Garden Cottage'
                  />
                  <FormControlLabel
                    value='pagoda'
                    control={<Radio icon={<UncheckedIcon />} checkedIcon={<IconChecked />} />}
                    label='Pagoda Tent'
                  />
                  <FormControlLabel
                    value='rondo'
                    control={<Radio icon={<UncheckedIcon />} checkedIcon={<IconChecked />} />}
                    label='OmniSpace Ellipse & Rondo'
                  />
                  <FormControlLabel
                    value='apse'
                    control={<Radio icon={<UncheckedIcon />} checkedIcon={<IconChecked />} />}
                    label='OmniSpace Apse End'
                  />
                </RadioGroup>
              </FormControl>

              <Box mt={3}>
                {tentType === 'gardenCottage' && (
                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <FormControl fullWidth>
                        <InputLabel>Garden Cottage Size</InputLabel>
                        <Select
                          value={gardenCottageSize}
                          label='Garden Cottage Size'
                          onChange={e => setGardenCottageSize(e.target.value)}
                          IconComponent={SelectIcon}
                        >
                          <MenuItem value='3m'>3m x 3m (9 sqm) - KSh 5,625 total</MenuItem>
                          <MenuItem value='4m'>4m x 4m (16 sqm) - KSh 6,750 total</MenuItem>
                          <MenuItem value='5m'>5m x 5m (25 sqm) - KSh 7,875 total</MenuItem>
                          <MenuItem value='6m'>6m x 6m (36 sqm) - KSh 10,125 total</MenuItem>
                        </Select>
                      </FormControl>
                      <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                        Includes: PVC, Lighting, and Drapery
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {tentType === 'pagoda' && (
                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <FormControl fullWidth>
                        <InputLabel>Pagoda Size</InputLabel>
                        <Select
                          value={pagodaSize}
                          label='Pagoda Size'
                          onChange={e => setPagodaSize(e.target.value)}
                          IconComponent={SelectIcon}
                        >
                          <MenuItem value='3m'>3m x 3m (9 sqm)</MenuItem>
                          <MenuItem value='4m'>4m x 4m (16 sqm)</MenuItem>
                          <MenuItem value='5m'>5m x 5m (25 sqm)</MenuItem>
                          <MenuItem value='6m'>6m x 6m (36 sqm)</MenuItem>
                          <MenuItem value='10m B line'>10m B line</MenuItem>
                        </Select>
                        <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                          Includes: Wall, Lighting, and Drapery
                        </Typography>
                      </FormControl>
                    </Grid>
                    {(pagodaSize === '5m' || pagodaSize === '6m') && (
                      <Grid size={12}>
                        <FormControl component='fieldset'>
                          <FormLabel>Wall Type</FormLabel>
                          <RadioGroup
                            value={pagodaWallType}
                            onChange={e => setPagodaWallType(e.target.value as 'soft' | 'hard')}
                          >
                            <FormControlLabel
                              value='soft'
                              control={<Radio icon={<UncheckedIcon />} checkedIcon={<IconChecked />} />}
                              label='Soft Wall'
                            />
                            <FormControlLabel
                              value='hard'
                              control={<Radio icon={<UncheckedIcon />} checkedIcon={<IconChecked />} />}
                              label='Hard Wall'
                            />
                          </RadioGroup>
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                )}

                {tentType === 'rondo' && (
                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <FormControl fullWidth>
                        <InputLabel>Structure Width</InputLabel>
                        <Select
                          value={rondoStructure}
                          label='Structure Width'
                          onChange={e => setRondoStructure(e.target.value)}
                          IconComponent={SelectIcon}
                        >
                          <MenuItem value='Rondo 15m'>Rondo 15m (KSh 200,000)</MenuItem>
                          <MenuItem value='Rondo 20m'>Rondo 20m (KSh 350,000)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label='Number of 5m Segments'
                        type='number'
                        value={rondoSegments}
                        onChange={e => setRondoSegments(parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0, max: 28 }}
                        helperText='0-28 segments (0m-140m)'
                      />
                    </Grid>
                  </Grid>
                )}

                {tentType === 'apse' && (
                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <FormControl fullWidth>
                        <InputLabel>Structure Width</InputLabel>
                        <Select
                          value={apseStructure}
                          label='Structure Width'
                          onChange={e => setApseStructure(e.target.value)}
                          IconComponent={SelectIcon}
                        >
                          <MenuItem value='Apse End 15m'>Apse End 15m (KSh 150,000)</MenuItem>
                          <MenuItem value='Apse End 20m'>Apse End 20m (KSh 200,000)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label='Number of 5m Segments'
                        type='number'
                        value={apseSegments}
                        onChange={e => setApseSegments(parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0, max: 28 }}
                        helperText={`0-28 segments @ KSh 50,000 each${apseSegments > 0 ? ` = KSh ${(apseSegments * 50000).toLocaleString()}` : ''}`}
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Flooring Options */}
        <Grid size={{ xs: 12, md: 6 }} className='print-hide'>
          <Card>
            <CardHeader title='Flooring Cover (Optional)' />
            <CardContent>
              <FormControlLabel
                control={<Checkbox checked={includeFlooring} onChange={e => setIncludeFlooring(e.target.checked)} />}
                label='Include Flooring'
              />

              {includeFlooring && (
                <Grid container spacing={2} mt={1}>
                  <Grid size={12}>
                    <FormControl fullWidth>
                      <InputLabel>Flooring Type</InputLabel>
                      <Select
                        value={flooringType}
                        label='Flooring Type'
                        onChange={e => setFlooringType(e.target.value)}
                        IconComponent={SelectIcon}
                      >
                        <MenuItem value='Vinyl/Mkeka wa Mbao'>Vinyl/Mkeka wa Mbao (KSh 3,000/sqm)</MenuItem>
                        <MenuItem value='Carpeting'>Carpeting (KSh 250/sqm)</MenuItem>
                        <MenuItem value='With white sticker'>With white sticker (KSh 750/sqm)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label='Flooring Area (sqm)'
                      type='number'
                      value={flooringArea}
                      onChange={e => setFlooringArea(parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 0.5 }}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Partition Options */}
        <Grid size={{ xs: 12 }} className='print-hide'>
          <Card>
            <CardHeader
              title='Internal Walls/Partitions (Optional)'
              action={
                <Button variant='outlined' startIcon={<AddIcon />} onClick={addPartition} size='small'>
                  Add Partition
                </Button>
              }
            />
            <CardContent>
              {partitions.length === 0 ? (
                <Typography variant='body2' color='text.secondary' align='center' py={2}>
                  No partitions added. Click &quot;Add Partition&quot; to include internal walls.
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {partitions.map((partition, index) => (
                    <Grid size={{ xs: 12 }} key={index}>
                      <Paper variant='outlined' sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems='flex-start'>
                          <Grid size={12}>
                            <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
                              <Typography variant='subtitle2'>Partition #{index + 1}</Typography>
                              <Button
                                size='small'
                                color='error'
                                startIcon={<DeleteIcon />}
                                onClick={() => removePartition(index)}
                              >
                                Remove
                              </Button>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth>
                              <InputLabel>Width</InputLabel>
                              <Select
                                value={partition.width}
                                label='Width'
                                onChange={e => updatePartition(index, 'width', e.target.value)}
                                IconComponent={SelectIcon}
                              >
                                <MenuItem value='10m'>10m</MenuItem>
                                <MenuItem value='15m'>15m</MenuItem>
                                <MenuItem value='20m'>20m</MenuItem>
                                <MenuItem value='25m'>25m</MenuItem>
                                <MenuItem value='40m'>40m</MenuItem>
                                <MenuItem value='50m'>50m</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth>
                              <InputLabel>Wall Type</InputLabel>
                              <Select
                                value={partition.wallType}
                                label='Wall Type'
                                onChange={e => updatePartition(index, 'wallType', e.target.value)}
                                IconComponent={SelectIcon}
                              >
                                <MenuItem value='soft'>Soft Wall</MenuItem>
                                <MenuItem value='hard'>Hard Wall</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              fullWidth
                              label='Quantity'
                              type='number'
                              value={partition.quantity}
                              onChange={e => updatePartition(index, 'quantity', parseInt(e.target.value) || 1)}
                              inputProps={{ min: 1, max: 10 }}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Accessories */}
        <Grid size={{ xs: 12 }} className='print-hide'>
          <Card>
            <CardHeader title='Accessories (Optional)' />
            <CardContent>
              <Grid container spacing={3}>
                {availableAccessories.map(accessory => {
                  const price = ACCESSORIES_PRICING[accessory]
                  const quantity = accessoryQuantities[accessory] || 0

                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={accessory}>
                      <TextField
                        fullWidth
                        label={accessory}
                        type='number'
                        value={quantity}
                        onChange={e => handleAccessoryQuantityChange(accessory, parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0, max: 99 }}
                        helperText={`KSh ${price?.toLocaleString() || 0} each${quantity > 0 ? ` = KSh ${(price * quantity).toLocaleString()}` : ''}`}
                      />
                    </Grid>
                  )
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Calculate Button */}
        <Grid size={{ xs: 12 }} className='print-hide'>
          <Box display='flex' justifyContent='center'>
            <Button
              variant='contained'
              size='large'
              startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <CalculateIcon />}
              onClick={calculateQuote}
              disabled={loading}
              sx={{ minWidth: 250 }}
            >
              {loading ? 'Calculating...' : 'Generate Quote'}
            </Button>
          </Box>
        </Grid>

        {/* Quote Result */}
        {quote && (
          <Grid size={12}>
            <Card id='printable-quote' sx={{ bgcolor: 'primary.50', border: 2, borderColor: 'primary.main' }}>
              <CardHeader
                title={
                  <Box display='flex' alignItems='center' gap={2}>
                    <ReceiptIcon color='primary' />
                    <Typography variant='h5' color='primary'>
                      {isEditMode ? 'Edit Quote' : 'Generated Quote'}
                    </Typography>
                  </Box>
                }
                action={
                  <Box display='flex' gap={1} sx={{ '@media print': { display: 'none' } }}>
                    {isEditMode ? (
                      <>
                        <Button variant='outlined' startIcon={<CancelIcon />} onClick={cancelEditMode} color='error'>
                          Cancel
                        </Button>
                        <Button variant='contained' startIcon={<SaveIcon />} onClick={saveEditedQuote} color='success'>
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <>
                        {editQuoteId ? (
                          <Button
                            variant='outlined'
                            startIcon={saving ? <CircularProgress size={16} /> : <SaveAltIcon />}
                            onClick={updateQuote}
                            disabled={saving}
                            color='primary'
                          >
                            {saving ? 'Updating...' : 'Update Quote'}
                          </Button>
                        ) : (
                          <Button
                            variant='outlined'
                            startIcon={saving ? <CircularProgress size={16} /> : <SaveAltIcon />}
                            onClick={saveQuote}
                            disabled={saving}
                            color='success'
                          >
                            {saving ? 'Saving...' : savedQuoteNumber ? `Saved (${savedQuoteNumber})` : 'Save Quote'}
                          </Button>
                        )}
                        <Button variant='outlined' startIcon={<EditIcon />} onClick={enableEditMode}>
                          Edit Quote
                        </Button>
                        <Button variant='outlined' startIcon={<SaveAltIcon />} onClick={handleDownloadPDF}>
                          Download PDF
                        </Button>
                        <Button variant='contained' startIcon={<PrintIcon />} onClick={handlePrint}>
                          Print PDF
                        </Button>
                      </>
                    )}
                  </Box>
                }
              />
              <CardContent>
                {/* Company Header - Only visible when printing */}
                <Box sx={{ display: 'none', '@media print': { display: 'block' } }} mb={4}>
                  <Typography variant='h4' gutterBottom align='center'>
                    OmniSpace Events
                  </Typography>
                  <Typography variant='body1' align='center' gutterBottom>
                    Event Tent Rental Quote
                  </Typography>
                  <Typography variant='body2' align='center' color='text.secondary'>
                    Quote Date: {new Date().toLocaleDateString()}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                </Box>

                {/* Contact Information */}
                {quote.contactInfo &&
                  (quote.contactInfo.name || quote.contactInfo.email || quote.contactInfo.phone) && (
                    <Box mb={3}>
                      <Typography variant='h6' gutterBottom>
                        Contact Information
                      </Typography>
                      {quote.contactInfo.name && (
                        <Typography variant='body1'>
                          <strong>Name:</strong> {quote.contactInfo.name}
                        </Typography>
                      )}
                      {quote.contactInfo.email && (
                        <Typography variant='body1'>
                          <strong>Email:</strong> {quote.contactInfo.email}
                        </Typography>
                      )}
                      {quote.contactInfo.phone && (
                        <Typography variant='body1'>
                          <strong>Phone:</strong> {quote.contactInfo.phone}
                        </Typography>
                      )}
                    </Box>
                  )}

                {quote.contactInfo &&
                  (quote.contactInfo.name || quote.contactInfo.email || quote.contactInfo.phone) && (
                    <Divider sx={{ my: 3 }} />
                  )}

                {/* Event Summary */}
                <Box mb={3}>
                  <Typography variant='h6' gutterBottom>
                    Event Details
                  </Typography>
                  <Typography variant='body1'>
                    <strong>Event Type:</strong> {quote.eventDetails.eventType}
                  </Typography>
                  <Typography variant='body1'>
                    <strong>Number of Guests:</strong> {quote.eventDetails.numberOfGuests}
                  </Typography>
                  {quote.eventDetails.startDate && (
                    <Typography variant='body1'>
                      <strong>Event Dates:</strong> {new Date(quote.eventDetails.startDate).toLocaleDateString()} -{' '}
                      {new Date(quote.eventDetails.endDate || quote.eventDetails.startDate).toLocaleDateString()}
                    </Typography>
                  )}
                  {quote.eventDetails.duration > 1 && (
                    <Typography variant='body1'>
                      <strong>Duration:</strong> {quote.eventDetails.duration} days
                    </Typography>
                  )}
                  {quote.eventDetails.venue && (
                    <Typography variant='body1'>
                      <strong>Venue:</strong> {quote.eventDetails.venue}
                    </Typography>
                  )}
                  {quote.structureSummary && (
                    <Typography variant='body1' sx={{ mt: 1 }}>
                      <strong>Selected Structure:</strong> {quote.structureSummary}
                    </Typography>
                  )}
                </Box>

                {/* Structure Recommendation */}
                {quote.recommendedStructure && (
                  <Box mb={3}>
                    <Alert
                      severity='info'
                      icon={false}
                      action={
                        <Button
                          size='small'
                          variant='contained'
                          color='primary'
                          onClick={applyRecommendation}
                          sx={{ '@media print': { display: 'none' } }}
                        >
                          Apply Recommendation
                        </Button>
                      }
                    >
                      <Typography variant='subtitle2' gutterBottom>
                        <strong>Recommendation:</strong>
                      </Typography>
                      <Typography variant='body2' mb={2}>
                        {quote.recommendedStructure}
                      </Typography>

                      {/* Auto-generated Structure Specifications */}
                      {quote.recommendedSpecs && (
                        <Box
                          mt={2}
                          sx={{
                            bgcolor: 'background.paper',
                            p: 2,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant='subtitle2' gutterBottom color='primary'>
                            <strong>Recommended Structure Specifications:</strong>
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant='caption' color='text.secondary' display='block'>
                                Size
                              </Typography>
                              <Typography variant='body2'>
                                <strong>{quote.recommendedSpecs.size}</strong>
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant='caption' color='text.secondary' display='block'>
                                Area
                              </Typography>
                              <Typography variant='body2'>
                                <strong>{quote.recommendedSpecs.areaSqm} sqm</strong>
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant='caption' color='text.secondary' display='block'>
                                Ridge Height
                              </Typography>
                              <Typography variant='body2'>
                                <strong>{quote.recommendedSpecs.ridgeHeight}</strong>
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant='caption' color='text.secondary' display='block'>
                                Side Height
                              </Typography>
                              <Typography variant='body2'>
                                <strong>{quote.recommendedSpecs.sideHeight}</strong>
                              </Typography>
                            </Grid>
                          </Grid>

                          {/* Reasoning */}
                          <Box mt={2} pt={2} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant='caption' color='text.secondary' display='block' gutterBottom>
                              <strong>Why this recommendation?</strong>
                            </Typography>
                            <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic' }}>
                              {quote.recommendedSpecs.reasoning}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Alert>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Line Items */}
                <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                  <Typography variant='h6'>Quote Breakdown</Typography>
                  {isEditMode && (
                    <Button size='small' variant='outlined' startIcon={<AddIcon />} onClick={addCustomLineItem}>
                      Add Item
                    </Button>
                  )}
                </Box>
                <TableContainer component={Paper} variant='outlined'>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Description</strong>
                        </TableCell>
                        <TableCell align='right'>
                          <strong>Qty</strong>
                        </TableCell>
                        <TableCell align='right'>
                          <strong>Unit Price (KSh)</strong>
                        </TableCell>
                        <TableCell align='right'>
                          <strong>Total (KSh)</strong>
                        </TableCell>
                        {isEditMode && (
                          <TableCell align='center'>
                            <strong>Actions</strong>
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(isEditMode ? editableLineItems : quote.lineItems).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {isEditMode ? (
                              <TextField
                                fullWidth
                                size='small'
                                value={item.description}
                                onChange={e => updateLineItem(index, 'description', e.target.value)}
                              />
                            ) : (
                              item.description
                            )}
                          </TableCell>
                          <TableCell align='right'>
                            {isEditMode ? (
                              <TextField
                                type='number'
                                size='small'
                                value={item.quantity}
                                onChange={e => updateLineItem(index, 'quantity', e.target.value)}
                                inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                sx={{ width: 80 }}
                              />
                            ) : (
                              item.quantity
                            )}
                          </TableCell>
                          <TableCell align='right'>
                            {isEditMode ? (
                              <TextField
                                type='number'
                                size='small'
                                value={item.unitPrice}
                                onChange={e => updateLineItem(index, 'unitPrice', e.target.value)}
                                inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                sx={{ width: 120 }}
                              />
                            ) : (
                              item.unitPrice.toLocaleString()
                            )}
                          </TableCell>
                          <TableCell align='right'>
                            {isEditMode ? item.totalPrice.toLocaleString() : item.totalPrice.toLocaleString()}
                          </TableCell>
                          {isEditMode && (
                            <TableCell align='center'>
                              <Button
                                size='small'
                                color='error'
                                onClick={() => removeLineItem(index)}
                                startIcon={<DeleteIcon />}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={isEditMode ? 4 : 3} align='right'>
                          <Typography variant='body1'>
                            <strong>Subtotal:</strong>
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body1'>
                            <strong>
                              KSh{' '}
                              {(isEditMode
                                ? editableLineItems.reduce((sum, item) => sum + item.totalPrice, 0)
                                : quote.subtotal
                              ).toLocaleString()}
                            </strong>
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={isEditMode ? 4 : 3} align='right'>
                          <Typography variant='body1'>
                            <strong>VAT (16%):</strong>
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body1'>
                            <strong>
                              KSh{' '}
                              {(isEditMode
                                ? editableLineItems.reduce((sum, item) => sum + item.totalPrice, 0) * 0.16
                                : quote.vat
                              ).toLocaleString()}
                            </strong>
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: 'primary.50' }}>
                        <TableCell colSpan={isEditMode ? 4 : 3} align='right'>
                          <Typography variant='h6'>
                            <strong>TOTAL:</strong>
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='h6' color='primary'>
                            <strong>
                              KSh{' '}
                              {(isEditMode
                                ? editableLineItems.reduce((sum, item) => sum + item.totalPrice, 0) * 1.16
                                : quote.total
                              ).toLocaleString()}
                            </strong>
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box mt={3}>
                  <Alert severity='info'>
                    This quote is valid for 30 days. Final pricing may vary based on availability and specific
                    requirements.
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* BOQ Generation Dialog */}
      <Dialog open={boqDialogOpen} onClose={() => setBOQDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Generate Bill of Quantities (BOQ)</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography variant='body1' gutterBottom>
              Quote <strong>{savedQuoteNumber}</strong> has been saved successfully!
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
              Would you like to generate a professional Bill of Quantities (BOQ) document for this quote?
            </Typography>
            <Box mt={2} p={2} sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant='caption' display='block' gutterBottom>
                <strong>BOQ includes:</strong>
              </Typography>
              <Typography variant='caption' display='block'>
                • Itemized breakdown by category
              </Typography>
              <Typography variant='caption' display='block'>
                • Professional numbering system
              </Typography>
              <Typography variant='caption' display='block'>
                • Section subtotals and grand total
              </Typography>
              <Typography variant='caption' display='block'>
                • Print-ready format for clients
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBOQDialogOpen(false)} disabled={generatingBOQ}>
            Skip for Now
          </Button>
          <Button
            onClick={generateBOQ}
            variant='contained'
            color='primary'
            disabled={generatingBOQ}
            startIcon={generatingBOQ ? <CircularProgress size={20} /> : <DescriptionIcon />}
          >
            {generatingBOQ ? 'Generating...' : 'Generate BOQ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}
