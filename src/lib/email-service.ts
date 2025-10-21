/**
 * EMAIL SERVICE
 *
 * Centralized email service for sending various types of emails
 * including invitations, referrals, and notifications.
 */

import { getResend } from './resend'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.cloutcareers.com'
const FROM_EMAIL = process.env.EMAIL_FROM || 'Clout Careers <noreply@cloutcareers.com>'

interface InvitationEmailData {
  recipientEmail: string
  senderName: string
  inviteCode?: string
}

interface JobReferralEmailData {
  recipientEmail: string
  recipientName?: string
  referrerName: string
  jobTitle: string
  companyName: string
  referralReason?: string
  personalMessage?: string
}

interface DelegationEmailData {
  recipientEmail: string
  recipientName?: string
  delegatorName: string
  jobTitle: string
  companyName: string
  message: string
}

interface NetworkInvitationEmailData {
  recipientEmail: string
  senderName: string
  trustPoints: number
}

/**
 * Send platform invitation email
 */
export async function sendInvitationEmail(data: InvitationEmailData) {
  const resend = getResend()

  const inviteLink = data.inviteCode
    ? `${BASE_URL}/join/${data.inviteCode}`
    : `${BASE_URL}/join`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>You're Invited to Clout Careers</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Clout Careers</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Professional Referral Network</p>
          </div>
          <div class="content">
            <p style="font-size: 18px; color: #111827;">Hi there!</p>

            <p style="color: #4b5563; line-height: 1.6;">
              <strong>${data.senderName}</strong> has invited you to join Clout Careers,
              a trusted professional network where members refer exceptional talent for opportunities.
            </p>

            <p style="color: #4b5563; line-height: 1.6;">
              ${data.senderName} values your professional expertise and wants you to be part of their trusted network.
              By joining, you'll be able to:
            </p>

            <ul style="color: #4b5563; line-height: 1.8;">
              <li>Build your trusted professional network</li>
              <li>Receive and make high-quality job referrals</li>
              <li>Get endorsed by colleagues who know your work</li>
              <li>Access exclusive career opportunities</li>
              <li>Earn referral bonuses for successful placements</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              Or copy this link: <br>
              <code style="background: #f3f4f6; padding: 8px; border-radius: 4px; display: inline-block; margin-top: 5px;">
                ${inviteLink}
              </code>
            </p>

            <div class="footer">
              <p>
                Clout Careers is an invitation-only platform. This invitation was sent specifically to you
                by ${data.senderName} and should not be shared with others.
              </p>
              <p style="margin-top: 10px;">
                If you have questions, feel free to reach out to us at support@cloutcareers.com
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.recipientEmail,
    subject: `${data.senderName} invited you to join Clout Careers`,
    html
  })
}

/**
 * Send job referral email for existing users
 */
export async function sendJobReferralEmail(data: JobReferralEmailData) {
  const resend = getResend()

  const jobLink = `${BASE_URL}/jobs` // They'll need to log in to see the specific job

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>You've been referred for a position</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .job-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .quote { border-left: 4px solid #10b981; padding-left: 20px; margin: 20px 0; color: #4b5563; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Great News, ${data.recipientName || 'there'}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You've been referred for an exciting opportunity</p>
          </div>
          <div class="content">
            <p style="font-size: 18px; color: #111827;">
              <strong>${data.referrerName}</strong> has referred you for a position!
            </p>

            <div class="job-card">
              <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 20px;">${data.jobTitle}</h2>
              <p style="margin: 5px 0; color: #4b5563; font-size: 16px;">at <strong>${data.companyName}</strong></p>
            </div>

            ${data.referralReason ? `
              <p style="color: #4b5563; line-height: 1.6;">
                <strong>Why ${data.referrerName} thinks you're perfect for this role:</strong>
              </p>
              <div class="quote">
                ${data.referralReason}
              </div>
            ` : ''}

            ${data.personalMessage ? `
              <p style="color: #4b5563; line-height: 1.6;">
                <strong>Personal message from ${data.referrerName}:</strong>
              </p>
              <div class="quote">
                ${data.personalMessage}
              </div>
            ` : ''}

            <p style="color: #4b5563; line-height: 1.6;">
              This referral comes with ${data.referrerName}'s professional endorsement,
              which carries significant weight in the Clout network.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${jobLink}" class="button">View Opportunity</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              You're receiving this because ${data.referrerName} has endorsed you for this position through Clout Careers.
              Log in to your account to view the full job details and express your interest.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.recipientEmail,
    subject: `${data.referrerName} referred you for ${data.jobTitle} at ${data.companyName}`,
    html
  })
}

