/**
 * JOB FORWARD API ENDPOINT
 *
 * POST /api/jobs/:jobId/forward
 * Forward a job to another node in the network
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { forwardJob } from '@/lib/referral-chain'
import { sendDelegationEmail } from '@/lib/email-service'
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
    const { toNodeId, toNodeEmail, message } = body

    if (!toNodeId && !toNodeEmail) {
      return NextResponse.json({
        error: 'Either toNodeId or toNodeEmail is required'
      }, { status: 400 })
    }

    const jobId = params.id

    // If toNodeEmail provided but not toNodeId, look up the user
    let targetNodeId = toNodeId
    if (!targetNodeId && toNodeEmail) {
      const targetUser = await prisma.user.findUnique({
        where: { email: toNodeEmail }
      })
      if (targetUser) {
        targetNodeId = targetUser.id
      }
    }

    if (!targetNodeId) {
      return NextResponse.json({
        error: 'Target user not found'
      }, { status: 404 })
    }

    // Record the forward in the chain tracking system
    const forward = await forwardJob(
      jobId,
      currentUser.id,
      targetNodeId,
      message
    )

    // Get job details for email
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true
      }
    })

    if (!job) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 })
    }

    // Send delegation email
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetNodeId },
        select: { firstName: true, lastName: true, email: true }
      })

      if (targetUser) {
        await sendDelegationEmail({
          recipientEmail: targetUser.email,
          recipientName: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim(),
          delegatorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email,
          jobTitle: job.title,
          companyName: job.company.name,
          message: message || `${currentUser.firstName || 'Someone'} thought you might know good candidates for this role.`,
          jobId: jobId,
          isExistingUser: true
        })
      }
    } catch (emailError) {
      console.error('Failed to send delegation email:', emailError)
      // Don't fail the whole operation if email fails
    }

    return NextResponse.json({
      message: 'Job forwarded successfully',
      forward: {
        id: forward.id,
        jobId: forward.jobId,
        fromNode: forward.fromNode,
        toNode: forward.toNode,
        message: forward.message,
        createdAt: forward.createdAt
      }
    })

  } catch (error: any) {
    console.error('Forward job error:', error)

    // Handle specific error cases
    if (error.message === 'Cannot forward job to yourself') {
      return NextResponse.json({
        error: 'Cannot forward job to yourself'
      }, { status: 400 })
    }

    if (error.message === 'Job not found') {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}