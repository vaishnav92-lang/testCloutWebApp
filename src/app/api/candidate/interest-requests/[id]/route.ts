import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch candidate interest record
    const candidateInterest = await prisma.candidateInterest.findUnique({
      where: { id: params.id },
      include: {
        job: {
          include: {
            company: true
          }
        },
        candidate: {
          select: { id: true, email: true }
        }
      }
    })

    if (!candidateInterest) {
      return NextResponse.json({ error: 'Interest request not found' }, { status: 404 })
    }

    // Verify the current user is the candidate
    if (candidateInterest.candidateId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(candidateInterest)

  } catch (error) {
    console.error('Error fetching candidate interest:', error)
    return NextResponse.json({ error: 'Failed to fetch interest request' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { response } = await req.json()

    if (!response || !['VERY_EXCITED', 'INTERESTED_TO_CHAT', 'NOT_INTERESTED'].includes(response)) {
      return NextResponse.json({ error: 'Valid response is required' }, { status: 400 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch candidate interest record
    const candidateInterest = await prisma.candidateInterest.findUnique({
      where: { id: params.id },
      include: {
        job: {
          include: {
            company: true,
            owner: {
              select: { email: true, firstName: true, lastName: true }
            }
          }
        },
        candidate: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    })

    if (!candidateInterest) {
      return NextResponse.json({ error: 'Interest request not found' }, { status: 404 })
    }

    // Verify the current user is the candidate
    if (candidateInterest.candidateId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if already responded
    if (candidateInterest.status !== 'PENDING') {
      return NextResponse.json({ error: 'You have already responded to this interest request' }, { status: 400 })
    }

    // Update the candidate interest record
    const updatedCandidateInterest = await prisma.candidateInterest.update({
      where: { id: params.id },
      data: {
        status: response,
        respondedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Response recorded successfully',
      candidateInterest: updatedCandidateInterest
    })

  } catch (error) {
    console.error('Error updating candidate interest:', error)
    return NextResponse.json({ error: 'Failed to update response' }, { status: 500 })
  }
}