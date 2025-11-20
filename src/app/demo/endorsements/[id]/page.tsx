'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDemoContext } from '@/components/providers/demo-provider'
import { useDemoAuth } from '@/hooks/useDemo'

export default function DemoEndorsementPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  useDemoAuth()
  const { state, updateEndorsement } = useDemoContext()
  const [selectedAction, setSelectedAction] = useState<
    'ACTIVE_MATCHING' | 'PRIVATE' | 'NOT_USING' | null
  >(null)

  const resolvedParams = React.use(params)
  const endorsement = state.endorsements.find((e) => e.id === resolvedParams.id)

  if (!endorsement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Endorsement not found</p>
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  const handleDecision = (action: 'ACTIVE_MATCHING' | 'PRIVATE' | 'NOT_USING') => {
    setSelectedAction(action)
    updateEndorsement(endorsement.id, { status: action })
    setTimeout(() => {
      alert(
        `You've marked this endorsement as "${action}". In the real app, this would affect your Clout score and visibility to employers.`
      )
      router.push('/demo/dashboard')
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-700 font-medium mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Review Endorsement</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Endorsement Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* From */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-2">Endorsement from</p>
            <h2 className="text-2xl font-bold text-gray-900">
              {endorsement.fromUserName}
            </h2>
            <p className="text-gray-600 mt-1">
              <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm mt-2 capitalize">
                {endorsement.relationship}
              </span>
            </p>
          </div>

          {/* Message */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-3">What they wrote</p>
            <p className="text-lg text-gray-900 italic">
              "{endorsement.message}"
            </p>
          </div>

          {/* Strengths */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 font-medium mb-3">Highlighted Strengths</p>
            <div className="flex flex-wrap gap-2">
              {endorsement.strengths.map((strength, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Decision Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">What would you like to do?</h3>
          <p className="text-gray-600 mb-6">
            Your decision will affect how this endorsement is used. Choose carefully!
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleDecision('ACTIVE_MATCHING')}
              disabled={selectedAction !== null}
              className="w-full p-4 text-left border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <p className="font-semibold text-gray-900">
                ✓ Use in Active Matching
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Share with employers and use this in job matching algorithms. This
                increases your visibility but shares your strengths publicly.
              </p>
            </button>

            <button
              onClick={() => handleDecision('PRIVATE')}
              disabled={selectedAction !== null}
              className="w-full p-4 text-left border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <p className="font-semibold text-gray-900">
                🔒 Keep Private
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Only you can see this endorsement. It won't be shared with employers
                but still contributes to your private Clout score.
              </p>
            </button>

            <button
              onClick={() => handleDecision('NOT_USING')}
              disabled={selectedAction !== null}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <p className="font-semibold text-gray-900">
                ✕ Don't Use
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Archive this endorsement. It won't count toward your Clout score or
                be visible anywhere.
              </p>
            </button>
          </div>

          {selectedAction && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Your choice has been recorded. Redirecting...
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-900">
            <strong>Demo Mode:</strong> This is a simulated endorsement review. In the real
            app, you would see endorsements from real connections and your decisions
            would affect your Clout score and visibility to employers.
          </p>
        </div>
      </main>
    </div>
  )
}
