/**
 * DELEGATE REFERRAL API
 *
 * This endpoint handles delegating referral requests to others.
 * Sends job opportunity to someone who might know good candidates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendDelegationEmail } from '@/lib/email-service'
import { forwardJob } from '@/lib/referral-chain'

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
    const { jobId, delegateEmail, delegateName, message } = body

    if (!jobId || !delegateEmail || !delegateName || !message) {
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

    // CHECK IF DELEGATE IS ALREADY ON CLOUT
    const delegateUser = await prisma.user.findUnique({
      where: { email: delegateEmail }
    })

    const isExistingUser = !!delegateUser

    if (!isExistingUser) {
      // User is not on Clout - create invitation
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          email: delegateEmail,
          senderId: currentUser.id
        }
      })

      if (!existingInvitation) {
        await prisma.invitation.create({
          data: {
            email: delegateEmail,
            senderId: currentUser.id,
            trustScore: 10, // Default trust score
            status: 'PENDING'
          }
        })
      }
    } else {
      // User is on platform - record the forward in chain tracking
      try {
        await forwardJob(jobId, currentUser.id, delegateUser.id, message)
      } catch (forwardError: any) {
        // If forward already exists, that's okay - just continue
        if (!forwardError.message?.includes('duplicate')) {
          throw forwardError
        }
      }

      // Check if they're in the network
      const relationship = await prisma.relationship.findFirst({
        where: {
          OR: [
            { user1Id: currentUser.id, user2Id: delegateUser.id },
            { user1Id: delegateUser.id, user2Id: currentUser.id }
          ]
        }
      })

      // If not in network, create a confirmed relationship (unidirectional)
      if (!relationship) {
        await prisma.relationship.create({
          data: {
            user1Id: currentUser.id,
            user2Id: delegateUser.id,
            user1TrustAllocated: 10, // Default minimal trust for delegation
            user2TrustAllocated: 0,  // They haven't reciprocated
            // Legacy fields
            user1TrustScore: 1,
            user2TrustScore: 0,
            status: 'CONFIRMED' // Immediately confirmed (unidirectional)
          }
        })

        // Update user's trust allocation
        await prisma.user.update({
          where: { id: currentUser.id },
          data: {
            availableTrust: { decrement: 10 },
            allocatedTrust: { increment: 10 }
          }
        })
      }
    }

    // Send delegation email with appropriate content
    try {
      await sendDelegationEmail({
        recipientEmail: delegateEmail,
        recipientName: delegateName,
        delegatorName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email,
        jobTitle: job.title,
        companyName: job.company.name,
        message: message,
        jobId: jobId,
        isExistingUser: isExistingUser
      })
    } catch (emailError) {
      console.error('Failed to send delegation email:', emailError)
      // Don't fail the whole operation if email fails
    }

    return NextResponse.json({
      message: 'Referral delegation sent successfully'
    })

  } catch (error) {
    console.error('Delegate referral error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}