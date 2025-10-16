'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Job {
  id: string
  title: string
  description?: string
  requirements: string[]
  salaryMin?: number
  salaryMax?: number
  currency: string
  locationType: string
  locationCity?: string
  status: string
  createdAt: string
  publishedAt?: string
  referralBudget?: number
  dayToDayDescription?: string
  archetypes?: string
  nonWorkSignals?: string
  mustHaves?: string
  roleChallenges?: string
  workingStyle?: string
  excitingWork?: string
  specialOpportunity?: string
  growthPath?: string
  equityOffered: boolean
  equityRange?: string
  company: {
    name: string
  }
  _count?: {
    applications: number
  }
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/hiring-manager/jobs/${params.id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch job')
        }

        setJob(data.job)
      } catch (error) {
        console.error('Error fetching job:', error)
        setError(error instanceof Error ? error.message : 'Failed to load job')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchJob()
    }
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'FILLED':
        return 'bg-blue-100 text-blue-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading job details...</div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Job not found'}</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Back to Dashboard
                  </button>
                  <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                    {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
                  </span>
                  <button
                    onClick={() => router.push(`/hiring-manager/job/${job.id}/edit`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Job
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Job Overview */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Company:</span> {job.company.name}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {getLocationDisplay(job.locationType, job.locationCity)}
                  </div>
                  {job.salaryMin && job.salaryMax && (
                    <div>
                      <span className="font-medium">Salary:</span> ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} {job.currency}
                    </div>
                  )}
                  {job.equityOffered && job.equityRange && (
                    <div>
                      <span className="font-medium">Equity:</span> {job.equityRange}
                    </div>
                  )}
                  {job.referralBudget && (
                    <div>
                      <span className="font-medium">Referral Budget:</span> ${job.referralBudget.toLocaleString()}
                    </div>
                  )}
                  {job._count?.applications !== undefined && (
                    <div>
                      <span className="font-medium">Applications:</span> {job._count.applications}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Created:</span> {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                  {job.publishedAt && (
                    <div>
                      <span className="font-medium">Published:</span> {new Date(job.publishedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description */}
              {job.description && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                  </div>
                </div>
              )}

              {/* Day-to-Day Description */}
              {job.dayToDayDescription && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Day-to-Day</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.dayToDayDescription}</p>
                  </div>
                </div>
              )}

              {/* Must Haves */}
              {job.mustHaves && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Must Haves</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.mustHaves}</p>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Additional Requirements</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Role Challenges */}
              {job.roleChallenges && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Role Challenges</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.roleChallenges}</p>
                  </div>
                </div>
              )}

              {/* Growth Path */}
              {job.growthPath && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Growth Path</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.growthPath}</p>
                  </div>
                </div>
              )}

              {/* Exciting Work */}
              {job.excitingWork && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Exciting Work</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.excitingWork}</p>
                  </div>
                </div>
              )}

              {/* Working Style */}
              {job.workingStyle && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Working Style</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.workingStyle}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => router.push(`/hiring-manager/job/${job.id}/edit`)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Edit Job
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}