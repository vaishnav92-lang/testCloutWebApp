/**
 * GRANT ROUNDS API
 *
 * Admin endpoints for managing grant rounds
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, totalFunding, minimumGrantSize, status } = body

    const grantRound = await prisma.grantRound.create({
      data: {
        name,
        description,
        totalFunding,
        minimumGrantSize,
        status: status || 'PHASE_ONE_VETTING',
      },
    })

    return NextResponse.json(grantRound)
  } catch (error) {
    console.error('Error creating grant round:', error)
    return NextResponse.json(
      { error: 'Failed to create grant round' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const grantRounds = await prisma.grantRound.findMany({
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
