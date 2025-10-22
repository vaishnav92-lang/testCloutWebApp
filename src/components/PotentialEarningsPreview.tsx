/**
 * POTENTIAL EARNINGS PREVIEW COMPONENT
 *
 * Shows users their potential payout based on their position in the referral chain
 * when they're about to forward a job or make a direct referral
 */

'use client'

import { calculateMaxPayout } from '@/lib/referral-chain'

interface PotentialEarningsPreviewProps {
  totalBudget: number
  currentChainLength: number
  showForward?: boolean
  showDirectReferral?: boolean
  className?: string
}

export default function PotentialEarningsPreview({
  totalBudget,
  currentChainLength,
  showForward = true,
  showDirectReferral = true,
  className = ''
}: PotentialEarningsPreviewProps) {
  const forwardPayout = showForward ? calculateMaxPayout(totalBudget, currentChainLength, false) : null
  const directPayout = showDirectReferral ? calculateMaxPayout(totalBudget, currentChainLength, true) : null

  return (
    <div className={`p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 text-sm">💰</span>
        </div>
        <h4 className="font-medium text-gray-900">Potential Earnings</h4>
      </div>

      <div className="space-y-3">
        {directPayout && (
          <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200">
            <div>
              <div className="font-medium text-gray-900">Make Direct Referral</div>
              <div className="text-sm text-gray-600">You become the direct referrer</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                ${directPayout.maxAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">{directPayout.percentage}% of budget</div>
            </div>
          </div>
        )}

        {forwardPayout && (
          <div className="flex items-center justify-between p-3 bg-white rounded border border-blue-200">
            <div>
              <div className="font-medium text-gray-900">Forward to Network</div>
              <div className="text-sm text-gray-600">You become a chain member</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                ${forwardPayout.maxAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">{forwardPayout.percentage}% of budget</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <div className="mb-1">
            <strong>Payment Model:</strong> Direct referrer gets 70% • Chain members share 30%
          </div>
          <div>
            Job budget: ${totalBudget.toLocaleString()} • Current chain length: {currentChainLength}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * COMPACT VERSION - For inline display in buttons/forms
 */
interface CompactEarningsProps {
  totalBudget: number
  currentChainLength: number
  isDirectReferral: boolean
  className?: string
}

export function CompactEarningsPreview({
  totalBudget,
  currentChainLength,
  isDirectReferral,
  className = ''
}: CompactEarningsProps) {
  const payout = calculateMaxPayout(totalBudget, currentChainLength, isDirectReferral)

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 rounded text-sm ${className}`}>
      <span className="font-medium">Max payout: ${payout.maxAmount.toLocaleString()}</span>
      <span className="text-xs opacity-75">({payout.percentage}%)</span>
    </div>
  )
}