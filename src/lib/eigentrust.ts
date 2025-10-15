/**
 * EigenTrust Algorithm Implementation for Clout
 *
 * Computes trust scores using the EigenTrust algorithm with fixed admin node.
 * The admin has permanent trust score of 1.0 and serves as the trust anchor.
 */

import { prisma } from '@/lib/prisma'

interface TrustAllocation {
  [nodeId: string]: { [targetNodeId: string]: number }
}

interface TrustScores {
  [nodeId: string]: number
}

interface ComputationResult {
  trustScores: TrustScores
  iterations: number
  converged: boolean
  computationTime: number
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
 * Multiplies a matrix with a vector
 */
function matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
  const rows = matrix.length
  const result = createVector(rows)

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < vector.length; j++) {
      result[i] += matrix[i][j] * vector[j]
    }
  }

  return result
}

/**
 * Normalizes trust allocations to sum to 1.0
 */
function normalizeTrustAllocations(allocations: { [key: string]: number }): { [key: string]: number } {
  const total = Object.values(allocations).reduce((sum, val) => sum + val, 0)
  if (total === 0) return allocations

  const normalized: { [key: string]: number } = {}
  for (const [key, value] of Object.entries(allocations)) {
    normalized[key] = value / total
  }

  return normalized
}

/**
 * Fetches current trust allocations from the database
 */
async function fetchTrustAllocations(): Promise<{
  trustAllocations: TrustAllocation,
  allNodes: string[],
  adminId: string
}> {
  // Get all users and admin configuration
  const [users, systemConfig] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        relationshipsAsUser1: {
          where: { status: 'CONFIRMED' },
          select: {
            user2Id: true,
            user1TrustAllocated: true
          }
        },
        relationshipsAsUser2: {
          where: { status: 'CONFIRMED' },
          select: {
            user1Id: true,
            user2TrustAllocated: true
          }
        }
      }
    }),
    prisma.systemConfig.findFirst()
  ])

  const adminEmail = systemConfig?.adminEmail || 'vaishnav@cloutcareers.com'
  const adminUser = users.find(u => u.email === adminEmail)

  if (!adminUser) {
    throw new Error(`Admin user ${adminEmail} not found`)
  }

  const allNodes = users.map(u => u.id)
  const adminId = adminUser.id
  const trustAllocations: TrustAllocation = {}

  // Process each user's trust allocations
  for (const user of users) {
    const allocations: { [key: string]: number } = {}

    // Get outgoing trust from relationshipsAsUser1
    for (const rel of user.relationshipsAsUser1) {
      if (rel.user1TrustAllocated > 0) {
        allocations[rel.user2Id] = rel.user1TrustAllocated
      }
    }

    // Get outgoing trust from relationshipsAsUser2
    for (const rel of user.relationshipsAsUser2) {
      if (rel.user2TrustAllocated > 0) {
        allocations[rel.user1Id] = rel.user2TrustAllocated
      }
    }

    // If user has allocations, normalize them to sum to 1.0
    if (Object.keys(allocations).length > 0) {
      // Convert from 0-100 scale to 0-1 scale and normalize
      const total = Object.values(allocations).reduce((sum, val) => sum + val, 0)
      const normalizedAllocations: { [key: string]: number } = {}

      for (const [targetId, points] of Object.entries(allocations)) {
        normalizedAllocations[targetId] = points / 100 // Convert to 0-1 scale
      }

      // If they haven't allocated all 100 points, give remainder to admin
      const allocatedFraction = total / 100
      if (allocatedFraction < 1.0 && user.id !== adminId) {
        normalizedAllocations[adminId] = 1.0 - allocatedFraction
      }

      trustAllocations[user.id] = normalizedAllocations
    } else if (user.id !== adminId) {
      // Users with no allocations trust admin completely
      trustAllocations[user.id] = { [adminId]: 1.0 }
    }
  }

  return { trustAllocations, allNodes, adminId }
}

/**
 * Main EigenTrust computation function
 */
