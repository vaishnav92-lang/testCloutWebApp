/**
 * NETWORK CONNECTIONS CARD COMPONENT
 *
 * Displays a user's professional introductions made through Clout.
 * Shows pending connections and established relationships.
 */

'use client'

import { useState, useEffect } from 'react'

interface Introduction {
  id: string
  otherPerson: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    profileImage: string | null
    bio: string | null
    location: string | null
    linkedinUrl: string | null
  }
  introducedBy: {
    firstName: string | null
    lastName: string | null
    email: string
  }
  context: string
  status: 'PENDING' | 'ESTABLISHED' | 'INACTIVE'
  notes: string | null
  createdAt: string
  establishedAt: string | null
}

export default function NetworkConnectionsCard() {
  const [introductions, setIntroductions] = useState<Introduction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIntro, setSelectedIntro] = useState<Introduction | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'establish' | 'notes'>('establish')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchIntroductions()
  }, [])

  const fetchIntroductions = async () => {
    try {
      const response = await fetch('/api/introductions')
      if (response.ok) {
        const data = await response.json()
        setIntroductions(data.introductions)
      }
    } catch (error) {
      console.error('Error fetching introductions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEstablishConnection = async (intro: Introduction) => {
    setSelectedIntro(intro)
    setNotes('')
    setModalMode('establish')
    setShowModal(true)
  }

  const handleUpdateNotes = (intro: Introduction) => {
    setSelectedIntro(intro)
    setNotes(intro.notes || '')
    setModalMode('notes')
    setShowModal(true)
  }

  const handleDeclineConnection = async (intro: Introduction) => {
    if (confirm('Are you sure you want to decline this connection?')) {
      try {
        const response = await fetch(`/api/introductions/${intro.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'INACTIVE' })
        })

        if (response.ok) {
          await fetchIntroductions()
        }
      } catch (error) {
        console.error('Error declining connection:', error)
      }
    }
  }

  const handleSubmit = async () => {
    if (!selectedIntro) return

    setSubmitting(true)
    try {
      const body: any = {}

      if (modalMode === 'establish') {
        body.status = 'ESTABLISHED'
        if (notes.trim()) {
          body.notes = notes
        }
      } else {
        body.notes = notes
      }

      const response = await fetch(`/api/introductions/${selectedIntro.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchIntroductions()
        setShowModal(false)
        setSelectedIntro(null)
        setNotes('')
      }
    } catch (error) {
      console.error('Error updating introduction:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getPersonName = (person: Introduction['otherPerson']) => {
    if (person.firstName || person.lastName) {
      return `${person.firstName || ''} ${person.lastName || ''}`.trim()
    }
    return person.email
  }

  const getStatusBadge = (status: Introduction['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ESTABLISHED':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const activeIntroductions = introductions.filter(intro => intro.status !== 'INACTIVE')
  const pendingCount = activeIntroductions.filter(intro => intro.status === 'PENDING').length
  const establishedCount = activeIntroductions.filter(intro => intro.status === 'ESTABLISHED').length

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

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              👥 People You've Met Through Clout
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Building your professional network - {activeIntroductions.length} connection{activeIntroductions.length !== 1 ? 's' : ''} made
            </p>
          </div>
          {(pendingCount > 0 || establishedCount > 0) && (
            <div className="flex gap-2">
              {pendingCount > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  {pendingCount} pending
                </span>
              )}
              {establishedCount > 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {establishedCount} connected
                </span>
              )}
            </div>
          )}
        </div>

        {activeIntroductions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No connections yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Clout will introduce you to relevant professionals in your network
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeIntroductions.map((intro) => (
              <div key={intro.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {intro.otherPerson.profileImage ? (
                        <img
                          src={intro.otherPerson.profileImage}
                          alt={getPersonName(intro.otherPerson)}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-medium">
                            {getPersonName(intro.otherPerson).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {getPersonName(intro.otherPerson)}
                        </h4>
                        {intro.otherPerson.bio && (
                          <p className="text-sm text-gray-600">{intro.otherPerson.bio}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Connected:</span> {new Date(intro.createdAt).toLocaleDateString()}
                      {intro.establishedAt && (
                        <span> • <span className="font-medium">Established:</span> {new Date(intro.establishedAt).toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Context:</span> {intro.context}
                    </div>

                    {intro.notes && intro.status === 'ESTABLISHED' && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="text-sm text-blue-900">
                          <span className="font-medium">Your notes:</span> {intro.notes}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(intro.status)}`}>
                        {intro.status === 'PENDING' ? 'Pending' : 'Connected'}
                      </span>

                      {intro.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleEstablishConnection(intro)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                          >
                            Add to Trusted Network
                          </button>
                          <button
                            onClick={() => handleDeclineConnection(intro)}
                            className="px-3 py-1 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors"
                          >
                            Not interested
                          </button>
                        </>
                      )}

                      {intro.status === 'ESTABLISHED' && (
                        <button
                          onClick={() => handleUpdateNotes(intro)}
                          className="px-3 py-1 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
                        >
                          {intro.notes ? 'Update Notes' : 'Add Notes'}
                        </button>
                      )}
                    </div>
                  </div>

                  {intro.otherPerson.linkedinUrl && (
                    <a
                      href={intro.otherPerson.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zM7.5 14.5h-2v-7h2v7zm-1-8a1 1 0 110-2 1 1 0 010 2zm8.5 8h-2v-3.5c0-1.5-.5-2-1.5-2s-1.5.5-1.5 2v3.5h-2v-7h2v1c.5-1 1.5-1.5 2.5-1.5 2 0 2.5 1.5 2.5 3.5v4z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for establishing connection or updating notes */}
      {showModal && selectedIntro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {modalMode === 'establish'
                ? `Add ${getPersonName(selectedIntro.otherPerson)} to Trusted Network`
                : `Update notes for ${getPersonName(selectedIntro.otherPerson)}`
              }
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {modalMode === 'establish'
                  ? 'How has this connection been valuable? (optional)'
                  : 'Your notes about this connection'
                }
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder={modalMode === 'establish'
                  ? "e.g., 'We're now collaborating on X project'"
                  : 'Add any notes about this connection...'
                }
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedIntro(null)
                  setNotes('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : modalMode === 'establish' ? 'Add to Trusted Network' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}