import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock dependencies BEFORE importing withAuth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}))

vi.mock('@/config/auth', () => ({
  authOptions: {}
}))

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}))

import { getServerSession } from 'next-auth/next'

import { withAuth } from '../with-auth'
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../errors'

function createMockRequest(url = 'http://localhost:3000/api/test', method = 'GET') {
  return new Request(url, { method })
}

describe('withAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when session is null', async () => {
    ;(getServerSession as any).mockResolvedValue(null)

    const handler = vi.fn()
    const wrapped = withAuth(handler)
    const req = createMockRequest()

    const response = await wrapped(req as any)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ success: false, error: 'Unauthorized' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls handler with session when authenticated', async () => {
    const mockSession = { user: { id: '1', email: 'test@example.com' } }

    ;(getServerSession as any).mockResolvedValue(mockSession)

    const mockResponse = { status: 200, json: async () => ({ success: true }) }
    const handler = vi.fn().mockResolvedValue(mockResponse)
    const wrapped = withAuth(handler)
    const req = createMockRequest()

    const response = await wrapped(req as any)

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(req, { session: mockSession, params: undefined })
    expect(response).toBe(mockResponse)
  })

  it('catches unhandled errors and returns 500', async () => {
    const mockSession = { user: { id: '1' } }

    ;(getServerSession as any).mockResolvedValue(mockSession)

    const handler = vi.fn().mockRejectedValue(new Error('Unexpected failure'))
    const wrapped = withAuth(handler)
    const req = createMockRequest()

    const response = await wrapped(req as any)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ success: false, error: 'Internal server error' })
  })

  it('handles AppError subclasses with correct status codes', async () => {
    const mockSession = { user: { id: '1' } }

    ;(getServerSession as any).mockResolvedValue(mockSession)

    // Test NotFoundError (404)
    const notFoundHandler = vi.fn().mockRejectedValue(new NotFoundError('User', '42'))
    const wrappedNotFound = withAuth(notFoundHandler)
    const req1 = createMockRequest()

    const notFoundResponse = await wrappedNotFound(req1 as any)
    const notFoundBody = await notFoundResponse.json()

    expect(notFoundResponse.status).toBe(404)
    expect(notFoundBody).toEqual({
      success: false,
      error: 'User with id 42 not found',
      code: 'NOT_FOUND'
    })

    // Test ForbiddenError (403)
    const forbiddenHandler = vi.fn().mockRejectedValue(new ForbiddenError())
    const wrappedForbidden = withAuth(forbiddenHandler)
    const req2 = createMockRequest()

    const forbiddenResponse = await wrappedForbidden(req2 as any)
    const forbiddenBody = await forbiddenResponse.json()

    expect(forbiddenResponse.status).toBe(403)
    expect(forbiddenBody).toEqual({
      success: false,
      error: 'Forbidden',
      code: 'FORBIDDEN'
    })
  })

  it('includes validation details for ValidationError with details', async () => {
    const mockSession = { user: { id: '1' } }

    ;(getServerSession as any).mockResolvedValue(mockSession)

    const details = { email: ['Email is required'] }
    const handler = vi.fn().mockRejectedValue(new ValidationError('Validation failed', details))
    const wrapped = withAuth(handler)
    const req = createMockRequest()

    const response = await wrapped(req as any)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: { email: ['Email is required'] }
    })
  })

  it('omits details for ValidationError without details', async () => {
    const mockSession = { user: { id: '1' } }

    ;(getServerSession as any).mockResolvedValue(mockSession)

    const handler = vi.fn().mockRejectedValue(new ValidationError('Validation failed'))
    const wrapped = withAuth(handler)
    const req = createMockRequest()

    const response = await wrapped(req as any)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR'
    })
    expect(body.details).toBeUndefined()
  })

  it('returns correct JSON structure for error responses', async () => {
    ;(getServerSession as any).mockResolvedValue(null)

    const handler = vi.fn()
    const wrapped = withAuth(handler)
    const req = createMockRequest()

    const response = await wrapped(req as any)
    const body = await response.json()

    expect(body).toHaveProperty('success', false)
    expect(body).toHaveProperty('error')
    expect(typeof body.error).toBe('string')
  })
})
