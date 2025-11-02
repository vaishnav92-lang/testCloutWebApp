import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Get current user's company if authenticated
    let userCompanyId: string | null = null
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          companyId: true,
        },
      })
      userCompanyId = user?.companyId || null
    }

    // Fetch all active jobs first, then filter by visibility
    const allJobs = await prisma.job.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
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
            size: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter jobs by visibility in application code
    // - PUBLIC jobs: visible to everyone
    // - COMPANY_ONLY jobs: only visible to company members
    // - COMPANY_AND_NETWORK jobs: visible to company members and authenticated users
    const visibleJobs = allJobs.filter((job) => {
      if (job.jobVisibility === 'PUBLIC') {
        return true
      }
      if (job.jobVisibility === 'COMPANY_ONLY' && userCompanyId === job.companyId) {
        return true
      }
      if (job.jobVisibility === 'COMPANY_AND_NETWORK' && (userCompanyId === job.companyId || !!session?.user?.email)) {
        return true
      }
      return false
    })

    return NextResponse.json(visibleJobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({
      error: 'Failed to fetch jobs'
    }, { status: 500 })
  }
}