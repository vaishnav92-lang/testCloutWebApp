/**
 * CLOUT JOURNEY CARD COMPONENT
 *
 * This component displays the user's journey on Clout including:
 * - Who referred them to the platform
 * - Who they have referred to the platform
 * - Their growth in the referral network
 */

'use client'

import { useState, useEffect } from 'react'

interface ReferralUser {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  profileImage: string | null
  joinedAt: string
}

interface CloutJourneyData {
  referredBy: ReferralUser | null
  referrals: ReferralUser[]
  totalReferrals: number
  joinedAt: string
}

interface TrustedRelationship {
  userId: string
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED'
}

export default function CloutJourneyCard() {
  const [data, setData] = useState<CloutJourneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [trustedRelationships, setTrustedRelationships] = useState<TrustedRelationship[]>([])
  const [addingToNetwork, setAddingToNetwork] = useState<string | null>(null)
  const [showTrustModal, setShowTrustModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ReferralUser | null>(null)
  const [trustScore, setTrustScore] = useState(8)

  useEffect(() => {
    const fetchJourneyData = async () => {
      try {
        const response = await fetch('/api/user/journey')
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Error fetching journey data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJourneyData()
    fetchTrustedRelationships()
  }, [])

  const fetchTrustedRelationships = async () => {
    try {
      const response = await fetch('/api/user/relationships')
      if (response.ok) {
        const result = await response.json()
        // Map the connections to the expected TrustedRelationship format
        const mappedRelationships = (result.connections || []).map((connection: any) => ({
          userId: connection.connectedUser.id,
          status: connection.status === 'CONFIRMED' ? 'CONFIRMED' : connection.status === 'PENDING' ? 'PENDING' : 'DECLINED'
        }))
        setTrustedRelationships(mappedRelationships)
      }
    } catch (error) {
      console.error('Error fetching trusted relationships:', error)
    }
  }

  const handleAddToTrustedNetwork = (user: ReferralUser) => {
    setSelectedUser(user)
    setTrustScore(8) // Default trust score
    setShowTrustModal(true)
  }

  const confirmAddToNetwork = async () => {
    if (!selectedUser) return

    setAddingToNetwork(selectedUser.id)
    setShowTrustModal(false)

    try {
      const response = await fetch('/api/user/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otherUserId: selectedUser.id,
          trustScore
        })
      })

      if (response.ok) {
        await fetchTrustedRelationships()
      }
    } catch (error) {
      console.error('Error adding to trusted network:', error)
    } finally {
      setAddingToNetwork(null)
      setSelectedUser(null)
    }
  }

  const getTrustedNetworkStatus = (userId: string) => {
    const relationship = trustedRelationships.find(rel => rel.userId === userId)
    return relationship?.status || null
  }

  const getUserName = (user: ReferralUser) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim()
    }
    return user.email.split('@')[0]
  }

  const getInitials = (user: ReferralUser) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    }
    return user.email[0].toUpperCase()
  }

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500">Unable to load journey data</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🚀 Your Clout Journey</h3>
          <p className="text-sm text-gray-600 mt-1">
            Member since {formatJoinDate(data.joinedAt)}
          </p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{data.totalReferrals}</div>
          <div className="text-xs text-gray-600">People Referred</div>
        </div>
      </div>

      {/* Who Referred You */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">How You Joined Clout</h4>
        {data.referredBy ? (
          <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              {data.referredBy.profileImage ? (
                <img
                  src={data.referredBy.profileImage}
                  alt={getUserName(data.referredBy)}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                  <span className="text-blue-800 text-sm font-medium">
                    {getInitials(data.referredBy)}
                  </span>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-blue-900">
                  Referred by {getUserName(data.referredBy)}
                </div>
                <div className="text-xs text-blue-700">
                  Joined {formatJoinDate(data.referredBy.joinedAt)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Direct invite to Clout
                </div>
                <div className="text-xs text-gray-600">
                  You were one of our early members!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Who You've Referred */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          People You've Brought to Clout {data.totalReferrals > 0 && `(${data.totalReferrals})`}
        </h4>

        {data.referrals.length > 0 ? (
          <div className="space-y-2">
            {data.referrals.slice(0, 5).map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  {referral.profileImage ? (
                    <img
                      src={referral.profileImage}
                      alt={getUserName(referral)}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
                      <span className="text-green-800 text-sm font-medium">
                        {getInitials(referral)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-green-900">
                      {getUserName(referral)}
                    </div>
                    <div className="text-xs text-green-700">
                      Joined {formatJoinDate(referral.joinedAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrustedNetworkStatus(referral.id) === 'CONFIRMED' ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium">Trusted</span>
                    </div>
                  ) : getTrustedNetworkStatus(referral.id) === 'PENDING' ? (
                    <div className="text-xs text-yellow-600 font-medium">Pending</div>
                  ) : (
                    <button
                      onClick={() => handleAddToTrustedNetwork(referral)}
                      disabled={addingToNetwork === referral.id}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                    >
                      {addingToNetwork === referral.id ? 'Adding...' : 'Add to Trusted Network'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {data.totalReferrals > 5 && (
              <div className="text-center py-2">
                <span className="text-sm text-gray-500">
                  and {data.totalReferrals - 5} more...
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No referrals yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Share Clout with friends and colleagues to grow the network
            </p>
          </div>
        )}
      </div>

      {/* Growth Stats */}
      {data.totalReferrals > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Network Growth Impact</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-700">
                +{data.totalReferrals} member{data.totalReferrals !== 1 ? 's' : ''} added
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Trust Score Modal */}
      {showTrustModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add {getUserName(selectedUser)} to Your Trusted Network
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How much do you trust {getUserName(selectedUser)}? ({trustScore}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={trustScore}
                onChange={(e) => setTrustScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 (Low Trust)</span>
                <span>10 (High Trust)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This score is private and helps improve network recommendations
              </p>
              {selectedUser.email && (
                <p className="text-xs text-gray-400 mt-1">
                  {selectedUser.email}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTrustModal(false)
                  setSelectedUser(null)
                }}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddToNetwork}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add to Network
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}