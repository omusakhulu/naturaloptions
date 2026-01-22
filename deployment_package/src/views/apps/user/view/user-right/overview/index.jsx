// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import UserActivityTimeLine from './UserActivityTimeline'
import InvoiceListTable from './InvoiceListTable'

// Data Imports
import { prisma } from '@/lib/prisma'

const OverViewTab = async ({ userData }) => {
  // Fetch invoices by email
  const dbInvoices = await prisma.invoice.findMany({
    where: { customerEmail: userData?.email },
    orderBy: { date: 'desc' }
  })

  // Fetch orders by woo customer id if present
  const dbOrders = await prisma.order.findMany({
    where: { customerId: Number(userData?.id) || undefined },
    orderBy: { dateCreated: 'desc' }
  })

  // Transform invoices for table
  const invoiceData = dbInvoices.map(invoice => ({
    id: invoice.id,
    invoiceId: invoice.invoiceNumber,
    invoiceStatus: invoice.status,
    total: invoice.amount,
    issuedDate: invoice.date ? new Date(invoice.date).toLocaleDateString() : '',
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '',
    balance: 0,
    email: invoice.customerEmail
  }))

  // Build activity events
  const events = []

  // Orders events
  for (const o of dbOrders) {
    const number = String(o.orderNumber || o.number || o.wooId || o.id)
    if (o.dateCreated) {
      events.push({
        at: new Date(o.dateCreated),
        title: `Order #${number} placed`,
        subtitle: o.total ? `Total: ${o.total}` : '',
        color: 'primary',
        icon: 'tabler-shopping-cart'
      })
    }
    if (o.datePaid) {
      events.push({
        at: new Date(o.datePaid),
        title: `Order #${number} paid`,
        subtitle: o.paymentMethodTitle || o.paymentMethod || '',
        color: 'success',
        icon: 'tabler-credit-card'
      })
    }
    if (o.dateCompleted) {
      events.push({
        at: new Date(o.dateCompleted),
        title: `Order #${number} completed`,
        subtitle: o.status || 'completed',
        color: 'info',
        icon: 'tabler-badge-check'
      })
    }
  }

  // Invoice events
  for (const inv of dbInvoices) {
    if (inv.date) {
      events.push({
        at: new Date(inv.date),
        title: `Invoice ${inv.invoiceNumber} created`,
        subtitle: inv.amount ? `Amount: ${inv.amount}` : '',
        color: 'secondary',
        icon: 'tabler-file-invoice'
      })
    }
    if (inv.status?.toLowerCase() === 'paid') {
      // If we don't have paid date, place it at dueDate or date as fallback
      const paidAt = inv.dueDate || inv.date
      if (paidAt) {
        events.push({
          at: new Date(paidAt),
          title: `Invoice ${inv.invoiceNumber} paid`,
          subtitle: inv.customerEmail || '',
          color: 'success',
          icon: 'tabler-cash'
        })
      }
    }
  }

  events.sort((a, b) => b.at - a.at)

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <UserActivityTimeLine events={events} />
      </Grid>
      <Grid size={12}>
        <InvoiceListTable invoiceData={invoiceData} />
      </Grid>
    </Grid>
  )
}

export default OverViewTab
