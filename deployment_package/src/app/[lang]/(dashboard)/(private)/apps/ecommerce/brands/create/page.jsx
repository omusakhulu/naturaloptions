import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'

import { getDictionary } from '@/utils/getDictionary'

export default async function Page({ params }) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <Box display='flex' flexDirection='column' gap={4}>
      <Typography variant='h4'>
        {dictionary?.navigation?.brands || 'Brands'} — {dictionary?.navigation?.add || 'Add'}
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label='Brand Name' placeholder='e.g., Luminé' />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label='Website' placeholder='https://example.com' />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline minRows={3} label='Description' placeholder='Short brand description' />
        </Grid>
      </Grid>
      <Box display='flex' gap={2}>
        <Button variant='contained'>{dictionary?.navigation?.add || 'Add'}</Button>
        <Button variant='outlined' href={`/${lang}/apps/ecommerce/brands`}>Cancel</Button>
      </Box>
    </Box>
  )
}
