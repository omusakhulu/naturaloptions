import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

import { getDictionary } from '@/utils/getDictionary'

export default async function Page({ params: { lang } }) {
  const dictionary = await getDictionary(lang)

  return (
    <Box display='flex' flexDirection='column' gap={4}>
      <Typography variant='h4'>{dictionary?.navigation?.brands || 'Brands'}</Typography>
      <Typography color='text.secondary'>
        This is a placeholder Brands page for your beauty store. You can manage brand names,
        descriptions, logos, and assign products to brands.
      </Typography>
      <Box>
        <Button variant='contained' href={`/${lang}/apps/ecommerce/brands/create`} disabled>
          {dictionary?.navigation?.add || 'Add'} {dictionary?.navigation?.brands || 'Brand'}
        </Button>
      </Box>
    </Box>
  )
}
