/**
 * Demo EigenTrust utilities
 * Converts demo trust allocations to graph format and calls the eigentrust API
 */

import { DemoState, DEMO_NETWORK_EDGES } from './demo-data'

export interface EigentrustResult {
  standard: Record<string, number>
  modified: Record<string, number>
}

/**
 * Convert demo state to graph format for EigenTrust
 * Combines user-editable allocations with background network for score variation
 * Graph format: { [fromId]: { [toId]: weight (0-1) } }
 */
export function trustAllocationsToGraph(state: DemoState): Record<string, Record<string, number>> {
  const graph: Record<string, Record<string, number>> = {}

  // Initialize all users
  state.users.forEach((user) => {
    graph[user.id] = {}
  })

  // First, add user-editable allocations (converted from percentage to decimal)
  state.trustAllocations.forEach((allocation) => {
    graph[allocation.fromUserId][allocation.toUserId] = allocation.allocation / 100
  })

  // Then add background network edges for other users (these create the variation)
  DEMO_NETWORK_EDGES.forEach((edge) => {
    // Only add if not already set by user allocations (user allocations take precedence)
    if (edge.from !== 'user-1' && !graph[edge.from][edge.to]) {
      graph[edge.from][edge.to] = edge.weight
    }
  })

  // Normalize each user's allocations to sum to 1.0
  Object.keys(graph).forEach((userId) => {
    const allocations = graph[userId]
    const total = Object.values(allocations).reduce((sum, val) => sum + val, 0)

    if (total > 0) {
      Object.keys(allocations).forEach((targetId) => {
        allocations[targetId] = allocations[targetId] / total
      })
    } else {
      // If no allocations, allocate equally to all other users (creates dampening)
      const otherCount = state.users.length - 1
      if (otherCount > 0) {
        state.users.forEach((user) => {
          if (user.id !== userId) {
            allocations[user.id] = 1 / otherCount
          }
        })
      }
    }
  })

  return graph
}

/**
 * Compute EigenTrust scores for the current demo state
 */
export async function computeDemoEigentrust(state: DemoState): Promise<EigentrustResult> {
  try {
    const graph = trustAllocationsToGraph(state)

    const response = await fetch('/api/eigentrust/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graph }),
    })

    if (!response.ok) {
      console.error('EigenTrust computation failed:', response.statusText)
      // Return mock scores if API fails
      return getMockEigentrustResults(state)
    }

    const data: EigentrustResult = await response.json()
    return data
  } catch (error) {
    console.error('Error computing EigenTrust:', error)
    // Return mock scores if API is unavailable
    return getMockEigentrustResults(state)
  }
}

/**
 * Mock EigenTrust results based on clout scores
 * Used as fallback if API is unavailable
 */
function getMockEigentrustResults(state: DemoState): EigentrustResult {
  const totalScore = Object.values(state.trustScores).reduce((a, b) => a + b, 0)
  const normalized: Record<string, number> = {}

  Object.entries(state.trustScores).forEach(([userId, score]) => {
    normalized[userId] = totalScore > 0 ? score / totalScore : 0
  })

  return {
    standard: normalized,
    modified: normalized,
  }
}