/**
 * Send delegation email (forward referral request)
 */
export async function sendDelegationEmail(data: DelegationEmailData) {
  const resend = getResend()

  const signupLink = `${BASE_URL}/join`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Can you help with a referral?</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .job-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .message-box { background: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Referral Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Can you help find someone great?</p>
          </div>
          <div class="content">
            <p style="font-size: 18px; color: #111827;">Hi ${data.recipientName || 'there'},</p>

            <p style="color: #4b5563; line-height: 1.6;">
              <strong>${data.delegatorName}</strong> is looking for your help to find the right person
              for an exciting opportunity and thought you might know someone perfect for this role:
            </p>

            <div class="job-card">
              <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 20px;">${data.jobTitle}</h2>
              <p style="margin: 5px 0; color: #4b5563; font-size: 16px;">at <strong>${data.companyName}</strong></p>
            </div>

            <div class="message-box">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase;">
                Message from ${data.delegatorName}:
              </p>
              <p style="margin: 0; color: #111827; line-height: 1.6;">
                ${data.message}
              </p>
            </div>

            <p style="color: #4b5563; line-height: 1.6;">
              If you know someone who would be a great fit for this position, ${data.delegatorName}
              would really appreciate your referral. Quality referrals through Clout often come with
              referral bonuses for successful placements.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${signupLink}" class="button">Join Clout to Make a Referral</a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              <strong>About Clout Careers:</strong> We're a trusted professional network where members
              refer exceptional talent for opportunities. By joining, you can help ${data.delegatorName}
              find the right person while building your own professional network.
            </p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This referral request was sent to you by ${data.delegatorName} through Clout Careers.
              If you don't know anyone suitable for this role, no worries - we appreciate you taking the time to consider it.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.recipientEmail,
    subject: `${data.delegatorName} needs your help finding someone for ${data.jobTitle}`,
    html
  })
}

/**
 * Send network invitation email (when someone adds you to their trusted network)
 */
export async function sendNetworkInvitationEmail(data: NetworkInvitationEmailData) {
  const resend = getResend()

  const dashboardLink = `${BASE_URL}/dashboard`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>You've been added to a trusted network</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .trust-badge { background: #faf5ff; border: 2px solid #c084fc; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">You're in ${data.senderName}'s Trusted Network!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Build your professional relationships</p>
          </div>
          <div class="content">
            <p style="font-size: 18px; color: #111827;">Great news!</p>

            <p style="color: #4b5563; line-height: 1.6;">
              <strong>${data.senderName}</strong> has added you to their trusted professional network on Clout Careers
              and allocated <strong>${data.trustPoints} trust points</strong> to you.
            </p>

            <div class="trust-badge">
              <div style="font-size: 36px; color: #7c3aed; font-weight: bold;">${data.trustPoints}</div>
              <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Trust Points Allocated</div>
            </div>

            <p style="color: #4b5563; line-height: 1.6;">
              This means ${data.senderName} values your professional judgment and wants to:
            </p>

            <ul style="color: #4b5563; line-height: 1.8;">
              <li>Exchange high-quality referrals with you</li>
              <li>Endorse your professional capabilities</li>
              <li>Collaborate on career opportunities</li>
              <li>Build a mutually beneficial professional relationship</li>
            </ul>

            <p style="color: #4b5563; line-height: 1.6;">
              The trust points indicate how much ${data.senderName} values your professional opinion
              in their network. You can reciprocate by adding them to your trusted network as well.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardLink}" class="button">View Your Network</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              You're receiving this notification because you're a member of Clout Careers.
              Manage your network settings in your dashboard.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.recipientEmail,
    subject: `${data.senderName} added you to their trusted network on Clout`,
    html
  })
}