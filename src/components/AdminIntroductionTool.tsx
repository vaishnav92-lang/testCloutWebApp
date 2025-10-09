/**
 * ADMIN INTRODUCTION TOOL COMPONENT
 *
 * Allows admins/hiring managers to create introductions between users.
 * For testing purposes, hiring managers can use this feature.
 */

'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

export default function AdminIntroductionTool() {
  const [users, setUsers] = useState<User[]>([])
  const [personAId, setPersonAId] = useState('')
  const [personBId, setPersonBId] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [searchA, setSearchA] = useState('')
  const [searchB, setSearchB] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!personAId || !personBId || !context.trim()) {
      setMessage({
        type: 'error',
        text: 'Please select two users and provide context'
      })
      return
    }

    if (personAId === personBId) {
      setMessage({
        type: 'error',
        text: 'Cannot introduce someone to themselves'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/introductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personAId,
          personBId,
          context
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Introduction created successfully!'
        })
        // Reset form
        setPersonAId('')
        setPersonBId('')
        setContext('')
        setSearchA('')
        setSearchB('')
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to create introduction'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while creating the introduction'
      })
    } finally {
      setLoading(false)
    }
  }

  const getUserName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim()
    }
    return user.email
  }

  const filteredUsersA = users.filter(user =>
    getUserName(user).toLowerCase().includes(searchA.toLowerCase()) ||
    user.email.toLowerCase().includes(searchA.toLowerCase())
  )

  const filteredUsersB = users.filter(user =>
    getUserName(user).toLowerCase().includes(searchB.toLowerCase()) ||
    user.email.toLowerCase().includes(searchB.toLowerCase())
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Create Introduction</h3>
        <p className="text-sm text-gray-600 mt-1">
          Introduce two members to help them build valuable connections
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Person A Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Person
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchA}
              onChange={(e) => setSearchA(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <select
              value={personAId}
              onChange={(e) => setPersonAId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={5}
              required
            >
              <option value="">Select a person...</option>
              {filteredUsersA.slice(0, 10).map(user => (
                <option key={user.id} value={user.id}>
                  {getUserName(user)} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Person B Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Second Person
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchB}
              onChange={(e) => setSearchB(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <select
              value={personBId}
              onChange={(e) => setPersonBId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={5}
              required
            >
              <option value="">Select a person...</option>
              {filteredUsersB.slice(0, 10).map(user => (
                <option key={user.id} value={user.id} disabled={user.id === personAId}>
                  {getUserName(user)} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Context Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Context for Introduction
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="e.g., Both building in edtech space, share interest in AI/ML applications..."
            required
          />
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating Introduction...' : 'Create Introduction'}
        </button>
      </form>
    </div>
  )
}