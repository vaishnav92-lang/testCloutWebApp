/**
 * REFERRAL CHAIN TRACKING SYSTEM
 *
 * This module implements chain-based referral tracking where job forwards
 * and candidate referrals are tracked to enable proper payment attribution
 * when a hire is made.
 *
 * Key Features:
 * - Forward job opportunities through network
 * - Reconstruct referral chains using "earliest timestamp wins" heuristic
 * - Calculate payment splits using inverse square law
 * - Track complete audit trail of referral flow
 */

import { prisma } from '@/lib/prisma'

export interface PaymentSplit {
  nodeId: string
  name: string
  amount: number
}

export interface ChainNode {
  id: string
  name: string
  email: string
}

/**
 * Records that a node forwarded a job to another node
 *
 * @param jobId - The job being forwarded
 * @param fromNodeId - The node doing the forwarding
 * @param toNodeId - The node receiving the forward
 * @param message - Optional message included with forward
 * @returns The created forward record
 */
export async function forwardJob(
  jobId: string,
  fromNodeId: string,
  toNodeId: string,
  message?: string
) {
  try {
    // Validate that from and to nodes are different
    if (fromNodeId === toNodeId) {
      throw new Error('Cannot forward job to yourself')
    }

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      throw new Error('Job not found')
    }

    // Verify both users exist
    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: fromNodeId } }),
      prisma.user.findUnique({ where: { id: toNodeId } })
    ])

    if (!fromUser || !toUser) {
      throw new Error('One or both users not found')
    }

    // Create the forward record (UNIQUE constraint handles duplicates)
    const forward = await prisma.jobForward.create({
      data: {
        jobId,
        fromNodeId,
        toNodeId,
        message
      },
      include: {
        job: { select: { title: true } },
        fromNode: { select: { firstName: true, lastName: true, email: true } },
        toNode: { select: { firstName: true, lastName: true, email: true } }
      }
    })

    return forward
  } catch (error: any) {
    // Handle duplicate forwards gracefully
    if (error.code === 'P2002') {
      // Find and return existing forward
      const existing = await prisma.jobForward.findUnique({
        where: {
          jobId_fromNodeId_toNodeId: {
            jobId,
            fromNodeId,
            toNodeId
          }
        },
        include: {
          job: { select: { title: true } },
          fromNode: { select: { firstName: true, lastName: true, email: true } },
          toNode: { select: { firstName: true, lastName: true, email: true } }
        }
      })
      return existing
    }
    throw error
  }
}

/**
 * Reconstructs the referral chain by walking backwards through forwards
 *
 * IMPORTANT: If a node received forwards from multiple people for the same job,
 * use the EARLIEST timestamp (first forward wins).
 *
 * @param jobId - The job to trace
 * @param nodeId - The ending node (typically the referrer)
 * @returns Array of node IDs representing the chain from start to end
 */
export async function reconstructChain(jobId: string, nodeId: string): Promise<string[]> {
  const chain = [nodeId]
  let currentNode = nodeId
  const visited = new Set([nodeId]) // Prevent infinite loops

  while (true) {
    // Find ALL forwards to currentNode for this job
    const forwards = await prisma.jobForward.findMany({
      where: {
        jobId,
        toNodeId: currentNode
      },
      orderBy: {
        createdAt: 'asc' // CRITICAL: Order by earliest timestamp first
      }
    })

    if (forwards.length === 0) {
      // No one forwarded to this node - they're the start
      break
    }

    // CRITICAL: Use the earliest forward (first one chronologically)
    const earliestForward = forwards[0]

    // Prevent infinite loops
    if (visited.has(earliestForward.fromNodeId)) {
      console.warn(`Circular reference detected in chain for job ${jobId}, stopping at ${currentNode}`)
      break
    }

    // Add the from_node to the front of the chain
    chain.unshift(earliestForward.fromNodeId)
    visited.add(earliestForward.fromNodeId)

    // Continue walking backwards
    currentNode = earliestForward.fromNodeId

    // Safety check: prevent extremely long chains
    if (chain.length > 10) {
      console.warn(`Chain length exceeded 10 for job ${jobId}, stopping reconstruction`)
      break
    }
  }

  return chain
}

/**
 * Records a candidate referral and materializes the chain
 *
 * @param jobId - The job the candidate is being referred for
 * @param candidateId - The person being referred (if they have account)
 * @param candidateEmail - The candidate's email address
 * @param referrerNodeId - The node making the referral
 * @param howYouKnow - Description of relationship with candidate
 * @param confidenceLevel - high, medium, low
 * @param notes - Additional notes about the referral
 * @returns The created referral with materialized chain
 */
