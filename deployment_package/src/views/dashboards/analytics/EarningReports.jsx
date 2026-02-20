'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'

// Third Party Imports
import classnames from 'classnames'

// Components Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const EarningReports = ({ stats, growthPercent }) => {
  // Vars
  const primaryColorWithOpacity = 'var(--mui-palette-primary-lightOpacity)'

  const weekTotal = stats?.weeklySales?.total || 0
  const revenue = stats?.financials?.revenue || 0
  const expenses = stats?.financials?.expenses || 0
  const profit = stats?.financials?.profit || 0
  const growth = growthPercent || 0

  const series = [{ data: stats?.dailySales?.map(d => d.amount) || [0, 0, 0, 0, 0, 0, 0] }]

  const data = [
    {
      title: 'Earnings',
      progress: revenue > 0 ? Math.min(100, Math.round((revenue / (revenue + (expenses || 1))) * 100)) : 0,
      stats: `KSh ${revenue.toLocaleString('en-KE')}`,
      progressColor: 'primary',
      avatarColor: 'primary',
      avatarIcon: 'tabler-currency-dollar'
    },
    {
      title: 'Profit',
      progress: revenue > 0 ? Math.min(100, Math.round((profit / revenue) * 100)) : 0,
      stats: `KSh ${profit.toLocaleString('en-KE')}`,
      progressColor: 'info',
      avatarColor: 'info',
      avatarIcon: 'tabler-chart-pie-2'
    },
    {
      title: 'Expense',
      progress: revenue > 0 ? Math.min(100, Math.round((expenses / revenue) * 100)) : 0,
      stats: `KSh ${expenses.toLocaleString('en-KE')}`,
      progressColor: 'error',
      avatarColor: 'error',
      avatarIcon: 'tabler-brand-paypal'
    }
  ]

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: { enabled: false },
    grid: {
      show: false,
      padding: {
        top: -31,
        left: 0,
        right: 0,
        bottom: -9
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        distributed: true,
        columnWidth: '42%'
      }
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: [
      primaryColorWithOpacity,
      primaryColorWithOpacity,
      primaryColorWithOpacity,
      primaryColorWithOpacity,
      'var(--mui-palette-primary-main)',
      primaryColorWithOpacity,
      primaryColorWithOpacity
    ],
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    xaxis: {
      categories: stats?.dailySales?.map(d => d.day) || ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        style: {
          fontSize: '13px',
          colors: 'var(--mui-palette-text-disabled)'
        }
      }
    },
    yaxis: { show: false }
  }

  return (
    <Card>
      <CardHeader
        title='Earning Reports'
        subheader='Weekly Earnings Overview'
        action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
        className='pbe-0'
      />
      <CardContent className='flex flex-col gap-5 max-md:gap-5 max-[1015px]:gap-[62px] max-[1051px]:gap-10 max-[1200px]:gap-5 max-[1310px]:gap-10'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-8'>
          <div className='flex flex-col gap-3 is-full sm:is-[unset]'>
            <div className='flex items-center gap-2.5'>
              <Typography variant='h2'>KSh {weekTotal.toLocaleString('en-KE')}</Typography>
              <Chip
                size='small'
                variant='tonal'
                color={growth >= 0 ? 'success' : 'error'}
                label={`${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`}
              />
            </div>
            <Typography variant='body2' className='text-balance'>
              Monthly growth compared to last month
            </Typography>
          </div>
          <AppReactApexCharts type='bar' height={163} width='100%' series={series} options={options} />
        </div>
        <div className='flex flex-col sm:flex-row gap-6 p-5 border rounded'>
          {data.map((item, index) => (
            <div key={index} className='flex flex-col gap-2 is-full'>
              <div className='flex items-center gap-2'>
                <CustomAvatar skin='light' variant='rounded' color={item.avatarColor} size={26}>
                  <i className={classnames(item.avatarIcon, 'text-lg')} />
                </CustomAvatar>
                <Typography variant='h6' className='leading-6 font-normal'>
                  {item.title}
                </Typography>
              </div>
              <Typography variant='h4'>{item.stats}</Typography>
              <LinearProgress
                value={item.progress}
                variant='determinate'
                color={item.progressColor}
                className='max-bs-1'
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default EarningReports
