'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import NetworkInfluenceChart from '@/components/NetworkInfluenceChart'
import AdminInviteUsers from '@/components/AdminInviteUsers'

interface User {
  id: string
  displayName: string
}

interface Allocation {
  receiverId: string
  receiverName: string
  proportion: number
}

interface AllocationInput {
  receiverId: string
  proportion: number
}

export default function AdminTrustAllocationsPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [currentAllocations, setCurrentAllocations] = useState<Allocation[]>([])
  const [allocations, setAllocations] = useState<AllocationInput[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isAdmin = session?.user?.isAdmin === true

  useEffect(() => {
    if (status === 'loading') return

    if (!session || !isAdmin) {
      redirect('/dashboard')
      return
    }

    fetchData()
  }, [session, status, isAdmin])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/trust-allocations')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data')
      }

      setUsers(data.allUsers)
      setCurrentAllocations(data.currentAllocations)

      // Initialize allocations with current values or equal distribution
      if (data.currentAllocations.length > 0) {
        setAllocations(data.currentAllocations.map((a: Allocation) => ({
          receiverId: a.receiverId,
          proportion: a.proportion
        })))
      } else {
        // Initialize with equal allocation
        const equalProportion = 1.0 / data.allUsers.length
        setAllocations(data.allUsers.map((user: User) => ({
          receiverId: user.id,
          proportion: equalProportion
        })))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const updateAllocation = (receiverId: string, proportion: number) => {
    setAllocations(prev => {
      const existingIndex = prev.findIndex(a => a.receiverId === receiverId)
      const clampedProportion = Math.max(0, Math.min(1, proportion))

      if (existingIndex >= 0) {
        // Update existing allocation
        return prev.map(a =>
          a.receiverId === receiverId
            ? { ...a, proportion: clampedProportion }
            : a
        )
      } else {
        // Add new allocation for user who didn't have one
        return [...prev, { receiverId, proportion: clampedProportion }]
      }
    })
  }

  const totalAllocation = allocations.reduce((sum, a) => sum + a.proportion, 0)
  const remainingAllocation = 1.0 - totalAllocation

  const saveAllocations = async () => {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      if (Math.abs(totalAllocation - 1.0) > 0.01) {
        setError(`Allocations must sum to 100%. Currently: ${(totalAllocation * 100).toFixed(1)}%`)
        return
      }

      const response = await fetch('/api/trust-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save allocations')
      }

      setMessage('✅ Trust allocations saved successfully! EigenTrust computation started in background.')

      // Refresh current allocations
      setTimeout(() => {
        fetchData()
        setMessage('')
      }, 2000)

    } catch (error) {
      console.error('Failed to save allocations:', error)
      setError(error instanceof Error ? error.message : 'Failed to save allocations')
    } finally {
      setSaving(false)
    }
  }

  const resetToEqual = () => {
    const equalProportion = 1.0 / users.length
    setAllocations(users.map(user => ({
      receiverId: user.id,
      proportion: equalProportion
    })))
  }

  const triggerComputation = async () => {
    try {
      setMessage('🔄 Triggering EigenTrust computation...')

      const response = await fetch('/api/admin/eigentrust/compute', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger computation')
      }

      setMessage(`✅ Computation complete! ${data.iterations} iterations, converged: ${data.converged}`)

      setTimeout(() => setMessage(''), 3000)

    } catch (error) {
      console.error('Failed to trigger computation:', error)
      setError(error instanceof Error ? error.message : 'Failed to trigger computation')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading trust allocation data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Trust Allocations</h1>
          <p className="mt-2 text-sm text-gray-600">
            Allocate your trust across all users. Proportions must sum to 100%.
          </p>
        </div>

        {/* Status Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Enhanced Trust Allocation Summary */}
        <div className={`mb-6 p-6 border-2 rounded-lg ${
          Math.abs(remainingAllocation) < 0.01
            ? 'bg-green-50 border-green-300'
            : remainingAllocation > 0
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <div className="text-2xl font-bold">
                  <span className={Math.abs(remainingAllocation) < 0.01 ? 'text-green-700' : 'text-gray-700'}>
                    {(totalAllocation * 100).toFixed(1)}%
                  </span>
                  <span className="text-lg text-gray-500"> / 100%</span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 max-w-xs">
                  <div
                    className={`h-4 rounded-full transition-all duration-300 ${
                      Math.abs(remainingAllocation) < 0.01
                        ? 'bg-green-500'
                        : remainingAllocation > 0
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(totalAllocation * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-sm">
                {Math.abs(remainingAllocation) < 0.01 ? (
                  <span className="text-green-700 font-medium">
                    ✅ Perfect allocation! All 100% trust distributed across {users.length} users
                  </span>
                ) : remainingAllocation > 0 ? (
                  <span className="text-yellow-700 font-medium">
                    ⚠️ Need {Math.abs(remainingAllocation * 100).toFixed(1)}% more to reach 100%
                  </span>
                ) : (
                  <span className="text-red-700 font-medium">
                    ❌ Over allocated by {Math.abs(remainingAllocation * 100).toFixed(1)}% - reduce allocations
                  </span>
                )}
              </div>
            </div>

            <div className="space-x-2">
              <button
                onClick={resetToEqual}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Reset to Equal
                <div className="text-xs text-gray-300">
                  ({(100/users.length).toFixed(2)}% each)
                </div>
              </button>
              <button
                onClick={triggerComputation}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Compute Scores
              </button>
            </div>
          </div>

          {/* Quick allocation stats */}
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 border-t pt-3">
            <div>
              <span className="font-medium">Users:</span> {users.length}
            </div>
            <div>
              <span className="font-medium">Avg per user:</span> {users.length > 0 ? (totalAllocation * 100 / users.length).toFixed(2) : 0}%
            </div>
            <div>
              <span className="font-medium">Equal share:</span> {users.length > 0 ? (100 / users.length).toFixed(2) : 0}%
            </div>
          </div>
        </div>

        {/* Allocations Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Trust Allocations ({users.length} users)
            </h3>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {users.map((user) => {
                const allocation = allocations.find(a => a.receiverId === user.id)
                const proportion = allocation?.proportion || 0

                return (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{user.displayName}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.001"
                        value={proportion}
                        onChange={(e) => updateAllocation(user.id, parseFloat(e.target.value))}
                        className="w-32"
                      />

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={(proportion * 100).toFixed(1)}
                        onChange={(e) => updateAllocation(user.id, parseFloat(e.target.value) / 100)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={saveAllocations}
                disabled={saving || Math.abs(totalAllocation - 1.0) > 0.01}
                className={`px-6 py-2 rounded-md font-medium ${
                  saving || Math.abs(totalAllocation - 1.0) > 0.01
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? 'Saving...' : 'Save Allocations'}
              </button>
            </div>
          </div>
        </div>

        {/* Current Allocations Display */}
        {currentAllocations.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Current Saved Allocations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentAllocations
                  .filter(a => a.proportion > 0.001)
                  .sort((a, b) => b.proportion - a.proportion)
                  .map((allocation) => (
                    <div key={allocation.receiverId} className="p-3 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-900">{allocation.receiverName}</div>
                      <div className="text-sm text-gray-600">{(allocation.proportion * 100).toFixed(1)}%</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Network Influence Chart */}
        <div className="mt-8">
          <NetworkInfluenceChart />
        </div>

        {/* Admin Invite Users */}
        <div className="mt-8">
          <AdminInviteUsers />
        </div>
      </div>
    </div>
  )
}