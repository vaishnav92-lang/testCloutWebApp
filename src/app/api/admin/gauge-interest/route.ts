import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getResend } from '@/lib/resend'

const ADMIN_EMAILS = ['vaishnav@cloutcareers.com', 'romanov360@gmail.com']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // This endpoint returns all users for candidate selection
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { email: 'asc' }
      ]
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users for gauge interest:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { jobId, candidateId } = await req.json()

    if (!jobId || !candidateId) {
      return NextResponse.json({ error: 'Job ID and candidate ID are required' }, { status: 400 })
    }

    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Job must be active to gauge interest' }, { status: 400 })
    }

    // Check if candidate exists
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      select: { id: true, email: true, firstName: true, lastName: true }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Check if interest gauge already exists for this job/candidate combination
    const existingGauge = await prisma.candidateInterest.findUnique({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId
        }
      }
    })

    if (existingGauge) {
      return NextResponse.json({ error: 'Interest has already been gauged for this candidate and job' }, { status: 400 })
    }

    // Create candidate interest record
    const candidateInterest = await prisma.candidateInterest.create({
      data: {
        jobId,
        candidateId,
        adminId: admin.id,
        status: 'PENDING'
      }
    })

    // Send email to candidate
    try {
      const resend = getResend()
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const responseUrl = `${baseUrl}/dashboard/interest-response/${candidateInterest.id}`

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Clout Careers <noreply@cloutcareers.com>',
        to: candidate.email,
        subject: `Opportunity at ${job.company.name} - ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Exciting Opportunity Alert!</h2>
            <p>Hi ${candidate.firstName || 'there'},</p>
            <p>We came across an opportunity that might be a great fit for you:</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1a202c;">${job.title}</h3>
              <p style="margin-bottom: 10px;"><strong>Company:</strong> ${job.company.name}</p>
              ${job.location ? `<p style="margin-bottom: 10px;"><strong>Location:</strong> ${job.location}</p>` : ''}
              ${job.description ? `<p style="margin-bottom: 0;"><strong>About the role:</strong> ${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}</p>` : ''}
            </div>

            <p>We'd love to know your level of interest. Please let us know:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${responseUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Share Your Interest Level
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              This will take you to a quick response page where you can indicate your level of interest.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px;">
              Clout Careers - Professional Referral Network
            </p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send interest gauge email:', emailError)
      // Don't fail the entire operation if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      message: `Interest gauge sent to ${candidate.email}`,
      candidateInterestId: candidateInterest.id
    })

  } catch (error) {
    console.error('Error gauging candidate interest:', error)
    return NextResponse.json({ error: 'Failed to gauge interest' }, { status: 500 })
  }
}