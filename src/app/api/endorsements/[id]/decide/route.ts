/**
 * ENDORSEMENT DECISION MODULE
 *
 * This module handles candidate decisions on endorsement visibility.
 * It processes the choice and updates endorsement status accordingly.
 *
 * Decision Flow:
 * 1. Candidate submits choice (PRIVATE, ACTIVE_MATCHING, NOT_USING)
 * 2. Validate endorsement exists and is pending decision
 * 3. Update endorsement status and response timestamp
 * 4. Link endorsed user if they join platform later
 * 5. Return confirmation
 *
 * Key features:
 * - Public access (no authentication required)
 * - Validates endorsement is actionable
 * - Updates status and timestamps
 * - Handles user linking for platform members
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type EndorsementChoice = 'PRIVATE' | 'ACTIVE_MATCHING' | 'NOT_USING'

// POST - Process candidate decision on endorsement
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const endorsementId = params.id
    const { choice } = await request.json()

    // VALIDATE INPUT
    if (!choice || !['PRIVATE', 'ACTIVE_MATCHING', 'NOT_USING'].includes(choice)) {
      return NextResponse.json({
        error: 'Valid choice is required (PRIVATE, ACTIVE_MATCHING, or NOT_USING)'
      }, { status: 400 })
    }

    // FETCH ENDORSEMENT
    const endorsement = await prisma.endorsement.findUnique({
      where: { id: endorsementId },
      select: {
        id: true,
        status: true,
        endorsedUserEmail: true,
        endorsedUserId: true
      }
    })

    if (!endorsement) {
      return NextResponse.json({
        error: 'Endorsement not found'
      }, { status: 404 })
    }

    // VALIDATE ENDORSEMENT STATUS
    // Allow changes to any endorsement except those in error states
    const allowedStatuses = ['PENDING_CANDIDATE_ACTION', 'PRIVATE', 'ACTIVE_MATCHING', 'NOT_USING']
    if (!allowedStatuses.includes(endorsement.status)) {
      return NextResponse.json({
        error: 'This endorsement cannot be modified'
      }, { status: 400 })
    }

    // FIND USER IF THEY'RE ON PLATFORM
    // This links the endorsement to their user account if they've joined
    const endorsedUser = await prisma.user.findUnique({
      where: { email: endorsement.endorsedUserEmail },
      select: { id: true }
    })

    // UPDATE ENDORSEMENT STATUS
    const updatedEndorsement = await prisma.endorsement.update({
      where: { id: endorsementId },
      data: {
        status: choice as EndorsementChoice,
        candidateRespondedAt: new Date(),
        // Link to user account if they're on platform
        endorsedUserId: endorsedUser?.id || endorsement.endorsedUserId
      }
    })

    // SUCCESS RESPONSE
    const isFirstTime = endorsement.status === 'PENDING_CANDIDATE_ACTION'
    return NextResponse.json({
      message: isFirstTime
        ? 'Endorsement preference set successfully'
        : 'Endorsement privacy settings updated successfully',
      status: updatedEndorsement.status
    })

  } catch (error) {
    console.error('Endorsement decision error:', error)
    return NextResponse.json({
      error: 'Server error processing decision'
    }, { status: 500 })
  }
}