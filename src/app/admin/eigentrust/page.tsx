'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface TrustConfig {
  eigentrustAlpha: number
  maxIterations: number
  convergenceThreshold: number
  adminEmail: string
}

interface TrustStatus {
  lastComputation: string | null
  lastComputationTime: number | null
  lastIterations: number | null
  totalUsers: number
  averageCloutScore: number
  maxCloutScore: number
  minCloutScore: number
  topUsers: Array<{
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    cloutScore: number
    cloutPercentile: number
  }>
}

export default function EigenTrustAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [config, setConfig] = useState<TrustConfig>({
    eigentrustAlpha: 0.15,
    maxIterations: 100,
    convergenceThreshold: 0.000001,
    adminEmail: 'vaishnav@cloutcareers.com'
  })

  const [status_, setStatus_] = useState<TrustStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [computing, setComputing] = useState(false)
  const [message, setMessage] = useState('')

  // Manual trust assignment state
  const [manualAssignment, setManualAssignment] = useState({
    email: '',
    cloutScore: ''
  })
  const [assigningTrust, setAssigningTrust] = useState(false)
  const [manualOverrides, setManualOverrides] = useState<Array<{
    email: string
    cloutScore: number
    assignedAt: string
  }>>([])
  const [manualMessage, setManualMessage] = useState('')

  // Users list for dropdown
  const [users, setUsers] = useState<Array<{
    id: string
    email: string
    displayName: string
    cloutScore: number
  }>>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')

  // Admin check
  const ADMIN_EMAIL = 'vaishnav@cloutcareers.com'
  const isAdmin = session?.user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (session && isAdmin) {
      fetchData()
      fetchUsers()
    }
  }, [session, isAdmin])

  // Hide dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      const response = await fetch('/api/admin/users-list')
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users.map((user: any) => ({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          cloutScore: user.cloutScore
        })))
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      const [configResponse, statusResponse] = await Promise.all([
        fetch('/api/admin/eigentrust-config'),
        fetch('/api/admin/compute-trust')
      ])

      if (configResponse.ok) {
        const configData = await configResponse.json()
        setConfig(configData)
      }

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setStatus_(statusData)
      }
    } catch (error) {
      setMessage('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      setMessage('')

      const response = await fetch('/api/admin/eigentrust-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Configuration saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(data.error || 'Failed to save configuration')
      }
    } catch (error) {
      setMessage('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const computeTrustScores = async () => {
    try {
      setComputing(true)
      setMessage('')

      const response = await fetch('/api/admin/compute-trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Trust scores computed! ${data.iterations} iterations, ${data.computationTime}ms, ${data.usersUpdated} users updated`)
        setTimeout(() => setMessage(''), 5000)

        // Refresh status
        fetchData()
      } else {
        setMessage(data.error || 'Failed to compute trust scores')
      }
    } catch (error) {
      setMessage('Failed to compute trust scores')
    } finally {
      setComputing(false)
    }
  }

  // User selection functions
  const handleUserSelect = (user: { email: string; displayName: string; cloutScore: number }) => {
    setManualAssignment(prev => ({
      ...prev,
      email: user.email
    }))
    setUserSearchTerm(user.displayName)
    setShowUserDropdown(false)
  }

  const handleUserSearchChange = (value: string) => {
    setUserSearchTerm(value)
    setManualAssignment(prev => ({ ...prev, email: value }))
    setShowUserDropdown(true) // Always show when typing
  }

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  ).slice(0, 10) // Limit to 10 results for performance

  const handleManualAssignment = async () => {
    try {
      setAssigningTrust(true)
      setManualMessage('')

      const cloutScore = parseFloat(manualAssignment.cloutScore)

      if (!manualAssignment.email || isNaN(cloutScore) || cloutScore < 0 || cloutScore > 100) {
        setManualMessage('Please provide a valid email and clout score (0 - 100)')
        return
      }

      const response = await fetch('/api/admin/manual-trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: manualAssignment.email,
          cloutScore: cloutScore
        })
      })

      const data = await response.json()

      if (response.ok) {
        setManualMessage(`Trust score assigned successfully to ${manualAssignment.email}`)
        setTimeout(() => setManualMessage(''), 3000)

        const userEmail = manualAssignment.email
        setManualAssignment({ email: '', cloutScore: '' })
        setUserSearchTerm('')

        // Add to manual overrides list
        setManualOverrides(prev => [
          ...prev.filter(o => o.email !== userEmail),
          {
            email: userEmail,
            cloutScore: cloutScore,
            assignedAt: new Date().toISOString()
          }
        ])

        // Refresh data
        fetchData()
      } else {
        setManualMessage(data.error || 'Failed to assign trust score')
      }
    } catch (error) {
      setManualMessage('Failed to assign trust score')
    } finally {
      setAssigningTrust(false)
    }
  }

  const handleResetToComputed = async () => {
    try {
      setAssigningTrust(true)
      setManualMessage('')

      if (!manualAssignment.email) {
        setManualMessage('Please provide an email address')
        return
      }

      const response = await fetch('/api/admin/manual-trust', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: manualAssignment.email
        })
      })

      const data = await response.json()

      if (response.ok) {
        setManualMessage(`Reset ${manualAssignment.email} to computed trust score`)
        setTimeout(() => setManualMessage(''), 3000)

        const userEmail = manualAssignment.email
        setManualAssignment({ email: '', cloutScore: '' })
        setUserSearchTerm('')

        // Remove from manual overrides list
        setManualOverrides(prev => prev.filter(o => o.email !== userEmail))

        // Refresh data
        fetchData()
      } else {
        setManualMessage(data.error || 'Failed to reset trust score')
      }
    } catch (error) {
      setManualMessage('Failed to reset trust score')
    } finally {
      setAssigningTrust(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Header */}
          <div className="border-b border-gray-200 pb-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">EigenTrust Management</h1>
                <p className="text-gray-600 mt-2">Configure and monitor trust score computation</p>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                ← Back to Admin
              </button>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.includes('success') || message.includes('computed')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Configuration Panel */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Algorithm Configuration</h2>
              </div>
              <div className="p-6 space-y-6">

                {/* Alpha Parameter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alpha (Decay Factor): {config.eigentrustAlpha}
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={config.eigentrustAlpha}
                    onChange={(e) => setConfig(prev => ({ ...prev, eigentrustAlpha: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.01 (Less decay)</span>
                    <span>0.5 (More decay)</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Controls how much trust "teleports" back to admin. Higher = stronger admin influence.
                  </p>
                </div>

                {/* Max Iterations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Iterations
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={config.maxIterations}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxIterations: parseInt(e.target.value) || 100 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Maximum iterations before forcing convergence
                  </p>
                </div>

                {/* Convergence Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Convergence Threshold
                  </label>
                  <input
                    type="number"
                    min="0.0000001"
                    max="0.01"
                    step="0.0000001"
                    value={config.convergenceThreshold}
                    onChange={(e) => setConfig(prev => ({ ...prev, convergenceThreshold: parseFloat(e.target.value) || 0.000001 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Stop when max change is below this threshold
                  </p>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>

            {/* Status & Controls */}
            <div className="space-y-6">

              {/* Computation Controls */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Trust Computation</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {status_?.lastComputation && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Last Computation</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Time: {new Date(status_.lastComputation).toLocaleString()}</p>
                          <p>Duration: {status_.lastComputationTime}ms</p>
                          <p>Iterations: {status_.lastIterations}</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={computeTrustScores}
                      disabled={computing}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {computing ? 'Computing...' : 'Compute Trust Scores Now'}
                    </button>

                    <p className="text-xs text-gray-600">
                      Trust scores are automatically recomputed when users update their allocations.
                      Use this button to force a manual recomputation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual Trust Assignment */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Manual Trust Assignment</h2>
                  <p className="text-sm text-gray-500 mt-1">Directly set clout scores for users (overrides EigenTrust computation)</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Manual Override Warning</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>Manually assigned scores will override the EigenTrust algorithm. Use sparingly for testing or emergency adjustments.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manual Assignment Message */}
                    {manualMessage && (
                      <div className={`p-3 rounded-md ${
                        manualMessage.includes('successfully') || manualMessage.includes('Reset')
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {manualMessage}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative user-dropdown-container">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select User
                        </label>
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={userSearchTerm}
                          onChange={(e) => handleUserSearchChange(e.target.value)}
                          onFocus={() => setShowUserDropdown(userSearchTerm.length > 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        {showUserDropdown && userSearchTerm.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {usersLoading ? (
                              <div className="px-3 py-2 text-sm text-gray-500">Loading users...</div>
                            ) : filteredUsers.length > 0 ? (
                              filteredUsers.map(user => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => handleUserSelect(user)}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {user.displayName}
                                      </div>
                                      <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                    <div className="text-xs text-purple-600">
                                      Score: {user.cloutScore.toFixed(4)}
                                    </div>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                {users.length === 0 ? 'Loading users...' : 'No users found'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clout Score (0 - 100)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder="50"
                          value={manualAssignment.cloutScore}
                          onChange={(e) => setManualAssignment(prev => ({ ...prev, cloutScore: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleManualAssignment}
                        disabled={assigningTrust}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assigningTrust ? 'Assigning...' : 'Assign Trust Score'}
                      </button>
                      <button
                        onClick={handleResetToComputed}
                        disabled={assigningTrust}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assigningTrust ? 'Resetting...' : 'Reset to Computed'}
                      </button>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Manual Overrides</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {manualOverrides.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center">No manual overrides currently set</p>
                        ) : (
                          <div className="space-y-2">
                            {manualOverrides.map((override, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{override.email}</div>
                                  <div className="text-xs text-gray-500">
                                    Score: {override.cloutScore.toFixed(4)} |
                                    Assigned: {new Date(override.assignedAt).toLocaleString()}
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    setManualAssignment({ email: override.email, cloutScore: '' })
                                    setUserSearchTerm(override.email)
                                    await handleResetToComputed()
                                  }}
                                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Statistics */}
              {status_ && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Network Statistics</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-900">{status_.totalUsers}</div>
                        <div className="text-sm text-gray-600">Total Users</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-900">
                          {status_.averageCloutScore?.toFixed(3) || '0.000'}
                        </div>
                        <div className="text-sm text-gray-600">Avg Clout Score</div>
                      </div>
                    </div>

                    {status_.topUsers && status_.topUsers.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Top Users by Clout Score</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {status_.topUsers.map((user, idx) => (
                            <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <div className="text-sm font-medium text-gray-600">#{idx + 1}</div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.firstName && user.lastName
                                      ? `${user.firstName} ${user.lastName}`
                                      : user.email}
                                  </div>
                                  {user.firstName && user.lastName && (
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-purple-600">
                                  {user.cloutScore.toFixed(4)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {user.cloutPercentile}th percentile
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}