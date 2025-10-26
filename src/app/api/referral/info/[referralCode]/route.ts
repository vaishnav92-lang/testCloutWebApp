import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ referralCode: string }> }
) {
  try {
    const { referralCode: invitationId } = await params

    // Find the invitation first
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            bio: true,
            location: true,
            _count: {
              select: { referrals: true }
            }
          }
        }
      }
    })

    if (!invitation || invitation.status !== 'PENDING') {
      return NextResponse.json({
        referrer: null,
        error: 'Invalid or expired referral link'
      }, { status: 404 })
    }

    const referrer = invitation.sender

    if (!referrer) {
      return NextResponse.json({
        referrer: null,
        error: 'Referrer not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      referrer: {
        ...referrer,
        referralCount: referrer._count.referrals
      }
    })

  } catch (error) {
    console.error('Referral info error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}