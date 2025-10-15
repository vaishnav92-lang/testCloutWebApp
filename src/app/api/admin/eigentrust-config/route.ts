/**
 * ADMIN EIGENTRUST CONFIGURATION API
 *
 * Allows admin to configure EigenTrust algorithm parameters.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Admin check
    const ADMIN_EMAIL = 'vaishnav@cloutcareers.com'
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({
        error: 'Not authorized - admin access required'
      }, { status: 403 })
    }

    // Get current configuration
    const config = await prisma.systemConfig.findFirst()

    return NextResponse.json({
      eigentrustAlpha: config?.eigentrustAlpha || 0.15,
      maxIterations: config?.maxIterations || 100,
      convergenceThreshold: config?.convergenceThreshold || 1e-6,
      adminEmail: config?.adminEmail || 'vaishnav@cloutcareers.com'
    })

  } catch (error) {
    console.error('Config fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch configuration'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Admin check
    const ADMIN_EMAIL = 'vaishnav@cloutcareers.com'
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({
        error: 'Not authorized - admin access required'
      }, { status: 403 })
    }

    // Get request data
    const {
      eigentrustAlpha,
      maxIterations,
      convergenceThreshold,
      adminEmail
    } = await request.json()

    // Validate parameters
    if (eigentrustAlpha !== undefined) {
      if (typeof eigentrustAlpha !== 'number' || eigentrustAlpha < 0 || eigentrustAlpha > 1) {
        return NextResponse.json({
          error: 'eigentrustAlpha must be a number between 0 and 1'
        }, { status: 400 })
      }
    }

    if (maxIterations !== undefined) {
      if (typeof maxIterations !== 'number' || maxIterations < 1 || maxIterations > 1000) {
        return NextResponse.json({
          error: 'maxIterations must be a number between 1 and 1000'
        }, { status: 400 })
      }
    }

    if (convergenceThreshold !== undefined) {
      if (typeof convergenceThreshold !== 'number' || convergenceThreshold <= 0 || convergenceThreshold > 0.1) {
        return NextResponse.json({
          error: 'convergenceThreshold must be a positive number less than 0.1'
        }, { status: 400 })
      }
    }

    if (adminEmail !== undefined) {
      if (typeof adminEmail !== 'string' || !adminEmail.includes('@')) {
        return NextResponse.json({
          error: 'adminEmail must be a valid email address'
        }, { status: 400 })
      }
    }

    // Update configuration
    const updateData: any = {}
    if (eigentrustAlpha !== undefined) updateData.eigentrustAlpha = eigentrustAlpha
    if (maxIterations !== undefined) updateData.maxIterations = maxIterations
    if (convergenceThreshold !== undefined) updateData.convergenceThreshold = convergenceThreshold
    if (adminEmail !== undefined) updateData.adminEmail = adminEmail

    const updatedConfig = await prisma.systemConfig.upsert({
      where: { id: 'system_config' },
      create: {
        id: 'system_config',
        ...updateData
      },
      update: updateData
    })

    return NextResponse.json({
      message: 'Configuration updated successfully',
      config: {
        eigentrustAlpha: updatedConfig.eigentrustAlpha,
        maxIterations: updatedConfig.maxIterations,
        convergenceThreshold: updatedConfig.convergenceThreshold,
        adminEmail: updatedConfig.adminEmail
      }
    })

  } catch (error) {
    console.error('Config update error:', error)
    return NextResponse.json({
      error: 'Failed to update configuration'
    }, { status: 500 })
  }
}