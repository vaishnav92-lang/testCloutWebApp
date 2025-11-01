/**
 * EigenTrust Algorithm Implementation (Correct Version)
 *
 * Based on proper INPUT/OUTPUT separation:
 * - INPUT: TrustAllocation table (what users allocate)
 * - OUTPUT: ComputedTrustScore table (algorithmic results)
 */

import { prisma } from '@/lib/prisma'

interface TrustAllocation {
  [nodeId: string]: { [targetNodeId: string]: number }
}

interface TrustScores {
  [nodeId: string]: number
}

interface ComputationResult {
  success: boolean
  numUsers: number
  iterations: number
  converged: boolean
  scores: Array<{
    userId: string
    trustScore: number
    displayScore: number
    rank: number
  }>
  error?: string
}

/**
 * Creates a 2D matrix filled with zeros
 */
function createMatrix(rows: number, cols: number): number[][] {
  return Array(rows).fill(null).map(() => Array(cols).fill(0))
}

/**
 * Creates a vector filled with the specified value
 */
function createVector(size: number, fillValue: number = 0): number[] {
  return Array(size).fill(fillValue)
}

/**
 * Transposes a matrix
 */
function transpose(matrix: number[][]): number[][] {
  const rows = matrix.length
  const cols = matrix[0].length
  const result = createMatrix(cols, rows)

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j]
    }
  }

  return result
}

/**
 * Matrix-vector multiplication
 */
function matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
  const n = matrix.length
  const result = createVector(n)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      result[i] += matrix[i][j] * vector[j]
    }
  }

  return result
}

/**
 * Main EigenTrust computation function
 */
