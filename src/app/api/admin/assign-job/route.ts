import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

const ADMIN_EMAILS = ['vaishnav@cloutcareers.com', 'romanov360@gmail.com']

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

    const { jobId, email } = await req.json()

    if (!jobId || !email) {
      return NextResponse.json({ error: 'Job ID and email are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    })

    let isNewUser = false
    let inviteToken = null

    if (!user) {
      // Create new user with hiring manager permissions
      inviteToken = randomBytes(32).toString('hex')

      user = await prisma.user.create({
        data: {
          email,
          isHiringManager: true,
          inviteToken,
          inviteUsed: false
        }
      })
      isNewUser = true
    } else {
      // Update existing user to be a hiring manager
      if (!user.isHiringManager) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isHiringManager: true }
        })
      }
    }

    // Update job owner
    await prisma.job.update({
      where: { id: jobId },
      data: { ownerId: user.id }
    })

    // Prepare email content
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const editUrl = `${baseUrl}/dashboard/hiring-manager/jobs/${jobId}/edit`

    let emailContent
    let subject

    if (isNewUser) {
      // New user - send invitation with magic link
      const magicLink = `${baseUrl}/api/auth/magic-login?token=${inviteToken}&redirect=${encodeURIComponent(editUrl)}`

      subject = 'You've been invited to manage a job on Clout Careers'
      emailContent = `
        <h2>Welcome to Clout Careers!</h2>
        <p>You've been assigned as the hiring manager for the position: <strong>${job.title}</strong> at ${job.company.name}.</p>
        <p>Click the link below to access your account and start managing this job posting:</p>
        <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Access Your Job Posting
        </a>
        <p>This link will log you in automatically and take you directly to the job editing page.</p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${magicLink}</p>
      `
    } else {
      // Existing user - send notification
      subject = `You've been assigned to manage: ${job.title}`
      emailContent = `
        <h2>New Job Assignment</h2>
        <p>You've been assigned as the hiring manager for the position: <strong>${job.title}</strong> at ${job.company.name}.</p>
        <p>Click the link below to view and edit this job posting:</p>
        <a href="${editUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Manage Job Posting
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${editUrl}</p>
      `
    }

    // Send email
    try {
      await sendEmail({
        to: email,
        subject,
        html: emailContent
      })
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      // Don't fail the entire operation if email fails
    }

    return NextResponse.json({
      success: true,
      message: isNewUser
        ? `Job assigned to new user ${email}. An invitation email has been sent.`
        : `Job assigned to ${email}. A notification email has been sent.`,
      user: {
        id: user.id,
        email: user.email,
        isNew: isNewUser
      }
    })
  } catch (error) {
    console.error('Error assigning job:', error)
    return NextResponse.json({ error: 'Failed to assign job' }, { status: 500 })
  }
}