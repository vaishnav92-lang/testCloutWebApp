/**
 * GRANTS PAGE
 *
 * Overview of active grant rounds and applications
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
}

export default function GrantsPage() {
  const { data: session } = useSession()
  const [grantRounds, setGrantRounds] = useState<GrantRound[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGrantRounds()
  }, [])

  const fetchGrantRounds = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/grants/rounds')
      if (res.ok) {
        const data = await res.json()
        setGrantRounds(data)
      }
    } catch (error) {
      console.error('Error fetching grant rounds:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to Apply for Grants</h2>
          <Link
            href="/api/auth/signin"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Grants</h1>
          <p className="text-gray-600 mt-2">
            Apply for grants through our trust-based allocation system
          </p>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-bold text-gray-900 mb-2">Phase 1: Vetting</h3>
            <p className="text-sm text-gray-600">
              Submit your work and capabilities for initial review
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-bold text-gray-900 mb-2">Phase 2: Trust</h3>
            <p className="text-sm text-gray-600">
              Allocate trust to other applicants based on their work
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="font-bold text-gray-900 mb-2">Phase 3: Allocation</h3>
            <p className="text-sm text-gray-600">
              Trust flows through the network to allocate funding fairly
            </p>
          </div>
        </div>

        {/* Active Grant Rounds */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Grant Rounds</h2>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600">Loading grant rounds...</p>
            </div>
          ) : grantRounds.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-4">No active grant rounds at the moment</p>
              <p className="text-sm text-gray-500">Check back soon for new opportunities</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {grantRounds.map((round) => (
                <div
                  key={round.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{round.name}</h3>
                      {round.description && (
                        <p className="text-gray-600 text-sm mt-1">{round.description}</p>
                      )}
                    </div>
                    <Link
                      href={`/grants/apply?roundId=${round.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Total Funding:</span>{' '}
                      <span className="text-gray-900">${round.totalFunding.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Min Grant:</span>{' '}
                      <span className="text-gray-900">${round.minimumGrantSize.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className="text-gray-900 capitalize">{round.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="mt-16 bg-blue-50 rounded-lg border border-blue-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How Our Grant System Works</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Why Trust Network?</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  ✓ <strong>Scalable:</strong> Grantmakers' scarce time is leveraged through trust networks
                </li>
                <li>
                  ✓ <strong>Quality:</strong> Decisions use deep knowledge of the researchers people trust
                </li>
                <li>
                  ✓ <strong>Fair:</strong> No negative signals allowed - prevents sabotage and fear
                </li>
                <li>
                  ✓ <strong>Efficient:</strong> Simpler applications freeing up effort for actual work
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">Application Format</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  📋 <strong>Your Work:</strong> Links + descriptions of past work and achievements
                </li>
                <li>
                  🚀 <strong>Future Plans:</strong> Proposals require evidence they are well-planned
                </li>
                <li>
                  🤝 <strong>Trust:</strong> Allocate trust to others based on their work
                </li>
                <li>
                  💰 <strong>Utility:</strong> Express your preferences over funding amounts
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
