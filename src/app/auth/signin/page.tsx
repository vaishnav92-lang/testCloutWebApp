'use client'

import { signIn, getSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token')

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      // If there's an invite token, validate the email first
      if (inviteToken) {
        const response = await fetch('/api/auth/validate-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, inviteToken })
        })

        const data = await response.json()

        if (!data.valid) {
          setMessage(data.message || 'Invalid invitation')
          setIsLoading(false)
          return
        }
      }

      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: inviteToken ? `/onboard?token=${inviteToken}` : '/dashboard'
      })

      if (result?.ok) {
        setMessage('Check your email for a magic link!')
      } else {
        setMessage('Something went wrong. Please try again.')
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again.')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {inviteToken ? 'Complete Your Invitation' : 'Sign in to Clout Careers'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {inviteToken
              ? 'Enter your email to activate your account'
              : 'Enter your email to receive a magic link'
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
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
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email address"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Magic Link'}
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
      </div>
    </div>
  )
}