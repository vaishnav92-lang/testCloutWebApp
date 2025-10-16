/**
 * HIRING MANAGER DASHBOARD COMPONENT
 *
 * This component displays the hiring manager interface for users with
 * isHiringManager = true. It shows job postings and allows creating new ones.
 *
 * Features:
 * - List of active jobs
 * - "Post a New Job" primary CTA
 * - Job status indicators
 * - Quick actions for managing jobs
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminIntroductionTool from './AdminIntroductionTool'

interface Job {
  id: string
  title: string
  status: string
  locationType: string
  locationCity?: string
  createdAt: string
  publishedAt?: string
  referralBudget?: number
  _count?: {
    applications: number
  }
}

interface HiringManagerDashboardProps {
  userInfo: {
    firstName?: string
    lastName?: string
    email: string
  }
  isAdmin?: boolean
}

export default function HiringManagerDashboard({ userInfo, isAdmin }: HiringManagerDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingJobs, setDeletingJobs] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/hiring-manager/jobs')
        if (response.ok) {
          const data = await response.json()
          setJobs(data.jobs)
        }
      } catch (error) {
        console.error('Error fetching jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

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

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingJobs(prev => new Set([...prev, jobId]))

    try {
      const response = await fetch(`/api/hiring-manager/jobs/${jobId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove job from local state
        setJobs(prev => prev.filter(job => job.id !== jobId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete job')
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job. Please try again.')
    } finally {
      setDeletingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-gray-500">Loading your job postings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Hiring Manager Dashboard
            </h1>
            <p className="text-gray-600">
              Post jobs that surface illegible talent through our trusted network
            </p>
          </div>
          <button
            onClick={() => router.push('/hiring-manager/job/new')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Post a New Job
          </button>
        </div>
      </div>

      {/* Job Listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Job Postings</h2>
          <span className="text-sm text-gray-500">
            {jobs.length} total job{jobs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first job posting to start finding great candidates through our network
            </p>
            <button
              onClick={() => router.push('/hiring-manager/job/new')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Job Posting
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-gray-600">{getLocationDisplay(job.locationType, job.locationCity)}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {job.referralBudget && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Referral Budget:</span> ${job.referralBudget.toLocaleString()}
                    </div>
                  )}
                  {job._count?.applications && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Applications:</span> {job._count.applications}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Created {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                  {job.publishedAt && (
                    <div className="text-xs text-gray-500">
                      Published {new Date(job.publishedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/hiring-manager/job/${job.id}`)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => router.push(`/hiring-manager/job/${job.id}/edit`)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
                  >
                    {job.status === 'DRAFT' ? 'Continue Editing' : 'Edit Job'}
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job.id, job.title)}
                    disabled={deletingJobs.has(job.id)}
                    className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    {deletingJobs.has(job.id) ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {jobs.filter(j => j.status === 'ACTIVE').length}
            </div>
            <div className="text-sm text-gray-600">Active Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {jobs.filter(j => j.status === 'DRAFT').length}
            </div>
            <div className="text-sm text-gray-600">Drafts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter(j => j.status === 'FILLED').length}
            </div>
            <div className="text-sm text-gray-600">Filled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {jobs.reduce((sum, job) => sum + (job._count?.applications || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
        </div>
      </div>

      {/* Admin Introduction Tool - Only show for Clout admins */}
      {isAdmin && <AdminIntroductionTool />}
    </div>
  )
}