'use client'

import { useState, useEffect } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

const methodLabels = {
  CASH: 'Cash',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  CHECK: 'Check',
  GIFT_CARD: 'Gift Card',
  STORE_CREDIT: 'Store Credit',
  DIGITAL_WALLET: 'M-Pesa / Digital',
  mpesa: 'M-Pesa',
  cash: 'Cash',
  card: 'Card',
  bank: 'Bank Transfer'
}

const methodColors = {
  CASH: 'success',
  CREDIT_CARD: 'info',
  DEBIT_CARD: 'info',
  CHECK: 'warning',
  GIFT_CARD: 'secondary',
  STORE_CREDIT: 'secondary',
  DIGITAL_WALLET: 'primary',
  mpesa: 'primary',
  cash: 'success',
  card: 'info',
  bank: 'warning'
}

const statusColors = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  REFUNDED: 'secondary'
}

const PaymentDetailsCard = ({ orderData, orderId }) => {
  const [payments, setPayments] = useState([])
  const [source, setSource] = useState('')
  const [posSaleNumber, setPosSaleNumber] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)

      return
    }

    const fetchPayments = async () => {
      try {
        // First try to find linked POS sale via meta_data
        const posSaleId = orderData?.metaData?.find(m =>
          m?.key === 'pos_sale_id' || m?.key === '_pos_sale_id'
        )?.value

        const url = posSaleId
          ? `/api/orders/payments?posSaleId=${encodeURIComponent(posSaleId)}`
          : `/api/orders/payments?wooOrderId=${encodeURIComponent(orderId)}`

        const res = await fetch(url)
        const data = await res.json()

        if (data?.success) {
          setPayments(data.payments || [])
          setSource(data.source || '')
          setPosSaleNumber(data.posSaleNumber || '')
        }
      } catch (e) {
        console.error('Failed to fetch payment details:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [orderId, orderData?.metaData])

  // Fallback: if no payments from API, show the order's single payment method
  const hasPayments = payments.length > 0

  if (loading) {
    return (
      <Card>
        <CardHeader title='Payment Details' />
        <CardContent>
          <Typography color='text.secondary'>Loading...</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title='Payment Details'
        subheader={
          posSaleNumber
            ? `POS Sale: ${posSaleNumber}`
            : source === 'woocommerce'
              ? 'WooCommerce Order'
              : undefined
        }
      />
      <CardContent>
        {!hasPayments && !orderData?.paymentMethodTitle ? (
          <Typography color='text.secondary'>No payment information available</Typography>
        ) : !hasPayments ? (
          /* Fallback to order-level payment info */
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Chip
                  label={orderData.paymentMethodTitle || orderData.paymentMethod || 'Unknown'}
                  color={methodColors[orderData.paymentMethod] || 'default'}
                  size='small'
                  variant='tonal'
                />
              </div>
              <Typography className='font-semibold'>
                {`KSh ${Number(orderData.total || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`}
              </Typography>
            </div>
            {orderData.datePaid && (
              <Typography variant='body2' color='text.secondary'>
                {`Paid: ${new Date(orderData.datePaid).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}`}
              </Typography>
            )}
          </div>
        ) : (
          /* Detailed payment records */
          <div className='flex flex-col gap-3'>
            {payments.map((payment, idx) => (
              <div key={payment.id}>
                {idx > 0 && <Divider className='mb-3' />}
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex flex-col gap-1'>
                    <div className='flex items-center gap-2'>
                      <Chip
                        label={methodLabels[payment.method] || payment.method}
                        color={methodColors[payment.method] || 'default'}
                        size='small'
                        variant='tonal'
                      />
                      <Chip
                        label={payment.status}
                        color={statusColors[payment.status] || 'default'}
                        size='small'
                        variant='outlined'
                      />
                    </div>
                    {payment.reference && (
                      <Typography variant='body2' color='text.secondary' className='mt-1'>
                        Ref: {payment.reference}
                      </Typography>
                    )}
                    {payment.cardLast4 && (
                      <Typography variant='body2' color='text.secondary'>
                        {`${payment.cardType || 'Card'} ****${payment.cardLast4}`}
                      </Typography>
                    )}
                    {payment.checkNumber && (
                      <Typography variant='body2' color='text.secondary'>
                        {`Check #${payment.checkNumber}`}
                      </Typography>
                    )}
                    {payment.cashTendered != null && (
                      <Typography variant='body2' color='text.secondary'>
                        {`Tendered: KSh ${Number(payment.cashTendered).toLocaleString('en-KE', { minimumFractionDigits: 2 })} | Change: KSh ${Number(payment.changeGiven || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`}
                      </Typography>
                    )}
                    {payment.date && (
                      <Typography variant='caption' color='text.disabled'>
                        {new Date(payment.date).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}
                      </Typography>
                    )}
                  </div>
                  <Typography className='font-semibold whitespace-nowrap'>
                    {`KSh ${Number(payment.amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`}
                  </Typography>
                </div>
              </div>
            ))}

            {/* Total */}
            {payments.length > 1 && (
              <>
                <Divider />
                <div className='flex items-center justify-between'>
                  <Typography className='font-semibold'>Total Paid</Typography>
                  <Typography className='font-semibold'>
                    {`KSh ${payments
                      .filter(p => p.status === 'COMPLETED')
                      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
                      .toLocaleString('en-KE', { minimumFractionDigits: 2 })}`}
                  </Typography>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PaymentDetailsCard
