import { vi, describe, it, expect, beforeEach } from 'vitest'

import { prismaMock } from '@/__tests__/helpers/mock-prisma'

import { getAllUsers, getUserById } from '../users'

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
})

const sampleUsers = [
  { id: 'user-1', name: 'Alice', email: 'alice@example.com', image: 'https://img.test/alice.png' },
  { id: 'user-2', name: 'Bob', email: 'bob@example.com', image: null }
]

// ---------------------------------------------------------------------------
// getAllUsers
// ---------------------------------------------------------------------------
describe('getAllUsers', () => {
  it('returns all users with selected fields ordered by name asc', async () => {
    prismaMock.user.findMany.mockResolvedValue(sampleUsers as any)

    const result = await getAllUsers()

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      },
      orderBy: { name: 'asc' }
    })
    expect(result).toEqual(sampleUsers)
    expect(result).toHaveLength(2)
  })

  it('returns [] on error', async () => {
    prismaMock.user.findMany.mockRejectedValue(new Error('connection refused'))

    const result = await getAllUsers()

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getUserById
// ---------------------------------------------------------------------------
describe('getUserById', () => {
  it('returns a user by id with selected fields', async () => {
    prismaMock.user.findUnique.mockResolvedValue(sampleUsers[0] as any)

    const result = await getUserById('user-1')

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    })
    expect(result).toEqual(sampleUsers[0])
  })

  it('returns null when user is not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const result = await getUserById('nonexistent')

    expect(result).toBeNull()
  })

  it('returns null on error', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('timeout'))

    const result = await getUserById('user-1')

    expect(result).toBeNull()
  })
})
