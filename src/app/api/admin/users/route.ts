/**
 * ADMIN USERS API
 *
 * Endpoint for fetching user list for admin tools.
 * Currently accessible by hiring managers for testing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isHiringManager: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // TODO: Add proper admin check once admin role is implemented
    // For now, we'll allow hiring managers to access this for testing
    if (!currentUser.isHiringManager) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        location: true,
        bio: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { email: 'asc' }
      ]
    })

    return NextResponse.json({
      users,
      totalCount: users.length
    })

  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}