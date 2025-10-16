/**
 * ADMIN EIGENTRUST INITIALIZE API
 *
 * Sets up the EigenTrust system with equal allocations and computes initial scores
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { initializeCleanTrustState, computeEigenTrust } from '@/lib/eigentrust-new'

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== 'vaishnav@cloutcareers.com') {
      return NextResponse.json({
        error: 'Admin access required'
      }, { status: 403 })
    }

    console.log('🔄 Setting up EigenTrust system...')

    // Step 1: Initialize clean trust state (users default to trusting admin)
    console.log('1️⃣ Initializing clean trust state...')
    await initializeCleanTrustState()
    console.log('   ✓ Clean state initialized (users default to trusting admin)')

    // Step 2: Compute initial trust scores
    console.log('2️⃣ Computing initial trust scores...')
    const result = await computeEigenTrust(
      0.15,           // decayFactor
      100,            // maxIterations
      0.000001,       // convergenceThreshold
      "initialization" // triggeredBy
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Initialization failed'
      }, { status: 500 })
    }

    console.log('✅ EigenTrust system initialized successfully!')
    console.log(`   - Users: ${result.numUsers}`)
    console.log(`   - Iterations: ${result.iterations}`)
    console.log(`   - Converged: ${result.converged}`)

    const topScores = result.scores
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, 10)

    console.log('📊 Top 10 initial scores:')
    topScores.forEach(score => {
      console.log(`   ${score.displayScore} - ${score.userId}`)
    })

    return NextResponse.json({
      success: true,
      message: 'Initialized clean trust state and computed scores',
      computation: {
        numUsers: result.numUsers,
        iterations: result.iterations,
        converged: result.converged,
        topScores: topScores.map(s => ({
          userId: s.userId,
          displayScore: s.displayScore,
          rank: s.rank
        }))
      }
    })

  } catch (error) {
    console.error('EigenTrust initialization error:', error)
    return NextResponse.json({
      error: 'Failed to initialize EigenTrust system'
    }, { status: 500 })
  }
}