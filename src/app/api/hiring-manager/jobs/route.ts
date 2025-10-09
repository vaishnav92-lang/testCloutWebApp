/**
 * HIRING MANAGER JOBS API
 *
 * This endpoint fetches jobs created by the current hiring manager.
 * Used by the HiringManagerDashboard to display job listings and stats.
 *
 * Features:
 * - Returns only jobs owned by current user
 * - Includes application counts
 * - Sorted by creation date (newest first)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
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
      select: { id: true, isHiringManager: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // CHECK HIRING MANAGER PERMISSION
    if (!currentUser.isHiringManager) {
      return NextResponse.json({
        error: 'Access denied - hiring manager permissions required'
      }, { status: 403 })
    }

    // PARSE REQUEST BODY
    const body = await request.json()
    const {
      title,
      locationType,
      locationCity,
      salaryMin,
      salaryMax,
      currency,
      equityOffered,
      equityRange,
      dayToDayDescription,
      archetypes,
      nonWorkSignals,
      flexibleRequirements,
      flexibleReasons,
      commonMismatches,
      roleChallenges,
      workingStyle,
      excitingWork,
      specialOpportunity,
      growthPath,
      mustHaves,
      referralBudget,
      referralPreference,
      status = 'DRAFT'
    } = body

    // CREATE DEFAULT COMPANY IF NEEDED
    let company = await prisma.company.findFirst({
      where: { name: 'Default Company' }
    })

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Default Company',
          description: 'Default company for job postings'
        }
      })
    }

    // CREATE JOB
    const job = await prisma.job.create({
      data: {
        title: title || 'Untitled Job',
        locationType: locationType || 'REMOTE',
        locationCity,
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
        currency: currency || 'USD',
        equityOffered: equityOffered || false,
        equityRange,
        dayToDayDescription,
        archetypes,
        nonWorkSignals,
        commonMismatches,
        roleChallenges,
        workingStyle,
        excitingWork,
        specialOpportunity,
        growthPath,
        mustHaves,
        referralBudget: referralBudget || null,
        referralPreference: referralPreference || 'MANUAL_SCREEN',
        status: status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
        publishedAt: status === 'ACTIVE' ? new Date() : null,
        companyId: company.id,
        ownerId: currentUser.id
      },
      include: {
        company: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({
      jobId: job.id,
      job
    })

  } catch (error) {
    console.error('Job creation error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}

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
      select: { id: true, isHiringManager: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // CHECK HIRING MANAGER PERMISSION
    if (!currentUser.isHiringManager) {
      return NextResponse.json({
        error: 'Access denied - hiring manager permissions required'
      }, { status: 403 })
    }

    // FETCH JOBS
    const jobs = await prisma.job.findMany({
      where: {
        ownerId: currentUser.id
      },
      include: {
        company: {
          select: {
            name: true
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

    // FORMAT RESPONSE
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      status: job.status,
      locationType: job.locationType,
      locationCity: job.locationCity,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      referralBudget: job.referralBudget,
      createdAt: job.createdAt,
      publishedAt: job.publishedAt,
      company: job.company,
      _count: job._count
    }))

    return NextResponse.json({
      jobs: formattedJobs
    })

  } catch (error) {
    console.error('Hiring manager jobs fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}