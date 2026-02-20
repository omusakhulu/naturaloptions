'use client'

import { useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'

import tableStyles from '@core/styles/table.module.css'

const ProductRecommendations = ({ topSellers, trending, pushThese, declining, topCustomers }) => {
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const renderProductTable = (products, showGrowth = false) => {
    if (!products || products.length === 0) {
      return (
        <Box py={4} textAlign='center'>
          <Typography variant='body2' color='text.secondary'>
            No products in this category
          </Typography>
        </Box>
      )
    }

    return (
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th align='right'>Units Sold</th>
              <th align='right'>Revenue</th>
              {showGrowth && <th align='center'>Growth</th>}
              <th align='right'>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product.productId || index}>
                <td>
                  <Box display='flex' alignItems='center' gap={2}>
                    {product.image ? (
                      <Avatar src={product.image} alt={product.name} variant='rounded' sx={{ width: 40, height: 40 }} />
                    ) : (
                      <Avatar variant='rounded' sx={{ width: 40, height: 40 }}>
                        <i className='tabler-package' />
                      </Avatar>
                    )}
                    <Typography variant='body2' fontWeight={500}>
                      {product.name}
                    </Typography>
                  </Box>
                </td>
                <td align='right'>
                  <Typography variant='body2'>{product.unitsSold || 0}</Typography>
                </td>
                <td align='right'>
                  <Typography variant='body2' fontWeight={500}>
                    KSh {(product.revenue || 0).toLocaleString('en-KE')}
                  </Typography>
                </td>
                {showGrowth && (
                  <td align='center'>
                    {product.growth !== undefined && product.growth !== null ? (
                      <Chip
                        label={`${product.growth > 0 ? '+' : ''}${product.growth.toFixed(1)}%`}
                        color={product.growth >= 0 ? 'success' : 'error'}
                        size='small'
                        variant='tonal'
                      />
                    ) : (
                      <Typography variant='body2' color='text.disabled'>
                        N/A
                      </Typography>
                    )}
                  </td>
                )}
                <td align='right'>
                  <Box display='flex' alignItems='center' justifyContent='flex-end' gap={1}>
                    <Typography
                      variant='body2'
                      color={
                        (product.stock || 0) <= 10
                          ? 'error.main'
                          : (product.stock || 0) <= 50
                            ? 'warning.main'
                            : 'text.secondary'
                      }
                    >
                      {product.stock || 0}
                    </Typography>
                    {(product.stock || 0) <= 10 && (
                      <i
                        className='tabler-alert-circle'
                        style={{ fontSize: '1rem', color: 'var(--mui-palette-error-main)' }}
                      />
                    )}
                  </Box>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderCustomerTable = customers => {
    if (!customers || customers.length === 0) {
      return (
        <Box py={4} textAlign='center'>
          <Typography variant='body2' color='text.secondary'>
            No customer data for this month
          </Typography>
        </Box>
      )
    }

    return (
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Customer</th>
              <th align='right'>Orders</th>
              <th align='right'>Revenue</th>
              <th align='right'>Last Order</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr key={customer.email || index}>
                <td>
                  <Box display='flex' alignItems='center' gap={2}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                      {customer.name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant='body2' fontWeight={500}>
                        {customer.name}
                      </Typography>
                      {customer.email && (
                        <Typography variant='caption' color='text.disabled'>
                          {customer.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </td>
                <td align='right'>
                  <Chip label={customer.orders} size='small' variant='tonal' color='primary' />
                </td>
                <td align='right'>
                  <Typography variant='body2' fontWeight={500}>
                    KSh {(customer.revenue || 0).toLocaleString('en-KE')}
                  </Typography>
                </td>
                <td align='right'>
                  <Typography variant='body2' color='text.secondary'>
                    {customer.lastOrder
                      ? new Date(customer.lastOrder).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short'
                        })
                      : '-'}
                  </Typography>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const tabsData = [
    { label: 'Top Sellers', icon: 'tabler-trophy', type: 'product', data: topSellers, showGrowth: false },
    { label: 'Trending Up', icon: 'tabler-trending-up', type: 'product', data: trending, showGrowth: true },
    { label: 'Push These', icon: 'tabler-rocket', type: 'product', data: pushThese, showGrowth: true },
    { label: 'Needs Attention', icon: 'tabler-alert-triangle', type: 'product', data: declining, showGrowth: true },
    { label: 'Top Customers', icon: 'tabler-users', type: 'customer', data: topCustomers }
  ]

  return (
    <Card>
      <CardHeader title='Insights & Recommendations' />
      <CardContent>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabsData.map((tab, index) => (
            <Tab
              key={index}
              label={
                <Box display='flex' alignItems='center' gap={1}>
                  <i className={tab.icon} style={{ fontSize: '1.125rem' }} />
                  <span>{tab.label}</span>
                  {tab.data && tab.data.length > 0 && <Chip label={tab.data.length} size='small' />}
                </Box>
              }
            />
          ))}
        </Tabs>

        <Box mt={3}>
          {tabsData.map((tab, index) => (
            <Box key={index} hidden={activeTab !== index}>
              {activeTab === index &&
                (tab.type === 'customer'
                  ? renderCustomerTable(tab.data)
                  : renderProductTable(tab.data, tab.showGrowth))}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProductRecommendations
