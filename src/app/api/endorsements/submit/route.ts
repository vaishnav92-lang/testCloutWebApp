/**
 * ENDORSEMENT SUBMISSION MODULE
 *
 * This module handles direct endorsement submissions from our frontend form.
 * It processes the endorsement data and triggers candidate notifications.
 *
 * Submission Flow:
 * 1. Frontend form sends POST request with endorsement data
 * 2. Validate required fields and endorser authentication
 * 3. Create Endorsement record with PENDING_CANDIDATE_ACTION status
 * 4. Send email notification to endorsed candidate
 * 5. Return confirmation to frontend
 *
 * Key features:
 * - Direct form submission (no external dependencies)
 * - Comprehensive validation
 * - Structured endorsement content
 * - Automatic candidate notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'
import { authOptions } from '@/lib/auth'

// POST - Submit endorsement from frontend form
export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // PARSE FORM DATA
    const {
      endorsedEmail,
      endorsedName,
      relationship,
      workTogether,
      strengths,
      rolesValueAdd,
      workOutput,
      hoursInteraction,
      complementaryPartner,
      recommendation,
      endorserEmail,
      endorserName
    } = await request.json()

    // VALIDATION
    if (!endorsedEmail || !endorsedName || !relationship || !workTogether ||
        !strengths || !rolesValueAdd || !workOutput || !hoursInteraction ||
        !complementaryPartner || !recommendation) {
      return NextResponse.json({
        error: 'All fields are required'
      }, { status: 400 })
    }

    // Verify endorser matches session
    if (endorserEmail !== session.user.email) {
      return NextResponse.json({
        error: 'Endorser email mismatch'
      }, { status: 403 })
    }

    // FIND ENDORSER USER
    const endorser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, firstName: true, lastName: true }
    })

    if (!endorser) {
      return NextResponse.json({
        error: 'Endorser not found in system'
      }, { status: 400 })
    }

    // CHECK FOR EXISTING ENDORSEMENT
    const existingEndorsement = await prisma.endorsement.findUnique({
      where: {
        endorserId_endorsedUserEmail: {
          endorserId: endorser.id,
          endorsedUserEmail: endorsedEmail
        }
      }
    })

    if (existingEndorsement) {
      return NextResponse.json({
        error: 'You have already endorsed this person'
      }, { status: 400 })
    }

    // FIND ENDORSED USER (IF THEY'RE ON PLATFORM)
    const endorsedUser = await prisma.user.findUnique({
      where: { email: endorsedEmail },
      select: { id: true, firstName: true, lastName: true }
    })

    // BUILD COMPREHENSIVE ENDORSEMENT CONTENT
    const endorsementContent = `
ENDORSER: ${endorserName} (${endorserEmail})
ENDORSED: ${endorsedName} (${endorsedEmail})

RELATIONSHIP:
${relationship}

WORK EXPERIENCE:
${workTogether}

KEY STRENGTHS:
${strengths}

ROLES THEY'D ADD VALUE IN:
${rolesValueAdd}

WORK OUTPUT OBSERVED:
${workOutput}

HOURS OF INTERACTION:
${hoursInteraction}

COMPLEMENTARY PARTNER TYPE:
${complementaryPartner}

RECOMMENDATION:
${recommendation}
    `.trim()

    // CREATE ENDORSEMENT RECORD
    const endorsement = await prisma.endorsement.create({
      data: {
        endorserId: endorser.id,
        endorsedUserId: endorsedUser?.id || null,
        endorsedUserEmail: endorsedEmail,
        endorsementContent: endorsementContent,
        videoUrl: null,
        status: 'PENDING_CANDIDATE_ACTION',
        candidateNotifiedAt: new Date()
      }
    })

    // CREATE PLATFORM INVITATION FOR NON-USERS
    let invitationCreated = false
    if (!endorsedUser) {
      try {
        // Check if invitation already exists
        const existingInvitation = await prisma.invitation.findUnique({
          where: {
            senderId_email: {
              senderId: endorser.id,
              email: endorsedEmail
            }
          }
        })

        if (!existingInvitation) {
          // Create platform invitation
          await prisma.invitation.create({
            data: {
              email: endorsedEmail,
              trustScore: 8, // High trust score for endorsed candidates
              senderId: endorser.id,
              status: 'PENDING'
            }
          })
          invitationCreated = true
          console.log('Platform invitation created for:', endorsedEmail)
        }
      } catch (inviteError) {
        console.error('Failed to create platform invitation:', inviteError)
        // Don't fail the endorsement if invitation fails
      }
    }

    // SEND EMAIL NOTIFICATION TO CANDIDATE
    const endorserDisplayName = endorserName || `${endorser.firstName || ''} ${endorser.lastName || ''}`.trim() || endorserEmail

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const isNewUser = !endorsedUser

      await resend.emails.send({
        from: 'Clout Careers <noreply@cloutcareers.com>',
        to: endorsedEmail,
        subject: `${endorserDisplayName} listed you as one of the top people they've worked with`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 20px; text-align: center;">
              🌟 ${endorserDisplayName} listed you as one of the top people they've worked with
            </h1>

            ${isNewUser ? `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin: 20px 0; color: white; text-align: center;">
              <h2 style="font-size: 22px; margin: 0 0 15px 0; color: white;">
                You've been fast-tracked to join Clout!
              </h2>
              <p style="font-size: 16px; margin: 0 0 20px 0; color: white; opacity: 0.95;">
                ${endorserDisplayName} wrote a detailed endorsement highlighting your exceptional work.
                Join now to accept it and get matched with top opportunities.
              </p>
              <a href="${process.env.NEXTAUTH_URL}/api/auth/signin/email?email=${encodeURIComponent(endorsedEmail)}&callbackUrl=${encodeURIComponent('/onboard/endorsed?endorsement=' + endorsement.id)}"
                 style="display: inline-block; background-color: white; color: #764ba2; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                🚀 Join Clout with Magic Link (1-Click Access)
              </a>
              <p style="font-size: 13px; margin-top: 15px; color: white; opacity: 0.8;">
                No password needed - instant access with your email
              </p>
            </div>
            ` : `
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin: 0;">
                ${endorserDisplayName} has written a comprehensive endorsement about your professional capabilities.
              </p>
            </div>
            `}

            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; font-size: 18px; margin: 0 0 10px 0;">
                Why this matters:
              </h3>
              <ul style="color: #78350f; font-size: 15px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Trusted endorsements help you stand out to employers</li>
                <li>You control who sees them - complete privacy protection</li>
                <li>Get matched with opportunities that value your specific strengths</li>
                <li>Skip traditional application processes at select companies</li>
              </ul>
            </div>

            <h3 style="color: #1f2937; font-size: 18px; margin: 25px 0 15px 0;">
              You're in control - choose how to use this endorsement:
            </h3>

            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 30px;">
              <div style="padding: 15px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px;">
                <strong style="color: #166534;">🎯 Active Matching:</strong>
                <span style="color: #15803d; font-size: 14px;"> Let Clout proactively match you with perfect opportunities</span>
              </div>
              <div style="padding: 15px; background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px;">
                <strong style="color: #1e3a8a;">🔒 Private Mode:</strong>
                <span style="color: #1e40af; font-size: 14px;"> Keep it private, release to specific employers when you choose</span>
              </div>
              <div style="padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                <strong style="color: #6b7280;">⏸️ Not Now:</strong>
                <span style="color: #6b7280; font-size: 14px;"> Decide later - the endorsement will be waiting for you</span>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              ${isNewUser && invitationCreated ? `
              <a href="${process.env.NEXTAUTH_URL}/api/auth/signin/email?email=${encodeURIComponent(endorsedEmail)}&callbackUrl=${encodeURIComponent('/onboard/endorsed?endorsement=' + endorsement.id)}"
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 36px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                Accept Endorsement & Join Clout
              </a>
              <p style="color: #6b7280; font-size: 13px;">
                Or copy this link to join anytime:<br>
                <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  ${baseUrl}/join/endorsed/${endorsement.id}
                </code>
              </p>
              ` : `
              <a href="${baseUrl}/endorsements/${endorsement.id}/decide"
                 style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                View & Decide on Endorsement
              </a>
              `}
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Questions? Reply to this email and we'll help.<br><br>
              Best,<br>
              The Clout Team
            </p>
          </div>
        `
      })

      console.log('Notification email sent to:', endorsedEmail)
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      // Don't fail the request if email fails - endorsement was created successfully
    }

    // SUCCESS RESPONSE
    return NextResponse.json({
      message: 'Endorsement submitted successfully',
      endorsementId: endorsement.id
    })

  } catch (error) {
    console.error('Endorsement submission error:', error)
    return NextResponse.json({
      error: 'Server error processing endorsement'
    }, { status: 500 })
  }
}