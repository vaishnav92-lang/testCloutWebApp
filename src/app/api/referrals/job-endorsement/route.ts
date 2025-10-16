/**
 * JOB REFERRAL WITH ENDORSEMENT API
 *
 * This endpoint handles job-specific referrals using the same
 * comprehensive endorsement form structure as regular endorsements.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
      select: { id: true, firstName: true, lastName: true, email: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // PARSE REQUEST BODY
    const body = await request.json()
    const {
      jobId,
      candidateEmail,
      candidateName,
      relationship,
      workTogether,
      strengths,
      rolesValueAdd,
      workOutput,
      hoursInteraction,
      complementaryPartner,
      recommendation,
      referrerEmail,
      referrerName
    } = body

    // VALIDATE REQUIRED FIELDS
    if (!jobId || !candidateEmail || !candidateName || !relationship ||
        !workTogether || !strengths || !rolesValueAdd || !workOutput ||
        !hoursInteraction || !complementaryPartner) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // VERIFY JOB EXISTS
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        owner: true
      }
    })

    if (!job) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 })
    }

    // CHECK IF CANDIDATE ALREADY EXISTS
    const existingUser = await prisma.user.findUnique({
      where: { email: candidateEmail }
    })

    let candidateUserId = null
    if (existingUser) {
      candidateUserId = existingUser.id
    } else {
      // CREATE INVITATION FOR NEW CANDIDATE
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          email: candidateEmail,
          senderId: currentUser.id
        }
      })

      if (!existingInvitation) {
        await prisma.invitation.create({
          data: {
            email: candidateEmail,
            senderId: currentUser.id,
            trustScore: 10, // Default trust score for referrals
            status: 'PENDING'
          }
        })
      }
    }

    // CREATE ENDORSEMENT RECORD WITH JOB CONTEXT
    const endorsement = await prisma.endorsement.create({
      data: {
        endorsedUserEmail: candidateEmail,
        endorsedUserId: candidateUserId,
        endorserId: currentUser.id,
        relationship,
        workTogether,
        strengths,
        rolesValueAdd,
        workOutput,
        hoursInteraction,
        complementaryPartner,
        recommendation,
        status: 'PENDING_CANDIDATE_ACTION',
        // Job-specific fields
        jobId: jobId,
        isJobReferral: true
      }
    })

    // TODO: Send notification email to candidate
    // The email should include:
    // 1. Information about the job opportunity
    // 2. Who referred them and why
    // 3. Option to join Clout if not already a member
    // 4. Link to view the job and endorsement details

    // TODO: Send notification to hiring manager
    // The hiring manager should be notified about the new referral
    // with the endorsement details

    return NextResponse.json({
      message: 'Job referral with endorsement submitted successfully',
      endorsementId: endorsement.id
    })

  } catch (error) {
    console.error('Job referral endorsement error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}