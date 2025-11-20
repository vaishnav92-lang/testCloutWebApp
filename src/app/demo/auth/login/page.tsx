'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDemoLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/demo/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        // Store demo token in localStorage
        localStorage.setItem('demoToken', data.token)
        router.push('/demo/dashboard')
      }
    } catch (error) {
      console.error('Demo login failed:', error)
      alert('Failed to start demo session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Clout Careers Demo</h1>
        <p className="text-gray-600 mb-8">
          Explore the platform with pre-loaded demo data. No account needed, no data stored.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">Demo Features:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Browse job opportunities</li>
            <li>✓ Send and receive endorsements</li>
            <li>✓ Manage trust allocations</li>
            <li>✓ View network relationships</li>
            <li>✓ Track referrals</li>
            <li>✓ All data resets on logout</li>
          </ul>
        </div>

        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? 'Starting Demo...' : 'Start Demo Session'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your demo session data will not be saved or affect the main application.
        </p>
      </div>
    </div>
  )
}
