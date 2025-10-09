import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, inviteToken } = await request.json()

    if (!email || !inviteToken) {
      return NextResponse.json({
        valid: false,
        message: 'Email and invite token are required'
      }, { status: 400 })
    }

    // Find user with this invite token
    const invitedUser = await prisma.user.findUnique({
      where: { inviteToken }
    })

    if (!invitedUser) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid invite token'
      }, { status: 400 })
    }

    if (invitedUser.inviteUsed) {
      return NextResponse.json({
        valid: false,
        message: 'This invite has already been used'
      }, { status: 400 })
    }

    // Check if the email matches the invited user's email
    if (invitedUser.email !== email) {
      return NextResponse.json({
        valid: false,
        message: 'This email does not match the invited user'
      }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      message: 'Valid invitation'
    })

  } catch (error) {
    console.error('Invite validation error:', error)
    return NextResponse.json({
      valid: false,
      message: 'Server error'
    }, { status: 500 })
  }
}