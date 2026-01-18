import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const customerIdRaw = body?.customerId
    const customerId = Number(customerIdRaw)
    const userId = typeof body?.userId === 'string' && body.userId.trim() ? body.userId.trim() : undefined
    const newPassword = String(body?.newPassword || '').trim()

    if (!newPassword) {
      return NextResponse.json({ ok: false, error: 'newPassword is required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    if (userId) {
      const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })

      if (!existing) {
        return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })

      return NextResponse.json({ ok: true })
    }

    if (!Number.isFinite(customerId) || customerId <= 0) {
      return NextResponse.json({ ok: false, error: 'customerId (number) or userId (string) is required' }, { status: 400 })
    }

    const woo = WooCommerceService.getInstance()

    try {
      const resp = await woo.updateCustomer(customerId, { password: newPassword })

      return NextResponse.json({ ok: true, result: resp })
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : 'WooCommerce update failed'

      return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Failed to update password'

    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
