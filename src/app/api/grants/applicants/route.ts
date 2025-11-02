/**
 * GRANT APPLICANTS LIST API
 *
 * Endpoint to fetch other applicants in a grant round (for trust allocation)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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

    // Get all applicants in this grant round except the current user
    const applicants = await prisma.grantApplication.findMany({
      where: {
        grantRoundId,
        applicantId: { not: session.user.id },
      },
      include: {
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
      orderBy: {
        applicant: {
          firstName: 'asc',
        },
      },
    })

    // Format response - return GrantApplication IDs, not User IDs
    const formattedApplicants = applicants.map((app) => ({
      id: app.id, // Return the GrantApplication ID for trust allocation API
      userId: app.applicant.id,
      firstName: app.applicant.firstName || '',
      lastName: app.applicant.lastName || '',
      email: app.applicant.email,
      profileImage: app.applicant.profileImage,
    }))

    return NextResponse.json({ applicants: formattedApplicants })
  } catch (error) {
    console.error('Error fetching grant applicants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applicants' },
      { status: 500 }
    )
  }
}
