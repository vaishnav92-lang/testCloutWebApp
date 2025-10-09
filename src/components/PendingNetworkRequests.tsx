/**
 * PENDING NETWORK REQUESTS COMPONENT
 *
 * Displays incoming "Add to Trusted Network" requests that need user response.
 * Users can accept (with trust score) or decline these requests.
 */

'use client'

import { useState, useEffect } from 'react'

interface PendingRequest {
  id: string
  status: string
  connectedUser: {
    id: string
    name: string
    email: string
  }
  canValidate: boolean
  createdAt: string
}

export default function PendingNetworkRequests() {
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showTrustModal, setShowTrustModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null)
  const [trustScore, setTrustScore] = useState(5)

  useEffect(() => {
    fetchPendingRequests()
  }, [])

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('/api/user/relationships')
      if (response.ok) {
        const data = await response.json()
        // Filter for pending requests where user can validate
        const pending = (data.connections || []).filter(
          (conn: any) => conn.status === 'PENDING' && conn.canValidate
        )
        setRequests(pending)
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = (request: PendingRequest) => {
    setSelectedRequest(request)
    setShowTrustModal(true)
  }

  const confirmAccept = async () => {
    if (!selectedRequest) return

    setProcessingId(selectedRequest.id)
    try {
      const response = await fetch(`/api/relationships/validate/${selectedRequest.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          trustScore
        })
      })

      if (response.ok) {
        await fetchPendingRequests()
        setShowTrustModal(false)
        setSelectedRequest(null)
        setTrustScore(5)
      }
    } catch (error) {
      console.error('Error accepting request:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (requestId: string) => {
    if (!confirm('Are you sure you want to decline this network request?')) return

    setProcessingId(requestId)
    try {
      const response = await fetch(`/api/relationships/validate/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline'
        })
      })

      if (response.ok) {
        await fetchPendingRequests()
      }
    } catch (error) {
      console.error('Error declining request:', error)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (requests.length === 0) {
    return null // Don't show the card if there are no pending requests
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-amber-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              🔔 Pending Network Requests
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              People who want to add you to their trusted network
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
            {requests.length} pending
          </span>
        </div>

        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center">
                  <span className="text-amber-800 text-sm font-medium">
                    {request.connectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {request.connectedUser.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {request.connectedUser.email}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Requested {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(request)}
                  disabled={processingId === request.id}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {processingId === request.id ? 'Processing...' : 'Accept'}
                </button>
                <button
                  onClick={() => handleDecline(request.id)}
                  disabled={processingId === request.id}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Score Modal */}
      {showTrustModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add {selectedRequest.connectedUser.name} to Your Trusted Network
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How much do you trust {selectedRequest.connectedUser.name}? ({trustScore}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={trustScore}
                onChange={(e) => setTrustScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 (Low Trust)</span>
                <span>10 (High Trust)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This score is private and helps improve network recommendations
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTrustModal(false)
                  setSelectedRequest(null)
                }}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAccept}
                disabled={processingId !== null}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {processingId ? 'Adding...' : 'Add to Network'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}