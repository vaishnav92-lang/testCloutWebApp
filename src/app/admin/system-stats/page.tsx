'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface SystemStats {
  users: {
    total: number
    averageAllocatedTrust: number
    averageAvailableTrust: number
  }
  trustSystem: {
    totalTrustInSystem: number
    totalTrustAllocated: number
    totalTrustAvailable: number
    allocationRate: number
    topAllocators: Array<{
      id: string
      email: string
      name: string
      allocatedTrust: number
      availableTrust: number
      totalTrustPoints: number
    }>
    topReceivers: Array<{
      id: string
      email: string
      name: string
      totalTrustReceived: number
      relationshipCount: number
    }>
  }
  relationships: {
    total: number
    confirmed: number
    pending: number
    declined: number
  }
  invitations: {
    total: number
    pending: number
    accepted: number
    declined: number
    expired: number
  }
  endorsements: {
    total: number
    active: number
    pending: number
    inactive: number
  }
  jobs: {
    total: number
    active: number
    draft: number
    closed: number
  }
  timestamp: string
}

export default function SystemStatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Admin check
  const ADMIN_EMAIL = 'vaishnav@cloutcareers.com'
  const isAdmin = session?.user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (session && isAdmin) {
      fetchStats()
    }
  }, [session, isAdmin])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/system-stats')
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      } else {
        setError(data.error || 'Failed to fetch stats')
      }
    } catch (err) {
      setError('Failed to load system statistics')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Admin access required</p>
          <button
            onClick={() => router.push('/admin')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Back to Admin
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchStats}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 mr-4"
          >
            Retry
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Back to Admin
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Header */}
          <div className="border-b border-gray-200 pb-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Statistics</h1>
                <p className="text-gray-600 mt-2">Comprehensive system metrics and trust allocation data</p>
                <p className="text-sm text-gray-500 mt-1">Last updated: {new Date(stats.timestamp).toLocaleString()}</p>
              </div>
              <div className="space-x-3">
                <button
                  onClick={fetchStats}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Refresh
                </button>
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  ← Back to Admin
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold">U</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{stats.users.total}</h3>
                    <p className="text-sm text-gray-500">Total Users</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold">T</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{stats.trustSystem.totalTrustAllocated}</h3>
                    <p className="text-sm text-gray-500">Trust Allocated</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold">R</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{stats.relationships.confirmed}</h3>
                    <p className="text-sm text-gray-500">Confirmed Relations</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600 font-bold">%</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{stats.trustSystem.allocationRate}%</h3>
                    <p className="text-sm text-gray-500">Trust Allocation Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust System Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* Trust Allocation Overview */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Trust System Overview</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Trust in System</span>
                    <span className="text-sm font-medium">{stats.trustSystem.totalTrustInSystem} points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Trust Allocated to Network</span>
                    <span className="text-sm font-medium text-green-600">{stats.trustSystem.totalTrustAllocated} points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Trust Available to Allocate</span>
                    <span className="text-sm font-medium text-blue-600">{stats.trustSystem.totalTrustAvailable} points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average User Allocation</span>
                    <span className="text-sm font-medium">{stats.users.averageAllocatedTrust.toFixed(1)} points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Available per User</span>
                    <span className="text-sm font-medium">{stats.users.averageAvailableTrust.toFixed(1)} points</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Relationship Statistics */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Relationship Statistics</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Relationships</span>
                    <span className="text-sm font-medium">{stats.relationships.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confirmed</span>
                    <span className="text-sm font-medium text-green-600">{stats.relationships.confirmed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-sm font-medium text-yellow-600">{stats.relationships.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Declined</span>
                    <span className="text-sm font-medium text-red-600">{stats.relationships.declined}</span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Invitations</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Pending</span>
                        <span className="text-xs">{stats.invitations.pending}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Accepted</span>
                        <span className="text-xs">{stats.invitations.accepted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Declined</span>
                        <span className="text-xs">{stats.invitations.declined}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Users Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Top Trust Allocators */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Top Trust Allocators</h2>
                <p className="text-sm text-gray-500">Users who have allocated the most trust points</p>
              </div>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.trustSystem.topAllocators.map((user, idx) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {user.allocatedTrust}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                          {user.availableTrust}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Trust Receivers */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Top Trust Receivers</h2>
                <p className="text-sm text-gray-500">Users who receive the most trust from others</p>
              </div>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trust Received</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connections</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.trustSystem.topReceivers.map((user, idx) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                          {user.totalTrustReceived}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.relationshipCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}