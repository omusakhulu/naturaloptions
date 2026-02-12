import { vi } from 'vitest'

export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMIN',
    image: null
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

export const mockCashierSession = {
  user: {
    id: 'cashier-user-id',
    name: 'Test Cashier',
    email: 'cashier@example.com',
    role: 'CASHIER',
    image: null
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

export function mockAuthenticated(session = mockSession) {
  vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn().mockResolvedValue(session)
  }))
}

export function mockUnauthenticated() {
  vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn().mockResolvedValue(null)
  }))
}
