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
      select: { id: true, isAdmin: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only Clout admins can access user list for introductions
    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const currentUserId = currentUser.id

    // Fetch only users that the current user has confirmed relationships with
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { user1Id: currentUserId, status: 'CONFIRMED' },
          { user2Id: currentUserId, status: 'CONFIRMED' }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            location: true,
            bio: true
          }
        },
        user2: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            location: true,
            bio: true
          }
        }
      }
    })

    // Extract connected users (excluding the current user)
    const connectedUsers = relationships.map(relationship => {
      return relationship.user1Id === currentUserId
        ? relationship.user2
        : relationship.user1
    }).filter(user => user.id !== currentUserId)

    // Remove duplicates and sort
    const uniqueUsers = connectedUsers.reduce((acc, user) => {
      if (!acc.find(u => u.id === user.id)) {
        acc.push(user)
      }
      return acc
    }, [] as typeof connectedUsers)

    const users = uniqueUsers.sort((a, b) => {
      const aFirst = a.firstName || ''
      const bFirst = b.firstName || ''
      const aLast = a.lastName || ''
      const bLast = b.lastName || ''

      if (aFirst !== bFirst) return aFirst.localeCompare(bFirst)
      if (aLast !== bLast) return aLast.localeCompare(bLast)
      return a.email.localeCompare(b.email)
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