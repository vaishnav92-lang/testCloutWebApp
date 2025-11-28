'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface InterestRequest {
  id: string
  createdAt: string
  job: {
    id: string
    title: string
    company: {
      name: string
    }
  }
}

export default function InterestRequestNotifications() {
  const { data: session, status } = useSession()
  const [requests, setRequests] = useState<InterestRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInterestRequests()
    }
  }, [status])

  const fetchInterestRequests = async () => {
    try {
      const response = await fetch('/api/candidate/interest-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error fetching interest requests:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || requests.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7H4l5-5v5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            New Opportunity Interest Check{requests.length > 1 ? 's' : ''}
          </h3>
          <p className="text-gray-700 mb-4">
            You have {requests.length} pending interest request{requests.length > 1 ? 's' : ''} from potential employers.
          </p>

          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900">
                  {request.job.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {request.job.company.name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/dashboard/interest-response/${request.id}`}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                  >
                    Respond
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}