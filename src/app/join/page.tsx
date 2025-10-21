'use client'

export const dynamic = 'force-dynamic'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'

function JoinContent() {
  const searchParams = useSearchParams()
  const invitationId = searchParams.get('invitation')
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (invitationId) {
      fetchInvitation()
    } else {
      // No invitation ID, set loading to false for general signup
      setLoading(false)
    }
  }, [invitationId])

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`)
      if (response.ok) {
        const data = await response.json()
        setInvitation(data)
        setEmail(data.email)
      } else {
        setMessage('Invalid or expired invitation')
      }
    } catch (error) {
      setMessage('Error loading invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Sign in with email - this will send a magic link
    const callbackUrl = invitationId ? `/onboard?invitation=${invitationId}` : '/onboard'
    const result = await signIn('email', {
      email: email,
      callbackUrl,
      redirect: false
    })

    if (result?.ok) {
      setMessage('Magic link sent! Check your email to continue.')
    } else {
      setMessage('Error sending magic link. Please try again.')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">
          {invitationId ? 'Loading invitation...' : 'Loading...'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Join Clout Careers
            </h1>
            {invitation ? (
              <p className="text-gray-600">
                You've been invited by <strong>{invitation.senderEmail}</strong>
                <br />
                with a trust score of <strong>{invitation.trustScore}/10</strong>
              </p>
            ) : invitationId ? (
              <div className="text-center text-red-600">
                {message || 'Invalid invitation link'}
              </div>
            ) : (
              <p className="text-gray-600">
                Join our trusted professional referral network
              </p>
            )}
          </div>

          {invitationId && !invitation ? (
            <div className="text-center text-red-600">
              {message || 'Invalid invitation link'}
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!!invitation}
                  required
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    invitation ? 'bg-gray-50' : 'bg-white'
                  }`}
                  placeholder={invitation ? '' : 'Enter your email address'}
                />
                {invitation ? (
                  <p className="text-xs text-gray-500 mt-1">
                    This email was invited to join the platform
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send you a magic link to join
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>What happens next:</strong>
                  <br />
                  1. We'll send you a magic link to sign in
                  <br />
                  2. You'll complete your profile
                  <br />
                  {invitation ? (
                    <>3. You can set your own trust score for {invitation.senderEmail}</>
                  ) : (
                    <>3. You can start building your professional network</>
                  )}
                </p>
              </div>

              {message && (
                <div className={`text-center text-sm p-3 rounded-md ${
                  message.includes('sent')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Already have an account?{' '}
                  <a href="/auth/signin" className="text-indigo-600 hover:text-indigo-500">
                    Sign in here
                  </a>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Join() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <JoinContent />
    </Suspense>
  )
}