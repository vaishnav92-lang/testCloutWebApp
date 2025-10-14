/**
 * ADMIN USER DELETION API
 *
 * Safely deletes a user and all their related data.
 * This follows the CASCADE delete pattern to maintain database integrity.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    console.log('Delete user API called - Session:', session?.user?.email)

    if (!session?.user?.email) {
      console.log('No session found')
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Check if user is admin (you may want to add an isAdmin field to your User model)
    // For now, you can hardcode admin emails
    const ADMIN_EMAILS = ['vaishnav@cloutcareers.com'] // Add your admin email here

    console.log('Checking admin access for:', session.user.email, 'Admin emails:', ADMIN_EMAILS)

    if (!ADMIN_EMAILS.includes(session.user.email)) {
      console.log('Admin access denied for:', session.user.email)
      return NextResponse.json({
        error: 'Not authorized - admin access required'
      }, { status: 403 })
    }

    console.log('Admin access granted for:', session.user.email)

    // Get email from request body
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Delete all related data in the correct order (most dependent first)
    await prisma.$transaction(async (tx) => {
      // 1. Delete Accounts (NextAuth related)
      await tx.account.deleteMany({
        where: { userId: user.id }
      })

      // 2. Delete Sessions (NextAuth related)
      await tx.session.deleteMany({
        where: { userId: user.id }
      })

      // 3. Delete VerificationTokens associated with user's email
      await tx.verificationToken.deleteMany({
        where: { identifier: user.email }
      })

      // 4. Delete Introductions where user is involved
      await tx.introduction.deleteMany({
        where: {
          OR: [
            { personAId: user.id },
            { personBId: user.id },
            { introducedById: user.id }
          ]
        }
      })

      // 5. Delete Endorsements (both given and received)
      await tx.endorsement.deleteMany({
        where: {
          OR: [
            { endorserId: user.id },
            { endorsedUserId: user.id }
          ]
        }
      })

      // 6. Delete Relationships where user is involved
      await tx.relationship.deleteMany({
        where: {
          OR: [
            { user1Id: user.id },
            { user2Id: user.id }
          ]
        }
      })

      // 7. Delete Jobs owned by user (if they're a hiring manager)
      await tx.job.deleteMany({
        where: { ownerId: user.id }
      })

      // 8. Delete Invitations (both sent and received)
      await tx.invitation.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      })

      // 9. Delete users who were referred by this user
      // Note: You might want to just set referredById to null instead
      await tx.user.updateMany({
        where: { referredById: user.id },
        data: { referredById: null }
      })

      // 10. Finally, delete the user
      await tx.user.delete({
        where: { id: user.id }
      })
    })

    return NextResponse.json({
      message: `User ${email} and all related data have been deleted successfully`
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}