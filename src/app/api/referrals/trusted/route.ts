/**
 * TRUSTED NETWORK REFERRAL API
 *
 * This endpoint handles referrals from a user's trusted network.
 * Creates a referral record and notifies relevant parties.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendJobReferralEmail } from '@/lib/email-service'

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
    const { jobId, contactId, message, referralReason } = body

    if (!jobId || !contactId || !referralReason) {
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

    // GET THE USER BEING REFERRED
    // The UI already filtered the dropdown to show only appropriate contacts
    console.log('Looking up user with contactId:', contactId)

    const referredUser = await prisma.user.findUnique({
      where: { id: contactId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    })

    if (!referredUser) {
      console.log('User not found with contactId:', contactId)
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    console.log('Found referred user:', referredUser.id, referredUser.email)

    // CREATE REFERRAL RECORD AS AN ENDORSEMENT WITH JOB CONTEXT

    // CHECK IF ALREADY ENDORSED (global check due to unique constraint)
    const existingEndorsement = await prisma.endorsement.findFirst({
      where: {
        endorserId: currentUser.id,
        endorsedUserEmail: referredUser.email
      }
    })

    if (existingEndorsement) {
      return NextResponse.json({
        error: 'You have already endorsed this person. You can only endorse someone once.'
      }, { status: 400 })
    }

    // CREATE ENDORSEMENT FOR THE JOB REFERRAL
    console.log('Creating endorsement with data:', {
      endorserId: currentUser.id,
      endorsedUserId: referredUser.id,
      endorsedUserEmail: referredUser.email,
      jobId: jobId,
      isJobReferral: true,
      recommendation: referralReason,
      status: 'PENDING_CANDIDATE_ACTION'
    })

    const endorsement = await prisma.endorsement.create({
      data: {
        endorserId: currentUser.id,
        endorsedUserId: referredUser.id,
        endorsedUserEmail: referredUser.email,
        jobId: jobId,
        isJobReferral: true,
        // Use referralReason as the recommendation
        recommendation: referralReason,
        // Store additional message if provided
        endorsementContent: message || `Referred for ${job.title} position at ${job.company.name}`,
        status: 'PENDING_CANDIDATE_ACTION',
        createdAt: new Date()
      }
    })

    console.log('Endorsement created successfully:', endorsement.id)

    // Send notification email to the referred person
    try {
      await sendJobReferralEmail({
        recipientEmail: referredUser.email,
        recipientName: `${referredUser.firstName} ${referredUser.lastName}`.trim() || referredUser.email,
        referrerName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email,
        jobTitle: job.title,
        companyName: job.company.name,
        referralReason: referralReason,
        personalMessage: message
      })
    } catch (emailError) {
      console.error('Failed to send job referral email:', emailError)
    }

    // TODO: Send notification to hiring manager (requires additional setup)

    return NextResponse.json({
      message: 'Referral submitted successfully',
      endorsementId: endorsement.id
    })

  } catch (error) {
    console.error('Trusted referral error - Full details:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    if (error instanceof Error && 'code' in error) {
      console.error('Prisma error code:', (error as any).code)
    }
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}