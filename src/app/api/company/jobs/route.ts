/**
 * COMPANY JOBS API
 *
 * Fetch jobs for a user's company
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find user and their company
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 })
    }

    // Get all jobs for the company
    const jobs = await prisma.job.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        remote: true,
        salaryMin: true,
        salaryMax: true,
        currency: true,
        jobVisibility: true,
        isInternalOnly: true,
        referralBudget: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching company jobs:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
