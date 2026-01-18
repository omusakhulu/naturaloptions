'use client'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'

import toast from 'react-hot-toast'

export default function POSTerminalModern() {
  // Refs
  const scanInputRef = useRef(null)

  // Cart state
  const [cart, setCart] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [scanInput, setScanInput] = useState('')
  const [discount, setDiscount] = useState({ type: 'none', value: 0 })
  const [customer, setCustomer] = useState(null)

  // Modal state
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [discountInput, setDiscountInput] = useState('')
  const [discountType, setDiscountType] = useState('percentage')

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountTendered, setAmountTendered] = useState('')
  const [splitPayments, setSplitPayments] = useState([])
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [mpesaPrompt, setMpesaPrompt] = useState({ status: 'idle', checkoutRequestId: '', message: '' })
  const [mpesaBusy, setMpesaBusy] = useState(false)
  const [pesapalOrder, setPesapalOrder] = useState({ status: 'idle', orderTrackingId: '', redirectUrl: '', message: '' })
  const [pesapalBusy, setPesapalBusy] = useState(false)

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('')

  // Shift/Cash Drawer State
  const [shift, setShift] = useState({
    isOpen: false,
    startTime: null,
    openingFloat: 0,
    sales: [], // Track sales in this shift
    expectedCash: 0
  })

  const [showParkedSales, setShowParkedSales] = useState(false)
  const [parkedSales, setParkedSales] = useState([])
  const [loadingParked, setLoadingParked] = useState(false)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [shiftModalMode, setShiftModalMode] = useState('open') // 'open' | 'close'
  const [shiftInputAmount, setShiftInputAmount] = useState('')
  const [shiftClosingNotes, setShiftClosingNotes] = useState('')

  // Payout State
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutReason, setPayoutReason] = useState('')

  const normalizeKenyanPhone = (input) => {
    const digits = String(input || '').replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
    if (digits.startsWith('254') && digits.length === 12) return digits
    if (digits.startsWith('7') && digits.length === 9) return `254${digits}`
    return digits
  }

  // Load shift from local storage on mount
  useEffect(() => {
    const savedShift = localStorage.getItem('pos_active_shift')

    if (savedShift) {
      setShift(JSON.parse(savedShift))
    } else {
      // If no shift is open, prompt to open one
      setShiftModalMode('open')
      setShowShiftModal(true)
    }
  }, [])

  // Save shift to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('pos_active_shift', JSON.stringify(shift))
  }, [shift])

  // Shift Management Functions
  const handleOpenShift = () => {
    const floatAmount = parseFloat(shiftInputAmount)

    if (isNaN(floatAmount) || floatAmount < 0) {
      toast.error('Please enter a valid opening float amount')

      return
    }

    const newShift = {
      isOpen: true,
      startTime: new Date().toISOString(),
      openingFloat: floatAmount,
      sales: [],
      expectedCash: floatAmount
    }

    setShift(newShift)
    setShowShiftModal(false)
    setShiftInputAmount('')
    toast.success(`Shift opened with KSh ${floatAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`)
  }

  const handleCloseShift = () => {
    const actualCash = parseFloat(shiftInputAmount)

    if (isNaN(actualCash) || actualCash < 0) {
      toast.error('Please enter the actual cash count')

      return
    }

    // Calculate totals using the same logic as shiftStats
    const validSales = shift.sales.filter(s => s.type !== 'payout')
    const payouts = shift.sales.filter(s => s.type === 'payout')

    const cashSales = validSales
      .filter(s => s.method === 'cash' || s.method === 'split')
      .reduce((sum, s) => sum + (s.cashAmount || s.total), 0)

    const totalPayouts = payouts.reduce((sum, s) => sum + Math.abs(s.cashAmount), 0)

    const expectedCash = shift.openingFloat + cashSales - totalPayouts
    const difference = actualCash - expectedCash

    // Here you would typically send this data to your backend
    console.log('📝 Closing Shift Report:', {
      startTime: shift.startTime,
      endTime: new Date().toISOString(),
      openingFloat: shift.openingFloat,
      cashSales,
      totalPayouts,
      expectedCash,
      actualCash,
      difference,
      notes: shiftClosingNotes
    })

    // Create a closing report/receipt (simulated)
    toast.success(`Shift closed. ${difference >= 0 ? 'Over' : 'Short'}: KSh ${Math.abs(difference).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`)
  }

  const handlePayout = async () => {
    const amount = parseFloat(payoutAmount)

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')

      return
    }

    if (!payoutReason.trim()) {
      toast.error('Please enter a reason')

      return
    }

    try {
      // 1. Save expense to backend
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          category: 'Payout',
          accountId: 'cash_drawer',
          date: new Date(),
          note: `POS Payout: ${payoutReason}`
        })
      })

      // 2. Update shift
      setShift(prev => ({
        ...prev,
        sales: [...prev.sales, {
          id: `PAYOUT-${Date.now()}`,
          total: -amount,
          method: 'cash',
          cashAmount: -amount,
          type: 'payout',
          note: payoutReason,
          timestamp: new Date().toISOString()
        }]
      }))

      toast.success(`Payout of KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })} recorded`)
      setShowPayoutModal(false)
      setPayoutAmount('')
      setPayoutReason('')
    } catch (error) {
      console.error('Payout error:', error)
      toast.error('Failed to record payout')
    }
  }

  // Calculate current shift stats
  const shiftStats = useMemo(() => {
    if (!shift.isOpen) return null

    const validSales = shift.sales.filter(s => s.type !== 'payout')
    const payouts = shift.sales.filter(s => s.type === 'payout')

    const totalSales = validSales.reduce((sum, s) => sum + s.total, 0)

    const cashSales = validSales
      .filter(s => s.method === 'cash' || s.method === 'split')
      .reduce((sum, s) => sum + (s.cashAmount || s.total), 0)

    const cardSales = validSales
      .filter(s => s.method === 'card' || s.method === 'credit_card' || s.method === 'debit_card')
      .reduce((sum, s) => sum + s.total, 0)

    const otherSales = totalSales - cashSales - cardSales

    const totalPayouts = payouts.reduce((sum, s) => sum + Math.abs(s.cashAmount), 0)

    return {
      totalSales,
      cashSales,
      cardSales,
      otherSales,
      totalPayouts,
      transactionCount: validSales.length
    }
  }, [shift])

  // Data state
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([{ id: 'all', name: 'All', icon: '🏪' }])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        console.log('🔄 Fetching products from API...')
        const response = await fetch('/api/pos/products')
        const data = await response.json()

        console.log('📦 Products API response:', data)

        if (data.success && data.products) {
          setProducts(data.products)
          console.log(`✅ Loaded ${data.products.length} products`)

          if (data.products.length === 0) {
            toast.error('No products found in database')
          }
        } else {
          console.error('❌ Failed to load products:', data.error)
          toast.error(data.error || 'Failed to load products')
        }
      } catch (error) {
        console.error('❌ Error fetching products:', error)
        toast.error('Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('🔄 Fetching categories from API...')
        const response = await fetch('/api/pos/categories')
        const data = await response.json()

        console.log('📂 Categories API response:', data)

        if (data.success && data.categories && data.categories.length > 0) {
          // Add icons to categories
          const categoriesWithIcons = data.categories.map((cat, idx) => {
            const icons = ['🍽️', '🥗', '🥤', '🍰', '⭐', '🍕', '🍔', '🍗', '🥘', '🍜']

            return {
              id: cat.id,
              name: cat.name,
              icon: icons[idx % icons.length],
              count: cat.count
            }
          })

          // Only add "All" if there are categories
          setCategories([{ id: 'all', name: 'All', icon: '🏪' }, ...categoriesWithIcons])
          console.log(`✅ Loaded ${categoriesWithIcons.length} categories`)
        } else {
          // No categories, keep just the default
          console.log('⚠️ No categories found')
          setCategories([{ id: 'all', name: 'All', icon: '🏪' }])
        }
      } catch (error) {
        console.error('❌ Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Fetch customers from database
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/pos/customers')
        const data = await response.json()

        if (data.success && data.customers) {
          setCustomers(data.customers)
        }
      } catch (error) {
        console.error('Error fetching customers:', error)
      }
    }

    fetchCustomers()
  }, [])

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products

    if (selectedCategory !== 'All' && selectedCategory.toLowerCase() !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory.toLowerCase())
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()

      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [selectedCategory, searchQuery])

  // State for item notes
  const [noteForItem, setNoteForItem] = useState({})
  const [activeNoteId, setActiveNoteId] = useState(null)

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }, [cart])

  const discountAmount = useMemo(() => {
    if (discount.type === 'percentage') {
      return (subtotal * discount.value) / 100
    } else if (discount.type === 'fixed') {
      return Math.min(discount.value, subtotal)
    }

    return 0
  }, [discount, subtotal])

  const tax = useMemo(() => {
    return (subtotal - discountAmount) * 0.08 // 8% tax
  }, [subtotal, discountAmount])

  const total = useMemo(() => {
    return subtotal - discountAmount + tax
  }, [subtotal, discountAmount, tax])

  // Cart functions
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)

    if (existing) {
      updateQuantity(product.id, existing.quantity + 1)
    } else {
      setCart([...cart, { ...product, quantity: 1, note: '' }])
      toast.success(`${product.name} added to cart`)
    }
  }

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ))
    }
  }

  const removeFromCart = (id) => {
    const item = cart.find(i => i.id === id)

    setCart(cart.filter(item => item.id !== id))

    if (item) {
      toast.success(`${item.name} removed from cart`)
    }
  }

  const updateItemNote = (id, note) => {
    setCart(cart.map(item =>
      item.id === id ? { ...item, note } : item
    ))
  }

  const handleScan = () => {
    const sku = scanInput.trim().toUpperCase()

    if (!sku) {
      toast.error('Please enter a SKU or scan a barcode')

      return
    }

    // Search for product by SKU (exact match or partial match)
    const product = products.find(p =>
      p.sku?.toUpperCase() === sku ||
      p.sku?.toUpperCase().includes(sku)
    )

    if (product) {
      addToCart(product)
      setScanInput('') // Clear scan input after successful scan
      toast.success(`${product.name} added!`)

      // Refocus scan input for continuous scanning
      setTimeout(() => {
        scanInputRef.current?.focus()
      }, 100)
    } else {
      toast.error(`Product with SKU "${sku}" not found`)

      // Don't clear input so user can correct it
    }
  }

  const handleScanKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleScan()
    }
  }

  const clearCart = () => {
    if (cart.length === 0) return

    if (confirm('Clear all items from cart?')) {
      setCart([])
      setDiscount({ type: 'none', value: 0 })
      setCustomer(null)
      toast.success('Cart cleared')
    }
  }

  const saveOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    try {
      const response = await fetch('/api/pos/parked-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          subtotal,
          discountAmount,
          tax,
          total,
          customer,
          notes: '' // Could add a prompt for notes
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Sale parked successfully')
        setCart([])
        setCustomer(null)
        setDiscount({ type: 'none', value: 0 })
      } else {
        toast.error('Failed to park sale')
      }
    } catch (error) {
      console.error('Error parking sale:', error)
      toast.error('Connection error')
    }
  }

  const fetchParkedSales = async () => {
    setLoadingParked(true)
    try {
      const response = await fetch('/api/pos/parked-sales')
      const data = await response.json()
      if (data.success) {
        setParkedSales(data.parkedSales)
      }
    } catch (error) {
      console.error('Error fetching parked sales:', error)
    } finally {
      setLoadingParked(false)
    }
  }

  const loadParkedSale = async (parkedSale) => {
    try {
      const items = JSON.parse(parkedSale.cartItems)
      setCart(items)
      setCustomer(parkedSale.customer)
      setDiscount({ type: 'fixed', value: parseFloat(parkedSale.discountAmount || 0) })
      
      // Delete the parked sale after loading
      await fetch(`/api/pos/parked-sales?id=${parkedSale.id}`, { method: 'DELETE' })
      setShowParkedSales(false)
      toast.success('Parked sale loaded')
    } catch (error) {
      console.error('Error loading parked sale:', error)
      toast.error('Failed to load parked sale')
    }
  }

  const totalPaid = useMemo(() => {
    return splitPayments.reduce((sum, payment) => {
      const rawStatus = String(payment?.status || '').toUpperCase()
      const isCompleted = !rawStatus || rawStatus === 'COMPLETED'
      return sum + (isCompleted ? payment.amount : 0)
    }, 0)
  }, [splitPayments])

  const remainingBalance = useMemo(() => {
    return total - totalPaid
  }, [total, totalPaid])

  const change = useMemo(() => {
    if (paymentMethod === 'cash' && amountTendered) {
      const tendered = parseFloat(amountTendered)

      return tendered - total
    }

    return 0
  }, [paymentMethod, amountTendered, total])

  const addSplitPayment = () => {
    const amount = parseFloat(currentPaymentAmount)

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')

      return
    }

    if (amount > remainingBalance) {
      toast.error(`Amount cannot exceed remaining balance of KSh ${remainingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`)

      return
    }

    const newPayment = {
      id: Date.now(),
      method: paymentMethod,
      amount: amount,
      status: 'COMPLETED'
    }

    setSplitPayments([...splitPayments, newPayment])
    setCurrentPaymentAmount('')
    toast.success(`KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })} added via ${paymentMethod}`)

    // If fully paid, show success
    if (amount === remainingBalance) {
      toast.success('Payment complete!')
    }
  }

  const removeSplitPayment = (id) => {
    setSplitPayments(splitPayments.filter(p => p.id !== id))
    toast.success('Payment removed')
  }

  const clearSplitPayments = () => {
    setSplitPayments([])
    setCurrentPaymentAmount('')
    setPaymentReference('')
    setMpesaPrompt({ status: 'idle', checkoutRequestId: '', message: '' })
    setPesapalOrder({ status: 'idle', orderTrackingId: '', redirectUrl: '', message: '' })
  }

  const startPesapalCheckout = useCallback(async () => {
    const amount = parseFloat(currentPaymentAmount)

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > remainingBalance) {
      toast.error(`Amount cannot exceed remaining balance of KSh ${remainingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`)
      return
    }

    setPesapalBusy(true)
    setPesapalOrder({ status: 'pending', orderTrackingId: '', redirectUrl: '', message: 'Creating Pesapal checkout...' })

    try {
      const response = await fetch('/api/payments/pesapal/submitorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'KES',
          description: `POS ${paymentMethod} payment`,
          customer: customer ? {
            email: customer?.email || undefined,
            phone: customer?.phone || undefined,
            firstName: customer?.firstName || undefined,
            lastName: customer?.lastName || undefined,
            address: customer?.address || undefined,
            city: customer?.city || undefined
          } : undefined
        })
      })

      const data = await response.json()
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create Pesapal order')
      }

      const orderTrackingId = String(data?.orderTrackingId || '').trim()
      const redirectUrl = String(data?.redirectUrl || '').trim()

      if (!orderTrackingId || !redirectUrl) {
        throw new Error('Pesapal response missing orderTrackingId/redirectUrl')
      }

      try {
        localStorage.setItem(`pos_pesapal_${orderTrackingId}`, JSON.stringify({ amount, method: paymentMethod }))
      } catch (e) {
        console.warn('Could not store Pesapal pending payment in localStorage', e)
      }

      setSplitPayments(prev => ([
        ...prev,
        {
          id: Date.now(),
          method: paymentMethod,
          amount,
          status: 'PENDING',
          reference: orderTrackingId,
          orderTrackingId,
          gateway: 'pesapal'
        }
      ]))

      setPesapalOrder({ status: 'pending', orderTrackingId, redirectUrl, message: 'Checkout opened. Complete payment, then click Verify.' })
      setCurrentPaymentAmount('')

      if (typeof window !== 'undefined') {
        window.open(redirectUrl, '_blank', 'noopener,noreferrer')
      }

      toast.success('Pesapal checkout opened')
    } catch (error) {
      console.error('Pesapal checkout error:', error)
      toast.error(error?.message || 'Pesapal checkout failed')
      setPesapalOrder({ status: 'failed', orderTrackingId: '', redirectUrl: '', message: error?.message || 'Pesapal checkout failed' })
    } finally {
      setPesapalBusy(false)
    }
  }, [currentPaymentAmount, remainingBalance, paymentMethod, customer])

  const verifyPesapalOrder = useCallback(async (orderTrackingId) => {
    const trackingId = String(orderTrackingId || '').trim()
    if (!trackingId) {
      toast.error('Missing Pesapal order tracking id')
      return
    }

    setPesapalBusy(true)
    setPesapalOrder(prev => ({ ...prev, status: 'verifying', orderTrackingId: trackingId, message: 'Checking Pesapal status...' }))

    try {
      const response = await fetch('/api/payments/pesapal/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderTrackingId: trackingId })
      })

      const data = await response.json()
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to query Pesapal status')
      }

      const status = String(data?.status || 'PENDING').toUpperCase()
      const statusDescription = String(data?.statusDescription || '')
      const confirmationCode = data?.confirmationCode ? String(data.confirmationCode) : ''
      const paymentMethodName = data?.paymentMethod ? String(data.paymentMethod) : ''

      setSplitPayments(prev => prev.map(p => {
        const ref = String(p?.reference || p?.orderTrackingId || '')
        if (ref !== trackingId) return p
        return {
          ...p,
          status,
          confirmationCode: confirmationCode || p?.confirmationCode,
          providerPaymentMethod: paymentMethodName || p?.providerPaymentMethod
        }
      }))

      if (status === 'COMPLETED') {
        toast.success('Pesapal payment confirmed')
        try {
          localStorage.removeItem(`pos_pesapal_${trackingId}`)
        } catch (e) {
          console.warn('Could not remove Pesapal pending payment in localStorage', e)
        }
        setPesapalOrder(prev => ({
          ...prev,
          status: 'success',
          orderTrackingId: trackingId,
          message: confirmationCode ? `Confirmed (${confirmationCode})` : 'Confirmed'
        }))
      } else if (status === 'FAILED') {
        toast.error('Pesapal payment failed')
        setPesapalOrder(prev => ({ ...prev, status: 'failed', orderTrackingId: trackingId, message: statusDescription || 'Payment failed' }))
      } else {
        toast('Pesapal payment still pending')
        setPesapalOrder(prev => ({ ...prev, status: 'pending', orderTrackingId: trackingId, message: statusDescription || 'Still pending. Please try again shortly.' }))
      }

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        if (url.searchParams.get('pesapalOrderTrackingId')) {
          url.searchParams.delete('pesapalOrderTrackingId')
          url.searchParams.delete('pesapalMerchantReference')
          window.history.replaceState({}, '', url.toString())
        }
      }
    } catch (error) {
      console.error('Pesapal verify error:', error)
      toast.error(error?.message || 'Pesapal verification failed')
      setPesapalOrder(prev => ({ ...prev, status: 'failed', message: error?.message || 'Verification failed' }))
    } finally {
      setPesapalBusy(false)
    }
  }, [])

  const processPayment = async () => {
    if (!shift.isOpen) {
      toast.error('Shift is closed. Please open a shift to process payments.')
      setShiftModalMode('open')
      setShowShiftModal(true)

      return
    }

    if (cart.length === 0) {
      toast.error('Cart is empty')

      return
    }

    // Check if using split payments
    if (splitPayments.length > 0) {
      if (remainingBalance > 0) {
        toast.error(`Insufficient payment. KSh ${remainingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })} remaining`)

        return
      }

      // Process split payment - save to database
      try {
        const saleData = {
          items: cart,
          subtotal: subtotal,
          discount: discount,
          discountAmount: discountAmount,
          tax: tax,
          total: total,
          customer: customer,
          payments: splitPayments,
          paymentMethod: 'split'
        }

        console.log('💾 Saving split payment sale:', saleData)

        const response = await fetch('/api/pos/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(saleData)
        })

        const result = await response.json()

        if (result.success) {
          console.log('✅ Sale saved:', result.sale)

          const message = result.sale.wooOrderId
            ? `Sale #${result.sale.saleNumber} completed! WooCommerce Order #${result.sale.wooOrderId} created.`
            : `Sale #${result.sale.saleNumber} completed with ${splitPayments.length} payment method(s)!`

          toast.success(message)

          // Record to active shift
          setShift(prev => ({
            ...prev,
            sales: [...prev.sales, {
              id: result.sale.id,
              total: result.sale.totalAmount || total,
              method: 'split',
              cashAmount: splitPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0),
              timestamp: new Date().toISOString()
            }]
          }))

          // Clear everything
          setCart([])
          setDiscount({ type: 'none', value: 0 })
          setCustomer(null)
          setShowPaymentModal(false)
          setPaymentMethod('cash')
          setAmountTendered('')
          setSplitPayments([])
          setCurrentPaymentAmount('')
        } else {
          toast.error(`Failed to save sale: ${result.error}`)
        }
      } catch (error) {
        console.error('❌ Error saving sale:', error)
        toast.error('Failed to save sale to database')
      }

      return
    }

    // Single payment method
    if (paymentMethod === 'cash' && (!amountTendered || parseFloat(amountTendered) < total)) {
      toast.error('Insufficient cash amount')

      return
    }

    // Process single payment - save to database
    try {
      const saleData = {
        items: cart,
        subtotal: subtotal,
        discount: discount,
        discountAmount: discountAmount,
        tax: tax,
        total: total,
        customer: customer,
        payments: null,
        paymentMethod: paymentMethod
      }

      console.log('💾 Saving single payment sale:', saleData)

      const response = await fetch('/api/pos/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData)
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Sale saved:', result.sale)

        const message = result.sale.wooOrderId
          ? `Sale #${result.sale.saleNumber} completed! WooCommerce Order #${result.sale.wooOrderId} created.`
          : `Sale #${result.sale.saleNumber} completed!`

        toast.success(message)

        // Record to active shift
        setShift(prev => ({
          ...prev,
          sales: [...prev.sales, {
            id: result.sale.id,
            total: result.sale.totalAmount || total,
            method: paymentMethod,
            cashAmount: paymentMethod === 'cash' ? (result.sale.totalAmount || total) : 0,
            timestamp: new Date().toISOString()
          }]
        }))

        // Clear everything
        setCart([])
        setDiscount({ type: 'none', value: 0 })
        setCustomer(null)
        setShowPaymentModal(false)
        setPaymentMethod('cash')
        setAmountTendered('')
        setSplitPayments([])
        setCurrentPaymentAmount('')
      } else {
        toast.error(`Failed to save sale: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Error saving sale:', error)
      toast.error('Failed to save sale to database')
    }
  }

  const applyDiscount = () => {
    const value = parseFloat(discountInput)

    if (isNaN(value) || value < 0) {
      toast.error('Invalid discount value')

      return
    }

    if (discountType === 'percentage' && value > 100) {
      toast.error('Percentage cannot exceed 100%')

      return
    }

    setDiscount({ type: discountType, value })
    setShowDiscountModal(false)
    setDiscountInput('')
    toast.success('Discount applied')
  }

  const removeDiscount = () => {
    setDiscount({ type: 'none', value: 0 })
    toast.success('Discount removed')
  }

  const selectCustomer = (cust) => {
    setCustomer(cust)
    setShowCustomerModal(false)
    setCustomerSearch('')
    toast.success(`Customer ${cust.name} linked`)
  }

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers
    const query = customerSearch.toLowerCase()

    return customers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.email.toLowerCase().includes(query)
    )
  }, [customerSearch, customers])

  const startMpesaPromptAndVerify = async () => {
    const amount = parseFloat(currentPaymentAmount)
    const phone = normalizeKenyanPhone(mpesaPhone)

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')

      return
    }

    if (amount > remainingBalance) {
      toast.error(`Amount cannot exceed remaining balance of KSh ${remainingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`)

      return
    }

    if (!phone) {
      toast.error('Please enter a valid M-PESA phone number')

      return
    }

    setMpesaBusy(true)
    setMpesaPrompt({ status: 'prompting', checkoutRequestId: '', message: 'Sending prompt...' })
    try {
      const stkRes = await fetch('/api/payments/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          amount,
          accountReference: `POS-${Date.now()}`,
          transactionDesc: 'POS Payment'
        })
      })
      const stkData = await stkRes.json()

      if (!stkData?.success) {
        throw new Error(stkData?.error || stkData?.details || 'Failed to send prompt')
      }

      const checkoutRequestId = String(stkData?.CheckoutRequestID || '')
      if (!checkoutRequestId) throw new Error('M-PESA did not return CheckoutRequestID')

      setMpesaPrompt({ status: 'pending', checkoutRequestId, message: 'Prompt sent. Waiting for customer...' })

      let lastStatus = null
      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise(r => setTimeout(r, 3000))
        const qRes = await fetch('/api/payments/mpesa/stkquery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestId })
        })
        const qData = await qRes.json()

        if (!qData?.success) {
          lastStatus = qData
          continue
        }

        lastStatus = qData
        if (qData?.isSuccess) {
          setMpesaPrompt({ status: 'success', checkoutRequestId, message: 'Payment confirmed.' })
          setSplitPayments(prev => ([
            ...prev,
            {
              id: Date.now(),
              method: 'mpesa',
              amount,
              status: 'COMPLETED',
              reference: checkoutRequestId,
              phone
            }
          ]))
          setCurrentPaymentAmount('')
          toast.success('M-PESA payment verified and added')
          return
        }

        const resultCode = String(qData?.ResultCode ?? '')
        if (resultCode && resultCode !== '0') {
          setMpesaPrompt({ status: 'failed', checkoutRequestId, message: qData?.ResultDesc || 'Payment failed/cancelled.' })
          toast.error(qData?.ResultDesc || 'M-PESA payment failed/cancelled')
          return
        }
      }

      setMpesaPrompt({
        status: 'timeout',
        checkoutRequestId,
        message: lastStatus?.ResultDesc || 'Timed out waiting for confirmation. You can try again.'
      })
      toast.error('Timed out waiting for M-PESA confirmation')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Failed to send M-PESA prompt')
      setMpesaPrompt({ status: 'failed', checkoutRequestId: '', message: 'Failed to send prompt.' })
    } finally {
      setMpesaBusy(false)
    }
  }

  const handleAddPayment = async () => {
    if (paymentMethod === 'mpesa') {
      await startMpesaPromptAndVerify()
      return
    }

    if (paymentMethod === 'card' || paymentMethod === 'bank') {
      const ref = String(paymentReference || '').trim()

      if (ref) {
        const amount = parseFloat(currentPaymentAmount)
        if (!amount || amount <= 0) {
          toast.error('Please enter a valid amount')
          return
        }

        if (amount > remainingBalance) {
          toast.error(`Amount cannot exceed remaining balance of KSh ${remainingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`)
          return
        }

        setSplitPayments(prev => ([
          ...prev,
          { id: Date.now(), method: paymentMethod, amount, status: 'COMPLETED', reference: ref }
        ]))
        setCurrentPaymentAmount('')
        setPaymentReference('')
        toast.success(`Payment added and marked verified (${paymentMethod})`)
        return
      }

      await startPesapalCheckout()
      return
    }

    addSplitPayment()
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    const trackingId = url.searchParams.get('pesapalOrderTrackingId')

    if (!trackingId) return

    let saved = null
    try {
      const raw = localStorage.getItem(`pos_pesapal_${trackingId}`)
      saved = raw ? JSON.parse(raw) : null
    } catch (e) {
      console.warn('Could not read Pesapal pending payment from localStorage', e)
    }

    if (saved?.amount && saved?.method) {
      setSplitPayments(prev => {
        const exists = prev.some(p => String(p?.reference || p?.orderTrackingId || '') === String(trackingId))
        if (exists) return prev
        return ([
          ...prev,
          {
            id: Date.now(),
            method: saved.method,
            amount: Number(saved.amount),
            status: 'PENDING',
            reference: String(trackingId),
            orderTrackingId: String(trackingId),
            gateway: 'pesapal'
          }
        ])
      })
    }

    setPesapalOrder(prev => ({ ...prev, status: 'pending', orderTrackingId: String(trackingId), message: 'Returned from Pesapal. Verifying...' }))
    verifyPesapalOrder(String(trackingId))
  }, [verifyPesapalOrder])

  useEffect(() => {
    if (paymentMethod === 'mpesa') {
      setPaymentReference('')
      if (!mpesaPhone) {
        const candidate = customer?.phone || ''
        if (candidate) setMpesaPhone(candidate)
      }
    }
    if (paymentMethod === 'card' || paymentMethod === 'bank') {
      setMpesaPrompt({ status: 'idle', checkoutRequestId: '', message: '' })
    }
  }, [paymentMethod, customer, mpesaPhone])

  return (
    <div className='h-screen flex flex-col bg-gray-50 overflow-hidden'>
      {/* Header */}
      <header className='bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg'>
        <div className='px-4 py-3 flex items-center justify-between'>
          <div>
            <h1 className='text-xl md:text-2xl font-bold'>Natural Options POS</h1>
            <p className='text-xs md:text-sm text-indigo-100'>Terminal #1 - Main Register</p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => {
                setShiftModalMode(shift.isOpen ? 'close' : 'open')
                setShowShiftModal(true)
              }}
              className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition font-medium ${
                shift.isOpen
                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-100 border border-green-500/30'
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-500/30'
              }`}
            >
              <i className={`text-lg ${shift.isOpen ? 'tabler-lock-open' : 'tabler-lock'}`} />
              <span>{shift.isOpen ? 'Shift Open' : 'Shift Closed'}</span>
            </button>
            <button className='hidden md:flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm transition'>
              <i className='tabler-user-circle text-lg' />
              <span>Cashier</span>
            </button>
            <button className='bg-white/20 hover:bg-white/30 p-2 rounded-lg transition'>
              <i className='tabler-settings text-xl' />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className='flex-1 flex flex-col lg:flex-row overflow-hidden'>
        {/* Products Section */}
        <div className='flex-1 flex flex-col overflow-hidden'>
          {/* Search & Scan */}
          <div className='p-3 md:p-4 bg-white border-b space-y-2'>
            {/* Barcode Scanner */}
            <div className='flex gap-2'>
              <div className='flex-1 relative'>
                <i className='tabler-barcode absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 text-xl' />
                <input
                  ref={scanInputRef}
                  type='text'
                  placeholder='Scan or enter SKU/Barcode...'
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyPress={handleScanKeyPress}
                  className='w-full pl-10 pr-4 py-3 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm md:text-base font-mono'
                  autoFocus
                />
              </div>
              <button
                onClick={handleScan}
                className='bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 whitespace-nowrap font-semibold'
              >
                <i className='tabler-scan text-xl' />
                <span className='hidden sm:inline'>Scan</span>
              </button>
            </div>

            {/* Product Search */}
            <div className='relative'>
              <i className='tabler-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                placeholder='Search products by name...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm'
              />
            </div>
          </div>

          {/* Categories */}
          <div className='p-3 md:p-4 bg-white border-b overflow-x-auto'>
            <div className='flex gap-2'>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition whitespace-nowrap flex items-center gap-2 ${
                    selectedCategory === cat.name
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className='text-lg'>{cat.icon}</span>
                  <span className='text-sm'>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className='flex-1 overflow-auto p-3 md:p-4'>
            {loading ? (
              <div className='flex items-center justify-center h-full'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4'></div>
                  <p className='text-gray-600'>Loading products...</p>
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'>
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className='bg-white border border-gray-200 rounded-xl p-3 hover:shadow-lg hover:border-indigo-400 transition-all duration-200 flex flex-col h-full group'
                  >
                    <div className='aspect-square bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg mb-2 flex items-center justify-center text-3xl md:text-4xl group-hover:scale-105 transition'>
                      🍽️
                    </div>
                    <h3 className='font-semibold text-sm md:text-base text-gray-900 mb-1 line-clamp-2'>
                      {product.name}
                    </h3>
                    <div className='flex items-center justify-between mt-auto'>
                      <span className='text-lg md:text-xl font-bold text-indigo-600'>
                        KSh {product.price.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </span>
                      <span className='text-xs text-gray-500'>#{product.sku}</span>
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Stock: {product.stock}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                <i className='tabler-package-off text-6xl mb-3' />
                <p className='text-lg'>No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className='w-full lg:w-96 xl:w-[450px] bg-white border-l flex flex-col max-h-[50vh] lg:max-h-none'>
          {/* Cart Header */}
          <div className='p-4 border-b bg-gray-50'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-bold text-gray-900'>Current Order</h2>
              <button
                onClick={clearCart}
                className='text-red-600 hover:bg-red-50 p-2 rounded-lg transition'
                disabled={cart.length === 0}
              >
                <i className='tabler-trash text-xl' />
              </button>
            </div>
            {customer && (
              <div className='mt-2 bg-indigo-50 border border-indigo-200 rounded-lg p-2 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <i className='tabler-user text-indigo-600' />
                  <div className='text-sm'>
                    <div className='font-medium text-gray-900'>{customer.name}</div>
                    <div className='text-xs text-gray-600'>{customer.phone}</div>
                  </div>
                </div>
                <button
                  onClick={() => setCustomer(null)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <i className='tabler-x text-lg' />
                </button>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className='flex-1 overflow-auto p-4 space-y-3'>
            {cart.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                <i className='tabler-shopping-cart-off text-5xl mb-2' />
                <p className='text-sm'>Cart is empty</p>
                <p className='text-xs'>Add items to get started</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
                  <div className='flex items-start justify-between mb-2'>
                    <div className='flex-1'>
                      <h4 className='font-semibold text-sm text-gray-900'>{item.name}</h4>
                      <p className='text-xs text-gray-500'>#{item.sku}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className='text-red-500 hover:bg-red-50 p-1 rounded transition'
                    >
                      <i className='tabler-x text-lg' />
                    </button>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 bg-white border border-gray-300 rounded-lg'>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className='px-3 py-1.5 hover:bg-gray-100 transition rounded-l-lg'
                      >
                        <i className='tabler-minus text-sm' />
                      </button>
                      <span className='px-3 font-semibold min-w-[2rem] text-center'>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className='px-3 py-1.5 hover:bg-gray-100 transition rounded-r-lg'
                      >
                        <i className='tabler-plus text-sm' />
                      </button>
                    </div>
                    <div className='text-right'>
                      <div className='text-xs text-gray-500'>KSh {item.price.toLocaleString('en-KE', { minimumFractionDigits: 2 })} each</div>
                      <div className='font-bold text-indigo-600'>KSh {(item.price * item.quantity).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  {/* Note/Modifier */}
                  <div className='mt-2'>
                    {activeNoteId === item.id ? (
                      <div className='flex gap-2'>
                        <input
                          type='text'
                          value={noteForItem[item.id] || item.note || ''}
                          onChange={(e) => setNoteForItem({...noteForItem, [item.id]: e.target.value})}
                          placeholder='Add note (e.g., No onions)'
                          className='flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none'
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            updateItemNote(item.id, noteForItem[item.id] || '')
                            setActiveNoteId(null)
                            toast.success('Note saved')
                          }}
                          className='px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700'
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveNoteId(item.id)
                          setNoteForItem({...noteForItem, [item.id]: item.note || ''})
                        }}
                        className='text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1'
                      >
                        <i className='tabler-note text-sm' />
                        {item.note ? `Note: ${item.note}` : 'Add note/modifier'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div className='border-t bg-gray-50 p-4 space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Subtotal</span>
              <span className='font-medium'>KSh {subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
            </div>

            {discountAmount > 0 && (
              <div className='flex justify-between text-sm'>
                <span className='text-green-600 flex items-center gap-1'>
                  <i className='tabler-discount' />
                  Discount {discount.type === 'percentage' && `(${discount.value}%)`}
                  <button onClick={removeDiscount} className='ml-1 text-red-500 hover:text-red-700'>
                    <i className='tabler-x text-xs' />
                  </button>
                </span>
                <span className='font-medium text-green-600'>-KSh {discountAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Tax (8%)</span>
              <span className='font-medium'>KSh {tax.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className='pt-2 border-t border-gray-300'>
              <div className='flex justify-between items-center'>
                <span className='text-lg font-bold text-gray-900'>Total</span>
                <span className='text-2xl font-bold text-indigo-600'>KSh {total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Placeholder */}
          <div className='p-4 border-t space-y-2'>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className='w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition text-lg flex items-center justify-center gap-2 shadow-lg'
            >
              <i className='tabler-credit-card text-2xl' />
              Pay KSh {total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </button>

            <div className='grid grid-cols-3 gap-2'>
              <button
                onClick={() => setShowDiscountModal(true)}
                disabled={cart.length === 0}
                className='bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 text-green-700 font-medium py-3 rounded-lg transition flex flex-col items-center justify-center gap-1'
              >
                <i className='tabler-discount-2 text-xl' />
                <span className='text-xs'>Discount</span>
              </button>

              <button
                onClick={() => setShowCustomerModal(true)}
                className='bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-3 rounded-lg transition flex flex-col items-center justify-center gap-1'
              >
                <i className='tabler-user-search text-xl' />
                <span className='text-xs'>Customer</span>
              </button>

              <button
                onClick={() => {
                  fetchParkedSales()
                  setShowParkedSales(true)
                }}
                className='bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 rounded-lg transition flex flex-col items-center justify-center gap-1'
              >
                <i className='tabler-history text-xl' />
                <span className='text-xs'>Recall</span>
              </button>

              <button
                onClick={saveOrder}
                disabled={cart.length === 0}
                className='bg-amber-100 hover:bg-amber-200 disabled:bg-gray-100 disabled:text-gray-400 text-amber-700 font-medium py-3 rounded-lg transition flex flex-col items-center justify-center gap-1'
              >
                <i className='tabler-bookmark text-xl' />
                <span className='text-xs'>Hold</span>
              </button>

              <button
                onClick={() => setShowPayoutModal(true)}
                disabled={!shift.isOpen}
                className='bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 text-red-700 font-medium py-3 rounded-lg transition flex flex-col items-center justify-center gap-1'
              >
                <i className='tabler-cash-banknote-off text-xl' />
                <span className='text-xs'>Expense</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Parked Sales Modal */}
      {showParkedSales && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50' onClick={(e) => e.target === e.currentTarget && setShowParkedSales(false)}>
          <div className='bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden'>
            <div className='p-6 border-b bg-gray-50 flex items-center justify-between'>
              <h3 className='text-xl font-bold text-gray-900'>Parked Sales (Held)</h3>
              <button onClick={() => setShowParkedSales(false)} className='text-gray-400 hover:text-gray-600'>
                <i className='tabler-x text-2xl' />
              </button>
            </div>
            <div className='p-6 max-h-[60vh] overflow-auto'>
              {loadingParked ? (
                <div className='flex justify-center py-8'><CircularProgress /></div>
              ) : parkedSales.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>No parked sales found</div>
              ) : (
                <div className='space-y-3'>
                  {parkedSales.map(sale => (
                    <div key={sale.id} className='border rounded-xl p-4 hover:border-indigo-500 transition-colors cursor-pointer group' onClick={() => loadParkedSale(sale)}>
                      <div className='flex justify-between items-start'>
                        <div>
                          <div className='font-bold text-gray-900'>{sale.saleNumber}</div>
                          <div className='text-sm text-gray-500'>{new Date(sale.createdAt).toLocaleString()}</div>
                          <div className='text-sm mt-1'>
                            <span className='text-gray-600'>Customer:</span> {sale.customer?.firstName ? `${sale.customer.firstName} ${sale.customer.lastName}` : 'Walk-in'}
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='text-lg font-bold text-indigo-600'>KSh {parseFloat(sale.totalAmount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
                          <div className='text-xs text-gray-400'>{JSON.parse(sale.cartItems).length} items</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Shift Management Modal */}
      {showShiftModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50' onClick={(e) => e.target === e.currentTarget && setShowShiftModal(false)}>
          <div className='bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden'>
            <div className='p-6 border-b bg-gray-50'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-bold text-gray-900'>
                  {shiftModalMode === 'open' ? 'Open Shift' : 'Close Shift (Z-Report)'}
                </h3>
                <button onClick={() => setShowShiftModal(false)} className='text-gray-400 hover:text-gray-600 p-1'>
                  <i className='tabler-x text-2xl' />
                </button>
              </div>
            </div>

            <div className='p-6 space-y-4'>
              {shiftModalMode === 'open' ? (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Opening Float Amount</label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold'>KSh</span>
                    <input
                      type='number'
                      step='0.01'
                      value={shiftInputAmount}
                      onChange={(e) => setShiftInputAmount(e.target.value)}
                      className='w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg'
                      placeholder='0.00'
                      autoFocus
                    />
                  </div>
                  <p className='text-sm text-gray-500 mt-2'>Enter the total cash currently in the drawer.</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {/* Shift Summary */}
                  <div className='bg-gray-50 p-4 rounded-xl space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Opening Float</span>
                      <span className='font-medium'>KSh {shift.openingFloat.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Cash Sales</span>
                      <span className='font-medium text-green-600'>+KSh {shiftStats?.cashSales.toLocaleString('en-KE', { minimumFractionDigits: 2 }) || '0.00'}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Card Sales</span>
                      <span className='font-medium text-indigo-600'>KSh {shiftStats?.cardSales.toLocaleString('en-KE', { minimumFractionDigits: 2 }) || '0.00'}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Payouts/Expenses</span>
                      <span className='font-medium text-red-600'>-KSh {shiftStats?.totalPayouts.toLocaleString('en-KE', { minimumFractionDigits: 2 }) || '0.00'}</span>
                    </div>
                    <div className='border-t border-gray-200 pt-2 flex justify-between font-bold'>
                      <span>Expected Cash in Drawer</span>
                      <span>KSh {(shift.openingFloat + (shiftStats?.cashSales || 0)).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Closing Cash Count</label>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold'>KSh</span>
                      <input
                        type='number'
                        step='0.01'
                        value={shiftInputAmount}
                        onChange={(e) => setShiftInputAmount(e.target.value)}
                        className='w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg'
                        placeholder='0.00'
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Notes</label>
                    <textarea
                      value={shiftClosingNotes}
                      onChange={(e) => setShiftClosingNotes(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm'
                      rows={2}
                      placeholder='Any discrepancies or notes...'
                    />
                  </div>
                </div>
              )}

              <button
                onClick={shiftModalMode === 'open' ? handleOpenShift : handleCloseShift}
                className={`w-full py-3 rounded-xl font-bold text-white transition shadow-lg ${
                  shiftModalMode === 'open'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {shiftModalMode === 'open' ? 'Open Shift' : 'Close Shift & Print Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50' onClick={(e) => e.target === e.currentTarget && setShowPayoutModal(false)}>
          <div className='bg-white rounded-2xl max-w-md w-full shadow-2xl'>
            <div className='p-6 border-b'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-bold text-gray-900'>Record Expense / Payout</h3>
                <button onClick={() => setShowPayoutModal(false)} className='text-gray-400 hover:text-gray-600 p-1'>
                  <i className='tabler-x text-2xl' />
                </button>
              </div>
            </div>

            <div className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Amount</label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'>KSh</span>
                  <input
                    type='number'
                    step='0.01'
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className='w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg'
                    placeholder='0.00'
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Reason / Description</label>
                <textarea
                  value={payoutReason}
                  onChange={(e) => setPayoutReason(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm'
                  rows={3}
                  placeholder='e.g., Supplies, Lunch, Vendor Payment...'
                />
              </div>

              <button
                onClick={handlePayout}
                className='w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2'
              >
                <i className='tabler-check text-xl' />
                Record Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50' onClick={(e) => e.target === e.currentTarget && setShowDiscountModal(false)}>
          <div className='bg-white rounded-2xl max-w-md w-full shadow-2xl'>
            <div className='p-6 border-b'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-bold text-gray-900'>Apply Discount</h3>
                <button onClick={() => setShowDiscountModal(false)} className='text-gray-400 hover:text-gray-600 p-1'>
                  <i className='tabler-x text-2xl' />
                </button>
              </div>
            </div>

            <div className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-3'>Discount Type</label>
                <div className='grid grid-cols-2 gap-3'>
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={`p-4 rounded-xl border-2 transition ${
                      discountType === 'percentage'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className='text-2xl mb-1'>%</div>
                    <div className='font-medium'>Percentage</div>
                  </button>
                  <button
                    onClick={() => setDiscountType('fixed')}
                    className={`p-4 rounded-xl border-2 transition ${
                      discountType === 'fixed'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className='text-2xl mb-1'>KSh</div>
                    <div className='font-medium'>Fixed Amount</div>
                  </button>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (KSh)'}
                </label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold'>
                    {discountType === 'percentage' ? '%' : 'KSh'}
                  </span>
                  <input
                    type='number'
                    step='0.01'
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder='0'
                    className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg'
                    autoFocus
                  />
                </div>
              </div>

              {discountInput && (
                <div className='bg-indigo-50 border border-indigo-200 rounded-lg p-3'>
                  <div className='text-sm text-indigo-700 font-medium'>Discount Preview</div>
                  <div className='text-2xl font-bold text-indigo-600 mt-1'>
                    {discountType === 'percentage'
                      ? `${discountInput}% off`
                      : `KSh ${parseFloat(discountInput || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })} off`
                    }
                  </div>
                </div>
              )}
            </div>

            <div className='p-6 border-t flex gap-3'>
              <button
                onClick={() => setShowDiscountModal(false)}
                className='flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition'
              >
                Cancel
              </button>
              <button
                onClick={applyDiscount}
                className='flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition'
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50' onClick={(e) => e.target === e.currentTarget && setShowCustomerModal(false)}>
          <div className='bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col'>
            <div className='p-6 border-b'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-xl font-bold text-gray-900'>Select Customer</h3>
                <button onClick={() => setShowCustomerModal(false)} className='text-gray-400 hover:text-gray-600 p-1'>
                  <i className='tabler-x text-2xl' />
                </button>
              </div>

              <div className='relative'>
                <i className='tabler-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search by name, phone, or email...'
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'
                />
              </div>
            </div>

            <div className='flex-1 overflow-auto p-4'>
              {filteredCustomers.length === 0 ? (
                <div className='text-center py-8 text-gray-400'>
                  <i className='tabler-user-off text-5xl mb-2' />
                  <p>No customers found</p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {filteredCustomers.map(cust => (
                    <button
                      key={cust.id}
                      onClick={() => selectCustomer(cust)}
                      className='w-full text-left p-4 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='font-semibold text-gray-900'>{cust.name}</div>
                          <div className='text-sm text-gray-600'>{cust.phone}</div>
                          <div className='text-xs text-gray-500'>{cust.email}</div>
                        </div>
                        <div className='text-right'>
                          <div className='text-xs text-gray-500'>Points</div>
                          <div className='text-lg font-bold text-indigo-600'>{cust.points}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className='p-4 border-t'>
              <button
                onClick={() => {
                  setShowCustomerModal(false)
                  toast.info('Add new customer feature coming soon')
                }}
                className='w-full py-3 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 font-medium transition flex items-center justify-center gap-2'
              >
                <i className='tabler-plus text-xl' />
                Add New Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50' onClick={(e) => e.target === e.currentTarget && setShowPaymentModal(false)}>
          <div className='bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto'>
            <div className='p-6 border-b'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-2xl font-bold text-gray-900'>Process Payment</h3>
                <button onClick={() => { setShowPaymentModal(false); clearSplitPayments(); }} className='text-gray-400 hover:text-gray-600 p-1'>
                  <i className='tabler-x text-2xl' />
                </button>
              </div>

              {/* Payment Summary */}
              <div className='grid grid-cols-3 gap-3 text-center'>
                <div className='bg-gray-50 rounded-lg p-3'>
                  <div className='text-xs text-gray-600'>Total</div>
                  <div className='text-lg font-bold text-gray-900'>KSh {total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className='bg-green-50 rounded-lg p-3'>
                  <div className='text-xs text-green-600'>Paid</div>
                  <div className='text-lg font-bold text-green-700'>KSh {totalPaid.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className={`rounded-lg p-3 ${remainingBalance > 0 ? 'bg-red-50' : 'bg-blue-50'}`}>
                  <div className={`text-xs ${remainingBalance > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {remainingBalance > 0 ? 'Remaining' : 'Complete'}
                  </div>
                  <div className={`text-lg font-bold ${remainingBalance > 0 ? 'text-red-700' : 'text-blue-700'}`}>
                    KSh {remainingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Applied Payments List */}
              {splitPayments.length > 0 && (
                <div className='mt-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700'>Applied Payments</span>
                    <button
                      onClick={clearSplitPayments}
                      className='text-xs text-red-600 hover:text-red-700 font-medium'
                    >
                      Clear All
                    </button>
                  </div>
                  <div className='space-y-2 max-h-32 overflow-y-auto'>
                    {splitPayments.map((payment) => (
                      <div key={payment.id} className='flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-3'>
                        <div className='flex items-center gap-3'>
                          <i className={`text-xl ${
                            payment.method === 'cash' ? 'tabler-cash text-green-600' :
                            payment.method === 'card' ? 'tabler-credit-card text-blue-600' :
                            payment.method === 'mpesa' ? 'tabler-device-mobile text-green-600' :
                            'tabler-building-bank text-purple-600'
                          }`} />
                          <div>
                            <div className='font-semibold text-gray-900 capitalize'>{payment.method}</div>
                            <div className='text-sm text-gray-600'>KSh {payment.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
                            {payment?.status && (
                              <div className='text-xs text-gray-500'>Status: {String(payment.status)}</div>
                            )}
                            {(payment.reference || payment.phone) && (
                              <div className='text-xs text-gray-500'>
                                Ref: {String(payment.reference || payment.phone)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          {String(payment?.gateway || '') === 'pesapal' && String(payment?.status || '').toUpperCase() === 'PENDING' && (
                            <button
                              onClick={() => verifyPesapalOrder(payment.reference || payment.orderTrackingId)}
                              disabled={pesapalBusy}
                              className='text-indigo-700 hover:text-indigo-900 disabled:text-gray-400 px-2 py-1 text-xs font-medium border border-indigo-200 rounded'
                            >
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => removeSplitPayment(payment.id)}
                            className='text-red-600 hover:text-red-700 p-1'
                          >
                            <i className='tabler-trash text-lg' />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-3'>Select Payment Method</label>
                <div className='grid grid-cols-4 gap-2'>
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                      paymentMethod === 'cash'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className='tabler-cash text-2xl' />
                    <span className='text-xs font-medium'>Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                      paymentMethod === 'card'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className='tabler-credit-card text-2xl' />
                    <span className='text-xs font-medium'>Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                      paymentMethod === 'mpesa'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className='tabler-device-mobile text-2xl' />
                    <span className='text-xs font-medium'>M-PESA</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                      paymentMethod === 'bank'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className='tabler-building-bank text-2xl' />
                    <span className='text-xs font-medium'>Bank</span>
                  </button>
                </div>
              </div>

              {/* Amount Input for Split Payment */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Enter Amount {remainingBalance > 0 && `(Max: KSh ${remainingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })})`}
                </label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold'>KSh</span>
                  <input
                    type='number'
                    step='0.01'
                    value={currentPaymentAmount}
                    onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                    className='w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg'
                    placeholder='0.00'
                  />
                </div>

                {paymentMethod === 'mpesa' && (
                  <div className='mt-3 space-y-2'>
                    <label className='block text-sm font-medium text-gray-700'>Customer M-PESA Phone</label>
                    <input
                      type='tel'
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-base'
                      placeholder='e.g. 0712345678 or 254712345678'
                    />
                    {mpesaPrompt?.message && (
                      <div className={`text-sm ${mpesaPrompt.status === 'success' ? 'text-green-700' : mpesaPrompt.status === 'failed' ? 'text-red-700' : 'text-gray-600'}`}>
                        {mpesaPrompt.message}
                      </div>
                    )}
                  </div>
                )}

                {(paymentMethod === 'card' || paymentMethod === 'bank') && (
                  <div className='mt-3 space-y-2'>
                    <label className='block text-sm font-medium text-gray-700'>Transaction Reference (Optional)</label>
                    <input
                      type='text'
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-base'
                      placeholder='Leave blank to use Pesapal checkout'
                    />

                    {pesapalOrder?.message && (
                      <div className={`text-sm ${pesapalOrder.status === 'success' ? 'text-green-700' : pesapalOrder.status === 'failed' ? 'text-red-700' : 'text-gray-600'}`}>
                        {pesapalOrder.message}
                      </div>
                    )}

                    {pesapalOrder?.orderTrackingId && (
                      <div className='flex gap-2'>
                        <button
                          type='button'
                          onClick={() => verifyPesapalOrder(pesapalOrder.orderTrackingId)}
                          disabled={pesapalBusy}
                          className='flex-1 px-4 py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:bg-gray-100 disabled:text-gray-400 text-indigo-700 font-medium transition'
                        >
                          {pesapalBusy ? 'Verifying...' : 'Verify Pesapal Payment'}
                        </button>
                        {pesapalOrder?.redirectUrl && (
                          <button
                            type='button'
                            onClick={() => typeof window !== 'undefined' && window.open(pesapalOrder.redirectUrl, '_blank', 'noopener,noreferrer')}
                            className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition'
                          >
                            Open
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Amount Buttons */}
                <div className='mt-3 grid grid-cols-5 gap-2'>
                  {[
                    remainingBalance * 0.25,
                    remainingBalance * 0.5,
                    remainingBalance * 0.75,
                    remainingBalance,
                    total
                  ].map((amount, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPaymentAmount(Math.min(amount, remainingBalance).toFixed(2))}
                      className='py-2 px-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition'
                      disabled={remainingBalance <= 0}
                    >
                      {idx === 4 ? 'Full' : `${(idx + 1) * 25}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Payment Button */}
              <button
                onClick={handleAddPayment}
                disabled={
                  remainingBalance <= 0 ||
                  (paymentMethod !== 'mpesa' && (!currentPaymentAmount || parseFloat(currentPaymentAmount) <= 0)) ||
                  ((paymentMethod === 'card' || paymentMethod === 'bank') && pesapalBusy) ||
                  (paymentMethod === 'mpesa' && (mpesaBusy || !mpesaPhone || !currentPaymentAmount || parseFloat(currentPaymentAmount) <= 0))
                }
                className='w-full py-3 bg-indigo-100 hover:bg-indigo-200 disabled:bg-gray-100 disabled:text-gray-400 text-indigo-700 font-semibold rounded-lg transition flex items-center justify-center gap-2'
              >
                <i className='tabler-plus text-xl' />
                {paymentMethod === 'mpesa'
                  ? (mpesaBusy ? 'Sending M-PESA Prompt...' : 'Send M-PESA Prompt')
                  : ((paymentMethod === 'card' || paymentMethod === 'bank')
                    ? (String(paymentReference || '').trim()
                      ? `Add ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} Payment`
                      : (pesapalBusy ? 'Opening Pesapal Checkout...' : 'Open Pesapal Checkout'))
                    : `Add ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} Payment`
                  )
                }
              </button>
            </div>

            <div className='p-6 border-t flex gap-3'>
              <button
                onClick={() => { setShowPaymentModal(false); clearSplitPayments(); }}
                className='flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition'
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={remainingBalance > 0}
                className='flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition'
              >
                {remainingBalance > 0 ? `Pay KSh ${remainingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : 'Complete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
