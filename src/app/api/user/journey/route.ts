/**
 * USER JOURNEY API
 *
 * This endpoint returns the user's journey on Clout including:
 * - Who referred them to the platform
 * - Who they have referred to join Clout
 * - Timeline and growth statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        createdAt: true,
        referredById: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get who referred this user (if anyone)
    const referredBy = user.referredById ? await prisma.user.findUnique({
      where: { id: user.referredById },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImage: true,
        createdAt: true
      }
    }) : null

    // Get users that this user has referred
    const referrals = await prisma.user.findMany({
      where: { referredById: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImage: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format the response
    const journeyData = {
      referredBy: referredBy ? {
        id: referredBy.id,
        firstName: referredBy.firstName,
        lastName: referredBy.lastName,
        email: referredBy.email,
        profileImage: referredBy.profileImage,
        joinedAt: referredBy.createdAt.toISOString()
      } : null,
      referrals: referrals.map(referral => ({
        id: referral.id,
        firstName: referral.firstName,
        lastName: referral.lastName,
        email: referral.email,
        profileImage: referral.profileImage,
        joinedAt: referral.createdAt.toISOString()
      })),
      totalReferrals: referrals.length,
      joinedAt: user.createdAt.toISOString()
    }

    return NextResponse.json(journeyData)

  } catch (error) {
    console.error('User journey fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user journey data' },
      { status: 500 }
    )
  }
}