/**
 * Example Component Tests
 *
 * Component tests verify that React components render correctly
 * and respond to user interactions as expected.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'

// Example component to test
function Counter({ initialCount = 0, onCountChange }: { initialCount?: number; onCountChange?: (count: number) => void }) {
  const [count, setCount] = React.useState(initialCount)

  const handleIncrement = () => {
    const newCount = count + 1
    setCount(newCount)
    onCountChange?.(newCount)
  }

  const handleDecrement = () => {
    const newCount = count - 1
    setCount(newCount)
    onCountChange?.(newCount)
  }

  return (
    <div>
      <h2 data-testid="count-display">Count: {count}</h2>
      <button onClick={handleDecrement} data-testid="decrement-btn">
        Decrease
      </button>
      <button onClick={handleIncrement} data-testid="increment-btn">
        Increase
      </button>
    </div>
  )
}

// Import React for the component
import React from 'react'

describe('Component Tests - Counter', () => {
  it('should render with initial count', () => {
    render(<Counter initialCount={5} />)

    expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 5')
  })

  it('should render with default count of 0', () => {
    render(<Counter />)

    expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 0')
  })

  it('should increment count when increase button is clicked', () => {
    render(<Counter initialCount={0} />)

    fireEvent.click(screen.getByTestId('increment-btn'))

    expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 1')
  })

  it('should decrement count when decrease button is clicked', () => {
    render(<Counter initialCount={5} />)

    fireEvent.click(screen.getByTestId('decrement-btn'))

    expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 4')
  })

  it('should call onCountChange callback when count changes', () => {
    const mockOnCountChange = vi.fn()
    render(<Counter initialCount={0} onCountChange={mockOnCountChange} />)

    fireEvent.click(screen.getByTestId('increment-btn'))

    expect(mockOnCountChange).toHaveBeenCalledWith(1)
  })

  it('should handle multiple clicks', () => {
    const mockOnCountChange = vi.fn()
    render(<Counter initialCount={0} onCountChange={mockOnCountChange} />)

    fireEvent.click(screen.getByTestId('increment-btn'))
    fireEvent.click(screen.getByTestId('increment-btn'))
    fireEvent.click(screen.getByTestId('increment-btn'))

    expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 3')
    expect(mockOnCountChange).toHaveBeenCalledTimes(3)
  })
})

// Example async component
function AsyncDataLoader({ url }: { url: string }) {
  const [data, setData] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch')
        const result = await response.json()
        setData(result.message)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [url])

  if (loading) return <div data-testid="loading">Loading...</div>
  if (error) return <div data-testid="error">Error: {error}</div>
  return <div data-testid="data">{data}</div>
}

describe('Component Tests - Async Data Loader', () => {
  it('should show loading state initially', () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}))

    render(<AsyncDataLoader url="/api/test" />)

    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('should display data after successful fetch', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Hello World' }),
    } as Response)

    render(<AsyncDataLoader url="/api/test" />)

    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('Hello World')
    })
  })

  it('should display error on failed fetch', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
    } as Response)

    render(<AsyncDataLoader url="/api/test" />)

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Error: Failed to fetch')
    })
  })
})

// Example form component
function LoginForm({ onSubmit }: { onSubmit: (email: string, password: string) => void }) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(email, password)
  }

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />

      <button type="submit" data-testid="submit-btn">
        Login
      </button>
    </form>
  )
}

describe('Component Tests - Login Form', () => {
  it('should render form inputs', () => {
    render(<LoginForm onSubmit={vi.fn()} />)

    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument()
  })

  it('should update input values when typing', () => {
    render(<LoginForm onSubmit={vi.fn()} />)

    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('should call onSubmit with form values', () => {
    const mockOnSubmit = vi.fn()
    render(<LoginForm onSubmit={mockOnSubmit} />)

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByTestId('submit-btn'))

    expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123')
  })
})
