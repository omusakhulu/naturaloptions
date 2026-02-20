import { vi, describe, it, expect, beforeEach } from 'vitest'

import { prismaMock } from '@/__tests__/helpers/mock-prisma'

import {
  upsertInvoiceByOrderId,
  updateInvoiceStatusByOrderId,
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoicesByCustomerId,
  getInvoiceByOrderId,
  softDeleteInvoice,
  updateInvoiceStatus,
  type InvoiceData
} from '../invoices'

const sampleInvoiceData: InvoiceData = {
  orderId: 1001,
  invoiceNumber: 'INV-1001',
  customerId: 42,
  status: 'draft',
  orderStatus: 'processing',
  amount: '250.00',
  date: new Date('2026-01-15'),
  dueDate: new Date('2026-02-15'),
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  billingAddress: { street: '123 Main St', city: 'Portland' },
  lineItems: [{ name: 'Widget', qty: 2, price: '125.00' }]
}

const sampleInvoiceRecord = {
  id: 'inv-abc-123',
  wooOrderId: 1001,
  invoiceNumber: 'INV-1001',
  customerId: 42,
  status: 'draft',
  orderStatus: 'processing',
  amount: '250.00',
  date: new Date('2026-01-15'),
  dueDate: new Date('2026-02-15'),
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  billingAddress: '{"street":"123 Main St","city":"Portland"}',
  lineItems: '[{"name":"Widget","qty":2,"price":"125.00"}]',
  deletedAt: null,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15')
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
})

// ---------------------------------------------------------------------------
// upsertInvoiceByOrderId
// ---------------------------------------------------------------------------
describe('upsertInvoiceByOrderId', () => {
  it('returns null when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL
    const result = await upsertInvoiceByOrderId(1001, sampleInvoiceData)

    expect(result).toBeNull()
  })

  it('upserts an invoice by wooOrderId and returns it', async () => {
    prismaMock.invoice.upsert.mockResolvedValue(sampleInvoiceRecord as any)

    const result = await upsertInvoiceByOrderId(1001, sampleInvoiceData)

    expect(prismaMock.invoice.upsert).toHaveBeenCalledOnce()
    const call = prismaMock.invoice.upsert.mock.calls[0][0]

    expect(call.where).toEqual({ wooOrderId: 1001 })
    expect(result).toEqual(sampleInvoiceRecord)
  })

  it('throws when prisma rejects', async () => {
    prismaMock.invoice.upsert.mockRejectedValue(new Error('DB failure'))

    await expect(upsertInvoiceByOrderId(1001, sampleInvoiceData)).rejects.toThrow('DB failure')
  })
})

