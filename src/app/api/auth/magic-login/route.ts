import { NextRequest, NextResponse } from 'next/server'
import { signIn } from 'next-auth/react'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const redirect = searchParams.get('redirect')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin?error=InvalidToken', req.url))
    }

    // Find user with this invite token
    const user = await prisma.user.findFirst({
      where: {
        inviteToken: token,
        inviteUsed: false
      }
    })

    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin?error=TokenNotFound', req.url))
    }

    // Mark token as used
    await prisma.user.update({
      where: { id: user.id },
      data: {
        inviteUsed: true,
        emailVerified: new Date()
      }
    })

    // Create a temporary JWT token for auto-login
    const jwtSecret = process.env.NEXTAUTH_SECRET || 'your-secret-key'
    const sessionToken = jwt.sign(
      {
        email: user.email,
        id: user.id,
        isHiringManager: user.isHiringManager
      },
      jwtSecret,
      { expiresIn: '1h' }
    )

    // Store session token in cookie and redirect
    const response = NextResponse.redirect(
      new URL(redirect || '/dashboard', req.url)
    )

    // Set a cookie to indicate this user should be auto-logged in
    response.cookies.set('magic-login-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    })

    response.cookies.set('magic-login-email', user.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 // 1 minute - just enough for the redirect
    })

    // Redirect to a special login handler page
    return NextResponse.redirect(
      new URL(`/auth/magic-login-handler?redirect=${encodeURIComponent(redirect || '/dashboard')}`, req.url)
    )
  } catch (error) {
    console.error('Magic login error:', error)
    return NextResponse.redirect(new URL('/auth/signin?error=ServerError', req.url))
  }
}