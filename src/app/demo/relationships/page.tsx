'use client'

import { useRouter } from 'next/navigation'
import { useDemoContext } from '@/components/providers/demo-provider'
import { useDemoAuth } from '@/hooks/useDemo'

export default function DemoRelationshipsPage() {
  const router = useRouter()
  useDemoAuth()
  const { state, eigentrustScores } = useDemoContext()

  const getConnectionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'colleague':
        return 'bg-blue-100 text-blue-800'
      case 'mentor':
        return 'bg-purple-100 text-purple-800'
      case 'peer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRelationshipDescription = (type: string) => {
    switch (type.toLowerCase()) {
      case 'colleague':
        return 'You worked together on projects or teams'
      case 'mentor':
        return 'They provided guidance and mentorship'
      case 'peer':
        return 'You have a peer relationship'
      default:
        return 'Professional connection'
    }
  }

  const daysAgo = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 30) return `${days} days ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-700 font-medium mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Your Network</h1>
          <p className="text-gray-600 mt-2">
            {state.relationships.length} established relationships
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Network Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-medium">Total Connections</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {state.relationships.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-medium">Trust Allocations</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {state.trustAllocations.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-medium">Average Clout Score</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {Math.round(
                  Object.values(state.trustScores).reduce((a, b) => a + b, 0) /
                    Object.values(state.trustScores).length
                )}
              </p>
            </div>
          </div>

          {/* Relationships List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Trusted Connections</h2>
              <p className="text-sm text-gray-600 mt-1">
                Your established professional relationships
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {state.relationships.length > 0 ? (
                state.relationships.map((rel) => {
                  const trustScore =
                    state.trustAllocations.find(
                      (t) => t.toUserId === rel.toUserId
                    )?.allocation || 0

                  return (
                    <div key={rel.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {rel.toUserName}
                          </h3>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${getConnectionColor(rel.type)}`}
                            >
                              {rel.type.charAt(0).toUpperCase() + rel.type.slice(1)}
                            </span>
                            <span className="text-xs text-gray-600">
                              {getRelationshipDescription(rel.type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Connected {daysAgo(rel.createdAt)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-indigo-600">
                              {trustScore}
                            </span>
                            <span className="text-gray-600">%</span>
                          </div>
                          <p className="text-xs text-gray-600">Your trust allocation</p>
                        </div>
                      </div>

                      {/* Trust Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${trustScore}%` }}
                        ></div>
                      </div>

                      {/* Connection Details */}
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Status</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            ✓ {rel.status}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">EigenTrust Score</p>
                          <p className="text-sm font-medium text-green-600 mt-1">
                            {eigentrustScores
                              ? (eigentrustScores.modified[rel.toUserId] * 1000).toFixed(0)
                              : state.trustScores[rel.toUserId] || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Action</p>
                          <button
                            onClick={() => {
                              alert(
                                'In the real app, you could message or refer to this connection!'
                              )
                            }}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-1"
                          >
                            Refer →
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No relationships established yet
                </div>
              )}
            </div>
          </div>

          {/* Network Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">About Your Network</h3>
            <p className="text-sm text-blue-800 mb-3">
              Your network is the foundation of the Clout Careers platform. Strong,
              authentic relationships lead to better opportunities and more accurate
              trust scores.
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • <strong>Verified connections:</strong> All relationships require
                mutual confirmation
              </li>
              <li>
                • <strong>Type matters:</strong> Different relationship types are
                weighted differently
              </li>
              <li>
                • <strong>Build organically:</strong> Focus on quality over quantity
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
