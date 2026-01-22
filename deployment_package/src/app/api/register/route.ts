import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

import { hashPassword, validatePassword, sanitizeUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role = 'USER' } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, email, and password are required'
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format'
        },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)

    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: passwordValidation.message
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists'
        },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role as any,
        active: true
      }
    })

    // Return sanitized user (without password)
    const sanitizedUser = sanitizeUser(user)

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user: sanitizedUser
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to register user'
      },
      { status: 500 }
    )
  } finally {
    // No need to disconnect when using singleton
  }
}
