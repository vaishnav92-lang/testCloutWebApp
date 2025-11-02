/**
 * NEW PERSON REFERRAL API
 *
 * This endpoint handles referrals for people not yet on the platform.
 * Creates an invitation and referral context.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendInvitationEmail, sendJobReferralEmail } from '@/lib/email-service'

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
      message,
      referralReason,
      existingUserId,
      addedToNetwork
    } = body

    if (!jobId || !candidateEmail || !candidateName || !referralReason) {
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

    // CHECK IF USER ALREADY EXISTS (if not provided in request)
    let candidateUserId = existingUserId
    if (!candidateUserId) {
      const existingUser = await prisma.user.findUnique({
        where: { email: candidateEmail }
      })

      if (existingUser) {
        // User exists but wasn't detected on frontend
        candidateUserId = existingUser.id
      }
    }

    // If user exists in the system, create a proper job referral endorsement
    if (candidateUserId) {
      // CHECK IF ALREADY ENDORSED (global check due to unique constraint)
      const existingEndorsement = await prisma.endorsement.findFirst({
        where: {
          endorserId: currentUser.id,
          endorsedUserEmail: candidateEmail
        }
      })

      if (existingEndorsement) {
        return NextResponse.json({
          error: 'You have already endorsed this person. You can only endorse someone once.'
        }, { status: 400 })
      }

      // Create endorsement for existing user (with job context)
      const endorsement = await prisma.endorsement.create({
        data: {
          endorserId: currentUser.id,
          endorsedUserId: candidateUserId,
          endorsedUserEmail: candidateEmail,
          jobId,
          // Use referralReason as the recommendation
          recommendation: referralReason,
          // Store additional message if provided
          endorsementContent: message || `Referred for ${job.title} position`,
          status: 'PENDING_CANDIDATE_ACTION',
          createdAt: new Date()
        }
      })

      // Log if they were added to network
      if (addedToNetwork) {
        console.log(`User ${candidateEmail} was added to ${currentUser.email}'s network during referral`)
      }

      // Send referral email to existing user
      try {
        await sendJobReferralEmail({
          recipientEmail: candidateEmail,
          recipientName: candidateName,
          referrerName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email,
          jobTitle: job.title,
          companyName: job.company.name,
          referralReason: referralReason,
          personalMessage: message,
          jobId: jobId
        })
      } catch (emailError) {
        console.error('Failed to send job referral email:', emailError)
      }

      return NextResponse.json({
        message: 'Referral submitted successfully',
        endorsementId: endorsement.id,
        userExisted: true,
        addedToNetwork
      })
    }

    // CHECK IF INVITATION ALREADY EXISTS
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: candidateEmail,
        senderId: currentUser.id
      }
    })

    if (existingInvitation) {
      return NextResponse.json({
        error: 'You have already invited this person to Clout'
      }, { status: 400 })
    }

    // CREATE INVITATION
    const invitation = await prisma.invitation.create({
      data: {
        email: candidateEmail,
        senderId: currentUser.id,
        trustScore: 10, // Default trust score for referrals
        status: 'PENDING'
      }
    })

    // CHECK IF ALREADY ENDORSED (global check due to unique constraint)
    const existingEndorsement = await prisma.endorsement.findFirst({
      where: {
        endorserId: currentUser.id,
        endorsedUserEmail: candidateEmail
      }
    })

    if (existingEndorsement) {
      return NextResponse.json({
        error: 'You have already endorsed this person. You can only endorse someone once.'
      }, { status: 400 })
    }

    // CREATE ENDORSEMENT FOR NON-EXISTING USER
    // This will be linked to them when they join
    const endorsement = await prisma.endorsement.create({
      data: {
        endorserId: currentUser.id,
        endorsedUserEmail: candidateEmail,
        endorsedUserId: null, // Will be linked when user joins
        jobId,
        // Use referralReason as the recommendation
        recommendation: referralReason,
        // Store additional message if provided
        endorsementContent: message || `Referred for ${job.title} position`,
        status: 'PENDING_CANDIDATE_ACTION',
        createdAt: new Date()
      }
    })

    // Send invitation email with job context
    try {
      await sendInvitationEmail({
        recipientEmail: candidateEmail,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email,
        inviteCode: invitation.id
      })

      // Also send job referral email
      await sendJobReferralEmail({
        recipientEmail: candidateEmail,
        recipientName: candidateName,
        referrerName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email,
        jobTitle: job.title,
        companyName: job.company.name,
        referralReason: referralReason,
        personalMessage: message,
        jobId: jobId
      })
    } catch (emailError) {
      console.error('Failed to send invitation/referral emails:', emailError)
    }

    return NextResponse.json({
      message: 'Invitation and referral sent successfully',
      invitationId: invitation.id,
      endorsementId: endorsement.id,
      userExisted: false
    })

  } catch (error) {
    console.error('New person referral error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}