export async function computeEigenTrust(
  decayFactor: number = 0.15,
  maxIterations: number = 100,
  convergenceThreshold: number = 0.000001,
  triggeredBy: string = "manual"
): Promise<ComputationResult> {

  const startTime = Date.now()

  // =========================================================================
  // STEP 1: Fetch Data
  // =========================================================================

  const users = await prisma.user.findMany({
    select: { id: true, email: true }
  })

  const n = users.length

  if (n === 0) {
    return {
      success: false,
      error: "No users in system",
      numUsers: 0,
      iterations: 0,
      converged: false,
      scores: []
    }
  }

  // Create mapping: userId → array index (0, 1, 2, ...)
  const userToIndex = new Map<string, number>()
  const userIds: string[] = []

  users.forEach((user, index) => {
    userToIndex.set(user.id, index)
    userIds.push(user.id)
  })

  // Identify admin user
  const adminUser = users.find(u => u.email === 'vaishnav@cloutcareers.com')
  if (!adminUser) {
    return {
      success: false,
      error: "Admin user not found",
      numUsers: n,
      iterations: 0,
      converged: false,
      scores: []
    }
  }

  const adminIndex = userToIndex.get(adminUser.id)!

  console.log(`Computing EigenTrust for ${n} users`)
  console.log(`Admin is at index ${adminIndex}`)

  // =========================================================================
  // STEP 2: Build Trust Matrix C
  // C is n×n matrix where C[i][j] = proportion of trust user i gives to user j
  // Each row must sum to 1.0
  // =========================================================================

  // Initialize matrix with zeros
  const C = createMatrix(n, n)

  // Fetch all trust allocations from database
  const allocations = await prisma.trustAllocation.findMany()

  // Fill the matrix
  for (const allocation of allocations) {
    const giverIdx = userToIndex.get(allocation.giverId)
    const receiverIdx = userToIndex.get(allocation.receiverId)

    if (giverIdx !== undefined && receiverIdx !== undefined) {
      C[giverIdx][receiverIdx] = allocation.proportion
    }
  }

  // Verify/fix each row
  for (let i = 0; i < n; i++) {
    const rowSum = C[i].reduce((sum, val) => sum + val, 0)

    if (Math.abs(rowSum) < 0.001) {
      // User hasn't allocated trust yet - default: trust only admin
      // This preserves admin's signal instead of diluting it
      console.log(`User at index ${i} has no allocations, defaulting to trust admin only`)
      C[i][adminIndex] = 1.0
    } else if (Math.abs(rowSum - 1.0) > 0.01) {
      // Row doesn't sum to 1.0, normalize it
      console.log(`User at index ${i} allocations sum to ${rowSum}, normalizing`)
      for (let j = 0; j < n; j++) {
        C[i][j] = C[i][j] / rowSum
      }
    }
  }

  // =========================================================================
  // STEP 3: Build Pretrust Vector p
  // p[i] = 1.0 if i is admin, 0.0 otherwise
  // This represents "initial trust" before network effects
  // =========================================================================

  const p = createVector(n, 0.0)
  p[adminIndex] = 1.0

  // =========================================================================
  // STEP 4: Initialize Trust Vector t^(0)
  // Start with pretrust: admin = 1.0, everyone else = 0.0
  // Trust will propagate from admin through the network
  // =========================================================================

  let tOld = [...p]  // [0, 0, ..., 1.0, ..., 0, 0]

  console.log("Starting iteration with admin trust = 1.0, others = 0.0")

  // =========================================================================
  // STEP 5: Iterative Trust Propagation
  // Each iteration propagates trust one more degree through the network
  // =========================================================================

  const alpha = decayFactor  // Probability of teleporting back to pretrust
  let converged = false
  let iterationCount = 0

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    iterationCount = iteration + 1

    // --- 5a. Matrix Multiplication: C^T × t^(k) ---
    // This computes how much trust flows TO each user
    // from all other users based on current trust scores

    const CTranspose = transpose(C)
    const networkTrust = matrixVectorMultiply(CTranspose, tOld)

    // --- 5b. Apply EigenTrust Formula ---
    // t^(k+1) = (1-α) × networkTrust + α × p
    //
    // Intuition:
    // - 85% (if α=0.15) comes from network trust propagation
    // - 15% comes from "teleporting" back to pretrust (admin)

    const tNew = createVector(n)
    for (let i = 0; i < n; i++) {
      tNew[i] = (1 - alpha) * networkTrust[i] + alpha * p[i]
    }

    // --- 5c. CRITICAL: Fix Admin Trust at 1.0 ---
    // Admin is always the reference point
    // Without this, admin's trust would decay to alpha × 1.0 = 0.15

    tNew[adminIndex] = 1.0

    // --- 5d. Check Convergence ---
    // Stop when trust scores stop changing significantly
    // This means trust has propagated through all path lengths

    let maxChange = 0
    for (let i = 0; i < n; i++) {
      const change = Math.abs(tNew[i] - tOld[i])
      if (change > maxChange) {
        maxChange = change
      }
    }

    // Log progress every 10 iterations
    if (iteration % 10 === 0) {
      console.log(`Iteration ${iteration}: max change = ${maxChange}`)
    }

    // Check if converged
    if (maxChange < convergenceThreshold) {
      converged = true
      console.log(`✓ Converged after ${iterationCount} iterations`)
      tOld = tNew
      break
    }

    // Update for next iteration
    tOld = tNew
  }

  // After loop
  if (!converged) {
    console.log(`⚠ Did not converge after ${maxIterations} iterations`)
  }

  // =========================================================================
  // STEP 6: Prepare Results
  // =========================================================================

  const scores = []
  for (let i = 0; i < n; i++) {
    scores.push({
      userId: userIds[i],
      trustScore: tOld[i],          // Raw score (0.0-1.0)
      displayScore: Math.round(tOld[i] * 100),  // For UI (0-100)
      rank: 0  // Will be set after sorting
    })
  }

  // Sort by trustScore descending to assign ranks
  const sortedScores = [...scores].sort((a, b) => b.trustScore - a.trustScore)

  for (let position = 0; position < n; position++) {
    sortedScores[position].rank = position + 1
  }

  // Update original scores array with ranks
  for (const score of scores) {
    const sorted = sortedScores.find(s => s.userId === score.userId)
    if (sorted) score.rank = sorted.rank
  }

  // =========================================================================
  // STEP 7: Save to Database
  // =========================================================================

  await prisma.$transaction(async (tx) => {
    // Delete old computed scores
    await tx.computedTrustScore.deleteMany({})

    // Insert new computed scores
    for (const score of scores) {
      await tx.computedTrustScore.create({
        data: {
          userId: score.userId,
          trustScore: score.trustScore,
          displayScore: score.displayScore,
          rank: score.rank,
          iterationCount: iterationCount
        }
      })
    }

    // Log this computation
    await tx.trustComputationLog.create({
      data: {
        numUsers: n,
        numIterations: iterationCount,
        convergenceThreshold: convergenceThreshold,
        decayFactor: alpha,
        converged: converged,
        triggeredBy: triggeredBy
      }
    })
  }, {
    maxWait: 10000,
    timeout: 10000,
  })

  console.log(`✓ Saved ${n} computed scores to database`)

  // =========================================================================
  // STEP 8: Return Results
  // =========================================================================

  return {
    success: true,
    numUsers: n,
    iterations: iterationCount,
    converged: converged,
    scores: scores
  }
}

/**
 * Initialize clean trust state - clears all allocations
 * Users with no allocations will default to trusting admin only
 * This preserves admin's signal instead of diluting it with equal distributions
 */
export async function initializeCleanTrustState(): Promise<void> {
  console.log("Initializing clean trust state")
  console.log("Clearing all trust allocations - users will default to trusting admin")

  // Simply clear all allocations
  // The computation algorithm will default unallocated users to trust admin only
  await prisma.trustAllocation.deleteMany({})

  console.log("✓ Clean trust state initialized")
  console.log("📋 Users without allocations will automatically trust admin")
  console.log("📋 Admin's trust allocations will drive initial rankings")
}

