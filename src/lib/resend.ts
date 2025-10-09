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

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required')
}

export const resend = new Resend(process.env.RESEND_API_KEY)