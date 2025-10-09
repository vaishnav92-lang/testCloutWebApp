/**
 * TYPEFORM WEBHOOK ENDPOINT
 *
 * This endpoint receives endorsement submissions from Typeform and processes them.
 * It creates endorsement records and triggers candidate notifications.
 *
 * Webhook Flow:
 * 1. Typeform sends POST request when endorsement form is submitted
 * 2. Parse endorsement content from Typeform response data
 * 3. Create Endorsement record with PENDING_CANDIDATE_ACTION status
 * 4. Send email notification to endorsed candidate
 * 5. Return 200 OK to Typeform
 *
 * Key features:
 * - Validates Typeform webhook signature (TODO: implement)
 * - Extracts endorsement data from Typeform response format
 * - Creates endorsement record in database
 * - Handles both existing and new candidates
 * - Triggers email notification workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'

// POST - Receive Typeform endorsement submission
export async function POST(request: NextRequest) {
  try {
    // PARSE TYPEFORM WEBHOOK DATA
    const webhookData = await request.json()

    console.log('Typeform webhook received:', JSON.stringify(webhookData, null, 2))

    // Extract form response data
    const formResponse = webhookData.form_response
    if (!formResponse) {
      return NextResponse.json({
        error: 'Invalid webhook format - missing form_response'
      }, { status: 400 })
    }

    // EXTRACT ENDORSEMENT DATA FROM TYPEFORM ANSWERS
    const answers = formResponse.answers || []
    let endorsedEmail = ''
    let endorsementContent = ''
    let videoUrl = ''
    let relationshipType = []
    let hoursOfInteraction = ''
    let workExposure = []
    let performanceRanking = ''
    let exceptionalSkill = ''
    let complementaryPartner = ''

    // Map Typeform answers to our fields based on the new form structure
    for (const answer of answers) {
      const field = answer.field
      const fieldRef = field.ref || field.id
      const fieldTitle = field.title?.toLowerCase() || ''

      // Extract values based on field reference or title patterns
      if (fieldTitle.includes('email') && fieldTitle.includes('person')) {
        endorsedEmail = answer.email || answer.text || ''
      } else if (fieldTitle.includes('how do you know')) {
        relationshipType = answer.choices?.labels || []
      } else if (fieldTitle.includes('hours of interaction')) {
        hoursOfInteraction = answer.choice?.label || ''
      } else if (fieldTitle.includes('type of work') && fieldTitle.includes('privy')) {
        workExposure = answer.choices?.labels || []
      } else if (fieldTitle.includes('relative to others') || fieldTitle.includes('rank')) {
        performanceRanking = answer.choice?.label || ''
      } else if (fieldTitle.includes('exceptional at')) {
        exceptionalSkill = answer.text || ''
      } else if (fieldTitle.includes('complement their strengths')) {
        complementaryPartner = answer.text || ''
      } else if (fieldTitle.includes('context') || fieldTitle.includes('evidence') || answer.text?.length > 100) {
        // This is likely the main endorsement content
        endorsementContent = answer.text || ''
      } else if (fieldTitle.includes('video') || answer.url) {
        videoUrl = answer.url || answer.text || ''
      }
    }

    // Build complete endorsement content from all fields
    const fullEndorsementContent = `
RELATIONSHIP: ${relationshipType.join(', ')}
INTERACTION TIME: ${hoursOfInteraction}
WORK EXPOSURE: ${workExposure.join(', ')}
PERFORMANCE RANKING: ${performanceRanking}
EXCEPTIONAL SKILL: ${exceptionalSkill}
COMPLEMENTARY PARTNER SKILLS: ${complementaryPartner}

DETAILED ENDORSEMENT:
${endorsementContent}
    `.trim()

    // VALIDATION
    if (!endorsedEmail || !endorsementContent) {
      console.error('Missing required fields:', { endorsedEmail, hasContent: !!endorsementContent })
      return NextResponse.json({
        error: 'Missing required endorsement data'
      }, { status: 400 })
    }

    // GET ENDORSER FROM FORM HIDDEN FIELD OR SESSION
    // For now, we'll need to pass the endorser email as a hidden field in the Typeform
    // or use a different approach to identify the endorser

    // Option 1: Extract from hidden field (you'll need to add this to your Typeform)
    let endorserEmail = ''
    for (const answer of answers) {
      const fieldTitle = answer.field.title?.toLowerCase() || ''
      if (fieldTitle.includes('endorser_email') || answer.field.ref === 'endorser_email') {
        endorserEmail = answer.email || answer.text || ''
        break
      }
    }

    if (!endorserEmail) {
      console.error('Endorser email not found in form submission')
      return NextResponse.json({
        error: 'Endorser identification missing'
      }, { status: 400 })
    }

    // FIND ENDORSER USER
    const endorser = await prisma.user.findUnique({
      where: { email: endorserEmail },
      select: { id: true, firstName: true, lastName: true }
    })

    if (!endorser) {
      console.error('Endorser not found:', endorserEmail)
      return NextResponse.json({
        error: 'Endorser not found in system'
      }, { status: 400 })
    }

    // CHECK FOR EXISTING ENDORSEMENT
    const existingEndorsement = await prisma.endorsement.findUnique({
      where: {
        endorserId_endorsedUserEmail: {
          endorserId: endorser.id,
          endorsedUserEmail: endorsedEmail
        }
      }
    })

    if (existingEndorsement) {
      console.log('Endorsement already exists:', existingEndorsement.id)
      return NextResponse.json({
        message: 'Endorsement already exists',
        endorsementId: existingEndorsement.id
      })
    }

    // FIND ENDORSED USER (IF THEY'RE ON PLATFORM)
    const endorsedUser = await prisma.user.findUnique({
      where: { email: endorsedEmail },
      select: { id: true, firstName: true, lastName: true }
    })

    // CREATE ENDORSEMENT RECORD
    const endorsement = await prisma.endorsement.create({
      data: {
        endorserId: endorser.id,
        endorsedUserId: endorsedUser?.id || null,
        endorsedUserEmail: endorsedEmail,
        endorsementContent: fullEndorsementContent,
        videoUrl: videoUrl || null,
        status: 'PENDING_CANDIDATE_ACTION',
        candidateNotifiedAt: new Date()
      }
    })

    // SEND EMAIL NOTIFICATION TO CANDIDATE
    const endorserName = `${endorser.firstName || ''} ${endorser.lastName || ''}`.trim() || endorserEmail

    try {
      await resend.emails.send({
        from: 'Clout Careers <noreply@cloutcareers.com>',
        to: endorsedEmail,
        subject: `${endorserName} has endorsed you on Clout`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">
              ${endorserName} has endorsed you!
            </h1>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              ${endorserName} has written a detailed endorsement about working with you.
            </p>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              This endorsement highlights your strengths and can help you stand out to employers. You choose how to use it:
            </p>

            <ul style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              <li>Keep it private and release to specific employers when you want</li>
              <li>Let Clout use it to proactively find great opportunities for you</li>
              <li>Choose not to use it</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/endorsements/${endorsement.id}/decide"
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                View and Choose
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Best,<br>
              The Clout Team
            </p>
          </div>
        `
      })

      console.log('Notification email sent to:', endorsedEmail)
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      // Don't fail the webhook if email fails - endorsement was created successfully
    }

    // SUCCESS RESPONSE TO TYPEFORM
    return NextResponse.json({
      message: 'Endorsement created successfully',
      endorsementId: endorsement.id
    })

  } catch (error) {
    console.error('Typeform webhook error:', error)
    return NextResponse.json({
      error: 'Server error processing endorsement'
    }, { status: 500 })
  }
}