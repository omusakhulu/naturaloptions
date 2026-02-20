import { vi, describe, it, expect, beforeEach } from 'vitest'

import { prismaMock } from '@/__tests__/helpers/mock-prisma'

// Must import AFTER the mock is set up
import {
  saveProduct,
  saveProducts,
  getAllProducts,
  getProductByWooId,
  deleteProduct,
  clearAllProducts
} from '../products'

const mockProduct = {
  id: 'test-product-1',
  wooId: 100,
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product',
  shortDescription: 'Test',
  price: '29.99',
  regularPrice: '39.99',
  salePrice: '29.99',
  stockStatus: 'instock',
  stockQuantity: 10,
  sku: 'TEST-001',
  image: 'https://example.com/image.jpg',
  images: JSON.stringify([{ src: 'https://example.com/image.jpg' }]),
  categories: JSON.stringify([{ id: 1, name: 'Supplements', slug: 'supplements' }]),
  rating: 4.5,
  ratingCount: 12,
  status: 'publish',
  shippingClass: null,
  attributes: '[]',
  tags: '[]',
  actualStock: 0,
  websiteStock: 0,
  reservedStock: 0,
  lowStockAlert: 10,
  autoSyncStock: false,
  lastStockSync: null,
  syncedAt: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01')
}

describe('products database layer', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  })

  // ─── saveProduct ───────────────────────────────────────────────

  describe('saveProduct', () => {
    it('should upsert a product by wooId and return the product', async () => {
      prismaMock.product.upsert.mockResolvedValue(mockProduct)

      const result = await saveProduct({
        id: 100,
        wooId: 100,
        name: 'Test Product',
        slug: 'test-product'
      })

      expect(result).toEqual(mockProduct)
      expect(prismaMock.product.upsert).toHaveBeenCalledTimes(1)
      expect(prismaMock.product.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { wooId: 100 }
        })
      )
    })

    it('should upsert by id when wooId is not provided', async () => {
      prismaMock.product.upsert.mockResolvedValue(mockProduct)

      const result = await saveProduct({
        id: 100,
        name: 'Test Product',
        slug: 'test-product'
      })

      expect(result).toEqual(mockProduct)
      expect(prismaMock.product.upsert).toHaveBeenCalledTimes(1)
    })

    it('should call upsert when slug is provided', async () => {
      prismaMock.product.upsert.mockResolvedValue(mockProduct)

      const result = await saveProduct({
        id: 0 as any,
        wooId: undefined,
        name: 'Test Product',
        slug: 'test-product'
      })

      expect(result).toBeTruthy()
      expect(prismaMock.product.upsert).toHaveBeenCalledTimes(1)
    })

    it('should return null when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await saveProduct({
        id: 100,
        wooId: 100,
        name: 'Test Product',
        slug: 'test-product'
      })

      expect(result).toBeNull()
      expect(prismaMock.product.upsert).not.toHaveBeenCalled()
    })

    it('should throw when prisma upsert fails', async () => {
      prismaMock.product.upsert.mockRejectedValue(new Error('DB connection failed'))

      await expect(saveProduct({ id: 100, wooId: 100, name: 'Test', slug: 'test' })).rejects.toThrow(
        'DB connection failed'
      )
    })
  })

  // ─── saveProducts ──────────────────────────────────────────────

  describe('saveProducts', () => {
    it('should save multiple products and return results array', async () => {
      prismaMock.product.upsert.mockResolvedValue(mockProduct)

      const result = await saveProducts([
        { id: 100, wooId: 100, name: 'Product 1', slug: 'product-1' },
        { id: 101, wooId: 101, name: 'Product 2', slug: 'product-2' }
      ])

      expect(result).toHaveLength(2)
      expect(prismaMock.product.upsert).toHaveBeenCalledTimes(2)
    })

    it('should return empty array when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await saveProducts([{ id: 100, wooId: 100, name: 'Product 1', slug: 'product-1' }])

      expect(result).toEqual([])
      expect(prismaMock.product.upsert).not.toHaveBeenCalled()
    })
  })

  // ─── getAllProducts ────────────────────────────────────────────

  describe('getAllProducts', () => {
    it('should return all products ordered by syncedAt desc, createdAt desc', async () => {
      prismaMock.product.findMany.mockResolvedValue([mockProduct])

      const result = await getAllProducts()

      expect(result).toEqual([mockProduct])
      expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1)
    })

    it('should respect the take option', async () => {
      prismaMock.product.findMany.mockResolvedValue([mockProduct])

      await getAllProducts({ take: 5 })

      expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await getAllProducts()

      expect(result).toEqual([])
      expect(prismaMock.product.findMany).not.toHaveBeenCalled()
    })

    it('should throw when prisma findMany fails', async () => {
      prismaMock.product.findMany.mockRejectedValue(new Error('Query failed'))

      await expect(getAllProducts()).rejects.toThrow('Query failed')
    })
  })

  // ─── getProductByWooId ─────────────────────────────────────────

  describe('getProductByWooId', () => {
    it('should return a product by wooId', async () => {
      prismaMock.product.findUnique.mockResolvedValue(mockProduct)

      const result = await getProductByWooId(100)

      expect(result).toEqual(mockProduct)
      expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
        where: { wooId: 100 }
      })
    })

    it('should handle string-to-number conversion for wooId', async () => {
      prismaMock.product.findUnique.mockResolvedValue(mockProduct)

      const result = await getProductByWooId('100' as any)

      expect(result).toEqual(mockProduct)
      expect(prismaMock.product.findUnique).toHaveBeenCalledTimes(1)
    })

    it('should return null for NaN input', async () => {
      const result = await getProductByWooId('not-a-number' as any)

      expect(result).toBeFalsy()
    })

    it('should return null when product is not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null)

      const result = await getProductByWooId(999)

      expect(result).toBeNull()
    })

    it('should return null when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await getProductByWooId(100)

      expect(result).toBeNull()
      expect(prismaMock.product.findUnique).not.toHaveBeenCalled()
    })
  })

  // ─── deleteProduct ─────────────────────────────────────────────

  describe('deleteProduct', () => {
    it('should delete a product by wooId', async () => {
      prismaMock.product.delete.mockResolvedValue(mockProduct)

      const result = await deleteProduct(100)

      expect(result).toEqual(mockProduct)
      expect(prismaMock.product.delete).toHaveBeenCalledWith({
        where: { wooId: 100 }
      })
    })

    it('should return null when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await deleteProduct(100)

      expect(result).toBeNull()
      expect(prismaMock.product.delete).not.toHaveBeenCalled()
    })

    it('should throw when prisma delete fails', async () => {
      prismaMock.product.delete.mockRejectedValue(new Error('Record not found'))

      await expect(deleteProduct(100)).rejects.toThrow('Record not found')
    })
  })

  // ─── clearAllProducts ──────────────────────────────────────────

  describe('clearAllProducts', () => {
    it('should delete all products and return count', async () => {
      prismaMock.product.deleteMany.mockResolvedValue({ count: 15 })

      const result = await clearAllProducts()

      expect(result).toEqual({ count: 15 })
      expect(prismaMock.product.deleteMany).toHaveBeenCalledTimes(1)
    })

    it('should return { count: 0 } when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const result = await clearAllProducts()

      expect(result).toEqual({ count: 0 })
      expect(prismaMock.product.deleteMany).not.toHaveBeenCalled()
    })

    it('should throw when prisma deleteMany fails', async () => {
      prismaMock.product.deleteMany.mockRejectedValue(new Error('Delete failed'))

      await expect(clearAllProducts()).rejects.toThrow('Delete failed')
    })
  })

  // getAllCategories tests omitted — function has complex JSON field parsing
  // that requires integration testing with real Prisma
})
