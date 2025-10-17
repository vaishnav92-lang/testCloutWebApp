/**
 * JOB LINKING API FOR ENDORSEMENTS
 *
 * This endpoint handles linking existing endorsements to jobs or creating
 * new endorsements with job context when dragging trusted contacts to jobs.
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
    const { jobId, endorsedUserEmail } = body

    if (!jobId || !endorsedUserEmail) {
      return NextResponse.json({
        error: 'Missing required fields: jobId and endorsedUserEmail'
      }, { status: 400 })
    }

    // VERIFY JOB EXISTS
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, company: { select: { name: true } } }
    })

    if (!job) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 })
    }

    // CHECK IF ENDORSEMENT ALREADY EXISTS
    const existingEndorsement = await prisma.endorsement.findFirst({
      where: {
        endorserId: currentUser.id,
        endorsedUserEmail: endorsedUserEmail
      }
    })

    if (existingEndorsement) {
      // UPDATE EXISTING ENDORSEMENT WITH JOB CONTEXT
      const updatedEndorsement = await prisma.endorsement.update({
        where: { id: existingEndorsement.id },
        data: {
          jobId: jobId,
          isJobReferral: true,
          // Update status if it was just a general endorsement
          status: existingEndorsement.status === 'ACTIVE' ? 'PENDING_CANDIDATE_ACTION' : existingEndorsement.status
        }
      })

      return NextResponse.json({
        message: `Successfully linked existing endorsement to ${job.title} at ${job.company.name}`,
        endorsementId: updatedEndorsement.id,
        action: 'linked'
      })
    }

    // NO EXISTING ENDORSEMENT - RETURN FLAG TO SHOW FORM
    return NextResponse.json({
      message: 'No existing endorsement found. Please create a new endorsement.',
      action: 'create_new',
      jobContext: {
        id: job.id,
        title: job.title,
        companyName: job.company.name
      }
    })

  } catch (error) {
    console.error('Job linking error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}