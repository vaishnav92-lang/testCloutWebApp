/**
 * TEST ENDPOINT - AUTH FLOW DEBUG
 *
 * This endpoint helps debug the authentication flow.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isHiringManager: true,
        isProfileComplete: true
      }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found in database',
        message: 'This email is not in our invite-only system'
      }, { status: 404 })
    }

    return NextResponse.json({
      message: 'User found in database',
      user,
      authStatus: 'Should be able to authenticate'
    })

  } catch (error: any) {
    console.error('Auth flow check error:', error)
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 })
  }
}