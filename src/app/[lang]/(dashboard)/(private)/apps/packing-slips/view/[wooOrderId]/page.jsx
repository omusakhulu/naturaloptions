// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'

// App Imports
import { getPackingSlipByWooOrderId } from '@/lib/db/packingSlips'
import { getOrderByWooId } from '@/lib/db/orders'
import PrintButton from '@/components/packing-slips/PrintButton'
import EditPackingSlipDialogWrapper from './EditPackingSlipDialogWrapper'
import PrintableCard from '@/components/packing-slips/PrintableCard'

async function PackingSlipView({ params }) {
  const wooOrderId = Number(params.wooOrderId)
  const slip = await getPackingSlipByWooOrderId(wooOrderId)
  const order = await getOrderByWooId(wooOrderId)

  const shipping = order?.shippingAddress ? JSON.parse(order.shippingAddress) : {}
  const billing = order?.billingAddress ? JSON.parse(order.billingAddress) : {}
  const lineItems = order?.lineItems ? JSON.parse(order.lineItems) : []
  const metadata = order?.metadata ? JSON.parse(order.metadata) : []

  // Extract booth number from WooCommerce order metadata
  const boothNumberMeta = metadata?.find((item) => item.key === 'booth_number' || item.key === '_booth_number')
  const boothNumber = boothNumberMeta?.value || slip?.boothNumber

  // Format status for display
  const statusLabels = {
    awaiting_collection: { label: 'Awaiting Collection', color: 'warning' },
    en_route: { label: 'En Route', color: 'info' },
    delivered: { label: 'Delivered', color: 'success' },
    collected: { label: 'Collected', color: 'success' }
  }

  const statusInfo = statusLabels[slip?.status] || { label: slip?.status || 'Unknown', color: 'default' }

  return (
    <>
      {/* Full Width Header Section */}
      <div className='mb-6 print:hidden'>
        <div className='flex items-center justify-between gap-4 mb-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Typography variant='h5'>Packing Slip #{slip?.packingSlipNumber ?? `PS-${wooOrderId}`}</Typography>
            <Chip variant='tonal' label={statusInfo.label} color={statusInfo.color} size='small' />
            {boothNumber && (
              <Chip variant='tonal' label={`Stand: ${boothNumber}`} color='primary' size='small' />
            )}
            {slip?.assignedUser && (
              <Chip
                variant='tonal'
                label={`Assigned: ${slip.assignedUser.name || slip.assignedUser.email}`}
                color='default'
                size='small'
              />
            )}
          </div>
          <div className='flex gap-2'>
            <EditPackingSlipDialogWrapper packingSlip={slip} />
            <PrintButton />
          </div>
        </div>
        <Typography color='text.secondary'>
          Order #{order?.orderNumber ?? wooOrderId} •{' '}
          {order?.dateCreated ? new Date(order.dateCreated).toLocaleDateString() : '-'}
        </Typography>
      </div>
      {/* Full Width Packing Slip Card */}
      <Grid container spacing={12} style={{ justifyContent: 'center' }} className='print:!p-0 print:!m-0 print:!block'>
        <Grid item xs={12} className='print:!p-0 print:!m-0 print:!max-w-full'>
          <PrintableCard>
            <Card className='print:!shadow-none print:!m-0 print:!border-0'>
              <CardContent className='p-8 print:!p-8'>
              {/* Company Header */}
              <Box className='mb-8 print:mb-6'>
                <div className='flex items-center gap-4 mb-4'>
                  <img 
                    src='/images/logos/logo.png' 
                    alt='Omnishop Logo' 
                    className='h-16 w-auto'
                  />
                  <div>
                    <Typography variant='h4' className='font-bold mb-1'>
                      Omnishop
                    </Typography>
                    <Typography variant='h6' color='text.secondary'>
                      Packing Slip
                    </Typography>
                  </div>
                </div>
              </Box>

              {/* Order Info & Shipping - Single Column */}
              <Box className='space-y-6 mb-8 print:mb-6'>
                {/* Order Info */}
                <div>
                  <Typography variant='subtitle2' className='font-semibold mb-3'>
                    Order Details
                  </Typography>
                  <div className='space-y-2'>
                    <div>
                      <Typography variant='body2' color='text.secondary'>
                        Packing Slip
                      </Typography>
                      <Typography variant='body1' className='font-semibold'>
                        {slip?.packingSlipNumber ?? `PS-${wooOrderId}`}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant='body2' color='text.secondary'>
                        Order Number
                      </Typography>
                      <Typography variant='body1' className='font-semibold'>
                        #{order?.orderNumber ?? wooOrderId}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant='body2' color='text.secondary'>
                        Date
                      </Typography>
                      <Typography variant='body1'>
                        {order?.dateCreated ? new Date(order.dateCreated).toLocaleDateString() : '-'}
                      </Typography>
                    </div>
                    {boothNumber && (
                      <div className='mt-3 pt-3 border-t' style={{ borderColor: 'rgba(128, 128, 128, 0.2)' }}>
                        <Typography variant='body2' color='text.secondary'>
                          Stand Number
                        </Typography>
                        <Typography variant='body1' className='font-bold' color='primary'>
                          {boothNumber}
                        </Typography>
                      </div>
                    )}
                    {slip?.assignedUser && (
                      <div>
                        <Typography variant='body2' color='text.secondary'>
                          Assigned To
                        </Typography>
                        <Typography variant='body1'>{slip.assignedUser.name || slip.assignedUser.email}</Typography>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <Typography variant='subtitle2' className='font-semibold mb-3'>
                    Shipping Address
                  </Typography>
                  <div className='p-4 border rounded' style={{ borderColor: 'rgba(128, 128, 128, 0.3)' }}>
                    <Typography variant='body1' className='font-semibold mb-2'>
                      {shipping?.first_name} {shipping?.last_name}
                    </Typography>
                    <Typography variant='body2' className='mb-1'>
                      {shipping?.address_1}
                    </Typography>
                    {shipping?.address_2 && (
                      <Typography variant='body2' className='mb-1'>
                        {shipping.address_2}
                      </Typography>
                    )}
                    <Typography variant='body2' className='mb-1'>
                      {shipping?.city} {shipping?.postcode}
                    </Typography>
                    <Typography variant='body2'>{shipping?.country}</Typography>
                  </div>
                </div>
              </Box>

              <Divider className='my-6' />

              {/* Items Section */}
              <Box className='mb-6'>
                <Typography variant='subtitle1' className='font-semibold mb-4'>
                  Items to Pack
                </Typography>
                <div
                  className='w-full border rounded overflow-hidden'
                  style={{ borderColor: 'rgba(128, 128, 128, 0.3)' }}
                >
                  <div
                    className='grid grid-cols-12 font-semibold p-3 border-b'
                    style={{ borderColor: 'rgba(128, 128, 128, 0.3)', backgroundColor: 'rgba(128, 128, 128, 0.1)' }}
                  >
                    <div className='col-span-7'>Item</div>
                    <div className='col-span-3'>SKU</div>
                    <div className='col-span-2 text-right'>Qty</div>
                  </div>
                  {Array.isArray(lineItems) && lineItems.length > 0 ? (
                    lineItems.map((item, idx) => (
                      <div
                        key={idx}
                        className='grid grid-cols-12 p-3 border-b last:border-b-0'
                        style={{ borderColor: 'rgba(128, 128, 128, 0.2)' }}
                      >
                        <div className='col-span-7'>{item?.name}</div>
                        <div className='col-span-3'>
                          <Typography variant='body2' color='text.secondary'>
                            {item?.sku || '-'}
                          </Typography>
                        </div>
                        <div className='col-span-2 text-right font-semibold'>{item?.quantity ?? item?.qty ?? 1}</div>
                      </div>
                    ))
                  ) : (
                    <div className='p-4 text-center'>
                      <Typography variant='body2' color='text.secondary'>
                        No items found.
                      </Typography>
                    </div>
                  )}
                </div>
              </Box>

              {/* Notes Section */}
              {slip?.notes && (
                <Box
                  className='mb-6 p-4 border rounded'
                  style={{ borderColor: 'rgba(255, 193, 7, 0.5)', backgroundColor: 'rgba(255, 193, 7, 0.1)' }}
                >
                  <Typography variant='subtitle2' className='font-semibold mb-2'>
                    📝 Notes
                  </Typography>
                  <Typography variant='body2'>{slip.notes}</Typography>
                </Box>
              )}

              <Divider className='my-6' />

              {/* Footer */}
              <Box className='text-center'>
                <Typography variant='caption' color='text.secondary'>
                  This packing slip does not include prices.
                </Typography>
              </Box>
              </CardContent>
            </Card>
          </PrintableCard>
        </Grid>
      </Grid>
    </>
  )
}

export default PackingSlipView
