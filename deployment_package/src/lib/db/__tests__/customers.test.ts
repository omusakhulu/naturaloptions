import { vi, describe, it, expect, beforeEach } from 'vitest'

import { prismaMock } from '@/__tests__/helpers/mock-prisma'

// Must import AFTER the mock is set up
import {
  saveCustomer,
  saveCustomers,
  getAllCustomers,
  getCustomerByWooId,
  deleteCustomer,
  clearAllCustomers
} from '../customers'

const mockCustomer = {
  id: 'test-customer-1',
  wooId: 200,
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  role: 'customer',
  avatarUrl: 'https://example.com/avatar.jpg',
  billingAddress: JSON.stringify({ city: 'Portland', state: 'OR' }),
  shippingAddress: JSON.stringify({ city: 'Portland', state: 'OR' }),
  syncedAt: new Date('2026-01-10'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-10')
}

describe('customers database layer', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  })

  // ─── saveCustomer ──────────────────────────────────────────────

  describe('saveCustomer', () => {
    it('should upsert a customer by wooId and return the customer', async () => {
      prismaMock.customer.upsert.mockResolvedValue(mockCustomer)

      const result = await saveCustomer({
        id: 200,
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe'
      })

      expect(result).toEqual(mockCustomer)
      expect(prismaMock.customer.upsert).toHaveBeenCalledTimes(1)
      expect(prismaMock.customer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { wooId: 200 }
        })
      )
    })

    it('should return null when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await saveCustomer({ id: 200, email: 'john@example.com' })

      expect(result).toBeNull()
      expect(prismaMock.customer.upsert).not.toHaveBeenCalled()
    })

    it('should return null when prisma upsert fails', async () => {
      prismaMock.customer.upsert.mockRejectedValue(new Error('Upsert failed'))

      const result = await saveCustomer({ id: 200, email: 'john@example.com' })

      expect(result).toBeNull()
    })
  })

  // ─── saveCustomers ─────────────────────────────────────────────

  describe('saveCustomers', () => {
    it('should save multiple customers and return results with nulls filtered out', async () => {
      prismaMock.customer.upsert.mockResolvedValue(mockCustomer)

      const result = await saveCustomers([
        { id: 200, email: 'john@example.com' },
        { id: 201, email: 'jane@example.com' }
      ])

      expect(result).toHaveLength(2)
      expect(prismaMock.customer.upsert).toHaveBeenCalledTimes(2)
    })

    it('should filter out null results from failed individual saves', async () => {
      prismaMock.customer.upsert.mockResolvedValueOnce(mockCustomer).mockRejectedValueOnce(new Error('Failed'))

      const result = await saveCustomers([
        { id: 200, email: 'john@example.com' },
        { id: 201, email: 'bad@example.com' }
      ])

      // saveCustomer catches errors and returns null, then saveCustomers filters nulls
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockCustomer)
    })

    it('should return empty array when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await saveCustomers([{ id: 200, email: 'john@example.com' }])

      expect(result).toEqual([])
      expect(prismaMock.customer.upsert).not.toHaveBeenCalled()
    })
  })

  // ─── getAllCustomers ───────────────────────────────────────────

  describe('getAllCustomers', () => {
    it('should return all customers ordered by createdAt desc', async () => {
      prismaMock.customer.findMany.mockResolvedValue([mockCustomer])

      const result = await getAllCustomers()

      expect(result).toEqual([mockCustomer])
      expect(prismaMock.customer.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should respect the take option', async () => {
      prismaMock.customer.findMany.mockResolvedValue([mockCustomer])

      await getAllCustomers({ take: 20 })

      expect(prismaMock.customer.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    })

    it('should return empty array when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await getAllCustomers()

      expect(result).toEqual([])
      expect(prismaMock.customer.findMany).not.toHaveBeenCalled()
    })

    it('should return empty array when prisma findMany fails', async () => {
      prismaMock.customer.findMany.mockRejectedValue(new Error('Query failed'))

      const result = await getAllCustomers()

      expect(result).toEqual([])
    })
  })

  // ─── getCustomerByWooId ────────────────────────────────────────

  describe('getCustomerByWooId', () => {
    it('should return a customer by wooId', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(mockCustomer)

      const result = await getCustomerByWooId(200)

      expect(result).toEqual(mockCustomer)
      expect(prismaMock.customer.findUnique).toHaveBeenCalledWith({
        where: { wooId: 200 }
      })
    })

    it('should return null when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await getCustomerByWooId(200)

      expect(result).toBeNull()
      expect(prismaMock.customer.findUnique).not.toHaveBeenCalled()
    })

    it('should return null when prisma findUnique fails', async () => {
      prismaMock.customer.findUnique.mockRejectedValue(new Error('Lookup error'))

      const result = await getCustomerByWooId(200)

      expect(result).toBeNull()
    })
  })

  // ─── deleteCustomer ────────────────────────────────────────────

  describe('deleteCustomer', () => {
    it('should delete a customer by wooId', async () => {
      prismaMock.customer.delete.mockResolvedValue(mockCustomer)

      const result = await deleteCustomer(200)

      expect(result).toEqual(mockCustomer)
      expect(prismaMock.customer.delete).toHaveBeenCalledWith({
        where: { wooId: 200 }
      })
    })

    it('should return null when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await deleteCustomer(200)

      expect(result).toBeNull()
      expect(prismaMock.customer.delete).not.toHaveBeenCalled()
    })

    it('should return null when prisma delete fails', async () => {
      prismaMock.customer.delete.mockRejectedValue(new Error('Delete failed'))

      const result = await deleteCustomer(200)

      expect(result).toBeNull()
    })
  })

  // ─── clearAllCustomers ─────────────────────────────────────────

  describe('clearAllCustomers', () => {
    it('should delete all customers and return count', async () => {
      prismaMock.customer.deleteMany.mockResolvedValue({ count: 50 })

      const result = await clearAllCustomers()

      expect(result).toBe(50)
      expect(prismaMock.customer.deleteMany).toHaveBeenCalledWith({})
    })

    it('should return 0 when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await clearAllCustomers()

      expect(result).toBe(0)
      expect(prismaMock.customer.deleteMany).not.toHaveBeenCalled()
    })

    it('should return 0 when prisma deleteMany fails', async () => {
      prismaMock.customer.deleteMany.mockRejectedValue(new Error('Clear failed'))

      const result = await clearAllCustomers()

      expect(result).toBe(0)
    })
  })
})
