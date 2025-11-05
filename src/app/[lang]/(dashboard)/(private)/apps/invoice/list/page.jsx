// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import InvoiceListTable from '@views/apps/invoice/list/InvoiceListTable'
import GenerateInvoicesButton from '@/components/invoices/GenerateInvoicesButton'

// Data Imports
import { getAllInvoices } from '@/lib/db/invoices'

/**
 * ! If you need data using an API call, uncomment the below API code, update the `process.env.API_URL` variable in the
 * ! `.env` file found at root of your project and also update the API endpoints like `/apps/invoice` in below example.
 * ! Also, remove the above server action import and the action itself from the `src/app/server/actions.ts` file to clean up unused code
 * ! because we've used the server action for getting our static data.
 */
/* const getInvoiceData = async () => {
  // Vars
  const res = await fetch(`${process.env.API_URL}/apps/invoice`)

  if (!res.ok) {
    throw new Error('Failed to fetch invoice data')
  }

  return res.json()
} */
const InvoiceApp = async ({ searchParams }) => {
  // Fetch real invoices from database
  const invoices = await getAllInvoices()

  // Transform database invoices for display using only real data
  const safeFormatDate = d => {
    try {
      if (!d) return ''
      const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d

      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''

      return date.toLocaleDateString()
    } catch {
      return ''
    }
  }

  const data = invoices.map(invoice => {
    const issuedDate = safeFormatDate(invoice.date)
    const dueDate = safeFormatDate(invoice.dueDate)
    const addressObj = invoice.billingAddress ? JSON.parse(invoice.billingAddress) : {}
    const invoiceStatus = invoice.invoiceStatus || invoice.status || 'draft'

    return {
      id: invoice.id,
      invoiceId: invoice.invoiceNumber,
      issuedDate,
      dueDate,
      amount: invoice.amount,
      status: invoiceStatus,
      invoiceStatus,
      orderStatus: invoice.orderStatus || null,
      name: invoice.customerName,
      email: invoice.customerEmail,
      address: addressObj
    }
  })

  const status = (searchParams?.status || '').toLowerCase()

  const filtered = status
    ? Array.isArray(data)
      ? data.filter(inv => String(inv.status || inv.invoiceStatus || '').toLowerCase() === status)
      : []
    : data

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <GenerateInvoicesButton />
      </Grid>
      <Grid size={12}>
        <InvoiceListTable invoiceData={filtered} />
      </Grid>
    </Grid>
  )
}

export default InvoiceApp
