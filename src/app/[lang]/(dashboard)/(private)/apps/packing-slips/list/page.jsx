// MUI Imports
import Link from 'next/link'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'

import { getAllPackingSlips } from '@/lib/db/packingSlips'

const PackingSlipsListPage = async () => {
  const slips = await getAllPackingSlips()

  // Status labels for display
  const statusLabels = {
    awaiting_collection: { label: 'Awaiting Collection', color: 'warning' },
    en_route: { label: 'En Route', color: 'info' },
    delivered: { label: 'Delivered', color: 'success' },
    collected: { label: 'Collected', color: 'success' }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <Typography variant='h4'>Packing Slips</Typography>
        </div>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Packing Slip #</TableCell>
                  <TableCell>Woo Order ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Stand</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(slips) && slips.length > 0 ? (
                  slips.map(slip => {
                    const statusInfo = statusLabels[slip.status] || {
                      label: slip.status || 'Unknown',
                      color: 'default'
                    }

                    return (
                      <TableRow key={slip.id}>
                        <TableCell>{slip.packingSlipNumber}</TableCell>
                        <TableCell>{slip.wooOrderId}</TableCell>
                        <TableCell>
                          <Chip label={statusInfo.label} color={statusInfo.color} size='small' />
                        </TableCell>
                        <TableCell>{slip.boothNumber || '-'}</TableCell>
                        <TableCell>{slip.assignedUser?.name || slip.assignedUser?.email || '-'}</TableCell>
                        <TableCell>{new Date(slip.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Link href={`./view/${slip.wooOrderId}`} className='text-primary'>
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography variant='body1'>No packing slips yet.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default PackingSlipsListPage
