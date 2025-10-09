import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, referralCode } = await request.json()

    if (!email || !referralCode) {
      return NextResponse.json({
        error: 'Email and referral code are required'
      }, { status: 400 })
    }

    // Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode }
    })

    if (!referrer) {
      return NextResponse.json({
        error: 'Invalid referral code'
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // If user exists but no referrer set, update it
      if (!existingUser.referredById) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { referredById: referrer.id }
        })
      }

      return NextResponse.json({
        message: 'User already exists, referral relationship updated'
      })
    }

    // Create new user with referral relationship
    const newUser = await prisma.user.create({
      data: {
        email,
        referredById: referrer.id,
      }
    })

    return NextResponse.json({
      message: 'Referral request processed successfully',
      userId: newUser.id
    })

  } catch (error) {
    console.error('Referral request error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}