'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import LogisticsStatisticsCard from '@/views/apps/logistics/dashboard/LogisticsStatisticsCard'
import LogisticsShipmentStatistics from '@/views/apps/logistics/dashboard/LogisticsShipmentStatistics'
import LogisticsDeliveryPerformance from '@/views/apps/logistics/dashboard/LogisticsDeliveryPerformance'
import LogisticsDeliveryExceptions from '@/views/apps/logistics/dashboard/LogisticsDeliveryExceptions'
import LogisticsOrdersByCountries from '@/views/apps/logistics/dashboard/LogisticsOrdersByCountries'
import LogisticsVehicleOverview from '@/views/apps/logistics/dashboard/LogisticsVehicleOverview'
import LogisticsOverviewTable from '@/views/apps/logistics/dashboard/LogisticsOverviewTable'

const DashboardLogistics = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sm={6} md={3}>
        <LogisticsStatisticsCard title='Orders' value='12,345' color='primary' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <LogisticsStatisticsCard title='Shipments' value='8,234' color='success' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <LogisticsStatisticsCard title='Deliveries' value='5,123' color='warning' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <LogisticsStatisticsCard title='Returns' value='1,234' color='error' />
      </Grid>
      <Grid item xs={12} md={6}>
        <LogisticsShipmentStatistics />
      </Grid>
      <Grid item xs={12} md={6}>
        <LogisticsDeliveryPerformance />
      </Grid>
      <Grid item xs={12} md={6}>
        <LogisticsOrdersByCountries />
      </Grid>
      <Grid item xs={12} md={6}>
        <LogisticsVehicleOverview />
      </Grid>
      <Grid item xs={12}>
        <LogisticsDeliveryExceptions />
      </Grid>
      <Grid item xs={12}>
        <LogisticsOverviewTable />
      </Grid>
    </Grid>
  )
}

export default DashboardLogistics
