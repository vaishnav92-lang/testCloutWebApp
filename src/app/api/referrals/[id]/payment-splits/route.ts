/**
 * PAYMENT SPLITS API ENDPOINT
 *
 * GET /api/referrals/:referralId/payment-splits
 * Calculate payment splits for a hired referral
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calculatePaymentSplits } from '@/lib/referral-chain'
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

    const referralId = params.id

    // Get referral with job details
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            referralBudget: true,
            company: { select: { name: true } },
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
        error: 'Not authorized to view payment splits for this referral'
      }, { status: 403 })
    }

    // Check if referral is hired
    if (referral.status !== 'HIRED') {
      return NextResponse.json({
        error: 'Payment splits only available for hired referrals'
      }, { status: 400 })
    }

    // Get payment amount from URL params or use default
    const { searchParams } = new URL(request.url)
    const totalAmount = parseInt(searchParams.get('amount') || '') || referral.job.referralBudget || 10000

    // Calculate payment splits
    const splits = await calculatePaymentSplits(totalAmount, referral.chainPath)

    return NextResponse.json({
      referralId: referral.id,
      jobTitle: referral.job.title,
      companyName: referral.job.company.name,
      candidateEmail: referral.candidateEmail,
      chainDepth: referral.chainDepth,
      totalAmount,
      splits
    })

  } catch (error: any) {
    console.error('Get payment splits error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}