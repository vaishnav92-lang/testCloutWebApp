/**
 * TRUST UPDATE API
 *
 * Allows users to update trust allocation for existing relationships.
 * Ensures total trust allocation doesn't exceed 100 points.
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

    // Block admin from using regular trust allocation
    if (session.user.email === 'vaishnav@cloutcareers.com') {
      return NextResponse.json({
        error: 'Admin must use the admin dashboard for trust allocation'
      }, { status: 403 })
    }

    // Get request data
    const { relationshipId, trustAllocation } = await request.json()

    if (!relationshipId || trustAllocation === undefined || trustAllocation < 0 || trustAllocation > 100) {
      return NextResponse.json({
        error: 'Valid relationship ID and trust allocation (0-100) are required'
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
        user1: { select: { id: true } },
        user2: { select: { id: true } }
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
        error: 'Not authorized to update this relationship'
      }, { status: 403 })
    }

    // Calculate trust difference
    const currentTrustAllocation = isUser1
      ? relationship.user1TrustAllocated
      : relationship.user2TrustAllocated
    const trustDifference = trustAllocation - currentTrustAllocation

    // Check if user has enough available trust
    const newAllocatedTrust = currentUser.allocatedTrust + trustDifference
    if (newAllocatedTrust > currentUser.totalTrustPoints) {
      return NextResponse.json({
        error: `Insufficient trust points. This would exceed your total of ${currentUser.totalTrustPoints} points.`
      }, { status: 400 })
    }

    // Update in a transaction
    await prisma.$transaction(async (tx) => {
      // Update relationship trust allocation
      if (isUser1) {
        await tx.relationship.update({
          where: { id: relationshipId },
          data: {
            user1TrustAllocated: trustAllocation,
            // Update legacy field for compatibility
            user1TrustScore: Math.round(trustAllocation / 10)
          }
        })
      } else {
        await tx.relationship.update({
          where: { id: relationshipId },
          data: {
            user2TrustAllocated: trustAllocation,
            // Update legacy field for compatibility
            user2TrustScore: Math.round(trustAllocation / 10)
          }
        })
      }

      // Update user's trust allocation tracking
      await tx.user.update({
        where: { id: currentUser.id },
        data: {
          allocatedTrust: newAllocatedTrust,
          availableTrust: currentUser.totalTrustPoints - newAllocatedTrust
        }
      })
    })

    // Trigger trust score recomputation in the background
    // Don't await to avoid blocking the response
    import('@/lib/eigentrust').then(({ updateUserCloutScores }) => {
      updateUserCloutScores().catch(error => {
        console.error('Background trust computation failed:', error)
      })
    })

    return NextResponse.json({
      message: 'Trust allocation updated successfully',
      newAllocation: trustAllocation,
      totalAllocated: newAllocatedTrust,
      availableTrust: currentUser.totalTrustPoints - newAllocatedTrust
    })

  } catch (error) {
    console.error('Trust update error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}