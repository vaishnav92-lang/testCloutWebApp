/**
 * USER PROFILE MODULE
 *
 * This module handles fetching user profile data for editing purposes.
 * It provides complete profile information to pre-populate the onboard/edit form.
 *
 * Used when:
 * - User clicks "Edit Profile" from dashboard
 * - Onboard page loads for existing users
 * - Profile completion form needs current data
 *
 * Key features:
 * - Secure profile data access (user can only see their own data)
 * - Complete profile information retrieval
 * - Privacy-focused field selection
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET - Fetch user profile data for editing
export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    // Verify user is logged in before providing profile data
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // FETCH PROFILE DATA
    // Get complete user profile for editing form pre-population
    // Select only necessary fields for security and performance
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,                    // User identifier
        firstName: true,             // User's first name
        lastName: true,              // User's last name
        phone: true,                 // Phone number (optional)
        location: true,              // Geographic location
        linkedinUrl: true,           // LinkedIn profile URL
        userIntent: true,            // Career intentions (legacy field)
        isProfileComplete: true      // Profile completion status
      }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // RETURN PROFILE DATA
    // Send complete profile information for form editing
    return NextResponse.json(user)

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}