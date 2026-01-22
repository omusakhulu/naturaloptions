import { prisma } from '../prisma'

export { prisma }

export async function getUsers() {
  const users = await prisma.user.findMany({
    where: {
      active: true,
      NOT: {
        email: { contains: '@deleted.local' }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      role: true,
      active: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return users.map(user => {
    const fullName = user.name || user.email?.split('@')[0] || 'User'
    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return {
      id: user.id,
      fullName,
      firstName: fullName.split(' ')[0] || 'User',
      lastName: fullName.split(' ').slice(1).join(' '),
      email: user.email || '',
      username: user.email?.split('@')[0] || `user${user.id.slice(0, 4)}`,
      role: user.role,
      status: user.active ? 'active' : 'inactive',
      isActive: user.active,
      verified: Boolean(user.emailVerified),
      avatar: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`,
      avatarColor: user.image ? undefined : 'primary',
      joinedDate: user.createdAt.toISOString(),
      avatarGroup: []
    }
  })
}
