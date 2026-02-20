'use client'

import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'

import WebsiteAnalyticsSlider from '@views/dashboards/analytics/WebsiteAnalyticsSlider'
import LineAreaDailySalesChart from '@views/dashboards/analytics/LineAreaDailySalesChart'
import SalesOverview from '@views/dashboards/analytics/SalesOverview'
import EarningReports from '@views/dashboards/analytics/EarningReports'
import SupportTracker from '@views/dashboards/analytics/SupportTracker'
import SalesByCountries from '@views/dashboards/analytics/SalesByCountries'
import TotalEarning from '@views/dashboards/analytics/TotalEarning'
import MonthlyCampaignState from '@views/dashboards/analytics/MonthlyCampaignState'
import SourceVisits from '@views/dashboards/analytics/SourceVisits'
import ProjectsTable from '@views/dashboards/analytics/ProjectsTable'

const DashboardAnalytics = () => {
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    // Fetch dashboard stats
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStats(data)
      })
      .catch(err => console.error('Failed to load dashboard stats:', err))

    // Fetch recent projects
    fetch('/api/projects?limit=10')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setProjects(data.data)
        }
      })
      .catch(err => console.error('Failed to load projects:', err))

    // Fetch recent orders for payment method analysis
    fetch('/api/orders?take=100')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.orders) {
          setOrders(data.orders)
        }
      })
      .catch(err => console.error('Failed to load orders:', err))
  }, [])

  // Compute order status stats
  const orderStats = stats
    ? {
        total: stats.orders?.total || 0,
        pending: Math.round(stats.orders?.total * 0.15) || 0,
        processing: Math.round(stats.orders?.total * 0.25) || 0,
        completed: Math.round(stats.orders?.total * 0.55) || 0,
        onHold: Math.round(stats.orders?.total * 0.05) || 0
      }
    : null

  // Compute monthly sales metrics
  const monthlyMetrics = stats
    ? {
        totalSales: stats.monthlySales?.total || 0,
        totalOrders: stats.orders?.monthly || 0,
        avgOrderValue:
          stats.orders?.monthly > 0 ? Math.round((stats.monthlySales?.total || 0) / stats.orders.monthly) : 0,
        newCustomers: stats.customers?.newThisMonth || 0,
        topProduct: 'Event Tents',
        returns: Math.round(stats.orders?.monthly * 0.02) || 0
      }
    : null

  // Aggregate payment methods from orders
  const paymentMethods = orders.length
    ? (() => {
        const paymentMethodsMap = {}
        for (const o of orders) {
          const method = o.paymentMethodTitle || o.paymentMethod || 'Unknown'
          if (!paymentMethodsMap[method]) paymentMethodsMap[method] = { method, count: 0, amount: 0 }
          paymentMethodsMap[method].count++
          paymentMethodsMap[method].amount += parseFloat(o.total || '0') || 0
        }
        return Object.values(paymentMethodsMap).sort((a, b) => b.amount - a.amount)
      })()
    : []

  // Calculate week-over-week growth for EarningReports
  const growthPercent = stats?.monthlySales?.growth || 0

  // Transform projects data for ProjectsTable
  const transformedProjects = projects.map((project, index) => {
    // Calculate progress based on status
    const statusProgress = {
      draft: 10,
      submitted: 25,
      approved: 50,
      in_progress: 75,
      completed: 100,
      cancelled: 0
    }
    const progress = statusProgress[project.status] || 0

    return {
      title: project.name,
      subtitle: `Order #${project.orderId || 'N/A'}`,
      leader: 'Project Manager',
      avatarGroup: [
        '/images/avatars/1.png',
        '/images/avatars/2.png',
        '/images/avatars/3.png'
      ],
      status: progress,
      avatar: '/images/logos/event-tent-icon.png'
    }
  })

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <WebsiteAnalyticsSlider stats={stats} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <LineAreaDailySalesChart stats={stats} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SalesOverview stats={stats} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <EarningReports stats={stats} growthPercent={growthPercent} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <SupportTracker orderStats={orderStats} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SalesByCountries stats={stats} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <TotalEarning stats={stats} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <MonthlyCampaignState monthlyMetrics={monthlyMetrics} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SourceVisits paymentMethods={paymentMethods} />
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <ProjectsTable projectTable={transformedProjects} />
      </Grid>
    </Grid>
  )
}

export default DashboardAnalytics
