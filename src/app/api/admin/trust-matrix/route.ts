/**
 * TRUST MATRIX API
 *
 * Provides actual EigenTrust computation data.
 * Shows input allocations, output scores, and computation details.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== 'vaishnav@cloutcareers.com') {
      return NextResponse.json({
        error: 'Admin access required'
      }, { status: 403 })
    }

    // GET ACTUAL TRUST ALLOCATIONS (INPUT TO EIGENTRUST)
    const trustAllocations = await prisma.trustAllocation.findMany({
      include: {
        giver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // GET COMPUTED TRUST SCORES (OUTPUT FROM EIGENTRUST)
    const computedScores = await prisma.computedTrustScore.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        trustScore: 'desc'
      }
    })

    // GET LAST COMPUTATION DETAILS
    const lastComputation = await prisma.trustComputationLog.findFirst({
      orderBy: { computedAt: 'desc' }
    })

    // GET ALL USERS FOR MATRIX
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { email: 'asc' }
      ]
    })

    // FORMAT TRUST ALLOCATIONS
    const formattedAllocations = trustAllocations.map(allocation => ({
      giverId: allocation.giverId,
      giverName: allocation.giver.firstName && allocation.giver.lastName
        ? `${allocation.giver.firstName} ${allocation.giver.lastName}`
        : allocation.giver.email,
      receiverId: allocation.receiverId,
      receiverName: allocation.receiver.firstName && allocation.receiver.lastName
        ? `${allocation.receiver.firstName} ${allocation.receiver.lastName}`
        : allocation.receiver.email,
      proportion: allocation.proportion
    }))

    // FORMAT COMPUTED SCORES
    const formattedScores = computedScores.map(score => ({
      userId: score.userId,
      userName: score.user.firstName && score.user.lastName
        ? `${score.user.firstName} ${score.user.lastName}`
        : score.user.email,
      trustScore: score.trustScore,
      rank: score.rank,
      influencePercentage: score.trustScore * 100 // Convert to percentage
    }))

    // FORMAT COMPUTATION INFO
    const computationInfo = lastComputation ? {
      iterations: lastComputation.numIterations,
      converged: lastComputation.converged,
      computedAt: lastComputation.computedAt.toISOString(),
      triggeredBy: lastComputation.triggeredBy,
      numUsers: lastComputation.numUsers,
      decayFactor: lastComputation.decayFactor,
      convergenceThreshold: lastComputation.convergenceThreshold
    } : null

    // FORMAT ALL USERS
    const formattedUsers = allUsers.map(user => ({
      id: user.id,
      name: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email
    }))

    return NextResponse.json({
      trustAllocations: formattedAllocations,
      computedScores: formattedScores,
      computation: computationInfo,
      allUsers: formattedUsers
    })

  } catch (error) {
    console.error('Trust matrix fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch trust matrix'
    }, { status: 500 })
  }
}