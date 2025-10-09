/**
 * TEST ENDPOINT - MAKE USER HIRING MANAGER
 *
 * This is a development-only endpoint to quickly grant hiring manager
 * permissions to existing users for testing purposes.
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

    // Find and update user
    const user = await prisma.user.update({
      where: { email },
      data: { isHiringManager: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isHiringManager: true
      }
    })

    return NextResponse.json({
      message: 'User updated to hiring manager',
      user
    })

  } catch (error: any) {
    console.error('Make hiring manager error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}