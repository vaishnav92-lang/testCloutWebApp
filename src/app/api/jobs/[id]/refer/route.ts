/**
 * JOB REFERRAL API ENDPOINT
 *
 * POST /api/jobs/:jobId/refer
 * Refer a candidate for a job with chain tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createReferral } from '@/lib/referral-chain'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, firstName: true, lastName: true, email: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const {
      candidateId,
      candidateEmail,
      howYouKnow,
      confidenceLevel,
      notes
    } = body

    if (!candidateEmail) {
      return NextResponse.json({
        error: 'Candidate email is required'
      }, { status: 400 })
    }

    const jobId = params.id

    // If candidateId not provided, try to find user by email
    let targetCandidateId = candidateId
    if (!targetCandidateId) {
      const candidate = await prisma.user.findUnique({
        where: { email: candidateEmail }
      })
      if (candidate) {
        targetCandidateId = candidate.id
      } else {
        // Create a placeholder user for the candidate if they don't exist
        const newCandidate = await prisma.user.create({
          data: {
            email: candidateEmail,
            isProfileComplete: false
          }
        })
        targetCandidateId = newCandidate.id
      }
    }

    // Create the referral with chain tracking
    const referral = await createReferral(
      jobId,
      targetCandidateId,
      candidateEmail,
      currentUser.id,
      howYouKnow,
      confidenceLevel,
      notes
    )

    // TODO: Send notification emails
    // 1. To candidate about the referral
    // 2. To hiring manager if auto_email enabled
    // 3. To chain participants (optional)

    return NextResponse.json({
      message: 'Referral created successfully',
      referral: {
        id: referral.id,
        jobId: referral.jobId,
        candidateEmail: referral.candidateEmail,
        chainPath: referral.chainPath,
        chainDepth: referral.chainDepth,
        howYouKnow: referral.howYouKnow,
        confidenceLevel: referral.confidenceLevel,
        notes: referral.notes,
        status: referral.status,
        createdAt: referral.createdAt,
        job: referral.job,
        candidate: referral.candidate,
        referrerNode: referral.referrerNode
      }
    })

  } catch (error: any) {
    console.error('Create referral error:', error)

    // Handle specific error cases
    if (error.message === 'Cannot refer yourself') {
      return NextResponse.json({
        error: 'Cannot refer yourself'
      }, { status: 400 })
    }

    if (error.message === 'Job not found') {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 })
    }

    // Handle duplicate referral
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'This candidate has already been referred for this job'
      }, { status: 409 })
    }

    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}