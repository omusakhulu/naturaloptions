// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import './print.css'

// Helpers
const toMoney = v => `$${Number.parseFloat(v || 0).toFixed(2)}`

const computeTotals = (items = [], fallbackAmount) => {
  try {
    const subtotal = items.reduce((acc, it) => acc + parseFloat(it.subtotal ?? it.total ?? 0), 0)

    const total =
      typeof fallbackAmount !== 'undefined' && fallbackAmount !== null
        ? parseFloat(fallbackAmount)
        : items.reduce((acc, it) => acc + parseFloat(it.total ?? it.subtotal ?? 0), 0)

    const tax = items.reduce((acc, it) => acc + parseFloat(it.total_tax ?? 0), 0)

    const discount = items.reduce((acc, it) => {
      const sub = parseFloat(it.subtotal ?? 0)
      const tot = parseFloat(it.total ?? 0)

      return acc + Math.max(0, sub - tot)
    }, 0)

    return { subtotal, discount, tax, total }
  } catch {
    return { subtotal: 0, discount: 0, tax: 0, total: Number.parseFloat(fallbackAmount || 0) }
  }
}

const PreviewCard = ({ invoiceData, id }) => {
  // Derive address string from preformatted invoiceData.address when available
  const addressString =
    typeof invoiceData?.address === 'string'
      ? invoiceData.address
      : (() => {
          const a = invoiceData?.address || {}
          const parts = [a.address_1, a.address_2, a.city, a.state, a.postcode, a.country].filter(Boolean)

          return parts.join(', ')
        })()

  const totals = computeTotals(invoiceData?.lineItems || [], invoiceData?.amount)

  return (
    <Card className='previewCard'>
      <CardContent className='sm:!p-12'>
        <Grid container spacing={6}>
          <Grid size={12}>
            <div className='p-6 bg-actionHover rounded'>
              <div className='flex justify-between gap-y-4 flex-col sm:flex-row'>
                <div className='flex flex-col gap-6'>
                  <div className='flex items-center gap-2.5'>
                    <Logo />
                  </div>
                  {/* Store/company details could be added from settings later */}
                </div>
                <div className='flex flex-col gap-6'>
                  <Typography variant='h5'>{`Invoice #${id}`}</Typography>
                  <div className='flex flex-col gap-1'>
                    <Typography color='text.primary'>{`Date Issued: ${invoiceData?.issuedDate}`}</Typography>
                    <Typography color='text.primary'>{`Date Due: ${invoiceData?.dueDate}`}</Typography>
                  </div>
                </div>
              </div>
            </div>
          </Grid>
          <Grid size={12}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    Invoice To:
                  </Typography>
                  <div>
                    <Typography>{invoiceData?.name || 'Customer'}</Typography>
                    <Typography>{invoiceData?.email || ''}</Typography>
                    <Typography>{addressString}</Typography>
                  </div>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    Summary:
                  </Typography>
                  <div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[120px]'>Subtotal:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {toMoney(totals.subtotal)}
                      </Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[120px]'>Discount:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {toMoney(totals.discount)}
                      </Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[120px]'>Tax:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {toMoney(totals.tax)}
                      </Typography>
                    </div>
                    <Divider className='mlb-2' />
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[120px]'>Total:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {toMoney(totals.total)}
                      </Typography>
                    </div>
                  </div>
                </div>
              </Grid>
            </Grid>
          </Grid>
          <Grid size={12}>
            <div className='overflow-x-auto border rounded'>
              <table className={tableStyles.table}>
                <thead className='border-bs-0'>
                  <tr>
                    <th className='!bg-transparent'>Item</th>
                    <th className='!bg-transparent'>Description</th>
                    <th className='!bg-transparent'>Qty</th>
                    <th className='!bg-transparent'>Unit Price</th>
                    <th className='!bg-transparent'>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.lineItems && invoiceData.lineItems.length > 0 ? (
                    invoiceData.lineItems.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <Typography color='text.primary'>{row.name || 'N/A'}</Typography>
                        </td>
                        <td>
                          <Typography color='text.primary'>{row.description || 'N/A'}</Typography>
                        </td>
                        <td>
                          <Typography color='text.primary'>{row.quantity || 1}</Typography>
                        </td>
                        <td>
                          <Typography color='text.primary'>
                            {(() => {
                              const qty = Number.parseFloat(row.quantity || 1)
                              const sub = Number.parseFloat(row.subtotal ?? row.total ?? 0)
                              const unit = qty ? sub / qty : sub

                              return toMoney(unit)
                            })()}
                          </Typography>
                        </td>
                        <td>
                          <Typography color='text.primary'>{row.total ? toMoney(row.total) : toMoney(0)}</Typography>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan='5' className='text-center'>
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Grid>
          {/* Optional notes section could be rendered from invoice/order in the future */}
          <Grid size={12}>
            <Divider className='border-dashed' />
          </Grid>
          <Grid size={12}>
            <Typography>Thank you for your business.</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PreviewCard
