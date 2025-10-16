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
      return NextResponse.json({
        error: 'Contact not found in your trusted network'
      }, { status: 400 })
    }

    const referredUser = relationship.user1Id === currentUser.id ? relationship.user2 : relationship.user1

    // CREATE REFERRAL RECORD
    // Note: You'll need to create a Referral model in your schema
    // For now, we'll create a placeholder job application with referral context

    // CHECK IF ALREADY REFERRED
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: referredUser.id,
          jobId: jobId
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json({
        error: 'This person has already been referred for this job'
      }, { status: 400 })
    }

    // CREATE JOB APPLICATION WITH REFERRAL CONTEXT
    const application = await prisma.jobApplication.create({
      data: {
        userId: referredUser.id,
        jobId: jobId,
        status: 'APPLIED'
      }
    })

    // TODO: Send notification emails to:
    // 1. The referred person (about the opportunity)
    // 2. The hiring manager (about the referral)
    // 3. Optional: Confirmation to the referrer

    return NextResponse.json({
      message: 'Referral submitted successfully',
      applicationId: application.id
    })

  } catch (error) {
    console.error('Trusted referral error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}