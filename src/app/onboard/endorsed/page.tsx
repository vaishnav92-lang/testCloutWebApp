/**
 * ENDORSED USER ONBOARDING PAGE
 *
 * Special onboarding flow for users who join via endorsement.
 * Shows them they have an endorsement waiting and guides them through
 * profile setup and endorsement acceptance.
 */

'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function EndorsedOnboarding() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const endorsementId = searchParams.get('endorsement')

  const [loading, setLoading] = useState(true)
  const [endorsementInfo, setEndorsementInfo] = useState<any>(null)
  const [step, setStep] = useState(1) // 1: Welcome, 2: Profile, 3: Endorsement Decision

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      // Redirect to sign in if not authenticated
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
    }

    // Fetch endorsement info
    if (endorsementId) {
      fetchEndorsementInfo()
    }
  }, [session, status, endorsementId])

  const fetchEndorsementInfo = async () => {
    try {
      const response = await fetch(`/api/endorsements/${endorsementId}/info`)
      if (response.ok) {
        const data = await response.json()
        setEndorsementInfo(data)
      }
    } catch (error) {
      console.error('Error fetching endorsement info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteProfile = () => {
    // Navigate to profile completion
    router.push(`/onboard?from=endorsed&endorsement=${endorsementId}`)
  }

  const handleViewEndorsement = () => {
    // Navigate to endorsement decision page
    router.push(`/endorsements/${endorsementId}/decide`)
  }

  const handleSkipToEndorsement = () => {
    // Skip profile and go straight to endorsement
    router.push(`/endorsements/${endorsementId}/decide`)
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🌟</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Clout, {session?.user?.name || session?.user?.email}!
            </h1>
            <p className="text-lg text-gray-600">
              You've been fast-tracked to join our trusted professional network
            </p>
          </div>

          {endorsementInfo && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6 border border-purple-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {endorsementInfo.endorserName} endorsed you!
                  </h3>
                  <p className="text-sm text-gray-600">
                    They highlighted your exceptional work and professional capabilities
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Next Steps:</h3>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">1</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Complete Your Profile</h4>
                <p className="text-sm text-gray-600">Add your professional details to help us match you with the right opportunities</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Decide on Your Endorsement</h4>
                <p className="text-sm text-gray-600">Choose how you want to use your endorsement - privately or for active matching</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">3</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Start Building Your Network</h4>
                <p className="text-sm text-gray-600">Connect with professionals and explore opportunities</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={handleCompleteProfile}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Complete Profile & Accept Endorsement
            </button>

            <button
              onClick={handleSkipToEndorsement}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Skip to Endorsement Decision
            </button>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Why You're Here</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900">Trusted Endorsement</h4>
                <p className="text-sm text-gray-600">Someone vouched for your exceptional work</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900">Fast-Track Access</h4>
                <p className="text-sm text-gray-600">Skip traditional application processes</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900">Privacy Control</h4>
                <p className="text-sm text-gray-600">You decide who sees your endorsement</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900">Opportunity Matching</h4>
                <p className="text-sm text-gray-600">Get matched with perfect-fit roles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}