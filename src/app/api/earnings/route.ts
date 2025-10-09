/**
 * EARNINGS API
 *
 * This endpoint manages earnings transactions for users.
 * Used to track payments, bonuses, and network earnings.
 *
 * Features:
 * - Get user's earnings history
 * - Create new earnings transactions
 * - Update earnings status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // FIND CURRENT USER
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // GET EARNINGS SUMMARY
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        cloutScore: true,
        totalEarnings: true,
        pendingEarnings: true,
        successfulReferrals: true,
        endorsementsScore: true,
        networkValue: true
      }
    })

    // GET EARNINGS TRANSACTIONS
    const transactions = await prisma.earningsTransaction.findMany({
      where: { userId: currentUser.id },
      include: {
        job: {
          select: {
            title: true,
            company: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Last 50 transactions
    })

    return NextResponse.json({
      user,
      transactions
    })

  } catch (error) {
    console.error('Earnings fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // FIND CURRENT USER
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // PARSE REQUEST BODY
    const body = await request.json()
    const {
      userId,
      amount,
      type,
      jobId,
      description,
      metadata
    } = body

    // Validate required fields
    if (!amount || !type) {
      return NextResponse.json({
        error: 'Amount and type are required'
      }, { status: 400 })
    }

    // TODO: Add admin check for creating earnings for other users
    const targetUserId = userId || currentUser.id

    // CREATE EARNINGS TRANSACTION
    const transaction = await prisma.earningsTransaction.create({
      data: {
        userId: targetUserId,
        amount: parseFloat(amount),
        type,
        jobId,
        description,
        metadata,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        job: {
          select: {
            title: true,
            company: {
              select: { name: true }
            }
          }
        }
      }
    })

    // UPDATE USER'S PENDING EARNINGS
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        pendingEarnings: {
          increment: parseFloat(amount)
        }
      }
    })

    return NextResponse.json({
      transaction
    })

  } catch (error) {
    console.error('Earnings creation error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}