'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  displayName: string
  cloutScore: number
  cloutPercentile: number
}

interface TrustEntry {
  userId: string
  amount: number
}

interface MatrixUser {
  id: string
  displayName: string
  trustGiven: TrustEntry[]
  totalGiven: number
  totalReceived: number
}

interface TrustMatrixData {
  users: User[]
  relationshipMatrix: MatrixUser[]
  summary: {
    totalUsers: number
    totalRelationships: number
    totalTrustInSystem: number
    totalCloutScores: number
  }
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

  const getTrustValue = (giverId: string, receiverId: string): number => {
    if (!matrixData) return 0
    const giver = matrixData.relationshipMatrix.find(u => u.id === giverId)
    const trustEntry = giver?.trustGiven.find(t => t.userId === receiverId)
    return trustEntry?.amount || 0
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access the admin panel.</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You must be an admin to access this page.</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Trust Matrix</h1>
                <p className="text-gray-600 mt-2">Trust allocations between users</p>
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
              <div className="text-lg text-gray-600">Loading trust matrix...</div>
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
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">U</span>
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                          <dd className="text-lg font-semibold text-gray-900">{matrixData.summary.totalUsers}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">R</span>
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Relationships</dt>
                          <dd className="text-lg font-semibold text-gray-900">{matrixData.summary.totalRelationships}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">T</span>
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Trust</dt>
                          <dd className="text-lg font-semibold text-gray-900">{matrixData.summary.totalTrustInSystem.toFixed(1)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">C</span>
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Clout</dt>
                          <dd className="text-lg font-semibold text-gray-900">{matrixData.summary.totalCloutScores.toFixed(1)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Trust Received Rankings */}
              <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Total Trust Received Rankings</h3>
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
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Trust
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            From Admin
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            From Peers
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {matrixData.users
                          .map(user => {
                            const userData = matrixData.relationshipMatrix.find(u => u.id === user.id)
                            const adminTrust = user.cloutScore || 0
                            const peerTrust = userData?.totalReceived || 0
                            const totalTrust = adminTrust + peerTrust
                            return {
                              ...user,
                              adminTrust,
                              peerTrust,
                              totalTrust
                            }
                          })
                          .sort((a, b) => b.totalTrust - a.totalTrust)
                          .map((user, index) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                #{index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {user.displayName}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-bold ${
                                user.totalTrust > 0 ? 'text-green-600' : 'text-gray-400'
                              }`}>
                                {user.totalTrust.toFixed(1)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-purple-600">
                                {user.adminTrust.toFixed(1)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600">
                                {user.peerTrust.toFixed(1)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Combined Trust Matrix */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Trust Matrix (Admin + Relationships)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                            From \ To
                          </th>
                          {matrixData.users.map(user => (
                            <th
                              key={user.id}
                              className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24"
                              title={user.displayName}
                            >
                              {user.displayName.length > 10
                                ? user.displayName.substring(0, 10) + '...'
                                : user.displayName
                              }
                            </th>
                          ))}
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                            Total Given
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Admin row showing admin-assigned trust scores */}
                        <tr className="bg-purple-50 font-semibold">
                          <td className="px-3 py-4 text-sm text-purple-900 sticky left-0 bg-purple-50 z-10">
                            Admin (vaishnav@cloutcareers.com)
                          </td>
                          {matrixData.users.map(receiver => (
                            <td
                              key={receiver.id}
                              className={`px-3 py-4 text-sm text-center ${
                                receiver.cloutScore > 0
                                  ? 'bg-purple-100 text-purple-700 font-medium'
                                  : 'text-gray-400'
                              }`}
                            >
                              {receiver.cloutScore > 0 ? receiver.cloutScore : '0'}
                            </td>
                          ))}
                          <td className="px-3 py-4 text-sm text-center font-semibold bg-purple-100">
                            {matrixData.users.reduce((sum, u) => sum + u.cloutScore, 0).toFixed(0)}
                          </td>
                        </tr>

                        {/* User rows */}
                        {matrixData.users.map(giver => {
                          const giverData = matrixData.relationshipMatrix.find(u => u.id === giver.id)
                          return (
                            <tr key={giver.id} className="hover:bg-gray-50">
                              <td className="px-3 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                                {giver.displayName}
                              </td>
                              {matrixData.users.map(receiver => {
                                const trustValue = getTrustValue(giver.id, receiver.id)
                                const isOwnCell = giver.id === receiver.id
                                return (
                                  <td
                                    key={receiver.id}
                                    className={`px-3 py-4 text-sm text-center ${
                                      isOwnCell
                                        ? 'bg-gray-100 text-gray-400'
                                        : trustValue > 0
                                          ? 'bg-green-50 text-green-700 font-medium'
                                          : 'text-gray-500'
                                    }`}
                                  >
                                    {isOwnCell ? '-' : trustValue.toFixed(1)}
                                  </td>
                                )
                              })}
                              <td className="px-3 py-4 text-sm text-center font-semibold bg-blue-50">
                                {giverData?.totalGiven.toFixed(1) || '0.0'}
                              </td>
                            </tr>
                          )
                        })}

                        {/* Total Received Row */}
                        <tr className="bg-blue-50 font-semibold">
                          <td className="px-3 py-4 text-sm text-gray-900 sticky left-0 bg-blue-50 z-10">
                            Total Received
                          </td>
                          {matrixData.users.map(user => {
                            const userData = matrixData.relationshipMatrix.find(u => u.id === user.id)
                            const adminTrust = user.cloutScore || 0
                            const relationshipTrust = userData?.totalReceived || 0
                            const totalReceived = adminTrust + relationshipTrust
                            return (
                              <td key={user.id} className="px-3 py-4 text-sm text-center" title={`Admin: ${adminTrust}, Relationships: ${relationshipTrust.toFixed(1)}`}>
                                {totalReceived.toFixed(1)}
                              </td>
                            )
                          })}
                          <td className="px-3 py-4 text-sm text-center bg-blue-100">
                            {(matrixData.summary.totalTrustInSystem + matrixData.summary.totalCloutScores).toFixed(1)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={fetchTrustMatrix}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Refresh Matrix
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}