// ---------------------------------------------------------------------------
// updateInvoiceStatusByOrderId
// ---------------------------------------------------------------------------
describe('updateInvoiceStatusByOrderId', () => {
  it('returns null when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL
    const result = await updateInvoiceStatusByOrderId(1001, 'paid')

    expect(result).toBeNull()
  })

  it('updates status and returns the invoice', async () => {
    const updated = { ...sampleInvoiceRecord, status: 'paid' }

    prismaMock.invoice.update.mockResolvedValue(updated as any)

    const result = await updateInvoiceStatusByOrderId(1001, 'paid')

    expect(prismaMock.invoice.update).toHaveBeenCalledWith({
      where: { wooOrderId: 1001 },
      data: { status: 'paid' }
    })
    expect(result).toEqual(updated)
  })

  it('returns null on error instead of throwing', async () => {
    prismaMock.invoice.update.mockRejectedValue(new Error('not found'))

    const result = await updateInvoiceStatusByOrderId(1001, 'sent')

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// createInvoice
// ---------------------------------------------------------------------------
describe('createInvoice', () => {
  it('returns null when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL
    const result = await createInvoice(sampleInvoiceData)

    expect(result).toBeNull()
  })

  it('creates an invoice and returns it', async () => {
    prismaMock.invoice.create.mockResolvedValue(sampleInvoiceRecord as any)

    const result = await createInvoice(sampleInvoiceData)

    expect(prismaMock.invoice.create).toHaveBeenCalledOnce()
    const createArg = prismaMock.invoice.create.mock.calls[0][0]

    expect(createArg.data.wooOrderId).toBe(1001)
    expect(createArg.data.invoiceNumber).toBe('INV-1001')
    expect(createArg.data.customerName).toBe('Jane Doe')
    expect(result).toEqual(sampleInvoiceRecord)
  })

  it('throws when prisma rejects', async () => {
    prismaMock.invoice.create.mockRejectedValue(new Error('unique constraint'))

    await expect(createInvoice(sampleInvoiceData)).rejects.toThrow('unique constraint')
  })
})

// ---------------------------------------------------------------------------
// getAllInvoices
// ---------------------------------------------------------------------------
describe('getAllInvoices', () => {
  it('returns [] when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL
    const result = await getAllInvoices()

    expect(result).toEqual([])
  })

  it('returns invoices ordered by date desc with deletedAt null', async () => {
    prismaMock.invoice.findMany.mockResolvedValue([sampleInvoiceRecord] as any)

    const result = await getAllInvoices()

    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null },
        orderBy: { date: 'desc' }
      })
    )
    expect(result).toHaveLength(1)
  })

  it('passes take option when provided', async () => {
    prismaMock.invoice.findMany.mockResolvedValue([])

    await getAllInvoices({ take: 5 })

    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }))
  })

  it('returns [] on error', async () => {
    prismaMock.invoice.findMany.mockRejectedValue(new Error('timeout'))

    const result = await getAllInvoices()

    expect(result).toEqual([])
  })

  // --- amount sanitization ---
  it('sanitizes amount "$1,234.56" to "1234.56"', async () => {
    prismaMock.invoice.findMany.mockResolvedValue([{ ...sampleInvoiceRecord, amount: '$1,234.56' }] as any)

    const result = await getAllInvoices()

    expect(result[0].amount).toBe('1234.56')
  })

  it('sanitizes null amount to "0"', async () => {
    prismaMock.invoice.findMany.mockResolvedValue([{ ...sampleInvoiceRecord, amount: null }] as any)

    const result = await getAllInvoices()

    expect(result[0].amount).toBe('0')
  })

  it('sanitizes non-numeric amount to "0"', async () => {
    prismaMock.invoice.findMany.mockResolvedValue([{ ...sampleInvoiceRecord, amount: 'abc' }] as any)

    const result = await getAllInvoices()

    expect(result[0].amount).toBe('0')
  })

  it('sanitizes amount with leading currency symbol and spaces', async () => {
    prismaMock.invoice.findMany.mockResolvedValue([{ ...sampleInvoiceRecord, amount: '  $ 99.99 ' }] as any)

    const result = await getAllInvoices()

    expect(result[0].amount).toBe('99.99')
  })

  it('passes through a clean numeric amount unchanged', async () => {
    prismaMock.invoice.findMany.mockResolvedValue([{ ...sampleInvoiceRecord, amount: '42.50' }] as any)

    const result = await getAllInvoices()

    expect(result[0].amount).toBe('42.5')
  })
})

// ---------------------------------------------------------------------------
// getInvoiceById
// ---------------------------------------------------------------------------
describe('getInvoiceById', () => {
  it('returns null when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL
    const result = await getInvoiceById('inv-abc-123')

    expect(result).toBeNull()
  })

  it('finds invoice by id where deletedAt is null', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue(sampleInvoiceRecord as any)

    const result = await getInvoiceById('inv-abc-123')

    expect(prismaMock.invoice.findFirst).toHaveBeenCalledWith({
      where: { id: 'inv-abc-123', deletedAt: null }
    })
    expect(result).toBeDefined()
    expect(result!.id).toBe('inv-abc-123')
  })

  it('returns null when invoice not found', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue(null)

    const result = await getInvoiceById('nonexistent')

    expect(result).toBeNull()
  })

  it('returns null on error', async () => {
    prismaMock.invoice.findFirst.mockRejectedValue(new Error('boom'))

    const result = await getInvoiceById('inv-abc-123')

    expect(result).toBeNull()
  })

  it('sanitizes amount "$500.00" to "500"', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue({
      ...sampleInvoiceRecord,
      amount: '$500.00'
    } as any)

    const result = await getInvoiceById('inv-abc-123')

    expect(result!.amount).toBe('500')
  })

  it('sanitizes null amount to "0"', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue({
      ...sampleInvoiceRecord,
      amount: null
    } as any)

    const result = await getInvoiceById('inv-abc-123')

    expect(result!.amount).toBe('0')
  })
})

