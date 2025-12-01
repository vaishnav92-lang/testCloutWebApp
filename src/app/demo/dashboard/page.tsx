'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDemoContext } from '@/components/providers/demo-provider'
import { useDemoAuth } from '@/hooks/useDemo'

export default function DemoDashboardPage() {
  const router = useRouter()
  useDemoAuth()
  const { state, clearDemoData } = useDemoContext()

  const handleLogout = () => {
    clearDemoData()
    localStorage.removeItem('demoToken')
    router.push('/demo/auth/login')
  }

  const pendingEndorsements = state.endorsements.filter(
    (e) => e.status === 'PENDING_CANDIDATE_ACTION'
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Clout Careers <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">Demo</span>
            </h1>
            <p className="text-sm text-gray-500">Session-only demo • Data will be cleared on logout</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, <strong>{state.currentUser.firstName}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Logout (Clear Data)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Clout Score</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">
              {state.currentUser.cloutScore}
            </p>
            <p className="text-xs text-gray-500 mt-2">Tier: {state.currentUser.tier}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Trust Connections</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {state.relationships.length}
            </p>
            <p className="text-xs text-gray-500 mt-2">Established relationships</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Endorsements Given</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {state.endorsements.filter((e) => e.fromUserId === state.currentUser.id).length}
            </p>
            <p className="text-xs text-gray-500 mt-2">Active endorsements</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Pending Actions</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {pendingEndorsements.length}
            </p>
            <p className="text-xs text-gray-500 mt-2">Awaiting decisions</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Endorsements */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Pending Endorsements</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Decisions awaiting on endorsements you received
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {pendingEndorsements.length > 0 ? (
                  pendingEndorsements.map((endorsement) => (
                    <div key={endorsement.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {endorsement.fromUserName}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            "{endorsement.message}"
                          </p>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {endorsement.strengths.map((strength, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Link
                          href={`/demo/endorsements/${endorsement.id}`}
                          className="ml-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No pending endorsements
                  </div>
                )}
              </div>
            </div>

            {/* Jobs */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Job Opportunities</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {state.jobs.length} active openings
                  </p>
                </div>
                <Link
                  href="/demo/jobs"
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  View All →
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {state.jobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="p-6 hover:bg-gray-50">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.company}</p>
                    <p className="text-sm text-gray-500 mt-2">{job.location}</p>
                    {job.salary && (
                      <p className="text-sm font-medium text-green-600 mt-2">
                        {job.salary}
                      </p>
                    )}
                    <Link
                      href={`/demo/jobs/${job.id}`}
                      className="inline-block mt-3 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    >
                      Learn More →
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Grant Allocation Demo */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow border border-green-200">
              <div className="p-6 border-b border-green-200">
                <h2 className="text-xl font-bold text-gray-900">Grant Allocation</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Learn how to manage grants with trust-weighted recommendations
                </p>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700 mb-4">
                  Explore an interactive tutorial on creating grants, selecting recommenders, and managing applications based on trust allocations.
                </p>
                <Link
                  href="/demo/grant-demo"
                  className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Explore Grant Demo →
                </Link>
              </div>
            </div>

            {/* Referral Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Your Referrals</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Active referrals and placements
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {state.referrals.slice(0, 3).map((referral) => (
                  <div key={referral.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {referral.jobTitle}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Referred by: {referral.hirerName}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Status:{' '}
                          <span
                            className={`font-medium ${
                              referral.status === 'HIRED'
                                ? 'text-green-600'
                                : referral.status === 'INTERVIEWING'
                                  ? 'text-blue-600'
                                  : 'text-orange-600'
                            }`}
                          >
                            {referral.status}
                          </span>
                        </p>
                      </div>
                      {referral.status === 'HIRED' && (
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                          ✓ Placed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Trust Allocations */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Trust Network</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your trust allocations
                </p>
              </div>
              <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {state.trustAllocations.map((trust) => (
                  <div key={trust.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {trust.toUserName}
                      </span>
                      <span className="text-lg font-bold text-indigo-600">
                        {trust.allocation}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${trust.allocation}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50">
                <Link
                  href="/demo/trust-allocations"
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  Manage Allocations →
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Network</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {state.relationships.length} trusted connections
                </p>
              </div>
              <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                {state.relationships.map((rel) => (
                  <div key={rel.id} className="p-4 hover:bg-gray-50">
                    <p className="font-medium text-gray-900 text-sm">
                      {rel.toUserName}
                    </p>
                    <p className="text-xs text-gray-600 capitalize mt-1">
                      {rel.type} • Since {new Date(rel.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50">
                <Link
                  href="/demo/relationships"
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  View Network →
                </Link>
              </div>
            </div>

            {/* Demo Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">💡 Demo Mode</p>
              <p className="text-xs text-blue-800 mb-3">
                All data is stored in your browser session only. Logging out or
                refreshing will clear all changes.
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>✓ No account needed</li>
                <li>✓ No data saved</li>
                <li>✓ Safe to explore</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
