
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id: jobId } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Check if the user has already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this job.' },
        { status: 409 }
      )
    }

    // Create the job application
    const jobApplication = await prisma.jobApplication.create({
      data: {
        userId,
        jobId,
        status: 'APPLIED',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully.',
      application: jobApplication,
    })
  } catch (error) {
    console.error('Error creating job application:', error)
    // Check for specific prisma errors if needed, e.g., if the job doesn't exist
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
