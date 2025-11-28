'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface CandidateInterest {
  id: string
  status: string
  job: {
    id: string
    title: string
    description?: string
    location?: string
    company: {
      name: string
    }
  }
}

export default function InterestResponsePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [candidateInterest, setCandidateInterest] = useState<CandidateInterest | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetchCandidateInterest()
    }
  }, [status, params.id])

  const fetchCandidateInterest = async () => {
    try {
      const response = await fetch(`/api/candidate/interest-requests/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCandidateInterest(data)
      } else if (response.status === 404) {
        setMessage({ type: 'error', text: 'Interest request not found or already responded to' })
      } else {
        setMessage({ type: 'error', text: 'Failed to load interest request' })
      }
    } catch (error) {
      console.error('Error fetching candidate interest:', error)
      setMessage({ type: 'error', text: 'An error occurred while loading the interest request' })
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async () => {
    if (!selectedResponse || !candidateInterest) return

    setSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/candidate/interest-requests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: selectedResponse })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Thank you for your response! We\'ll be in touch if there\'s a match.' })
        // Disable further responses
        setCandidateInterest({ ...candidateInterest, status: selectedResponse })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit response' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while submitting your response' })
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  if (!candidateInterest && !message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Interest Request Not Found</h1>
          <p className="text-gray-600 mb-6">This interest request may have expired or already been responded to.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const responseOptions = [
    { value: 'VERY_EXCITED', label: 'Very exciting - would love to chat!', color: 'text-green-600' },
    { value: 'INTERESTED_TO_CHAT', label: 'Could be interesting - open to a conversation', color: 'text-blue-600' },
    { value: 'NOT_INTERESTED', label: 'Probably not my thing', color: 'text-gray-600' }
  ]

  const isAlreadyResponded = candidateInterest?.status !== 'PENDING'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Opportunity Interest Check</h1>
          </div>

          <div className="p-6">
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.text}
              </div>
            )}

            {candidateInterest && (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    We'd love to know your interest in this opportunity:
                  </h2>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {candidateInterest.job.title}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      <strong>Company:</strong> {candidateInterest.job.company.name}
                    </p>
                    {candidateInterest.job.location && (
                      <p className="text-gray-600 mb-2">
                        <strong>Location:</strong> {candidateInterest.job.location}
                      </p>
                    )}
                    {candidateInterest.job.description && (
                      <div className="mt-4">
                        <strong className="text-gray-900">About the role:</strong>
                        <p className="text-gray-700 mt-1">
                          {candidateInterest.job.description.substring(0, 400)}
                          {candidateInterest.job.description.length > 400 ? '...' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {isAlreadyResponded ? (
                  <div className="text-center py-8">
                    <div className="text-gray-600 mb-4">
                      ✅ You've already responded to this opportunity
                    </div>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        How interested are you in this opportunity?
                      </h3>

                      <div className="space-y-3">
                        {responseOptions.map((option) => (
                          <label
                            key={option.value}
                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                              ${selectedResponse === option.value
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <input
                              type="radio"
                              name="interest"
                              value={option.value}
                              checked={selectedResponse === option.value}
                              onChange={(e) => setSelectedResponse(e.target.value)}
                              className="mr-3 text-indigo-600"
                            />
                            <span className={`font-medium ${option.color}`}>
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleResponse}
                        disabled={!selectedResponse || submitting}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                      >
                        {submitting ? 'Submitting...' : 'Submit Response'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}