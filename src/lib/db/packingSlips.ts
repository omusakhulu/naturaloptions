import type { PackingSlipStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export interface PackingSlipData {
  wooOrderId: number
  notes?: string | null
  boothNumber?: string | null
  assignedUserId?: string | null
  status?: PackingSlipStatus
}

export async function getAllPackingSlips() {
  try {
    const slips = await prisma.packingSlip.findMany({
      orderBy: { createdAt: 'desc' },
      include: { assignedUser: { select: { id: true, name: true, email: true } } }
    })

    return slips
  } catch (error) {
    console.error('Error fetching packing slips:', error)

    return []
  }
}

export async function getPackingSlipByWooOrderId(wooOrderId: number) {
  try {
    const slip = await prisma.packingSlip.findUnique({
      where: { wooOrderId },
      include: { assignedUser: { select: { id: true, name: true, email: true } } }
    })

    return slip
  } catch (error) {
    console.error('Error fetching packing slip:', error)

    return null
  }
}

export async function createOrGetPackingSlip({
  wooOrderId,
  notes,
  boothNumber,
  assignedUserId,
  status
}: PackingSlipData) {
  const packingSlipNumber = generatePackingSlipNumber(wooOrderId)

  try {
    const slip = await prisma.packingSlip.upsert({
      where: { wooOrderId },
      update: {
        notes: notes ?? undefined,
        boothNumber: boothNumber ?? undefined,
        assignedUserId: assignedUserId ?? undefined,
        status: status ?? undefined
      },
      create: {
        wooOrderId,
        packingSlipNumber,
        status: status ?? 'awaiting_collection',
        notes: notes ?? null,
        boothNumber: boothNumber ?? null,
        assignedUserId: assignedUserId ?? null
      },
      include: { assignedUser: { select: { id: true, name: true, email: true } } }
    })

    return slip
  } catch (error) {
    console.error('Error creating packing slip:', error)
    throw error
  }
}

export async function updatePackingSlip(wooOrderId: number, data: Partial<PackingSlipData>) {
  try {
    const slip = await prisma.packingSlip.update({
      where: { wooOrderId },
      data: {
        notes: data.notes ?? undefined,
        boothNumber: data.boothNumber ?? undefined,
        assignedUserId: data.assignedUserId ?? undefined,
        status: data.status ?? undefined
      },
      include: { assignedUser: { select: { id: true, name: true, email: true } } }
    })

    return slip
  } catch (error) {
    console.error('Error updating packing slip:', error)
    throw error
  }
}

export function generatePackingSlipNumber(wooOrderId: number) {
  const y = new Date().getFullYear()

  return `PS-${y}-${wooOrderId}`
}
