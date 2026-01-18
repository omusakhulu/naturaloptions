'use client'

// Next Imports
import { redirect, usePathname } from 'next/navigation'

// Config Imports
import { i18n } from '@configs/i18n'

const LangRedirect = () => {
  const pathname = usePathname()
  
  // Check if pathname already contains a valid locale segment
  // This handles both with and without basePath (e.g., /en/... or /admin/en/...)
  const hasLocale = i18n.locales.some(
    locale => pathname.includes(`/${locale}/`) || pathname.endsWith(`/${locale}`)
  )
  
  // If already has locale anywhere in path, don't redirect (avoid loops)
  if (hasLocale) {
    return null
  }
  
  const redirectUrl = `/${i18n.defaultLocale}${pathname}`

  redirect(redirectUrl)
}

export default LangRedirect
