// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Vars
const productStockObj = {
  'In Stock': true,
  'Out of Stock': false
}

const TableFilters = ({ setData, productData }) => {
  // Get unique categories from product data
  const categories = useMemo(() => {
    if (!productData || !Array.isArray(productData)) return [];

    // Extract all categories from products
    const allCategories = productData.reduce((acc, product) => {
      if (product.categories && Array.isArray(product.categories)) {
        product.categories.forEach(cat => {
          if (cat && cat.name && !acc.some(c => c === cat.name)) {
            acc.push(cat.name);
          }
        });
      }
      return acc;
    }, []);

    return allCategories.sort();
  }, [productData]);
  // States
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState('')
  const [status, setStatus] = useState('')
  const [visibility, setVisibility] = useState('')

  useEffect(
    () => {
      const filteredData = productData?.filter(product => {
        if (category && product.category !== category) return false
        if (stock && product.stock !== productStockObj[stock]) return false
        if (status && product.status !== status) return false
        if (visibility) {
          const vis = (product.catalog_visibility || 'visible').toLowerCase()
          if (visibility === 'visible' && vis === 'hidden') return false
          if (visibility === 'hidden' && vis !== 'hidden') return false
        }

        return true
      })

      setData(filteredData ?? [])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, stock, status, visibility, productData]
  )

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CustomTextField
            select
            fullWidth
            id='select-status'
            value={status}
            onChange={e => setStatus(e.target.value)}
            slotProps={{
              select: { displayEmpty: true }
            }}
          >
            <MenuItem value=''>Select Status</MenuItem>
            <MenuItem value='Scheduled'>Scheduled</MenuItem>
            <MenuItem value='Published'>Publish</MenuItem>
            <MenuItem value='Inactive'>Inactive</MenuItem>
          </CustomTextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CustomTextField
            select
            fullWidth
            id='select-category'
            value={category}
            onChange={e => setCategory(e.target.value)}
            slotProps={{
              select: {
                displayEmpty: true,
                // Only show the dropdown if there are categories
                disabled: categories.length === 0
              }
            }}
          >
            <MenuItem value=''>
              {categories.length === 0 ? 'No categories found' : 'Select Category'}
            </MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </CustomTextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CustomTextField
            select
            fullWidth
            id='select-stock'
            value={stock}
            onChange={e => setStock(e.target.value)}
            slotProps={{
              select: { displayEmpty: true }
            }}
          >
            <MenuItem value=''>Select Stock</MenuItem>
            <MenuItem value='In Stock'>In Stock</MenuItem>
            <MenuItem value='Out of Stock'>Out of Stock</MenuItem>
          </CustomTextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CustomTextField
            select
            fullWidth
            id='select-visibility'
            value={visibility}
            onChange={e => setVisibility(e.target.value)}
            slotProps={{
              select: { displayEmpty: true }
            }}
          >
            <MenuItem value=''>Select Visibility</MenuItem>
            <MenuItem value='visible'>Visible</MenuItem>
            <MenuItem value='hidden'>Hidden</MenuItem>
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
