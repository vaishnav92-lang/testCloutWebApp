'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TrustAllocation {
  giverId: string
  giverName: string
  receiverId: string
  receiverName: string
  proportion: number
}

interface ComputedScore {
  userId: string
  userName: string
  trustScore: number
  rank: number
  influencePercentage: number
}

interface ComputationInfo {
  iterations: number
  converged: boolean
  computedAt: string
  triggeredBy: string
  numUsers: number
  decayFactor: number
  convergenceThreshold: number
}

interface TrustMatrixData {
  trustAllocations: TrustAllocation[]
  computedScores: ComputedScore[]
  computation: ComputationInfo
  allUsers: Array<{id: string, name: string}>
}

export default function TrustMatrixPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [matrixData, setMatrixData] = useState<TrustMatrixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Admin check
  const ADMIN_EMAILS = ['vaishnav@cloutcareers.com']
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || !isAdmin) {
      return
    }

    fetchTrustMatrix()
  }, [session, status, isAdmin])

  const fetchTrustMatrix = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/trust-matrix')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trust matrix')
      }

      setMatrixData(data)
    } catch (error) {
      console.error('Trust matrix fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch trust matrix')
    } finally {
      setLoading(false)
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Admin access required.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Back to Dashboard
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
                <h1 className="text-3xl font-bold text-gray-900">EigenTrust Computation Data</h1>
                <p className="text-gray-600 mt-2">Actual calculations from the last trust computation round</p>
              </div>
              <Link
                href="/admin"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Admin
              </Link>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Loading computation data...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-600">{error}</div>
              <button
                onClick={fetchTrustMatrix}
                className="mt-2 text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          )}

          {matrixData && (
            <>
              {/* Computation Info */}
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Last Computation Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-500">Iterations</div>
                    <div className="text-lg font-bold text-blue-600">{matrixData.computation.iterations}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Converged</div>
                    <div className={`text-lg font-bold ${matrixData.computation.converged ? 'text-green-600' : 'text-red-600'}`}>
                      {matrixData.computation.converged ? 'YES' : 'NO'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Users</div>
                    <div className="text-lg font-bold text-purple-600">{matrixData.computation.numUsers}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Decay Factor</div>
                    <div className="text-lg font-bold text-orange-600">{matrixData.computation.decayFactor}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Computed: {new Date(matrixData.computation.computedAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Triggered by: {matrixData.computation.triggeredBy}
                  </div>
                </div>
              </div>

              {/* Input Trust Allocations */}
              <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Input: Trust Allocations</h2>
                  <p className="text-gray-600">These are the direct trust allocations that were input to the EigenTrust algorithm</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Proportion</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {matrixData.trustAllocations
                        .sort((a, b) => b.proportion - a.proportion)
                        .map((allocation, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {allocation.giverName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {allocation.receiverName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                            {allocation.proportion.toFixed(6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                            {(allocation.proportion * 100).toFixed(3)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Output: Computed Trust Scores */}
              <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Output: Computed Trust Scores</h2>
                  <p className="text-gray-600">Final trust scores after {matrixData.computation.iterations} iterations of EigenTrust</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trust Score</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Network Influence</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {matrixData.computedScores
                        .sort((a, b) => a.rank - b.rank)
                        .map((score) => (
                        <tr key={score.userId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            #{score.rank}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {score.userName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                            {score.trustScore.toFixed(8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                            {score.influencePercentage.toFixed(4)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trust Allocation Matrix */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Trust Allocation Matrix</h2>
                  <p className="text-gray-600">Matrix showing who allocated trust to whom (rows = givers, columns = receivers)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                          From → To
                        </th>
                        {matrixData.allUsers.slice(0, 20).map(user => (
                          <th
                            key={user.id}
                            className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-20"
                            title={user.name}
                          >
                            {user.name.substring(0, 8)}...
                          </th>
                        ))}
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">
                          + {matrixData.allUsers.length > 20 ? matrixData.allUsers.length - 20 : 0} more
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {matrixData.allUsers.slice(0, 20).map(giver => {
                        const giverAllocations = matrixData.trustAllocations.filter(a => a.giverId === giver.id)

                        return (
                          <tr key={giver.id} className="hover:bg-gray-50">
                            <td className="px-3 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10" title={giver.name}>
                              {giver.name.substring(0, 15)}...
                            </td>
                            {matrixData.allUsers.slice(0, 20).map(receiver => {
                              const allocation = giverAllocations.find(a => a.receiverId === receiver.id)
                              const value = allocation ? allocation.proportion : 0
                              const isOwnCell = giver.id === receiver.id

                              return (
                                <td
                                  key={receiver.id}
                                  className={`px-2 py-4 text-xs text-center ${
                                    isOwnCell
                                      ? 'bg-gray-100 text-gray-400'
                                      : value > 0
                                        ? 'bg-green-50 text-green-700 font-bold'
                                        : 'text-gray-300'
                                  }`}
                                >
                                  {isOwnCell ? '-' : value > 0 ? (value * 100).toFixed(1) + '%' : '0'}
                                </td>
                              )
                            })}
                            <td className="px-3 py-4 text-sm text-center text-gray-500">
                              {giverAllocations.length > 0 ? `${giverAllocations.length} allocs` : ''}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {matrixData.allUsers.length > 20 && (
                  <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
                    Showing first 20 users. Total users: {matrixData.allUsers.length}
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={fetchTrustMatrix}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                >
                  Refresh Data
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}