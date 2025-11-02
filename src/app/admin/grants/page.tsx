/**
 * GRANT ADMIN DASHBOARD
 *
 * Admin interface for managing grant rounds and allocations
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface GrantRound {
  id: string
  name: string
  description?: string
  status: string
  totalFunding: number
  minimumGrantSize: number
  startDate?: string
  endDate?: string
  applications: any[]
  _count?: {
    applications: number
  }
}

interface AllocationResult {
  id: string
  applicantName: string
  allocatedTrust: number
  recommendedFunding: number
}

export default function GrantAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [grantRounds, setGrantRounds] = useState<GrantRound[]>([])
  const [selectedRound, setSelectedRound] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [allocating, setAllocating] = useState(false)
  const [allocationResults, setAllocationResults] = useState<AllocationResult[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [newRound, setNewRound] = useState({
    name: '',
    description: '',
    totalFunding: 50000,
    minimumGrantSize: 1000,
  })
  const [showNewRound, setShowNewRound] = useState(false)
  const [creatingRound, setCreatingRound] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
    }

    if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/dashboard')
    }
  }, [status, session])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGrantRounds()
    }
  }, [status])

  const fetchGrantRounds = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/grants/rounds')
      if (res.ok) {
        const data = await res.json()
        setGrantRounds(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading grants')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRound = async () => {
    setCreatingRound(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/grants/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRound,
          status: 'PHASE_ONE_VETTING',
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create grant round')
      }

      setSuccess('Grant round created successfully!')
      setNewRound({
        name: '',
        description: '',
        totalFunding: 50000,
        minimumGrantSize: 1000,
      })
      setShowNewRound(false)

      fetchGrantRounds()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating grant round')
    } finally {
      setCreatingRound(false)
    }
  }

  const handleAdvancePhase = async () => {
    if (!selectedRound) {
      setError('Please select a grant round')
      return
    }

    const round = grantRounds.find((r) => r.id === selectedRound)
    if (!round) return

    // Map current phase to next phase
    const phaseMap: Record<string, string> = {
      PHASE_ONE_VETTING: 'PHASE_TWO_PREDICTIONS',
      PHASE_TWO_PREDICTIONS: 'PHASE_THREE_REINFORCEMENT',
      PHASE_THREE_REINFORCEMENT: 'FINAL_ALLOCATION',
    }

    const nextPhase = phaseMap[round.status]
    if (!nextPhase) {
      setError('Grant round is already in final phase')
      return
    }

    setAllocating(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/grants/rounds/${selectedRound}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextPhase }),
      })

      if (!res.ok) {
        throw new Error('Failed to advance phase')
      }

      setSuccess(`Advanced grant round to ${nextPhase}`)
      fetchGrantRounds()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error advancing phase')
    } finally {
      setAllocating(false)
    }
  }

  const handleComputeAllocations = async () => {
    if (!selectedRound) {
      setError('Please select a grant round')
      return
    }

    setAllocating(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/grants/compute-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantRoundId: selectedRound }),
      })

      if (!res.ok) {
        throw new Error('Failed to compute allocations')
      }

      const results = await res.json()
      setAllocationResults(results)
      setSuccess('Allocations computed successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error computing allocations')
    } finally {
      setAllocating(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!session?.user?.isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block">
              ← Back to Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Grant Management</h1>
            <p className="text-gray-600 mt-1">Create and manage grant rounds</p>
          </div>
          <button
            onClick={() => setShowNewRound(!showNewRound)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Grant Round
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Create New Round Form */}
        {showNewRound && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Grant Round</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newRound.name}
                  onChange={(e) => setNewRound({ ...newRound, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Climate Research 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Funding ($)
                </label>
                <input
                  type="number"
                  value={newRound.totalFunding}
                  onChange={(e) =>
                    setNewRound({ ...newRound, totalFunding: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Grant Size ($)
                </label>
                <input
                  type="number"
                  value={newRound.minimumGrantSize}
                  onChange={(e) =>
                    setNewRound({ ...newRound, minimumGrantSize: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRound.description}
                  onChange={(e) => setNewRound({ ...newRound, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Grant description and goals"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateRound}
                disabled={creatingRound || !newRound.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingRound ? 'Creating...' : 'Create Round'}
              </button>
              <button
                onClick={() => setShowNewRound(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Grant Rounds List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Grant Rounds</h2>

          {grantRounds.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No grant rounds created yet</p>
              <button
                onClick={() => setShowNewRound(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                Create the first one →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {grantRounds.map((round) => (
                <div
                  key={round.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedRound(round.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{round.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{round.description}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {round.status}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-3 text-sm text-gray-600">
                    <span>${round.totalFunding.toLocaleString()}</span>
                    <span>{round._count?.applications || 0} applications</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advance Phase */}
        {selectedRound && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Grant Round Phase Management</h2>

            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-4">
                Advance the grant round through different phases:
              </p>
              <div className="space-y-2 text-sm text-gray-700 mb-4">
                <p>
                  <strong>Phase 1 - Vetting:</strong> Applicants submit their work and contributions
                </p>
                <p>
                  <strong>Phase 2 - Predictions:</strong> Applicants allocate trust to each other
                </p>
                <p>
                  <strong>Phase 3 - Reinforcement:</strong> Community reinforces predictions
                </p>
                <p>
                  <strong>Final - Allocation:</strong> EigenTrust computes funding recommendations
                </p>
              </div>

              <button
                onClick={handleAdvancePhase}
                disabled={allocating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {allocating ? 'Advancing...' : 'Advance to Next Phase'}
              </button>
            </div>
          </div>
        )}

        {/* Compute Allocations */}
        {selectedRound && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Trust-Based Allocations</h2>

            <p className="text-gray-600 text-sm mb-4">
              Compute funding recommendations based on trust allocations from all applicants.
              This will use the EigenTrust algorithm to distribute trust through the network.
            </p>

            <button
              onClick={handleComputeAllocations}
              disabled={allocating}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {allocating ? 'Computing...' : 'Compute Allocations'}
            </button>

            {allocationResults.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recommended Allocations</h3>
                <div className="space-y-3">
                  {allocationResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{result.applicantName}</p>
                          <p className="text-sm text-gray-600">
                            Trust Score: {(result.allocatedTrust * 100).toFixed(1)}%
                          </p>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          ${result.recommendedFunding.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-bold text-blue-900 mb-2">About Grant Management</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Create grant rounds with funding pools and minimum grant sizes</li>
            <li>• Applicants submit work samples and allocate trust to others</li>
            <li>• Use EigenTrust algorithm to compute fair allocations based on network trust</li>
            <li>• Grantmakers review recommendations before final approval</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
