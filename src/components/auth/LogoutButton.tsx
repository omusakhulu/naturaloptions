'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface LogoutButtonProps {
  children?: React.ReactNode
  className?: string
}

export default function LogoutButton({ children, className }: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ 
      redirect: false,
      callbackUrl: '/en/login' 
    })
    router.push('/en/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} className={className}>
      {children || 'Logout'}
    </button>
  )
}
