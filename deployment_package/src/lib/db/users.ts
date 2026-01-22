import { prisma } from '@/lib/prisma'

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      },
      orderBy: { name: 'asc' }
    })

    return users
  } catch (error) {
    console.error('Error fetching users:', error)

    return []
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    })

    return user
  } catch (error) {
    console.error('Error fetching user:', error)

    return null
  }
}
