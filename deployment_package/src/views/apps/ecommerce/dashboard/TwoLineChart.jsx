'use client'

import dynamic from 'next/dynamic'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import CardContent from '@mui/material/CardContent'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

export default function TwoLineChart({ title = 'Sales', categories = [], seriesA = [], seriesB = [], labels = ['Current', 'Previous'] }) {
  const series = [
    { name: labels[0] || 'Current', data: seriesA },
    { name: labels[1] || 'Previous', data: seriesB }
  ]

  const options = {
    chart: { parentHeightOffset: 0, toolbar: { show: false } },
    stroke: { width: 3, curve: 'smooth' },
    dataLabels: { enabled: false },
    legend: { position: 'top', horizontalAlign: 'left' },
    xaxis: { categories },
    yaxis: { labels: { formatter: v => (typeof v === 'number' ? Math.round(v) : v) } },
    grid: { borderColor: 'var(--mui-palette-divider)' }
  }

  const downloadCsv = () => {
    const header = ['Label', ...categories].join(',')
    const rowA = [labels[0] || 'Current', ...seriesA].join(',')
    const rowB = [labels[1] || 'Previous', ...seriesB].join(',')
    const csv = [header, rowA, rowB].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader title={title} action={<Button size='small' onClick={downloadCsv}>Export CSV</Button>} />
      <CardContent>
        <AppReactApexCharts type='line' height={320} width='100%' options={options} series={series} />
      </CardContent>
    </Card>
  )
}
