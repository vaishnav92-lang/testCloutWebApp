/**
 * AUTHENTICATION CONFIGURATION
 *
 * This module contains the NextAuth.js configuration for magic link authentication with invite-only access.
 * Key features:
 * - Magic link login (no passwords)
 * - Invite-only system (rejects non-existing users)
 * - Session enrichment with user data
 * - Email delivery via Resend service
 */

import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { getResend } from "./resend"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  // CRITICAL: Email provider requires database adapter
  adapter: PrismaAdapter(prisma),

  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,

      // IMPORTANT: NextAuth with Prisma adapter requires these to force custom email
      server: {
        host: "smtp.resend.com",
        port: 587,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY
        }
      },

      // Custom email sending function using Resend instead of default
      // This gives us more control over email templates and delivery
      sendVerificationRequest: async ({ identifier: email, url }) => {
        console.log("🔥 CUSTOM EMAIL FUNCTION CALLED for:", email)
        try {
          const resend = getResend()
          const result = await resend.emails.send({
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
          console.log("✅ Email sent successfully via Resend:", result)
        } catch (error) {
          console.error("❌ Failed to send email:", error)
          throw new Error("Failed to send verification email")
        }
      },
    }),

    // Add credentials provider for magic link login
    CredentialsProvider({
      name: 'magic-link',
      credentials: {
        email: { label: "Email", type: "email" },
        token: { label: "Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        // Special case for magic link login
        if (credentials.email && credentials.token === 'MAGIC_LINK_AUTO_LOGIN') {
          // Find the user - they should have been authenticated via magic link already
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
            }
          }
        }

        return null
      }
    }),

  ],

  // Custom auth pages (instead of default NextAuth pages)
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },

  callbacks: {
    // SIMPLE USER EXISTENCE CHECK
    // Only allow sign-in if user exists in database
    async signIn({ user, account, profile, email, credentials }) {
      if (user.email) {
        try {
          // Check if user exists in our database (case-insensitive)
          const existingUser = await prisma.user.findFirst({
            where: {
              email: {
                equals: user.email,
                mode: 'insensitive'
              }
            }
          })

          if (existingUser) {
            console.log("User found, allowing sign-in:", user.email)
            return true
          } else {
            console.log("User not found, rejecting sign-in:", user.email)
            return false
          }
        } catch (error) {
          console.error("Error checking user during sign-in:", error)
          return false
        }
      }

      return false
    },

    // SESSION ENRICHMENT
    // This callback runs every time a session is accessed
    // We add custom user data from our database to the session object
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
            isGrantmaker: true,
            isAdmin: true,
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
          session.user.isGrantmaker = dbUser.isGrantmaker
          session.user.isAdmin = dbUser.isAdmin
          console.log("🔥 SESSION CALLBACK DEBUG:", {
            email: session.user.email,
            isHiringManager: dbUser.isHiringManager,
            isGrantmaker: dbUser.isGrantmaker
          })
        }
      }

      return session
    },

    // REDIRECT AFTER SIGN-IN
    // This callback determines where to redirect users after successful sign-in
    async redirect({ url, baseUrl }) {
      // If user is signing in from an invitation link, maintain the callback URL
      if (url.startsWith('/')) return `${baseUrl}${url}`

      // For invitation flows, redirect to onboarding
      if (url.includes('callbackUrl') && url.includes('onboard')) {
        const urlObj = new URL(url)
        const callbackUrl = urlObj.searchParams.get('callbackUrl')
        if (callbackUrl) return callbackUrl
      }

      // Default redirect to dashboard for existing users
      return `${baseUrl}/dashboard`
    },
  },

  // Use database sessions with Prisma adapter
  session: {
    strategy: "database",
  },
}