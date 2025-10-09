import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Create a test user
    const user = await prisma.user.create({
      data: {
        email,
        inviteToken: `test_${Date.now()}`,
        invitedAt: new Date(),
      }
    })

    return NextResponse.json({
      message: 'Test user created successfully',
      user: {
        id: user.id,
        email: user.email,
        inviteToken: user.inviteToken,
        referralCode: user.referralCode
      }
    })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}