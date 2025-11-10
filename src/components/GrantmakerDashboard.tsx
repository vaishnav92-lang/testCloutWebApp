'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Grant {
  id: string
  title: string
  description: string
  amount: number
  status: string
  createdAt: string
  _count?: {
    applications: number
    recommenders: number
  }
}

interface GrantmakerDashboardProps {
  userInfo: {
    firstName?: string
    lastName?: string
    email: string
  }
}

export default function GrantmakerDashboard({ userInfo }: GrantmakerDashboardProps) {
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingGrants, setDeletingGrants] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    const fetchGrants = async () => {
      try {
        const response = await fetch('/api/grantmaker/grants')
        if (response.ok) {
          const data = await response.json()
          setGrants(data.grants)
        }
      } catch (error) {
        console.error('Error fetching grants:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGrants()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDeleteGrant = async (grantId: string, grantTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${grantTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingGrants(prev => new Set([...prev, grantId]))

    try {
      const response = await fetch(`/api/grantmaker/grants/${grantId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setGrants(prev => prev.filter(grant => grant.id !== grantId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete grant')
      }
    } catch (error) {
      console.error('Error deleting grant:', error)
      alert('Failed to delete grant. Please try again.')
    } finally {
      setDeletingGrants(prev => {
        const newSet = new Set(prev)
        newSet.delete(grantId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-gray-500">Loading your grants...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Manage Grants
            </h1>
            <p className="text-gray-600">
              Create grants and allocate trust to recommenders in your network
            </p>
          </div>
          <button
            onClick={() => router.push('/grantmaker/grant/new')}
            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Grant
          </button>
        </div>
      </div>

      {/* Grant Listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Grants</h2>
          <span className="text-sm text-gray-500">
            {grants.length} total grant{grants.length !== 1 ? 's' : ''}
          </span>
        </div>

        {grants.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No grants yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first grant to start finding quality applicants through trusted recommenders
            </p>
            <button
              onClick={() => router.push('/grantmaker/grant/new')}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Grant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grants.map((grant) => (
              <div key={grant.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{grant.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{grant.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(grant.status)}`}>
                    {grant.status.charAt(0) + grant.status.slice(1).toLowerCase()}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Grant Amount:</span> ${grant.amount.toLocaleString()}
                  </div>
                  {grant._count?.recommenders && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Recommenders:</span> {grant._count.recommenders}
                    </div>
                  )}
                  {grant._count?.applications && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Applications:</span> {grant._count.applications}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Created {new Date(grant.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/grantmaker/grant/${grant.id}`)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => router.push(`/grantmaker/grant/${grant.id}/edit`)}
                    className="flex-1 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
                  >
                    {grant.status === 'DRAFT' ? 'Continue Editing' : 'Edit Grant'}
                  </button>
                  <button
                    onClick={() => handleDeleteGrant(grant.id, grant.title)}
                    disabled={deletingGrants.has(grant.id)}
                    className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    {deletingGrants.has(grant.id) ? 'Deleting...' : 'Delete'}
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
            <div className="text-2xl font-bold text-green-600">
              {grants.filter(g => g.status === 'ACTIVE').length}
            </div>
            <div className="text-sm text-gray-600">Active Grants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {grants.filter(g => g.status === 'DRAFT').length}
            </div>
            <div className="text-sm text-gray-600">Drafts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {grants.filter(g => g.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {grants.reduce((sum, grant) => sum + (grant._count?.applications || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
        </div>
      </div>
    </div>
  )
}