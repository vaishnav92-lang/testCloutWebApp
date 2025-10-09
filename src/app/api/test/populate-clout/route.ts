/**
 * TEST ENDPOINT - POPULATE CLOUT AND EARNINGS DATA
 *
 * This endpoint creates sample clout and earnings data for testing.
 * Development-only for demonstrating the clout and earnings system.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { awardClout, recordEarnings } from '@/lib/clout/scoring'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Create sample clout activities
    const cloutActivities = [
      {
        activity: 'SUCCESSFUL_REFERRAL' as const,
        description: 'Successfully referred John Doe for Senior Developer position'
      },
      {
        activity: 'QUALITY_ENDORSEMENT' as const,
        description: 'Wrote high-quality endorsement for Sarah Smith'
      },
      {
        activity: 'NETWORK_INVITATION' as const,
        description: 'Invited valuable new member to the network'
      },
      {
        activity: 'COMMUNITY_CONTRIBUTION' as const,
        description: 'Helped onboard new users and provided feedback'
      }
    ]

    // Award clout for each activity
    const cloutResults = []
    for (const activity of cloutActivities) {
      const result = await awardClout(
        user.id,
        activity.activity,
        activity.description
      )
      cloutResults.push(result)
    }

    // Create sample earnings transactions
    const earningsTransactions = [
      {
        amount: 2500,
        type: 'REFERRAL_BONUS' as const,
        description: 'Referral bonus for John Doe placement',
        status: 'PAID' as const
      },
      {
        amount: 1000,
        type: 'REFERRAL_BONUS' as const,
        description: 'Referral bonus for Sarah Smith placement',
        status: 'CONFIRMED' as const
      },
      {
        amount: 500,
        type: 'ENDORSEMENT_FEE' as const,
        description: 'Payment for quality endorsement',
        status: 'PENDING' as const
      }
    ]

    // Record earnings
    const earningsResults = []
    for (const earnings of earningsTransactions) {
      const result = await recordEarnings(
        user.id,
        earnings.amount,
        earnings.type,
        earnings.description,
        { status: earnings.status }
      )
      earningsResults.push(result)
    }

    // Get updated user stats
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        cloutScore: true,
        totalEarnings: true,
        pendingEarnings: true,
        successfulReferrals: true,
        endorsementsScore: true,
        networkValue: true
      }
    })

    return NextResponse.json({
      message: 'Sample clout and earnings data created successfully',
      user: {
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        ...updatedUser
      },
      cloutActivities: cloutResults.length,
      earningsTransactions: earningsResults.length
    })

  } catch (error: any) {
    console.error('Populate clout data error:', error)
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 })
  }
}