export async function createReferral(
  jobId: string,
  candidateId: string,
  candidateEmail: string,
  referrerNodeId: string,
  howYouKnow?: string,
  confidenceLevel?: string,
  notes?: string
) {
  // Validate inputs
  if (candidateId === referrerNodeId) {
    throw new Error('Cannot refer yourself')
  }

  // Verify job exists
  const job = await prisma.job.findUnique({
    where: { id: jobId }
  })

  if (!job) {
    throw new Error('Job not found')
  }

  // Verify referrer exists
  const referrer = await prisma.user.findUnique({
    where: { id: referrerNodeId }
  })

  if (!referrer) {
    throw new Error('Referrer not found')
  }

  // 1. Reconstruct the chain
  const chainPath = await reconstructChain(jobId, referrerNodeId)
  const chainDepth = chainPath.length - 1

  // 2. Insert referral with materialized chain
  const referral = await prisma.referral.create({
    data: {
      jobId,
      candidateId,
      candidateEmail,
      referrerNodeId,
      chainPath,
      chainDepth,
      howYouKnow,
      confidenceLevel,
      notes,
      status: 'PENDING'
    },
    include: {
      job: {
        select: {
          title: true,
          company: { select: { name: true } }
        }
      },
      candidate: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      referrerNode: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  return referral
}

/**
 * Calculates payment distribution across a referral chain using 70/30 split model
 *
 * - Direct referrer (last in chain) gets minimum 70% (100% if alone)
 * - Everyone else in chain shares remaining 30% equally
 *
 * @param totalAmount - Total payment to distribute (e.g., 10000)
 * @param chainPath - Array of node IDs from start to referrer
 * @returns Array of {nodeId, amount} objects
 */
export async function calculatePaymentSplits(
  totalAmount: number,
  chainPath: string[]
): Promise<PaymentSplit[]> {
  if (chainPath.length === 0) {
    return []
  }

  // Get user names for display
  const users = await prisma.user.findMany({
    where: {
      id: { in: chainPath }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  })

  const userMap = new Map(users.map(u => [u.id, u]))

  const n = chainPath.length

  if (n === 1) {
    // Direct referral - gets 100%
    const user = userMap.get(chainPath[0])
    const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown'

    return [{
      nodeId: chainPath[0],
      name,
      amount: totalAmount
    }]
  }

  // Chain referral - 70/30 split
  const directReferrerAmount = Math.round(totalAmount * 0.7) // 70% to direct referrer
  const chainAmount = totalAmount - directReferrerAmount // Remaining 30%
  const chainMemberAmount = Math.round(chainAmount / (n - 1)) // Split equally among chain members

  // Calculate splits
  return chainPath.map((nodeId, index) => {
    const user = userMap.get(nodeId)
    const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown'

    const isDirectReferrer = index === n - 1 // Last person in chain
    const amount = isDirectReferrer ? directReferrerAmount : chainMemberAmount

    return {
      nodeId,
      name,
      amount
    }
  })
}

/**
 * Calculates maximum possible payout for a person based on their position in chain
 * when they make a forward or direct referral
 *
 * @param totalAmount - Total job referral budget
 * @param currentChainLength - Current length of chain leading to this person
 * @param isDirectReferral - Whether this person is making a direct referral (vs forward)
 * @returns Object with max payout information
 */
export function calculateMaxPayout(
  totalAmount: number,
  currentChainLength: number,
  isDirectReferral: boolean = false
) {
  if (isDirectReferral) {
    // If making direct referral, they become the direct referrer
    const newChainLength = currentChainLength + 1

    if (newChainLength === 1) {
      // They're the only one - gets 100%
      return {
        maxAmount: totalAmount,
        percentage: 100,
        role: 'Direct Referrer (Solo)',
        chainLength: newChainLength
      }
    } else {
      // They're direct referrer in a chain - gets 70%
      return {
        maxAmount: Math.round(totalAmount * 0.7),
        percentage: 70,
        role: 'Direct Referrer',
        chainLength: newChainLength
      }
    }
  } else {
    // If forwarding, they become a chain member (not direct referrer)
    const newChainLength = currentChainLength + 2 // +1 for them, +1 for eventual referrer
    const chainAmount = Math.round(totalAmount * 0.3) // 30% split among chain
    const maxAmount = Math.round(chainAmount / (newChainLength - 1)) // Split among chain members

    return {
      maxAmount,
      percentage: Math.round((maxAmount / totalAmount) * 100),
      role: 'Chain Member',
      chainLength: newChainLength
    }
  }
}

/**
 * Updates the status of a referral (e.g., to 'HIRED')
 *
 * @param referralId - The referral to update
 * @param newStatus - The new status
 * @returns Updated referral
 */
export async function updateReferralStatus(
  referralId: string,
  newStatus: 'PENDING' | 'SCREENING' | 'INTERVIEWING' | 'HIRED' | 'REJECTED'
) {
  const referral = await prisma.referral.update({
    where: { id: referralId },
    data: {
      status: newStatus,
      updatedAt: new Date()
    },
    include: {
      job: {
        select: {
          title: true,
          company: { select: { name: true } }
        }
      },
      candidate: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      referrerNode: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  return referral
}

/**
 * Get referral chain with user details
 *
 * @param chainPath - Array of user IDs
 * @returns Array of chain nodes with user details
 */
export async function getChainWithDetails(chainPath: string[]): Promise<ChainNode[]> {
  if (chainPath.length === 0) {
    return []
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: chainPath }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  })

  const userMap = new Map(users.map(u => [u.id, u]))

  // Maintain order from chainPath
  return chainPath.map(nodeId => {
    const user = userMap.get(nodeId)
    if (!user) {
      return {
        id: nodeId,
        name: 'Unknown User',
        email: 'unknown@example.com'
      }
    }

    return {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email
    }
  })
}

/**
 * Get all referrals for a job with chain details
 *
 * @param jobId - The job ID
 * @returns Array of referrals with chain information
 */
export async function getReferralsForJob(jobId: string) {
  const referrals = await prisma.referral.findMany({
    where: { jobId },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true
        }
      },
      referrerNode: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get chain details for each referral
  const referralsWithChains = await Promise.all(
    referrals.map(async (referral) => {
      const chain = await getChainWithDetails(referral.chainPath)
      return {
        ...referral,
        chain
      }
    })
  )

  return referralsWithChains
}

/**
 * Get forwards sent by a specific node
 *
 * @param nodeId - The node ID
 * @returns Array of forwards sent by this node
 */
export async function getForwardsByNode(nodeId: string) {
  return await prisma.jobForward.findMany({
    where: { fromNodeId: nodeId },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: { select: { name: true } }
        }
      },
      toNode: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}