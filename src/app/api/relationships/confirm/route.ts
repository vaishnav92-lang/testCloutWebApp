/**
 * RELATIONSHIP CONFIRMATION API
 *
 * When a pending relationship is confirmed, this endpoint:
 * 1. Updates the relationship status to CONFIRMED
 * 2. Triggers EigenTrust recomputation
 *
 * Note: Trust allocation is now handled separately via /api/trust-allocations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { computeEigenTrust } from '@/lib/eigentrust-new'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get request data
    const { relationshipId } = await request.json()

    if (!relationshipId) {
      return NextResponse.json({
        error: 'Relationship ID is required'
      }, { status: 400 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Find the relationship
    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        user1: { select: { id: true, email: true } },
        user2: { select: { id: true, email: true } }
      }
    })

    if (!relationship) {
      return NextResponse.json({
        error: 'Relationship not found'
      }, { status: 404 })
    }

    // Check if user is part of this relationship
    const isUser1 = relationship.user1Id === currentUser.id
    const isUser2 = relationship.user2Id === currentUser.id

    if (!isUser1 && !isUser2) {
      return NextResponse.json({
        error: 'Not authorized to confirm this relationship'
      }, { status: 403 })
    }

    // Check if relationship is pending
    if (relationship.status !== 'PENDING') {
      return NextResponse.json({
        error: 'Relationship is not pending confirmation'
      }, { status: 400 })
    }

    // Update relationship status to confirmed
    await prisma.relationship.update({
      where: { id: relationshipId },
      data: { status: 'CONFIRMED' }
    })

    // Trigger trust score recomputation in the background
    computeEigenTrust(
      0.15,        // decayFactor
      100,         // maxIterations
      0.000001,    // convergenceThreshold
      "relationship_confirm" // triggeredBy
    ).catch(error => {
      console.error('Background trust computation failed:', error)
    })

    return NextResponse.json({
      message: 'Relationship confirmed successfully'
    })

  } catch (error) {
    console.error('Relationship confirmation error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}