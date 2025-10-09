import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, tier = 'CONNECTOR' } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Delete existing user and all related data if exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    if (existingUser) {
      await prisma.$transaction(async (tx) => {
        await tx.relationship.deleteMany({
          where: {
            OR: [
              { user1Id: existingUser.id },
              { user2Id: existingUser.id }
            ]
          }
        })

        await tx.invitation.deleteMany({
          where: {
            OR: [
              { senderId: existingUser.id },
              { receiverId: existingUser.id }
            ]
          }
        })

        await tx.session.deleteMany({
          where: { userId: existingUser.id }
        })

        await tx.account.deleteMany({
          where: { userId: existingUser.id }
        })

        await tx.user.delete({
          where: { id: existingUser.id }
        })
      })
    }

    // Determine invite count based on tier
    const inviteCount = {
      'CONNECTOR': 3,
      'TALENT_SCOUT': 5,
      'NETWORK_HUB': 10
    }[tier] || 3

    // Create fresh user with correct invite count
    const user = await prisma.user.create({
      data: {
        email,
        inviteToken: `test_${Date.now()}`,
        referralCode: `test_${Math.random().toString(36).substring(2, 9)}`,
        tier: tier as any,
        availableInvites: inviteCount,
        totalInvitesUsed: 0
      }
    })

    return NextResponse.json({
      message: 'Fresh test user created',
      user: {
        email: user.email,
        tier: user.tier,
        availableInvites: user.availableInvites,
        referralCode: user.referralCode
      }
    })

  } catch (error) {
    console.error('Create fresh user error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}