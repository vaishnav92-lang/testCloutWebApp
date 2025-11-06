/**
 * GRANT APPLICATIONS API
 *
 * Endpoints for managing grant applications
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
    const { grantRoundId, utilityFunction, contributions, status, statement } = body

    // Create or update application
    const application = await prisma.grantApplication.upsert({
      where: {
        grantRoundId_applicantId: {
          grantRoundId,
          applicantId: session.user.id,
        },
      },
      update: {
        utilityFunction,
        statement,
        status: status || undefined,
        submittedAt: status === 'SUBMITTED' ? new Date() : undefined,
        updatedAt: new Date(),
      },
      create: {
        grantRoundId,
        applicantId: session.user.id,
        utilityFunction,
        statement,
        status: status || 'DRAFT',
        submittedAt: status === 'SUBMITTED' ? new Date() : undefined,
      },
      include: {
        contributions: true,
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    })

    // Handle contributions
    if (contributions && Array.isArray(contributions)) {
      // Delete existing contributions
      await prisma.grantContribution.deleteMany({
        where: { applicationId: application.id },
      })

      // Create new contributions
      await prisma.grantContribution.createMany({
        data: contributions.map((c: any) => ({
          applicationId: application.id,
          title: c.title,
          description: c.description,
          url: c.url,
          yourContribution: c.yourContribution,
          proofOfWork: c.proofOfWork,
          isProposal: c.isProposal || false,
        })),
      })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('Error creating grant application:', error)
    return NextResponse.json(
      { error: 'Failed to create grant application' },
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

    const application = await prisma.grantApplication.findUnique({
      where: {
        grantRoundId_applicantId: {
          grantRoundId,
          applicantId: session.user.id,
        },
      },
      include: {
        contributions: true,
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    })

    return NextResponse.json(application)
  } catch (error) {
    console.error('Error fetching grant application:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grant application' },
      { status: 500 }
    )
  }
}
