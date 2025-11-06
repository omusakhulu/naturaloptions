import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

import { getDictionary } from '@/utils/getDictionary'

export default async function Page({ params: { lang } }) {
  const dictionary = await getDictionary(lang)

  return (
    <Box display='flex' flexDirection='column' gap={4}>
      <Typography variant='h4'>{dictionary?.navigation?.promotions || 'Promotions'}</Typography>
      <Typography color='text.secondary'>
        Manage store-wide promotions and discounts. Configure percentage or fixed discounts, time windows,
        eligibility rules, and included products or categories.
      </Typography>
      <Box>
        <Button variant='contained' href={`/${lang}/apps/ecommerce/promotions/create`}>
          {dictionary?.navigation?.add || 'Add'} {dictionary?.navigation?.promotions || 'Promotion'}
        </Button>
      </Box>
    </Box>
  )
}
