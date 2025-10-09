'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'

export default function JoinWithReferral() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const referralCode = params.referralCode as string

  const [referrerInfo, setReferrerInfo] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoadingReferrer, setIsLoadingReferrer] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
      return
    }

    // Fetch referrer info
    const fetchReferrer = async () => {
      try {
        const response = await fetch(`/api/referral/info/${referralCode}`)
        const data = await response.json()

        if (data.referrer) {
          setReferrerInfo(data.referrer)
        } else {
          setMessage('Invalid referral link')
        }
      } catch (error) {
        setMessage('Error loading referral information')
      }
      setIsLoadingReferrer(false)
    }

    fetchReferrer()
  }, [referralCode, status, router])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      // First, create a referral request
      const response = await fetch('/api/referral/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          referralCode
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Now trigger the sign-in flow
        const result = await signIn('email', {
          email,
          redirect: false,
          callbackUrl: '/onboard'
        })

        if (result?.ok) {
          setMessage('Check your email for a magic link to join!')
        } else {
          setMessage('Something went wrong. Please try again.')
        }
      } else {
        setMessage(data.error || 'Something went wrong')
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again.')
    }

    setIsLoading(false)
  }

  if (isLoadingReferrer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!referrerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Referral Link
          </h2>
          <p className="text-gray-600 mb-6">
            This referral link is not valid or has expired.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Join Clout Careers
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            <span className="font-medium text-indigo-600">
              {referrerInfo.firstName} {referrerInfo.lastName}
            </span>{' '}
            invited you to join our professional referral network
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {referrerInfo.bio && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600 italic">
                "{referrerInfo.bio}"
              </p>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Join via Magic Link'}
              </button>
            </div>

            {message && (
              <div className={`text-center text-sm ${
                message.includes('Check your email') ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </div>
            )}
          </form>

          <div className="mt-6 text-xs text-center text-gray-500">
            By joining, you agree to our terms of service and privacy policy.
          </div>
        </div>
      </div>
    </div>
  )
}