/**
 * CLOUT SCORING SYSTEM
 *
 * This module handles clout/reputation scoring calculations and utilities.
 * Provides functions to award clout, calculate tiers, and manage reputation.
 */

import { prisma } from '@/lib/prisma'

// Clout point values for different activities
export const CLOUT_POINTS = {
  SUCCESSFUL_REFERRAL: 10,
  QUALITY_ENDORSEMENT: 5,
  NETWORK_INVITATION: 3,
  HIRING_MANAGER_SUCCESS: 15,
  COMMUNITY_CONTRIBUTION: 2,
  TRUST_VALIDATION: 1,
  PLATFORM_PROMOTION: 1,
  NEGATIVE_FEEDBACK: -5,
  SPAM_VIOLATION: -10
} as const

// Clout tiers and thresholds
export const CLOUT_TIERS = {
  NEWCOMER: { min: 0, max: 9, label: 'Newcomer', color: 'gray' },
  CONTRIBUTOR: { min: 10, max: 24, label: 'Contributor', color: 'blue' },
  TRUSTED: { min: 25, max: 49, label: 'Trusted Member', color: 'green' },
  EXPERT: { min: 50, max: 99, label: 'Expert', color: 'purple' },
  LEGEND: { min: 100, max: Infinity, label: 'Legend', color: 'gold' }
} as const

/**
 * Get clout tier for a given score
 */
export function getCloutTier(score: number) {
  for (const [tierName, tier] of Object.entries(CLOUT_TIERS)) {
    if (score >= tier.min && score <= tier.max) {
      return { name: tierName, ...tier }
    }
  }
  return { name: 'NEWCOMER', ...CLOUT_TIERS.NEWCOMER }
}

/**
 * Award clout points to a user for an activity
 */
export async function awardClout(
  userId: string,
  activity: keyof typeof CLOUT_POINTS,
  description: string,
  options: {
    jobId?: string
    endorsementId?: string
    customPoints?: number
  } = {}
) {
  const pointsAwarded = options.customPoints || CLOUT_POINTS[activity] || 0

  // Create clout activity record
  const cloutActivity = await prisma.cloutActivity.create({
    data: {
      userId,
      activity,
      pointsAwarded,
      description,
      jobId: options.jobId,
      endorsementId: options.endorsementId
    }
  })

  // Update user's clout score
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      cloutScore: {
        increment: pointsAwarded
      }
    },
    select: {
      cloutScore: true,
      email: true,
      firstName: true,
      lastName: true
    }
  })

  return {
    cloutActivity,
    newCloutScore: updatedUser.cloutScore,
    cloutTier: getCloutTier(updatedUser.cloutScore),
    user: updatedUser
  }
}

/**
 * Record earnings for a user
 */
export async function recordEarnings(
  userId: string,
  amount: number,
  type: 'REFERRAL_BONUS' | 'ENDORSEMENT_FEE' | 'NETWORK_BONUS' | 'HIRING_COMMISSION' | 'CLOUT_REWARD',
  description: string,
  options: {
    jobId?: string
    metadata?: any
    status?: 'PENDING' | 'CONFIRMED' | 'PAID'
  } = {}
) {
  // Create earnings transaction
  const transaction = await prisma.earningsTransaction.create({
    data: {
      userId,
      amount,
      type,
      description,
      jobId: options.jobId,
      metadata: options.metadata,
      status: options.status || 'PENDING'
    }
  })

  // Update user's earnings totals
  const fieldToUpdate = options.status === 'PAID' ? 'totalEarnings' : 'pendingEarnings'

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      [fieldToUpdate]: {
        increment: amount
      }
    },
    select: {
      totalEarnings: true,
      pendingEarnings: true,
      email: true,
      firstName: true,
      lastName: true
    }
  })

  return {
    transaction,
    updatedEarnings: updatedUser,
    user: updatedUser
  }
}

/**
 * Process successful job referral - awards both clout and earnings
 */
export async function processSuccessfulReferral(
  referrerId: string,
  jobId: string,
  candidateEmail: string,
  referralAmount: number
) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { title: true, company: { select: { name: true } } }
  })

  const description = `Successful referral: ${candidateEmail} hired for ${job?.title} at ${job?.company?.name}`

  // Award clout points
  const cloutResult = await awardClout(
    referrerId,
    'SUCCESSFUL_REFERRAL',
    description,
    { jobId }
  )

  // Record earnings
  const earningsResult = await recordEarnings(
    referrerId,
    referralAmount,
    'REFERRAL_BONUS',
    description,
    { jobId, status: 'CONFIRMED' }
  )

  // Update successful referrals count
  await prisma.user.update({
    where: { id: referrerId },
    data: {
      successfulReferrals: {
        increment: 1
      }
    }
  })

  return {
    clout: cloutResult,
    earnings: earningsResult
  }
}

/**
 * Get user's clout and earnings summary
 */
export async function getUserCloutSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      cloutScore: true,
      totalEarnings: true,
      pendingEarnings: true,
      successfulReferrals: true,
      endorsementsScore: true,
      networkValue: true
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const cloutTier = getCloutTier(user.cloutScore)

  return {
    ...user,
    cloutTier
  }
}