/**
 * USER STATISTICS MODULE
 *
 * This module provides user statistics for dashboard display.
 * It fetches trust allocation data and usage metrics.
 *
 * Used by dashboard to show:
 * - Available trust points
 * - Allocated trust points
 * - Total trust points (always 100)
 * - Current user tier (legacy field)
 *
 * Key features:
 * - Real-time trust allocation tracking
 * - Trust-based relationship system
 * - Secure user-specific data access
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Fetch user stats (trust allocation, tier, etc.)
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
    // Get trust allocation data and tier information from database
    // Only select necessary fields for privacy and performance
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        totalTrustPoints: true,    // Total trust points (always 100)
        allocatedTrust: true,      // Trust currently allocated
        availableTrust: true,      // Trust available to allocate
        tier: true                 // User tier (legacy field)
      }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // RESPONSE FORMATTING
    // Return trust allocation stats with fallback values for robustness
    return NextResponse.json({
      totalTrustPoints: user.totalTrustPoints || 100,
      allocatedTrust: user.allocatedTrust || 0,
      availableTrust: user.availableTrust || 100,
      tier: user.tier || 'CONNECTOR'
    })

  } catch (error) {
    console.error('User stats fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}