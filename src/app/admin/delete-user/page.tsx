'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function DeleteUserPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Admin check (update with your email)
  const ADMIN_EMAILS = ['vaishnav@cloutcareers.com']
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email)

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2">You must be an admin to access this page.</p>
      </div>
    )
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        setEmail('')
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Admin: Delete User</h1>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Warning:</strong> This will permanently delete the user and ALL their related data including:
        </p>
        <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
          <li>All relationships</li>
          <li>All endorsements (given and received)</li>
          <li>All introductions</li>
          <li>All invitations</li>
          <li>All jobs they created</li>
          <li>All authentication data</li>
        </ul>
      </div>

      <form onSubmit={handleDelete} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            User Email to Delete
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="regan.arntz.gray@gmail.com"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Delete User Permanently'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-4 rounded-md ${
          message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-8 pt-8 border-t">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}