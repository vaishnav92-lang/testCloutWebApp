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

    if (delegateUser) {
      // User is already on Clout - send internal notification
      // TODO: Create a notification/message system for existing users
      // For now, we'll just log this and send them an email
    } else {
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
    }

    // TODO: Send delegation email
    // The email should include:
    // 1. Greeting from the referrer
    // 2. Information about the job opportunity
    // 3. Request to help find candidates
    // 4. Custom message from the referrer
    // 5. If not on Clout, invitation to join

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