'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface TrustScore {
  userId: string
  displayName: string
  trustScore: number
  displayScore: number
  rank: number
}

interface ComputationInfo {
  computedAt: string
  numIterations: number
  converged: boolean
  numUsers: number
  triggeredBy: string
}

export default function AdminTrustScoresPage() {
  const { data: session, status } = useSession()
  const [scores, setScores] = useState<TrustScore[]>([])
  const [computation, setComputation] = useState<ComputationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isAdmin = session?.user?.email === 'vaishnav@cloutcareers.com'

  useEffect(() => {
    if (status === 'loading') return

    if (!session || !isAdmin) {
      redirect('/dashboard')
      return
    }

    fetchScores()
  }, [session, status, isAdmin])

  const fetchScores = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/trust-scores')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch scores')
      }

      setScores(data.scores)
      setComputation(data.computation)
    } catch (error) {
      console.error('Failed to fetch scores:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch scores')
    } finally {
      setLoading(false)
    }
  }

  const refreshScores = () => {
    fetchScores()
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
        <div className="text-lg">Loading trust scores...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trust Scores</h1>
              <p className="mt-2 text-sm text-gray-600">
                Computed EigenTrust scores for all users
              </p>
            </div>
            <button
              onClick={refreshScores}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Computation Info */}
        {computation && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Last Computation</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Computed:</span>
                <div className="text-blue-600">
                  {new Date(computation.computedAt).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="font-medium text-blue-800">Users:</span>
                <div className="text-blue-600">{computation.numUsers}</div>
              </div>
              <div>
                <span className="font-medium text-blue-800">Iterations:</span>
                <div className="text-blue-600">{computation.numIterations}</div>
              </div>
              <div>
                <span className="font-medium text-blue-800">Converged:</span>
                <div className="text-blue-600">
                  {computation.converged ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              <div>
                <span className="font-medium text-blue-800">Triggered by:</span>
                <div className="text-blue-600 capitalize">{computation.triggeredBy}</div>
              </div>
            </div>
          </div>
        )}

        {/* Scores Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              All Trust Scores ({scores.length} users)
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trust Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Raw Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scores.map((score) => (
                    <tr key={score.userId} className={score.rank === 1 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {score.rank === 1 && '🏆'} #{score.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {score.displayName}
                        </div>
                        {score.rank === 1 && (
                          <div className="text-xs text-yellow-600">Admin (Fixed at 100)</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {score.displayScore} points
                        </div>
                        <div className="text-xs text-gray-500">
                          {((score.displayScore / 100) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {score.trustScore.toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Score Distribution</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-md text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {scores.filter(s => s.rank === 1).length}
                </div>
                <div className="text-sm text-gray-600">Admin (100 pts)</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {scores.filter(s => s.displayScore >= 10 && s.rank > 1).length}
                </div>
                <div className="text-sm text-gray-600">High Trust (10+ pts)</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {scores.filter(s => s.displayScore >= 5 && s.displayScore < 10).length}
                </div>
                <div className="text-sm text-gray-600">Medium Trust (5-10 pts)</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {scores.filter(s => s.displayScore < 5).length}
                </div>
                <div className="text-sm text-gray-600">Low Trust (&lt;5 pts)</div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>
                <strong>Total System Trust:</strong> {scores.reduce((sum, s) => sum + s.displayScore, 0)} points
              </p>
              <p>
                <strong>Average Score:</strong> {(scores.reduce((sum, s) => sum + s.displayScore, 0) / scores.length).toFixed(1)} points
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}