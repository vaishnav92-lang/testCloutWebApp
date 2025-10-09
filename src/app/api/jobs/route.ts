import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
            industry: true,
            size: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({
      error: 'Failed to fetch jobs'
    }, { status: 500 })
  }
}