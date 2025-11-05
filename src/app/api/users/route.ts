import { NextResponse } from 'next/server'

import { getUsers } from '@/lib/db/prisma'

export async function GET() {
  try {
    const users = await getUsers()

    // Format the data to match the expected format
    const formattedUsers = users.map(user => {
      // Extract first and last name from the fullName field if available
      const nameParts = user.fullName?.split(' ') || []
      const firstName = nameParts[0] || 'User'
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

      // Generate initials for avatar if no image
      const initials = user.fullName
        ? user.fullName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
        : user.email
          ? user.email[0].toUpperCase()
          : 'U'

      return {
        id: user.id,
        fullName: user.fullName || user.email?.split('@')[0] || 'User',
        firstName,
        lastName,
        email: user.email || 'noemail@example.com',
        phone: '',
        company: user.company || 'Omnishop',
        country: user.country || 'Kenya',
        currentPlan: user.currentPlan || 'basic',
        contact: user.contact || '+254 xxx xxx xxx',
        role: user.role || 'member',
        status: user.status || 'inactive',
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`,
        avatarColor: user.avatarColor || 'primary',
        roleIcon: 'tabler-user',
        username: user.email?.split('@')[0] || `user${user.id.slice(0, 4)}`,
        billing: 'Auto Debit',
        verified: user.status === 'active',
        isActive: user.status === 'active',
        joinedDate: new Date().toISOString(),
        plan: 'Basic',
        avatarGroup: []
      }
    })

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)

    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
