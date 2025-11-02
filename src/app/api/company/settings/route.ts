/**
 * COMPANY SETTINGS API
 *
 * Endpoints for managing company internal board configuration
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
      select: { id: true, companyId: true, isCompanyAdmin: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 })
    }

    if (!user.isCompanyAdmin) {
      return NextResponse.json({ error: 'Only company admins can access settings' }, { status: 403 })
    }

    // Get company settings
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        id: true,
        name: true,
        hasInternalJobBoard: true,
        internalBoardMode: true,
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find user and verify admin status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, companyId: true, isCompanyAdmin: true },
    })

    if (!user || !user.isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Only company admins can update settings' },
        { status: 403 }
      )
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 })
    }

    const body = await request.json()
    const { hasInternalJobBoard, internalBoardMode } = body

    // Build update data
    const updateData: any = {}

    if (typeof hasInternalJobBoard === 'boolean') {
      updateData.hasInternalJobBoard = hasInternalJobBoard
    }

    if (internalBoardMode) {
      const validModes = ['PARTITIONED', 'OPTIONAL', 'OPEN_TO_NETWORK']
      if (!validModes.includes(internalBoardMode)) {
        return NextResponse.json({ error: 'Invalid board mode' }, { status: 400 })
      }
      updateData.internalBoardMode = internalBoardMode
    }

    // Update company settings
    const updatedCompany = await prisma.company.update({
      where: { id: user.companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        hasInternalJobBoard: true,
        internalBoardMode: true,
      },
    })

    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error('Error updating company settings:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
