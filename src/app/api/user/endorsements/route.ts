/**
 * USER ENDORSEMENTS MODULE
 *
 * This module provides endorsements given by the current user.
 * It fetches endorsements created by the user for dashboard display.
 *
 * Used by dashboard to show:
 * - List of people the user has endorsed
 * - Status of each endorsement (pending, private, active, not using)
 * - Basic candidate information (name/email, creation date)
 *
 * Key features:
 * - Secure user-specific data access
 * - Includes related user data when candidate has joined platform
 * - Privacy-focused (doesn't expose endorsement content)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Fetch endorsements given by current user
export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    // Verify user is logged in before providing endorsement data
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // FIND CURRENT USER
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // FETCH ENDORSEMENTS GIVEN BY USER
    // Get all endorsements where current user is the endorser
    // Include endorsed user info if they've joined the platform
    const endorsements = await prisma.endorsement.findMany({
      where: { endorserId: currentUser.id },
      include: {
        endorsedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // RESPONSE FORMATTING
    // Return endorsements with safe data (no endorsement content)
    return NextResponse.json(endorsements)

  } catch (error) {
    console.error('User endorsements fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}