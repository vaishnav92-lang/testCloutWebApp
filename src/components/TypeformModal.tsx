/**
 * TYPEFORM MODAL COMPONENT
 *
 * This component displays the endorsement Typeform in a modal overlay.
 * It provides a clean, embedded experience for writing endorsements.
 *
 * Features:
 * - Full-screen modal on mobile, centered on desktop
 * - Embedded iframe with the endorsement Typeform
 * - Close button to dismiss modal
 * - Responsive design (800px width on desktop)
 * - Dark overlay background
 */

'use client'

import { useEffect } from 'react'

interface TypeformModalProps {
  isOpen: boolean
  onClose: () => void
  typeformUrl: string
  userInfo: {
    firstName?: string
    lastName?: string
    email: string
  }
}

export default function TypeformModal({ isOpen, onClose, typeformUrl, userInfo }: TypeformModalProps) {
  // Build pre-filled URL with user information
  const getPrefilledUrl = () => {
    const url = new URL(typeformUrl)

    // Add endorser email as hidden parameter for webhook identification
    if (userInfo.email) {
      url.searchParams.set('endorser_email', userInfo.email)
    }

    return url.toString()
  }
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Write an Endorsement</h2>
            <p className="text-sm text-gray-600 mt-1">
              Help someone exceptional by sharing your experience working with them
            </p>
          </div>

          {/* Typeform iframe */}
          <div className="h-[600px]">
            <iframe
              src={getPrefilledUrl()}
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 'none' }}
              title="Write Endorsement Form"
            />
          </div>
        </div>
      </div>
    </div>
  )
}