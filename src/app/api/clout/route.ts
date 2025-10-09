/**
 * CLOUT API
 *
 * This endpoint manages clout/reputation scoring and activities.
 * Used to track user reputation changes and calculate clout scores.
 *
 * Features:
 * - Get user's clout activity history
 * - Award clout points for activities
 * - Calculate and update clout scores
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Clout point values for different activities
const CLOUT_POINTS = {
  SUCCESSFUL_REFERRAL: 10,
  QUALITY_ENDORSEMENT: 5,
  NETWORK_INVITATION: 3,
  HIRING_MANAGER_SUCCESS: 15,
  COMMUNITY_CONTRIBUTION: 2,
  TRUST_VALIDATION: 1,
  PLATFORM_PROMOTION: 1,
  NEGATIVE_FEEDBACK: -5,
  SPAM_VIOLATION: -10
}

export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // FIND CURRENT USER
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // GET CLOUT DATA
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        cloutScore: true,
        reputationScore: true,
        successfulReferrals: true,
        endorsementsScore: true,
        networkValue: true
      }
    })

    // GET CLOUT ACTIVITIES
    const activities = await prisma.cloutActivity.findMany({
      where: { userId: currentUser.id },
      include: {
        job: {
          select: {
            title: true,
            company: {
              select: { name: true }
            }
          }
        },
        endorsement: {
          select: {
            endorsedUserEmail: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Last 50 activities
    })

    return NextResponse.json({
      user,
      activities,
      cloutPointValues: CLOUT_POINTS
    })

  } catch (error) {
    console.error('Clout fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // FIND CURRENT USER
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // PARSE REQUEST BODY
    const body = await request.json()
    const {
      userId,
      activity,
      description,
      jobId,
      endorsementId,
      customPoints
    } = body

    // Validate required fields
    if (!activity || !description) {
      return NextResponse.json({
        error: 'Activity and description are required'
      }, { status: 400 })
    }

    // TODO: Add admin check for awarding clout to other users
    const targetUserId = userId || currentUser.id

    // Calculate points to award
    const pointsAwarded = customPoints || CLOUT_POINTS[activity] || 0

    // CREATE CLOUT ACTIVITY
    const cloutActivity = await prisma.cloutActivity.create({
      data: {
        userId: targetUserId,
        activity,
        pointsAwarded,
        description,
        jobId,
        endorsementId
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            cloutScore: true
          }
        }
      }
    })

    // UPDATE USER'S CLOUT SCORE
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        cloutScore: {
          increment: pointsAwarded
        }
      },
      select: {
        cloutScore: true,
        reputationScore: true
      }
    })

    return NextResponse.json({
      cloutActivity,
      updatedCloutScore: updatedUser.cloutScore
    })

  } catch (error) {
    console.error('Clout activity creation error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}