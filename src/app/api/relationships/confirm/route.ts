/**
 * RELATIONSHIP CONFIRMATION API
 *
 * When a pending relationship is confirmed, this endpoint:
 * 1. Updates the relationship status to CONFIRMED
 * 2. Allows the confirming user to allocate trust
 * 3. Triggers EigenTrust recomputation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
    const { relationshipId, trustAllocation } = await request.json()

    if (!relationshipId) {
      return NextResponse.json({
        error: 'Relationship ID is required'
      }, { status: 400 })
    }

    if (trustAllocation !== undefined && (trustAllocation < 0 || trustAllocation > 100)) {
      return NextResponse.json({
        error: 'Trust allocation must be between 0 and 100'
      }, { status: 400 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        totalTrustPoints: true,
        allocatedTrust: true,
        availableTrust: true
      }
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

    // Validate trust allocation if provided
    if (trustAllocation !== undefined && trustAllocation > 0) {
      if (currentUser.availableTrust < trustAllocation) {
        return NextResponse.json({
          error: `Insufficient trust points. Available: ${currentUser.availableTrust}, Requested: ${trustAllocation}`
        }, { status: 400 })
      }
    }

    // Update relationship in a transaction
    await prisma.$transaction(async (tx) => {
      // Update relationship status to confirmed
      const updateData: any = {
        status: 'CONFIRMED'
      }

      // Add trust allocation if provided
      if (trustAllocation !== undefined && trustAllocation > 0) {
        if (isUser1) {
          updateData.user1TrustAllocated = trustAllocation
          updateData.user1TrustScore = Math.round(trustAllocation / 10) // Legacy compatibility
        } else {
          updateData.user2TrustAllocated = trustAllocation
          updateData.user2TrustScore = Math.round(trustAllocation / 10) // Legacy compatibility
        }

        // Update user's trust allocation tracking
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            allocatedTrust: { increment: trustAllocation },
            availableTrust: { decrement: trustAllocation }
          }
        })
      }

      await tx.relationship.update({
        where: { id: relationshipId },
        data: updateData
      })
    })

    // Trigger trust score recomputation in the background
    import('@/lib/eigentrust').then(({ updateUserCloutScores }) => {
      updateUserCloutScores().catch(error => {
        console.error('Background trust computation failed:', error)
      })
    })

    return NextResponse.json({
      message: 'Relationship confirmed successfully',
      trustAllocated: trustAllocation || 0
    })

  } catch (error) {
    console.error('Relationship confirmation error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}