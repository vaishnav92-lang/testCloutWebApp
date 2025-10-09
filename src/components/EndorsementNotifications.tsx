/**
 * ENDORSEMENT NOTIFICATIONS COMPONENT
 *
 * Shows notifications for endorsements received by the current user.
 * Displays pending endorsements that need a decision from the candidate.
 *
 * Features:
 * - Shows endorser information (not content)
 * - Highlights pending endorsements requiring action
 * - Links to decision page
 * - Clear privacy messaging
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ReceivedEndorsement {
  id: string
  endorser: {
    name: string
    email: string
  }
  status: string
  createdAt: string
  needsAction: boolean
}

interface EndorsementNotificationsProps {
  className?: string
}

export default function EndorsementNotifications({ className = '' }: EndorsementNotificationsProps) {
  const [endorsements, setEndorsements] = useState<ReceivedEndorsement[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchReceivedEndorsements = async () => {
      try {
        const response = await fetch('/api/user/received-endorsements')
        if (response.ok) {
          const data = await response.json()
          setEndorsements(data.endorsements)
          setPendingCount(data.pendingCount)
        }
      } catch (error) {
        console.error('Error fetching received endorsements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReceivedEndorsements()
  }, [])

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-gray-500">Loading endorsements...</div>
      </div>
    )
  }

  if (endorsements.length === 0) {
    return null // Don't show anything if no endorsements
  }

  const pendingEndorsements = endorsements.filter(e => e.needsAction)

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">
          Endorsements About You
        </h3>
        {pendingCount > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {pendingCount} pending decision{pendingCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {pendingCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Action Required
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                You have endorsements waiting for your decision. <strong>You won't see the endorsement content</strong> - only choose how to use them.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {pendingEndorsements.map((endorsement) => (
          <div key={endorsement.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{endorsement.endorser.name}</span>
                <span className="text-sm text-gray-500">wrote an endorsement about you</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(endorsement.createdAt).toLocaleDateString()} • Privacy protected - content not visible to you
              </p>
            </div>
            <button
              onClick={() => router.push(`/endorsements/${endorsement.id}/decide`)}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
            >
              Choose Privacy
            </button>
          </div>
        ))}

        {endorsements.filter(e => !e.needsAction).map((endorsement) => (
          <div key={endorsement.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{endorsement.endorser.name}</span>
                <span className="text-sm text-gray-500">endorsed you</span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  endorsement.status === 'PRIVATE' ? 'bg-blue-100 text-blue-800' :
                  endorsement.status === 'ACTIVE_MATCHING' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {endorsement.status === 'PRIVATE' ? 'Private Mode' :
                   endorsement.status === 'ACTIVE_MATCHING' ? 'Active Matching' :
                   'Not Using'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(endorsement.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push(`/endorsements/${endorsement.id}/decide`)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              Change Privacy
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 italic">
        For your privacy, endorsement content is never shown to you. You only control who can see them.
      </div>
    </div>
  )
}