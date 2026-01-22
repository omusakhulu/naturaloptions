'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

const ProductCard = ({ metrics = {} }) => {
  // Hooks
  const isBelowMdScreen = useMediaQuery(theme => theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery(theme => theme.breakpoints.down('sm'))

  const { totalProducts = 0, publishedCount = 0, inStockCount = 0, outOfStockCount = 0 } = metrics

  const cards = [
    { title: 'Total Products', value: String(totalProducts), icon: 'tabler-package' },
    { title: 'Published', value: String(publishedCount), icon: 'tabler-badge-check' },
    { title: 'In Stock', value: String(inStockCount), icon: 'tabler-box' },
    { title: 'Out of Stock', value: String(outOfStockCount), icon: 'tabler-box-off' }
  ]

  return (
    <Card>
      <CardContent>
        <Grid container spacing={12}>
          {cards.map((item, index) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 3 }}
              key={index}
              className={classnames({
                '[&:nth-of-type(odd)>div]:pie-6 [&:nth-of-type(odd)>div]:border-ie': isBelowMdScreen && !isSmallScreen,
                '[&:not(:last-child)>div]:pie-6 [&:not(:last-child)>div]:border-ie': !isBelowMdScreen
              })}
            >
              <div className='flex flex-col gap-1'>
                <div className='flex justify-between'>
                  <div className='flex flex-col gap-1'>
                    <Typography>{item.title}</Typography>
                    <Typography variant='h4'>{item.value}</Typography>
                  </div>
                  <CustomAvatar variant='rounded' size={44}>
                    <i className={classnames(item.icon, 'text-[28px]')} />
                  </CustomAvatar>
                </div>
                <Typography variant='body2' color='text.secondary'>
                  Items
                </Typography>
              </div>
              {isBelowMdScreen && !isSmallScreen && index < cards.length - 2 && (
                <Divider
                  className={classnames('mbs-6', {
                    'mie-6': index % 2 === 0
                  })}
                />
              )}
              {isSmallScreen && index < cards.length - 1 && <Divider className='mbs-6' />}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ProductCard
