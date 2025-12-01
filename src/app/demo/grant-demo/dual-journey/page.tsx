'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDemoAuth } from '@/hooks/useDemo'

type Phase = 'intro' | 'admin-creates' | 'applicants-apply' | 'applicants-trust' | 'admin-computes' | 'results'

export default function DualJourneyPage() {
  useDemoAuth()
  const [currentPhase, setCurrentPhase] = useState<Phase>('intro')
  const [focusedRole, setFocusedRole] = useState<'admin' | 'applicants' | 'both'>('both')

  const phases: Phase[] = ['intro', 'admin-creates', 'applicants-apply', 'applicants-trust', 'admin-computes', 'results']
  const currentIndex = phases.indexOf(currentPhase)

  const handleNext = () => {
    if (currentIndex < phases.length - 1) {
      setCurrentPhase(phases[currentIndex + 1])
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentPhase(phases[currentIndex - 1])
    }
  }

  const getPhaseStatus = (phase: Phase) => {
    const phaseIndex = phases.indexOf(phase)
    if (phaseIndex < currentIndex) return 'completed'
    if (phaseIndex === currentIndex) return 'current'
    return 'pending'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current':
        return '→'
      case 'completed':
        return '✓'
      case 'pending':
        return '○'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-indigo-100 border-indigo-300'
      case 'completed':
        return 'bg-green-100 border-green-300'
      case 'pending':
        return 'bg-gray-100 border-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Grant Allocation: The Three Phases
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">Demo</span>
            </h1>
            <p className="text-sm text-gray-500">Admin creates grant • Applicants apply & allocate trust • EigenTrust computes allocations</p>
          </div>
          <Link href="/demo/grant-demo" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Phase */}
        {currentPhase === 'intro' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-8">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fair Grant Allocation with EigenTrust</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              See how a grant admin creates an opportunity, applicants apply and rate each other with trust scores, and Modified EigenTrust computes fair allocations based on the community's collective judgment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                <div className="text-2xl mb-2">🏛</div>
                <h3 className="font-bold text-blue-900 mb-2">Phase 1: Admin Creates</h3>
                <p className="text-sm text-blue-800">Sets up a grant round with funding amount and criteria</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
                <div className="text-2xl mb-2">👥</div>
                <h3 className="font-bold text-purple-900 mb-2">Phase 2: Applicants Apply</h3>
                <p className="text-sm text-purple-800">Submit proposals and allocate trust to other applicants</p>
              </div>

              <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                <div className="text-2xl mb-2">⚙️</div>
                <h3 className="font-bold text-green-900 mb-2">Phase 3: EigenTrust</h3>
                <p className="text-sm text-green-800">Computes trust scores and final allocations</p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
            >
              Start the Journey →
            </button>
          </div>
        )}

        {/* Main Content for Phases 1-5 */}
        {currentPhase !== 'intro' && (
          <>
            {/* Phase Navigation */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-2 mb-6">
                {phases.slice(1).map((phase, idx) => {
                  const status = getPhaseStatus(phase)
                  const phaseNames = {
                    'admin-creates': 'Admin Creates',
                    'applicants-apply': 'Applicants Apply',
                    'applicants-trust': 'Allocate Trust',
                    'admin-computes': 'Compute Results',
                    'results': 'Results',
                  }
                  return (
                    <div key={phase} className="flex-1">
                      <div className={`p-4 rounded-lg border-2 ${getStatusColor(status)} transition-all`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-bold">{getStatusIcon(status)}</span>
                          <p className="text-sm font-semibold text-gray-900">{phaseNames[phase]}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Admin Side */}
              <div
                className={`transition-opacity duration-300 ${
                  focusedRole === 'applicants' ? 'opacity-40 pointer-events-none' : 'opacity-100'
                }`}
              >
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border-2 border-blue-300">
                  <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                    🏛 Grant Admin
                    {['admin-creates', 'admin-computes', 'results'].includes(currentPhase) && (
                      <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded font-semibold">Active</span>
                    )}
                  </h2>

                  {currentPhase === 'admin-creates' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">Creating a Grant Round</h3>
                      <div className="bg-white rounded p-4 space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Grant Round Name</label>
                          <p className="text-gray-900 font-semibold mt-1">AI Research Initiative 2025</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Total Funding Available</label>
                          <p className="text-gray-900 font-semibold text-lg mt-1">$500,000</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Status</label>
                          <p className="text-gray-900 font-semibold mt-1 bg-green-100 text-green-900 w-fit px-3 py-1 rounded">
                            PHASE_ONE_VETTING
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 bg-blue-100 p-3 rounded">
                        The admin has created the grant round. Now applicants can submit their proposals.
                      </p>
                    </div>
                  )}

                  {currentPhase === 'applicants-apply' && (
                    <div className="space-y-4 text-center text-gray-600">
                      <p>Waiting for applicants to submit proposals...</p>
                      <div className="animate-pulse">
                        <div className="inline-block">
                          <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPhase === 'applicants-trust' && (
                    <div className="space-y-4 text-center text-gray-600">
                      <p>Applicants are allocating trust to each other...</p>
                      <div className="animate-pulse">
                        <div className="inline-block">
                          <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPhase === 'admin-computes' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">Computing Allocations</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        The admin is about to run the EigenTrust algorithm on all the trust allocations from applicants...
                      </p>
                      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-6 text-center">
                        <div className="inline-block mb-3">
                          <div className="animate-spin">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                        <p className="font-semibold text-indigo-900">Running Modified EigenTrust...</p>
                        <p className="text-sm text-indigo-700 mt-1">Computing fair trust scores and allocations</p>
                      </div>
                    </div>
                  )}

                  {currentPhase === 'results' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">Final Allocations</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Based on EigenTrust scores, here are the allocations:
                      </p>
                      <div className="space-y-3">
                        <div className="bg-white rounded p-3 border-l-4 border-green-500">
                          <p className="font-semibold text-gray-900">Alice's Project</p>
                          <p className="text-sm text-gray-600">EigenTrust Score: 0.45</p>
                          <p className="text-lg font-bold text-green-600">$225,000 (45%)</p>
                        </div>
                        <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                          <p className="font-semibold text-gray-900">Bob's Project</p>
                          <p className="text-sm text-gray-600">EigenTrust Score: 0.35</p>
                          <p className="text-lg font-bold text-blue-600">$175,000 (35%)</p>
                        </div>
                        <div className="bg-white rounded p-3 border-l-4 border-purple-500">
                          <p className="font-semibold text-gray-900">Carol's Project</p>
                          <p className="text-sm text-gray-600">EigenTrust Score: 0.20</p>
                          <p className="text-lg font-bold text-purple-600">$100,000 (20%)</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Applicants Side */}
              <div
                className={`transition-opacity duration-300 ${
                  focusedRole === 'admin' ? 'opacity-40 pointer-events-none' : 'opacity-100'
                }`}
              >
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 border-2 border-purple-300">
                  <h2 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-2">
                    👥 Applicants
                    {['applicants-apply', 'applicants-trust'].includes(currentPhase) && (
                      <span className="text-xs bg-purple-200 text-purple-900 px-2 py-1 rounded font-semibold">Active</span>
                    )}
                  </h2>

                  {currentPhase === 'admin-creates' && (
                    <div className="space-y-4 text-center text-gray-600">
                      <p>Waiting for grant round to open...</p>
                    </div>
                  )}

                  {currentPhase === 'applicants-apply' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">Submitting Proposals</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Applicants describe their projects and past contributions:
                      </p>
                      <div className="space-y-3">
                        <div className="bg-white rounded p-3 border border-gray-200">
                          <p className="font-semibold text-gray-900">Alice: "ML for Climate"</p>
                          <p className="text-xs text-gray-600 mt-1">Neural networks applied to climate prediction...</p>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">Submitted</span>
                        </div>
                        <div className="bg-white rounded p-3 border border-gray-200">
                          <p className="font-semibold text-gray-900">Bob: "Privacy Analytics"</p>
                          <p className="text-xs text-gray-600 mt-1">Differential privacy techniques for data analysis...</p>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">Submitted</span>
                        </div>
                        <div className="bg-white rounded p-3 border border-gray-200">
                          <p className="font-semibold text-gray-900">Carol: "LLM Efficiency"</p>
                          <p className="text-xs text-gray-600 mt-1">Making large language models more efficient...</p>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">Submitted</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPhase === 'applicants-trust' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">Allocating Trust (0-100 points)</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Each applicant distributes 100 trust points to rate other applicants. This becomes the input for EigenTrust.
                      </p>
                      <div className="space-y-3">
                        <div className="bg-white rounded p-3 border border-gray-200">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Alice's Allocations:</p>
                          <div className="ml-4 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Bob: 45 points</span>
                              <div className="w-16 h-2 bg-gray-200 rounded" style={{ backgroundImage: 'linear-gradient(90deg, #3b82f6 45%, #e5e7eb 45%)' }} />
                            </div>
                            <div className="flex justify-between">
                              <span>Carol: 30 points</span>
                              <div className="w-16 h-2 bg-gray-200 rounded" style={{ backgroundImage: 'linear-gradient(90deg, #3b82f6 30%, #e5e7eb 30%)' }} />
                            </div>
                            <div className="flex justify-between">
                              <span>Unallocated: 25 points</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded p-3 border border-gray-200">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Bob's Allocations:</p>
                          <div className="ml-4 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Alice: 55 points</span>
                              <div className="w-16 h-2 bg-gray-200 rounded" style={{ backgroundImage: 'linear-gradient(90deg, #8b5cf6 55%, #e5e7eb 55%)' }} />
                            </div>
                            <div className="flex justify-between">
                              <span>Carol: 45 points</span>
                              <div className="w-16 h-2 bg-gray-200 rounded" style={{ backgroundImage: 'linear-gradient(90deg, #8b5cf6 45%, #e5e7eb 45%)' }} />
                            </div>
                          </div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                          <p>
                            <strong>Key:</strong> Trust allocations are the input to EigenTrust. The algorithm computes how these opinions propagate through the network to determine fair allocations.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPhase === 'admin-computes' && (
                    <div className="space-y-4 text-center text-gray-600">
                      <p>Waiting for EigenTrust results...</p>
                      <div className="animate-pulse">
                        <div className="inline-block">
                          <svg className="w-8 h-8 text-purple-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPhase === 'results' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">Results - Who Got Funded?</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        All applicants can see the allocations. The process was transparent and fair.
                      </p>
                      <div className="space-y-3">
                        <div className="bg-white rounded p-3 border-l-4 border-green-500">
                          <p className="font-semibold text-gray-900">Alice ✓ Funded</p>
                          <p className="text-sm text-gray-600">$225,000 allocation</p>
                        </div>
                        <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                          <p className="font-semibold text-gray-900">Bob ✓ Funded</p>
                          <p className="text-sm text-gray-600">$175,000 allocation</p>
                        </div>
                        <div className="bg-white rounded p-3 border-l-4 border-purple-500">
                          <p className="font-semibold text-gray-900">Carol ✓ Funded</p>
                          <p className="text-sm text-gray-600">$100,000 allocation</p>
                        </div>
                      </div>
                      <Link
                        href="/trust-property-proof"
                        target="_blank"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-block mt-4"
                      >
                        Learn about Modified EigenTrust algorithm →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Role Focus Buttons */}
            <div className="mb-8 flex justify-center gap-3">
              <button
                onClick={() => setFocusedRole('both')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  focusedRole === 'both'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Both Sides
              </button>
              <button
                onClick={() => setFocusedRole('admin')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  focusedRole === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Admin Only
              </button>
              <button
                onClick={() => setFocusedRole('applicants')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  focusedRole === 'applicants'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Applicants Only
              </button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentIndex === 0}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-900 rounded-lg font-medium transition-colors"
              >
                ← Previous
              </button>

              <div className="text-sm text-gray-600">
                Phase {currentIndex} of {phases.length - 1}
              </div>

              <button
                onClick={handleNext}
                disabled={currentIndex === phases.length - 1}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
