/**
 * TRUSTED CONTACTS SIDEBAR COMPONENT
 *
 * Displays draggable cards of trusted network contacts for job referrals.
 * Used in the drag-and-drop job referral interface.
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

interface TrustedContactsSidebarProps {
  onContactDragStart: (contact: TrustedContact) => void
  onContactDragEnd: () => void
  className?: string
}

export default function TrustedContactsSidebar({
  onContactDragStart,
  onContactDragEnd,
  className = ''
}: TrustedContactsSidebarProps) {
  const [contacts, setContacts] = useState<TrustedContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTrustedContacts()
  }, [])

  const fetchTrustedContacts = async () => {
    try {
      const response = await fetch('/api/user/relationships')
      if (response.ok) {
        const data = await response.json()
        // Get confirmed relationships
        const trustedContacts = data.connections
          .filter((conn: any) => conn.status === 'CONFIRMED')
          .map((conn: any) => conn.connectedUser)
        setContacts(trustedContacts)
      } else {
        setError('Failed to load trusted contacts')
      }
    } catch (error) {
      console.error('Error fetching trusted contacts:', error)
      setError('Failed to load trusted contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, contact: TrustedContact) => {
    e.dataTransfer.setData('application/json', JSON.stringify(contact))
    e.dataTransfer.effectAllowed = 'copy'
    onContactDragStart(contact)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    onContactDragEnd()
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trusted Network</h3>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trusted Network</h3>
          <div className="text-center py-6">
            <div className="text-red-600 text-sm">{error}</div>
            <button
              onClick={fetchTrustedContacts}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sticky top-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Trusted Network
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({contacts.length})
          </span>
        </h3>

        {contacts.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-gray-500 text-sm">No trusted contacts yet</div>
            <div className="text-xs text-gray-400 mt-1">
              Build your network first
            </div>
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-500 mb-4 p-2 bg-blue-50 rounded border border-blue-200">
              💡 Drag contacts to jobs to refer them
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, contact)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 active:scale-95"
                >
                  <div className="flex-shrink-0">
                    {contact.profileImage ? (
                      <img
                        src={contact.profileImage}
                        alt={`${contact.firstName || ''} ${contact.lastName || ''}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {(contact.firstName?.[0] || contact.email[0]).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {contact.firstName && contact.lastName
                        ? `${contact.firstName} ${contact.lastName}`
                        : contact.email}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {contact.email}
                    </div>
                    {contact.bio && (
                      <div className="text-xs text-gray-400 truncate mt-1">
                        {contact.bio}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}