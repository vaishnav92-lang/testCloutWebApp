'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import EndorsementForm from '@/components/EndorsementForm'
import EndorsementNotifications from '@/components/EndorsementNotifications'
import NetworkConnectionsCard from '@/components/NetworkConnectionsCard'
import CloutJourneyCard from '@/components/CloutJourneyCard'
import PendingNetworkRequests from '@/components/PendingNetworkRequests'
import TrustNetworkManager from '@/components/TrustNetworkManager'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [validationSuccess, setValidationSuccess] = useState(false)
  const [endorsements, setEndorsements] = useState([])
  const [endorsementsLoading, setEndorsementsLoading] = useState(true)
  const [endorsementFormOpen, setEndorsementFormOpen] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEndorsements()
    }
  }, [status])

  const fetchEndorsements = async () => {
    setEndorsementsLoading(true)
    try {
      const response = await fetch('/api/user/endorsements')
      if (response.ok) {
        const data = await response.json()
        setEndorsements(data)
      }
    } catch (error) {
      console.error('Error fetching endorsements:', error)
    } finally {
      setEndorsementsLoading(false)
    }
  }

  return (
    <>
      {validationSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          {/* ... validation success UI ... */}
        </div>
      )}

      <div className="mb-8"><CloutJourneyCard /></div>
      <div className="mb-8"><TrustNetworkManager onRefresh={() => {}} /></div>
      <EndorsementNotifications className="mb-8" />
      <div className="mb-8"><PendingNetworkRequests /></div>
      <div className="mb-8">
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0"><div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center"><svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div></div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Help the Best People You've Worked With</h3>
              <p className="text-gray-700 mb-4">Write an endorsement for someone exceptional you've worked with. They'll choose how to use it.</p>
              <button onClick={() => setEndorsementFormOpen(true)} className="inline-flex items-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Write an Endorsement
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-8"><NetworkConnectionsCard /></div>
      <div className="border-t border-gray-200 pt-6 mb-8">
        <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-gray-900">People You've Endorsed</h2><span className="text-sm text-gray-500">{endorsements.length} endorsements given</span></div>
        {endorsementsLoading ? (
          <div className="text-center py-8"><div className="text-gray-500">Loading endorsements...</div></div>
        ) : endorsements.length === 0 ? (
          <div className="text-center py-8"><div className="text-gray-500">No endorsements written yet.</div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {endorsements.map((endorsement) => (
              <div key={endorsement.id} className="bg-white border border-gray-200 rounded-lg p-4">
                {/* ... endorsement card UI ... */}
              </div>
            ))}
          </div>
        )}
      </div>

      <EndorsementForm
        isOpen={endorsementFormOpen}
        onClose={() => setEndorsementFormOpen(false)}
        onSuccess={fetchEndorsements}
        userInfo={{ firstName: session?.user?.firstName || '', lastName: session?.user?.lastName || '', email: session?.user?.email || '' }}
      />
    </>
  )
}