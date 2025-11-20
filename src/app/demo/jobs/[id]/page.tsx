'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDemoContext } from '@/components/providers/demo-provider'
import { useDemoAuth } from '@/hooks/useDemo'

export default function DemoJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  useDemoAuth()
  const { state } = useDemoContext()

  const resolvedParams = React.use(params)
  const job = state.jobs.find((j) => j.id === resolvedParams.id)

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Job not found</p>
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 flex items-center gap-1"
          >
            ← Back to Jobs
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-xl text-gray-600 mt-2">{job.company}</p>
            </div>
            <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
              Actively Hiring
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8 space-y-6">
              {/* Key Details */}
              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Location</p>
                  <p className="text-lg text-gray-900 mt-1">{job.location}</p>
                </div>
                {job.salary && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Salary Range</p>
                    <p className="text-lg text-green-600 font-semibold mt-1">
                      {job.salary}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  About This Role
                </h2>
                <p className="text-gray-600 leading-relaxed">{job.description}</p>
              </div>

              {/* Demo Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Demo Note:</strong> This is a demo job posting. You can explore
                  the application but no data will be saved.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ready to Apply?</h3>
              <p className="text-sm text-gray-600 mb-4">
                In the real app, you could apply directly or refer a connection from your network.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    alert(
                      'In the real version, you could submit your application here!'
                    )
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Apply Now
                </button>
                <button
                  onClick={() => {
                    alert(
                      'In the real version, you could refer a connection from your trusted network!'
                    )
                  }}
                  className="w-full bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Refer a Connection
                </button>
              </div>
            </div>

            {/* Job Details Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">About {job.company}</h3>
              <p className="text-sm text-gray-600">
                This is a demo company. In the real app, you'd see company details,
                recent hires, and other relevant information here.
              </p>
              <button
                onClick={() => {
                  alert('Company profile coming soon!')
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mt-4"
              >
                View Company Profile →
              </button>
            </div>

            {/* Network Connections */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">Your Network</h3>
              <p className="text-sm text-gray-600 mb-4">
                You have connections who know people at {job.company}:
              </p>
              <div className="space-y-2">
                {state.relationships.slice(0, 3).map((rel) => (
                  <div key={rel.id} className="text-sm">
                    <p className="font-medium text-gray-900">{rel.toUserName}</p>
                    <p className="text-gray-600">
                      {rel.type} • 2nd degree connection
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
