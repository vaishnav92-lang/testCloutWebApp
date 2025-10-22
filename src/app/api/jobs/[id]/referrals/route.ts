/**
 * JOB REFERRALS API ENDPOINT
 *
 * GET /api/jobs/:jobId/referrals
 * Get all referrals for a job with chain details
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getReferralsForJob } from '@/lib/referral-chain'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    const jobId = params.id

    // Verify job exists and user has access
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        owner: { select: { email: true } }
      }
    })

    if (!job) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 })
    }

    // Check if user is job owner or admin
    const isOwner = job.owner.email === session.user.email
    const isAdmin = session.user.email === 'vaishnav@cloutcareers.com'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({
        error: 'Not authorized to view referrals for this job'
      }, { status: 403 })
    }

    // Get referrals with chain details
    const referrals = await getReferralsForJob(jobId)

    return NextResponse.json({
      referrals: referrals.map(referral => ({
        id: referral.id,
        candidateEmail: referral.candidateEmail,
        howYouKnow: referral.howYouKnow,
        confidenceLevel: referral.confidenceLevel,
        notes: referral.notes,
        status: referral.status,
        chainDepth: referral.chainDepth,
        createdAt: referral.createdAt,
        updatedAt: referral.updatedAt,
        candidate: referral.candidate,
        referrerNode: referral.referrerNode,
        chain: referral.chain
      }))
    })

  } catch (error: any) {
    console.error('Get referrals error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}