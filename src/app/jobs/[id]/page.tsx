/**
 * JOB DETAIL PAGE
 *
 * This page displays comprehensive job details including all the questionnaire
 * data entered by the hiring manager. Shows the job in a candidate-friendly format.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface JobDetail {
  id: string
  title: string
  locationType: string
  locationCity?: string
  salaryMin?: number
  salaryMax?: number
  currency: string
  equityOffered: boolean
  equityRange?: string
  dayToDayDescription?: string
  archetypes?: string
  nonWorkSignals?: string
  commonMismatches?: string
  roleChallenges?: string
  workingStyle?: string
  excitingWork?: string
  specialOpportunity?: string
  growthPath?: string
  mustHaves?: string
  referralBudget?: number
  referralPreference: string
  status: string
  publishedAt?: string
  createdAt: string
  company: {
    name: string
    logoUrl?: string
    industry?: string
    size?: string
  }
  owner: {
    firstName?: string
    lastName?: string
    email: string
  }
  _count: {
    applications: number
  }
}

interface JobDetailPageProps {
  params: {
    id: string
  }
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setJob(data.job)
        } else if (response.status === 404) {
          setError('Job not found')
        } else {
          setError('Failed to load job details')
        }
      } catch (error) {
        console.error('Error fetching job:', error)
        setError('Failed to load job details')
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [params.id])

  const getLocationDisplay = (locationType: string, locationCity?: string) => {
    switch (locationType) {
      case 'REMOTE':
        return 'Remote'
      case 'HYBRID':
        return `Hybrid (${locationCity || 'Location TBD'})`
      case 'IN_PERSON':
        return locationCity || 'In-person'
      default:
        return 'Location TBD'
    }
  }

  const formatSalary = (min?: number, max?: number, currency: string = 'USD') => {
    if (!min && !max) return 'Competitive'
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
    if (min) return `${currency} ${min.toLocaleString()}+`
    if (max) return `Up to ${currency} ${max.toLocaleString()}`
    return 'Competitive'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading job details...</div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The job you are looking for does not exist.'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {job.company.name}
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {getLocationDisplay(job.locationType, job.locationCity)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
              </div>
              {job.equityOffered && job.equityRange && (
                <div className="text-sm text-gray-600">+ Equity: {job.equityRange}</div>
              )}
              {job.referralBudget && (
                <div className="text-sm font-medium text-blue-600 mt-2">
                  Referral Bonus: {job.currency} {job.referralBudget.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                job.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                job.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {job.status}
              </span>
              <span className="text-sm text-gray-500">
                {job._count.applications} application{job._count.applications !== 1 ? 's' : ''}
              </span>
            </div>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Apply Now
            </button>
          </div>
        </div>

        {/* Job Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Day-to-day Description */}
            {job.dayToDayDescription && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">What You'll Do</h2>
                <p className="text-gray-700 leading-relaxed">{job.dayToDayDescription}</p>
              </div>
            )}

            {/* Who Would Excel */}
            {job.archetypes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Who Would Excel</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.archetypes}</p>
                </div>
              </div>
            )}

            {/* Non-work Signals */}
            {job.nonWorkSignals && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Look For Beyond Work</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.nonWorkSignals}</p>
              </div>
            )}

            {/* Working Style */}
            {job.workingStyle && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Work</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.workingStyle}</p>
              </div>
            )}

            {/* Exciting Work */}
            {job.excitingWork && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">What Gets Us Excited</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.excitingWork}</p>
              </div>
            )}

            {/* Special Opportunity */}
            {job.specialOpportunity && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">Why This Opportunity is Special</h2>
                <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">{job.specialOpportunity}</p>
              </div>
            )}

            {/* Growth Path */}
            {job.growthPath && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Growth & Development</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.growthPath}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Must-haves */}
            {job.mustHaves && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Must-Haves</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.mustHaves}</p>
              </div>
            )}

            {/* Red Flags */}
            {(job.commonMismatches || job.roleChallenges) && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4">Important Considerations</h3>
                {job.commonMismatches && (
                  <div className="mb-4">
                    <h4 className="font-medium text-red-800 mb-2">Who Might Struggle:</h4>
                    <p className="text-red-700 text-sm leading-relaxed whitespace-pre-wrap">{job.commonMismatches}</p>
                  </div>
                )}
                {job.roleChallenges && (
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Role Challenges:</h4>
                    <p className="text-red-700 text-sm leading-relaxed whitespace-pre-wrap">{job.roleChallenges}</p>
                  </div>
                )}
              </div>
            )}

            {/* Company Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Company</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Company:</span>
                  <span className="text-sm text-gray-900">{job.company.name}</span>
                </div>
                {job.company.industry && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Industry:</span>
                    <span className="text-sm text-gray-900">{job.company.industry}</span>
                  </div>
                )}
                {job.company.size && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Size:</span>
                    <span className="text-sm text-gray-900">{job.company.size}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Posted Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 space-y-1">
                <div>Posted: {new Date(job.createdAt).toLocaleDateString()}</div>
                {job.publishedAt && (
                  <div>Published: {new Date(job.publishedAt).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}