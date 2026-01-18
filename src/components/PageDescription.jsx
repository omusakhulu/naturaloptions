'use client'

import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { usePathname } from 'next/navigation'

const normalizePath = pathname => {
  if (!pathname) return '/'

  const parts = pathname.split('/').filter(Boolean)

  if (parts.length && parts[0].length === 2) {
    return '/' + parts.slice(1).join('/')
  }

  return pathname
}

const toTitle = segment => {
  if (!segment) return 'This Page'

  return segment
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

const PAGE_DESCRIPTIONS = {
  '/dashboards/analytics': {
    line1: 'This dashboard summarizes key analytics and performance metrics across your business.',
    line2: 'Use it to monitor trends and drill into reports to understand what is driving results.'
  },
  '/dashboards/ecommerce': {
    line1: 'This dashboard gives you a high-level view of your ecommerce performance and activity.',
    line2: 'Use it to track revenue, orders, and customer behavior at a glance.'
  },
  '/apps/ecommerce/dashboard': {
    line1: 'This page provides an overview of your store’s sales, orders, and product performance.',
    line2: 'Use the controls and widgets here to spot changes quickly and investigate details.'
  },
  '/apps/logistics/dashboard': {
    line1: 'This page summarizes your logistics operations so you can see status and workload at a glance.',
    line2: 'Use it to identify bottlenecks and jump into the areas that need action.'
  }
}

const PageDescription = () => {
  const pathname = usePathname()
  const normalized = normalizePath(pathname)

  const exact = PAGE_DESCRIPTIONS[normalized]

  const lastSegment = normalized.split('/').filter(Boolean).slice(-1)[0]
  const fallbackTitle = toTitle(lastSegment)

  const line1 = exact?.line1 || `This page helps you work with ${fallbackTitle.toLowerCase()} in your dashboard.`
  const line2 = exact?.line2 || 'Use the tools and filters on this page to review information and take action.'

  return (
    <Box className='mb-6'>
      <Typography variant='body2' color='text.secondary'>
        {line1}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {line2}
      </Typography>
    </Box>
  )
}

export default PageDescription
