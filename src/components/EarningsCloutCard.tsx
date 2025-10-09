/**
 * EARNINGS & CLOUT CARD COMPONENT
 *
 * This component displays a user's clout score, earnings, and reputation
 * in a clean card format for the dashboard.
 *
 * Features:
 * - Clout score with tier badge
 * - Total and pending earnings
 * - Successful referrals count
 * - Quick stats overview
 */

'use client'

import { useState, useEffect } from 'react'

interface CloutTier {
  name: string
  label: string
  color: string
  min: number
  max: number
}

interface EarningsCloutData {
  user: {
    cloutScore: number
    totalEarnings: number
    pendingEarnings: number
    successfulReferrals: number
    endorsementsScore: number
    networkValue: number
  }
  transactions: Array<{
    id: string
    amount: number
    type: string
    status: string
    description: string
    createdAt: string
    job?: {
      title: string
      company: { name: string }
    }
  }>
}

export default function EarningsCloutCard() {
  const [data, setData] = useState<EarningsCloutData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/earnings')
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Error fetching earnings data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getCloutTier = (score: number): CloutTier => {
    if (score >= 100) return { name: 'LEGEND', label: 'Legend', color: 'yellow', min: 100, max: Infinity }
    if (score >= 50) return { name: 'EXPERT', label: 'Expert', color: 'purple', min: 50, max: 99 }
    if (score >= 25) return { name: 'TRUSTED', label: 'Trusted Member', color: 'green', min: 25, max: 49 }
    if (score >= 10) return { name: 'CONTRIBUTOR', label: 'Contributor', color: 'blue', min: 10, max: 24 }
    return { name: 'NEWCOMER', label: 'Newcomer', color: 'gray', min: 0, max: 9 }
  }

  const getCloutColor = (color: string) => {
    switch (color) {
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'green': return 'bg-green-100 text-green-800 border-green-200'
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500">Unable to load earnings data</p>
      </div>
    )
  }

  const cloutTier = getCloutTier(data.user.cloutScore)
  const recentTransactions = data.transactions.slice(0, 3)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Clout & Earnings</h3>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCloutColor(cloutTier.color)}`}>
          {cloutTier.label}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-indigo-600">{Math.round(data.user.cloutScore)}</div>
          <div className="text-sm text-gray-600">Clout Score</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">${data.user.totalEarnings.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Earned</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">${data.user.pendingEarnings.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-900">Successful Referrals</span>
          <span className="text-lg font-bold text-blue-600">{data.user.successfulReferrals}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <span className="text-sm font-medium text-green-900">Network Value</span>
          <span className="text-lg font-bold text-green-600">${data.user.networkValue.toLocaleString()}</span>
        </div>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {transaction.description || transaction.type.replace('_', ' ')}
                  </div>
                  {transaction.job && (
                    <div className="text-xs text-gray-600">
                      {transaction.job.title} at {transaction.job.company.name}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(transaction.amount).toLocaleString()}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    transaction.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    transaction.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {transaction.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clout Progress */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Progress to {
            cloutTier.name === 'LEGEND' ? 'Legend Status' :
            cloutTier.name === 'EXPERT' ? 'Legend (100)' :
            cloutTier.name === 'TRUSTED' ? 'Expert (50)' :
            cloutTier.name === 'CONTRIBUTOR' ? 'Trusted (25)' :
            'Contributor (10)'
          }</span>
          <span className="text-sm text-gray-600">
            {data.user.cloutScore} / {
              cloutTier.name === 'LEGEND' ? '∞' :
              cloutTier.name === 'EXPERT' ? '100' :
              cloutTier.name === 'TRUSTED' ? '50' :
              cloutTier.name === 'CONTRIBUTOR' ? '25' :
              '10'
            }
          </span>
        </div>
        {cloutTier.name !== 'LEGEND' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                cloutTier.color === 'yellow' ? 'bg-yellow-500' :
                cloutTier.color === 'purple' ? 'bg-purple-500' :
                cloutTier.color === 'green' ? 'bg-green-500' :
                cloutTier.color === 'blue' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}
              style={{
                width: `${Math.min(((data.user.cloutScore - cloutTier.min) / (cloutTier.max - cloutTier.min)) * 100, 100)}%`
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}