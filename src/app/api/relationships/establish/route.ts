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
      // User already exists in system - create pending relationship and allocate trust
      const relationship = await prisma.$transaction(async (tx) => {
        // Create relationship with trust allocation
        const rel = await tx.relationship.create({
          data: {
            user1Id: currentUser.id,
            user2Id: targetUser.id,
            user1TrustAllocated: trustAllocation,
            user2TrustAllocated: 0, // Will be set when they respond
            // Legacy fields for compatibility
            user1TrustScore: Math.round(trustAllocation / 10), // Convert 0-100 to 1-10 scale
            user2TrustScore: 0,
            status: 'PENDING'
          }
        })

        // Update user's trust allocation
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            allocatedTrust: { increment: trustAllocation },
            availableTrust: { decrement: trustAllocation }
          }
        })

        return rel
      })

      // VALIDATION EMAIL (for existing users)
      // Send email asking them to accept/decline the relationship
      // NOTE: Trust score is NOT disclosed for privacy
      const resend = getResend()
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject: `${senderName} invites you to be part of their trusted circle on Clout`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Relationship Validation Request</h2>
            <p>${session.user.email} wants to add you to their trusted professional network on Clout Careers.</p>
            <p>Building trusted professional connections helps create better opportunities for everyone.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/api/auth/signin/email?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent('/relationships/validate/' + relationship.id)}"
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Validate Relationship
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This will allow you to confirm the professional relationship.
            </p>
          </div>
        `,
      })

      return NextResponse.json({
        message: 'Validation request sent to existing user',
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

        // Create pending relationship with trust allocation
        await tx.relationship.create({
          data: {
            user1Id: currentUser.id,
            user2Id: newUser.id,
            user1TrustAllocated: trustAllocation,
            user2TrustAllocated: 0, // Will be set when they join
            // Legacy fields for compatibility
            user1TrustScore: Math.round(trustAllocation / 10),
            user2TrustScore: 0,
            status: 'PENDING'
          }
        })

        // Update sender's trust allocation
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            allocatedTrust: { increment: trustAllocation },
            availableTrust: { decrement: trustAllocation },
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
      const resend = getResend()
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject: `${senderName} invites you to be part of their trusted circle on Clout`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Join Clout Careers</h2>
            <p>${session.user.email} has invited you to join Clout Careers, a professional referral network.</p>
            <p>Join a trusted community where professional connections lead to meaningful opportunities.</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Option 1: Quick Join (Expires in 24 hours)</h3>
              <p>Click below for instant access with a magic link:</p>
              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/api/auth/signin/email?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent('/onboard?invitation=' + result.invitation.id)}"
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Join Now with Magic Link
                </a>
              </div>
              <p style="font-size: 12px; color: #666; margin-top: 10px;">
                ⚡ One-click access, no password needed
              </p>
            </div>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Option 2: Join Anytime</h3>
              <p>Save this link to join whenever you're ready:</p>
              <div style="background: white; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; word-break: break-all;">
                <code>${process.env.NEXTAUTH_URL}/join?invitation=${result.invitation.id}</code>
              </div>
              <p style="font-size: 12px; color: #666; margin-top: 10px;">
                🔒 This link never expires
              </p>
            </div>

            <p style="color: #666; font-size: 14px;">
              Once you join, you'll be able to complete your profile and start building your professional network.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px;">
              Clout Careers - Building Trust-Based Professional Networks
            </p>
          </div>
        `,
      })

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