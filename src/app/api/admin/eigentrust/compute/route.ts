/**
 * ADMIN EIGENTRUST COMPUTE API
 *
 * Triggers EigenTrust computation manually from admin interface
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { computeEigenTrust } from '@/lib/eigentrust-new'

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== 'vaishnav@cloutcareers.com') {
      return NextResponse.json({
        error: 'Admin access required'
      }, { status: 403 })
    }

    console.log('Starting EigenTrust computation...')

    // Run the trust computation
    const result = await computeEigenTrust(
      0.15,    // decayFactor
      100,     // maxIterations
      0.000001, // convergenceThreshold
      "manual" // triggeredBy
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Computation failed'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Trust scores computed successfully',
      numUsers: result.numUsers,
      iterations: result.iterations,
      converged: result.converged,
      topScores: result.scores
        .sort((a, b) => b.trustScore - a.trustScore)
        .slice(0, 10)
        .map(s => ({
          userId: s.userId,
          displayScore: s.displayScore,
          rank: s.rank
        }))
    })

  } catch (error) {
    console.error('EigenTrust computation error:', error)
    return NextResponse.json({
      error: 'Failed to compute trust scores'
    }, { status: 500 })
  }
}