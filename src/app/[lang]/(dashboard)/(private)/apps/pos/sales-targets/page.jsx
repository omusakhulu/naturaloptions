'use client'

import { useState, useEffect, useCallback } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import TargetSettingCard from '@views/apps/pos/sales-targets/TargetSettingCard'
import ProgressOverview from '@views/apps/pos/sales-targets/ProgressOverview'
import DailyPaceChart from '@views/apps/pos/sales-targets/DailyPaceChart'
import ProductRecommendations from '@views/apps/pos/sales-targets/ProductRecommendations'

const SalesTargetsPage = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [targetData, setTargetData] = useState(null)
  const [productData, setProductData] = useState(null)

  const fetchTargetData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales-targets?month=${month}&year=${year}`)
      const data = await response.json()

      if (data.success) {
        setTargetData({ target: data.target, progress: data.progress })
      }
    } catch (error) {
      console.error('Failed to fetch sales target data:', error)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  const fetchProductData = useCallback(async () => {
    try {
      const response = await fetch(`/api/sales-targets/products?month=${month}&year=${year}`)
      const data = await response.json()

      if (data.success) {
        setProductData({
          topSellers: data.topSellers || [],
          trending: data.trending || [],
          pushThese: data.pushThese || [],
          declining: data.declining || [],
          topCustomers: data.topCustomers || []
        })
      }
    } catch (error) {
      console.error('Failed to fetch product data:', error)
    }
  }, [month, year])

  useEffect(() => {
    fetchTargetData()
    fetchProductData()
  }, [fetchTargetData, fetchProductData])

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const getMonthName = monthNum => {
    const date = new Date(year, monthNum - 1)

    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  const target = targetData?.target
  const progress = targetData?.progress

  return (
    <Grid container spacing={6}>
      {/* Row 1: Month Navigation */}
      <Grid size={12}>
        <Card>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Box display='flex' alignItems='center' justifyContent='center' gap={2}>
              <IconButton onClick={handlePreviousMonth} size='small'>
                <i className='tabler-chevron-left' />
              </IconButton>
              <Typography variant='h5' sx={{ minWidth: '200px', textAlign: 'center' }}>
                {getMonthName(month)}
              </Typography>
              <IconButton onClick={handleNextMonth} size='small'>
                <i className='tabler-chevron-right' />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Row 2: Target + Gauge  |  KPI Stats */}
      <Grid size={{ xs: 12, md: 4 }}>
        <TargetSettingCard
          target={target}
          progress={progress}
          month={month}
          year={year}
          onTargetSaved={fetchTargetData}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <ProgressOverview target={target} progress={progress} />
      </Grid>

      {/* Row 3: Daily Pace Chart — full width */}
      <Grid size={12}>
        <DailyPaceChart
          dailySales={progress?.dailySales || []}
          target={target?.revenueTarget || 0}
          daysInMonth={new Date(year, month, 0).getDate()}
        />
      </Grid>

      {/* Row 4: Product Recommendations — full width */}
      <Grid size={12}>
        <ProductRecommendations
          topSellers={productData?.topSellers || []}
          trending={productData?.trending || []}
          pushThese={productData?.pushThese || []}
          declining={productData?.declining || []}
          topCustomers={productData?.topCustomers || []}
        />
      </Grid>
    </Grid>
  )
}

export default SalesTargetsPage
