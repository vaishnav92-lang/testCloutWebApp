'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function Onboard() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token')
  const invitationId = searchParams.get('invitation')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    userIntent: 'ACTIVELY_LOOKING'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user) {
      // Fetch complete user data for editing
      fetchUserData()
    }
  }, [session, status, router])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const userData = await response.json()

      if (response.ok) {
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          location: userData.location || '',
          linkedinUrl: userData.linkedinUrl || '',
          userIntent: userData.userIntent || 'ACTIVELY_LOOKING'
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Fallback to session data
      setFormData(prev => ({
        ...prev,
        firstName: session?.user.firstName || '',
        lastName: session?.user.lastName || '',
      }))
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/user/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          inviteToken: inviteToken || undefined,
          invitationId: invitationId || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Update the session to reflect profile completion
        await update()
        setMessage('Profile completed successfully!')
        setTimeout(() => router.push('/dashboard'), 1500)
      } else {
        setMessage(data.error || 'Something went wrong')
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again.')
    }

    setIsLoading(false)
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {session?.user?.isProfileComplete ? 'Edit Your Profile' : 'Complete Your Profile'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {session?.user?.isProfileComplete
                ? 'Update your information to keep your profile current'
                : 'Help us personalize your Clout Careers experience'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g., San Francisco, CA"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                LinkedIn URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What best describes your intentions? *
              </label>
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="recommend-only"
                    name="userIntent"
                    type="radio"
                    value="RECOMMEND_ONLY"
                    checked={formData.userIntent === 'RECOMMEND_ONLY'}
                    onChange={(e) => setFormData(prev => ({ ...prev, userIntent: e.target.value }))}
                    className="mt-1 mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div>
                    <label htmlFor="recommend-only" className="text-sm font-medium text-gray-900 cursor-pointer">
                      I'm here only to recommend great talent
                    </label>
                    <p className="text-xs text-gray-500">Connect talented people with opportunities</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    id="hybrid"
                    name="userIntent"
                    type="radio"
                    value="HYBRID"
                    checked={formData.userIntent === 'HYBRID'}
                    onChange={(e) => setFormData(prev => ({ ...prev, userIntent: e.target.value }))}
                    className="mt-1 mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div>
                    <label htmlFor="hybrid" className="text-sm font-medium text-gray-900 cursor-pointer">
                      I'm here primarily to recommend talent and opportunistically consider roles for myself
                    </label>
                    <p className="text-xs text-gray-500">Refer others while staying open to new opportunities</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    id="actively-looking"
                    name="userIntent"
                    type="radio"
                    value="ACTIVELY_LOOKING"
                    checked={formData.userIntent === 'ACTIVELY_LOOKING'}
                    onChange={(e) => setFormData(prev => ({ ...prev, userIntent: e.target.value }))}
                    className="mt-1 mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div>
                    <label htmlFor="actively-looking" className="text-sm font-medium text-gray-900 cursor-pointer">
                      I'm actively looking for new opportunities
                    </label>
                    <p className="text-xs text-gray-500">Seeking my next role and open to applications</p>
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <div className={`text-center text-sm ${
                message.includes('successfully') ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
{isLoading ? 'Saving...' : (session?.user?.isProfileComplete ? 'Update Profile' : 'Complete Profile')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}