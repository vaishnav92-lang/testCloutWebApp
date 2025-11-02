/**
 * GRANT PREDICTIONS API
 *
 * Endpoints for managing predictions about grant applicants
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { grantRoundId, aboutApplicationId, predictionText, category } = body

    // Get the applicant's application to verify they're part of this round
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

    // Create prediction
    const prediction = await prisma.prediction.create({
      data: {
        grantRoundId,
        aboutApplicationId,
        byApplicationId: myApp.id,
        predictionText,
        category,
      },
      include: {
        aboutApplication: {
          include: {
            applicant: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Error creating prediction:', error)
    return NextResponse.json(
      { error: 'Failed to create prediction' },
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
    const aboutApplicationId = request.nextUrl.searchParams.get('aboutAppId')

    if (!grantRoundId) {
      return NextResponse.json(
        { error: 'grantRoundId is required' },
        { status: 400 }
      )
    }

    const query: any = { grantRoundId }
    if (aboutApplicationId) {
      query.aboutApplicationId = aboutApplicationId
    }

    const predictions = await prisma.prediction.findMany({
      where: query,
      include: {
        byApplication: {
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
        reinforcements: true,
      },
    })

    return NextResponse.json(predictions)
  } catch (error) {
    console.error('Error fetching predictions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    )
  }
}
