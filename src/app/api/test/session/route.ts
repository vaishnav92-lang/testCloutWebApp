/**
 * TEST ENDPOINT - CHECK SESSION DATA
 *
 * This endpoint returns the current session data for debugging purposes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        authenticated: false,
        session: null
      })
    }

    // Get user data directly from database
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isHiringManager: true,
        isProfileComplete: true,
        referralCode: true,
        inviteUsed: true
      }
    })

    return NextResponse.json({
      authenticated: true,
      session,
      dbUser,
      hasHiringManagerFlag: !!session.user.isHiringManager
    })

  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 })
  }
}