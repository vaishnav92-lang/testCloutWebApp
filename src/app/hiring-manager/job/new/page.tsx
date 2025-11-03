/**
 * NEW JOB POSTING PAGE
 *
 * This page allows hiring managers to create new job postings
 * using the JobPostingQuestionnaire component.
 */

'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import JobPostingQuestionnaire from '@/components/JobPostingQuestionnaire'
import SimpleChatbot from '@/components/SimpleChatbot'

export default function NewJobPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [useAI, setUseAI] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is a hiring manager
    if (!session.user?.isHiringManager) {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!session?.user?.isHiringManager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need hiring manager permissions to create job postings.</p>
        </div>
      </div>
    )
  }

  const handleComplete = (jobId: string) => {
    router.push('/dashboard?view=hiring-manager')
  }

  // Render creation method selection
  if (useAI === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900">
                Create Job Posting
              </h1>

              <p className="text-xl text-gray-600">
                Choose how you'd like to create your job posting
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {/* Manual Form Option */}
                <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 cursor-pointer transition-colors"
                     onClick={() => setUseAI(false)}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Fill Form Manually</h3>
                    <p className="text-sm text-gray-600">Use our guided questionnaire to create a detailed job posting</p>
                    <div className="text-xs text-gray-500">
                      ⏱️ 10-15 minutes
                    </div>
                  </div>
                </div>

                {/* AI Assistant Option */}
                <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6 hover:border-blue-300 cursor-pointer transition-colors"
                     onClick={() => setUseAI(true)}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-blue-900">Use AI Assistant</h3>
                    <p className="text-sm text-blue-700">Chat with our AI to create a network-friendly job description</p>
                    <div className="text-xs text-blue-600 font-medium">
                      ✨ RECOMMENDED • ⏱️ 5-10 minutes
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>💡 Why use AI?</strong> Our AI assistant creates "water cooler" job descriptions that help people recall specific candidates from their network, leading to better referrals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render AI Assistant
  if (useAI) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => setUseAI(null)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to options
            </button>
          </div>
          <SimpleChatbot />
        </div>
      </div>
    )
  }

  // Render Manual Form
  return (
    <JobPostingQuestionnaire onComplete={handleComplete} />
  )
}