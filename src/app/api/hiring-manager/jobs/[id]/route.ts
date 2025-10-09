/**
 * HIRING MANAGER JOB UPDATE API
 *
 * This endpoint handles updating individual job postings by ID.
 * Used for auto-save drafts and publishing jobs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // VERIFY JOB OWNERSHIP
    const existingJob = await prisma.job.findUnique({
      where: { id: params.id },
      select: { ownerId: true, status: true }
    })

    if (!existingJob) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 })
    }

    if (existingJob.ownerId !== currentUser.id) {
      return NextResponse.json({
        error: 'Access denied - not job owner'
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
      status
    } = body

    // PREPARE UPDATE DATA
    const updateData: any = {}

    // Only update fields that are provided
    if (title !== undefined) updateData.title = title
    if (locationType !== undefined) updateData.locationType = locationType
    if (locationCity !== undefined) updateData.locationCity = locationCity
    if (salaryMin !== undefined) updateData.salaryMin = salaryMin || null
    if (salaryMax !== undefined) updateData.salaryMax = salaryMax || null
    if (currency !== undefined) updateData.currency = currency
    if (equityOffered !== undefined) updateData.equityOffered = equityOffered
    if (equityRange !== undefined) updateData.equityRange = equityRange
    if (dayToDayDescription !== undefined) updateData.dayToDayDescription = dayToDayDescription
    if (archetypes !== undefined) updateData.archetypes = archetypes
    if (nonWorkSignals !== undefined) updateData.nonWorkSignals = nonWorkSignals
    if (commonMismatches !== undefined) updateData.commonMismatches = commonMismatches
    if (roleChallenges !== undefined) updateData.roleChallenges = roleChallenges
    if (workingStyle !== undefined) updateData.workingStyle = workingStyle
    if (excitingWork !== undefined) updateData.excitingWork = excitingWork
    if (specialOpportunity !== undefined) updateData.specialOpportunity = specialOpportunity
    if (growthPath !== undefined) updateData.growthPath = growthPath
    if (mustHaves !== undefined) updateData.mustHaves = mustHaves
    if (referralBudget !== undefined) updateData.referralBudget = referralBudget || null
    if (referralPreference !== undefined) updateData.referralPreference = referralPreference

    // Handle status changes
    if (status !== undefined) {
      updateData.status = status

      // Set publishedAt when publishing for the first time
      if (status === 'ACTIVE' && existingJob.status !== 'ACTIVE') {
        updateData.publishedAt = new Date()
      }
    }

    // UPDATE JOB
    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: updateData,
      include: {
        company: {
          select: { name: true }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    return NextResponse.json({
      jobId: updatedJob.id,
      job: updatedJob
    })

  } catch (error) {
    console.error('Job update error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // FETCH JOB
    const job = await prisma.job.findUnique({
      where: {
        id: params.id,
        ownerId: currentUser.id // Ensure user owns this job
      },
      include: {
        company: {
          select: { name: true }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 })
    }

    return NextResponse.json({ job })

  } catch (error) {
    console.error('Job fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}