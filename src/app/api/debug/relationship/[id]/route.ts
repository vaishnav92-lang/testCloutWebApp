import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const relationship = await prisma.relationship.findUnique({
      where: { id: params.id },
      include: {
        user1: { select: { email: true, firstName: true, lastName: true } },
        user2: { select: { email: true, firstName: true, lastName: true } }
      }
    })

    if (!relationship) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: relationship.id,
      status: relationship.status,
      user1TrustScore: relationship.user1TrustScore,
      user2TrustScore: relationship.user2TrustScore,
      user1: relationship.user1,
      user2: relationship.user2,
      createdAt: relationship.createdAt,
      updatedAt: relationship.updatedAt
    })

  } catch (error) {
    console.error('Debug relationship error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}