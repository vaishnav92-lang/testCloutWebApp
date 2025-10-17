/**
 * JOB REFERRAL MODAL COMPONENT
 *
 * This component provides comprehensive referral functionality for jobs.
 * Users can refer from their trusted network, refer new people, or
 * delegate referral requests to others in their network.
 */

'use client'

import { useState, useEffect } from 'react'

interface TrustedContact {
  id: string
  firstName?: string
  lastName?: string
  email: string
  profileImage?: string
  bio?: string
}

interface JobReferralModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  jobTitle: string
  onSuccess?: () => void
}

type ReferralMode = 'choose' | 'refer-trusted' | 'refer-new' | 'delegate'

interface ExistingUserInfo {
  id: string
  email: string
  firstName?: string
  lastName?: string
  profileImage?: string
  bio?: string
  inNetwork: boolean
  relationshipStatus?: string
}

export default function JobReferralModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  onSuccess
}: JobReferralModalProps) {
  const [mode, setMode] = useState<ReferralMode>('choose')
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [selectedContact, setSelectedContact] = useState<string>('')
  const [newPersonEmail, setNewPersonEmail] = useState('')
  const [newPersonName, setNewPersonName] = useState('')
  const [delegateEmail, setDelegateEmail] = useState('')
  const [delegateName, setDelegateName] = useState('')
  const [message, setMessage] = useState('')
  const [referralReason, setReferralReason] = useState('')

  // New states for email checking
  const [existingUserFound, setExistingUserFound] = useState<ExistingUserInfo | null>(null)
  const [showAddToNetworkDialog, setShowAddToNetworkDialog] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [trustAllocation, setTrustAllocation] = useState(10)
  const [addToNetworkRequested, setAddToNetworkRequested] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchTrustedContacts()
      setMode('choose')
      resetForm()
    }
  }, [isOpen])

  const fetchTrustedContacts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/relationships')
      if (response.ok) {
        const data = await response.json()
        // Get confirmed relationships
        const contacts = data.connections
          .filter((conn: any) => conn.status === 'CONFIRMED')
          .map((conn: any) => conn.connectedUser)
        setTrustedContacts(contacts)
      }
    } catch (error) {
      console.error('Error fetching trusted contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedContact('')
    setNewPersonEmail('')
    setNewPersonName('')
    setDelegateEmail('')
    setDelegateName('')
    setMessage('')
    setReferralReason('')
    setExistingUserFound(null)
    setShowAddToNetworkDialog(false)
    setTrustAllocation(10)
    setAddToNetworkRequested(false)
  }

  // Check if email belongs to an existing user
  const checkEmailExists = async (email: string) => {
    if (!email) return

    setCheckingEmail(true)
    try {
      const response = await fetch('/api/user/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setExistingUserFound({
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            profileImage: data.user.profileImage,
            bio: data.user.bio,
            inNetwork: data.relationship?.exists || false,
            relationshipStatus: data.relationship?.status
          })

          // If user exists and not in network, show dialog
          if (!data.relationship?.exists) {
            setShowAddToNetworkDialog(true)
          }
        } else {
          setExistingUserFound(null)
        }
      }
    } catch (error) {
      console.error('Error checking email:', error)
    } finally {
      setCheckingEmail(false)
    }
  }

  // Add user to trusted network
  const handleAddToNetwork = async () => {
    if (!existingUserFound) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/relationships/establish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: existingUserFound.email,
          trustAllocation
        })
      })

      if (response.ok) {
        setAddToNetworkRequested(true)
        setShowAddToNetworkDialog(false)
        // Refresh trusted contacts
        await fetchTrustedContacts()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add to network')
      }
    } catch (error) {
      console.error('Error adding to network:', error)
      alert('Failed to add to network. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      let endpoint = ''
      let payload: any = {
        jobId,
        message: message.trim(),
        referralReason: referralReason.trim()
      }

      switch (mode) {
        case 'refer-trusted':
          endpoint = '/api/referrals/trusted'
          payload.contactId = selectedContact
          break
        case 'refer-new':
          endpoint = '/api/referrals/new'
          payload.candidateEmail = newPersonEmail
          payload.candidateName = newPersonName
          // If this email belongs to an existing user, include their ID
          if (existingUserFound) {
            payload.existingUserId = existingUserFound.id
            payload.addedToNetwork = addToNetworkRequested
          }
          break
        case 'delegate':
          endpoint = '/api/referrals/delegate'
          payload.delegateEmail = delegateEmail
          payload.delegateName = delegateName
          break
        default:
          return
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        onSuccess?.()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit referral')
      }
    } catch (error) {
      console.error('Error submitting referral:', error)
      alert('Failed to submit referral. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getPersonName = (contact: TrustedContact) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
    }
    return contact.email
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Refer Talent for "{jobTitle}"
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {mode === 'choose' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                How would you like to help find great talent for this role?
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setMode('refer-trusted')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Refer Someone from Your Trusted Network</h3>
                      <p className="text-sm text-gray-600">Refer someone you've already worked with and trust</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMode('refer-new')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Refer Someone New</h3>
                      <p className="text-sm text-gray-600">Refer someone who isn't on Clout yet</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMode('delegate')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Ask Someone Else to Refer</h3>
                      <p className="text-sm text-gray-600">Send this opportunity to someone who might know good candidates</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {mode === 'refer-trusted' && (
            <div className="space-y-6">
              <button
                onClick={() => setMode('choose')}
                className="text-blue-600 hover:text-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select from Your Trusted Network</h3>
                {loading ? (
                  <div className="text-gray-500">Loading your contacts...</div>
                ) : trustedContacts.length === 0 ? (
                  <div className="text-gray-500">No trusted contacts found. Build your network first!</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {trustedContacts.map((contact) => (
                      <label key={contact.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="contact"
                          value={contact.id}
                          checked={selectedContact === contact.id}
                          onChange={(e) => setSelectedContact(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex items-center flex-1">
                          {contact.profileImage ? (
                            <img
                              src={contact.profileImage}
                              alt={getPersonName(contact)}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <span className="text-gray-600 font-medium">
                                {getPersonName(contact).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{getPersonName(contact)}</div>
                            <div className="text-sm text-gray-600">{contact.email}</div>
                            {contact.bio && (
                              <div className="text-xs text-gray-500 mt-1">{contact.bio}</div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedContact && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why are you referring this person? *
                    </label>
                    <textarea
                      value={referralReason}
                      onChange={(e) => setReferralReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Explain why this person would be great for this role..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional message (optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Any additional context for the hiring manager..."
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {mode === 'refer-new' && (
            <div className="space-y-6">
              <button
                onClick={() => setMode('choose')}
                className="text-blue-600 hover:text-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Refer Someone New</h3>
                <p className="text-gray-600 mb-4">
                  This person will receive an invitation to join Clout and will be notified about this opportunity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newPersonEmail}
                    onChange={(e) => {
                      setNewPersonEmail(e.target.value)
                      setExistingUserFound(null)
                    }}
                    onBlur={(e) => {
                      if (e.target.value && e.target.validity.valid) {
                        checkEmailExists(e.target.value)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@example.com"
                    required
                  />
                  {checkingEmail && (
                    <p className="text-sm text-gray-500 mt-1">Checking email...</p>
                  )}
                  {existingUserFound && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-900 font-medium">
                        This person is already on Clout!
                      </p>
                      {existingUserFound.inNetwork ? (
                        <p className="text-sm text-blue-700 mt-1">
                          They are already in your trusted network.
                        </p>
                      ) : (
                        addToNetworkRequested ? (
                          <p className="text-sm text-green-700 mt-1">
                            ✓ Added to your trusted network
                          </p>
                        ) : (
                          <p className="text-sm text-blue-700 mt-1">
                            They will be tagged as the referral candidate.
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why are you referring this person? *
                </label>
                <textarea
                  value={referralReason}
                  onChange={(e) => setReferralReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Explain why this person would be great for this role..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Any additional context for the hiring manager..."
                />
              </div>
            </div>
          )}

          {mode === 'delegate' && (
            <div className="space-y-6">
              <button
                onClick={() => setMode('choose')}
                className="text-blue-600 hover:text-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask Someone to Help with Referrals</h3>
                <p className="text-gray-600 mb-4">
                  Send this opportunity to someone who might know good candidates. They'll receive an invitation to join Clout if they're not already a member.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={delegateName}
                    onChange={(e) => setDelegateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Jane Smith"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={delegateEmail}
                    onChange={(e) => setDelegateEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="jane@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to include *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Hi! I thought you might know someone great for this role..."
                  required
                />
              </div>
            </div>
          )}

          {/* Submit buttons */}
          {mode !== 'choose' && (
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={() => setMode('choose')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !canSubmit()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Referral'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add to Network Dialog */}
      {showAddToNetworkDialog && existingUserFound && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add to Your Trusted Network?
            </h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-3">
                <strong>{existingUserFound.firstName} {existingUserFound.lastName}</strong> ({existingUserFound.email}) is already on Clout.
              </p>
              <p className="text-gray-600">
                Would you like to add them to your trusted network and allocate some trust to them?
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trust Allocation (0-100 points)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={trustAllocation}
                  onChange={(e) => setTrustAllocation(parseInt(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={trustAllocation}
                  onChange={(e) => setTrustAllocation(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You can adjust this later in your trust network settings.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddToNetworkDialog(false)
                  // They can still submit the referral without adding to network
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={submitting}
              >
                No, Continue Without Adding
              </button>
              <button
                onClick={handleAddToNetwork}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : 'Yes, Add to Network'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  function canSubmit() {
    switch (mode) {
      case 'refer-trusted':
        return selectedContact && referralReason.trim()
      case 'refer-new':
        return newPersonEmail && newPersonName && referralReason.trim()
      case 'delegate':
        return delegateEmail && delegateName && message.trim()
      default:
        return false
    }
  }
}