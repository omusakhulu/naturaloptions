'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

function KpiCard({ icon, label, value, color = 'primary' }) {
  return (
    <Card>
      <CardContent className='flex items-center gap-4'>
        <i className={`tabler-${icon} text-2xl text-${color}`} />
        <div>
          <Typography variant='h5'>{value}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {label}
          </Typography>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BeautyKpis({
  netSales = 0,
  netProfit = 0,
  salesReturns = 0,
  purchaseReturns = 0,
  expenses = 0
}) {
  const fmt = n => (typeof n === 'number' ? n.toLocaleString() : n)

  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
        <KpiCard icon='currency-dollar' label='Net Sales' value={`$${fmt(Math.round(netSales))}`} color='success' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
        <KpiCard icon='chart-line' label='Net Profit' value={`$${fmt(Math.round(netProfit))}`} color='info' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
        <KpiCard icon='arrow-back-up' label='Sales Returns' value={`$${fmt(Math.round(salesReturns))}`} color='warning' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
        <KpiCard icon='rotate-2' label='Purchase Returns' value={`$${fmt(Math.round(purchaseReturns))}`} color='secondary' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
        <KpiCard icon='receipt-2' label='Expenses' value={`$${fmt(Math.round(expenses))}`} color='error' />
      </Grid>
    </Grid>
  )
}
