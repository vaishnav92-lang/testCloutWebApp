import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log('Testing Resend with API key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...')
    console.log('From email:', process.env.EMAIL_FROM)

    const { email } = await request.json()

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Test Email from Clout Careers",
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify Resend integration.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    })

    console.log('Resend result:', result)

    return NextResponse.json({
      message: 'Email sent successfully',
      result
    })

  } catch (error) {
    console.error('Resend error:', error)
    return NextResponse.json({
      error: 'Failed to send email',
      details: error
    }, { status: 500 })
  }
}