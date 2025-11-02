/**
 * GET GRANT ROUNDS API
 *
 * Public endpoint to fetch available grant rounds
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const grantRounds = await prisma.grantRound.findMany({
      where: {
        status: {
          in: ['PHASE_ONE_VETTING', 'PHASE_TWO_PREDICTIONS', 'PHASE_THREE_REINFORCEMENT'],
        },
      },
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(grantRounds)
  } catch (error) {
    console.error('Error fetching grant rounds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grant rounds' },
      { status: 500 }
    )
  }
}