export async function computeTrustScores(
  alpha?: number,
  maxIterations?: number,
  convergenceThreshold?: number
): Promise<ComputationResult> {
  const startTime = Date.now()

  // Get system configuration
  const systemConfig = await prisma.systemConfig.findFirst()
  const finalAlpha = alpha ?? systemConfig?.eigentrustAlpha ?? 0.15
  const finalMaxIterations = maxIterations ?? systemConfig?.maxIterations ?? 100
  const finalThreshold = convergenceThreshold ?? systemConfig?.convergenceThreshold ?? 1e-6

  // Fetch trust data
  const { trustAllocations, allNodes, adminId } = await fetchTrustAllocations()
  const n = allNodes.length

  if (n === 0) {
    return {
      trustScores: {},
      iterations: 0,
      converged: true,
      computationTime: Date.now() - startTime
    }
  }

  // Create node index mapping
  const nodeToIndex: { [key: string]: number } = {}
  allNodes.forEach((nodeId, idx) => {
    nodeToIndex[nodeId] = idx
  })

  const adminIndex = nodeToIndex[adminId]

  // Build trust matrix C
  const C = createMatrix(n, n)

  for (const [sourceNodeId, allocations] of Object.entries(trustAllocations)) {
    const sourceIdx = nodeToIndex[sourceNodeId]

    for (const [targetNodeId, trustValue] of Object.entries(allocations)) {
      const targetIdx = nodeToIndex[targetNodeId]
      C[sourceIdx][targetIdx] = trustValue
    }
  }

  // Enforce constraint: no one trusts admin (set admin column to 0)
  for (let i = 0; i < n; i++) {
    C[i][adminIndex] = 0
  }

  // Initialize trust vector (admin starts at 1.0, others at 0.0)
  let tOld = createVector(n, 0)
  tOld[adminIndex] = 1.0

  // Pretrusted vector (same as initial)
  const p = [...tOld]

  // Iterative computation
  let converged = false
  let iterations = 0

  for (iterations = 0; iterations < finalMaxIterations; iterations++) {
    // Matrix multiplication: C^T × t
    const CTranspose = transpose(C)
    const networkTrust = matrixVectorMultiply(CTranspose, tOld)

    // Apply decay formula: t^(k+1) = (1-α) × C^T × t^(k) + α × p
    const tNew = createVector(n)
    for (let i = 0; i < n; i++) {
      tNew[i] = (1 - finalAlpha) * networkTrust[i] + finalAlpha * p[i]
    }

    // Fix admin trust at 1.0
    tNew[adminIndex] = 1.0

    // Check convergence
    let maxChange = 0
    for (let i = 0; i < n; i++) {
      const change = Math.abs(tNew[i] - tOld[i])
      if (change > maxChange) {
        maxChange = change
      }
    }

    if (maxChange < finalThreshold) {
      converged = true
      tOld = tNew
      break
    }

    tOld = tNew
  }

  // Convert result to node ID mapping
  const trustScores: TrustScores = {}
  allNodes.forEach((nodeId, idx) => {
    trustScores[nodeId] = tOld[idx]
  })

  const computationTime = Date.now() - startTime

  console.log(`EigenTrust computation completed: ${iterations + 1} iterations, ` +
             `${converged ? 'converged' : 'max iterations reached'}, ` +
             `${computationTime}ms`)

  return {
    trustScores,
    iterations: iterations + 1,
    converged,
    computationTime
  }
}

/**
 * Computes percentile rankings from trust scores
 */
export function computePercentiles(trustScores: TrustScores, adminId: string): { [nodeId: string]: number } {
  const scores = Object.entries(trustScores)
    .filter(([nodeId]) => nodeId !== adminId) // Exclude admin from percentile calculation
    .map(([nodeId, score]) => ({ nodeId, score }))
    .sort((a, b) => a.score - b.score)

  const percentiles: { [nodeId: string]: number } = {}

  scores.forEach((item, index) => {
    const percentile = scores.length > 1 ? Math.round((index / (scores.length - 1)) * 100) : 50
    percentiles[item.nodeId] = percentile
  })

  // Admin always gets 100th percentile (but this isn't shown to users)
  percentiles[adminId] = 100

  return percentiles
}

/**
 * Updates all user clout scores in the database
 */
export async function updateUserCloutScores(): Promise<ComputationResult> {
  const result = await computeTrustScores()
  const { trustScores, iterations, converged, computationTime } = result

  // Get admin ID for percentile calculation
  const systemConfig = await prisma.systemConfig.findFirst()
  const adminEmail = systemConfig?.adminEmail || 'vaishnav@cloutcareers.com'
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true }
  })

  if (!adminUser) {
    throw new Error('Admin user not found')
  }

  const percentiles = computePercentiles(trustScores, adminUser.id)

  // Update all users in a transaction
  await prisma.$transaction(async (tx) => {
    // Get current user clout scores to preserve admin assignments
    const currentUsers = await tx.user.findMany({
      select: { id: true, cloutScore: true }
    })
    const adminAssignedUsers = new Set(
      currentUsers
        .filter(u => u.cloutScore && u.cloutScore % 0.01 === 0) // Admin scores are whole numbers (0.10, 0.20, etc.)
        .map(u => u.id)
    )

    // Update user clout scores, but preserve admin assignments
    const updatePromises = Object.entries(trustScores).map(([userId, score]) => {
      // Skip updating users with admin assignments
      if (adminAssignedUsers.has(userId)) {
        console.log(`Preserving admin assignment for user ${userId}`)
        return Promise.resolve()
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          cloutScore: score,
          cloutPercentile: percentiles[userId] || 0
        }
      })
    })

    await Promise.all(updatePromises.filter(Boolean))

    // Update system config with computation metadata
    await tx.systemConfig.upsert({
      where: { id: 'system_config' },
      create: {
        id: 'system_config',
        lastTrustComputation: new Date(),
        lastComputationTime: computationTime,
        lastIterations: iterations
      },
      update: {
        lastTrustComputation: new Date(),
        lastComputationTime: computationTime,
        lastIterations: iterations
      }
    })
  })

  console.log(`Updated clout scores for ${Object.keys(trustScores).length} users`)

  return result
}