import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock next/server globally
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: any, init?: { status?: number; headers?: Record<string, string> }) => {
        const status = init?.status || 200

        return {
          status,
          ok: status >= 200 && status < 300,
          json: async () => body,
          headers: new Headers(init?.headers)
        }
      },
      next: () => ({
        status: 200,
        headers: new Headers()
      }),
      redirect: (url: string | URL) => ({
        status: 307,
        headers: new Headers({ Location: typeof url === 'string' ? url : url.toString() })
      })
    },
    NextRequest: vi.fn()
  }
})

// Suppress console output in tests unless debugging
if (!process.env.DEBUG_TESTS) {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
}
