import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, referralCode: invitationId } = await request.json()

    if (!email || !invitationId) {
      return NextResponse.json({
        error: 'Email and invitation ID are required'
      }, { status: 400 })
    }

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { sender: true } // Include sender to get referrer info
    })

    if (!invitation || invitation.status !== 'PENDING') {
      return NextResponse.json({
        error: 'Invalid or expired invitation'
      }, { status: 400 })
    }

    const referrer = invitation.sender

    if (!referrer) {
      return NextResponse.json({
        error: 'Referrer not found for this invitation'
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // If user exists but no referrer set, update it
      if (!existingUser.referredById) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { referredById: referrer.id }
        })
      }

      // If the existing user is the receiver of this invitation, mark it as accepted
      if (existingUser.id === invitation.receiverId) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED', respondedAt: new Date() }
        })
      }

      return NextResponse.json({
        message: 'User already exists, referral relationship updated'
      })
    }

    // Create new user with referral relationship
    const newUser = await prisma.user.create({
      data: {
        email,
        referredById: referrer.id,
      }
    })

    // Mark invitation as accepted and link to the new user
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', respondedAt: new Date(), receiverId: newUser.id }
    })

    // Update the relationship status from PENDING to CONFIRMED
    // This relationship was created when the invite was sent
    await prisma.relationship.updateMany({
      where: {
        OR: [
          { user1Id: referrer.id, user2Id: newUser.id },
          { user1Id: newUser.id, user2Id: referrer.id }
        ],
        status: 'PENDING'
      },
      data: { status: 'CONFIRMED' }
    })

    // Allocate trust points now that the relationship is confirmed
    // Get the trustScore from the invitation
    const trustAllocation = invitation.trustScore * 10; // Convert back to 0-100 scale

    await prisma.user.update({
      where: { id: referrer.id },
      data: {
        availableTrust: { decrement: trustAllocation },
        allocatedTrust: { increment: trustAllocation }
      }
    })

    return NextResponse.json({
      message: 'Referral request processed successfully',
      userId: newUser.id
    })

  } catch (error) {
    console.error('Referral request error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}