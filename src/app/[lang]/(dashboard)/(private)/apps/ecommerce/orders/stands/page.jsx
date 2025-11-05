// Next/MUI Imports
import Link from 'next/link'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableBody from '@mui/material/TableBody'

// DB Imports
import { getAllOrders } from '@/lib/db/orders'
import { getAllInvoices } from '@/lib/db/invoices'

const OrdersByStandsPage = async ({ params }) => {
  const lang = params?.lang || 'en'

  const orders = await getAllOrders()
  const invoices = await getAllInvoices()

  const safeDate = v => {
    try {
      if (!v) return ''
      const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v

      return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : ''
    } catch {
      return ''
    }
  }

  // Build invoice lookup by Woo order ID
  const invoiceByOrder = new Map()

  ;(Array.isArray(invoices) ? invoices : []).forEach(inv => {
    const key = inv.wooOrderId || inv.orderId || inv.order_id

    if (key) invoiceByOrder.set(Number(key), inv)
  })

  const parseJSON = v => {
    try {
      return typeof v === 'string' ? JSON.parse(v) : v || {}
    } catch {
      return {}
    }
  }

  const getBooth = o => {
    try {
      const meta = o.meta ? JSON.parse(o.meta) : {}
      const billing = parseJSON(o.billingAddress)
      const shipping = parseJSON(o.shippingAddress)

      const candidates = [
        meta?.boothNumber,
        meta?.booth_number,
        meta?.booth,
        billing?.booth_number,
        billing?.booth,
        shipping?.booth_number,
        shipping?.booth
      ].map(x => (x == null ? '' : String(x).trim()))

      const val = candidates.find(Boolean) || ''

      return val || 'Unassigned'
    } catch {
      return 'Unassigned'
    }
  }

  const grouped = new Map()

  ;(orders || []).forEach(o => {
    const booth = getBooth(o)

    if (!grouped.has(booth)) grouped.set(booth, [])
    grouped.get(booth).push(o)
  })

  const sections = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <Grid container spacing={6}>
      {sections.map(([booth, list]) => (
        <Grid key={booth} size={{ xs: 12, md: 12 }}>
          <Card>
            <CardHeader
              title={
                <div className='flex items-center gap-3'>
                  <Typography variant='h6'>Stand: {booth}</Typography>
                  <Chip label={`${list.length} orders`} size='small' variant='outlined' />
                </div>
              }
            />
            <CardContent className='overflow-x-auto'>
              <Table size='small' className='min-w-[1200px]'>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Stand</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Invoice Status</TableCell>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Order Status</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align='right'>Items</TableCell>
                    <TableCell align='right'>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list
                    .slice()
                    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
                    .map(o => {
                      const number = String(o.orderNumber || o.number || o.wooId || o.id)

                      const b = parseJSON(o.billingAddress)
                      const first = b?.first_name || ''
                      const last = b?.last_name || ''
                      const email = b?.email || ''
                      const name = first || last ? `${first} ${last}`.trim() : email || 'Customer'
                      const total = String(o.total || '0')
                      const inv = invoiceByOrder.get(Number(o.wooId || o.id))
                      const invStatus = inv?.status || inv?.invoiceStatus || ''
                      const invNumber = inv?.invoiceNumber || ''
                      const invDue = safeDate(inv?.dueDate)
                      const pay = o.paymentMethodTitle || o.paymentMethod || ''
                      const created = safeDate(o.createdAt || o.date)

                      const itemsCount = (() => {
                        try {
                          const arr = Array.isArray(o.lineItems) ? o.lineItems : JSON.parse(o.lineItems || '[]')

                          return Array.isArray(arr)
                            ? arr.reduce((n, it) => n + (parseFloat(it.quantity || 0) || 0), 0)
                            : 0
                        } catch {
                          return 0
                        }
                      })()

                      return (
                        <TableRow key={number} hover>
                          <TableCell>
                            <Link
                              href={`/${lang}/apps/ecommerce/orders/details/${o.wooId || o.id}`}
                              className='text-primary underline'
                            >
                              #{number}
                            </Link>
                          </TableCell>
                          <TableCell>{booth}</TableCell>
                          <TableCell>{name}</TableCell>
                          <TableCell>
                            {invStatus ? <Chip size='small' label={invStatus} variant='outlined' /> : <span>-</span>}
                          </TableCell>
                          <TableCell>
                            {inv && invNumber ? (
                              <Link
                                href={`/${lang}/apps/invoice/preview/${inv.id}`}
                                className='text-primary underline'
                              >
                                {invNumber}
                              </Link>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{invDue || '-'}</TableCell>
                          <TableCell>{o.status || '-'}</TableCell>
                          <TableCell>{pay || '-'}</TableCell>
                          <TableCell>{created}</TableCell>
                          <TableCell align='right'>{itemsCount}</TableCell>
                          <TableCell align='right'>{total}</TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default OrdersByStandsPage
