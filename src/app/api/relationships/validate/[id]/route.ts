/**
 * RELATIONSHIP VALIDATION MODULE
 *
 * This module handles the validation of pending relationship requests.
 * It provides endpoints for recipients to view and respond to relationship invitations.
 *
 * Flow:
 * 1. User receives validation email with link to this endpoint
 * 2. GET: Fetches relationship details (sender info, status)
 * 3. POST: Processes accept/decline decision with trust score
 *
 * Key features:
 * - Authorization checks (only recipient can validate)
 * - Privacy protection (sender's trust score hidden)
 * - Status validation (only pending relationships can be processed)
 * - Trust score collection when accepting
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Fetch relationship details for validation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // AUTHENTICATION CHECK
    // Ensure user is logged in before allowing access to relationship details
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const { id: relationshipId } = await params

    // FETCH RELATIONSHIP DATA
    // Get relationship with both user details for validation display
    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        user1: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        user2: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    })

    if (!relationship) {
      return NextResponse.json({
        error: 'Relationship not found'
      }, { status: 404 })
    }

    // Find current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // AUTHORIZATION CHECK
    // Only the recipient (user2) can validate the relationship
    // This prevents unauthorized users from viewing/validating others' invitations
    if (relationship.user2Id !== currentUser.id) {
      return NextResponse.json({
        error: 'Not authorized to validate this relationship'
      }, { status: 403 })
    }

    // STATUS VALIDATION
    // Only pending relationships can be validated
    // Prevents re-processing of already handled relationships
    if (relationship.status !== 'PENDING') {
      return NextResponse.json({
        error: 'Relationship has already been processed',
        status: relationship.status
      }, { status: 400 })
    }

    // RESPONSE PREPARATION
    // Return sender info for display (trust score hidden for privacy)
    return NextResponse.json({
      id: relationship.id,
      sender: {
        name: `${relationship.user1.firstName || ''} ${relationship.user1.lastName || ''}`.trim() || 'Someone',
        email: relationship.user1.email
      },
      status: relationship.status
    })

  } catch (error) {
    console.error('Validation fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}

// POST - Accept or decline relationship
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // AUTHENTICATION CHECK
    // Ensure user is logged in before allowing relationship processing
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // INPUT VALIDATION
    // Extract and validate action and trust score from request
    const { action, trustScore } = await request.json()
    const { id: relationshipId } = await params

    // Validate action is either 'accept' or 'decline'
    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({
        error: 'Valid action (accept/decline) is required'
      }, { status: 400 })
    }

    // Trust score required when accepting (1-10 range)
    if (action === 'accept' && (!trustScore || trustScore < 1 || trustScore > 10)) {
      return NextResponse.json({
        error: 'Trust score (1-10) is required when accepting'
      }, { status: 400 })
    }

    // Find the relationship
    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        user1: { select: { email: true } },
        user2: { select: { email: true } }
      }
    })

    if (!relationship) {
      return NextResponse.json({
        error: 'Relationship not found'
      }, { status: 404 })
    }

    // Find current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Check authorization
    if (relationship.user2Id !== currentUser.id) {
      return NextResponse.json({
        error: 'Not authorized to validate this relationship'
      }, { status: 403 })
    }

    // Check if already processed
    if (relationship.status !== 'PENDING') {
      return NextResponse.json({
        error: 'Relationship has already been processed'
      }, { status: 400 })
    }

    // DATABASE UPDATE
    // Update relationship status and set recipient's trust score
    // user2TrustScore: The trust score the recipient gives to the sender
    // Status: CONFIRMED if accepted, DECLINED if rejected
    const updatedRelationship = await prisma.relationship.update({
      where: { id: relationshipId },
      data: {
        status: action === 'accept' ? 'CONFIRMED' : 'DECLINED',
        user2TrustScore: action === 'accept' ? trustScore : 0
      }
    })

    // SUCCESS RESPONSE
    // Return confirmation message and final status
    return NextResponse.json({
      message: action === 'accept'
        ? 'Relationship confirmed successfully'
        : 'Relationship declined',
      status: updatedRelationship.status
    })

  } catch (error) {
    console.error('Validation action error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}