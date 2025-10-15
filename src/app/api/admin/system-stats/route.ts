/**
 * SYSTEM STATISTICS API
 *
 * Provides comprehensive system statistics for the admin dashboard
 * including user counts, trust allocation data, and system health metrics.
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

    // PARALLEL DATA FETCHING for performance
    const [
      userStats,
      relationshipStats,
      trustAllocationStats,
      invitationStats,
      endorsementStats,
      jobStats,
      topTrustReceivers
    ] = await Promise.all([
      // User statistics
      prisma.user.aggregate({
        _count: { id: true },
        _sum: {
          totalTrustPoints: true,
          allocatedTrust: true,
          availableTrust: true
        },
        _avg: {
          allocatedTrust: true,
          availableTrust: true
        }
      }),

      // Relationship statistics
      prisma.relationship.groupBy({
        by: ['status'],
        _count: { id: true }
      }),

      // Trust allocation by user
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          allocatedTrust: true,
          availableTrust: true,
          totalTrustPoints: true
        },
        orderBy: { allocatedTrust: 'desc' },
        take: 10
      }),

      // Invitation statistics
      prisma.invitation.groupBy({
        by: ['status'],
        _count: { id: true }
      }),

      // Endorsement statistics
      prisma.endorsement.groupBy({
        by: ['status'],
        _count: { id: true }
      }),

      // Job statistics
      prisma.job.groupBy({
        by: ['status'],
        _count: { id: true }
      }),

      // Top trust receivers (calculated using aggregation instead of raw SQL)
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          relationshipsAsUser1: {
            where: { status: 'CONFIRMED' },
            select: { user2TrustAllocated: true }
          },
          relationshipsAsUser2: {
            where: { status: 'CONFIRMED' },
            select: { user1TrustAllocated: true }
          }
        },
        take: 50 // Get more to calculate totals
      })
    ])

    // Process relationship stats
    const relationshipCounts = relationshipStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Process invitation stats
    const invitationCounts = invitationStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Process endorsement stats
    const endorsementCounts = endorsementStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Process job stats
    const jobCounts = jobStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Calculate trust allocation efficiency
    const totalTrustInSystem = userStats._sum.totalTrustPoints || 0
    const totalTrustAllocated = userStats._sum.allocatedTrust || 0
    const trustAllocationRate = totalTrustInSystem > 0 ? (totalTrustAllocated / totalTrustInSystem) * 100 : 0

    return NextResponse.json({
      // User metrics
      users: {
        total: userStats._count.id,
        averageAllocatedTrust: userStats._avg.allocatedTrust || 0,
        averageAvailableTrust: userStats._avg.availableTrust || 0
      },

      // Trust system metrics
      trustSystem: {
        totalTrustInSystem,
        totalTrustAllocated,
        totalTrustAvailable: (userStats._sum.availableTrust || 0),
        allocationRate: Number(trustAllocationRate.toFixed(2)),
        topAllocators: trustAllocationStats.map(user => ({
          id: user.id,
          email: user.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
          allocatedTrust: user.allocatedTrust || 0,
          availableTrust: user.availableTrust || 0,
          totalTrustPoints: user.totalTrustPoints || 100
        })),
        topReceivers: topTrustReceivers
          .map(user => {
            // Calculate total trust received from relationships
            const trustFromAsUser1 = user.relationshipsAsUser1.reduce((sum, rel) => sum + (rel.user2TrustAllocated || 0), 0)
            const trustFromAsUser2 = user.relationshipsAsUser2.reduce((sum, rel) => sum + (rel.user1TrustAllocated || 0), 0)
            const totalTrustReceived = trustFromAsUser1 + trustFromAsUser2
            const relationshipCount = user.relationshipsAsUser1.length + user.relationshipsAsUser2.length

            return {
              id: user.id,
              email: user.email,
              name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
              totalTrustReceived,
              relationshipCount
            }
          })
          .sort((a, b) => b.totalTrustReceived - a.totalTrustReceived)
          .slice(0, 10)
      },

      // Relationship metrics
      relationships: {
        total: Object.values(relationshipCounts).reduce((a, b) => a + b, 0),
        confirmed: relationshipCounts.confirmed || 0,
        pending: relationshipCounts.pending || 0,
        declined: relationshipCounts.declined || 0
      },

      // Invitation metrics
      invitations: {
        total: Object.values(invitationCounts).reduce((a, b) => a + b, 0),
        pending: invitationCounts.pending || 0,
        accepted: invitationCounts.accepted || 0,
        declined: invitationCounts.declined || 0,
        expired: invitationCounts.expired || 0
      },

      // Endorsement metrics
      endorsements: {
        total: Object.values(endorsementCounts).reduce((a, b) => a + b, 0),
        active: (endorsementCounts.active_matching || 0) + (endorsementCounts.private || 0),
        pending: endorsementCounts.pending_candidate_action || 0,
        inactive: endorsementCounts.not_using || 0
      },

      // Job metrics
      jobs: {
        total: Object.values(jobCounts).reduce((a, b) => a + b, 0),
        active: jobCounts.active || 0,
        draft: jobCounts.draft || 0,
        closed: jobCounts.closed || 0
      },

      // System health
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('System stats fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch system statistics'
    }, { status: 500 })
  }
}