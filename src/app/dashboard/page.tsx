/**
 * DASHBOARD PAGE COMPONENT
 *
 * This is the main dashboard where users manage their professional network.
 * It serves as the central hub for all relationship and invitation activities.
 *
 * Key Features:
 * - Profile information display and editing access
 * - Relationship establishment form
 * - Network visualization (confirmed, pending, declined relationships)
 * - Pending invitations to new users
 * - Real-time invite count tracking
 * - Job listings display
 * - Success notifications from validation flow
 *
 * Data Flow:
 * 1. Loads user stats (invite counts, tier)
 * 2. Fetches relationships and pending invitations
 * 3. Displays network with proper status indicators
 * 4. Handles new relationship requests
 * 5. Shows validation success notifications
 */

'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import EndorsementForm from '@/components/EndorsementForm'
import EndorsementNotifications from '@/components/EndorsementNotifications'
import HiringManagerDashboard from '@/components/HiringManagerDashboard'
import EarningsCloutCard from '@/components/EarningsCloutCard'
import NetworkConnectionsCard from '@/components/NetworkConnectionsCard'
import CloutJourneyCard from '@/components/CloutJourneyCard'
import PendingNetworkRequests from '@/components/PendingNetworkRequests'

export default function Dashboard() {
  // HOOKS AND ROUTING
  const { data: session, status } = useSession()     // NextAuth session management
  const router = useRouter()                         // Next.js navigation
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')  // URL params

  // JOBS STATE
  const [jobs, setJobs] = useState([])               // Job listings data
  const [loading, setLoading] = useState(true)       // Jobs loading state

  // RELATIONSHIPS STATE
  const [relationships, setRelationships] = useState({
    connections: [],                                  // Array of user relationships
    counts: { confirmed: 0, pending: 0, declined: 0 }, // Relationship status counts
    pendingInvitations: []                           // Invitations to new users
  })
  const [relationshipsLoading, setRelationshipsLoading] = useState(true)  // Relationships loading state

  // USER STATISTICS STATE
  const [userStats, setUserStats] = useState({
    availableInvites: 0,                             // Invites remaining
    totalInvitesUsed: 0,                            // Invites consumed
    tier: 'CONNECTOR'                               // User tier
  })
  const [userStatsLoading, setUserStatsLoading] = useState(true)          // Stats loading state

  // RELATIONSHIP FORM STATE
  const [relationshipForm, setRelationshipForm] = useState({
    email: '',                                       // Target user email
    trustScore: 5                                   // Trust score (1-10)
  })
  const [relationshipLoading, setRelationshipLoading] = useState(false)   // Form submission state
  const [relationshipMessage, setRelationshipMessage] = useState('')      // Form success/error message

  // VALIDATION SUCCESS STATE
  const [validationSuccess, setValidationSuccess] = useState(false)       // Show validation success banner

  // ENDORSEMENTS STATE
  const [endorsements, setEndorsements] = useState([])                    // Endorsements given by current user
  const [endorsementsLoading, setEndorsementsLoading] = useState(true)    // Endorsements loading state
  const [endorsementFormOpen, setEndorsementFormOpen] = useState(false)   // Endorsement form visibility

  // DASHBOARD VIEW STATE
  const [currentView, setCurrentView] = useState<'node' | 'hiring-manager'>('node')  // Toggle between dashboards

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    console.log('Dashboard useEffect - session:', session)
    console.log('Dashboard useEffect - status:', status)
    if (session) {
      console.log('Fetching data...')
      fetchJobs()
      fetchRelationships()
      fetchUserStats()
      fetchEndorsements()
    }
  }, [session])

  useEffect(() => {
    // Check if user just completed validation
    if (searchParams.get('validated') === 'true') {
      setValidationSuccess(true)
      // Auto-hide message after 5 seconds
      setTimeout(() => setValidationSuccess(false), 5000)
      // Clean up URL
      router.replace('/dashboard', { scroll: false })
    }
  }, [])

  // FETCH JOBS DATA
  // Loads available job listings for display in jobs section
  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      const data = await response.json()

      // Ensure data is an array, handle error responses
      if (Array.isArray(data)) {
        setJobs(data)  // Store job listings
      } else if (data.error) {
        console.error('API error:', data.error)
        setJobs([])  // Set empty array on error
      } else {
        setJobs([])  // Fallback to empty array
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])  // Set empty array on error
    } finally {
      setLoading(false)  // Always stop loading spinner
    }
  }

  // FETCH RELATIONSHIPS DATA
  // Loads user's network including relationships and pending invitations
  const fetchRelationships = async () => {
    try {
      const response = await fetch('/api/user/relationships')
      const data = await response.json()
      if (response.ok) {
        // Store relationships, counts, and pending invitations
        setRelationships(data)
      }
    } catch (error) {
      console.error('Error fetching relationships:', error)
    } finally {
      setRelationshipsLoading(false)  // Always stop loading spinner
    }
  }

  // FETCH USER STATISTICS
  // Loads invite counts and tier information for stats display
  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats')
      const data = await response.json()
      if (response.ok) {
        // Store invite counts and tier data
        setUserStats(data)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setUserStatsLoading(false)  // Always stop loading spinner
    }
  }

  // FETCH ENDORSEMENTS DATA
  // Loads endorsements given by current user for display in endorsements section
  const fetchEndorsements = async () => {
    try {
      const response = await fetch('/api/user/endorsements')
      const data = await response.json()
      if (response.ok) {
        // Store endorsements data
        setEndorsements(data)
      }
    } catch (error) {
      console.error('Error fetching endorsements:', error)
    } finally {
      setEndorsementsLoading(false)  // Always stop loading spinner
    }
  }

  const handleRelationshipSubmit = async (e) => {
    e.preventDefault()
    setRelationshipLoading(true)
    setRelationshipMessage('')

    try {
      const response = await fetch('/api/relationships/establish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relationshipForm)
      })

      const data = await response.json()

      if (response.ok) {
        setRelationshipMessage(data.message)
        setRelationshipForm({ email: '', trustScore: 5 })
        // Refresh relationships and stats to show the new one and updated invite count
        fetchRelationships()
        fetchUserStats()
      } else {
        setRelationshipMessage(data.error || 'Something went wrong')
      }
    } catch (error) {
      setRelationshipMessage('Something went wrong. Please try again.')
    } finally {
      setRelationshipLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome{session.user.firstName ? `, ${session.user.firstName}` : ''}!
                </h1>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Sign Out
                </button>
              </div>

              {/* Dashboard Toggle - Only show if user is a hiring manager */}
              {session.user.isHiringManager && (
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 px-6">
                    <button
                      onClick={() => setCurrentView('node')}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        currentView === 'node'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Node Dashboard
                    </button>
                    <button
                      onClick={() => setCurrentView('hiring-manager')}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        currentView === 'hiring-manager'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Hiring Manager Dashboard
                    </button>
                  </nav>
                </div>
              )}
            </div>

            <div className="p-6">
              {validationSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-green-400">✅</div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Relationship validation completed successfully!
                      </p>
                      <p className="text-sm text-green-700">Your network has been updated.</p>
                    </div>
                    <button
                      onClick={() => setValidationSuccess(false)}
                      className="ml-auto text-green-500 hover:text-green-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Conditional Dashboard Content */}
              {currentView === 'node' ? (
                <>
                  {/* Received Endorsements Notifications */}
                  <EndorsementNotifications className="mb-8" />

                  {/* Clout & Earnings Card */}
                  <div className="mb-8">
                    <EarningsCloutCard />
                  </div>

              {/* Pending Network Requests - Show at top if any exist */}
              <div className="mb-8">
                <PendingNetworkRequests />
              </div>

              {/* Clout Journey Section */}
              <div className="mb-8">
                <CloutJourneyCard />
              </div>

              {/* Network Connections Section */}
              <div className="mb-8">
                <NetworkConnectionsCard />
              </div>

              {/* Endorsement Section */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Help the Best People You've Worked With
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Write an endorsement for someone exceptional you've worked with. They'll choose how to use it.
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        Your endorsement will help them stand out to employers. <strong>They won't see what you write</strong> - they only control whether to keep it private or let Clout use it to find opportunities for them.
                      </p>
                      <button
                        onClick={() => setEndorsementFormOpen(true)}
                        className="inline-flex items-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Write an Endorsement
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>

                  <div className="space-y-2">
                    <p><strong>Email:</strong> {session.user.email}</p>
                    <p><strong>Profile Complete:</strong> {session.user.isProfileComplete ? '✅ Yes' : '❌ No'}</p>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => router.push('/onboard')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      {session.user.isProfileComplete ? 'Edit Profile' : 'Complete Your Profile'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-2">
                  <h2 className="text-lg font-semibold text-gray-900">Add to Trusted Network</h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-4">
                      Enter someone's email to add them to your trusted network. We'll send them an invitation or validation request.
                    </p>

                    <form onSubmit={handleRelationshipSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={relationshipForm.email}
                          onChange={(e) => setRelationshipForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="colleague@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Trust Score: {relationshipForm.trustScore}/10
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={relationshipForm.trustScore}
                          onChange={(e) => setRelationshipForm(prev => ({ ...prev, trustScore: parseInt(e.target.value) }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1 (Low Trust)</span>
                          <span>10 (High Trust)</span>
                        </div>
                      </div>

                      {relationshipMessage && (
                        <div className={`text-center text-sm p-3 rounded-md ${
                          relationshipMessage.includes('sent') || relationshipMessage.includes('request')
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {relationshipMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={relationshipLoading}
                        className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {relationshipLoading ? 'Sending...' : 'Add to Trusted Network'}
                      </button>
                    </form>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {userStatsLoading ? (
                        <p className="text-xs text-gray-500">Loading stats...</p>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">
                            <strong>{userStats.availableInvites}</strong> invites remaining •
                            <strong className="ml-1">{userStats.totalInvitesUsed}</strong> invites used •
                            Tier: <strong className="ml-1">{userStats.tier}</strong>
                          </p>
                          <p className="text-xs text-gray-400">
                            New user invitations consume your available invites
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Section */}
              <div className="border-t border-gray-200 pt-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Your Network</h2>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-green-600">✅ {relationships.counts.confirmed} Confirmed</span>
                    <span className="text-yellow-600">⏳ {relationships.counts.pending + relationships.pendingInvitations.length} Pending</span>
                    <span className="text-gray-500">❌ {relationships.counts.declined} Declined</span>
                  </div>
                </div>

                {relationshipsLoading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading network...</div>
                  </div>
                ) : relationships.connections.length === 0 && relationships.pendingInvitations.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No connections yet. Start by inviting someone above!</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Existing relationships */}
                    {relationships.connections.map((connection) => (
                      <div key={connection.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{connection.connectedUser.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            connection.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            connection.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {connection.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{connection.connectedUser.email}</p>
                        {connection.status === 'CONFIRMED' && (
                          <p className="text-xs text-gray-500 mt-2">
                            Trust Score: {connection.myTrustScore}/10
                          </p>
                        )}
                        {connection.status === 'PENDING' && (
                          <div className="mt-3">
                            {connection.canValidate ? (
                              <button
                                onClick={() => router.push(`/relationships/validate/${connection.id}`)}
                                className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                              >
                                Complete Validation
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500 italic">
                                Awaiting their confirmation
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(connection.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}

                    {/* Pending invitations to new users */}
                    {relationships.pendingInvitations.map((invitation) => (
                      <div key={`inv-${invitation.id}`} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{invitation.email}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            INVITED
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Invitation sent to new user</p>
                        <div className="mt-3">
                          <span className="text-xs text-gray-500 italic">
                            Awaiting signup
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* People You've Endorsed Section */}
              <div className="border-t border-gray-200 pt-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">People You've Endorsed</h2>
                  <span className="text-sm text-gray-500">{endorsements.length} endorsements given</span>
                </div>

                {endorsementsLoading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading endorsements...</div>
                  </div>
                ) : endorsements.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No endorsements written yet. Help someone exceptional by writing their first endorsement!</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {endorsements.map((endorsement) => (
                      <div key={endorsement.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">
                            {endorsement.endorsedUser?.firstName && endorsement.endorsedUser?.lastName
                              ? `${endorsement.endorsedUser.firstName} ${endorsement.endorsedUser.lastName}`
                              : endorsement.endorsedUserEmail}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            endorsement.status === 'PENDING_CANDIDATE_ACTION' ? 'bg-yellow-100 text-yellow-800' :
                            endorsement.status === 'PRIVATE' ? 'bg-blue-100 text-blue-800' :
                            endorsement.status === 'ACTIVE_MATCHING' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {endorsement.status === 'PENDING_CANDIDATE_ACTION' ? 'Pending their decision' :
                             endorsement.status === 'PRIVATE' ? 'Active - Private mode' :
                             endorsement.status === 'ACTIVE_MATCHING' ? 'Active - Matching enabled' :
                             'Not using'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{endorsement.endorsedUserEmail}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Written {new Date(endorsement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Jobs Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Available Jobs</h2>
                  <span className="text-sm text-gray-500">{jobs.length} jobs available</span>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading jobs...</div>
                  </div>
                ) : !Array.isArray(jobs) || jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No jobs available at the moment.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => router.push(`/jobs/${job.id}`)}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
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
                            <span className="ml-2">{job._count.applications} applications</span>
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

                        <button
                          className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent card click from triggering
                            router.push(`/jobs/${job.id}`)
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                </>
              ) : (
                /* Hiring Manager Dashboard */
                <HiringManagerDashboard
                  userInfo={{
                    firstName: session.user.firstName || '',
                    lastName: session.user.lastName || '',
                    email: session.user.email
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Endorsement Form - Only show for node dashboard */}
      {currentView === 'node' && (
      <EndorsementForm
        isOpen={endorsementFormOpen}
        onClose={() => setEndorsementFormOpen(false)}
        onSuccess={() => fetchEndorsements()}
        userInfo={{
          firstName: session.user.firstName || '',
          lastName: session.user.lastName || '',
          email: session.user.email
        }}
      />
      )}
    </div>
  )
}