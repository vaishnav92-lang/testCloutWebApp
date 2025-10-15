/**
 * TRUST ANALYSIS API
 *
 * Provides detailed breakdown of trust calculations for specific users.
 * Shows all incoming trust sources and how they contribute to total.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || session.user.email !== 'vaishnav@cloutcareers.com') {
      return NextResponse.json({
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Get user email from query params
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email') || 'leandra@cloutcareers.com'

    // FETCH TARGET USER
    const targetUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        relationshipsAsUser1: {
          where: { status: 'CONFIRMED' },
          include: {
            user2: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        relationshipsAsUser2: {
          where: { status: 'CONFIRMED' },
          include: {
            user1: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // CALCULATE INCOMING TRUST FROM RELATIONSHIPS
    const incomingTrustSources = []
    let totalIncomingTrust = 0

    // Trust from relationships where target is User1 (receiving User1TrustAllocated from User2)
    for (const rel of targetUser.relationshipsAsUser1) {
      if (rel.user1TrustAllocated && rel.user1TrustAllocated > 0) {
        const source = {
          fromUser: {
            id: rel.user2.id,
            email: rel.user2.email,
            name: rel.user2.firstName && rel.user2.lastName
              ? `${rel.user2.firstName} ${rel.user2.lastName}`
              : rel.user2.email
          },
          trustAmount: rel.user1TrustAllocated,
          relationshipType: 'AsUser1',
          relationshipId: rel.id
        }
        incomingTrustSources.push(source)
        totalIncomingTrust += rel.user1TrustAllocated
      }
    }

    // Trust from relationships where target is User2 (receiving User2TrustAllocated from User1)
    for (const rel of targetUser.relationshipsAsUser2) {
      if (rel.user2TrustAllocated && rel.user2TrustAllocated > 0) {
        const source = {
          fromUser: {
            id: rel.user1.id,
            email: rel.user1.email,
            name: rel.user1.firstName && rel.user1.lastName
              ? `${rel.user1.firstName} ${rel.user1.lastName}`
              : rel.user1.email
          },
          trustAmount: rel.user2TrustAllocated,
          relationshipType: 'AsUser2',
          relationshipId: rel.id
        }
        incomingTrustSources.push(source)
        totalIncomingTrust += rel.user2TrustAllocated
      }
    }

    // Sort by trust amount descending
    incomingTrustSources.sort((a, b) => b.trustAmount - a.trustAmount)

    const targetUserName = targetUser.firstName && targetUser.lastName
      ? `${targetUser.firstName} ${targetUser.lastName}`
      : targetUser.email

    return NextResponse.json({
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUserName,
        cloutScore: Math.round((targetUser.cloutScore || 0) * 100),
        cloutPercentile: targetUser.cloutPercentile || 0,
        availableTrust: targetUser.availableTrust || 100,
        allocatedTrust: targetUser.allocatedTrust || 0
      },
      trustAnalysis: {
        totalIncomingTrust,
        incomingTrustCount: incomingTrustSources.length,
        averageIncomingTrust: incomingTrustSources.length > 0
          ? totalIncomingTrust / incomingTrustSources.length
          : 0,
        sources: incomingTrustSources
      },
      breakdown: {
        adminAssignedClout: Math.round((targetUser.cloutScore || 0) * 100),
        relationshipTrustReceived: totalIncomingTrust,
        totalRelationships: targetUser.relationshipsAsUser1.length + targetUser.relationshipsAsUser2.length
      }
    })

  } catch (error) {
    console.error('Trust analysis error:', error)
    return NextResponse.json({
      error: 'Failed to analyze trust'
    }, { status: 500 })
  }
}