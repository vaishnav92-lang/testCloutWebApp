/**
 * INVITE ACCEPTANCE NOTIFICATIONS API
 *
 * Fetches recent invitation acceptances for the current user
 * Shows when people they invited have joined Clout
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Fetch accepted invitations sent by the current user
    const acceptedInvitations = await prisma.invitation.findMany({
      where: {
        senderId: currentUser.id,
        status: 'ACCEPTED',
        respondedAt: {
          not: null
        }
      },
      include: {
        receiver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        respondedAt: 'desc'
      },
      take: 10 // Show last 10 accepted invitations
    })

    // Also fetch confirmed relationships where the other person joined recently
    const confirmedRelationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { user1Id: currentUser.id },
          { user2Id: currentUser.id }
        ],
        status: 'CONFIRMED',
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
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
      },
      take: 10
    })

    // Format notifications
    const notifications = []

    // Add accepted invitations
    acceptedInvitations.forEach(invitation => {
      if (invitation.receiver) {
        notifications.push({
          id: invitation.id,
          type: 'invite_accepted',
          message: `${invitation.receiver.firstName || invitation.receiver.email} accepted your invitation and joined Clout!`,
          user: {
            id: invitation.receiver.id,
            email: invitation.receiver.email,
            name: invitation.receiver.firstName && invitation.receiver.lastName
              ? `${invitation.receiver.firstName} ${invitation.receiver.lastName}`
              : invitation.receiver.email
          },
          timestamp: invitation.respondedAt,
          isNew: invitation.respondedAt && new Date(invitation.respondedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // New if within last 7 days
        })
      }
    })

    // Add recently confirmed relationships
    confirmedRelationships.forEach(relationship => {
      const otherUser = relationship.user1Id === currentUser.id ? relationship.user2 : relationship.user1

      // Check if this is from an invitation
      if (otherUser) {
        notifications.push({
          id: relationship.id,
          type: 'relationship_confirmed',
          message: `${otherUser.firstName || otherUser.email} confirmed your connection!`,
          user: {
            id: otherUser.id,
            email: otherUser.email,
            name: otherUser.firstName && otherUser.lastName
              ? `${otherUser.firstName} ${otherUser.lastName}`
              : otherUser.email
          },
          timestamp: relationship.updatedAt,
          isNew: new Date(relationship.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        })
      }
    })

    // Sort by timestamp descending
    notifications.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      return timeB - timeA
    })

    // Get counts for summary
    const newCount = notifications.filter(n => n.isNew).length
    const totalCount = notifications.length

    return NextResponse.json({
      notifications: notifications.slice(0, 10), // Return max 10 notifications
      counts: {
        new: newCount,
        total: totalCount
      }
    })

  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch notifications'
    }, { status: 500 })
  }
}