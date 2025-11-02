/**
 * GRANT TRUST ALLOCATIONS API
 *
 * Endpoints for managing trust allocations between grant applicants
 * These allocations are also synced to the main TrustAllocation table
 * so grant applicants automatically become part of each other's trust networks
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { computeEigenTrust } from '@/lib/eigentrust-new'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { grantRoundId, toApplicationId, trustScore } = body

    // Validate inputs
    if (!grantRoundId || !toApplicationId || trustScore === undefined) {
      return NextResponse.json(
        { error: 'grantRoundId, toApplicationId, and trustScore are required' },
        { status: 400 }
      )
    }

    if (trustScore < 0 || trustScore > 1) {
      return NextResponse.json(
        { error: 'trustScore must be between 0 and 1' },
        { status: 400 }
      )
    }

    // Get current user's application
    const myApp = await prisma.grantApplication.findFirst({
      where: {
        grantRoundId,
        applicantId: session.user.id,
      },
    })

    if (!myApp) {
      return NextResponse.json(
        { error: 'You are not applying for this grant round' },
        { status: 403 }
      )
    }

    // Prevent self-allocation
    if (myApp.id === toApplicationId) {
      return NextResponse.json(
        { error: 'Cannot allocate trust to yourself' },
        { status: 400 }
      )
    }

    // Get the target applicant's user info
    const targetApp = await prisma.grantApplication.findUnique({
      where: { id: toApplicationId },
      include: { applicant: true },
    })

    if (!targetApp) {
      return NextResponse.json(
        { error: 'Target applicant not found' },
        { status: 404 }
      )
    }

    // Create or update trust allocation in grant scope
    const allocation = await prisma.grantTrustAllocation.upsert({
      where: {
        fromApplicationId_toApplicationId_grantRoundId: {
          fromApplicationId: myApp.id,
          toApplicationId,
          grantRoundId,
        },
      },
      update: {
        trustScore,
        updatedAt: new Date(),
      },
      create: {
        fromApplicationId: myApp.id,
        toApplicationId,
        grantRoundId,
        trustScore,
      },
      include: {
        toApplication: {
          include: {
            applicant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // SYNC: Update main network trust allocation and relationship
    // Get all existing trust allocations for this user
    const existingAllocations = await prisma.trustAllocation.findMany({
      where: { giverId: session.user.id },
    })

    const totalExisting = existingAllocations.reduce((sum, a) => sum + a.proportion, 0)
    const totalWithNew = totalExisting + trustScore

    // If total exceeds 1.0, scale down existing allocations proportionally
    if (totalWithNew > 1.0) {
      const scaleFactor = (1.0 - trustScore) / totalExisting

      // Update all existing allocations with scaled-down proportions
      for (const existing of existingAllocations) {
        const newProportion = existing.proportion * scaleFactor
        await prisma.trustAllocation.update({
          where: { id: existing.id },
          data: {
            proportion: newProportion,
            updatedAt: new Date(),
          },
        })
      }
    }

    // Now add/update the new trust allocation from the grant
    await prisma.trustAllocation.upsert({
      where: {
        giverId_receiverId: {
          giverId: session.user.id,
          receiverId: targetApp.applicantId,
        },
      },
      update: {
        proportion: trustScore,
        updatedAt: new Date(),
      },
      create: {
        giverId: session.user.id,
        receiverId: targetApp.applicantId,
        proportion: trustScore,
      },
    })

    // Create a Relationship record if it doesn't exist
    // This makes them appear in "Build Your Inner Circle" on the dashboard
    await prisma.relationship.upsert({
      where: {
        user1Id_user2Id: {
          user1Id: session.user.id,
          user2Id: targetApp.applicantId,
        },
      },
      update: {
        status: 'CONFIRMED', // Mark as confirmed since they're in a grant together
      },
      create: {
        user1Id: session.user.id,
        user2Id: targetApp.applicantId,
        status: 'CONFIRMED',
      },
    })

    // Trigger EigenTrust recomputation asynchronously to update main network scores
    computeEigenTrust(0.15, 100, 0.000001, 'grant_trust_allocation').catch((err) => {
      console.error('Error computing EigenTrust after grant allocation:', err)
    })

    return NextResponse.json(allocation)
  } catch (error) {
    console.error('Error creating trust allocation:', error)
    return NextResponse.json(
      { error: 'Failed to create trust allocation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const grantRoundId = request.nextUrl.searchParams.get('roundId')

    if (!grantRoundId) {
      return NextResponse.json(
        { error: 'grantRoundId is required' },
        { status: 400 }
      )
    }

    // Get current user's application
    const myApp = await prisma.grantApplication.findFirst({
      where: {
        grantRoundId,
        applicantId: session.user.id,
      },
    })

    if (!myApp) {
      return NextResponse.json({ allocations: [] })
    }

    // Get all allocations from this user
    const allocations = await prisma.grantTrustAllocation.findMany({
      where: {
        grantRoundId,
        fromApplicationId: myApp.id,
      },
      include: {
        toApplication: {
          include: {
            applicant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Calculate total allocated
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.trustScore, 0)

    return NextResponse.json({
      allocations,
      totalAllocated,
      remainingAllocation: Math.max(0, 1 - totalAllocated),
    })
  } catch (error) {
    console.error('Error fetching trust allocations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trust allocations' },
      { status: 500 }
    )
  }
}
