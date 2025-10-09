import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// API to create invite tokens for your initial 100 nodes
export async function POST(request: NextRequest) {
  try {
    const { users } = await request.json()

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({
        error: 'Users array is required'
      }, { status: 400 })
    }

    const createdUsers = []

    for (const userData of users) {
      const { email, firstName, lastName, phone, location, linkedinUrl } = userData

      if (!email) {
        continue // Skip users without email
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        continue // Skip existing users
      }

      // Create user with invite token
      const user = await prisma.user.create({
        data: {
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          location: location || null,
          linkedinUrl: linkedinUrl || null,
          inviteToken: `invite_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          invitedAt: new Date(),
        }
      })

      createdUsers.push({
        id: user.id,
        email: user.email,
        inviteToken: user.inviteToken,
        inviteUrl: `${process.env.NEXTAUTH_URL}/auth/signin?token=${user.inviteToken}`
      })
    }

    return NextResponse.json({
      message: `Created ${createdUsers.length} invite tokens`,
      users: createdUsers
    })

  } catch (error) {
    console.error('Batch invite creation error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}