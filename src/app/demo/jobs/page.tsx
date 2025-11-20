'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDemoContext } from '@/components/providers/demo-provider'
import { useDemoAuth } from '@/hooks/useDemo'

export default function DemoJobsPage() {
  const router = useRouter()
  useDemoAuth()
  const { state } = useDemoContext()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.back()}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Job Opportunities</h1>
          <p className="text-gray-600 mt-2">
            Browse {state.jobs.length} open positions in your network
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.jobs.map((job) => (
            <Link
              key={job.id}
              href={`/demo/jobs/${job.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600 text-sm">{job.company}</p>
                  </div>
                  <div className="ml-2">
                    <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded font-medium">
                      Open
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {job.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📍</span>
                    <span>{job.location}</span>
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <span>💰</span>
                      <span>{job.salary}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  Posted {Math.floor((Date.now() - job.createdAt.getTime()) / (24 * 60 * 60 * 1000))} days ago
                </p>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-indigo-600 font-medium text-sm">
                    View Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
