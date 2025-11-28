import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
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

    // Fetch pending interest requests for this user
    const pendingInterests = await prisma.candidateInterest.findMany({
      where: {
        candidateId: user.id,
        status: 'PENDING'
      },
      include: {
        job: {
          include: {
            company: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(pendingInterests)

  } catch (error) {
    console.error('Error fetching candidate interest requests:', error)
    return NextResponse.json({ error: 'Failed to fetch interest requests' }, { status: 500 })
  }
}