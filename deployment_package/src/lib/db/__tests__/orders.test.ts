import { vi, describe, it, expect, beforeEach } from 'vitest'

import { prismaMock } from '@/__tests__/helpers/mock-prisma'

// Must import AFTER the mock is set up
import {
  saveOrder,
  saveOrders,
  getAllOrders,
  getOrderByWooId,
  deleteOrder,
  clearAllOrders,
  getOrdersByCustomerId
} from '../orders'

const mockOrder = {
  id: 'test-order-1',
  wooId: 500,
  orderNumber: '#500',
  customerId: 10,
  status: 'completed',
  total: '99.99',
  subtotal: '89.99',
  shippingTotal: '5.00',
  taxTotal: '5.00',
  discountTotal: '0.00',
  paymentMethod: 'stripe',
  paymentMethodTitle: 'Credit Card',
  customerNote: 'Leave at door',
  dateCreated: new Date('2026-01-15'),
  datePaid: new Date('2026-01-15'),
  dateCompleted: new Date('2026-01-16'),
  shippingAddress: JSON.stringify({ city: 'Portland' }),
  billingAddress: JSON.stringify({ city: 'Portland' }),
  lineItems: JSON.stringify([{ name: 'Test Product', quantity: 1 }]),
  customer: JSON.stringify({ id: 10 }),
  syncedAt: new Date('2026-01-16'),
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-16')
}

describe('orders database layer', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  })

  // ─── saveOrder ─────────────────────────────────────────────────

  describe('saveOrder', () => {
    it('should upsert an order by wooId and return the order', async () => {
      prismaMock.order.upsert.mockResolvedValue(mockOrder)

      const result = await saveOrder({
        id: 500,
        order_number: '#500',
        status: 'completed',
        total: '99.99',
        customer_id: 10
      })

      expect(result).toEqual(mockOrder)
      expect(prismaMock.order.upsert).toHaveBeenCalledTimes(1)
      expect(prismaMock.order.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { wooId: 500 }
        })
      )
    })

    it('should return null when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await saveOrder({ id: 500 })

      expect(result).toBeNull()
      expect(prismaMock.order.upsert).not.toHaveBeenCalled()
    })

    it('should throw when prisma upsert fails', async () => {
      prismaMock.order.upsert.mockRejectedValue(new Error('Upsert failed'))

      await expect(saveOrder({ id: 500, status: 'pending' })).rejects.toThrow('Upsert failed')
    })
  })

  // ─── saveOrders ────────────────────────────────────────────────

  describe('saveOrders', () => {
    it('should save multiple orders and return results array', async () => {
      prismaMock.order.upsert.mockResolvedValue(mockOrder)

      const result = await saveOrders([
        { id: 500, status: 'completed' },
        { id: 501, status: 'processing' }
      ])

      expect(result).toHaveLength(2)
      expect(prismaMock.order.upsert).toHaveBeenCalledTimes(2)
    })

    it('should return empty array when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await saveOrders([{ id: 500 }])

      expect(result).toEqual([])
      expect(prismaMock.order.upsert).not.toHaveBeenCalled()
    })
  })

  // ─── getAllOrders ──────────────────────────────────────────────

  describe('getAllOrders', () => {
    it('should return all orders ordered by dateCreated desc', async () => {
      prismaMock.order.findMany.mockResolvedValue([mockOrder])

      const result = await getAllOrders()

      expect(result).toEqual([mockOrder])
      expect(prismaMock.order.findMany).toHaveBeenCalledWith({
        orderBy: { dateCreated: 'desc' }
      })
    })

    it('should respect the take option', async () => {
      prismaMock.order.findMany.mockResolvedValue([mockOrder])

      await getAllOrders({ take: 10 })

      expect(prismaMock.order.findMany).toHaveBeenCalledWith({
        orderBy: { dateCreated: 'desc' },
        take: 10
      })
    })

    it('should return empty array when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await getAllOrders()

      expect(result).toEqual([])
      expect(prismaMock.order.findMany).not.toHaveBeenCalled()
    })

    it('should return empty array when prisma findMany fails', async () => {
      prismaMock.order.findMany.mockRejectedValue(new Error('Query failed'))

      const result = await getAllOrders()

      expect(result).toEqual([])
    })
  })

  // ─── getOrderByWooId ──────────────────────────────────────────

  describe('getOrderByWooId', () => {
    it('should return an order by wooId', async () => {
      prismaMock.order.findUnique.mockResolvedValue(mockOrder)

      const result = await getOrderByWooId(500)

      expect(result).toEqual(mockOrder)
      expect(prismaMock.order.findUnique).toHaveBeenCalledWith({
        where: { wooId: 500 }
      })
    })

    it('should return null when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await getOrderByWooId(500)

      expect(result).toBeNull()
      expect(prismaMock.order.findUnique).not.toHaveBeenCalled()
    })

    it('should return null when prisma findUnique fails', async () => {
      prismaMock.order.findUnique.mockRejectedValue(new Error('Lookup failed'))

      const result = await getOrderByWooId(500)

      expect(result).toBeNull()
    })
  })

  // ─── deleteOrder ───────────────────────────────────────────────

  describe('deleteOrder', () => {
    it('should delete an order by wooId', async () => {
      prismaMock.order.delete.mockResolvedValue(mockOrder)

      const result = await deleteOrder(500)

      expect(result).toEqual(mockOrder)
      expect(prismaMock.order.delete).toHaveBeenCalledWith({
        where: { wooId: 500 }
      })
    })

    it('should return null when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await deleteOrder(500)

      expect(result).toBeNull()
      expect(prismaMock.order.delete).not.toHaveBeenCalled()
    })

    it('should return null when prisma delete fails', async () => {
      prismaMock.order.delete.mockRejectedValue(new Error('Delete failed'))

      const result = await deleteOrder(500)

      expect(result).toBeNull()
    })
  })

  // ─── clearAllOrders ────────────────────────────────────────────

  describe('clearAllOrders', () => {
    it('should delete all orders and return result', async () => {
      prismaMock.order.deleteMany.mockResolvedValue({ count: 25 })

      const result = await clearAllOrders()

      expect(result).toEqual({ count: 25 })
      expect(prismaMock.order.deleteMany).toHaveBeenCalledWith({})
    })

    it('should return null when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await clearAllOrders()

      expect(result).toBeNull()
      expect(prismaMock.order.deleteMany).not.toHaveBeenCalled()
    })

    it('should return null when prisma deleteMany fails', async () => {
      prismaMock.order.deleteMany.mockRejectedValue(new Error('Clear failed'))

      const result = await clearAllOrders()

      expect(result).toBeNull()
    })
  })

  // ─── getOrdersByCustomerId ─────────────────────────────────────

  describe('getOrdersByCustomerId', () => {
    it('should return orders for a specific customer', async () => {
      prismaMock.order.findMany.mockResolvedValue([mockOrder])

      const result = await getOrdersByCustomerId(10)

      expect(result).toEqual([mockOrder])
      expect(prismaMock.order.findMany).toHaveBeenCalledWith({
        where: { customerId: 10 },
        orderBy: { dateCreated: 'desc' }
      })
    })

    it('should return empty array when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await getOrdersByCustomerId(10)

      expect(result).toEqual([])
      expect(prismaMock.order.findMany).not.toHaveBeenCalled()
    })

    it('should return empty array when prisma findMany fails', async () => {
      prismaMock.order.findMany.mockRejectedValue(new Error('Query error'))

      const result = await getOrdersByCustomerId(10)

      expect(result).toEqual([])
    })
  })
})
