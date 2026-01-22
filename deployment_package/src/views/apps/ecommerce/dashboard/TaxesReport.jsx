'use client'

import dynamic from 'next/dynamic'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const money = v => `$${Number.parseFloat(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

export default function TaxesReport({ monthlySeries = [], months = [], topRates = [] }) {
  const barOptions = {
    chart: { parentHeightOffset: 0, toolbar: { show: false } },
    xaxis: { categories: months },
    dataLabels: { enabled: false },
    grid: { borderColor: 'var(--mui-palette-divider)' },
    colors: ['var(--mui-palette-warning-main)']
  }

  return (
    <Card>
      <CardHeader title='Taxes Collected' subheader='By month and top tax rates' />
      <CardContent>
        <div className='mb-6'>
          <AppReactApexCharts type='bar' height={260} width='100%' series={monthlySeries} options={barOptions} />
        </div>
        <div className='flex flex-col gap-2'>
          {topRates.map((r, idx) => (
            <div key={idx} className='flex justify-between'>
              <Typography className='font-medium'>{r.label}</Typography>
              <Typography>{money(r.amount)}</Typography>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
