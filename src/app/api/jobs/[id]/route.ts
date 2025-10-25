/**
 * INDIVIDUAL JOB API
 *
 * This endpoint fetches detailed information for a specific job.
 * Used by the job detail page to show all questionnaire data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // FETCH JOB WITH FULL DETAILS
    const job = await prisma.job.findUnique({
      where: {
        id,
        status: 'ACTIVE' // Only show published jobs
      },
      include: {
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

    const session = await getServerSession(authOptions)
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