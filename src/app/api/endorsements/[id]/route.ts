/**
 * ENDORSEMENT DETAILS API
 *
 * This endpoint provides endorsement details for the candidate decision page.
 * It returns endorser information without the endorsement content for privacy.
 *
 * Features:
 * - Public access (no authentication required) for decision links
 * - Returns endorser details but NOT endorsement content
 * - Privacy-focused design
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get endorsement details for decision page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: endorsementId } = await params

    const endorsement = await prisma.endorsement.findUnique({
      where: { id: endorsementId },
      include: {
        endorser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!endorsement) {
      return NextResponse.json({
        error: 'Endorsement not found'
      }, { status: 404 })
    }

    // Return safe data (no endorsement content)
    return NextResponse.json({
      id: endorsement.id,
      endorser: {
        name: `${endorsement.endorser.firstName || ''} ${endorsement.endorser.lastName || ''}`.trim() || endorsement.endorser.email,
        email: endorsement.endorser.email
      },
      status: endorsement.status,
      createdAt: endorsement.createdAt
    })

  } catch (error) {
    console.error('Endorsement fetch error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}
