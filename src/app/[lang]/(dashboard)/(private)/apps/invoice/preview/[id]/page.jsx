// Next Imports
import { redirect } from 'next/navigation'

// Component Imports
import Preview from '@views/apps/invoice/preview'

// Data Imports
import { getInvoiceById } from '@/lib/db/invoices'

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
const PreviewPage = async props => {
  const params = await props.params

  // Fetch invoices from database
  const invoice = await getInvoiceById(params.id)

  if (!invoice) {
    redirect('/not-found')
  }

  // Transform invoice for display
  let billingAddress = {}
  try {
    billingAddress = invoice.billingAddress ? JSON.parse(invoice.billingAddress) : {}
  } catch (e) {
    console.warn('Failed to parse billing address')
  }

  const addressString = billingAddress.address_1 ? `${billingAddress.address_1}${billingAddress.address_2 ? ', ' + billingAddress.address_2 : ''}, ${billingAddress.city}, ${billingAddress.state} ${billingAddress.postcode}` : ''

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

  const invoiceData = {
    id: invoice.id,
    invoiceId: invoice.invoiceNumber,
    issuedDate: safeFormatDate(invoice.date),
    dueDate: safeFormatDate(invoice.dueDate),
    amount: invoice.amount,
    status: invoice.status,
    name: invoice.customerName,
    email: invoice.customerEmail,
    address: addressString,
    lineItems: invoice.lineItems ? JSON.parse(invoice.lineItems) : []
  }

  return <Preview invoiceData={invoiceData} id={params.id} />
}

export default PreviewPage
