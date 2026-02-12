import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Provider } from 'react-redux'
import { configureStore, Store } from '@reduxjs/toolkit'
import { SessionProvider } from 'next-auth/react'

// Create a basic MUI theme for tests
const theme = createTheme({
  palette: {
    mode: 'light',
  },
})

// Mock session for testing
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMIN',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

// Create a mock store for testing
function createMockStore(preloadedState = {}): Store {
  return configureStore({
    reducer: {
      // Add your reducers here as needed
      test: (state = {}) => state,
    },
    preloadedState,
  })
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Record<string, unknown>
  store?: Store
  session?: typeof mockSession | null
}

// Custom render function that wraps components with providers
function customRender(
  ui: ReactElement,
  {
    preloadedState = {},
    store = createMockStore(preloadedState),
    session = mockSession,
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult & { store: Store } {
  function AllTheProviders({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        <Provider store={store}>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </Provider>
      </SessionProvider>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: AllTheProviders, ...renderOptions }),
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'

// Override render method
export { customRender as render }

// Utility function to create mock API response
export function createMockResponse<T>(data: T, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  }
}

// Utility to wait for async operations
export async function waitForAsync(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Mock Prisma client for unit tests
export const mockPrismaClient = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  product: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  order: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  customer: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  invoice: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  pOSSale: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
}

// Type helper for mocking functions
export type MockFunction<T extends (...args: unknown[]) => unknown> = ReturnType<typeof vi.fn<T>>
