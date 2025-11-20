import { NextResponse } from 'next/server'

/**
 * Demo login endpoint
 * Generates a simple demo token for session-based tracking
 * No database validation needed
 */
export async function POST() {
  try {
    // Generate a simple demo token
    const token = Buffer.from(
      JSON.stringify({
        userId: 'user-1',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        isDemo: true,
        createdAt: new Date().toISOString(),
      })
    ).toString('base64')

    return NextResponse.json(
      {
        success: true,
        token,
        message: 'Demo session started',
      },
      {
        headers: {
          'Set-Cookie': `demoToken=${token}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=Strict`,
        },
      }
    )
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json(
      { error: 'Failed to start demo session' },
      { status: 500 }
    )
  }
}
