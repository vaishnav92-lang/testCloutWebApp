import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email)

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tier: true,
        availableInvites: true,
        totalInvitesUsed: true,
        createdAt: true,
        _count: {
          select: {
            relationshipsAsUser1: true,
            relationshipsAsUser2: true,
            sentInvitations: true,
            receivedInvitations: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get detailed relationships
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      },
      select: {
        id: true,
        status: true,
        user1Id: true,
        user2Id: true,
        createdAt: true
      }
    })

    // Get detailed invitations
    const invitations = await prisma.invitation.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      select: {
        id: true,
        email: true,
        status: true,
        senderId: true,
        receiverId: true,
        sentAt: true
      }
    })

    return NextResponse.json({
      user,
      relationships,
      invitations,
      analysis: {
        relationshipsAsSender: relationships.filter(r => r.user1Id === user.id).length,
        relationshipsAsReceiver: relationships.filter(r => r.user2Id === user.id).length,
        invitationsSent: invitations.filter(i => i.senderId === user.id).length,
        invitationsReceived: invitations.filter(i => i.receiverId === user.id).length
      }
    })

  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}