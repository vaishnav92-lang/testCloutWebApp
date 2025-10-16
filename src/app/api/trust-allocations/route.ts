/**
 * TRUST ALLOCATIONS API
 *
 * Allows users (including admin) to update their trust allocations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeEigenTrust } from '@/lib/eigentrust-new'

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
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

    // Get request data
    const { allocations } = await request.json()

    // allocations is array of: [{ receiverId: string, proportion: number }, ...]
    if (!Array.isArray(allocations)) {
      return NextResponse.json({
        error: 'Allocations must be an array'
      }, { status: 400 })
    }

    // =========================================================================
    // BASIC VALIDATION: Just validate format, no sum constraint
    // =========================================================================

    // Validate allocation format
    for (const allocation of allocations) {
      if (typeof allocation.proportion !== 'number' || !allocation.receiverId) {
        return NextResponse.json({
          error: 'Invalid allocation format'
        }, { status: 400 })
      }

      if (allocation.proportion < 0 || allocation.proportion > 1) {
        return NextResponse.json({
          error: 'Allocation proportions must be between 0 and 1'
        }, { status: 400 })
      }
    }

    // =========================================================================
    // PREVENT SELF-ALLOCATION: User cannot allocate trust to themselves
    // =========================================================================

    const selfAllocation = allocations.find(allocation => allocation.receiverId === currentUser.id)
    if (selfAllocation) {
      return NextResponse.json({
        error: 'Cannot allocate trust to yourself'
      }, { status: 400 })
    }

    // =========================================================================
    // SAVE TO DATABASE
    // =========================================================================

    await prisma.$transaction(async (tx) => {
      // Delete user's existing allocations
      await tx.trustAllocation.deleteMany({
        where: { giverId: currentUser.id }
      })

      // Insert new allocations
      for (const allocation of allocations) {
        await tx.trustAllocation.create({
          data: {
            giverId: currentUser.id,
            receiverId: allocation.receiverId,
            proportion: allocation.proportion
          }
        })
      }
    })

    // =========================================================================
    // TRIGGER RECOMPUTATION (asynchronously, don't wait)
    // =========================================================================

    // Launch in background (don't block the response)
    computeEigenTrust(
      0.15,        // decayFactor
      100,         // maxIterations
      0.000001,    // convergenceThreshold
      "user_update" // triggeredBy
    ).catch(error => {
      console.error('Background trust computation failed:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Trust allocations updated successfully'
    })

  } catch (error) {
    console.error('Trust allocations update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
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

    // Fetch user's current allocations
    const allocations = await prisma.trustAllocation.findMany({
      where: { giverId: currentUser.id },
      include: {
        receiver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Fetch all users for the allocation interface (excluding current user to prevent self-allocation)
    const allUsers = await prisma.user.findMany({
      where: {
        id: {
          not: currentUser.id  // Exclude current user from allocation list
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { email: 'asc' }
      ]
    })


    return NextResponse.json({
      currentAllocations: allocations.map(allocation => ({
        receiverId: allocation.receiverId,
        receiverName: allocation.receiver.firstName && allocation.receiver.lastName
          ? `${allocation.receiver.firstName} ${allocation.receiver.lastName}`
          : allocation.receiver.email,
        proportion: allocation.proportion
      })),
      allUsers: allUsers.map(user => ({
        id: user.id,
        displayName: user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email
      }))
    })

  } catch (error) {
    console.error('Trust allocations fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch trust allocations'
    }, { status: 500 })
  }
}