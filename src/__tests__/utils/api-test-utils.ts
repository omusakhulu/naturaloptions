import { vi } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Create a mock NextRequest for API route testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options

  const urlObj = new URL(url, 'http://localhost:3000')

  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(urlObj, requestInit)
}

/**
 * Create mock route context with params
 */
export function createRouteContext(params: Record<string, string> = {}) {
  return {
    params: Promise.resolve(params),
  }
}

/**
 * Mock authenticated session for API routes
 */
export function mockAuthenticatedSession(user = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'ADMIN',
}) {
  vi.mock('next-auth', () => ({
    getServerSession: vi.fn().mockResolvedValue({
      user,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }),
  }))
}

/**
 * Mock unauthenticated session for API routes
 */
export function mockUnauthenticatedSession() {
  vi.mock('next-auth', () => ({
    getServerSession: vi.fn().mockResolvedValue(null),
  }))
}

/**
 * Parse JSON response from API route
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Failed to parse response: ${text}`)
  }
}

/**
 * Assert API response status and optionally body
 */
export async function assertApiResponse<T>(
  response: Response,
  expectedStatus: number,
  expectedBody?: Partial<T>
) {
  expect(response.status).toBe(expectedStatus)

  if (expectedBody) {
    const body = await parseJsonResponse<T>(response)
    expect(body).toMatchObject(expectedBody)
  }
}

/**
 * Create mock Prisma transaction
 */
export function createMockTransaction() {
  return vi.fn().mockImplementation(async (callback) => {
    const mockTx = {
      user: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
      product: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
      order: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
      customer: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
      invoice: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    }
    return callback(mockTx)
  })
}

/**
 * Test data factories
 */
export const testDataFactories = {
  user: (overrides = {}) => ({
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  product: (overrides = {}) => ({
    id: 1,
    wooId: 100,
    name: 'Test Product',
    sku: 'TEST-001',
    price: '19.99',
    regularPrice: '24.99',
    stockQuantity: 100,
    stockStatus: 'instock',
    status: 'publish',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  customer: (overrides = {}) => ({
    id: 1,
    wooId: 200,
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  order: (overrides = {}) => ({
    id: 1,
    wooId: 300,
    orderNumber: 'ORD-001',
    status: 'processing',
    total: '99.99',
    customerId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  invoice: (overrides = {}) => ({
    id: 1,
    invoiceNumber: 'INV-001',
    status: 'draft',
    subtotal: '89.99',
    tax: '10.00',
    total: '99.99',
    customerId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  posSale: (overrides = {}) => ({
    id: 1,
    saleNumber: 'POS-001',
    total: '49.99',
    paymentMethod: 'cash',
    status: 'completed',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
}
