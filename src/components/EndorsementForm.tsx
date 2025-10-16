/**
 * ENDORSEMENT FORM COMPONENT
 *
 * Simple, streamlined form for writing endorsements.
 * Uses free text inputs to avoid complex Typeform features.
 *
 * Features:
 * - Pre-filled endorser information
 * - Simple text inputs for all questions
 * - Form validation and submission
 * - Success/error state handling
 * - Direct submission to our API
 */

'use client'

import { useState } from 'react'

interface EndorsementFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  userInfo: {
    firstName?: string
    lastName?: string
    email: string
  }
}

interface FormData {
  endorsedEmail: string
  endorsedName: string
  relationship: string
  workTogether: string
  strengths: string
  rolesValueAdd: string
  workOutput: string
  hoursInteraction: string
  complementaryPartner: string
  recommendation: string
}

export default function EndorsementForm({ isOpen, onClose, onSuccess, userInfo }: EndorsementFormProps) {
  const [formData, setFormData] = useState<FormData>({
    endorsedEmail: '',
    endorsedName: '',
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/endorsements/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          endorserEmail: userInfo.email,
          endorserName: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Call success callback to refresh endorsements list
        if (onSuccess) {
          onSuccess()
        }
        // Reset form
        setFormData({
          endorsedEmail: '',
          endorsedName: '',
          relationship: '',
          workTogether: '',
          strengths: '',
          rolesValueAdd: '',
          workOutput: '',
          hoursInteraction: '',
          complementaryPartner: '',
          recommendation: ''
        })
        // Close modal after delay
        setTimeout(() => {
          setSuccess(false)
          onClose()
        }, 2000)
      } else {
        setError(data.error || 'Failed to submit endorsement')
      }
    } catch (error) {
      console.error('Error submitting endorsement:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  if (success) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="text-green-400 text-6xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Endorsement Sent!</h2>
              <p className="text-gray-600">
                {formData.endorsedName || formData.endorsedEmail} will receive an email to choose how to use your endorsement.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Write an Endorsement</h2>
            <p className="text-sm text-gray-600 mt-1">
              Help someone exceptional by sharing your experience working with them
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Privacy Protected:</strong> They won't see what you write - only whether to use it for job opportunities.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Person Being Endorsed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Their Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.endorsedName}
                    onChange={(e) => handleInputChange('endorsedName', e.target.value)}
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
                    value={formData.endorsedEmail}
                    onChange={(e) => handleInputChange('endorsedEmail', e.target.value)}
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

              {/* Additional Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anything else we should know? (optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.recommendation}
                  onChange={(e) => handleInputChange('recommendation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Any additional context, achievements, or details that would be helpful..."
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
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Sending...' : 'Send Endorsement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}