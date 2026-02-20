'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@mui/material/styles'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const DailyPaceChart = ({ dailySales, target, daysInMonth }) => {
  const theme = useTheme()

  if (!dailySales || dailySales.length === 0 || !target) {
    return (
      <Card>
        <CardHeader title='Daily Sales Progress' />
        <CardContent>
          <Typography variant='body2' color='text.secondary' align='center'>
            No sales data available
          </Typography>
        </CardContent>
      </Card>
    )
  }

  // Calculate cumulative sales
  const cumulativeSales = []
  let runningTotal = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const daySale = dailySales.find(d => {
      const saleDate = new Date(d.date)
      return saleDate.getDate() === day
    })

    if (daySale) {
      runningTotal += daySale.amount
    }

    cumulativeSales.push(runningTotal)
  }

  // Calculate target pace (evenly distributed)
  const targetPace = Array.from({ length: daysInMonth }, (_, i) =>
    Math.round((target / daysInMonth) * (i + 1))
  )

  const series = [
    {
      name: 'Actual Sales',
      data: cumulativeSales
    },
    {
      name: 'Target Pace',
      data: targetPace
    }
  ]

  const primaryColor = theme.palette.primary.main
  const warningColor = theme.palette.warning.main
  const divider = 'var(--mui-palette-divider)'
  const textDisabled = 'var(--mui-palette-text-disabled)'

  const options = {
    chart: {
      toolbar: { show: false },
      parentHeightOffset: 0,
      zoom: { enabled: false }
    },
    stroke: {
      width: [3, 2],
      curve: 'smooth',
      dashArray: [0, 5]
    },
    colors: [primaryColor, warningColor],
    fill: {
      type: ['gradient', 'solid'],
      opacity: [0.1, 0],
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: [primaryColor],
        inverseColors: false,
        opacityFrom: 0.4,
        opacityTo: 0,
        stops: [0, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      show: true,
      borderColor: divider,
      strokeDashArray: 3,
      padding: {
        top: 0,
        bottom: 0,
        left: 10,
        right: 10
      }
    },
    xaxis: {
      categories: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      labels: {
        style: {
          colors: textDisabled,
          fontSize: '13px'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        color: divider
      },
      crosshairs: {
        stroke: { color: divider }
      },
      title: {
        text: 'Day of Month',
        style: {
          color: textDisabled,
          fontSize: '13px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: textDisabled,
          fontSize: '13px'
        },
        formatter: (value) => {
          if (value >= 1000000) {
            return `KSh ${(value / 1000000).toFixed(1)}M`
          } else if (value >= 1000) {
            return `KSh ${(value / 1000).toFixed(0)}k`
          }
          return `KSh ${value}`
        }
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value) => `KSh ${value.toLocaleString('en-KE')}`
      },
      x: {
        formatter: (value) => `Day ${value}`
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      labels: {
        colors: 'var(--mui-palette-text-secondary)'
      },
      fontSize: '13px',
      markers: {
        offsetY: 2,
        offsetX: theme.direction === 'rtl' ? 7 : -4
      },
      itemMargin: {
        horizontal: 12
      }
    }
  }

  return (
    <Card>
      <CardHeader
        title='Daily Sales Progress'
        subheader='Cumulative sales vs target pace'
      />
      <CardContent>
        <AppReactApexCharts
          type='area'
          height={350}
          width='100%'
          options={options}
          series={series}
        />
      </CardContent>
    </Card>
  )
}

export default DailyPaceChart
