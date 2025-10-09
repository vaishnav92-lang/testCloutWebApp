import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Delete user and all related data in transaction
    const result = await prisma.$transaction(async (tx) => {
      // First find the user
      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Delete related data first (to avoid foreign key constraints)
      await tx.relationship.deleteMany({
        where: {
          OR: [
            { user1Id: user.id },
            { user2Id: user.id }
          ]
        }
      })

      await tx.invitation.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      })

      await tx.jobApplication.deleteMany({
        where: { userId: user.id }
      })

      await tx.account.deleteMany({
        where: { userId: user.id }
      })

      await tx.session.deleteMany({
        where: { userId: user.id }
      })

      // Finally delete the user
      await tx.user.delete({
        where: { id: user.id }
      })

      return { deletedEmail: email }
    })

    return NextResponse.json({
      message: 'User deleted successfully',
      result
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Server error'
    }, { status: 500 })
  }
}