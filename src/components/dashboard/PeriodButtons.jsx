'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'

import Button from '@mui/material/Button'

export default function PeriodButtons() {
  const { lang } = useParams()
  const sp = useSearchParams()
  const period = (sp.get('period') || 'year').toLowerCase()
  const base = `/${lang}/apps/ecommerce/dashboard`
  const mkHref = p => `${base}?period=${p}`

  return (
    <div className='flex gap-1'>
      <Button
        component={Link}
        href={mkHref('week')}
        size='small'
        variant={period === 'week' ? 'contained' : 'outlined'}
      >
        Week
      </Button>
      <Button
        component={Link}
        href={mkHref('month')}
        size='small'
        variant={period === 'month' ? 'contained' : 'outlined'}
      >
        Month
      </Button>
      <Button
        component={Link}
        href={mkHref('year')}
        size='small'
        variant={period === 'year' ? 'contained' : 'outlined'}
      >
        Year
      </Button>
    </div>
  )
}
