import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.isGrantmaker) {
      return NextResponse.json({ error: 'Not authorized as grantmaker' }, { status: 403 })
    }

    const grants = await prisma.grant.findMany({
      where: {
        createdByEmail: session.user.email
      },
      include: {
        _count: {
          select: {
            recommenders: true,
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ grants })
  } catch (error) {
    console.error('Error fetching grants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.isGrantmaker) {
      return NextResponse.json({ error: 'Not authorized as grantmaker' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, amount, recommenders } = body

    // Validation
    if (!title || !description || !amount || !recommenders) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!Array.isArray(recommenders) || recommenders.length === 0) {
      return NextResponse.json({ error: 'At least one recommender is required' }, { status: 400 })
    }

    // Validate trust weights total 100
    const totalTrustWeight = recommenders.reduce((sum, r) => sum + r.trustWeight, 0)
    if (Math.abs(totalTrustWeight - 100) > 0.01) { // Allow small floating point differences
      return NextResponse.json({ error: 'Trust weights must total 100%' }, { status: 400 })
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json({ error: 'Grant amount must be positive' }, { status: 400 })
    }

    // Create grant with recommenders
    const grant = await prisma.grant.create({
      data: {
        title,
        description,
        amount,
        status: 'DRAFT',
        createdByEmail: session.user.email,
        recommenders: {
          create: recommenders.map((r: { email: string, trustWeight: number }) => ({
            email: r.email,
            trustWeight: r.trustWeight,
            status: 'PENDING'
          }))
        }
      },
      include: {
        recommenders: true
      }
    })

    return NextResponse.json({ grant })
  } catch (error) {
    console.error('Error creating grant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}