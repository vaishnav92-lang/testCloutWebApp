/**
 * ENDORSEMENT DECISION PAGE
 *
 * This page allows candidates to decide how to use endorsements written about them.
 * It's accessed via email links sent when someone writes an endorsement.
 *
 * Flow:
 * 1. Candidate clicks decision link in email
 * 2. Page loads endorsement details (who endorsed them, not content)
 * 3. Candidate chooses visibility mode: Private, Active Matching, or Not Using
 * 4. Updates endorsement status and redirects with confirmation
 *
 * Key features:
 * - Shows endorser information (name, company if available)
 * - Does NOT show endorsement content (privacy protection)
 * - Three clear decision options with explanations
 * - Updates endorsement status in database
 * - Success confirmation and redirect
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type EndorsementStatus = 'PRIVATE' | 'ACTIVE_MATCHING' | 'NOT_USING'

interface Endorsement {
  id: string
  endorser: {
    name: string
    email: string
    company?: string
  }
  status: string
  createdAt: string
}

export default function EndorsementDecision() {
  const params = useParams()
  const router = useRouter()
  const endorsementId = params.id as string

  const [endorsement, setEndorsement] = useState<Endorsement | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<EndorsementStatus>('PRIVATE')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Load endorsement details
  useEffect(() => {
    const fetchEndorsement = async () => {
      try {
        const response = await fetch(`/api/endorsements/${endorsementId}`)
        const data = await response.json()

        if (response.ok) {
          setEndorsement(data)
          // Set initial choice to current status if already decided
          if (data.status && data.status !== 'PENDING_CANDIDATE_ACTION') {
            setSelectedChoice(data.status as EndorsementStatus)
          }
        } else {
          setError(data.error || 'Endorsement not found')
        }
      } catch (error) {
        console.error('Error fetching endorsement:', error)
        setError('Failed to load endorsement details')
      } finally {
        setLoading(false)
      }
    }

    if (endorsementId) {
      fetchEndorsement()
    }
  }, [endorsementId])

  // Handle decision submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/endorsements/${endorsementId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice: selectedChoice })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirect after showing success message
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setError(data.error || 'Failed to update endorsement')
      }
    } catch (error) {
      console.error('Error submitting decision:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error && !endorsement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="text-green-400 text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Choice Saved!</h1>
            <p className="text-gray-600 mb-6">
              Your endorsement preferences have been updated successfully.
            </p>
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
              {endorsement?.status && endorsement.status !== 'PENDING_CANDIDATE_ACTION'
                ? 'Change Privacy Settings'
                : 'Endorsement Decision'}
            </h1>
            <p className="mt-2 text-gray-600">
              {endorsement?.endorser.name} has written an endorsement about you
            </p>
            {endorsement?.status && endorsement.status !== 'PENDING_CANDIDATE_ACTION' && (
              <p className="mt-1 text-sm text-gray-500">
                Currently: {endorsement.status === 'PRIVATE' ? 'Private Mode' :
                           endorsement.status === 'ACTIVE_MATCHING' ? 'Active Matching' :
                           'Not Using'}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">From:</h3>
              <p className="text-lg text-gray-900">{endorsement?.endorser.name}</p>
              <p className="text-sm text-gray-500">{endorsement?.endorser.email}</p>
              {endorsement?.endorser.company && (
                <p className="text-sm text-gray-500">{endorsement.endorser.company}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Written {new Date(endorsement?.createdAt || '').toLocaleDateString()}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  What would you like to do with this endorsement?
                </h3>

                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="choice"
                      value="PRIVATE"
                      checked={selectedChoice === 'PRIVATE'}
                      onChange={(e) => setSelectedChoice(e.target.value as EndorsementStatus)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Keep Private</div>
                      <div className="text-sm text-gray-600">
                        I'll decide when to share this with specific employers on a case-by-case basis
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="choice"
                      value="ACTIVE_MATCHING"
                      checked={selectedChoice === 'ACTIVE_MATCHING'}
                      onChange={(e) => setSelectedChoice(e.target.value as EndorsementStatus)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Let Clout Find Opportunities</div>
                      <div className="text-sm text-gray-600">
                        Use this to proactively match me with relevant roles and share with employers
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="choice"
                      value="NOT_USING"
                      checked={selectedChoice === 'NOT_USING'}
                      onChange={(e) => setSelectedChoice(e.target.value as EndorsementStatus)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Don't Use</div>
                      <div className="text-sm text-gray-600">
                        I prefer not to activate this endorsement right now
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="text-center text-sm p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Confirm Choice'}
              </button>
            </form>

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