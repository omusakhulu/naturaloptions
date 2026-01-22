'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

import Button from '@mui/material/Button'

export default function PeriodButtons() {
  const { lang } = useParams()
  const router = useRouter()
  const sp = useSearchParams()
  const period = (sp.get('period') || 'year').toLowerCase()
  const base = `/${lang}/apps/ecommerce/dashboard`
  const mkHref = p => `${base}?period=${p}`

  // Persist selection in sessionStorage and restore if missing
  if (typeof window !== 'undefined') {
    const saved = window.sessionStorage.getItem('dashboard_period')

    if (!sp.get('period') && saved) {
      router.replace(mkHref(saved))
    }

    if (sp.get('period')) {
      window.sessionStorage.setItem('dashboard_period', period)
    }
  }

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
