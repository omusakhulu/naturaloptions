"use client"

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export default function useReportQuery(defaults = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const params = useMemo(() => {
    const obj = Object.fromEntries(searchParams?.entries?.() || [])
    return { ...defaults, ...obj }
  }, [searchParams, defaults])

  const setParams = useCallback(
    (updates) => {
      const sp = new URLSearchParams(searchParams?.toString?.() || '')
      Object.entries(updates || {}).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') sp.delete(k)
        else sp.set(k, String(v))
      })
      const url = `${pathname}${sp.toString() ? `?${sp.toString()}` : ''}`
      router.push(url, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return { params, setParams }
}
