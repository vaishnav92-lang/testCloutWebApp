import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({
        error: 'Invitation not found'
      }, { status: 404 })
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({
        error: 'Invitation already used'
      }, { status: 400 })
    }

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      trustScore: invitation.trustScore,
      senderEmail: invitation.sender.email,
      senderName: `${invitation.sender.firstName || ''} ${invitation.sender.lastName || ''}`.trim() || invitation.sender.email
    })

  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}