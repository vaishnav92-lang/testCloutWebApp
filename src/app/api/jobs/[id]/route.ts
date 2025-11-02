/**
 * INDIVIDUAL JOB API
 *
 * This endpoint fetches detailed information for a specific job.
 * Used by the job detail page to show all questionnaire data.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(
  _request: unknown,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    // Get current user's company if authenticated
    let userCompanyId: string | null = null
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { companyId: true },
      })
      userCompanyId = user?.companyId || null
    }

    // FETCH JOB WITH FULL DETAILS
    const job = await prisma.job.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        remote: true,
        salaryMin: true,
        salaryMax: true,
        currency: true,
        referralBudget: true,
        status: true,
        createdAt: true,
        companyId: true,
        jobVisibility: true,
        company: {
          select: {
            name: true,
            logoUrl: true,
            industry: true,
            size: true,
            description: true,
            website: true
          }
        },
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if job is active and user has permission to view it
    if (job.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check visibility permissions
    const isCompanyMember = userCompanyId === job.companyId
    const canView =
      job.jobVisibility === 'PUBLIC' ||
      (job.jobVisibility === 'COMPANY_ONLY' && isCompanyMember) ||
      (job.jobVisibility === 'COMPANY_AND_NETWORK' && (isCompanyMember || !!session?.user?.email))

    if (!canView) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    let hasApplied = false

    if (session?.user?.id) {
      const application = await prisma.jobApplication.findUnique({
        where: {
          userId_jobId: {
            userId: session.user.id,
            jobId: id,
          },
        },
      })
      if (application) {
        hasApplied = true
      }
    }

    return NextResponse.json({
      job,
      hasApplied,
    })

  } catch (error) {
    console.error('Job fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}