'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import EndorsementForm from '@/components/EndorsementForm'
import TrustedContactsSidebar from '@/components/TrustedContactsSidebar'

export default function JobsOnCloutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [endorsementFormOpen, setEndorsementFormOpen] = useState(false)
  const [jobReferralContext, setJobReferralContext] = useState(null)
  const [draggedContact, setDraggedContact] = useState(null)
  const [dropTargetJob, setDropTargetJob] = useState(null)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchJobs()
    }
  }, [status])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(Array.isArray(data) ? data : [])
      } else {
        setJobs([])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleContactDragStart = (contact) => setDraggedContact(contact)
  const handleContactDragEnd = () => {
    setDraggedContact(null)
    setDropTargetJob(null)
  }
  const handleJobDragOver = (e, job) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDropTargetJob(job.id)
  }
  const handleJobDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTargetJob(null)
    }
  }

  const handleJobDrop = async (e, job) => {
    e.preventDefault()
    setDropTargetJob(null)
    const contact = JSON.parse(e.dataTransfer.getData('application/json'))

    try {
      const response = await fetch('/api/endorsements/link-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, endorsedUserEmail: contact.email }),
      })
      const data = await response.json()
      if (response.ok) {
        if (data.action === 'linked') {
          alert(`✅ ${data.message}`)
        } else if (data.action === 'create_new') {
          setJobReferralContext({ job: data.jobContext, contact: contact })
          setEndorsementFormOpen(true)
        }
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      alert('❌ Failed to process referral')
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <TrustedContactsSidebar
            onContactDragStart={handleContactDragStart}
            onContactDragEnd={handleContactDragEnd}
            className="sticky top-6"
          />
        </div>
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-8"><div className="text-gray-500">Loading jobs...</div></div>
          ) : !jobs.length ? (
            <div className="text-center py-8"><div className="text-gray-500">No jobs available.</div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onDragOver={(e) => handleJobDragOver(e, job)}
                  onDragLeave={handleJobDragLeave}
                  onDrop={(e) => handleJobDrop(e, job)}
                  className={`relative bg-white border rounded-lg p-6 transition-all duration-200 cursor-pointer ${
                    dropTargetJob === job.id
                      ? 'border-blue-400 shadow-lg bg-blue-50 ring-2 ring-blue-200'
                      : draggedContact
                      ? 'border-gray-300 hover:border-blue-300 hover:shadow-md'
                      : 'border-gray-200 hover:shadow-md'
                  }`}
                  onClick={() => !draggedContact && router.push(`/jobs/${job.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <p className="text-sm font-medium text-indigo-600">{job.company.name}</p>
                      <p className="text-xs text-gray-500">{job.company.industry}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">📍</span>
                      <span className="ml-2">{job.remote ? 'Remote' : job.location}</span>
                    </div>
                    {job.salaryMin && job.salaryMax && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">💰</span>
                        <span className="ml-2">
                          ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">👥</span>
                      <span className="ml-2">{job._count.applications} application{job._count.applications !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{job.description}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {job.requirements.slice(0, 2).map((req, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {req}
                      </span>
                    ))}
                    {job.requirements.length > 2 && (
                      <span className="text-xs text-gray-500">+{job.requirements.length - 2} more</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/jobs/${job.id}/refer`)
                      }}
                    >
                      Refer Talent
                    </button>
                    <button
                      className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/jobs/${job.id}/refer?mode=delegate`)
                      }}
                    >
                      Forward Request
                    </button>
                    <button
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/jobs/${job.id}`)
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EndorsementForm
        isOpen={endorsementFormOpen}
        onClose={() => {
          setEndorsementFormOpen(false)
          setJobReferralContext(null)
        }}
        onSuccess={() => {
          setEndorsementFormOpen(false)
          if (jobReferralContext) {
            alert(`✅ Successfully referred ${jobReferralContext.contact.firstName || jobReferralContext.contact.email} for ${jobReferralContext.job.title}!`)
          }
          setJobReferralContext(null)
        }}
        userInfo={{ firstName: session?.user?.firstName || '', lastName: session?.user?.lastName || '', email: session?.user?.email || '' }}
        isJobReferral={!!jobReferralContext}
        jobReferralContext={jobReferralContext}
      />
    </>
  )
}