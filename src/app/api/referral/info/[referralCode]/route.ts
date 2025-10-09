import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { referralCode: string } }
) {
  try {
    const { referralCode } = params

    const referrer = await prisma.user.findUnique({
      where: { referralCode },
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
    })

    if (!referrer) {
      return NextResponse.json({
        referrer: null,
        error: 'Invalid referral code'
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