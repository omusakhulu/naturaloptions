/**
 * Example Unit Tests
 *
 * Unit tests focus on testing individual functions and modules in isolation.
 * These tests should be fast, deterministic, and not require external dependencies.
 */

import { describe, it, expect, vi } from 'vitest'

// Example utility function to test
function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

function calculateDiscount(price: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount must be between 0 and 100')
  }
  return price * (1 - discountPercent / 100)
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function generateOrderNumber(prefix = 'ORD'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${timestamp}-${random}`
}

describe('Unit Tests - Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(19.99)).toBe('$19.99')
      expect(formatCurrency(1000)).toBe('$1,000.00')
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should handle different currencies', () => {
      expect(formatCurrency(19.99, 'EUR')).toContain('19.99')
      expect(formatCurrency(19.99, 'GBP')).toContain('19.99')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-19.99)).toBe('-$19.99')
    })
  })

  describe('calculateDiscount', () => {
    it('should calculate discount correctly', () => {
      expect(calculateDiscount(100, 10)).toBe(90)
      expect(calculateDiscount(100, 25)).toBe(75)
      expect(calculateDiscount(100, 50)).toBe(50)
    })

    it('should handle 0% discount', () => {
      expect(calculateDiscount(100, 0)).toBe(100)
    })

    it('should handle 100% discount', () => {
      expect(calculateDiscount(100, 100)).toBe(0)
    })

    it('should throw error for invalid discount', () => {
      expect(() => calculateDiscount(100, -10)).toThrow('Discount must be between 0 and 100')
      expect(() => calculateDiscount(100, 150)).toThrow('Discount must be between 0 and 100')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('invalid@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('generateOrderNumber', () => {
    it('should generate order number with default prefix', () => {
      const orderNumber = generateOrderNumber()
      expect(orderNumber).toMatch(/^ORD-\d+-\d{3}$/)
    })

    it('should generate order number with custom prefix', () => {
      const orderNumber = generateOrderNumber('INV')
      expect(orderNumber).toMatch(/^INV-\d+-\d{3}$/)
    })

    it('should generate unique order numbers', () => {
      const orderNumbers = new Set()
      for (let i = 0; i < 100; i++) {
        orderNumbers.add(generateOrderNumber())
      }
      // Most should be unique (allowing for rare collisions)
      expect(orderNumbers.size).toBeGreaterThan(95)
    })
  })
})

describe('Unit Tests - Mocking Example', () => {
  it('should mock external dependencies', () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    })

    global.fetch = mockFetch

    // Now any code using fetch will use the mock
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should spy on function calls', () => {
    const obj = {
      method: (x: number) => x * 2,
    }

    const spy = vi.spyOn(obj, 'method')

    obj.method(5)
    obj.method(10)

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith(5)
    expect(spy).toHaveBeenCalledWith(10)
  })
})
