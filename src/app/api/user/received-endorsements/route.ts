/**
 * RECEIVED ENDORSEMENTS API
 *
 * This endpoint fetches endorsements received by the current user.
 * Used to notify users about endorsements written about them.
 *
 * Features:
 * - Shows endorser information (not endorsement content)
 * - Includes endorsement status and decision requirements
 * - Used for dashboard notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // FIND CURRENT USER
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // FETCH RECEIVED ENDORSEMENTS
    // Get endorsements by email (for cases where user joined after endorsement)
    // and by user ID (for linked endorsements)
    const receivedEndorsements = await prisma.endorsement.findMany({
      where: {
        OR: [
          { endorsedUserEmail: currentUser.email },
          { endorsedUserId: currentUser.id }
        ]
      },
      include: {
        endorser: {
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

    // FORMAT RESPONSE (no endorsement content)
    const formattedEndorsements = receivedEndorsements.map(endorsement => ({
      id: endorsement.id,
      endorser: {
        name: `${endorsement.endorser.firstName || ''} ${endorsement.endorser.lastName || ''}`.trim() || endorsement.endorser.email,
        email: endorsement.endorser.email
      },
      status: endorsement.status,
      createdAt: endorsement.createdAt,
      candidateNotifiedAt: endorsement.candidateNotifiedAt,
      candidateRespondedAt: endorsement.candidateRespondedAt,
      needsAction: endorsement.status === 'PENDING_CANDIDATE_ACTION'
    }))

    return NextResponse.json({
      endorsements: formattedEndorsements,
      pendingCount: formattedEndorsements.filter(e => e.needsAction).length
    })

  } catch (error) {
    console.error('Received endorsements fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}