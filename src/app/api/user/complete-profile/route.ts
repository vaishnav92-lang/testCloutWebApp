import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
      userIntent, // This will be an array from frontend
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

    // Convert userIntent array to boolean fields
    const userIntentArray = Array.isArray(userIntent) ? userIntent : []

    // If there's an invite token, mark it as used
    const updateData: any = {
      firstName,
      lastName,
      phone: phone || null,
      location: location || null,
      linkedinUrl: linkedinUrl || null,
      // Keep old field for backward compatibility, use first value or default
      userIntent: userIntentArray.includes('ACTIVELY_LOOKING') ? 'ACTIVELY_LOOKING' :
                  userIntentArray.length > 0 ? 'HYBRID' : 'ACTIVELY_LOOKING',
      // New boolean fields
      wantsToHireTalent: userIntentArray.includes('HIRE_TALENT'),
      wantsToReferTalent: userIntentArray.includes('REFER_TALENT'),
      wantsToConnectPeople: userIntentArray.includes('CONNECT_PEOPLE'),
      wantsToMeetPeople: userIntentArray.includes('MEET_PEOPLE'),
      isActivelyLooking: userIntentArray.includes('ACTIVELY_LOOKING'),
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