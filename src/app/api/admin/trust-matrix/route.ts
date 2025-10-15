/**
 * TRUST MATRIX API
 *
 * Provides a matrix of trust allocations between users.
 * Shows who trusts whom and by how much, with totals.
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

    // FETCH ALL USERS WITH CLOUT SCORES
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cloutScore: true,
        cloutPercentile: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { email: 'asc' }
      ]
    })

    // FETCH ALL TRUST RELATIONSHIPS
    const relationships = await prisma.relationship.findMany({
      where: {
        status: 'CONFIRMED'
      },
      select: {
        user1Id: true,
        user2Id: true,
        user1TrustAllocated: true,
        user2TrustAllocated: true
      }
    })

    // BUILD TRUST MATRIX
    const userMap = new Map(users.map(user => [user.id, {
      ...user,
      displayName: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email
    }]))

    // Initialize matrix
    const matrix: Record<string, Record<string, number>> = {}
    const totalReceived: Record<string, number> = {}
    const totalGiven: Record<string, number> = {}

    // Initialize all users in matrix
    users.forEach(user => {
      matrix[user.id] = {}
      totalReceived[user.id] = 0
      totalGiven[user.id] = 0

      users.forEach(otherUser => {
        matrix[user.id][otherUser.id] = 0
      })
    })

    // Fill matrix with trust allocations
    relationships.forEach(rel => {
      // User1 trusts User2
      if (rel.user2TrustAllocated && rel.user2TrustAllocated > 0) {
        matrix[rel.user1Id][rel.user2Id] = rel.user2TrustAllocated
        totalGiven[rel.user1Id] += rel.user2TrustAllocated
        totalReceived[rel.user2Id] += rel.user2TrustAllocated
      }

      // User2 trusts User1
      if (rel.user1TrustAllocated && rel.user1TrustAllocated > 0) {
        matrix[rel.user2Id][rel.user1Id] = rel.user1TrustAllocated
        totalGiven[rel.user2Id] += rel.user1TrustAllocated
        totalReceived[rel.user1Id] += rel.user1TrustAllocated
      }
    })

    // Format response
    const matrixData = users.map(user => ({
      id: user.id,
      displayName: userMap.get(user.id)?.displayName || user.email,
      trustGiven: users.map(otherUser => ({
        userId: otherUser.id,
        amount: matrix[user.id][otherUser.id]
      })),
      totalGiven: totalGiven[user.id],
      totalReceived: totalReceived[user.id]
    }))

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        displayName: userMap.get(user.id)?.displayName || user.email,
        cloutScore: Math.round((user.cloutScore || 0) * 100), // Convert to 0-100 scale
        cloutPercentile: user.cloutPercentile || 0
      })),
      relationshipMatrix: matrixData,
      summary: {
        totalUsers: users.length,
        totalRelationships: relationships.length,
        totalTrustInSystem: Object.values(totalGiven).reduce((sum, val) => sum + val, 0),
        totalCloutScores: users.reduce((sum, user) => sum + ((user.cloutScore || 0) * 100), 0)
      }
    })

  } catch (error) {
    console.error('Trust matrix fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch trust matrix'
    }, { status: 500 })
  }
}