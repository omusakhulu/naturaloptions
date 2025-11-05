import { prisma } from '../prisma'

export { prisma }

export async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return users.map(user => ({
    id: user.id,
    fullName: user.name || 'Unknown',
    company: 'Omnishop',
    role: 'Subscriber',
    country: 'US',
    contact: '',
    email: user.email || '',
    currentPlan: 'basic',
    status: user.emailVerified ? 'active' : 'inactive',
    avatar: user.image || '',
    avatarColor: user.image ? undefined : 'primary',
  }))
}
