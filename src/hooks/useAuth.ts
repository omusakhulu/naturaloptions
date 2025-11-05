'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isAuthenticated = !!session
  const isLoading = status === 'loading'
  const user = session?.user

  const logout = () => {
    router.push('/en/login')
  }

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      router.push('/en/login')
      return false
    }
    return true
  }

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    logout,
    requireAuth,
    status
  }
}
