/**
 * API ENDPOINT: Check if email exists in system
 *
 * This endpoint checks if a given email address belongs to an existing user
 * and returns user details if found. Used by the referral form to detect
 * when manually entered emails correspond to existing users.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get email to check
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        bio: true
      }
    })

    if (!existingUser) {
      return NextResponse.json({
        exists: false
      })
    }

    // Check if this user is already in the requester's trusted network
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'Current user not found'
      }, { status: 404 })
    }

    // Check for existing relationship
    const existingRelationship = await prisma.relationship.findFirst({
      where: {
        OR: [
          {
            user1Id: currentUser.id,
            user2Id: existingUser.id
          },
          {
            user1Id: existingUser.id,
            user2Id: currentUser.id
          }
        ]
      },
      select: {
        id: true,
        status: true
      }
    })

    return NextResponse.json({
      exists: true,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        profileImage: existingUser.profileImage,
        bio: existingUser.bio
      },
      relationship: existingRelationship ? {
        exists: true,
        status: existingRelationship.status
      } : {
        exists: false
      }
    })

  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({
      error: 'Failed to check email'
    }, { status: 500 })
  }
}