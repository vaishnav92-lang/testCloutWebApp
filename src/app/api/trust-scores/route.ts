/**
 * TRUST SCORES API
 *
 * Returns computed trust scores for all users
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Fetch all computed scores with user info
    const scores = await prisma.computedTrustScore.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { rank: 'asc' }
    })

    // Fetch latest computation info
    const lastComputation = await prisma.trustComputationLog.findFirst({
      orderBy: { computedAt: 'desc' }
    })

    // Format for response
    const formattedScores = scores.map(score => {
      const displayName = score.user.firstName && score.user.lastName
        ? `${score.user.firstName} ${score.user.lastName}`
        : score.user.email

      return {
        userId: score.userId,
        displayName: displayName,
        trustScore: score.trustScore,
        displayScore: score.displayScore,
        rank: score.rank
      }
    })

    return NextResponse.json({
      scores: formattedScores,
      computation: lastComputation ? {
        computedAt: lastComputation.computedAt,
        numIterations: lastComputation.numIterations,
        converged: lastComputation.converged,
        numUsers: lastComputation.numUsers,
        triggeredBy: lastComputation.triggeredBy
      } : null
    })

  } catch (error) {
    console.error('Trust scores fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch trust scores'
    }, { status: 500 })
  }
}