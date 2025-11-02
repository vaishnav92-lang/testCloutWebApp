/**
 * GRANT TRUST ALLOCATOR
 *
 * Adapted from TrustNetworkManager for allocating trust to grant applicants
 * Reuses the same pattern: 0-100 scale, visual allocator, rebalance option
 */

'use client'

import { useState, useEffect, useMemo } from 'react'

interface GrantApplicant {
  id: string
  firstName?: string
  lastName?: string
  email: string
  profileImage?: string
}

interface GrantTrustAllocatorProps {
  grantRoundId: string
  applicants?: GrantApplicant[]
}

export default function GrantTrustAllocator({
  grantRoundId,
  applicants: initialApplicants = [],
}: GrantTrustAllocatorProps) {
  const [applicants, setApplicants] = useState<GrantApplicant[]>(initialApplicants)
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Calculate total allocated (using 0-100 scale like TrustNetworkManager)
  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + val, 0)
  }, [allocations])

  const remainingTrust = 100 - totalAllocated

  // Load applicants and existing allocations
  useEffect(() => {
    fetchApplicantsAndAllocations()
  }, [grantRoundId])

  const fetchApplicantsAndAllocations = async () => {
    try {
      setLoading(true)

      // Fetch other applicants
      const applicantsRes = await fetch(`/api/grants/applicants?roundId=${grantRoundId}`)
      if (applicantsRes.ok) {
        const applicantsData = await applicantsRes.json()
        setApplicants(applicantsData.applicants || [])
      }

      // Fetch existing allocations
      const allocRes = await fetch(`/api/grants/trust-allocations?roundId=${grantRoundId}`)
      if (allocRes.ok) {
        const allocData = await allocRes.json()
        const allocs: Record<string, number> = {}
        allocData.allocations?.forEach((alloc: any) => {
          // Convert from 0-1 scale to 0-100 scale (matching TrustNetworkManager)
          allocs[alloc.toApplicationId] = Math.round(alloc.trustScore * 100)
        })
        setAllocations(allocs)
      }
    } catch (error) {
      console.error('Error fetching allocations:', error)
      setMessage('Failed to load allocations')
    } finally {
      setLoading(false)
    }
  }

  // Same pattern as TrustNetworkManager
  const handleAllocationChange = (applicantId: string, newValue: number) => {
    const value = Math.max(0, Math.min(100, newValue))

    const otherAllocations = Object.entries(allocations)
      .filter(([id]) => id !== applicantId)
      .reduce((sum, [_, val]) => sum + val, 0)

    if (otherAllocations + value > 100) {
      const maxAllowed = 100 - otherAllocations
      setAllocations((prev) => ({ ...prev, [applicantId]: maxAllowed }))
      setMessage(`Maximum allocation for this applicant is ${maxAllowed} points`)
      setTimeout(() => setMessage(''), 3000)
    } else {
      setAllocations((prev) => ({ ...prev, [applicantId]: value }))
    }
  }

  // Rebalance equally
  const handleRebalance = () => {
    if (applicants.length === 0) return

    const perApplicant = Math.floor(100 / applicants.length)
    const remainder = 100 % applicants.length

    const newAllocations: Record<string, number> = {}

    applicants.forEach((applicant, idx) => {
      newAllocations[applicant.id] = perApplicant + (idx < remainder ? 1 : 0)
    })

    setAllocations(newAllocations)
    setMessage('Trust rebalanced equally across applicants')
    setTimeout(() => setMessage(''), 3000)
  }

  // Save allocations
  const handleSaveAllocations = async () => {
    setSaving(true)
    setMessage('')

    try {
      // Save each allocation (convert from 0-100 to 0-1 scale)
      const savePromises = applicants
        .filter((app) => (allocations[app.id] || 0) > 0)
        .map((app) =>
          fetch('/api/grants/trust-allocations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grantRoundId,
              toApplicationId: app.id,
              trustScore: (allocations[app.id] || 0) / 100, // Convert to 0-1 scale
            }),
          })
        )

      const responses = await Promise.all(savePromises)

      if (responses.some((r) => !r.ok)) {
        throw new Error('Failed to save some allocations')
      }

      setMessage('Trust allocations saved successfully!')
      setShowSuccess(true)
      setTimeout(() => {
        setMessage('')
        setShowSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error saving allocations:', error)
      setMessage(error instanceof Error ? error.message : 'Failed to save allocations')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading allocations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Allocate Trust to Applicants</h3>
        <p className="text-sm text-blue-800">
          Distribute 100 trust points among applicants based on your confidence in their work.
          <br />
          Your allocations help the EigenTrust algorithm make fair funding decisions.
        </p>
      </div>

      {/* Trust Allocations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Trust Allocation</h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">Allocated: {totalAllocated}/100</p>
            <p className="text-sm font-semibold text-gray-900">Remaining: {remainingTrust}</p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              showSuccess
                ? 'bg-green-50 border border-green-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <p
              className={`text-sm ${
                showSuccess ? 'text-green-700' : 'text-blue-700'
              }`}
            >
              {message}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${Math.min(totalAllocated, 100)}%` }}
            />
          </div>
        </div>

        {/* Allocations */}
        <div className="space-y-4 mb-6">
          {applicants.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No applicants to allocate trust to</p>
            </div>
          ) : (
            applicants.map((applicant) => (
              <div
                key={applicant.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4 mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {applicant.firstName} {applicant.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{applicant.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={allocations[applicant.id] || 0}
                      onChange={(e) =>
                        handleAllocationChange(
                          applicant.id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={allocations[applicant.id] || 0}
                      onChange={(e) =>
                        handleAllocationChange(
                          applicant.id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {allocations[applicant.id] || 0}
                    </span>
                  </div>
                </div>

                {/* Visual bar (matching TrustNetworkManager style) */}
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${allocations[applicant.id] || 0}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleRebalance}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Rebalance Equally
          </button>
          <button
            onClick={handleSaveAllocations}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Allocations'}
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-3">How This Works</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>✓ Your 100 trust points represent confidence in each applicant</li>
          <li>✓ All allocations are combined using the EigenTrust algorithm</li>
          <li>✓ Trust flows through the network to compute final scores</li>
          <li>✓ Higher scores lead to larger funding recommendations</li>
        </ul>
      </div>
    </div>
  )
}
