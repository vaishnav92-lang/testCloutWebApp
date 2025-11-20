'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDemoContext } from '@/components/providers/demo-provider'
import { useDemoAuth } from '@/hooks/useDemo'

export default function DemoTrustAllocationsPage() {
  const router = useRouter()
  useDemoAuth()
  const { state, updateTrustAllocation, eigentrustScores, isComputingScores } = useDemoContext()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<number>(0)

  const startEdit = (id: string, currentValue: number) => {
    setEditingId(id)
    setTempValue(currentValue)
  }

  const saveEdit = (id: string) => {
    updateTrustAllocation(id, tempValue)
    setEditingId(null)
  }

  const totalAllocation = state.trustAllocations.reduce((sum, t) => sum + t.allocation, 0)

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
          <h1 className="text-3xl font-bold text-gray-900">Trust Allocations</h1>
          <p className="text-gray-600 mt-2">
            Allocate your trust across your network. Total: <strong>{totalAllocation}%</strong>
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">How Trust Allocations Work</h3>
            <p className="text-sm text-blue-800 mb-3">
              You have 100 trust points to allocate across your network. These allocations
              represent your confidence in each person's judgment and are used to compute
              EigenTrust scores that influence the platform's recommendations.
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Higher allocations = More weight in recommendations</li>
              <li>• Allocations should reflect your actual trust levels</li>
              <li>• You can adjust allocations anytime</li>
            </ul>
          </div>

          {/* Allocations List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Your Network</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {state.trustAllocations.map((trust) => (
                <div key={trust.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {trust.toUserName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {isComputingScores ? (
                          <span className="text-gray-500 italic">Computing trust score...</span>
                        ) : eigentrustScores ? (
                          <>
                            Trust score:{' '}
                            <span className="font-semibold text-indigo-600">
                              {(eigentrustScores.modified[trust.toUserId] * 1000).toFixed(0)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">(EigenTrust)</span>
                          </>
                        ) : (
                          <span className="text-gray-500">Trust score unavailable</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      {editingId === trust.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={tempValue}
                            onChange={(e) =>
                              setTempValue(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                          <span className="text-gray-600 font-medium">%</span>
                          <button
                            onClick={() => saveEdit(trust.id)}
                            className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className="text-2xl font-bold text-indigo-600">
                            {trust.allocation}
                          </span>
                          <span className="text-gray-600 font-medium">%</span>
                          <button
                            onClick={() =>
                              startEdit(trust.id, trust.allocation)
                            }
                            className="ml-3 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${trust.allocation}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-medium">Total Allocated</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {totalAllocation}%
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {totalAllocation < 100
                  ? `${100 - totalAllocation}% remaining`
                  : 'All allocated'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-medium">Network Size</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {state.trustAllocations.length}
              </p>
              <p className="text-xs text-gray-500 mt-2">trusted connections</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 font-medium">Average Trust</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {Math.round(
                  totalAllocation / state.trustAllocations.length
                )}%
              </p>
              <p className="text-xs text-gray-500 mt-2">per connection</p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">💡 Tips for Trust Allocation</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>
                • <strong>Align with reality:</strong> Allocate based on your actual
                confidence in each person's judgment
              </li>
              <li>
                • <strong>Consider expertise:</strong> Allocate more to those with strong
                track records in relevant areas
              </li>
              <li>
                • <strong>Be honest:</strong> Underallocating to people you actually
                trust limits the network's value
              </li>
              <li>
                • <strong>Update regularly:</strong> Adjust allocations as relationships
                evolve
              </li>
            </ul>
          </div>

          {/* Learn More - Trust Property Proof */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-600">
                  <span className="text-xl">🔐</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-indigo-900 mb-2">
                  Learn How Trust Scores Work
                </h3>
                <p className="text-sm text-indigo-800 mb-4">
                  Want to understand how the EigenTrust algorithm computes trust scores? Visit our
                  interactive demo to see how changing trust allocations affects network trust
                  propagation. Includes a key property: your allocation changes don't affect your own
                  score!
                </p>
                <a
                  href="/trust-property-proof"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Explore EigenTrust Algorithm →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
