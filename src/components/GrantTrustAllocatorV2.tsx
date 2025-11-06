/**
 * GRANT TRUST ALLOCATOR V2 - Forked for Grants Subapp
 *
 * UI: Normalized % display with +1/+5/+25 buttons
 * Backend: 100-point system (same as TrustNetworkManager)
 * Storage: Normalized 0-1 scale for API
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

export default function GrantTrustAllocatorV2({
  grantRoundId,
  applicants: initialApplicants = [],
}: GrantTrustAllocatorProps) {
  const [applicants, setApplicants] = useState<GrantApplicant[]>(initialApplicants)
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Calculate total allocated (100-point scale)
  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + val, 0)
  }, [allocations])

  // Calculate normalized percentages for display
  const normalizedAllocations = useMemo(() => {
    if (totalAllocated === 0) return {}
    const normalized: Record<string, number> = {}
    for (const [id, value] of Object.entries(allocations)) {
      normalized[id] = (value / totalAllocated) * 100
    }
    return normalized
  }, [allocations, totalAllocated])

  // Sort applicants by allocation (largest first)
  const sortedApplicants = useMemo(() => {
    return [...applicants].sort((a, b) => {
      const aAlloc = allocations[a.id] || 0
      const bAlloc = allocations[b.id] || 0
      return bAlloc - aAlloc
    })
  }, [applicants, allocations])

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
          // Convert from 0-1 scale back to 0-100 scale
          allocs[alloc.toApplicationId] = Math.round(alloc.trustScore * 100)
        })
        setAllocations(allocs)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustAllocation = (applicantId: string, delta: number) => {
    setAllocations((prev) => {
      const newVal = Math.max(0, (prev[applicantId] || 0) + delta)
      return {
        ...prev,
        [applicantId]: newVal,
      }
    })
  }

  const handleClear = () => {
    setAllocations({})
  }

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
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error saving allocations')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-center">Loading applicants...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Allocate Trust to Others</h2>
      <p className="text-gray-600 text-sm mb-6">
        Distribute your trust among applicants based on confidence in their work.
        Adjust allocations using the buttons - percentages automatically normalize.
      </p>

      {/* Messages */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            showSuccess
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <p className={showSuccess ? 'text-green-700' : 'text-red-700'}>{message}</p>
        </div>
      )}

      {applicants.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No other applicants in this grant round</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Bar */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-900">
                <strong>Total Allocated:</strong> {totalAllocated} points
              </span>
              {totalAllocated > 0 && (
                <button
                  onClick={handleClear}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${Math.min((totalAllocated / 100) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Allocations sorted by size */}
          <div className="space-y-4">
            {sortedApplicants.map((applicant) => {
              const allocation = allocations[applicant.id] || 0
              const percentage = normalizedAllocations[applicant.id] || 0

              return (
                <div key={applicant.id} className="space-y-2">
                  {/* Name and percentage */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">
                        {applicant.firstName} {applicant.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{applicant.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {percentage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">{allocation} pts</div>
                    </div>
                  </div>

                  {/* Visual bar */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Control buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAdjustAllocation(applicant.id, -allocation)}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      disabled={allocation === 0}
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => handleAdjustAllocation(applicant.id, -5)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      disabled={allocation === 0}
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleAdjustAllocation(applicant.id, -1)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      disabled={allocation === 0}
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleAdjustAllocation(applicant.id, 1)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleAdjustAllocation(applicant.id, 5)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleAdjustAllocation(applicant.id, 25)}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 font-medium"
                    >
                      +25
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveAllocations}
            disabled={saving || totalAllocated === 0}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {saving ? 'Saving...' : `Save Allocations (${totalAllocated} points)`}
          </button>
        </div>
      )}
    </div>
  )
}
