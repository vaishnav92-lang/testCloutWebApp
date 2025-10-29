/**
 * PASSWORD LOGIN API
 *
 * Custom password authentication endpoint that works alongside NextAuth
 * Uses the same session management as NextAuth for consistency
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signIn } from 'next-auth/react'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        error: 'Email and password are required'
      }, { status: 400 })
    }

    // Check universal password
    const UNIVERSAL_PASSWORD = "950792"
    if (password !== UNIVERSAL_PASSWORD) {
      return NextResponse.json({
        error: 'Invalid password'
      }, { status: 401 })
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Create a session by calling NextAuth's email provider
    // This creates a verification token and sends an immediate redirect
    const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`

    // Create a session token manually
    const sessionToken = crypto.randomUUID()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Create session in database
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires
      }
    })

    // Set the session cookie
    const response = NextResponse.json({
      success: true,
      redirectUrl: '/dashboard'
    })

    response.cookies.set('next-auth.session-token', sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Password login error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}