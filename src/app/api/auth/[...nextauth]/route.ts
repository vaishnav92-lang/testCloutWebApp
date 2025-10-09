/**
 * AUTHENTICATION MODULE
 *
 * This module configures NextAuth.js for magic link authentication with invite-only access.
 * Key features:
 * - Magic link login (no passwords)
 * - Invite-only system (rejects non-existing users)
 * - Session enrichment with user data
 * - Email delivery via Resend service
 */

import NextAuth from "next-auth"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

// Initialize Resend email service for magic link delivery
const resend = new Resend(process.env.RESEND_API_KEY)

export const authOptions = {
  // Use Prisma adapter to store sessions/accounts in database
  // This allows for session revocation and better security vs JWT tokens
  adapter: PrismaAdapter(prisma),

  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,

      // Custom email sending function using Resend instead of default
      // This gives us more control over email templates and delivery
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to: email,
            subject: "Sign in to Clout Careers",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4f46e5;">Welcome to Clout Careers</h2>
                <p>Click the button below to sign in to your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Sign In
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                  This link will expire in 24 hours. If you didn't request this email, you can safely ignore it.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="color: #999; font-size: 12px;">
                  Clout Careers - Professional Referral Network
                </p>
              </div>
            `,
          })
        } catch (error) {
          console.error("Failed to send email:", error)
          throw new Error("Failed to send verification email")
        }
      },
    }),
  ],

  // Custom auth pages (instead of default NextAuth pages)
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },

  callbacks: {
    // INVITE-ONLY ENFORCEMENT
    // This callback runs every time someone tries to sign in
    // We check if they exist in our database first - if not, reject them
    async signIn({ user, account, profile, email, credentials }) {
      if (user.email) {
        // Check if user exists in our database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        })

        // Reject sign-in if user doesn't exist (invite-only system)
        if (!existingUser) {
          console.log("Rejected sign-in for non-invited user:", user.email)
          return false
        }

        console.log("Approved sign-in for invited user:", user.email)
      }

      return true
    },

    // SESSION ENRICHMENT
    // This callback runs every time a session is accessed
    // We add custom user data from our database to the session object
    // This avoids repeated database calls in components
    async session({ session, user }) {
      if (session.user && user) {
        // Fetch additional user data from our database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isProfileComplete: true,
            referralCode: true,
            inviteUsed: true,
            isHiringManager: true,
          }
        })

        // Add our custom fields to the session object
        if (dbUser) {
          session.user.id = dbUser.id
          session.user.firstName = dbUser.firstName
          session.user.lastName = dbUser.lastName
          session.user.isProfileComplete = dbUser.isProfileComplete
          session.user.referralCode = dbUser.referralCode
          session.user.inviteUsed = dbUser.inviteUsed
          session.user.isHiringManager = dbUser.isHiringManager
        }
      }

      return session
    },
  },

  // Use database sessions instead of JWT tokens
  // Better for security and session management
  session: {
    strategy: "database",
  },
})

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }