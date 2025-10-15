/**
 * NETWORK INFLUENCE API
 *
 * Fetches computed trust scores to display network influence chart
 * Only accessible by admins
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get current user and verify admin status
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isAdmin: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    if (!currentUser.isAdmin) {
      return NextResponse.json({
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Fetch computed trust scores with user info
    const trustScores = await prisma.computedTrustScore.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isAdmin: true
          }
        }
      },
      orderBy: {
        rank: 'asc'  // Order by rank (1, 2, 3, ...)
      }
    })

    // Get latest computation info
    const latestComputation = await prisma.trustComputationLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        iterations: true,
        converged: true,
        createdAt: true,
        triggeredBy: true
      }
    })

    // Format data for the UI
    const networkInfluence = trustScores.map(score => ({
      rank: score.rank,
      userId: score.userId,
      displayName: score.user.firstName && score.user.lastName
        ? `${score.user.firstName} ${score.user.lastName}`
        : score.user.email,
      email: score.user.email,
      trustScore: score.trustScore,
      displayScore: score.displayScore,
      isAdmin: score.user.isAdmin,
      influencePercentage: (score.trustScore * 100).toFixed(2)
    }))

    return NextResponse.json({
      networkInfluence,
      totalUsers: trustScores.length,
      lastComputation: latestComputation
    })

  } catch (error) {
    console.error('Network influence fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch network influence data'
    }, { status: 500 })
  }
}