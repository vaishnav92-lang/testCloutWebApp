/**
 * NETWORK INFLUENCE CHART COMPONENT
 *
 * Displays current trust scores and network influence rankings
 * for admin dashboard visualization
 */

'use client'

import { useState, useEffect } from 'react'

interface NetworkNode {
  rank: number
  userId: string
  displayName: string
  email: string
  trustScore: number
  displayScore: number
  isAdmin: boolean
  influencePercentage: string
}

interface ComputationInfo {
  iterations: number
  converged: boolean
  createdAt: string
  triggeredBy: string
}

interface NetworkInfluenceData {
  networkInfluence: NetworkNode[]
  totalUsers: number
  lastComputation: ComputationInfo | null
}

export default function NetworkInfluenceChart() {
  const [data, setData] = useState<NetworkInfluenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNetworkInfluence()
  }, [])

  const fetchNetworkInfluence = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/network-influence')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch network influence')
      }

      setData(result)
    } catch (error) {
      console.error('Network influence fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50'
    if (rank === 2) return 'text-gray-600 bg-gray-50'
    if (rank === 3) return 'text-orange-600 bg-orange-50'
    if (rank <= 10) return 'text-blue-600 bg-blue-50'
    return 'text-gray-500 bg-gray-50'
  }

  const getInfluenceBar = (percentage: number) => {
    const width = Math.max(percentage * 10, 2) // Minimum 2% width for visibility
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(width, 100)}%` }}
        ></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Network Influence Chart</h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchNetworkInfluence}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Network Influence Rankings</h3>
            <p className="text-sm text-gray-600">
              Current trust scores across {data.totalUsers} users
            </p>
          </div>
          <button
            onClick={fetchNetworkInfluence}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>

        {data.lastComputation && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">
                Last computation: {data.lastComputation.iterations} iterations
                {data.lastComputation.converged ? ' ✅ Converged' : ' ⚠️ Did not converge'}
              </span>
              <span className="text-blue-600">
                {new Date(data.lastComputation.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {data.networkInfluence.map((node) => (
            <div key={node.userId} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(node.rank)}`}>
                    {node.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {node.displayName}
                      </p>
                      {node.isAdmin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{node.email}</p>
                  </div>

                  <div className="w-32">
                    {getInfluenceBar(parseFloat(node.influencePercentage))}
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {node.influencePercentage}%
                    </p>
                    <p className="text-xs text-gray-500">
                      Score: {node.trustScore.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.networkInfluence.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          <p>No trust scores computed yet.</p>
          <p className="text-sm mt-1">Run the EigenTrust computation to see network influence.</p>
        </div>
      )}
    </div>
  )
}