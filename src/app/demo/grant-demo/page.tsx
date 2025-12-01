'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDemoAuth } from '@/hooks/useDemo'

export default function GrantDemoPage() {
  const router = useRouter()
  useDemoAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Grant Allocation Demo
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">Demo</span>
            </h1>
            <p className="text-sm text-gray-500">Explore grant creation and management with trust-weighted recommendations</p>
          </div>
          <Link
            href="/demo/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Demo
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Experience Grant Allocation with Trust Networks
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Learn how to create grants, select trusted recommenders, and use trust-weighted allocations to evaluate applications.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Tutorial Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z"
                />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Guided Tutorial</h3>
              <p className="text-gray-600 mb-4">
                Follow a step-by-step tutorial through the grant allocation process. Learn each concept as you go through creating a grant, selecting recommenders, and managing applications.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-600">✓</span>
                  <span>Create a new grant with criteria</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-600">✓</span>
                  <span>Select and weight recommenders</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-600">✓</span>
                  <span>Review weighted applications</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-600">✓</span>
                  <span>Understand trust influence</span>
                </li>
              </ul>
              <button
                onClick={() => router.push('/demo/grant-demo/tutorial')}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Start Tutorial →
              </button>
            </div>
          </div>

          {/* Free Explore Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="h-48 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Exploration</h3>
              <p className="text-gray-600 mb-4">
                Jump directly into the grant allocation interface. Experiment with different trust weights, create grants, and explore how recommendations are calculated based on your allocations.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">✓</span>
                  <span>Create unlimited grants</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">✓</span>
                  <span>Adjust trust allocations in real-time</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">✓</span>
                  <span>See immediate impact on scores</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">✓</span>
                  <span>No database impact - demo only</span>
                </li>
              </ul>
              <button
                disabled
                className="w-full px-4 py-2 bg-gray-400 text-gray-200 rounded-lg font-medium cursor-not-allowed"
              >
                Coming Soon →
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Trust Allocation</h4>
              <p className="text-sm text-gray-600">Distribute trust weights across recommenders to reflect your confidence in their judgment.</p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Weighted Scoring</h4>
              <p className="text-sm text-gray-600">Application scores are calculated based on recommendations weighted by your trust allocation.</p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Real-Time Impact</h4>
              <p className="text-sm text-gray-600">See how adjusting trust weights immediately affects application recommendation scores.</p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-indigo-50 rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">How Trust-Weighted Allocation Works</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white font-semibold">1</div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Create a Grant</h4>
                <p className="text-gray-600">Define your grant title, description, and total amount available for distribution.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white font-semibold">2</div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Select Recommenders</h4>
                <p className="text-gray-600">Choose trusted people from your network who will evaluate and recommend applications.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white font-semibold">3</div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Allocate Trust</h4>
                <p className="text-gray-600">Assign trust weights (%) to each recommender. Total must equal 100%. Higher weights give more influence to that recommender's opinion.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white font-semibold">4</div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Receive Applications</h4>
                <p className="text-gray-600">Applicants submit their proposals and recommenders provide their evaluations.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white font-semibold">5</div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Score Applications</h4>
                <p className="text-gray-600">The system calculates weighted scores. A recommender with 40% trust weight has 40% influence on the final score.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Ready to learn how to use grant allocation?</p>
          <button
            onClick={() => router.push('/demo/grant-demo/tutorial')}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-lg"
          >
            Start the Tutorial Now
          </button>
        </div>
      </main>
    </div>
  )
}