// ---------------------------------------------------------------------------
// getInvoicesByCustomerId
// ---------------------------------------------------------------------------
describe('getInvoicesByCustomerId', () => {
  it('returns [] when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL
    const result = await getInvoicesByCustomerId(42)

    expect(result).toEqual([])
  })

  it('returns invoices for a given customerId', async () => {
    prismaMock.invoice.findMany.mockResolvedValue([sampleInvoiceRecord] as any)

    const result = await getInvoicesByCustomerId(42)

    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith({
      where: { customerId: 42, deletedAt: null },
      orderBy: { date: 'desc' }
    })
    expect(result).toHaveLength(1)
  })

  it('returns [] on error', async () => {
    prismaMock.invoice.findMany.mockRejectedValue(new Error('timeout'))

    const result = await getInvoicesByCustomerId(42)

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getInvoiceByOrderId
// ---------------------------------------------------------------------------
describe('getInvoiceByOrderId', () => {
  it('returns null when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL
    const result = await getInvoiceByOrderId(1001)

    expect(result).toBeNull()
  })

  it('finds invoice by wooOrderId where deletedAt is null', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue(sampleInvoiceRecord as any)

    const result = await getInvoiceByOrderId(1001)

    expect(prismaMock.invoice.findFirst).toHaveBeenCalledWith({
      where: { wooOrderId: 1001, deletedAt: null }
    })
    expect(result).toEqual(sampleInvoiceRecord)
  })

  it('returns null on error', async () => {
    prismaMock.invoice.findFirst.mockRejectedValue(new Error('connection lost'))

    const result = await getInvoiceByOrderId(1001)

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// softDeleteInvoice
// ---------------------------------------------------------------------------
describe('softDeleteInvoice', () => {
  it('returns null when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL
    const result = await softDeleteInvoice('inv-abc-123')

    expect(result).toBeNull()
  })

  it('sets deletedAt on the invoice', async () => {
    const deleted = { ...sampleInvoiceRecord, deletedAt: new Date() }

    prismaMock.invoice.update.mockResolvedValue(deleted as any)

    const result = await softDeleteInvoice('inv-abc-123')

    expect(prismaMock.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-abc-123' },
      data: { deletedAt: expect.any(Date) }
    })
    expect(result).toEqual(deleted)
  })

  it('returns null on error instead of throwing', async () => {
    prismaMock.invoice.update.mockRejectedValue(new Error('not found'))

    const result = await softDeleteInvoice('inv-abc-123')

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// updateInvoiceStatus
// ---------------------------------------------------------------------------
describe('updateInvoiceStatus', () => {
  it('returns null when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL
    const result = await updateInvoiceStatus('inv-abc-123', 'sent')

    expect(result).toBeNull()
  })

  it('updates the status field for the given invoice id', async () => {
    const updated = { ...sampleInvoiceRecord, status: 'sent' }

    prismaMock.invoice.update.mockResolvedValue(updated as any)

    const result = await updateInvoiceStatus('inv-abc-123', 'sent')

    expect(prismaMock.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-abc-123' },
      data: { status: 'sent' }
    })
    expect(result).toEqual(updated)
  })

  it('returns null on error instead of throwing', async () => {
    prismaMock.invoice.update.mockRejectedValue(new Error('DB down'))

    const result = await updateInvoiceStatus('inv-abc-123', 'paid')

    expect(result).toBeNull()
  })
})
