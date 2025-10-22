/**
 * REFERRAL CHAIN VIEWER COMPONENT
 *
 * Displays referral chains with payment calculations for hiring managers
 */

'use client'

import { useState, useEffect } from 'react'

interface ChainNode {
  id: string
  name: string
  email: string
}

interface PaymentSplit {
  nodeId: string
  name: string
  amount: number
}

interface Referral {
  id: string
  candidateEmail: string
  howYouKnow: string
  confidenceLevel: string
  notes: string
  status: string
  chainDepth: number
  createdAt: string
  chain: ChainNode[]
  candidate?: {
    firstName?: string
    lastName?: string
    email: string
  }
  referrerNode: {
    firstName?: string
    lastName?: string
    email: string
  }
}

interface ReferralChainViewerProps {
  jobId: string
}

export default function ReferralChainViewer({ jobId }: ReferralChainViewerProps) {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReferral, setSelectedReferral] = useState<string | null>(null)
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([])
  const [paymentAmount, setPaymentAmount] = useState(10000)

  useEffect(() => {
    fetchReferrals()
  }, [jobId])

  const fetchReferrals = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/referrals`)
      if (response.ok) {
        const data = await response.json()
        setReferrals(data.referrals)
      }
    } catch (error) {
      console.error('Error fetching referrals:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateReferralStatus = async (referralId: string, status: string) => {
    try {
      const response = await fetch(`/api/referrals/${referralId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        await fetchReferrals()
        if (status === 'HIRED') {
          calculatePaymentSplits(referralId)
        }
      }
    } catch (error) {
      console.error('Error updating referral status:', error)
    }
  }

  const calculatePaymentSplits = async (referralId: string) => {
    try {
      const response = await fetch(`/api/referrals/${referralId}/payment-splits?amount=${paymentAmount}`)
      if (response.ok) {
        const data = await response.json()
        setPaymentSplits(data.splits)
        setSelectedReferral(referralId)
      }
    } catch (error) {
      console.error('Error calculating payment splits:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'SCREENING': return 'bg-blue-100 text-blue-800'
      case 'INTERVIEWING': return 'bg-purple-100 text-purple-800'
      case 'HIRED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Awaiting Response'
      case 'SCREENING': return 'Interview Scheduled'
      case 'INTERVIEWING': return 'Interviewing'
      case 'HIRED': return 'Hired'
      case 'REJECTED': return 'Rejected'
      default: return status
    }
  }

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (referrals.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="text-lg font-medium mb-2">No Referrals Yet</div>
        <div className="text-sm">Referrals with chain tracking will appear here</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Referral Chains ({referrals.length})
        </h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Payment Amount:</label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 10000)}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>
      </div>

      <div className="space-y-4">
        {referrals.map((referral) => (
          <div key={referral.id} className="border border-gray-200 rounded-lg p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-medium text-gray-900">
                  {referral.candidate?.firstName} {referral.candidate?.lastName}
                  <span className="text-gray-600 ml-2">({referral.candidateEmail})</span>
                </div>
                <div className="text-sm text-gray-600">
                  Referred by {referral.referrerNode.firstName} {referral.referrerNode.lastName}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(referral.status)}`}>
                  {getStatusDisplayName(referral.status)}
                </span>
                <span className={`text-sm font-medium ${getConfidenceColor(referral.confidenceLevel)}`}>
                  {referral.confidenceLevel} confidence
                </span>
              </div>
            </div>

            {/* Chain Visualization */}
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Referral Chain (Depth: {referral.chainDepth})
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {referral.chain.map((node, index) => (
                  <div key={node.id} className="flex items-center">
                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                      {node.name}
                    </div>
                    {index < referral.chain.length - 1 && (
                      <div className="mx-2 text-gray-400">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">How they know candidate:</span>
                <div className="text-gray-600">{referral.howYouKnow || 'Not specified'}</div>
              </div>
              {referral.notes && (
                <div>
                  <span className="font-medium text-gray-700">Notes:</span>
                  <div className="text-gray-600">{referral.notes}</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <select
                value={referral.status}
                onChange={(e) => updateReferralStatus(referral.id, e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="PENDING">Awaiting Response</option>
                <option value="REJECTED">Rejected</option>
                <option value="SCREENING">Interview Scheduled</option>
                <option value="INTERVIEWING">Interviewing</option>
                <option value="HIRED">Hired</option>
              </select>

              {referral.status === 'HIRED' && (
                <button
                  onClick={() => calculatePaymentSplits(referral.id)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Calculate Payments
                </button>
              )}
            </div>

            {/* Payment Splits */}
            {selectedReferral === referral.id && paymentSplits.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">
                  Payment Distribution (${paymentAmount.toLocaleString()})
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  Direct referrer gets 70% • Chain members share 30% equally
                </div>
                <div className="space-y-1">
                  {paymentSplits.map((split, index) => {
                    const position = paymentSplits.length - index
                    const percentage = ((split.amount / paymentAmount) * 100).toFixed(1)
                    const isDirectReferrer = index === paymentSplits.length - 1
                    return (
                      <div key={split.nodeId} className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {split.name}
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            isDirectReferrer
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isDirectReferrer ? 'Direct Referrer' : 'Chain Member'}
                          </span>
                        </span>
                        <span className="font-medium">
                          ${split.amount.toLocaleString()} ({percentage}%)
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                  Total: ${paymentSplits.reduce((sum, split) => sum + split.amount, 0).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}