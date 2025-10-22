/**
 * REFERRAL STATUS UPDATE API ENDPOINT
 *
 * PATCH /api/referrals/:referralId/status
 * Update referral status (e.g., to 'HIRED')
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateReferralStatus } from '@/lib/referral-chain'
import { prisma } from '@/lib/prisma'

export async function PATCH(
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

    // Parse request body
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({
        error: 'Status is required'
      }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['PENDING', 'SCREENING', 'INTERVIEWING', 'HIRED', 'REJECTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 })
    }

    const referralId = params.id

    // Get referral to check permissions
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        job: {
          include: {
            owner: { select: { email: true } }
          }
        }
      }
    })

    if (!referral) {
      return NextResponse.json({
        error: 'Referral not found'
      }, { status: 404 })
    }

    // Check if user is job owner or admin
    const isOwner = referral.job.owner.email === session.user.email
    const isAdmin = session.user.email === 'vaishnav@cloutcareers.com'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({
        error: 'Not authorized to update this referral'
      }, { status: 403 })
    }

    // Update the referral status
    const updatedReferral = await updateReferralStatus(referralId, status as any)

    // TODO: Send notification emails
    // 1. To candidate about status change
    // 2. To referrer about status change
    // 3. To chain participants if hired

    return NextResponse.json({
      message: 'Referral status updated successfully',
      referral: {
        id: updatedReferral.id,
        status: updatedReferral.status,
        updatedAt: updatedReferral.updatedAt,
        candidateEmail: updatedReferral.candidateEmail,
        chainPath: updatedReferral.chainPath,
        chainDepth: updatedReferral.chainDepth,
        job: updatedReferral.job,
        candidate: updatedReferral.candidate,
        referrerNode: updatedReferral.referrerNode
      }
    })

  } catch (error: any) {
    console.error('Update referral status error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}