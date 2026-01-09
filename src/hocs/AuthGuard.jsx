// Third-party Imports
import { getServerSession } from 'next-auth'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

// Mock session data for auto-login
const mockSession = {
  user: {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    image: '/images/avatars/1.png'
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
}

export default async function AuthGuard({ children, locale }) {
  const session = await getServerSession()

  if (!session) {
    return <AuthRedirect lang={locale} />
  }

  return <>{children}</>
}
