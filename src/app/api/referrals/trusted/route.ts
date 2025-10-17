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

    // VERIFY CONTACT EXISTS AND IS IN TRUSTED NETWORK
    console.log('Looking for relationship with contactId:', contactId, 'and currentUserId:', currentUser.id)

    const relationship = await prisma.relationship.findFirst({
      where: {
        OR: [
          { user1Id: currentUser.id, user2Id: contactId },
          { user1Id: contactId, user2Id: currentUser.id }
        ],
        status: 'CONFIRMED'
      },
      include: {
        user1: true,
        user2: true
      }
    })

    if (!relationship) {
      console.log('No confirmed relationship found between', currentUser.id, 'and', contactId)
      return NextResponse.json({
        error: 'Contact not found in your trusted network'
      }, { status: 400 })
    }

    const referredUser = relationship.user1Id === currentUser.id ? relationship.user2 : relationship.user1
    console.log('Found referred user:', referredUser.id, referredUser.email)

    // CREATE REFERRAL RECORD AS AN ENDORSEMENT WITH JOB CONTEXT

    // CHECK IF ALREADY REFERRED
    const existingEndorsement = await prisma.endorsement.findFirst({
      where: {
        endorserId: currentUser.id,
        endorsedUserId: referredUser.id,
        jobId: jobId
      }
    })

    if (existingEndorsement) {
      return NextResponse.json({
        error: 'You have already referred this person for this job'
      }, { status: 400 })
    }

    // CREATE ENDORSEMENT FOR THE JOB REFERRAL
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

    // TODO: Send notification emails to:
    // 1. The referred person (about the opportunity)
    // 2. The hiring manager (about the referral)
    // 3. Optional: Confirmation to the referrer

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