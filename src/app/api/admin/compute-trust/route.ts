/**
 * ADMIN TRUST COMPUTATION API
 *
 * Endpoint for computing EigenTrust scores for all users.
 * Only accessible by admin users.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { computeEigenTrust } from '@/lib/eigentrust-new'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Admin check
    const ADMIN_EMAIL = 'vaishnav@cloutcareers.com'
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({
        error: 'Not authorized - admin access required'
      }, { status: 403 })
    }

    console.log('Starting EigenTrust computation...')

    // Run the trust computation
    const result = await computeEigenTrust()

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Trust computation failed'
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Trust scores computed successfully',
      iterations: result.iterations,
      converged: result.converged,
      usersUpdated: result.numUsers
    })

  } catch (error) {
    console.error('Trust computation error:', error)
    return NextResponse.json({
      error: 'Failed to compute trust scores',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Admin check
    const ADMIN_EMAIL = 'vaishnav@cloutcareers.com'
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({
        error: 'Not authorized - admin access required'
      }, { status: 403 })
    }

    // Get computation status and recent results
    const { prisma } = await import('@/lib/prisma')

    const [systemConfig, userStats] = await Promise.all([
      prisma.systemConfig.findFirst(),
      prisma.user.aggregate({
        _count: { id: true },
        _avg: { cloutScore: true },
        _max: { cloutScore: true },
        _min: { cloutScore: true }
      })
    ])

    // Get top users by clout (for admin visibility)
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cloutScore: true,
        cloutPercentile: true
      },
      orderBy: { cloutScore: 'desc' },
      take: 10
    })

    return NextResponse.json({
      lastComputation: systemConfig?.lastTrustComputation,
      lastComputationTime: systemConfig?.lastComputationTime,
      lastIterations: systemConfig?.lastIterations,
      eigentrustAlpha: systemConfig?.eigentrustAlpha || 0.15,
      maxIterations: systemConfig?.maxIterations || 100,
      convergenceThreshold: systemConfig?.convergenceThreshold || 1e-6,
      totalUsers: userStats._count.id,
      averageCloutScore: userStats._avg.cloutScore,
      maxCloutScore: userStats._max.cloutScore,
      minCloutScore: userStats._min.cloutScore,
      topUsers
    })

  } catch (error) {
    console.error('Trust status fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch trust computation status'
    }, { status: 500 })
  }
}