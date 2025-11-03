/**
 * ADMIN INVITE USERS API
 *
 * Allows admins to send invitation emails to new users
 * Email message: "You're invited to be a member of Vaishnav's trusted network on Clout"
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getResend } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get current user and verify admin status
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isAdmin: true, firstName: true, lastName: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    if (!currentUser.isAdmin) {
      return NextResponse.json({
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Get request data
    const { emails } = await request.json()

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({
        error: 'Emails array is required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter(email => !emailRegex.test(email))

    if (invalidEmails.length > 0) {
      return NextResponse.json({
        error: `Invalid email format: ${invalidEmails.join(', ')}`
      }, { status: 400 })
    }

    const results = []
    const resend = getResend()

    for (const email of emails) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        })

        if (existingUser) {
          results.push({
            email,
            status: 'already_exists',
            message: 'User already exists'
          })
          continue
        }

        // Generate invite token
        const inviteToken = `invite_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/signin?token=${inviteToken}`

        // Create user with invite token
        const newUser = await prisma.user.create({
          data: {
            email,
            inviteToken,
            invitedAt: new Date(),
            isHiringManager: true,
          }
        })

        // Send invitation email
        await resend.emails.send({
          from: 'Clout Careers <hello@cloutcareers.com>',
          to: [email],
          subject: "You're invited to join Vaishnav's trusted network on Clout",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #1f2937; margin-bottom: 10px;">You're invited to Clout</h1>
                <p style="color: #6b7280; font-size: 18px;">Join Vaishnav's trusted professional network</p>
              </div>

              <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin-top: 0;">Personal Invitation</h2>
                <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                  You're invited to be a member of <strong>Vaishnav's trusted network</strong> on Clout.
                </p>
                <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                  Clout is a professional network built on trust and genuine connections. Our community consists of carefully vetted professionals who vouch for each other's skills and character.
                </p>
                <p style="color: #374151; line-height: 1.6;">
                  This is an exclusive invitation - access is by invitation only from trusted members.
                </p>
              </div>

              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${inviteUrl}"
                   style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Join Clout Network
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
                <p>If you have any questions, feel free to reply to this email.</p>
                <p>Welcome to the network!</p>
                <p style="margin-top: 20px;">
                  <strong>The Clout Team</strong><br>
                  Building trust-based professional networks
                </p>
              </div>
            </div>
          `,
          text: `
You're invited to be a member of Vaishnav's trusted network on Clout.

Clout is a professional network built on trust and genuine connections. Our community consists of carefully vetted professionals who vouch for each other's skills and character.

This is an exclusive invitation - access is by invitation only from trusted members.

Join here: ${inviteUrl}

If you have any questions, feel free to reply to this email.

Welcome to the network!

The Clout Team
Building trust-based professional networks
          `
        })

        results.push({
          email,
          status: 'invited',
          message: 'Invitation sent successfully',
          inviteUrl
        })

      } catch (error) {
        console.error(`Failed to invite ${email}:`, error)
        results.push({
          email,
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to send invitation'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${emails.length} invitations`,
      results
    })

  } catch (error) {
    console.error('Admin invite error:', error)
    return NextResponse.json({
      error: 'Failed to send invitations'
    }, { status: 500 })
  }
}