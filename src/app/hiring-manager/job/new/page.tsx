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
  const [creationMethod, setCreationMethod] = useState<'manual' | 'ai' | 'upload' | null>(null)
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null)
  const [forwardingMessage, setForwardingMessage] = useState<string>('')
  const [existingJobDescription, setExistingJobDescription] = useState<string>('')
  const [isConverting, setIsConverting] = useState<boolean>(false)

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

    // Check if coming from AI with generated data
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('from-ai') === 'true') {
      const storedData = localStorage.getItem('aiGeneratedJobData')
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)
          setAiGeneratedData(parsedData.formData)
          setForwardingMessage(parsedData.forwardingMessage)
          setCreationMethod('manual') // Show the manual form with pre-filled data
          localStorage.removeItem('aiGeneratedJobData') // Clean up
        } catch (error) {
          console.error('Error parsing AI generated data:', error)
        }
      }
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

  // Function to convert existing job description to water cooler version
  const convertJobDescription = async () => {
    if (!existingJobDescription.trim()) {
      alert('Please enter a job description first.')
      return
    }

    setIsConverting(true)
    try {
      const response = await fetch('/api/chatbot/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: existingJobDescription
        })
      })

      if (!response.ok) {
        throw new Error('Failed to convert job description')
      }

      const data = await response.json()
      setForwardingMessage(data.waterCoolerDescription)
      // Stay in upload mode to show the converted description for editing

    } catch (error) {
      console.error('Error converting job description:', error)
      alert('Failed to convert job description. Please try again.')
    } finally {
      setIsConverting(false)
    }
  }

  // Render creation method selection
  if (creationMethod === null) {
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {/* Manual Form Option */}
                <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 cursor-pointer transition-colors"
                     onClick={() => setCreationMethod('manual')}>
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
                     onClick={() => setCreationMethod('ai')}>
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

                {/* Upload Existing JD Option */}
                <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6 hover:border-green-300 cursor-pointer transition-colors"
                     onClick={() => setCreationMethod('upload')}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-green-900">Already Have a JD?</h3>
                    <p className="text-sm text-green-700">Upload your existing job description and we'll convert it to a water cooler version</p>
                    <div className="text-xs text-green-600 font-medium">
                      ⚡ FASTEST • ⏱️ 2-3 minutes
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
  if (creationMethod === 'ai') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => setCreationMethod(null)}
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

  // Render Upload Existing Job Description
  if (creationMethod === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => setCreationMethod(null)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to options
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900">
                Convert Your Job Description
              </h1>

              <p className="text-xl text-gray-600">
                Paste your existing job description and we'll create a "water cooler" version that helps people recall specific candidates
              </p>

              <div className="max-w-2xl mx-auto">
                {!forwardingMessage ? (
                  <>
                    <textarea
                      value={existingJobDescription}
                      onChange={(e) => setExistingJobDescription(e.target.value)}
                      placeholder="Paste your existing job description here..."
                      className="w-full h-64 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      disabled={isConverting}
                    />

                    <button
                      onClick={convertJobDescription}
                      disabled={!existingJobDescription.trim() || isConverting}
                      className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center"
                    >
                      {isConverting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Converting to Water Cooler Version...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Convert to Water Cooler Description
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                      <h3 className="text-lg font-medium text-green-900 mb-3">
                        🎯 Your Water Cooler Description
                      </h3>
                      <textarea
                        value={forwardingMessage}
                        onChange={(e) => setForwardingMessage(e.target.value)}
                        className="w-full h-32 border border-green-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        placeholder="Edit your water cooler description..."
                      />
                      <p className="text-xs text-green-600 mt-2">
                        ✨ Feel free to edit this description to better match your needs
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Referral Budget (Total amount for successful hire)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="5000"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          // TODO: Move to scout selection
                          alert('Scout selection coming next!')
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Next: Select Scouts
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 p-4 bg-green-50 rounded-lg max-w-2xl mx-auto">
                <p className="text-sm text-green-800">
                  <strong>💡 What we'll create:</strong> A concise 3-4 line description that triggers network recall and makes people think of specific candidates they know.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Manual Form (with optional AI-generated data)
  return (
    <div>
      {/* Show forwarding message if available */}
      {forwardingMessage && (
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-green-900 mb-3">
              🎯 Ready-to-Forward Message
            </h3>
            <div className="bg-white border border-green-200 rounded-md p-4 mb-4">
              <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                {forwardingMessage}
              </pre>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigator.clipboard.writeText(forwardingMessage)}
                className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-white hover:bg-green-50"
              >
                📋 Copy Message
              </button>
              <button
                onClick={() => setForwardingMessage('')}
                className="text-sm text-green-600 hover:text-green-800"
              >
                Hide
              </button>
            </div>
            <p className="text-xs text-green-600 mt-2">
              ✨ AI-generated from your conversation - perfect for sending to your network!
            </p>
          </div>
        </div>
      )}

      <JobPostingQuestionnaire
        onComplete={handleComplete}
        initialData={aiGeneratedData}
      />
    </div>
  )
}