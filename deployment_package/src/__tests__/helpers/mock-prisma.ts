import { vi, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
// eslint-disable-next-line import/named
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended'

export type MockPrismaClient = DeepMockProxy<PrismaClient>

export const prismaMock = mockDeep<PrismaClient>() as MockPrismaClient

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: prismaMock,
  prisma: prismaMock
}))

export function resetPrismaMock() {
  mockReset(prismaMock)
}

// Auto-reset between tests
beforeEach(() => {
  resetPrismaMock()
})
