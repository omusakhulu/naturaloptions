// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import classnames from 'classnames'

// Components Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const toMoney = v => `$${Number.parseFloat(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

const EarningReports = ({
  weeklySeries = [{ data: [0, 0, 0, 0, 0, 0, 0] }],
  summary = {
    netProfit: 0,
    totalIncome: 0,
    totalExpenses: 0,
    salesCount: 0,
    incomeTrend: 0,
    expenseTrend: 0,
    profitTrend: 0
  }
}) => {
  // Vars
  const primaryColorWithOpacity = 'var(--mui-palette-primary-lightOpacity)'

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: { enabled: false },
    grid: {
      show: false,
      padding: {
        top: -16,
        left: -18,
        right: -17,
        bottom: -11
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        distributed: true,
        columnWidth: '60%'
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
      categories: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
      axisTicks: { show: false },
      axisBorder: { show: false },
      tickPlacement: 'on',
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
        action={<OptionMenu options={['Refresh', 'Update', 'Share']} />}
      />
      <CardContent className='flex flex-col gap-5'>
        {[
          {
            amount: toMoney(summary.netProfit),
            trendNumber: summary.profitTrend,
            title: 'Net Profit',
            avatarColor: 'primary',
            subtitle: `${summary.salesCount} Sales`,
            avatarIcon: 'tabler-chart-pie-2'
          },
          {
            amount: toMoney(summary.totalIncome),
            trendNumber: summary.incomeTrend,
            title: 'Total Income',
            avatarColor: 'success',
            subtitle: 'Sales, Affiliation',
            avatarIcon: 'tabler-currency-dollar'
          },
          {
            amount: toMoney(summary.totalExpenses),
            trendNumber: summary.expenseTrend,
            title: 'Total Expenses',
            avatarColor: 'secondary',
            subtitle: 'ADVT, Marketing',
            avatarIcon: 'tabler-credit-card'
          }
        ].map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <CustomAvatar skin='light' variant='rounded' color={item.avatarColor} size={34}>
              <i className={classnames(item.avatarIcon, 'text-[22px]')} />
            </CustomAvatar>
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{item.subtitle}</Typography>
              </div>
              <div className='flex items-center gap-4'>
                <Typography>{item.amount}</Typography>
                <div className='flex items-center gap-1'>
                  <i
                    className={classnames(
                      item.trend === 'negative' ? 'tabler-chevron-down text-error' : 'tabler-chevron-up text-success',
                      'text-xl'
                    )}
                  />
                  <Typography variant='body2' className='text-textDisabled'>{`${item.trendNumber}%`}</Typography>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className='pbs-[60px]'>
          <AppReactApexCharts type='bar' height={158} width='100%' series={weeklySeries} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}

export default EarningReports
