/**
 * COMPANY DASHBOARD PAGE
 *
 * Combined internal job board and company settings for company admins
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type InternalBoardMode = 'PARTITIONED' | 'OPTIONAL' | 'OPEN_TO_NETWORK'

interface Job {
  id: string
  title: string
  description?: string
  location?: string
  remote: boolean
  salaryMin?: number
  salaryMax?: number
  currency: string
  jobVisibility: string
  isInternalOnly: boolean
  referralBudget?: number
  status: string
  createdAt: string
}

interface CompanySettings {
  id: string
  name: string
  internalBoardMode: InternalBoardMode
}

export default function CompanyDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [company, setCompany] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterVisibility, setFilterVisibility] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'board' | 'settings'>('board')

  const modeDescriptions: Record<InternalBoardMode, { title: string; description: string }> = {
    PARTITIONED: {
      title: 'Partitioned (Isolated)',
      description: 'Jobs stay completely internal. Network access must be explicitly enabled per-job. Maximum privacy.',
    },
    OPTIONAL: {
      title: 'Optional (Hybrid)',
      description:
        'Company members can choose per-job whether to include Clout network. Default is network-only.',
    },
    OPEN_TO_NETWORK: {
      title: 'Open to Network (Default)',
      description:
        'Jobs are visible to Clout network by default. Can restrict to company-only on specific jobs if needed.',
    },
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, settingsRes] = await Promise.all([
          fetch('/api/company/jobs'),
          fetch('/api/company/settings'),
        ])

        if (!jobsRes.ok || !settingsRes.ok) {
          if (jobsRes.status === 401 || settingsRes.status === 401) {
            router.push('/api/auth/signin')
            return
          }
          throw new Error('Failed to fetch data')
        }

        const jobsData = await jobsRes.json()
        const settingsData = await settingsRes.json()
        setJobs(jobsData)
        setCompany(settingsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.email) {
      fetchData()
    }
  }, [session, router])


  const handleChangeMode = async (newMode: InternalBoardMode) => {
    if (!company) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/company/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalBoardMode: newMode,
        }),
      })

      if (!res.ok) throw new Error('Failed to update settings')

      const updated = await res.json()
      setCompany(updated)
      setSuccess('Company mode updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating settings')
    } finally {
      setSaving(false)
    }
  }

  const visibilityBadge = (visibility: string, isInternal: boolean) => {
    let bgColor = 'bg-gray-100 text-gray-700'
    let label = visibility

    if (visibility === 'COMPANY_ONLY') {
      bgColor = 'bg-purple-100 text-purple-700'
      label = '🔒 Company Only'
    } else if (visibility === 'COMPANY_AND_NETWORK') {
      bgColor = 'bg-blue-100 text-blue-700'
      label = '🌐 Company & Network'
    } else if (visibility === 'PUBLIC') {
      bgColor = 'bg-green-100 text-green-700'
      label = '🌍 Public'
    }

    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${bgColor}`}>{label}</span>
  }

  const salaryRange = (job: Job) => {
    if (!job.salaryMin && !job.salaryMax) return null
    const min = job.salaryMin ? `${job.currency} ${job.salaryMin.toLocaleString()}` : 'Not specified'
    const max = job.salaryMax ? `${job.currency} ${job.salaryMax.toLocaleString()}` : ''
    return `${min}${max ? ` - ${max}` : ''}`
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to view company dashboard</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  const filteredJobs = filterVisibility
    ? jobs.filter((job) => job.jobVisibility === filterVisibility)
    : jobs

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Board</h1>
          {company && <p className="text-gray-600 mt-1">{company.name}</p>}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('board')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'board'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Job Board
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Job Board Tab */}
        {activeTab === 'board' && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Internal Job Board</h2>
                <p className="text-gray-600 mt-1">Company opportunities and open positions</p>
              </div>
              <Link
                href="/jobs/create"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post New Job
              </Link>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterVisibility(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterVisibility === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Jobs ({jobs.length})
              </button>
              <button
                onClick={() => setFilterVisibility('COMPANY_ONLY')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterVisibility === 'COMPANY_ONLY'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                🔒 Internal ({jobs.filter((j) => j.jobVisibility === 'COMPANY_ONLY').length})
              </button>
              <button
                onClick={() => setFilterVisibility('COMPANY_AND_NETWORK')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterVisibility === 'COMPANY_AND_NETWORK'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                🌐 Hybrid ({jobs.filter((j) => j.jobVisibility === 'COMPANY_AND_NETWORK').length})
              </button>
              <button
                onClick={() => setFilterVisibility('PUBLIC')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterVisibility === 'PUBLIC'
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                🌍 Public ({jobs.filter((j) => j.jobVisibility === 'PUBLIC').length})
              </button>
            </div>

            {/* Jobs List */}
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">
                  {filterVisibility ? 'No jobs with this visibility setting' : 'No jobs posted yet'}
                </p>
                <Link href="/jobs/create" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
                  Post your first job →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        {job.description && (
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{job.description}</p>
                        )}
                      </div>
                      {visibilityBadge(job.jobVisibility, job.isInternalOnly)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      {job.location && (
                        <span className="flex items-center">
                          📍 {job.location}
                          {job.remote && ' (Remote)'}
                        </span>
                      )}
                      {job.remote && !job.location && <span>🌐 Remote</span>}

                      {salaryRange(job) && <span>💰 {salaryRange(job)}</span>}

                      {job.referralBudget && (
                        <span className="text-green-600 font-medium">
                          💳 ${job.referralBudget.toLocaleString()} referral budget
                        </span>
                      )}

                      <span className="ml-auto text-xs text-gray-500">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Pro tip:</strong> Jobs marked as "Company Only" are only visible to your team members. "Hybrid"
                jobs are visible to both your company and the Clout network. Use "Public" to maximize your referral reach.
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && company && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Settings</h2>

            {/* Internal Job Board Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">Board Configuration</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Choose how your internal job board interacts with the Clout network
                </p>
              </div>

              {/* Mode Selection */}
              <div className="space-y-3">
                {(Object.keys(modeDescriptions) as InternalBoardMode[]).map((mode) => (
                  <label key={mode} className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderColor: company.internalBoardMode === mode ? '#4f46e5' : '#e5e7eb',
                      backgroundColor: company.internalBoardMode === mode ? '#f0f4ff' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="board-mode"
                      value={mode}
                      checked={company.internalBoardMode === mode}
                      onChange={(e) => handleChangeMode(e.target.value as InternalBoardMode)}
                      disabled={saving}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{modeDescriptions[mode].title}</p>
                      <p className="text-sm text-gray-600 mt-1">{modeDescriptions[mode].description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Mode-specific notes */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Current Mode: {modeDescriptions[company.internalBoardMode].title}</h5>
                <p className="text-sm text-blue-800">{modeDescriptions[company.internalBoardMode].description}</p>

                {company.internalBoardMode === 'PARTITIONED' && (
                  <div className="mt-3 text-sm text-blue-800">
                    <p className="font-medium mb-1">What this means:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>New jobs are only visible to company members by default</li>
                      <li>You can explicitly mark jobs to include network referrals</li>
                      <li>Employee profiles are company-only unless they opt in</li>
                    </ul>
                  </div>
                )}

                {company.internalBoardMode === 'OPTIONAL' && (
                  <div className="mt-3 text-sm text-blue-800">
                    <p className="font-medium mb-1">What this means:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Each job posting can choose its audience</li>
                      <li>Company members decide per-job visibility</li>
                      <li>Flexible approach to network engagement</li>
                    </ul>
                  </div>
                )}

                {company.internalBoardMode === 'OPEN_TO_NETWORK' && (
                  <div className="mt-3 text-sm text-blue-800">
                    <p className="font-medium mb-1">What this means:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Jobs are visible to the Clout network by default</li>
                      <li>Can restrict specific jobs to company-only if needed</li>
                      <li>Maximizes referral opportunities</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-2">About Internal Job Boards</h4>
              <p className="text-sm text-gray-600 mb-3">
                An internal job board gives your company a dedicated space to post opportunities. Control how these
                opportunities are shared with the broader Clout network.
              </p>
              <p className="text-sm text-gray-600">
                Change your configuration at any time as your company's needs evolve.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
