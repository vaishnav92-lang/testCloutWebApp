/**
 * GRANT ALLOCATION COMPUTATION
 *
 * Use EigenTrust algorithm to compute funding allocations for grant applicants
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

interface TrustMatrix {
  [fromAppId: string]: { [toAppId: string]: number }
}

interface TrustScores {
  [appId: string]: number
}

/**
 * Simple PageRank-style algorithm for grant allocations
 * Based on trust allocations from applicants
 */
async function computeGrantAllocations(
  grantRoundId: string,
  decayFactor: number = 0.15,
  maxIterations: number = 100,
  convergenceThreshold: number = 0.000001
) {
  // Get all applications
  const applications = await prisma.grantApplication.findMany({
    where: { grantRoundId, status: 'SUBMITTED' },
    include: {
      applicant: { select: { id: true, firstName: true, lastName: true } },
      outgoingTrust: true,
    },
  })

  if (applications.length === 0) {
    return []
  }

  const n = applications.length
  const appIds = applications.map((app) => app.id)
  const appIdToIndex: { [id: string]: number } = {}
  appIds.forEach((id, idx) => {
    appIdToIndex[id] = idx
  })

  // Build trust matrix from GrantTrustAllocation
  const trustMatrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))

  for (const app of applications) {
    const fromIdx = appIdToIndex[app.id]

    // Get trust allocations from this applicant
    for (const trust of app.outgoingTrust) {
      const toIdx = appIdToIndex[trust.toApplicationId]
      if (toIdx !== undefined) {
        trustMatrix[fromIdx][toIdx] = trust.trustScore
      }
    }
  }

  // Normalize each row (outgoing trust from each applicant should sum to 1)
  for (let i = 0; i < n; i++) {
    const rowSum = trustMatrix[i].reduce((a, b) => a + b, 0)
    if (rowSum > 0) {
      for (let j = 0; j < n; j++) {
        trustMatrix[i][j] /= rowSum
      }
    } else {
      // If no outgoing trust, distribute equally
      for (let j = 0; j < n; j++) {
        trustMatrix[i][j] = 1 / n
      }
    }
  }

  // Initialize scores uniformly
  let scores = Array(n).fill(1 / n)

  // PageRank iterations
  let converged = false
  let iterations = 0

  for (iterations = 0; iterations < maxIterations; iterations++) {
    const newScores = Array(n).fill(0)

    // Score = (1 - decay) / n + decay * sum(score[j] * trust[j][i])
    for (let i = 0; i < n; i++) {
      newScores[i] = (1 - decayFactor) / n

      for (let j = 0; j < n; j++) {
        newScores[i] += decayFactor * scores[j] * trustMatrix[j][i]
      }
    }

    // Check convergence
    const maxDiff = Math.max(
      ...newScores.map((s, i) => Math.abs(s - scores[i]))
    )

    scores = newScores

    if (maxDiff < convergenceThreshold) {
      converged = true
      break
    }
  }

  // Rank applicants and compute funding
  const grantRound = await prisma.grantRound.findUnique({
    where: { id: grantRoundId },
  })

  if (!grantRound) {
    throw new Error('Grant round not found')
  }

  // Sort by score and compute allocations
  const allocations = appIds
    .map((appId, idx) => ({
      id: appId,
      index: idx,
      score: scores[idx],
    }))
    .sort((a, b) => b.score - a.score)
    .map((alloc, rank) => {
      // Funding proportional to score, respecting minimum grant size
      const baseFunding = (alloc.score / scores.reduce((a, b) => a + b, 0)) * grantRound.totalFunding

      return {
        applicationId: alloc.id,
        allocatedTrust: alloc.score,
        recommendedFunding: Math.max(baseFunding, grantRound.minimumGrantSize),
        rank: rank + 1,
      }
    })

  return allocations
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { grantRoundId } = body

    if (!grantRoundId) {
      return NextResponse.json(
        { error: 'grantRoundId is required' },
        { status: 400 }
      )
    }

    // Compute allocations
    const allocations = await computeGrantAllocations(grantRoundId)

    // Get full application details for response
    const results = await Promise.all(
      allocations.map(async (alloc) => {
        const app = await prisma.grantApplication.findUnique({
          where: { id: alloc.applicationId },
          include: {
            applicant: { select: { firstName: true, lastName: true } },
          },
        })

        return {
          id: alloc.applicationId,
          applicantName: `${app?.applicant.firstName} ${app?.applicant.lastName}`,
          allocatedTrust: alloc.allocatedTrust,
          recommendedFunding: alloc.recommendedFunding,
          rank: alloc.rank,
        }
      })
    )

    // Update applications with computed allocations
    for (const alloc of allocations) {
      await prisma.grantApplication.update({
        where: { id: alloc.applicationId },
        data: {
          allocatedTrust: alloc.allocatedTrust,
          recommendedFunding: alloc.recommendedFunding,
        },
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error computing allocations:', error)
    return NextResponse.json(
      { error: 'Failed to compute allocations' },
      { status: 500 }
    )
  }
}
