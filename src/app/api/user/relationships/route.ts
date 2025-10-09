import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Fetch user's relationships/network
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Find current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Fetch all relationships where current user is involved
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { user1Id: currentUser.id },
          { user2Id: currentUser.id }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        user2: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform relationships to show connection info
    const connections = relationships.map(rel => {
      const isUser1 = rel.user1Id === currentUser.id
      const connectedUser = isUser1 ? rel.user2 : rel.user1
      const myTrustScore = isUser1 ? rel.user1TrustScore : rel.user2TrustScore

      return {
        id: rel.id,
        status: rel.status,
        connectedUser: {
          id: connectedUser.id,
          name: `${connectedUser.firstName || ''} ${connectedUser.lastName || ''}`.trim() || 'Unknown',
          email: connectedUser.email
        },
        myTrustScore, // The trust score I gave them
        isSender: isUser1, // true if current user sent the request
        canValidate: !isUser1 && rel.status === 'PENDING', // can only validate if you're the recipient and it's pending
        createdAt: rel.createdAt,
        updatedAt: rel.updatedAt
      }
    })

    // Count by status
    const counts = {
      confirmed: connections.filter(c => c.status === 'CONFIRMED').length,
      pending: connections.filter(c => c.status === 'PENDING').length,
      declined: connections.filter(c => c.status === 'DECLINED').length
    }

    // Also fetch pending invitations to new users
    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        senderId: currentUser.id,
        status: 'PENDING'
      },
      select: {
        id: true,
        email: true,
        sentAt: true
      },
      orderBy: {
        sentAt: 'desc'
      }
    })

    return NextResponse.json({
      relationships: connections,
      connections,
      counts,
      pendingInvitations
    })

  } catch (error) {
    console.error('Relationships fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}

// POST - Create a new relationship (Add to Trusted Network)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const { otherUserId, trustScore } = await request.json()

    if (!otherUserId || !trustScore || trustScore < 1 || trustScore > 10) {
      return NextResponse.json({
        error: 'Other user ID and trust score (1-10) are required'
      }, { status: 400 })
    }

    // Find current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true }
    })

    if (!targetUser) {
      return NextResponse.json({
        error: 'Target user not found'
      }, { status: 404 })
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.relationship.findFirst({
      where: {
        OR: [
          { user1Id: currentUser.id, user2Id: otherUserId },
          { user2Id: currentUser.id, user1Id: otherUserId }
        ]
      }
    })

    if (existingRelationship) {
      return NextResponse.json({
        error: 'Relationship already exists'
      }, { status: 400 })
    }

    // Create new relationship
    const relationship = await prisma.relationship.create({
      data: {
        user1Id: currentUser.id,
        user2Id: otherUserId,
        user1TrustScore: trustScore,
        user2TrustScore: 0, // Will be set when they respond
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      message: 'Successfully added to trusted network',
      relationshipId: relationship.id
    })

  } catch (error) {
    console.error('Relationship creation error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}