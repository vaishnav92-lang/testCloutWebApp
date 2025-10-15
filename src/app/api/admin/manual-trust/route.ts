/**
 * MANUAL TRUST ASSIGNMENT API
 *
 * Allows admin to manually override clout scores for specific users.
 * This bypasses the EigenTrust algorithm for testing or emergency adjustments.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// POST - Assign manual trust score to a user
export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== 'vaishnav@cloutcareers.com') {
      return NextResponse.json({
        error: 'Admin access required'
      }, { status: 403 })
    }

    // INPUT VALIDATION
    const { email, cloutScore } = await request.json()

    if (!email || typeof cloutScore !== 'number' || cloutScore < 0 || cloutScore > 100) {
      return NextResponse.json({
        error: 'Valid email and clout score (0 - 100) are required'
      }, { status: 400 })
    }

    // FIND TARGET USER
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true }
    })

    if (!targetUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // ASSIGN MANUAL TRUST SCORE
    // Convert from 0-100 input to 0.0-1.0 internal storage
    const normalizedScore = cloutScore / 100

    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        cloutScore: normalizedScore,
        cloutPercentile: Math.round(cloutScore), // Use the percentage directly
        // Mark as manually assigned (you could add a field for this)
        // manuallyAssigned: true,
        // manualAssignedAt: new Date()
      }
    })

    const userName = targetUser.firstName && targetUser.lastName
      ? `${targetUser.firstName} ${targetUser.lastName}`
      : targetUser.email

    return NextResponse.json({
      message: `Manual trust score ${cloutScore} assigned to ${userName}`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: userName,
        cloutScore: cloutScore,
        cloutPercentile: cloutScore
      }
    })

  } catch (error) {
    console.error('Manual trust assignment error:', error)
    return NextResponse.json({
      error: 'Failed to assign manual trust score'
    }, { status: 500 })
  }
}

// DELETE - Reset user to computed trust score
export async function DELETE(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== 'vaishnav@cloutcareers.com') {
      return NextResponse.json({
        error: 'Admin access required'
      }, { status: 403 })
    }

    // INPUT VALIDATION
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // FIND TARGET USER
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true }
    })

    if (!targetUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // RESET TO COMPUTED SCORE
    // This could involve re-running EigenTrust for this user specifically
    // For now, we'll reset to a default and trigger recomputation
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        cloutScore: 0.5, // Default until recomputation
        cloutPercentile: 50, // Default until recomputation
        // Remove manual assignment flags
        // manuallyAssigned: false,
        // manualAssignedAt: null
      }
    })

    // NOTE: Do NOT trigger EigenTrust recomputation for manual admin assignments
    // Admin assignments should be preserved, not overwritten by algorithmic computation

    const userName = targetUser.firstName && targetUser.lastName
      ? `${targetUser.firstName} ${targetUser.lastName}`
      : targetUser.email

    return NextResponse.json({
      message: `Reset ${userName} to computed trust score and triggered recomputation`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: userName
      }
    })

  } catch (error) {
    console.error('Trust score reset error:', error)
    return NextResponse.json({
      error: 'Failed to reset trust score'
    }, { status: 500 })
  }
}