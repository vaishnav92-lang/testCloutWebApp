/**
 * INTRODUCTIONS API
 *
 * Endpoints for managing professional introductions between users.
 * Handles fetching, creating, and managing introduction relationships.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/introductions
 * Fetch all introductions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch all introductions where user is person A or person B
    const introductions = await prisma.introduction.findMany({
      where: {
        OR: [
          { personAId: user.id },
          { personBId: user.id }
        ]
      },
      include: {
        personA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            bio: true,
            location: true,
            linkedinUrl: true
          }
        },
        personB: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            bio: true,
            location: true,
            linkedinUrl: true
          }
        },
        introducedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format introductions to show the "other person" from the current user's perspective
    const formattedIntroductions = introductions.map(intro => {
      const isPersonA = intro.personAId === user.id
      const otherPerson = isPersonA ? intro.personB : intro.personA

      return {
        id: intro.id,
        otherPerson,
        introducedBy: intro.introducedBy,
        context: intro.context,
        status: intro.status,
        notes: intro.notes,
        createdAt: intro.createdAt,
        establishedAt: intro.establishedAt
      }
    })

    return NextResponse.json({
      introductions: formattedIntroductions,
      totalCount: formattedIntroductions.length
    })

  } catch (error) {
    console.error('Introductions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch introductions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/introductions
 * Create a new introduction (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isHiringManager: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // TODO: Add proper admin check once admin role is implemented
    // For now, we'll allow hiring managers to create introductions for testing
    if (!currentUser.isHiringManager) {
      return NextResponse.json(
        { error: 'Only admins can create introductions' },
        { status: 403 }
      )
    }

    const { personAId, personBId, context } = await request.json()

    // Validate required fields
    if (!personAId || !personBId || !context) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (personAId === personBId) {
      return NextResponse.json(
        { error: 'Cannot introduce someone to themselves' },
        { status: 400 }
      )
    }

    // Ensure personAId < personBId for consistency
    const [orderedPersonA, orderedPersonB] = [personAId, personBId].sort()

    // Check if introduction already exists
    const existingIntro = await prisma.introduction.findUnique({
      where: {
        personAId_personBId: {
          personAId: orderedPersonA,
          personBId: orderedPersonB
        }
      }
    })

    if (existingIntro) {
      return NextResponse.json(
        { error: 'Introduction already exists between these users' },
        { status: 400 }
      )
    }

    // Create the introduction
    const introduction = await prisma.introduction.create({
      data: {
        personAId: orderedPersonA,
        personBId: orderedPersonB,
        introducedById: currentUser.id,
        context,
        status: 'PENDING'
      },
      include: {
        personA: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        personB: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // TODO: Send email notifications to both users

    return NextResponse.json({
      message: 'Introduction created successfully',
      introduction
    })

  } catch (error) {
    console.error('Introduction creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create introduction' },
      { status: 500 }
    )
  }
}