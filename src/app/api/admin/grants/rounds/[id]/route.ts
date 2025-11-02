/**
 * GRANT ROUND MANAGEMENT API
 *
 * Admin endpoints for updating grant round status and phase
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    const validStatuses = [
      'PHASE_ONE_VETTING',
      'PHASE_TWO_PREDICTIONS',
      'PHASE_THREE_REINFORCEMENT',
      'FINAL_ALLOCATION',
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      )
    }

    const grantRound = await prisma.grantRound.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(grantRound)
  } catch (error) {
    console.error('Error updating grant round:', error)
    return NextResponse.json(
      { error: 'Failed to update grant round' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const grantRound = await prisma.grantRound.findUnique({
      where: { id },
      include: {
        applications: {
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
        _count: {
          select: { applications: true },
        },
      },
    })

    if (!grantRound) {
      return NextResponse.json({ error: 'Grant round not found' }, { status: 404 })
    }

    return NextResponse.json(grantRound)
  } catch (error) {
    console.error('Error fetching grant round:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grant round' },
      { status: 500 }
    )
  }
}
