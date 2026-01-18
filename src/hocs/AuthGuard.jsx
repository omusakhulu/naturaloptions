// Third-party Imports
import { getServerSession } from 'next-auth'

// Config Imports
import { authOptions } from '@/config/auth'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

export default async function AuthGuard({ children, locale }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <AuthRedirect lang={locale} />
  }

  return <>{children}</>
}
