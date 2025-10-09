/**
 * USER STATISTICS MODULE
 *
 * This module provides user statistics for dashboard display.
 * It fetches invite counts, tier information, and usage metrics.
 *
 * Used by dashboard to show:
 * - Available invites remaining
 * - Total invites used
 * - Current user tier (CONNECTOR, TALENT_SCOUT, NETWORK_HUB)
 *
 * Key features:
 * - Real-time invite count tracking
 * - Tier-based invite limits (future enhancement)
 * - Secure user-specific data access
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Fetch user stats (invites, tier, etc.)
export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    // Verify user is logged in before providing personal statistics
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // FETCH USER STATISTICS
    // Get invite counts and tier information from database
    // Only select necessary fields for privacy and performance
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        availableInvites: true,    // Invites remaining to send
        totalInvitesUsed: true,    // Total invites consumed
        tier: true                 // User tier (affects invite limits)
      }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // RESPONSE FORMATTING
    // Return stats with fallback values for robustness
    return NextResponse.json({
      availableInvites: user.availableInvites || 0,
      totalInvitesUsed: user.totalInvitesUsed || 0,
      tier: user.tier || 'CONNECTOR'
    })

  } catch (error) {
    console.error('User stats fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}