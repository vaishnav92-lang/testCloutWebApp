import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const {
      firstName,
      lastName,
      phone,
      location,
      linkedinUrl,
      userIntent,
      inviteToken,
      invitationId
    } = await request.json()

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // If there's an invite token, mark it as used
    const updateData: any = {
      firstName,
      lastName,
      phone: phone || null,
      location: location || null,
      linkedinUrl: linkedinUrl || null,
      userIntent: userIntent || 'ACTIVELY_LOOKING',
      isProfileComplete: true,
    }

    if (inviteToken && user.inviteToken === inviteToken) {
      updateData.inviteUsed = true
    }

    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isProfileComplete: true,
        referralCode: true,
      }
    })

    // Handle invitation acceptance - create the relationship
    if (invitationId) {
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: { sender: true }
      })

      if (invitation && invitation.status === 'PENDING') {
        // Update invitation status
        await prisma.invitation.update({
          where: { id: invitationId },
          data: {
            status: 'ACCEPTED',
            respondedAt: new Date(),
            receiverId: user.id
          }
        })

        // Create the bilateral relationship
        await prisma.relationship.create({
          data: {
            user1Id: invitation.senderId,
            user2Id: user.id,
            user1TrustScore: invitation.trustScore, // Trust score from sender
            user2TrustScore: 5, // Default trust score from receiver (can be updated later)
            status: 'CONFIRMED'
          }
        })
      }
    }

    return NextResponse.json({
      message: 'Profile completed successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Profile completion error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}