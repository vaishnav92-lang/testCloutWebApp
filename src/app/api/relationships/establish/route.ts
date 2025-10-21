/**
 * RELATIONSHIP ESTABLISHMENT MODULE
 *
 * This module handles creating professional relationships between users.
 * It supports two flows:
 * 1. NEW USER: Creates user account + sends invitation email
 * 2. EXISTING USER: Creates pending relationship + sends validation email
 *
 * Key features:
 * - Transaction-wrapped user creation for data consistency
 * - Privacy-protected emails (no trust score disclosure)
 * - Personalized email subjects with sender names
 * - Invite limit enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getResend } from '@/lib/resend'
import { sendInvitationEmail, sendNetworkInvitationEmail } from '@/lib/email-service'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    // Ensure user is logged in before allowing relationship creation
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }


    // INPUT VALIDATION
    // Extract and validate required fields from request
    const { email, trustAllocation } = await request.json()

    if (!email || trustAllocation === undefined || trustAllocation < 0 || trustAllocation > 100) {
      return NextResponse.json({
        error: 'Email and trust allocation (0-100 points) are required'
      }, { status: 400 })
    }

    // FETCH CURRENT USER DATA
    // Get sender's info including trust allocation and name for personalized emails
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        availableTrust: true,
        totalTrustPoints: true,
        allocatedTrust: true,
        // Legacy fields for compatibility
        availableInvites: true,
        tier: true,
        firstName: true,
        lastName: true
      }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // PERSONALIZATION
    // Create sender name for email subject line
    // Falls back to 'Someone' if name fields are empty
    const senderName = `${currentUser.firstName || 'Someone'} ${currentUser.lastName || ''}`.trim()

    // FLOW DETERMINATION
    // Check if target user already exists to determine which flow to use
    const targetUser = await prisma.user.findUnique({
      where: { email: email }
    })

    // TRUST ALLOCATION CHECK
    // Ensure user has enough available trust points
    if (currentUser.availableTrust < trustAllocation) {
      return NextResponse.json({
        error: `Insufficient trust points. Available: ${currentUser.availableTrust}, Requested: ${trustAllocation}`
      }, { status: 400 })
    }

    // DUPLICATE CHECK (only for existing users)
    // Prevent creating duplicate relationships (bidirectional check)
    if (targetUser) {
      const existingRelationship = await prisma.relationship.findFirst({
        where: {
          OR: [
            { user1Id: currentUser.id, user2Id: targetUser.id },
            { user2Id: currentUser.id, user1Id: targetUser.id }
          ]
        }
      })

      if (existingRelationship) {
        return NextResponse.json({
          error: 'Relationship already exists'
        }, { status: 400 })
      }
    }

    // FLOW 1: EXISTING USER PATH
    if (targetUser) {
      // User already exists in system - create CONFIRMED relationship with immediate trust allocation
      const relationship = await prisma.$transaction(async (tx) => {
        // Create relationship WITH immediate trust allocation (unidirectional)
        const rel = await tx.relationship.create({
          data: {
            user1Id: currentUser.id,
            user2Id: targetUser.id,
            user1TrustAllocated: trustAllocation, // Allocate trust immediately
            user2TrustAllocated: 0, // Other user starts with 0 (they can add back if they want)
            // Legacy fields for compatibility
            user1TrustScore: Math.round(trustAllocation / 10), // Convert to legacy scale
            user2TrustScore: 0,
            status: 'CONFIRMED' // Immediately confirmed (no consent needed)
          }
        })

        // Update user's trust allocation immediately
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            availableTrust: currentUser.availableTrust - trustAllocation,
            allocatedTrust: currentUser.allocatedTrust + trustAllocation
          }
        })

        return rel
      })

      // VALIDATION EMAIL (for existing users)
      // Send email notifying them they've been added to a trusted network
      // PRIVACY: Never reveal trust scores in emails!
      try {
        await sendNetworkInvitationEmail({
          recipientEmail: email,
          senderName: senderName
          // NEVER pass trustPoints - this violates privacy!
        })
      } catch (emailError) {
        console.error('Failed to send network invitation email:', emailError)
        // Don't fail the whole operation if email fails
      }

      // Trigger trust score recomputation since relationship is immediately confirmed
      const { computeEigenTrust } = await import('@/lib/eigentrust-new')
      computeEigenTrust(
        0.15,        // decayFactor
        100,         // maxIterations
        0.000001,    // convergenceThreshold
        "relationship_establish" // triggeredBy
      ).catch(error => {
        console.error('Background trust computation failed:', error)
      })

      return NextResponse.json({
        message: `Successfully added ${targetUser.email} to your trusted network with ${trustAllocation} trust points`,
        relationshipId: relationship.id
      })

    } else {
      // DUPLICATE CHECK FOR NEW USERS
      // Check if we've already invited this email
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          email: email,
          senderId: currentUser.id,
          status: 'PENDING'
        }
      })

      if (existingInvitation) {
        return NextResponse.json({
          error: 'Invitation already sent to this email address'
        }, { status: 400 })
      }

      // User doesn't exist - wrap everything in a transaction for atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Create invitation with trust allocation
        const invitation = await tx.invitation.create({
          data: {
            email: email,
            trustScore: Math.round(trustAllocation / 10), // Convert to legacy scale for compatibility
            senderId: currentUser.id,
            status: 'PENDING'
          }
        })

        // Create user account (unverified) to enable magic link
        const newUser = await tx.user.create({
          data: {
            email: email,
            inviteToken: invitation.id,
            referredById: currentUser.id
          }
        })

        // Create CONFIRMED relationship WITH immediate trust allocation
        await tx.relationship.create({
          data: {
            user1Id: currentUser.id,
            user2Id: newUser.id,
            user1TrustAllocated: trustAllocation, // Allocate trust immediately
            user2TrustAllocated: 0, // New user starts with 0
            // Legacy fields for compatibility
            user1TrustScore: Math.round(trustAllocation / 10), // Convert to legacy scale
            user2TrustScore: 0,
            status: 'CONFIRMED' // Immediately confirmed
          }
        })

        // Update sender's trust allocation AND legacy invite tracking
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            // Update trust allocation immediately
            availableTrust: currentUser.availableTrust - trustAllocation,
            allocatedTrust: currentUser.allocatedTrust + trustAllocation,
            // Legacy fields for compatibility
            availableInvites: { decrement: 1 },
            totalInvitesUsed: { increment: 1 }
          }
        })

        // Update invitation with receiver ID
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { receiverId: newUser.id }
        })

        return { invitation, newUser }
      })

      // Send invitation email (outside transaction to avoid long-running operations)
      try {
        await sendInvitationEmail({
          recipientEmail: email,
          senderName: senderName,
          inviteCode: result.invitation.id
        })
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
        // Don't fail the whole operation if email fails
      }

      // Note: No trust computation needed since pending relationships don't affect trust scores

      return NextResponse.json({
        message: 'Invitation sent successfully',
        invitationId: result.invitation.id
      })
    }

  } catch (error) {
    console.error('Relationship establishment error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}