/**
 * RELATIONSHIP VALIDATION PAGE
 *
 * This page allows users to accept or decline relationship invitations.
 * It's accessed via email links sent when someone wants to add them to their trusted network.
 *
 * Flow:
 * 1. User clicks validation link in email
 * 2. If not logged in, redirects to sign-in with callback
 * 3. After login, shows relationship details and trust score slider
 * 4. User can accept (with trust score) or decline
 * 5. Redirects to dashboard with success message
 *
 * Key features:
 * - Auto-authentication flow with proper redirects
 * - Privacy-protected display (no sender trust score shown)
 * - Trust score collection (1-10 scale)
 * - Real-time form validation and submission
 * - Success/error state management
 */

'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ValidateRelationship() {
  // HOOKS AND STATE MANAGEMENT
  const { data: session, status } = useSession()     // NextAuth session management
  const router = useRouter()                         // Next.js navigation
  const params = useParams()                         // URL parameters
  const relationshipId = params.id as string         // Extract relationship ID from URL

  // Component state for relationship validation
  const [relationship, setRelationship] = useState<any>(null)  // Relationship details from API
  const [loading, setLoading] = useState(true)                 // Initial data loading state
  const [submitting, setSubmitting] = useState(false)         // Form submission state
  const [trustScore, setTrustScore] = useState(5)              // User's trust score (1-10)
  const [message, setMessage] = useState('')                  // Success message
  const [error, setError] = useState('')                      // Error message

  // AUTHENTICATION AND DATA LOADING EFFECT
  useEffect(() => {
    // Handle unauthenticated users
    if (status === 'unauthenticated') {
      // Redirect to sign in with callback to this validation page
      // This ensures user returns here after successful login
      signIn('email', {
        callbackUrl: `/relationships/validate/${relationshipId}`
      })
      return
    }

    // Load relationship data once authenticated
    if (status === 'authenticated' && session) {
      fetchRelationship()
    }
  }, [status, session, relationshipId])

  // FETCH RELATIONSHIP DATA
  // Loads relationship details from API for validation display
  const fetchRelationship = async () => {
    try {
      // Call GET endpoint to fetch relationship details
      const response = await fetch(`/api/relationships/validate/${relationshipId}`)
      const data = await response.json()

      if (response.ok) {
        // Store relationship data (sender info, status, etc.)
        setRelationship(data)
      } else {
        // Handle API errors (unauthorized, not found, etc.)
        setError(data.error || 'Failed to load relationship')
      }
    } catch (error) {
      // Handle network or parsing errors
      setError('Something went wrong. Please try again.')
    } finally {
      // Always stop loading spinner
      setLoading(false)
    }
  }

  // HANDLE ACCEPT/DECLINE ACTION
  // Processes user's decision to accept or decline the relationship
  const handleAction = async (action: 'accept' | 'decline') => {
    // Set loading state and clear previous messages
    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      // Submit decision to validation API endpoint
      const response = await fetch(`/api/relationships/validate/${relationshipId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,                                           // 'accept' or 'decline'
          trustScore: action === 'accept' ? trustScore : undefined  // Only send trust score when accepting
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Show success message
        setMessage(data.message)
        // Redirect to dashboard after 2 seconds with success indicator
        // The ?validated=true param triggers success notification on dashboard
        setTimeout(() => {
          router.push('/dashboard?validated=true')
        }, 2000)
      } else {
        // Handle API errors (validation failed, already processed, etc.)
        setError(data.error || 'Something went wrong')
      }
    } catch (error) {
      // Handle network or parsing errors
      setError('Something went wrong. Please try again.')
    } finally {
      // Always reset submitting state
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error && !relationship) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (message) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-green-600 mb-4">Success!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Relationship Invitation
            </h1>
            <p className="mt-2 text-gray-600">
              {relationship?.sender?.name} wants to connect with you professionally
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">From:</h3>
              <p className="text-lg text-gray-900">{relationship?.sender?.name}</p>
              <p className="text-sm text-gray-500">{relationship?.sender?.email}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Your Response:</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trust Score: {trustScore}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={trustScore}
                    onChange={(e) => setTrustScore(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 (Low Trust)</span>
                    <span>10 (High Trust)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This score is private and helps improve recommendations
                  </p>
                </div>

                {error && (
                  <div className="text-center text-sm p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAction('accept')}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : 'Accept & Connect'}
                  </button>

                  <button
                    onClick={() => handleAction('decline')}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : 'Decline'}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Building trusted professional networks • Clout Careers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}