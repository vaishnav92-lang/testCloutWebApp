'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function OnboardContent() {
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
    userIntent: ['ACTIVELY_LOOKING'] // Changed to array for multiple selections
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
          userIntent: Array.isArray(userData.userIntent) ? userData.userIntent : (userData.userIntent ? [userData.userIntent] : ['ACTIVELY_LOOKING'])
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
              <select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select your location</option>

                {/* Major US Cities */}
                <optgroup label="United States">
                  <option value="New York, NY">New York, NY</option>
                  <option value="Los Angeles, CA">Los Angeles, CA</option>
                  <option value="Chicago, IL">Chicago, IL</option>
                  <option value="Houston, TX">Houston, TX</option>
                  <option value="Phoenix, AZ">Phoenix, AZ</option>
                  <option value="Philadelphia, PA">Philadelphia, PA</option>
                  <option value="San Antonio, TX">San Antonio, TX</option>
                  <option value="San Diego, CA">San Diego, CA</option>
                  <option value="Dallas, TX">Dallas, TX</option>
                  <option value="San Jose, CA">San Jose, CA</option>
                  <option value="Austin, TX">Austin, TX</option>
                  <option value="Jacksonville, FL">Jacksonville, FL</option>
                  <option value="Fort Worth, TX">Fort Worth, TX</option>
                  <option value="Columbus, OH">Columbus, OH</option>
                  <option value="San Francisco, CA">San Francisco, CA</option>
                  <option value="Charlotte, NC">Charlotte, NC</option>
                  <option value="Indianapolis, IN">Indianapolis, IN</option>
                  <option value="Seattle, WA">Seattle, WA</option>
                  <option value="Denver, CO">Denver, CO</option>
                  <option value="Washington, DC">Washington, DC</option>
                  <option value="Boston, MA">Boston, MA</option>
                  <option value="El Paso, TX">El Paso, TX</option>
                  <option value="Detroit, MI">Detroit, MI</option>
                  <option value="Nashville, TN">Nashville, TN</option>
                  <option value="Portland, OR">Portland, OR</option>
                  <option value="Memphis, TN">Memphis, TN</option>
                  <option value="Oklahoma City, OK">Oklahoma City, OK</option>
                  <option value="Las Vegas, NV">Las Vegas, NV</option>
                  <option value="Louisville, KY">Louisville, KY</option>
                  <option value="Baltimore, MD">Baltimore, MD</option>
                  <option value="Milwaukee, WI">Milwaukee, WI</option>
                  <option value="Albuquerque, NM">Albuquerque, NM</option>
                  <option value="Tucson, AZ">Tucson, AZ</option>
                  <option value="Fresno, CA">Fresno, CA</option>
                  <option value="Mesa, AZ">Mesa, AZ</option>
                  <option value="Sacramento, CA">Sacramento, CA</option>
                  <option value="Atlanta, GA">Atlanta, GA</option>
                  <option value="Kansas City, MO">Kansas City, MO</option>
                  <option value="Colorado Springs, CO">Colorado Springs, CO</option>
                  <option value="Miami, FL">Miami, FL</option>
                  <option value="Raleigh, NC">Raleigh, NC</option>
                  <option value="Omaha, NE">Omaha, NE</option>
                  <option value="Long Beach, CA">Long Beach, CA</option>
                  <option value="Virginia Beach, VA">Virginia Beach, VA</option>
                  <option value="Oakland, CA">Oakland, CA</option>
                  <option value="Minneapolis, MN">Minneapolis, MN</option>
                  <option value="Tulsa, OK">Tulsa, OK</option>
                  <option value="Arlington, TX">Arlington, TX</option>
                  <option value="Tampa, FL">Tampa, FL</option>
                </optgroup>

                {/* Major International Cities */}
                <optgroup label="International">
                  <option value="London, UK">London, UK</option>
                  <option value="Toronto, Canada">Toronto, Canada</option>
                  <option value="Vancouver, Canada">Vancouver, Canada</option>
                  <option value="Montreal, Canada">Montreal, Canada</option>
                  <option value="Berlin, Germany">Berlin, Germany</option>
                  <option value="Munich, Germany">Munich, Germany</option>
                  <option value="Amsterdam, Netherlands">Amsterdam, Netherlands</option>
                  <option value="Paris, France">Paris, France</option>
                  <option value="Madrid, Spain">Madrid, Spain</option>
                  <option value="Barcelona, Spain">Barcelona, Spain</option>
                  <option value="Rome, Italy">Rome, Italy</option>
                  <option value="Milan, Italy">Milan, Italy</option>
                  <option value="Zurich, Switzerland">Zurich, Switzerland</option>
                  <option value="Stockholm, Sweden">Stockholm, Sweden</option>
                  <option value="Copenhagen, Denmark">Copenhagen, Denmark</option>
                  <option value="Oslo, Norway">Oslo, Norway</option>
                  <option value="Helsinki, Finland">Helsinki, Finland</option>
                  <option value="Dublin, Ireland">Dublin, Ireland</option>
                  <option value="Edinburgh, UK">Edinburgh, UK</option>
                  <option value="Manchester, UK">Manchester, UK</option>
                  <option value="Birmingham, UK">Birmingham, UK</option>
                  <option value="Tel Aviv, Israel">Tel Aviv, Israel</option>
                  <option value="Sydney, Australia">Sydney, Australia</option>
                  <option value="Melbourne, Australia">Melbourne, Australia</option>
                  <option value="Brisbane, Australia">Brisbane, Australia</option>
                  <option value="Auckland, New Zealand">Auckland, New Zealand</option>
                  <option value="Tokyo, Japan">Tokyo, Japan</option>
                  <option value="Osaka, Japan">Osaka, Japan</option>
                  <option value="Seoul, South Korea">Seoul, South Korea</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Hong Kong">Hong Kong</option>
                  <option value="Shanghai, China">Shanghai, China</option>
                  <option value="Beijing, China">Beijing, China</option>
                  <option value="Shenzhen, China">Shenzhen, China</option>
                  <option value="Bangalore, India">Bangalore, India</option>
                  <option value="Mumbai, India">Mumbai, India</option>
                  <option value="Delhi, India">Delhi, India</option>
                  <option value="Hyderabad, India">Hyderabad, India</option>
                  <option value="Chennai, India">Chennai, India</option>
                  <option value="Pune, India">Pune, India</option>
                  <option value="Dubai, UAE">Dubai, UAE</option>
                  <option value="Abu Dhabi, UAE">Abu Dhabi, UAE</option>
                  <option value="Riyadh, Saudi Arabia">Riyadh, Saudi Arabia</option>
                  <option value="São Paulo, Brazil">São Paulo, Brazil</option>
                  <option value="Rio de Janeiro, Brazil">Rio de Janeiro, Brazil</option>
                  <option value="Buenos Aires, Argentina">Buenos Aires, Argentina</option>
                  <option value="Mexico City, Mexico">Mexico City, Mexico</option>
                  <option value="Lagos, Nigeria">Lagos, Nigeria</option>
                  <option value="Cairo, Egypt">Cairo, Egypt</option>
                  <option value="Cape Town, South Africa">Cape Town, South Africa</option>
                  <option value="Johannesburg, South Africa">Johannesburg, South Africa</option>
                </optgroup>

                {/* Remote/Other Options */}
                <optgroup label="Other">
                  <option value="Remote">Remote</option>
                  <option value="Nomadic">Nomadic</option>
                  <option value="Other">Other</option>
                </optgroup>
              </select>
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
                What brings you to Clout? (Select all that apply) *
              </label>
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="hire-talent"
                    type="checkbox"
                    checked={formData.userIntent.includes('HIRE_TALENT')}
                    onChange={(e) => {
                      const value = 'HIRE_TALENT'
                      setFormData(prev => ({
                        ...prev,
                        userIntent: e.target.checked
                          ? [...prev.userIntent, value]
                          : prev.userIntent.filter(intent => intent !== value)
                      }))
                    }}
                    className="mt-1 mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor="hire-talent" className="text-sm font-medium text-gray-900 cursor-pointer">
                      I'm here to hire talent
                    </label>
                    <p className="text-xs text-gray-500">Looking to find and recruit great people for my team or company</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    id="refer-talent"
                    type="checkbox"
                    checked={formData.userIntent.includes('REFER_TALENT')}
                    onChange={(e) => {
                      const value = 'REFER_TALENT'
                      setFormData(prev => ({
                        ...prev,
                        userIntent: e.target.checked
                          ? [...prev.userIntent, value]
                          : prev.userIntent.filter(intent => intent !== value)
                      }))
                    }}
                    className="mt-1 mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor="refer-talent" className="text-sm font-medium text-gray-900 cursor-pointer">
                      I'm here to refer great talent
                    </label>
                    <p className="text-xs text-gray-500">Connect talented people with opportunities and earn referral rewards</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    id="connect-people"
                    type="checkbox"
                    checked={formData.userIntent.includes('CONNECT_PEOPLE')}
                    onChange={(e) => {
                      const value = 'CONNECT_PEOPLE'
                      setFormData(prev => ({
                        ...prev,
                        userIntent: e.target.checked
                          ? [...prev.userIntent, value]
                          : prev.userIntent.filter(intent => intent !== value)
                      }))
                    }}
                    className="mt-1 mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor="connect-people" className="text-sm font-medium text-gray-900 cursor-pointer">
                      I'm here to connect people with each other
                    </label>
                    <p className="text-xs text-gray-500">Make valuable introductions and build professional networks</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    id="meet-people"
                    type="checkbox"
                    checked={formData.userIntent.includes('MEET_PEOPLE')}
                    onChange={(e) => {
                      const value = 'MEET_PEOPLE'
                      setFormData(prev => ({
                        ...prev,
                        userIntent: e.target.checked
                          ? [...prev.userIntent, value]
                          : prev.userIntent.filter(intent => intent !== value)
                      }))
                    }}
                    className="mt-1 mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor="meet-people" className="text-sm font-medium text-gray-900 cursor-pointer">
                      I'm here to meet talented and interesting people
                    </label>
                    <p className="text-xs text-gray-500">Expand my network and connect with like-minded professionals</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    id="actively-looking"
                    type="checkbox"
                    checked={formData.userIntent.includes('ACTIVELY_LOOKING')}
                    onChange={(e) => {
                      const value = 'ACTIVELY_LOOKING'
                      setFormData(prev => ({
                        ...prev,
                        userIntent: e.target.checked
                          ? [...prev.userIntent, value]
                          : prev.userIntent.filter(intent => intent !== value)
                      }))
                    }}
                    className="mt-1 mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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

export default function Onboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <OnboardContent />
    </Suspense>
  )
}