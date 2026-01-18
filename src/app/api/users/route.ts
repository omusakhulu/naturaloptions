import { NextResponse } from 'next/server'

import { getUsers } from '@/lib/db/prisma'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const users = await getUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)

    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fullName, name, email, role, status, password } = body || {}

    const finalName = String(fullName || name || '').trim()
    const finalEmail = String(email || '').trim().toLowerCase()
    const finalStatus = String(status || 'active').trim().toLowerCase()
    const finalRole = String(role || 'USER').trim().toUpperCase() as UserRole

    if (!finalName || !finalEmail) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(finalEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!Object.values(UserRole).includes(finalRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email: finalEmail } })
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    const active = finalStatus === 'active'

    const hashedPassword = password ? await bcrypt.hash(String(password), 10) : null

    const created = await prisma.user.create({
      data: {
        name: finalName,
        email: finalEmail,
        role: finalRole,
        active,
        ...(hashedPassword ? { password: hashedPassword } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        emailVerified: true,
        image: true,
        createdAt: true
      }
    })

    const users = await getUsers()
    const createdFormatted = users.find(u => u.id === created.id)

    return NextResponse.json({ success: true, user: createdFormatted || created }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
