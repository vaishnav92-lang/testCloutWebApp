/**
 * JOB REFERRAL PAGE
 *
 * Dedicated page for referring talent to a specific job using endorsement form.
 * Uses the same comprehensive form structure as endorsements but tags to specific job.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Job {
  id: string
  title: string
  company: {
    name: string
  }
  referralBudget?: number
  currency: string
}

interface FormData {
  candidateEmail: string
  candidateName: string
  relationship: string
  workTogether: string
  strengths: string
  rolesValueAdd: string
  workOutput: string
  hoursInteraction: string
  complementaryPartner: string
  recommendation: string
}

interface ReferralPageProps {
  params: {
    id: string
  }
}

export default function JobReferralPage({ params }: ReferralPageProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState<FormData>({
    candidateEmail: '',
    candidateName: '',
    relationship: '',
    workTogether: '',
    strengths: '',
    rolesValueAdd: '',
    workOutput: '',
    hoursInteraction: '',
    complementaryPartner: '',
    recommendation: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setJob(data.job)
        } else {
          setError('Job not found')
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/referrals/job-endorsement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: params.id,
          ...formData,
          referrerEmail: session?.user?.email,
          referrerName: `${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setFormData({
          candidateEmail: '',
          candidateName: '',
          relationship: '',
          workTogether: '',
          strengths: '',
          rolesValueAdd: '',
          workOutput: '',
          hoursInteraction: '',
          complementaryPartner: '',
          recommendation: ''
        })
      } else {
        setError(data.error || 'Failed to submit referral')
      }
    } catch (error) {
      console.error('Error submitting referral:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="text-green-400 text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Referral Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Your referral for {formData.candidateName || formData.candidateEmail} has been submitted for the {job.title} position.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/jobs/${job.id}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Back to Job Details
              </button>
              <button
                onClick={() => {
                  setSuccess(false)
                  setFormData({
                    candidateEmail: '',
                    candidateName: '',
                    relationship: '',
                    workTogether: '',
                    strengths: '',
                    rolesValueAdd: '',
                    workOutput: '',
                    hoursInteraction: '',
                    complementaryPartner: '',
                    recommendation: ''
                  })
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Refer Another Person
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Refer Someone for this Role</h1>
              <p className="text-lg text-gray-700">{job.title} at {job.company.name}</p>
            </div>
            {job.referralBudget && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Referral Bonus</div>
                <div className="text-lg font-bold text-green-600">
                  {job.currency} {job.referralBudget.toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to job details
          </button>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Privacy Protected:</strong> The person you refer won't see what you write - only whether the hiring manager wants to connect with them.
            </p>
          </div>
        </div>

        {/* Referral Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Person Being Referred */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Their Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.candidateName}
                  onChange={(e) => handleInputChange('candidateName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Their Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.candidateEmail}
                  onChange={(e) => handleInputChange('candidateEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="john@company.com"
                />
              </div>
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How do you know them? *
              </label>
              <textarea
                required
                rows={2}
                value={formData.relationship}
                onChange={(e) => handleInputChange('relationship', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="We worked together at Company X as teammates on the engineering team..."
              />
            </div>

            {/* Work Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe your work experience with them *
              </label>
              <textarea
                required
                rows={3}
                value={formData.workTogether}
                onChange={(e) => handleInputChange('workTogether', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="We collaborated on several projects over 2 years. I directly observed their work on..."
              />
            </div>

            {/* Key Strengths */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What are their key strengths? *
              </label>
              <textarea
                required
                rows={3}
                value={formData.strengths}
                onChange={(e) => handleInputChange('strengths', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Exceptional at problem-solving, great communicator, strong technical skills in..."
              />
            </div>

            {/* Roles Value Add */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What types of roles would they add most value in? *
              </label>
              <textarea
                required
                rows={3}
                value={formData.rolesValueAdd}
                onChange={(e) => handleInputChange('rolesValueAdd', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="They would excel in senior engineering roles, technical leadership positions, or roles requiring deep system architecture expertise..."
              />
            </div>

            {/* Work Output */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What type of work output of theirs have you seen? *
              </label>
              <textarea
                required
                rows={3}
                value={formData.workOutput}
                onChange={(e) => handleInputChange('workOutput', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="I've reviewed their code, architecture documents, technical presentations, project deliverables..."
              />
            </div>

            {/* Hours of Interaction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How many hours have you interacted with them? *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: '0-1', label: '0-1 hours' },
                  { value: '1-5', label: '1-5 hours' },
                  { value: '5-20', label: '5-20 hours' },
                  { value: '20+', label: '20+ hours' }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`
                      relative flex items-center justify-center px-3 py-2 border rounded-md cursor-pointer transition-all
                      ${formData.hoursInteraction === option.value
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="hoursInteraction"
                      value={option.value}
                      checked={formData.hoursInteraction === option.value}
                      onChange={(e) => handleInputChange('hoursInteraction', e.target.value)}
                      className="sr-only"
                      required
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Complementary Partner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                If their employer were to hire someone to complement their strengths (behaviorally), what type of person should they hire as the partner? *
              </label>
              <textarea
                required
                rows={3}
                value={formData.complementaryPartner}
                onChange={(e) => handleInputChange('complementaryPartner', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Someone who excels at external communication and stakeholder management, as they're more focused on deep technical work..."
              />
            </div>

            {/* Recommendation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Would you recommend them? Why? *
              </label>
              <textarea
                required
                rows={3}
                value={formData.recommendation}
                onChange={(e) => handleInputChange('recommendation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Absolutely. They would be a valuable addition to any team because..."
              />
            </div>

            {error && (
              <div className="text-center text-sm p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Referral'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}