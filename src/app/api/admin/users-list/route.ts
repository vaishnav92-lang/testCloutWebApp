/**
 * ADMIN USERS LIST API
 *
 * Provides a list of all users for admin dropdowns and selection interfaces.
 * Returns user names and emails for trust assignment and other admin functions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== 'vaishnav@cloutcareers.com') {
      return NextResponse.json({
        error: 'Admin access required'
      }, { status: 403 })
    }

    // FETCH ALL USERS
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cloutScore: true,
        cloutPercentile: true,
        isProfileComplete: true,
        createdAt: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { email: 'asc' }
      ]
    })

    // FORMAT USER DATA
    const formattedUsers = users.map(user => {
      const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName,
        cloutScore: Math.round((user.cloutScore || 0) * 100), // Convert to 0-100 scale
        cloutPercentile: user.cloutPercentile || 0,
        isProfileComplete: user.isProfileComplete,
        createdAt: user.createdAt
      }
    })

    return NextResponse.json({
      users: formattedUsers,
      total: users.length
    })

  } catch (error) {
    console.error('Users list fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch users list'
    }, { status: 500 })
  }
}