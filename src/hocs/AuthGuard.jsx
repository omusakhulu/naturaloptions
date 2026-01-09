// Third-party Imports
import { getServerSession } from 'next-auth'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

export default async function AuthGuard({ children, locale }) {
  const session = await getServerSession()

  if (!session) {
    return <AuthRedirect lang={locale} />
  }

  return <>{children}</>
}
