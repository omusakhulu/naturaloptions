import { NextResponse } from 'next/server'

import nodemailer from 'nodemailer'
import { apiLogger } from '@/lib/logger'

export const runtime = 'nodejs'

const NOTIFICATION_EMAIL = 'jnasire1@gmail.com'

interface TransactionInfo {
  phone: string
  amount: number
  checkoutRequestId: string
  merchantRequestId?: string
  mpesaReceiptNumber?: string
  transactionDate?: string
  resultDesc?: string
}

function buildEmailHtml(tx: TransactionInfo): string {
  const rows = [
    ['Phone', tx.phone],
    ['Amount', `KSh ${Number(tx.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`],
    ['Checkout Request ID', tx.checkoutRequestId],
    tx.merchantRequestId ? ['Merchant Request ID', tx.merchantRequestId] : null,
    tx.mpesaReceiptNumber ? ['M-Pesa Receipt', tx.mpesaReceiptNumber] : null,
    tx.transactionDate ? ['Transaction Date', tx.transactionDate] : null,
    tx.resultDesc ? ['Status', tx.resultDesc] : null,
    ['Verified At', new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })]
  ].filter(Boolean) as [string, string][]

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap">${label}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#111827">${value}</td></tr>`
    )
    .join('')

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      <div style="background:#16a34a;padding:20px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;color:#fff;font-size:20px">M-Pesa Payment Confirmed</h2>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <p style="color:#374151;margin:0 0 16px;font-size:15px">
          A payment of <strong>KSh ${Number(tx.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</strong>
          has been verified from <strong>${tx.phone}</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
          ${tableRows}
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
        <p style="color:#9ca3af;font-size:12px;margin:0">
          This is an automated notification from Natural Options POS.
        </p>
      </div>
    </div>
  `
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone, amount, checkoutRequestId, merchantRequestId, mpesaReceiptNumber, transactionDate, resultDesc } =
      body || {}

    if (!phone || !amount || !checkoutRequestId) {
      return NextResponse.json(
        { success: false, error: 'phone, amount, and checkoutRequestId are required' },
        { status: 400 }
      )
    }

    const tx: TransactionInfo = {
      phone,
      amount: Number(amount),
      checkoutRequestId,
      merchantRequestId,
      mpesaReceiptNumber,
      transactionDate,
      resultDesc
    }

    const transporter = getTransporter()

    if (!transporter) {
      apiLogger.warn('M-Pesa email notification skipped — SMTP not configured')

      return NextResponse.json({
        success: false,
        error: 'Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env'
      })
    }

    const fromAddress = process.env.SMTP_USER || 'noreply@naturaloptions.co.ke'

    await transporter.sendMail({
      from: `"Natural Options POS" <${fromAddress}>`,
      to: NOTIFICATION_EMAIL,
      subject: `M-Pesa Payment: KSh ${Number(amount).toLocaleString('en-KE')} from ${phone}`,
      html: buildEmailHtml(tx)
    })

    apiLogger.info('M-Pesa payment email sent', { to: NOTIFICATION_EMAIL, checkoutRequestId })

    return NextResponse.json({ success: true, sentTo: NOTIFICATION_EMAIL })
  } catch (error: any) {
    apiLogger.error('M-Pesa email notification error', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      { success: false, error: 'Failed to send email notification', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
