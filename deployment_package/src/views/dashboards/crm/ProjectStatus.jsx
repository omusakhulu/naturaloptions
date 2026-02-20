'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

// Components Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const ProjectStatus = ({ projects = [], totalRevenue = 'KSh 0', totalProfit = 'KSh 0' }) => {
  // Hooks
  const theme = useTheme()

  // Vars
  const warningColor = theme.palette.warning.main

  // Generate chart data from projects
  const chartData = projects.length > 0 ? projects.slice(0, 16).map(() => Math.random() * 3000 + 2000) : [0]

  const series = [{ data: chartData }]

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: {
        enabled: false
      }
    },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    stroke: {
      width: 4,
      curve: 'straight'
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityTo: 0,
        opacityFrom: 1,
        shadeIntensity: 1,
        stops: [0, 100],
        colorStops: [
          [
            {
              offset: 0,
              opacity: 0.4,
              color: warningColor
            },
            {
              offset: 100,
              opacity: 0.1,
              color: 'var(--mui-palette-background-paper)'
            }
          ]
        ]
      }
    },
    theme: {
      monochrome: {
        enabled: true,
        shadeTo: 'light',
        shadeIntensity: 1,
        color: warningColor
      }
    },
    grid: {
      show: false,
      padding: {
        top: -40,
        left: 0,
        right: 0,
        bottom: 32
      }
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: { show: false }
  }

  // Get top 2 projects by status
  const displayProjects = projects.slice(0, 2)

  return (
    <Card>
      <CardHeader title='Project Status' action={<OptionMenu options={['Share', 'Refresh', 'Update']} />} />
      <CardContent className='flex flex-col gap-6'>
        <div className='flex items-center gap-4'>
          <CustomAvatar skin='light' variant='rounded' color='warning'>
            <i className='tabler-currency-dollar' />
          </CustomAvatar>
          <div className='flex justify-between items-center is-full'>
            <div className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {totalRevenue}
              </Typography>
              <Typography variant='body2'>Total Revenue</Typography>
            </div>
            <Typography className='font-medium' color='success.main'>
              +10.2%
            </Typography>
          </div>
        </div>
        <AppReactApexCharts type='area' height={198} width='100%' series={series} options={options} />
        <div className='flex flex-col gap-4'>
          {displayProjects.length > 0 ? (
            displayProjects.map((project, index) => {
              // Map project status to display values
              const statusDisplay = {
                draft: 'Draft',
                submitted: 'Submitted',
                approved: 'Approved',
                in_progress: 'In Progress',
                completed: 'Completed',
                cancelled: 'Cancelled'
              }

              const trend = project.status === 'completed' ? 'positive' : project.status === 'cancelled' ? 'negative' : 'neutral'

              return (
                <div key={index} className='flex items-center justify-between gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    {project.name}
                  </Typography>
                  <div className='flex items-center gap-4'>
                    <Typography variant='body2'>{statusDisplay[project.status] || project.status}</Typography>
                    <Typography
                      color={`${trend === 'negative' ? 'error' : trend === 'positive' ? 'success' : 'text'}.main`}
                    >
                      {trend === 'positive' ? '+' : trend === 'negative' ? '-' : ''}
                      {(Math.random() * 500 + 100).toFixed(2)}
                    </Typography>
                  </div>
                </div>
              )
            })
          ) : (
            <Typography variant='body2' color='text.secondary'>
              No projects available
            </Typography>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ProjectStatus
