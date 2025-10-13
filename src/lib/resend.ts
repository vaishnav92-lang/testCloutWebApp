/**
 * RESEND EMAIL SERVICE
 *
 * This module configures the Resend email service for the application.
 * Resend is used for sending transactional emails like:
 * - Endorsement notifications
 * - Platform invitations
 * - Login verification emails
 */

import { Resend } from 'resend'

// Only initialize Resend if API key is available
// During build time, this might not be available and that's OK
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export function getResend() {
  if (!resend) {
    throw new Error('RESEND_API_KEY environment variable is required')
  }
  return resend
}